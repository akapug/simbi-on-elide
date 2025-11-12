/**
 * Services Controller
 *
 * Handles service listing and management
 */

import { Request, Response } from 'express';
import { getViewRenderer } from '../lib/views';

export class ServicesController {
  /**
   * Services index / Main feed
   */
  async index(req: Request, res: Response) {
    const renderer = getViewRenderer();

    // Mock data - would come from database
    const serviceGroups = [
      {
        title: 'Popular Services',
        services: [],
        sectionClass: 'teal'
      },
      {
        title: 'Recent Services',
        services: [],
        sectionClass: ''
      }
    ];

    const collections = [
      { id: 1, name: 'Wellness', slug: 'wellness' },
      { id: 2, name: 'Education', slug: 'education' }
    ];

    try {
      const html = await renderer.render('services/index', {
        locals: {
          currentUser: req.user,
          serviceGroups,
          collections,
          badges: [],
          showFirstDealModal: false,
          impersonation: false,
          gon: {
            firstDeal: null
          },
          env: process.env.NODE_ENV,
          facebookAppId: process.env.FACEBOOK_APP_ID,
          bodyClass: 'services-page',
          contentClass: 'gray-background services-home',
          newseedPath: '/news-feed'
        }
      });

      res.send(html);
    } catch (error) {
      console.error('Error rendering services page:', error);
      res.status(500).send('Error rendering page');
    }
  }
}
