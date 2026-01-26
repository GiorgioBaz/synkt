import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: [
        'email',
        'profile',
        'https://www.googleapis.com/auth/calendar.readonly',
      ],
      accessType: 'offline',
      prompt: 'consent',
    });
  }

  authorizationParams(): { [key: string]: string } {
    return {
      access_type: 'offline',
      prompt: 'consent',
    };
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { name, emails, id } = profile;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const email = emails[0].value;

    let user = await this.usersService.findByEmail(email);

    if (!user) {
      user = await this.usersService.create({
        email,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        name: `${name.givenName} ${name.familyName}`,
        authProvider: 'google',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        authProviderId: id,
        googleCalendarRefreshToken: refreshToken,
        timezone: 'UTC', // Default, should be updated by client
      });
    } else if (refreshToken) {
      // Update refresh token if provided (Google only sends it on first auth usually)
      await this.usersService.updateGoogleRefreshToken(
        (user as any)._id,
        refreshToken,
      );
    }

    done(null, user);
  }
}
