/**
 * Talk Model
 * Handles messaging/conversation database operations
 */

import { BaseModel } from './base-model';
import { Talk as ITalk, TalkUser, TalkItem, Message } from '../types';
import { QueryBuilder } from '../query-builder';

export class TalkModel extends BaseModel<ITalk> {
  protected tableName = 'talks' as const;

  /**
   * Get talks for a user
   */
  async getTalksForUser(userId: number, options?: {
    limit?: number;
    offset?: number;
    status?: number;
  }): Promise<Array<ITalk & { participants: any[] }>> {
    let query = `
      SELECT
        t.*,
        json_agg(
          json_build_object(
            'id', u.id,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'slug', u.slug,
            'avatar_file_name', u.avatar_file_name
          )
        ) as participants
      FROM talks t
      INNER JOIN talk_users tu ON t.id = tu.talk_id
      INNER JOIN users u ON tu.user_id = u.id
      WHERE t.id IN (
        SELECT talk_id FROM talk_users
        WHERE user_id = $1 AND deleted_at IS NULL
      )
      AND t.deleted_at IS NULL
      AND tu.deleted_at IS NULL
      AND u.deleted_at IS NULL
    `;

    const params: any[] = [userId];

    if (options?.status !== undefined) {
      query += ` AND t.status = $${params.length + 1}`;
      params.push(options.status);
    }

    query += ' GROUP BY t.id ORDER BY t.updated_at DESC';

    if (options?.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }

    if (options?.offset) {
      query += ` OFFSET $${params.length + 1}`;
      params.push(options.offset);
    }

    return this.query<ITalk & { participants: any[] }>(query, params);
  }

  /**
   * Get talk with messages
   */
  async getTalkWithMessages(talkId: number, userId: number): Promise<{
    talk: ITalk;
    messages: Array<Message & { author: any }>;
    participants: any[];
  } | null> {
    // Verify user is participant
    const participantQuery = `
      SELECT 1 FROM talk_users
      WHERE talk_id = $1 AND user_id = $2 AND deleted_at IS NULL
    `;

    const isParticipant = await this.queryOne(participantQuery, [talkId, userId]);

    if (!isParticipant) {
      return null;
    }

    // Get talk
    const talk = await this.findById(talkId);
    if (!talk) {
      return null;
    }

    // Get messages
    const messagesQuery = `
      SELECT
        m.*,
        json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'slug', u.slug,
          'avatar_file_name', u.avatar_file_name
        ) as author
      FROM messages m
      INNER JOIN talk_items ti ON m.id = ti.talk_itemable_id AND ti.talk_itemable_type = 'Message'
      INNER JOIN users u ON m.author_id = u.id
      WHERE ti.talk_id = $1
        AND m.deleted_at IS NULL
        AND ti.deleted_at IS NULL
      ORDER BY m.created_at ASC
    `;

    const messages = await this.query<Message & { author: any }>(messagesQuery, [talkId]);

    // Get participants
    const participantsQuery = `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.slug,
        u.avatar_file_name,
        u.rating,
        tu.read_at,
        tu.seen_at
      FROM talk_users tu
      INNER JOIN users u ON tu.user_id = u.id
      WHERE tu.talk_id = $1
        AND tu.deleted_at IS NULL
        AND u.deleted_at IS NULL
    `;

    const participants = await this.query(participantsQuery, [talkId]);

    return {
      talk,
      messages,
      participants,
    };
  }

  /**
   * Create a new talk between users
   */
  async createTalk(userIds: number[], serviceId?: number): Promise<ITalk> {
    return await this.transaction(async (client) => {
      // Create talk
      const talkQuery = QueryBuilder.insert('talks', {
        status: 0,
        initial_service_id: serviceId,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const talk = await client.query(talkQuery.text, talkQuery.params);
      const talkId = talk.rows[0].id;

      // Add participants
      for (const userId of userIds) {
        const participantQuery = QueryBuilder.insert('talk_users', {
          talk_id: talkId,
          user_id: userId,
          created_at: new Date(),
          updated_at: new Date(),
        });

        await client.query(participantQuery.text, participantQuery.params);
      }

      return talk.rows[0];
    });
  }

  /**
   * Add message to talk
   */
  async addMessage(
    talkId: number,
    authorId: number,
    content: string
  ): Promise<Message> {
    return await this.transaction(async (client) => {
      // Create message
      const messageQuery = QueryBuilder.insert('messages', {
        author_id: authorId,
        content,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const message = await client.query(messageQuery.text, messageQuery.params);
      const messageId = message.rows[0].id;

      // Create talk item
      const talkItemQuery = QueryBuilder.insert('talk_items', {
        talk_id: talkId,
        talk_itemable_id: messageId,
        talk_itemable_type: 'Message',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await client.query(talkItemQuery.text, talkItemQuery.params);

      // Update talk
      const updateTalkQuery = QueryBuilder.update(
        'talks',
        {
          last_talked_user_id: authorId,
          updated_at: new Date(),
        },
        { id: talkId }
      );

      await client.query(updateTalkQuery.text, updateTalkQuery.params);

      return message.rows[0];
    });
  }

  /**
   * Mark talk as read for user
   */
  async markAsRead(talkId: number, userId: number): Promise<void> {
    const query = `
      UPDATE talk_users
      SET read_at = NOW(), seen_at = NOW()
      WHERE talk_id = $1 AND user_id = $2
    `;

    await this.query(query, [talkId, userId]);
  }

  /**
   * Get unread talk count for user
   */
  async getUnreadCount(userId: number): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM talks t
      INNER JOIN talk_users tu ON t.id = tu.talk_id
      WHERE tu.user_id = $1
        AND tu.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND (tu.seen_at IS NULL OR t.updated_at > tu.seen_at)
    `;

    const result = await this.queryOne<{ count: string }>(query, [userId]);
    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Archive talk for user
   */
  async archiveTalk(talkId: number, userId: number): Promise<void> {
    const query = `
      UPDATE talk_users
      SET archived_at = NOW()
      WHERE talk_id = $1 AND user_id = $2
    `;

    await this.query(query, [talkId, userId]);
  }

  /**
   * Close talk
   */
  async closeTalk(talkId: number): Promise<ITalk> {
    return this.update(talkId, {
      status: 1, // Closed status
      closed_at: new Date(),
    });
  }

  /**
   * Helper method to execute queries in a transaction
   */
  private async transaction<T>(
    callback: (client: any) => Promise<T>
  ): Promise<T> {
    const { db } = require('../client');
    return await db.transaction(callback);
  }
}

// Export singleton instance
export const talkModel = new TalkModel();
