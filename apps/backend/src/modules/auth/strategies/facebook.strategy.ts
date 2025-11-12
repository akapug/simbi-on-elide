import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private config: ConfigService) {
    super({
      clientID: config.get('FACEBOOK_APP_ID'),
      clientSecret: config.get('FACEBOOK_APP_SECRET'),
      callbackURL: config.get('FACEBOOK_CALLBACK_URL'),
      scope: ['email'],
      profileFields: ['emails', 'name', 'photos'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    // Validate that email is provided - OAuth requires email permission
    if (!emails || !emails[0] || !emails[0].value) {
      return done(
        new Error('Email permission is required for authentication'),
        null,
      );
    }

    const user = {
      providerId: id,
      email: emails[0].value,
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      picture: photos?.[0]?.value || null,
      accessToken,
    };

    done(null, user);
  }
}
