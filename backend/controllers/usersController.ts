/**
 * Users Controller
 *
 * Handles user profile and related pages
 */

import { Request, Response } from 'express';
import { getViewRenderer } from '../lib/views';

export class UsersController {
  /**
   * User profile page
   */
  async showProfile(req: Request, res: Response) {
    const renderer = getViewRenderer();
    const userId = req.params.id;

    // Mock user data - would come from database
    const user = {
      id: userId,
      firstName: 'John',
      fullName: 'John Doe',
      email: 'john@example.com',
      userKey: 'user_123',
      globalKey: 'global_123',
      shortAddress: 'San Francisco, CA',
      registeredAt: new Date('2023-01-15'),
      about: 'Passionate about community building and skill sharing.',
      profileType: 'user',
      geocoded: true,
      location: { city: 'San Francisco' },
      communities: {
        withoutPrivate: [
          { id: 1, name: 'Tech Enthusiasts' }
        ]
      },
      websites: [
        { url: 'https://example.com', type: 'personal' }
      ],
      organization: false,
      registrationNumber: null
    };

    const userServices = {
      offered: [],
      requests: [],
      projects: [],
      products: []
    };

    const reviews = [];
    const wanteds = [
      { id: 1, name: 'Web Development' },
      { id: 2, name: 'Graphic Design' }
    ];

    const ownProfile = req.user && req.user.id === userId;

    try {
      const html = await renderer.render('users/profile_pages/show', {
        locals: {
          currentUser: req.user,
          user,
          userServices,
          reviews,
          wanteds,
          ownProfile,
          mayFlag: !ownProfile,
          gon: {
            flag: null,
            comments: null,
            recommendations: []
          },
          env: process.env.NODE_ENV,
          facebookAppId: process.env.FACEBOOK_APP_ID,
          bodyClass: 'profile-page',
          contentClass: 'profile-content',
          // Helper functions
          showVacationBanner: (user: any) => false,
          pathToReference: (user: any) => `/references/new?user_id=${user.id}`,
          userProfileState: (user: any) => null,
          formatUserText: (text: string) => {
            return text.replace(/\n/g, '<br>');
          },
          browser: {
            device: {
              mobile: req.headers['user-agent']?.includes('Mobile')
            }
          }
        }
      });

      res.send(html);
    } catch (error) {
      console.error('Error rendering profile page:', error);
      res.status(500).send('Error rendering page');
    }
  }
}
