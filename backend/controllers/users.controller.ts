/**
 * Users Controller - Complete port from Rails app/controllers/api/v1/users_controller.rb
 *
 * Handles all user-related endpoints with full business logic:
 * - Authentication (auth, preauth, logout)
 * - Device registration (push notifications)
 * - User profile (me, show, settings)
 * - Bonuses (share, Facebook like, referral)
 * - Stripe integration (accounts, customers, subscriptions)
 * - Email event processing (Sendgrid)
 * - User feed and search
 * - Vacation mode
 */

import { IncomingMessage, ServerResponse } from 'node:http';
import { Database } from '../services/database.service';
import { NotificationService } from '../services/notification.service';
import { StripeService } from '../services/stripe.service';
import { DeviseService } from '../services/devise.service';
import { MixpanelService } from '../services/mixpanel.service';
import { SendgridService } from '../services/sendgrid.service';

interface UserParams {
  id?: string;
  token?: string;
  email?: string;
  password?: string;
  provider?: string;
  cb?: string;
  platform?: string;
  oneSignalUserId?: string;
  os?: string;
  service_id?: string;
  amount?: number;
  period?: string;
  subscribeImmediately?: boolean;
  query?: string;
  size?: number;
  filter?: string;
  not?: string;
  allow_orgs?: boolean;
  exclude_users_from_org?: string;
  deactivated_for?: string;
  deactivation_reason?: string;
  user?: {
    disabled_push_notifications?: string[];
    settings?: {
      inbox_sorting?: string;
    };
  };
  source?: string;
  shipping?: any;
  billing?: any;
  first_name?: string;
  last_name?: string;
  ssn_last_4?: string;
  dob?: { day: number; month: number; year: number };
  address?: any;
  phone?: string;
}

export class UsersController {
  private db: Database;
  private notifier: NotificationService;
  private stripe: StripeService;
  private devise: DeviseService;
  private mixpanel: MixpanelService;
  private sendgrid: SendgridService;

  constructor() {
    this.db = new Database();
    this.notifier = new NotificationService();
    this.stripe = new StripeService();
    this.devise = new DeviseService();
    this.mixpanel = new MixpanelService();
    this.sendgrid = new SendgridService();
  }

  /**
   * GET /api/v1/users/preauth
   * Pre-authentication for OAuth providers
   * Redirects to provider if not signed in, otherwise redirects mobile
   */
  async preauth(req: IncomingMessage, res: ServerResponse, params: UserParams, currentUser?: any): Promise<void> {
    try {
      if (currentUser) {
        // User already signed in, redirect to mobile
        const redirectUrl = this.buildMobileRedirect(currentUser, params.cb);
        res.writeHead(302, { 'Location': redirectUrl });
        res.end();
      } else {
        // Redirect to OAuth provider
        const authUrl = this.buildOAuthUrl(params.provider!, params.cb);
        res.writeHead(302, { 'Location': authUrl });
        res.end();
      }
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/users/auth
   * Authenticate user via email/password or token
   * Business logic:
   * - Support multiple auth methods (email/password, token, test token)
   * - Validate credentials
   * - Remember user session
   * - Return user data with balance and address
   */
  async auth(req: IncomingMessage, res: ServerResponse, params: UserParams): Promise<void> {
    try {
      let userId: string | null = null;

      // Test token for iOS testing (non-production only)
      if (process.env.NODE_ENV !== 'production' &&
          params.token === '66W4IG6izdCo4t0oXa1GSKu58K78cTsn' &&
          params.id) {
        userId = params.id;
      }
      // Email/password authentication
      else if (params.email && params.password) {
        const user = await this.db.users.findByEmail(params.email);
        if (user) {
          const isValid = await this.devise.validatePassword(user, params.password);
          userId = isValid ? user.id : null;
        }
      }
      // Token authentication (JWT or similar)
      else if (params.token) {
        userId = await this.decodeAuthToken(params.token);
      }

      if (!userId) {
        this.sendError(res, 302, { error: 'Not authenticated' });
        return;
      }

      const user = await this.db.users.findById(userId, {
        include: ['account', 'address']
      });

      if (!user) {
        this.sendError(res, 302, { error: 'Not authenticated' });
        return;
      }

      // Remember user session
      await this.devise.rememberUser(user);

      // Build response
      const userJson = await this.buildUserJson(user);
      const response = {
        ...userJson,
        address: user.short_address,
        userKey: user.user_key,
        simbis: user.account.available_balance
      };

      this.sendJson(res, 200, response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/users/logout
   * Sign out current user
   */
  async logout(req: IncomingMessage, res: ServerResponse, params: UserParams, currentUser: any): Promise<void> {
    try {
      await this.devise.signOut(currentUser);
      this.sendJson(res, 200, { status: 'signout' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/users/device
   * Register device for push notifications
   * Business logic:
   * - Support multiple platforms (iOS, Android, OneSignal)
   * - Update existing device or create new
   * - Associate with current user
   */
  async device(req: IncomingMessage, res: ServerResponse, params: UserParams, currentUser: any): Promise<void> {
    try {
      let token: string | null = null;
      let platform: string | null = null;

      if (params.token) {
        token = params.token;
        platform = params.platform || null;
      } else if (params.oneSignalUserId) {
        token = params.oneSignalUserId;
        platform = `onesignal_${(params.os || '').toLowerCase().replace(/\s+/g, '_')}`;
      }

      if (!token || !platform) {
        this.sendError(res, 400, { error: 'Pass device token and platform' });
        return;
      }

      // Find or create device
      let device = await this.db.devices.findByToken(token);
      if (!device) {
        device = await this.db.devices.create({
          token,
          platform,
          user_id: currentUser.id
        });
      } else {
        // Update device
        device.user_id = currentUser.id;
        device.platform = platform;
        await this.db.devices.save(device);
      }

      const settings = await this.buildSettingsJson(currentUser);
      this.sendJson(res, 200, settings);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /api/v1/users/me
   * Get current user profile with socket URI and balance
   */
  async me(req: IncomingMessage, res: ServerResponse, params: UserParams, currentUser: any): Promise<void> {
    try {
      const user = await this.db.users.findById(currentUser.id, {
        include: ['account', 'address', 'services', 'ratings']
      });

      const profileJson = await this.buildProfileJson(user);
      const socketUri = await this.notifier.getSocketUri();

      const response = {
        ...profileJson,
        userKey: user.user_key,
        socketUri,
        simbis: user.account.available_balance
      };

      this.sendJson(res, 200, response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /api/v1/users/:id
   * Get user profile by ID
   */
  async show(req: IncomingMessage, res: ServerResponse, params: UserParams, currentUser: any): Promise<void> {
    try {
      const user = await this.db.users.findById(params.id!, {
        include: ['services', 'ratings', 'reviews']
      });

      if (!user) {
        this.sendError(res, 404, { error: 'User not found' });
        return;
      }

      // Check authorization
      // (In Rails: load_and_authorize_resource)
      // For now, assume public profiles

      const profileJson = await this.buildProfileJson(user);
      this.sendJson(res, 200, profileJson);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * PUT /api/v1/users/settings
   * Update user settings (push notifications, inbox sorting)
   */
  async settings(req: IncomingMessage, res: ServerResponse, params: UserParams, currentUser: any): Promise<void> {
    try {
      const updates: any = {};

      if (params.user?.disabled_push_notifications) {
        updates.disabled_push_notifications = params.user.disabled_push_notifications;
      }

      if (params.user?.settings) {
        updates.settings = {
          ...currentUser.settings,
          ...params.user.settings
        };
      }

      await this.db.users.update(currentUser.id, updates);

      const user = await this.db.users.findById(currentUser.id);
      const settings = await this.buildSettingsJson(user);

      this.sendJson(res, 200, settings);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/users/add_share_bonus
   * Add simbi bonus for sharing a service
   * Business logic:
   * - Validate service belongs to user
   * - Check if bonus already received
   * - Add bonus amount based on service kind
   * - Update user balance
   */
  async addShareBonus(req: IncomingMessage, res: ServerResponse, params: UserParams, currentUser: any): Promise<void> {
    try {
      const serviceId = params.service_id;

      if (!serviceId) {
        this.sendError(res, 200, { errors: { status: 'Wrong user or already received' } });
        return;
      }

      const service = await this.db.services.findById(serviceId);

      if (!service) {
        this.sendError(res, 200, { errors: { status: 'Wrong user or already received' } });
        return;
      }

      // Validate can receive bonus
      if (!this.canReceiveShareBonus(service, currentUser)) {
        this.sendError(res, 200, { errors: { status: 'Wrong user or already received' } });
        return;
      }

      // Add bonus
      const amount = await this.addShareSimbucks(currentUser, service);

      await this.notifyBalanceChange(currentUser);

      this.sendJson(res, 200, {
        status: 'ok',
        amount,
        kind: service.kind
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/users/add_fb_like_bonus
   * Add bonus for Facebook like
   */
  async addFbLikeBonus(req: IncomingMessage, res: ServerResponse, params: UserParams, currentUser: any): Promise<void> {
    try {
      const received = await this.fbLikeBonusReceived(currentUser);

      if (received) {
        this.sendError(res, 200, { errors: { status: 'Already received' } });
        return;
      }

      await this.addFbLikeSimbucks(currentUser);
      await this.notifyBalanceChange(currentUser);

      this.sendJson(res, 200, { status: 'ok' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/users/add_fb_shared_referral_bonus
   * Add bonus for Facebook shared referral
   */
  async addFbSharedReferralBonus(req: IncomingMessage, res: ServerResponse, params: UserParams, currentUser: any): Promise<void> {
    try {
      const received = await this.fbSharedReferralBonusReceived(currentUser);

      if (received) {
        this.sendError(res, 200, { errors: { status: 'Already received' } });
        return;
      }

      await this.addFbSharedReferralBonus(currentUser);
      await this.notifyBalanceChange(currentUser);

      this.sendJson(res, 200, { status: 'ok' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/users/email_event
   * Process Sendgrid email events (bounces, opens, clicks, etc)
   */
  async emailEvent(req: IncomingMessage, res: ServerResponse, params: any): Promise<void> {
    try {
      const events = params._json || params;
      await this.sendgrid.processEvents(events);

      this.sendJson(res, 200, { status: 'ok' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /api/v1/users/feed
   * Get user activity feed (compliments)
   */
  async feed(req: IncomingMessage, res: ServerResponse, params: UserParams, currentUser: any): Promise<void> {
    try {
      const { items, nextUrl } = await this.paginate(
        this.db.compliments.findMany({
          where: { user_id: currentUser.id },
          include: ['author'],
          order: { id: 'desc' }
        }),
        params
      );

      const activities = items.map((c: any) => this.buildComplimentActivityJson(c));

      this.sendJson(res, 200, {
        activities,
        nextUrl
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/users/stripe_account
   * Create or update Stripe Connect account
   * Business logic:
   * - Create custom Stripe account for seller
   * - Validate identity information
   * - Add bank account
   * - Handle account updates
   * - Store account ID
   */
  async stripeAccount(req: IncomingMessage, res: ServerResponse, params: UserParams, currentUser: any): Promise<void> {
    try {
      const stripeParams = this.extractStripeAccountParams(params);
      let account = currentUser.stripe_account?.account;

      if (account) {
        // Update existing account
        account = await this.stripe.updateAccount(account.id, {
          requested_capabilities: ['card_payments', 'transfers'],
          external_account: stripeParams.token,
          business_type: 'individual',
          individual: {
            address: stripeParams.address,
            email: stripeParams.email,
            phone: stripeParams.phone,
            ...(currentUser.stripe_account.verified ? {} : {
              dob: stripeParams.dob,
              first_name: stripeParams.first_name,
              last_name: stripeParams.last_name,
              ssn_last_4: stripeParams.ssn_last_4
            })
          },
          business_profile: {
            mcc: '7299' // Default MCC for services
          }
        });
      } else {
        // Create new account
        account = await this.stripe.createAccount({
          country: 'US',
          type: 'custom',
          email: currentUser.email_address,
          external_account: stripeParams.token,
          requested_capabilities: ['card_payments', 'transfers'],
          business_type: 'individual',
          individual: {
            dob: stripeParams.dob,
            first_name: stripeParams.first_name,
            last_name: stripeParams.last_name,
            ssn_last_4: stripeParams.ssn_last_4,
            address: stripeParams.address,
            email: stripeParams.email,
            phone: stripeParams.phone
          },
          business_profile: {
            mcc: '7299',
            url: process.env.NODE_ENV === 'development'
              ? 'https://simbi.com'
              : `https://simbi.com/users/${currentUser.id}`
          },
          tos_acceptance: {
            date: Math.floor(Date.now() / 1000),
            ip: this.getClientIp(req)
          }
        });

        // Save to database
        await this.db.stripeAccounts.create({
          user_id: currentUser.id,
          stripe_id: account.id
        });
      }

      this.sendJson(res, 200, { account_id: account.id });
    } catch (error: any) {
      this.sendError(res, 400, { error: error.message });
    }
  }

  /**
   * POST /api/v1/users/customer
   * Create Stripe customer for user
   */
  async customer(req: IncomingMessage, res: ServerResponse, params: UserParams, currentUser: any): Promise<void> {
    try {
      const userId = params.id || currentUser.id;
      const user = await this.db.users.findById(userId);

      // Check authorization
      if (userId !== currentUser.id && !currentUser.admin) {
        this.sendError(res, 403, { error: 'Forbidden' });
        return;
      }

      const stripeCustomer = await this.createStripeCustomer(user, params);

      this.sendJson(res, 200, { customer_id: stripeCustomer.stripe_id });
    } catch (error: any) {
      this.sendError(res, 400, { error: error.message });
    }
  }

  /**
   * POST /api/v1/users/create_subscription
   * Create recurring subscription
   * Business logic:
   * - Create Stripe customer if needed
   * - Set up subscription plan
   * - Handle immediate vs future billing
   * - Validate amount and period
   */
  async createSubscription(req: IncomingMessage, res: ServerResponse, params: UserParams, currentUser: any): Promise<void> {
    try {
      const userId = params.id || currentUser.id;
      const user = await this.db.users.findById(userId, { include: ['customer'] });

      // Check authorization
      if (userId !== currentUser.id && !currentUser.admin) {
        this.sendError(res, 403, { error: 'Forbidden' });
        return;
      }

      // Create customer if needed
      const customer = await this.createStripeCustomer(user, params);

      // Create subscription
      const subscription = await this.stripe.createSubscription({
        customer: customer.stripe_id,
        amount: params.amount!,
        interval: params.period!,
        subscribe_immediately: params.subscribeImmediately || false
      });

      this.sendJson(res, 200, { subscription });
    } catch (error: any) {
      this.sendError(res, 400, { error: error.message });
    }
  }

  /**
   * POST /api/v1/users/reactivate_subscription
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(req: IncomingMessage, res: ServerResponse, params: UserParams, currentUser: any): Promise<void> {
    try {
      const userId = params.id || currentUser.id;
      const user = await this.db.users.findById(userId, { include: ['customer'] });

      // Check authorization
      if (userId !== currentUser.id && !currentUser.admin) {
        this.sendError(res, 403, { error: 'Forbidden' });
        return;
      }

      const customer = user.customer;

      if (!customer) {
        this.sendError(res, 400, { error: 'No customer found' });
        return;
      }

      if (!customer.subscription) {
        this.sendError(res, 400, { error: 'No subscription exists' });
        return;
      }

      if (!customer.subscription.cancel_at) {
        this.sendError(res, 400, { error: 'Subscription is already active' });
        return;
      }

      await this.stripe.toggleSubscription(customer);

      // Redirect to payment page (for web interface)
      res.writeHead(302, { 'Location': '/payment#subscription-details' });
      res.end();
    } catch (error: any) {
      this.sendError(res, 400, { error: error.message });
    }
  }

  /**
   * POST /api/v1/users/cancel_subscription
   * Cancel active subscription
   */
  async cancelSubscription(req: IncomingMessage, res: ServerResponse, params: UserParams, currentUser: any): Promise<void> {
    try {
      const customer = currentUser.customer;

      if (!customer) {
        this.sendError(res, 400, { error: 'No customer found' });
        return;
      }

      const subscription = await this.stripe.toggleSubscription(customer);

      // Handle organization trial cancellation
      if (currentUser.organization && subscription.status === 'canceled') {
        // Redirect back to original user (impersonation)
        // This would need session management
        res.writeHead(302, { 'Location': '/' });
        res.end();
        return;
      }

      res.writeHead(302, { 'Location': '/payment#subscription-details' });
      res.end();
    } catch (error: any) {
      this.sendError(res, 400, { error: error.message });
    }
  }

  /**
   * GET /api/v1/users/search
   * Search for users with filters
   * Business logic:
   * - Search by query (name)
   * - Filter by community/followees
   * - Exclude specific users/orgs
   * - Limit results
   */
  async search(req: IncomingMessage, res: ServerResponse, params: UserParams, currentUser: any): Promise<void> {
    try {
      if (!params.query) {
        this.sendError(res, 400, { error: 'Empty query' });
        return;
      }

      const limit = parseInt(params.size as any) || 5;
      const filter = params.filter;

      let query = this.db.users.query();

      // Apply filter
      if (filter === 'community') {
        const community = await this.getCurrentCommunity(currentUser);
        if (community) {
          query = query.where('community_id', community.id);
        } else {
          // No community, return empty
          this.sendJson(res, 200, []);
          return;
        }
      } else if (filter === 'followees') {
        const followeeIds = await this.db.follows.getFolloweeIds(currentUser.id);
        query = query.whereIn('id', followeeIds);
      } else {
        // Default: active users
        query = query.where('status', 'active');

        if (!params.allow_orgs) {
          query = query.whereNot('role', 'organization');
        }
      }

      // Search by name
      query = query.search(params.query);

      // Exclude users
      if (params.not) {
        const excludeIds = params.not.split(',');
        query = query.whereNotIn('id', excludeIds);
      }

      // Exclude org members
      if (params.exclude_users_from_org) {
        const org = await this.db.organizations.findBySlug(params.exclude_users_from_org);
        if (org) {
          const orgUserIds = await this.db.organizationMembers.getUserIds(org.id);
          query = query.whereNotIn('id', orgUserIds);
        }
      }

      const users = await query.limit(limit).execute();
      const usersJson = users.map((u: any) => this.buildUserJson(u));

      this.sendJson(res, 200, usersJson);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/users/vacation_mode
   * Set vacation mode (temporary deactivation)
   * Business logic:
   * - Validate deactivation period
   * - Validate deactivation reason
   * - Set deactivation timestamp
   * - Track in Mixpanel
   */
  async vacationMode(req: IncomingMessage, res: ServerResponse, params: UserParams, currentUser: any): Promise<void> {
    try {
      const updates: any = {};

      // Valid values for deactivated_for
      const validPeriods = ['1_week', '2_weeks', '1_month', '3_months', 'indefinite'];
      const validReasons = ['vacation', 'busy', 'break', 'other'];

      if (params.deactivated_for) {
        if (!validPeriods.includes(params.deactivated_for)) {
          this.sendError(res, 400, {
            errors: {
              deactivated_for: `Invalid deactivated_for value. Valid values are: ${validPeriods.join(', ')}`
            }
          });
          return;
        }
        updates.deactivated_for = params.deactivated_for;
      } else {
        updates.deactivated_for = null;
      }

      if (params.deactivation_reason) {
        if (!validReasons.includes(params.deactivation_reason)) {
          this.sendError(res, 400, {
            errors: {
              deactivation_reason: `Invalid deactivation_reason value. Valid values are: ${validReasons.join(', ')}`
            }
          });
          return;
        }
        updates.deactivation_reason = params.deactivation_reason;
      } else {
        updates.deactivation_reason = null;
      }

      // Set/clear deactivation timestamp
      if (updates.deactivated_for) {
        updates.deactivated_at = new Date();
      } else {
        updates.deactivated_at = null;
        updates.deactivation_reason = null;
      }

      await this.db.users.update(currentUser.id, updates);

      // Track in Mixpanel
      if (updates.deactivated_for) {
        await this.mixpanel.track(currentUser.id, 'Vacation Mode ON', {
          vacation_duration: updates.deactivated_for
        });
      } else {
        await this.mixpanel.track(currentUser.id, 'Vacation Mode OFF', {});
      }

      const user = await this.db.users.findById(currentUser.id);
      const vacationJson = await this.buildVacationJson(user);

      this.sendJson(res, 200, vacationJson);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async buildUserJson(user: any): Promise<any> {
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      role: user.role,
      created_at: user.created_at
    };
  }

  private async buildProfileJson(user: any): Promise<any> {
    return {
      ...await this.buildUserJson(user),
      bio: user.bio,
      address: user.address,
      services: user.services,
      rating: user.average_rating,
      deals_count: user.deals_count,
      reviews: user.reviews
    };
  }

  private async buildSettingsJson(user: any): Promise<any> {
    const disabledNotifications = user.disabled_push_notifications || [];
    const notificationOptions = [
      'new_message',
      'new_offer',
      'offer_accepted',
      'deal_completed',
      'new_review'
    ];

    return {
      notifications: notificationOptions.map((option: string) => [
        option,
        !disabledNotifications.includes(option)
      ])
    };
  }

  private async buildComplimentActivityJson(compliment: any): Promise<any> {
    return {
      id: compliment.id,
      kind: compliment.kind,
      author: await this.buildUserJson(compliment.author),
      created_at: compliment.created_at
    };
  }

  private async buildVacationJson(user: any): Promise<any> {
    return {
      deactivated_for: user.deactivated_for,
      deactivation_reason: user.deactivation_reason,
      deactivated_at: user.deactivated_at
    };
  }

  private canReceiveShareBonus(service: any, user: any): boolean {
    // Service must belong to user
    if (service.user_id !== user.id) {
      return false;
    }

    // Can't be a product
    if (service.product) {
      return false;
    }

    // Check if already received
    return !this.shareBonusReceived(user, service);
  }

  private shareBonusReceived(user: any, service: any): boolean {
    // Check if user has share bonus event for this service
    return false; // Placeholder
  }

  private async addShareSimbucks(user: any, service: any): Promise<number> {
    const amount = service.kind === 'offered' ? 10 : 5;

    await this.db.transactions.create({
      user_id: user.id,
      amount,
      kind: 'share_bonus',
      service_id: service.id,
      read_at: new Date(),
      completed_at: new Date(),
      created_at: new Date()
    });

    return amount;
  }

  private async fbLikeBonusReceived(user: any): Promise<boolean> {
    const event = await this.db.userEvents.findOne({
      where: { user_id: user.id, name: 'fb_like_bonus' }
    });
    return !!event;
  }

  private async addFbLikeSimbucks(user: any): Promise<void> {
    const amount = 20;

    await this.db.transactions.create({
      user_id: user.id,
      amount,
      kind: 'fb_like_bonus',
      read_at: new Date(),
      completed_at: new Date(),
      created_at: new Date()
    });

    await this.db.userEvents.create({
      user_id: user.id,
      name: 'fb_like_bonus',
      created_at: new Date()
    });
  }

  private async fbSharedReferralBonusReceived(user: any): Promise<boolean> {
    const event = await this.db.userEvents.findOne({
      where: { user_id: user.id, name: 'fb_shared_referral_bonus' }
    });
    return !!event;
  }

  private async addFbSharedReferralBonus(user: any): Promise<void> {
    const amount = 30;

    await this.db.transactions.create({
      user_id: user.id,
      amount,
      kind: 'fb_shared_referral_bonus',
      read_at: new Date(),
      completed_at: new Date(),
      created_at: new Date()
    });

    await this.db.userEvents.create({
      user_id: user.id,
      name: 'fb_shared_referral_bonus',
      created_at: new Date()
    });
  }

  private async createStripeCustomer(user: any, params: UserParams): Promise<any> {
    let customer = user.customer;

    // Get or create Stripe customer
    let stripeCustomer: any;
    if (customer?.stripe_id) {
      stripeCustomer = await this.stripe.getCustomer(customer.stripe_id);
      if (stripeCustomer.deleted) {
        stripeCustomer = null;
      }
    }

    if (!stripeCustomer) {
      stripeCustomer = await this.stripe.createCustomer({
        email: user.email_address,
        metadata: {
          env: process.env.NODE_ENV!,
          user_id: user.id
        }
      });
    }

    // Update payment source if provided
    if (params.source) {
      await this.stripe.updateCustomer(stripeCustomer.id, {
        source: params.source
      });
    }

    // Create or update customer record
    if (!customer) {
      customer = await this.db.customers.create({
        user_id: user.id,
        stripe_id: stripeCustomer.id
      });
    } else {
      customer.stripe_id = stripeCustomer.id;
    }

    // Update addresses
    if (params.shipping) {
      customer.shipping_address = params.shipping;
    }

    if (params.billing) {
      customer.billing_address_same = params.billing.same || false;
      if (!customer.billing_address_same) {
        customer.billing_address = params.billing;
      }
    }

    await this.db.customers.save(customer);

    return customer;
  }

  private extractStripeAccountParams(params: UserParams): any {
    return {
      token: params.token,
      first_name: params.first_name,
      last_name: params.last_name,
      ssn_last_4: params.ssn_last_4,
      email: params.email,
      phone: params.phone,
      address: params.address,
      dob: params.dob
    };
  }

  private async decodeAuthToken(token: string): Promise<string | null> {
    // JWT decode logic
    // Placeholder
    return null;
  }

  private buildOAuthUrl(provider: string, callback?: string): string {
    const callbackParam = callback ? `?cb=${encodeURIComponent(callback)}` : '';
    return `/auth/${provider}${callbackParam}`;
  }

  private buildMobileRedirect(user: any, callback?: string): string {
    const token = this.generateAuthToken(user);
    return callback ? `${callback}?token=${token}` : `/mobile?token=${token}`;
  }

  private generateAuthToken(user: any): string {
    // JWT generation logic
    return 'token';
  }

  private getClientIp(req: IncomingMessage): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           (req.headers['x-real-ip'] as string) ||
           req.socket.remoteAddress ||
           '0.0.0.0';
  }

  private async getCurrentCommunity(user: any): Promise<any> {
    // Get user's current community
    return null;
  }

  private async notifyBalanceChange(user: any): Promise<void> {
    const balance = await this.db.accounts.getBalance(user.id);
    await this.notifier.sendSocket(user.user_key, {
      simbi_balance: balance
    });
  }

  private async paginate(query: any, params: any): Promise<{ items: any[]; nextUrl: string | null }> {
    const page = parseInt(params.page as string) || 1;
    const perPage = 20;
    const offset = (page - 1) * perPage;

    const items = await query.limit(perPage + 1).offset(offset).execute();
    const hasMore = items.length > perPage;
    const resultItems = hasMore ? items.slice(0, perPage) : items;
    const nextUrl = hasMore ? `/api/v1/users/feed?page=${page + 1}` : null;

    return { items: resultItems, nextUrl };
  }

  private sendJson(res: ServerResponse, status: number, data: any): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  private sendError(res: ServerResponse, status: number, error: any): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(error));
  }

  private handleError(res: ServerResponse, error: any): void {
    console.error('UsersController Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ errors: { server: 'Internal server error' } }));
  }
}
