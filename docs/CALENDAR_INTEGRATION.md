# Calendar Integration Guide

This guide covers setting up Google Calendar API and Apple EventKit integration for Synkt.

## Overview

Synkt integrates with two calendar systems:

- **Google Calendar** - OAuth 2.0 API (Android, iOS, Web)
- **Apple Calendar** - EventKit framework (iOS only, native)

## Google Calendar Integration

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: "Synkt" (or your preferred name)
4. Click "Create"

### 2. Enable Google Calendar API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

### 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (unless you have a Google Workspace)
3. Click "Create"

**App Information:**
- App name: `Synkt`
- User support email: Your email
- Developer contact: Your email

**Scopes:**
- Click "Add or Remove Scopes"
- Add: `https://www.googleapis.com/auth/calendar.readonly`
- This allows reading calendar events (not modifying)

**Test Users (during development):**
- Add your Gmail address
- Add teammate's Gmail address

Click "Save and Continue"

### 4. Create OAuth 2.0 Credentials

#### For Backend (Server-side)

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "Synkt Backend"

**Authorized redirect URIs:**
```
http://localhost:3000/auth/google/callback
```

5. Click "Create"
6. **Save the Client ID and Client Secret**

#### For Mobile App (iOS/Android)

1. Click "Create Credentials" → "OAuth client ID"
2. Application type: "iOS" (create one for iOS)
3. Name: "Synkt iOS"
4. Bundle ID: Your app's bundle ID (e.g., `com.yourcompany.synkt`)

Repeat for Android:
1. Application type: "Android"
2. Name: "Synkt Android"
3. Package name: Your app's package name
4. SHA-1 certificate fingerprint:
   ```bash
   # Get debug keystore SHA-1
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

### 5. Configure Backend

Add to `apps/backend/.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### 6. Configure Mobile App

Create `apps/mobile/.env`:

```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Update `apps/mobile/app.config.js`:

```javascript
export default {
  expo: {
    // ... other config
    scheme: "synkt",
    ios: {
      bundleIdentifier: "com.yourcompany.synkt",
      config: {
        googleSignIn: {
          reservedClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID
        }
      }
    },
    android: {
      package: "com.yourcompany.synkt"
    }
  }
}
```

### 7. Implementation (Backend)

Create Google OAuth strategy (future implementation):

```typescript
// apps/backend/src/auth/strategies/google.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile', 'https://www.googleapis.com/auth/calendar.readonly'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, id } = profile;
    const user = {
      email: emails[0].value,
      name: `${name.givenName} ${name.familyName}`,
      authProvider: 'google',
      authProviderId: id,
      googleCalendarRefreshToken: refreshToken,
    };
    done(null, user);
  }
}
```

### 8. Implementation (Mobile)

```typescript
// apps/mobile/services/googleAuth.ts
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    scopes: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.readonly'],
  });

  return { request, response, promptAsync };
}
```

### 9. Fetching Calendar Events

Backend service to fetch Google Calendar events:

```typescript
// apps/backend/src/calendar/google-calendar.service.ts
import { google } from 'googleapis';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleCalendarService {
  async getEvents(refreshToken: string, startDate: Date, endDate: Date) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    // Extract busy blocks
    const busyBlocks = response.data.items.map(event => ({
      start: new Date(event.start.dateTime || event.start.date),
      end: new Date(event.end.dateTime || event.end.date),
    }));

    return busyBlocks;
  }
}
```

---

## Apple Calendar Integration (iOS)

Apple Calendar uses the native EventKit framework, accessed through Expo's `expo-calendar` module.

### 1. Request Permissions

Add to `apps/mobile/app.config.js`:

```javascript
export default {
  expo: {
    // ... other config
    ios: {
      infoPlist: {
        NSCalendarsUsageDescription: "Synkt needs access to your calendar to find the best times to meet with friends."
      }
    }
  }
}
```

### 2. Implementation (Mobile)

```typescript
// apps/mobile/services/appleCalendar.ts
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export async function requestCalendarPermissions() {
  if (Platform.OS !== 'ios') return false;

  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

export async function getCalendarEvents(startDate: Date, endDate: Date) {
  if (Platform.OS !== 'ios') return [];

  // Get all calendars
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  
  // Get default calendar
  const defaultCalendar = calendars.find(cal => cal.isPrimary) || calendars[0];
  
  if (!defaultCalendar) return [];

  // Fetch events
  const events = await Calendar.getEventsAsync(
    [defaultCalendar.id],
    startDate,
    endDate
  );

  // Extract busy blocks
  const busyBlocks = events.map(event => ({
    start: new Date(event.startDate),
    end: new Date(event.endDate),
  }));

  return busyBlocks;
}
```

### 3. Sync Flow

```typescript
// apps/mobile/services/calendarSync.ts
import { Platform } from 'react-native';
import { getCalendarEvents, requestCalendarPermissions } from './appleCalendar';
import axios from 'axios';

export async function syncCalendar(userId: string) {
  if (Platform.OS === 'ios') {
    // Apple Calendar (EventKit)
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      throw new Error('Calendar permission denied');
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Next 30 days

    const busyBlocks = await getCalendarEvents(startDate, endDate);

    // Send to backend
    await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/calendar/sync`, {
      userId,
      provider: 'apple',
      busyBlocks,
    });
  } else {
    // Google Calendar (handled via OAuth in backend)
    // Mobile app just triggers the sync
    await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/calendar/sync-google`, {
      userId,
    });
  }
}
```

---

## Data Privacy

### What We Store

✅ **Stored:**
- Start and end times of busy blocks
- Date of events

❌ **NOT Stored:**
- Event titles
- Event descriptions
- Event locations
- Attendee information
- Any other event metadata

### Why This Approach?

- **Privacy**: Users' calendar details remain private
- **Security**: Less sensitive data to protect
- **Compliance**: Easier GDPR/privacy law compliance
- **Performance**: Smaller data footprint

---

## Testing Calendar Integration

### Mock Data for Development

Use the mock endpoint to generate test availability:

```bash
# Generate 7 days of mock data for a user
curl -X POST "http://localhost:3000/calendar/mock/USER_ID?days=7"
```

This creates realistic busy blocks without needing actual calendar access.

### Testing Google Calendar

1. Ensure you're added as a test user in Google Cloud Console
2. Use your Google account to sign in
3. Grant calendar permissions
4. Backend should receive refresh token
5. Verify events are synced to database

### Testing Apple Calendar (iOS)

1. Run app on iOS simulator or device
2. Tap "Sync Calendar"
3. Grant calendar permission when prompted
4. App fetches events via EventKit
5. Sends busy blocks to backend
6. Verify in database

---

## Troubleshooting

### Google Calendar Issues

**"Access blocked: This app's request is invalid"**
- Ensure OAuth consent screen is configured
- Add your email as a test user
- Verify redirect URI matches exactly

**"Invalid grant" error**
- Refresh token may have expired
- User needs to re-authenticate
- Check token storage in database

**No events returned**
- Verify calendar has events in the date range
- Check API scopes include `calendar.readonly`
- Ensure calendar is not empty

### Apple Calendar Issues

**Permission denied**
- Check `NSCalendarsUsageDescription` in app.config.js
- User may have denied permission in Settings
- Go to Settings → Privacy → Calendars → Synkt

**No events returned**
- Verify iOS Calendar app has events
- Check date range is correct
- Ensure calendar is not hidden

**EventKit not available**
- Only works on iOS devices/simulators
- Not available on Android or web

---

## Production Considerations

### Google Calendar

1. **Publish OAuth App:**
   - Submit for Google verification
   - Provide privacy policy
   - Explain calendar data usage

2. **Refresh Token Management:**
   - Store securely (encrypted at rest)
   - Handle token expiration
   - Implement token refresh logic

3. **Rate Limiting:**
   - Google Calendar API has quotas
   - Implement exponential backoff
   - Cache calendar data

### Apple Calendar

1. **App Store Review:**
   - Clearly explain calendar usage
   - Show permission prompt in screenshots
   - Provide test account

2. **Background Sync:**
   - Use background fetch for periodic sync
   - Respect battery life
   - Notify user of sync status

---

## Future Enhancements

- **Selective Calendar Sync**: Let users choose which calendars to sync
- **Real-time Updates**: Webhook notifications for calendar changes
- **Recurring Events**: Better handling of recurring event patterns
- **All-day Events**: Special handling for all-day events
- **Multiple Calendars**: Sync from multiple calendar accounts
- **Outlook Integration**: Support for Microsoft calendars
