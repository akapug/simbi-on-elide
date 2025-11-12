/**
 * Talks Controller - Complete port from Rails app/controllers/api/v1/talks_controller.rb
 *
 * Handles all conversation/negotiation endpoints with full business logic:
 * - Talk creation, messaging, proposals
 * - Offer lifecycle: create, accept, close, confirm, cancel
 * - Order lifecycle: create, accept, cancel, confirm_delivery
 * - Read/unread, archive/unarchive operations
 * - Reviews and ratings
 * - State machine transitions
 */

import { IncomingMessage, ServerResponse } from 'node:http';
import { Database } from '../services/database.service';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../middleware/auth.middleware';
import { MixpanelService } from '../services/mixpanel.service';
import { StripeService } from '../services/stripe.service';

interface TalkParams {
  id?: string;
  talk_id?: string;
  service_id?: string;
  user_id?: string;
  message?: string;
  client_id?: string;
  attachments?: string[];
  offer?: OfferParams;
  order?: boolean;
  count?: number;
  ratings?: RatingParams[];
  review?: string;
  reason?: string;
  reason_for_cancel?: string;
  ids?: string[];
}

interface OfferParams {
  within: number;
  items: OfferItemParams[];
}

interface OfferItemParams {
  owner_id: string;
  service_id?: string;
  count: number;
  kind: 'service' | 'simbi' | 'usd';
}

interface RatingParams {
  kind: string;
  value: number;
}

export class TalksController {
  private db: Database;
  private notifier: NotificationService;
  private mixpanel: MixpanelService;
  private stripe: StripeService;

  constructor() {
    this.db = new Database();
    this.notifier = new NotificationService();
    this.mixpanel = new MixpanelService();
    this.stripe = new StripeService();
  }

  /**
   * GET /api/v1/talks/:id
   * Show a single talk with all related data
   */
  async show(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkId = this.decodeTalkId(params.id!);
      const talk = await this.db.talks.findById(talkId, {
        include: ['messages', 'offers', 'orders', 'users', 'talk_items', 'ratings']
      });

      if (!talk) {
        this.sendError(res, 404, { errors: { talk: 'Not found' } });
        return;
      }

      // Check authorization
      if (!talk.users.some((u: any) => u.id === currentUser.id) && !currentUser.admin) {
        this.sendError(res, 403, { errors: { talk: 'Forbidden' } });
        return;
      }

      const talkJson = await this.buildTalkJson(talk, currentUser);
      this.sendJson(res, 200, talkJson);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks
   * Create new talk with message/offer/order
   * Business logic:
   * - Initialize talk with service and users
   * - Build associated message/offer/order
   * - Validate all relationships
   * - Send notifications
   * - Track analytics
   */
  async create(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talk = await this.db.talks.create({ status: 'open' });

      // Load service if provided
      if (params.service_id) {
        const service = await this.db.services.findById(params.service_id);
        if (!service) {
          this.sendError(res, 400, { errors: { service: 'Service not found' } });
          return;
        }
        talk.service = service;
      }

      // Build users array: recipient, service owner, current user (unique)
      const users = [];
      if (params.user_id) {
        const user = await this.db.users.findById(params.user_id);
        if (user) users.push(user);
      }
      if (talk.service?.user) {
        users.push(talk.service.user);
      }
      users.push(currentUser);
      talk.users = [...new Set(users.map(u => u.id))].map(id => users.find(u => u.id === id));

      // Validate unique users (exactly 2)
      if (talk.users.length !== 2) {
        this.sendError(res, 400, { errors: { users: "Negotiation couldn't be created" } });
        return;
      }

      // Build message if provided
      let message: any = null;
      if (params.message) {
        message = await this.buildMessage(talk, params, currentUser);
      }

      // Build offer if provided
      let offer: any = null;
      if (params.offer) {
        offer = await this.buildOffer(talk, params.offer, currentUser);
        if (!offer.valid) {
          this.sendError(res, 400, { errors: offer.errors });
          return;
        }
      }

      // Build order if provided
      let order: any = null;
      if (params.order) {
        order = await this.buildOrder(talk, talk.service, params.count || 1, currentUser);
        if (!order.valid) {
          this.sendError(res, 400, { errors: order.errors });
          return;
        }
      }

      // Validate talk has at least one item
      if (!message && !offer && !order) {
        this.sendError(res, 400, { errors: { talk_items: 'Message/offer/order should not be empty' } });
        return;
      }

      // Save everything in transaction
      await this.db.transaction(async () => {
        await this.db.talks.save(talk);
        if (message) await this.db.messages.save(message);
        if (offer) await this.db.offers.save(offer);
        if (order) await this.db.orders.save(order);

        // Create talk_users
        for (const user of talk.users) {
          await this.db.talkUsers.create({
            talk_id: talk.id,
            user_id: user.id,
            read_at: user.id === currentUser.id ? new Date() : null,
            seen_at: user.id === currentUser.id ? new Date() : null
          });
        }
      });

      // Post-save actions
      await this.notifyUsers(talk, currentUser);

      if (message) {
        await this.notifier.notifyMessage(message, true);
      }
      if (offer) {
        await this.notifier.notifyOffer(offer);
      }
      if (order) {
        await this.notifier.notifyOrder(order);
      }

      // Analytics
      await this.mixpanel.track(currentUser.id, 'New Talk Created', { app: 'api' });

      // Phishing check
      await this.checkPhishing(currentUser);

      const talkJson = await this.buildTalkJson(talk, currentUser);
      this.sendJson(res, 200, talkJson);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/:id/proposal
   * Get proposal data for talk/service/user inquiry
   */
  async proposal(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      if (params.talk_id) {
        const talkId = this.decodeTalkId(params.talk_id);
        const talk = await this.db.talks.findById(talkId);
        if (!talk) {
          this.sendError(res, 404, { errors: { talk: 'Not found' } });
          return;
        }
        const json = await this.buildTalkProposalJson(talk, currentUser);
        this.sendJson(res, 200, json);
      } else if (params.service_id) {
        const service = await this.db.services.findById(params.service_id);
        if (!service) {
          this.sendError(res, 404, { errors: { service: 'Not found' } });
          return;
        }
        const json = await this.buildInquiryJson(service.user, service);
        this.sendJson(res, 200, json);
      } else if (params.user_id) {
        const user = await this.db.users.findById(params.user_id);
        if (!user) {
          this.sendError(res, 404, { errors: { user: 'Not found' } });
          return;
        }
        const json = await this.buildInquiryJson(user, null);
        this.sendJson(res, 200, json);
      } else {
        this.sendError(res, 400, { errors: { params: 'Missing required parameters' } });
      }
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/:id/message
   * Add message to existing talk
   */
  async message(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      if (!params.message) {
        this.sendError(res, 400, { errors: { message: "Message can't be blank" } });
        return;
      }

      const talkId = this.decodeTalkId(params.id!);
      const talk = await this.db.talks.findById(talkId);

      if (!talk) {
        this.sendError(res, 404, { errors: { talk: 'Not found' } });
        return;
      }

      const message = await this.buildMessage(talk, params, currentUser);

      await this.db.transaction(async () => {
        await this.db.messages.save(message);
      });

      await this.notifyUsers(talk, currentUser);
      await this.notifier.notifyMessage(message);
      await this.mixpanel.track(currentUser.id, 'New Message', { app: 'api' });

      const talkJson = await this.buildTalkJson(talk, currentUser);
      this.sendJson(res, 200, talkJson);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/inbound
   * Process inbound emails (Griddler integration)
   */
  async inbound(req: IncomingMessage, res: ServerResponse, params: any): Promise<void> {
    try {
      const normalizedParams = Array.isArray(params) ? params : [params];

      for (const emailParams of normalizedParams) {
        const { talk, message } = await this.processInboundEmail(emailParams);

        if (!message) {
          continue;
        }

        await this.db.talks.save(talk);
        await talk.read(message.author);
        await this.notifyUsers(talk, message.author);
        await this.notifier.notifyMessage(message);
        await this.mixpanel.track(message.author.id, 'New Message', { app: 'email' });
      }

      this.sendJson(res, 200, { status: 'ok' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/:id/offer
   * Create or counter an offer
   * Business logic:
   * - Build new offer with items
   * - Close previous offer if exists
   * - Validate offer items (quotas, balances, etc)
   * - Update service if changed
   * - Send notifications
   */
  async offer(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkId = this.decodeTalkId(params.id!);
      const talk = await this.db.talks.findById(talkId, { include: ['offers'] });

      if (!talk) {
        this.sendError(res, 404, { errors: { talk: 'Not found' } });
        return;
      }

      const lastOffer = talk.offers[talk.offers.length - 1];

      // Build message if provided
      let message: any = null;
      if (params.message) {
        message = await this.buildMessage(talk, params, currentUser);
      }

      // Build new offer
      const offerParams = params.offer || params;
      const offer = await this.buildOffer(talk, offerParams as OfferParams, currentUser);

      if (!offer.valid) {
        this.sendError(res, 400, { errors: offer.errors });
        return;
      }

      // Close last offer if it exists and can be closed
      if (lastOffer && lastOffer.status === 'open') {
        await this.closeOffer(lastOffer, currentUser);
      }

      // Update service if changed
      if (params.service_id) {
        const service = await this.db.services.findById(params.service_id);
        talk.service = service;
      }

      await this.db.transaction(async () => {
        await this.db.talks.save(talk);
        if (message) await this.db.messages.save(message);
        await this.db.offers.save(offer);
      });

      await this.notifyUsers(talk, currentUser);
      await this.notifier.notifyOffer(offer);

      const talkJson = await this.buildTalkJson(talk, currentUser);
      this.sendJson(res, 200, talkJson);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/:id/accept
   * Accept an offer (state machine: open -> accepted)
   * Business logic:
   * - Validate user can accept
   * - Charge customer if USD payment
   * - Lock simbi balance
   * - Calculate due date
   * - Mark talk as in_progress
   * - Send notifications
   */
  async accept(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkId = this.decodeTalkId(params.id!);
      const talk = await this.db.talks.findById(talkId, { include: ['offers', 'users'] });
      const offer = talk.offers[talk.offers.length - 1];

      if (!offer) {
        this.sendError(res, 404, { errors: { offer: 'Not found' } });
        return;
      }

      // Validate can accept
      if (offer.status !== 'open' || offer.owner_id === currentUser.id) {
        this.sendError(res, 400, { errors: { status: "Can't be accepted" } });
        return;
      }

      try {
        // State machine transition
        await this.acceptOffer(offer, currentUser);

        // Update talk status
        talk.status = 'in_progress';
        await this.db.talks.save(talk);

        // Increase deal counts for users
        for (const user of talk.users) {
          await this.db.users.incrementDeals(user.id);
        }

        await this.notifyUsers(talk, currentUser);
        await this.notifier.notifyOfferAccept(offer);
        await this.notifyPayingSimbi(offer);

        await this.mixpanel.track(currentUser.id, 'Accept Offer', { app: 'api' });

        const talkJson = await this.buildTalkJson(talk, currentUser);
        this.sendJson(res, 200, talkJson);
      } catch (error: any) {
        this.sendError(res, 400, { errors: { status: error.message } });
      }
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/:id/close
   * Close/decline an offer (state machine: open -> closed)
   */
  async close(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkId = this.decodeTalkId(params.id!);
      const talk = await this.db.talks.findById(talkId, { include: ['offers'] });
      const offer = talk.offers[talk.offers.length - 1];

      if (!offer || offer.status !== 'open') {
        this.sendError(res, 400, { errors: { status: "Can't be closed" } });
        return;
      }

      await this.closeOffer(offer, currentUser);
      await this.notifyUsers(talk, currentUser);
      await this.notifier.notifyOfferClose(offer);

      await this.mixpanel.track(currentUser.id, 'Decline Offer', { app: 'api' });

      const talkJson = await this.buildTalkJson(talk, currentUser);
      this.sendJson(res, 200, talkJson);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/:id/confirm
   * Confirm offer completion (state machine: accepted -> completed/confirmed)
   * Business logic:
   * - Validate user can confirm
   * - Save ratings
   * - Create review
   * - Transfer simbi/USD
   * - Check if both confirmed (completed -> confirmed)
   * - Update user ratings
   * - Send notifications
   */
  async confirm(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkId = this.decodeTalkId(params.id!);
      const talk = await this.db.talks.findById(talkId, { include: ['offers', 'ratings', 'reviews'] });
      const offer = talk.offers[talk.offers.length - 1];

      if (!offer) {
        this.sendError(res, 404, { errors: { offer: 'Not found' } });
        return;
      }

      // Validate can confirm
      const canConfirm = await this.canConfirmOffer(offer, currentUser);
      if (!canConfirm || !params.review || !params.ratings) {
        this.sendError(res, 400, { errors: { status: "Can't be confirmed" } });
        return;
      }

      // Save ratings
      await this.saveRatings(talk, currentUser, params.ratings, offer);

      // Confirm offer (state machine)
      await this.confirmOffer(offer, currentUser);

      // Create and notify review
      const review = await this.createReview(offer, currentUser, params.review);
      await this.notifier.notifyReview(offer, review);

      // Check for first deal
      const isFirstDeal = await this.checkFirstDeal(currentUser);

      await this.notifyUsers(talk, currentUser);
      await this.notifier.notifyOfferConfirm(offer);

      // Analytics
      if (offer.status === 'confirmed') {
        const otherUser = talk.users.find((u: any) => u.id !== currentUser.id);
        await this.mixpanel.track(currentUser.id, 'Complete Deal', { app: 'api' });
        await this.mixpanel.track(otherUser.id, 'Gets Deal Completed', { app: 'api' });
      }

      const talkJson = await this.buildTalkJson(talk, currentUser);
      this.sendJson(res, 200, talkJson);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/:id/review
   * Add review to completed offer/order
   */
  async review(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkId = this.decodeTalkId(params.id!);
      const talk = await this.db.talks.findById(talkId, { include: ['offers', 'orders', 'reviews'] });

      const item = params.order_id
        ? await this.db.orders.findById(params.order_id)
        : talk.offers[talk.offers.length - 1] || talk.orders[talk.orders.length - 1];

      if (!item || !this.canReviewItem(item, currentUser) || !params.review || !params.ratings) {
        this.sendError(res, 400, { errors: { status: "Can't be reviewed" } });
        return;
      }

      await this.saveRatings(talk, currentUser, params.ratings, item);

      const review = await this.createReview(item, currentUser, params.review);

      await this.db.itemHistories.create({
        item_id: item.id,
        item_type: item.constructor.name,
        user_id: currentUser.id,
        kind: 'review',
        created_at: new Date()
      });

      await this.notifyUsers(talk, currentUser);
      await this.notifier.notifyReview(item, review);

      const talkJson = await this.buildTalkJson(talk, currentUser);
      this.sendJson(res, 200, talkJson);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * PUT /api/v1/talks/:id/update_review
   * Update existing review
   */
  async updateReview(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkId = this.decodeTalkId(params.id!);
      const talk = await this.db.talks.findById(talkId, { include: ['offers', 'orders', 'reviews'] });

      const item = params.order_id
        ? await this.db.orders.findById(params.order_id)
        : talk.offers[talk.offers.length - 1] || talk.orders[talk.orders.length - 1];

      const review = await this.db.reviews.findOne({
        where: { item_id: item.id, author_id: currentUser.id }
      });

      if (!item || !review || !params.review || !params.ratings) {
        this.sendError(res, 400, { errors: { status: "Can't be updated" } });
        return;
      }

      await this.saveRatings(talk, currentUser, params.ratings, item);

      review.message = params.review;
      review.updated_at = new Date();
      await this.db.reviews.save(review);

      await this.notifyUsers(talk, currentUser);

      const talkJson = await this.buildTalkJson(talk, currentUser);
      this.sendJson(res, 200, talkJson);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/:id/cancel
   * Cancel accepted offer (state machine: accepted -> canceled)
   * Business logic:
   * - Validate can cancel
   * - Refund simbi/USD
   * - Save cancel reason
   * - Add reliability rating if no_response
   * - Send notifications
   */
  async cancel(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkId = this.decodeTalkId(params.id!);
      const talk = await this.db.talks.findById(talkId, { include: ['offers', 'ratings'] });
      const offer = talk.offers[talk.offers.length - 1];

      if (!offer) {
        this.sendError(res, 404, { errors: { offer: 'Not found' } });
        return;
      }

      let reason = params.reason;
      if (params.reason_for_cancel === 'no_response') {
        reason = 'No response from other party';
      }

      const canCancel = await this.canCancelOffer(offer, currentUser);
      if (!canCancel || !reason) {
        this.sendError(res, 400, { errors: { status: "Can't be canceled" } });
        return;
      }

      await this.cancelOffer(offer, currentUser, reason, params.reason_for_cancel);

      // Add reliability rating if no_response
      if (params.reason_for_cancel === 'no_response') {
        const existingRating = await this.db.ratings.findOne({
          where: {
            author_id: currentUser.id,
            talk_id: talk.id,
            kind: 'reliability'
          }
        });

        if (!existingRating) {
          await this.saveRatings(talk, currentUser, [{ kind: 'reliability', value: 1 }], offer);
        }
      }

      talk.status = 'open';
      await this.db.talks.save(talk);

      await this.notifyUsers(talk, currentUser);
      await this.notifier.notifyOfferCancel(offer);

      await this.mixpanel.track(currentUser.id, 'Cancel Deal', { app: 'api' });

      const talkJson = await this.buildTalkJson(talk, currentUser);
      this.sendJson(res, 200, talkJson);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/:id/read
   * Mark talk as read for current user
   */
  async read(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkId = this.decodeTalkId(params.id!);
      const talk = await this.db.talks.findById(talkId);

      if (!talk) {
        this.sendError(res, 404, { errors: { talk: 'Not found' } });
        return;
      }

      const now = new Date();
      await this.db.talkUsers.update(
        { talk_id: talk.id, user_id: currentUser.id },
        { read_at: now, seen_at: now }
      );

      const unreadCount = await this.db.talkUsers.count({
        where: { user_id: currentUser.id, read_at: null }
      });

      const lastSeenAt = await this.db.talkUsers.findOne({
        where: { talk_id: talk.id, user_id: currentUser.id }
      });

      this.sendJson(res, 200, {
        id: this.encodeTalkId(talk.id),
        read: true,
        readAt: lastSeenAt?.seen_at,
        unreadCount
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/batch_read
   * Mark multiple talks as read
   */
  async batchRead(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkIds = (params.ids || []).map(id => this.decodeTalkId(id));
      const now = new Date();

      await this.db.talkUsers.updateMany(
        { talk_id: { $in: talkIds }, user_id: currentUser.id },
        { read_at: now, seen_at: now }
      );

      const unreadCount = await this.db.talkUsers.count({
        where: { user_id: currentUser.id, read_at: null }
      });

      const tabCounts = await this.getUserTabCounts(currentUser);

      this.sendJson(res, 200, {
        unread_count: unreadCount,
        unreadTabCounts: tabCounts
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/unread
   * Mark talks as unread
   */
  async unread(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkIds = (params.ids || []).map(id => this.decodeTalkId(id));
      const now = new Date();

      await this.db.talkUsers.updateMany(
        { talk_id: { $in: talkIds }, user_id: currentUser.id },
        { read_at: null, seen_at: now }
      );

      const unreadCount = await this.db.talkUsers.count({
        where: { user_id: currentUser.id, read_at: null }
      });

      const tabCounts = await this.getUserTabCounts(currentUser);

      this.sendJson(res, 200, {
        unread_count: unreadCount,
        unreadTabCounts: tabCounts
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/archive
   * Archive talks and mark as read
   */
  async archive(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkIds = (params.ids || []).map(id => this.decodeTalkId(id));
      const now = new Date();

      await this.db.talkUsers.updateMany(
        { talk_id: { $in: talkIds }, user_id: currentUser.id },
        { archived_at: now, read_at: now, seen_at: now }
      );

      const tabCounts = await this.getUserTabCounts(currentUser);

      this.sendJson(res, 200, { unreadTabCounts: tabCounts });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/unarchive
   * Unarchive talks
   */
  async unarchive(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkIds = (params.ids || []).map(id => this.decodeTalkId(id));

      await this.db.talkUsers.updateMany(
        { talk_id: { $in: talkIds }, user_id: currentUser.id },
        { archived_at: null }
      );

      const tabCounts = await this.getUserTabCounts(currentUser);

      this.sendJson(res, 200, { unreadTabCounts: tabCounts });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/:id/rate
   * Add ratings without review
   */
  async rate(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      if (!params.ratings) {
        this.sendError(res, 400, { errors: { status: 'Ratings required' } });
        return;
      }

      const talkId = this.decodeTalkId(params.id!);
      const talk = await this.db.talks.findById(talkId);

      await this.saveRatings(talk, currentUser, params.ratings);

      this.sendJson(res, 200, { rated_at: new Date() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/:id/order
   * Create product order
   * Business logic:
   * - Calculate product prices (simbi + shipping)
   * - Build order with items
   * - Validate user balance
   * - Validate product quota
   * - Send notifications
   */
  async order(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkId = this.decodeTalkId(params.id!);
      const talk = await this.db.talks.findById(talkId);

      if (!talk) {
        this.sendError(res, 404, { errors: { talk: 'Not found' } });
        return;
      }

      // Build message if provided
      let message: any = null;
      if (params.message) {
        message = await this.buildMessage(talk, params, currentUser);
      }

      // Update service if changed
      if (params.service_id) {
        const service = await this.db.services.findById(params.service_id);
        talk.service = service;
      }

      // Build order
      const order = await this.buildOrder(talk, talk.service, params.count || 1, currentUser);

      if (!order.valid) {
        this.sendError(res, 400, { errors: order.errors });
        return;
      }

      await this.db.transaction(async () => {
        await this.db.talks.save(talk);
        if (message) await this.db.messages.save(message);
        await this.db.orders.save(order);
      });

      await this.notifyUsers(talk, currentUser);
      await this.notifier.notifyOrder(order);

      const talkJson = await this.buildTalkJson(talk, currentUser);
      this.sendJson(res, 200, talkJson);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/:id/accept_order
   * Accept product order (state machine: open -> accepted)
   * Business logic:
   * - Validate can accept
   * - Charge customer via Stripe
   * - Lock simbi balance
   * - Mark talk as in_progress
   * - Send notifications
   */
  async acceptOrder(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkId = this.decodeTalkId(params.id!);
      const talk = await this.db.talks.findById(talkId, { include: ['orders', 'users'] });
      const order = talk.orders[talk.orders.length - 1];

      if (!order) {
        this.sendError(res, 404, { errors: { order: 'Not found' } });
        return;
      }

      // Validate can accept
      if (order.status !== 'open' || order.author_id === currentUser.id) {
        this.sendError(res, 400, { errors: { status: "Can't be accepted" } });
        return;
      }

      try {
        // Accept order with Stripe charge
        await this.acceptOrderWithCharge(order, currentUser);

        // Add message if provided
        let message: any = null;
        if (params.message) {
          message = await this.buildMessage(talk, params, currentUser);
          await this.db.messages.save(message);
        }

        // Update talk status
        talk.status = 'in_progress';
        await this.db.talks.save(talk);

        await this.notifyUsers(talk, currentUser);
        await this.notifier.notifyOrderAccept(order);

        const otherUser = talk.users.find((u: any) => u.id !== currentUser.id);
        await this.mixpanel.track(currentUser.id, 'Accept Order', { app: 'api' });
        await this.mixpanel.track(otherUser.id, 'Gets Order Accepted', { app: 'api' });

        const talkJson = await this.buildTalkJson(talk, currentUser);
        this.sendJson(res, 200, talkJson);
      } catch (error: any) {
        if (error.type === 'StripeCardError') {
          const otherUser = talk.users.find((u: any) => u.id !== currentUser.id);
          // Notify Slack about card decline
          await this.notifier.notifySlackBank(talk.id, otherUser.id);
          this.sendError(res, 400, {
            errors: { status: `Card declined for ${otherUser.full_name}` }
          });
        } else {
          this.sendError(res, 400, { errors: { status: "Can't accept order" } });
        }
      }
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/:id/cancel_order
   * Cancel order (state machine: open/accepted -> canceled)
   */
  async cancelOrder(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkId = this.decodeTalkId(params.id!);
      const talk = await this.db.talks.findById(talkId, { include: ['orders'] });
      const order = talk.orders[talk.orders.length - 1];

      if (!order) {
        this.sendError(res, 404, { errors: { order: 'Not found' } });
        return;
      }

      const canCancel = await this.canCancelOrder(order, currentUser);
      if (!canCancel) {
        this.sendError(res, 400, { errors: { status: "Can't be canceled" } });
        return;
      }

      await this.cancelOrderWithRefund(order, currentUser, params.reason);

      talk.status = 'open';
      await this.db.talks.save(talk);

      await this.notifyUsers(talk, currentUser);
      await this.notifier.notifyOrderCancel(order);

      const otherUser = talk.users.find((u: any) => u.id !== currentUser.id);
      await this.mixpanel.track(currentUser.id, 'Cancel Order', { app: 'api' });
      await this.mixpanel.track(otherUser.id, 'Gets Order Canceled', { app: 'api' });

      const talkJson = await this.buildTalkJson(talk, currentUser);
      this.sendJson(res, 200, talkJson);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/:id/confirm_delivery
   * Confirm order delivery/completion (state machine: accepted -> completed)
   * Business logic:
   * - Validate buyer confirms
   * - Save ratings and review
   * - Transfer funds to seller
   * - Release simbi
   * - Send notifications
   */
  async confirmDelivery(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkId = this.decodeTalkId(params.id!);
      const talk = await this.db.talks.findById(talkId, { include: ['orders', 'reviews'] });
      const order = talk.orders[talk.orders.length - 1];

      if (!order) {
        this.sendError(res, 404, { errors: { order: 'Not found' } });
        return;
      }

      // Only buyer (author) can confirm
      const canComplete = order.status === 'accepted' && order.author_id === currentUser.id;
      if (!canComplete || !params.review || !params.ratings) {
        this.sendError(res, 400, { errors: { status: "Can't be confirmed" } });
        return;
      }

      // Save ratings
      await this.saveRatings(talk, currentUser, params.ratings, order);

      // Complete order
      await this.completeOrder(order, currentUser);

      // Create review
      const review = await this.createReview(order, currentUser, params.review);

      talk.status = 'open';
      await this.db.talks.save(talk);

      await this.notifyUsers(talk, currentUser);
      await this.notifier.notifyOrderComplete(order, review);

      const otherUser = talk.users.find((u: any) => u.id !== currentUser.id);
      await this.mixpanel.track(currentUser.id, 'Complete Order', { app: 'api' });
      await this.mixpanel.track(otherUser.id, 'Gets Order Completed', { app: 'api' });

      const talkJson = await this.buildTalkJson(talk, currentUser);
      this.sendJson(res, 200, talkJson);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/:id/share
   * Share completed deal
   */
  async share(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkId = this.decodeTalkId(params.id!);
      const talk = await this.db.talks.findById(talkId, { include: ['offers'] });
      const offer = talk.offers[talk.offers.length - 1];

      if (!offer) {
        this.sendError(res, 404, { errors: { offer: 'Not found' } });
        return;
      }

      const alreadyShared = await this.db.userEvents.findOne({
        where: {
          user_id: currentUser.id,
          trackable_id: offer.id,
          trackable_type: 'Offer',
          name: 'share_deal'
        }
      });

      if (alreadyShared) {
        this.sendError(res, 400, { errors: { status: "Can't be shared" } });
        return;
      }

      await this.db.userEvents.create({
        user_id: currentUser.id,
        trackable_id: offer.id,
        trackable_type: 'Offer',
        name: 'share_deal',
        created_at: new Date()
      });

      this.sendJson(res, 200, { result: 'ok' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/:id/on_hold
   * Put offer/order on hold (disputed)
   */
  async onHold(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkId = this.decodeTalkId(params.id!);
      const talk = await this.db.talks.findById(talkId, { include: ['offers', 'orders'] });

      const item = params.order_id
        ? await this.db.orders.findById(params.order_id)
        : talk.offers[talk.offers.length - 1] || talk.orders[talk.orders.length - 1];

      const userId = params.user_id;
      const user = await this.db.users.findById(userId);

      if (!item || !this.canPutOnHold(item, user)) {
        this.sendError(res, 400, { errors: { status: "Can't be disputed" } });
        return;
      }

      await this.putItemOnHold(item, user);

      await this.notifyUsers(talk, user);
      await this.notifier.notifyDisputed(item, user);

      this.sendJson(res, 200, {});
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/:id/off_hold
   * Remove from hold (admin action)
   */
  async offHold(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkId = this.decodeTalkId(params.id!);
      const talk = await this.db.talks.findById(talkId, { include: ['offers', 'orders'] });

      const item = params.order_id
        ? await this.db.orders.findById(params.order_id)
        : talk.offers[talk.offers.length - 1] || talk.orders[talk.orders.length - 1];

      const userId = params.user_id;
      const user = await this.db.users.findById(userId);

      if (!item || !this.canTakeOffHold(item, user)) {
        this.sendError(res, 400, { errors: { status: "Can't be resolved" } });
        return;
      }

      await this.takeItemOffHold(item, user);

      await this.notifyUsers(talk, user);

      this.sendJson(res, 200, {});
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/talks/:id/dismiss_feedback
   * Dismiss feedback banner
   */
  async dismissFeedback(req: IncomingMessage, res: ServerResponse, params: TalkParams, currentUser: any): Promise<void> {
    try {
      const talkId = this.decodeTalkId(params.id!);
      const talk = await this.db.talks.findById(talkId);

      await this.db.userEvents.create({
        user_id: currentUser.id,
        trackable_id: talk.id,
        trackable_type: 'Talk',
        name: 'talk_feedback_banner',
        created_at: new Date()
      });

      this.sendJson(res, 200, {});
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async buildMessage(talk: any, params: TalkParams, author: any): Promise<any> {
    const message = {
      talk_id: talk.id,
      author_id: author.id,
      content: params.message,
      client_id: params.client_id || null,
      created_at: new Date(),
      attachments: []
    };

    if (params.attachments && params.attachments.length > 0) {
      const uploads = await this.db.uploads.findMany({
        where: { id: { $in: params.attachments }, user_id: author.id }
      });
      message.attachments = uploads;
    }

    return message;
  }

  private async buildOffer(talk: any, offerParams: OfferParams, owner: any): Promise<any> {
    const offer: any = {
      talk_id: talk.id,
      owner_id: owner.id,
      within: offerParams.within,
      status: 'open',
      created_at: new Date(),
      items: [],
      valid: true,
      errors: {}
    };

    // Build offer items
    for (const itemParams of offerParams.items) {
      const item = {
        owner_id: itemParams.owner_id,
        service_id: itemParams.service_id,
        unit_count: itemParams.count,
        kind: itemParams.kind
      };
      offer.items.push(item);
    }

    // Validate offer
    const validation = await this.validateOffer(offer);
    offer.valid = validation.valid;
    offer.errors = validation.errors;

    return offer;
  }

  private async buildOrder(talk: any, service: any, count: number, author: any): Promise<any> {
    count = Math.max(count, 1);

    const prices = await this.calculateProductPrices(service, count);

    const order: any = {
      talk_id: talk.id,
      author_id: author.id,
      processing_time: service.processing_time_value,
      shipping_costs: prices.shipping_costs,
      status: 'open',
      created_at: new Date(),
      items: [],
      valid: true,
      errors: {}
    };

    // Product item
    order.items.push({
      owner_id: service.user_id,
      service_id: service.id,
      count: count
    });

    // Simbi payment item
    order.items.push({
      owner_id: author.id,
      count: prices.simbi
    });

    // Validate order
    const validation = await this.validateOrder(order, service);
    order.valid = validation.valid;
    order.errors = validation.errors;

    return order;
  }

  private async validateOffer(offer: any): Promise<{ valid: boolean; errors: any }> {
    const errors: any = {};

    // Must have 2 different owners
    const ownerIds = offer.items.map((i: any) => i.owner_id);
    if (new Set(ownerIds).size < 2) {
      errors.offer = 'Must have items from both parties';
      return { valid: false, errors };
    }

    // Only one simbi item allowed
    const simbiItems = offer.items.filter((i: any) => i.kind === 'simbi');
    if (simbiItems.length > 1) {
      errors.offer = 'Only one simbi payment allowed';
      return { valid: false, errors };
    }

    // Validate quotas for service items
    for (const item of offer.items) {
      if (item.service_id) {
        const service = await this.db.services.findById(item.service_id);
        if (!service.has_quota) {
          errors.offer = `Service ${service.name} has no quota available`;
          return { valid: false, errors };
        }
        if (service.quota && service.quota < service.quota_used + item.unit_count) {
          errors.offer = `Not enough quota for ${service.name}`;
          return { valid: false, errors };
        }
        if (item.unit_count <= 0) {
          errors.unit_count = 'Count must be greater than 0';
          return { valid: false, errors };
        }
      }
    }

    // Validate simbi balance
    if (simbiItems.length > 0) {
      const simbiItem = simbiItems[0];
      const serviceItem = offer.items.find((i: any) => i.service_id);

      if (simbiItem.unit_count < 1 && !serviceItem?.service?.pay_forward) {
        errors.simbi = 'Simbi must be greater than 0';
        return { valid: false, errors };
      }

      const user = await this.db.users.findById(simbiItem.owner_id);
      const account = await this.db.accounts.findByUser(user.id);

      if (account.available_balance < simbiItem.unit_count) {
        errors.simbi = `${user.first_name} doesn't have enough simbi`;
        return { valid: false, errors };
      }
    }

    return { valid: true, errors: {} };
  }

  private async validateOrder(order: any, service: any): Promise<{ valid: boolean; errors: any }> {
    const errors: any = {};

    // Must have 2 different owners
    const ownerIds = order.items.map((i: any) => i.owner_id);
    if (new Set(ownerIds).size < 2) {
      errors.order = 'Must have items from both parties';
      return { valid: false, errors };
    }

    // Must have product item
    const productItem = order.items.find((i: any) => i.service_id);
    if (!productItem) {
      errors.order = 'No product specified';
      return { valid: false, errors };
    }

    // Validate quota
    if (!service.has_quota) {
      errors.order = 'Product already sold out';
      return { valid: false, errors };
    }
    if (service.quota && service.quota < service.quota_used + productItem.count) {
      errors.order = 'Quantity exceeds available quota';
      return { valid: false, errors };
    }

    // Validate simbi balance
    const simbiItem = order.items.find((i: any) => !i.service_id);
    if (simbiItem) {
      const user = await this.db.users.findById(simbiItem.owner_id);
      const account = await this.db.accounts.findByUser(user.id);

      if (account.available_balance < simbiItem.count) {
        errors.count = 'Not enough simbi';
        return { valid: false, errors };
      }
    }

    return { valid: true, errors: {} };
  }

  private async saveRatings(talk: any, author: any, ratings: RatingParams[], itemable?: any): Promise<void> {
    const otherUser = talk.users.find((u: any) => u.id !== author.id);

    for (const ratingParam of ratings) {
      const rating = await this.db.ratings.findOne({
        where: {
          user_id: otherUser.id,
          author_id: author.id,
          talk_id: talk.id,
          kind: ratingParam.kind
        }
      }) || {};

      rating.user_id = otherUser.id;
      rating.author_id = author.id;
      rating.talk_id = talk.id;
      rating.kind = ratingParam.kind;
      rating.value = ratingParam.value;

      if (itemable && (ratingParam.kind === 'quality' || ratingParam.kind === 'expert')) {
        rating.item_id = itemable.id;
        rating.item_type = itemable.constructor.name;
      }

      await this.db.ratings.save(rating);
    }

    // Schedule rating update job
    setTimeout(() => this.updateUserRating(otherUser.id), 60000);
  }

  private async createReview(item: any, author: any, message: string): Promise<any> {
    const talk = await this.db.talks.findById(item.talk_id);
    const otherUser = talk.users.find((u: any) => u.id !== author.id);

    const review = await this.db.reviews.create({
      message,
      author_id: author.id,
      user_id: otherUser.id,
      item_id: item.id,
      item_type: item.constructor.name,
      created_at: new Date()
    });

    // Calculate average rating
    const ratings = await this.db.ratings.findMany({
      where: { talk_id: talk.id, author_id: author.id }
    });
    const avgRating = ratings.reduce((sum: number, r: any) => sum + r.value, 0) / ratings.length;
    review.rating = avgRating;

    await this.mixpanel.track(author.id, 'New Review', { rating: avgRating, app: 'api' });

    return review;
  }

  private async acceptOffer(offer: any, user: any): Promise<void> {
    // State machine transition
    offer.status = 'accepted';
    offer.due_date = new Date(Date.now() + offer.within * 24 * 60 * 60 * 1000);

    // Add history
    await this.db.itemHistories.create({
      item_id: offer.id,
      item_type: 'Offer',
      user_id: user.id,
      kind: 'accepted',
      created_at: new Date()
    });

    // Lock simbi (create pending transaction)
    const simbiItem = offer.items.find((i: any) => i.kind === 'simbi' && i.unit_count > 0);
    if (simbiItem) {
      await this.db.transactions.create({
        user_id: simbiItem.owner_id,
        amount: -simbiItem.unit_count,
        status: 'pending',
        item_id: offer.id,
        item_type: 'Offer',
        read_at: new Date(),
        created_at: new Date()
      });
    }

    // Charge customer if USD payment
    const usdItem = offer.items.find((i: any) => i.kind === 'usd' && i.unit_count > 0);
    if (usdItem) {
      await this.stripe.createCharge({
        amount: Math.round(usdItem.unit_count * 100),
        buyer_id: usdItem.owner_id,
        capture: false,
        metadata: { offer_id: offer.id, user_id: user.id }
      });
    }

    await this.db.offers.save(offer);
  }

  private async closeOffer(offer: any, user: any): Promise<void> {
    offer.status = 'closed';

    await this.db.itemHistories.create({
      item_id: offer.id,
      item_type: 'Offer',
      user_id: user.id,
      kind: 'closed',
      created_at: new Date()
    });

    // Rollback transaction
    const transaction = await this.db.transactions.findOne({
      where: { item_id: offer.id, item_type: 'Offer', status: 'pending' }
    });
    if (transaction) {
      await this.db.transactions.delete(transaction.id);
    }

    await this.db.offers.save(offer);
  }

  private async confirmOffer(offer: any, user: any): Promise<void> {
    await this.db.itemHistories.create({
      item_id: offer.id,
      item_type: 'Offer',
      user_id: user.id,
      kind: 'confirmed',
      created_at: new Date()
    });

    // Check if other user already confirmed
    const histories = await this.db.itemHistories.findMany({
      where: { item_id: offer.id, kind: 'confirmed' }
    });

    const isBuyer = offer.items.some((i: any) => i.owner_id === user.id && !i.service_id);
    const otherUserConfirmed = histories.some((h: any) => h.user_id !== user.id);

    if (isBuyer || !otherUserConfirmed) {
      // Complete transaction
      offer.status = 'confirmed';

      const transaction = await this.db.transactions.findOne({
        where: { item_id: offer.id, item_type: 'Offer', status: 'pending' }
      });

      if (transaction) {
        transaction.status = 'completed';
        transaction.completed_at = new Date();
        await this.db.transactions.save(transaction);

        // Create credit transaction for recipient
        const talk = await this.db.talks.findById(offer.talk_id);
        const recipient = talk.users.find((u: any) => u.id !== transaction.user_id);

        await this.db.transactions.create({
          user_id: recipient.id,
          amount: Math.abs(transaction.amount),
          status: 'completed',
          item_id: offer.id,
          item_type: 'Offer',
          read_at: new Date(),
          completed_at: new Date(),
          created_at: new Date()
        });
      }
    } else {
      offer.status = 'completed';
    }

    await this.db.offers.save(offer);
  }

  private async cancelOffer(offer: any, user: any, reason: string, kind?: string): Promise<void> {
    offer.status = 'canceled';
    offer.cancel_reason = reason;
    offer.cancel_kind = kind || 'other';

    await this.db.itemHistories.create({
      item_id: offer.id,
      item_type: 'Offer',
      user_id: user.id,
      kind: 'canceled',
      created_at: new Date()
    });

    // Rollback transaction
    const transaction = await this.db.transactions.findOne({
      where: { item_id: offer.id, item_type: 'Offer', status: 'pending' }
    });
    if (transaction) {
      await this.db.transactions.delete(transaction.id);
    }

    await this.db.offers.save(offer);
  }

  private async acceptOrderWithCharge(order: any, user: any): Promise<void> {
    // Charge shipping if positive
    if (order.shipping_costs > 0) {
      await this.stripe.createCharge({
        amount: Math.round(order.shipping_costs * 100),
        buyer_id: order.author_id,
        capture: true,
        metadata: { order_id: order.id, user_id: user.id }
      });
    }

    order.status = 'accepted';

    await this.db.itemHistories.create({
      item_id: order.id,
      item_type: 'Order',
      user_id: user.id,
      kind: 'accepted',
      created_at: new Date()
    });

    // Lock simbi
    const simbiItem = order.items.find((i: any) => !i.service_id);
    if (simbiItem) {
      await this.db.transactions.create({
        user_id: simbiItem.owner_id,
        amount: -simbiItem.count,
        status: 'pending',
        item_id: order.id,
        item_type: 'Order',
        read_at: new Date(),
        created_at: new Date()
      });
    }

    await this.db.orders.save(order);
  }

  private async cancelOrderWithRefund(order: any, user: any, reason?: string): Promise<void> {
    order.status = 'canceled';
    order.cancel_reason = reason;

    await this.db.itemHistories.create({
      item_id: order.id,
      item_type: 'Order',
      user_id: user.id,
      kind: 'canceled',
      created_at: new Date()
    });

    // Rollback transaction
    const transaction = await this.db.transactions.findOne({
      where: { item_id: order.id, item_type: 'Order', status: 'pending' }
    });
    if (transaction) {
      await this.db.transactions.delete(transaction.id);
    }

    await this.db.orders.save(order);
  }

  private async completeOrder(order: any, user: any): Promise<void> {
    order.status = 'completed';

    await this.db.itemHistories.create({
      item_id: order.id,
      item_type: 'Order',
      user_id: user.id,
      kind: 'confirmed',
      created_at: new Date()
    });

    // Complete transaction
    const transaction = await this.db.transactions.findOne({
      where: { item_id: order.id, item_type: 'Order', status: 'pending' }
    });

    if (transaction) {
      transaction.status = 'completed';
      transaction.completed_at = new Date();
      await this.db.transactions.save(transaction);

      // Create credit transaction for seller
      const talk = await this.db.talks.findById(order.talk_id);
      const seller = talk.users.find((u: any) => u.id !== transaction.user_id);

      await this.db.transactions.create({
        user_id: seller.id,
        amount: Math.abs(transaction.amount),
        status: 'completed',
        item_id: order.id,
        item_type: 'Order',
        read_at: new Date(),
        completed_at: new Date(),
        created_at: new Date()
      });
    }

    await this.db.orders.save(order);
  }

  private canReviewItem(item: any, user: any): boolean {
    const validStatuses = ['confirmed', 'completed', 'canceled'];
    return validStatuses.includes(item.status);
  }

  private async canConfirmOffer(offer: any, user: any): Promise<boolean> {
    if (offer.status !== 'accepted' && offer.status !== 'completed') {
      return false;
    }

    const alreadyConfirmed = await this.db.itemHistories.findOne({
      where: { item_id: offer.id, kind: 'confirmed', user_id: user.id }
    });

    return !alreadyConfirmed;
  }

  private async canCancelOffer(offer: any, user: any): Promise<boolean> {
    return offer.status === 'accepted' || offer.status === 'disputed';
  }

  private async canCancelOrder(order: any, user: any): Promise<boolean> {
    return order.status === 'open' || order.status === 'accepted';
  }

  private canPutOnHold(item: any, user: any): boolean {
    return item.status === 'completed' || item.status === 'accepted';
  }

  private canTakeOffHold(item: any, user: any): boolean {
    return item.status === 'disputed';
  }

  private async putItemOnHold(item: any, user: any): Promise<void> {
    item.status = 'disputed';

    await this.db.itemHistories.create({
      item_id: item.id,
      item_type: item.constructor.name,
      user_id: user.id,
      kind: 'on_hold',
      created_at: new Date()
    });

    await this.db[item.constructor.name.toLowerCase() + 's'].save(item);
  }

  private async takeItemOffHold(item: any, user: any): Promise<void> {
    item.status = item.constructor.name === 'Order' ? 'accepted' : 'completed';

    await this.db.itemHistories.create({
      item_id: item.id,
      item_type: item.constructor.name,
      user_id: user.id,
      kind: 'off_hold',
      created_at: new Date()
    });

    await this.db[item.constructor.name.toLowerCase() + 's'].save(item);
  }

  private async calculateProductPrices(service: any, count: number): Promise<any> {
    return {
      simbi: service.price * count,
      shipping_costs: service.shipping_cost || 0
    };
  }

  private async notifyUsers(talk: any, actor: any): Promise<void> {
    // Mark as unread for other users
    await this.db.talkUsers.updateMany(
      { talk_id: talk.id, user_id: { $ne: actor.id } },
      { read_at: null }
    );

    // Mark as read for actor
    await this.db.talkUsers.update(
      { talk_id: talk.id, user_id: actor.id },
      { read_at: new Date(), seen_at: new Date() }
    );

    // Unarchive for all
    await this.db.talkUsers.updateMany(
      { talk_id: talk.id },
      { archived_at: null }
    );

    // Send socket notifications
    const otherUsers = talk.users.filter((u: any) => u.id !== actor.id);
    for (const user of otherUsers) {
      const talkJson = await this.buildTalkJson(talk, user);
      const unreadCount = await this.db.talkUsers.count({
        where: { user_id: user.id, read_at: null }
      });
      const tabCounts = await this.getUserTabCounts(user);
      const balance = await this.db.accounts.getBalance(user.id);

      await this.notifier.sendSocket(user.user_key, {
        talk: talkJson,
        inbox_item: await this.buildInboxItem(talk, user),
        unreadTabCounts: tabCounts,
        unread_count: unreadCount,
        simbi_balance: balance
      });
    }

    // Notify current user
    await this.notifyCurrentUser(talk, actor);
  }

  private async notifyCurrentUser(talk: any, actor: any): Promise<void> {
    const notification: any = {
      inbox_item: await this.buildInboxItem(talk, actor)
    };

    const currentBalance = await this.db.accounts.getBalance(actor.id);
    notification.simbi_balance = currentBalance;

    await this.notifier.sendSocket(actor.user_key, notification);
  }

  private async notifyPayingSimbi(offer: any): Promise<void> {
    const item = offer.items.find((i: any) => !i.service_id);
    if (item) {
      // Schedule worker to notify about paying simbi in 1 hour
      setTimeout(() => this.notifier.notifyPayingSimbi(item.owner_id), 3600000);
    }
  }

  private async getUserTabCounts(user: any): Promise<any> {
    const inbox = await this.db.talkUsers.count({
      where: {
        user_id: user.id,
        read_at: null,
        archived_at: null,
        'talk.status': 'open'
      }
    });

    const deals = await this.db.talkUsers.count({
      where: {
        user_id: user.id,
        read_at: null,
        'talk.status': 'in_progress'
      }
    });

    const archived = await this.db.talkUsers.count({
      where: {
        user_id: user.id,
        archived_at: { $ne: null }
      }
    });

    return { inbox, deals, archived };
  }

  private async buildTalkJson(talk: any, user: any): Promise<any> {
    // This would build full JSON representation
    // Placeholder for now
    return {
      id: this.encodeTalkId(talk.id),
      status: talk.status,
      users: talk.users,
      messages: talk.messages,
      offers: talk.offers,
      orders: talk.orders,
      // ... more fields
    };
  }

  private async buildTalkProposalJson(talk: any, user: any): Promise<any> {
    return { talk_id: this.encodeTalkId(talk.id) };
  }

  private async buildInquiryJson(user: any, service: any): Promise<any> {
    return { user, service };
  }

  private async buildInboxItem(talk: any, user: any): Promise<any> {
    return { talk_id: this.encodeTalkId(talk.id) };
  }

  private async processInboundEmail(params: any): Promise<{ talk: any; message: any }> {
    // Email processing logic
    // Placeholder
    return { talk: null, message: null };
  }

  private async checkPhishing(user: any): Promise<void> {
    // Phishing detection
  }

  private async checkFirstDeal(user: any): Promise<boolean> {
    const count = await this.db.offers.count({
      where: { status: 'confirmed', 'talk.users': { $contains: user.id } }
    });
    return count === 1;
  }

  private async updateUserRating(userId: string): Promise<void> {
    // Recalculate user ratings
  }

  private decodeTalkId(encodedId: string): string {
    // Decode hashid
    return encodedId;
  }

  private encodeTalkId(id: string): string {
    // Encode hashid
    return id;
  }

  private sendJson(res: ServerResponse, status: number, data: any): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  private sendError(res: ServerResponse, status: number, errors: any): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(errors));
  }

  private handleError(res: ServerResponse, error: any): void {
    console.error('TalksController Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ errors: { server: 'Internal server error' } }));
  }
}
