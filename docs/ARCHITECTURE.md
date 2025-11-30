# Architecture Documentation

## System Overview

Synkt is a mobile-first calendar synchronization application built as a monorepo with a React Native frontend and NestJS backend. The system helps friend groups find optimal meeting times by aggregating calendar availability and applying smart recommendation algorithms.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (Expo)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Expo       │  │   Zustand    │  │  Expo Router │     │
│  │   SDK 54     │  │    State     │  │  Navigation  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Backend API (NestJS)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Auth      │  │   Calendar   │  │    Groups    │     │
│  │   Module     │  │    Module    │  │    Module    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ Mongoose ODM
                         │
┌────────────────────────▼────────────────────────────────────┐
│                      MongoDB Database                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Users     │  │ Availability │  │    Groups    │     │
│  │  Collection  │  │  Collection  │  │  Collection  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘

External Services:
┌──────────────────┐  ┌──────────────────┐
│  Google Calendar │  │  Apple EventKit  │
│       API        │  │   (iOS Native)   │
└──────────────────┘  └──────────────────┘
```

## Technology Stack

### Frontend (Mobile App)

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **React Native** | Cross-platform mobile framework | Single codebase for iOS and Android |
| **Expo SDK 54** | Development platform | Faster development, built-in modules |
| **Expo Router** | File-based routing | Simpler navigation, automatic deep linking |
| **Zustand** | State management | Lightweight, simple API, no boilerplate |
| **TypeScript** | Type safety | Catch errors early, better DX |
| **Axios** | HTTP client | Promise-based, interceptors support |

### Backend (API Server)

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **NestJS** | Node.js framework | Modular architecture, TypeScript-first |
| **MongoDB** | Database | Flexible schema, good for rapid iteration |
| **Mongoose** | ODM | Schema validation, middleware support |
| **Passport** | Authentication | OAuth strategy support |
| **Swagger** | API documentation | Auto-generated docs, testing interface |

### Shared

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **pnpm** | Package manager | Fast, efficient, monorepo support |
| **TypeScript** | Type system | Shared types across frontend/backend |
| **ESLint/Prettier** | Code quality | Consistent code style |

## Data Models

### User Schema

```typescript
{
  _id: ObjectId,
  email: string,                    // Unique identifier
  name: string,                     // Display name
  authProvider: 'google' | 'apple', // OAuth provider
  authProviderId: string,           // Provider's user ID
  timezone: string,                 // System timezone
  googleCalendarRefreshToken?: string,
  appleCalendarEnabled: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Design decisions:**
- Email as unique identifier for easy lookup
- Store refresh tokens for Google Calendar API access
- Boolean flag for Apple Calendar (uses EventKit, no tokens needed)
- Timezone captured from device for future use

### Availability Schema

```typescript
{
  _id: ObjectId,
  userId: ObjectId,                 // Reference to User
  date: Date,                       // Specific day (normalized to start of day)
  busyBlocks: [{
    start: Date,
    end: Date
  }],
  lastSyncedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Design decisions:**
- Store only busy blocks, not full event details (privacy)
- One document per user per day for efficient queries
- Compound index on `(userId, date)` for fast lookups
- `lastSyncedAt` tracks data freshness

### Group Schema

```typescript
{
  _id: ObjectId,
  name: string,
  createdBy: ObjectId,              // Reference to User
  members: [{
    userId: ObjectId,
    joinedAt: Date,
    hasConfirmedAvailability: boolean
  }],
  maxMembers: number,               // Default: 6
  proposedTimes: [{
    date: Date,
    startTime: string,              // e.g., "18:00"
    availableMembers: [ObjectId],   // Users free at this time
    votes: [{
      userId: ObjectId,
      vote: 'yes' | 'no' | 'maybe'
    }]
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Design decisions:**
- Embedded members array (small, frequently accessed together)
- Proposed times calculated on-demand, cached in document
- One vote per user per time slot
- Available members tracked for partial match display

## Module Architecture

### Backend Modules

#### UsersModule
**Responsibilities:**
- User CRUD operations
- Profile management
- OAuth provider lookups

**Key Services:**
- `UsersService`: Database operations
- `UsersController`: REST endpoints

#### CalendarModule
**Responsibilities:**
- Calendar sync orchestration
- Availability storage and retrieval
- Best time calculation algorithm

**Key Services:**
- `CalendarService`: Core calendar logic
- `CalendarController`: REST endpoints

**Algorithm: Finding Best Times**
```typescript
1. Get availability for all group members
2. For each day in date range:
   a. For each hour slot (9am-6pm):
      - Check if slot overlaps with any busy block
      - Count available members
   b. If ≥50% members available, add to results
3. Sort by number of available members (descending)
4. Return top 10 results
```

#### GroupsModule
**Responsibilities:**
- Group creation and management
- Member invitations
- Voting/RSVP system
- Trigger best time calculations

**Key Services:**
- `GroupsService`: Group operations, voting logic
- `GroupsController`: REST endpoints

**Dependencies:**
- Uses `CalendarService` for best time calculations

## API Design

### RESTful Principles

- Resource-based URLs: `/users`, `/groups`, `/calendar`
- HTTP methods: GET (read), POST (create), PUT/PATCH (update), DELETE
- Status codes: 200 (success), 201 (created), 400 (bad request), 404 (not found)
- JSON request/response bodies

### Authentication Flow

```
1. User clicks "Sign in with Google/Apple" in mobile app
2. Mobile app initiates OAuth flow via expo-auth-session
3. User authenticates with provider
4. Provider returns authorization code
5. Mobile app sends code to backend /auth/google or /auth/apple
6. Backend exchanges code for access token + user info
7. Backend creates/updates user in database
8. Backend returns JWT token to mobile app
9. Mobile app stores JWT in secure storage
10. Mobile app includes JWT in Authorization header for all requests
```

### Calendar Sync Flow

**Google Calendar:**
```
1. User grants calendar permission in mobile app
2. Mobile app sends OAuth token to backend
3. Backend calls Google Calendar API
4. Backend fetches events for date range
5. Backend extracts busy time blocks
6. Backend stores in Availability collection
7. Backend returns success to mobile app
```

**Apple Calendar (iOS):**
```
1. User grants calendar permission in mobile app
2. Mobile app uses expo-calendar (EventKit wrapper)
3. Mobile app fetches events locally
4. Mobile app extracts busy time blocks
5. Mobile app sends busy blocks to backend
6. Backend stores in Availability collection
```

## Security Considerations

### Current Implementation (MVP)

- **Authentication**: OAuth 2.0 (Google, Apple)
- **Authorization**: JWT tokens
- **Data Privacy**: Store only busy/free blocks, not event details
- **CORS**: Restricted to frontend URL
- **Input Validation**: class-validator on all DTOs

### Future Enhancements

- Rate limiting
- Refresh token rotation
- End-to-end encryption for calendar data
- RBAC for group permissions
- Audit logging

## Performance Considerations

### Database Indexes

```javascript
// Availability collection
{ userId: 1, date: 1 }  // Compound index for user availability queries

// Groups collection
{ createdBy: 1 }        // Find groups by creator
{ 'members.userId': 1 } // Find groups by member
```

### Caching Strategy (Future)

- Cache proposed times in Group document (already implemented)
- Redis for session storage
- CDN for static assets

### Scalability

**Current (MVP):**
- Single MongoDB instance
- Single NestJS server
- Suitable for <10,000 users

**Future:**
- MongoDB replica set for high availability
- Horizontal scaling of API servers
- Message queue (Bull/Redis) for async calendar syncs
- Separate read/write databases

## Development Workflow

### Monorepo Structure

```
synkt/
├── apps/
│   ├── mobile/          # Expo app
│   │   ├── app/         # Expo Router pages
│   │   ├── components/  # React components
│   │   ├── stores/      # Zustand stores
│   │   └── services/    # API clients
│   └── backend/         # NestJS app
│       ├── src/
│       │   ├── users/
│       │   ├── calendar/
│       │   └── groups/
│       └── test/
├── packages/
│   └── shared/          # Shared types
│       ├── types/
│       └── utils/
└── docs/
```

### Code Sharing

- **Types**: Defined once in `packages/shared`, imported by both apps
- **Utilities**: Date/time helpers shared across frontend/backend
- **Validation**: Same DTOs used for API contracts

### Testing Strategy (Future)

**Backend:**
- Unit tests: Services (Jest)
- Integration tests: Controllers + Database (Jest + Supertest)
- E2E tests: Full API flows

**Mobile:**
- Component tests: React Native Testing Library
- Integration tests: Navigation flows
- E2E tests: Detox (iOS/Android)

## Deployment Architecture (Future)

```
┌─────────────────┐
│   App Store /   │
│  Google Play    │
└────────┬────────┘
         │
┌────────▼────────┐
│  Mobile Users   │
└────────┬────────┘
         │ HTTPS
┌────────▼────────────────────┐
│   Load Balancer (AWS ALB)   │
└────────┬────────────────────┘
         │
    ┌────┴────┐
┌───▼───┐ ┌───▼───┐
│ API 1 │ │ API 2 │  (Auto-scaling)
└───┬───┘ └───┬───┘
    └────┬────┘
┌────────▼────────┐
│  MongoDB Atlas  │
│  (Replica Set)  │
└─────────────────┘
```

## Decision Log

### Why Expo over bare React Native?
- **Faster development**: Pre-configured modules
- **OTA updates**: Push updates without app store review
- **Managed workflow**: Less native code to maintain
- **Trade-off**: Some native modules unavailable (acceptable for MVP)

### Why NestJS over Express?
- **Structure**: Opinionated architecture scales better
- **TypeScript**: First-class support
- **Modules**: Built-in dependency injection
- **Trade-off**: Slightly more boilerplate (worth it for maintainability)

### Why MongoDB over PostgreSQL?
- **Flexibility**: Schema changes during rapid iteration
- **Developer velocity**: Faster prototyping
- **Document model**: Natural fit for nested data (groups, votes)
- **Trade-off**: Less strict data integrity (acceptable for MVP)

### Why Zustand over Redux?
- **Simplicity**: Minimal boilerplate
- **Performance**: No context provider overhead
- **Learning curve**: Easier for new developers
- **Trade-off**: Less ecosystem tooling (acceptable for MVP scope)

### Why file-based routing (Expo Router)?
- **Convention over configuration**: Less setup code
- **Deep linking**: Automatic URL handling
- **Type safety**: Auto-generated navigation types
- **Trade-off**: Less flexibility (acceptable for standard navigation patterns)
