/**
 * Talks Controller
 *
 * Handles messaging/inbox functionality
 */

import { Request, Response } from 'express';
import { getViewRenderer } from '../lib/views';

export class TalksController {
  /**
   * Inbox/messages page
   */
  async index(req: Request, res: Response) {
    const renderer = getViewRenderer();

    // Mock data for initial state
    const initialState = {
      conversations: [],
      currentConversation: null,
      user: req.user
    };

    try {
      const html = await renderer.render('talks/index', {
        locals: {
          currentUser: req.user,
          showWebPush: true,
          gon: {
            initialState
          },
          env: process.env.NODE_ENV,
          facebookAppId: process.env.FACEBOOK_APP_ID,
          bodyClass: 'talks-page',
          contentClass: 'no-padding-xs',
          userLayoutClass: 'no-padding-xs',
          browser: {
            device: {
              mobile: req.headers['user-agent']?.includes('Mobile')
            }
          }
        }
      });

      res.send(html);
    } catch (error) {
      console.error('Error rendering talks page:', error);
      res.status(500).send('Error rendering page');
    }
  }
}
