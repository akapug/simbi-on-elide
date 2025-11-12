/**
 * Home Controller
 *
 * Handles home page routes
 */

import { Request, Response } from 'express';
import { getViewRenderer } from '../lib/views';

export class HomeController {
  /**
   * Home page / Landing page
   */
  async index(req: Request, res: Response) {
    const renderer = getViewRenderer();

    try {
      const html = await renderer.render('home/index', {
        locals: {
          currentUser: req.user,
          gon: {
            // Global data for client-side
          },
          env: process.env.NODE_ENV,
          facebookAppId: process.env.FACEBOOK_APP_ID,
          bodyClass: 'home-page',
          contentClass: 'home-content'
        }
      });

      res.send(html);
    } catch (error) {
      console.error('Error rendering home page:', error);
      res.status(500).send('Error rendering page');
    }
  }
}
