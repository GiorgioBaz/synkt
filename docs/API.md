# API Documentation

Base URL: `http://localhost:3000`

Interactive Swagger documentation available at: `http://localhost:3000/api`

## Authentication

Most endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Users

#### Get User by ID
```http
GET /users/:id
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "authProvider": "google",
  "timezone": "America/New_York",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

### Calendar

#### Get User Availability
```http
GET /calendar/availability/:userId?startDate=2024-01-01&endDate=2024-01-07
```

**Query Parameters:**
- `startDate` (required): ISO date string
- `endDate` (required): ISO date string

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "date": "2024-01-01T00:00:00Z",
    "busyBlocks": [
      {
        "start": "2024-01-01T09:00:00Z",
        "end": "2024-01-01T10:00:00Z"
      },
      {
        "start": "2024-01-01T14:00:00Z",
        "end": "2024-01-01T15:00:00Z"
      }
    ],
    "lastSyncedAt": "2024-01-01T08:00:00Z"
  }
]
```

#### Generate Mock Availability Data
```http
POST /calendar/mock/:userId?days=7
```

**Query Parameters:**
- `days` (optional): Number of days to generate (default: 7)

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "date": "2024-01-01T00:00:00Z",
    "busyBlocks": [...],
    "lastSyncedAt": "2024-01-01T08:00:00Z"
  }
]
```

**Use case:** Generate test data for development and UI testing.

#### Find Best Meeting Times
```http
GET /calendar/best-times?userIds=id1,id2,id3&startDate=2024-01-01&endDate=2024-01-07&duration=60
```

**Query Parameters:**
- `userIds` (required): Comma-separated user IDs
- `startDate` (required): ISO date string
- `endDate` (required): ISO date string
- `duration` (optional): Meeting duration in minutes (default: 60)

**Response:**
```json
[
  {
    "date": "2024-01-03T00:00:00Z",
    "startTime": "18:00",
    "availableMembers": [
      "507f1f77bcf86cd799439011",
      "507f1f77bcf86cd799439012",
      "507f1f77bcf86cd799439013"
    ]
  },
  {
    "date": "2024-01-05T00:00:00Z",
    "startTime": "15:00",
    "availableMembers": [
      "507f1f77bcf86cd799439011",
      "507f1f77bcf86cd799439012"
    ]
  }
]
```

**Algorithm:**
- Returns times when ≥50% of members are available
- Sorted by number of available members (descending)
- Checks 24 hours for available slots

---

### Groups

#### Create Group
```http
POST /groups
```

**Request Body:**
```json
{
  "name": "Weekend Hangout",
  "createdBy": "507f1f77bcf86cd799439011",
  "memberIds": [
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"
  ]
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "name": "Weekend Hangout",
  "createdBy": "507f1f77bcf86cd799439011",
  "members": [
    {
      "userId": "507f1f77bcf86cd799439012",
      "joinedAt": "2024-01-15T10:30:00Z",
      "hasConfirmedAvailability": false
    },
    {
      "userId": "507f1f77bcf86cd799439013",
      "joinedAt": "2024-01-15T10:30:00Z",
      "hasConfirmedAvailability": false
    }
  ],
  "maxMembers": 6,
  "proposedTimes": [],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### Get Group by ID
```http
GET /groups/:id
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "name": "Weekend Hangout",
  "createdBy": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "members": [...],
  "proposedTimes": [...],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### Get Groups for User
```http
GET /groups/user/:userId
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439020",
    "name": "Weekend Hangout",
    "createdBy": {...},
    "members": [...],
    "proposedTimes": [...]
  }
]
```

Returns all groups where the user is either the creator or a member.

#### Calculate Best Times for Group
```http
POST /groups/:id/calculate-times?days=7
```

**Query Parameters:**
- `days` (optional): Number of days to look ahead (default: 7)

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "name": "Weekend Hangout",
  "proposedTimes": [
    {
      "date": "2024-01-18T00:00:00Z",
      "startTime": "18:00",
      "availableMembers": [
        "507f1f77bcf86cd799439011",
        "507f1f77bcf86cd799439012",
        "507f1f77bcf86cd799439013"
      ],
      "votes": []
    }
  ],
  ...
}
```

**Process:**
1. Fetches availability for all group members
2. Runs best time algorithm
3. Updates group's `proposedTimes` array
4. Returns updated group

#### Vote on Proposed Time
```http
POST /groups/:id/vote
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "timeIndex": 0,
  "vote": "yes"
}
```

**Parameters:**
- `userId`: ID of user voting
- `timeIndex`: Index in `proposedTimes` array (0-based)
- `vote`: One of `"yes"`, `"no"`, `"maybe"`

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "proposedTimes": [
    {
      "date": "2024-01-18T00:00:00Z",
      "startTime": "18:00",
      "availableMembers": [...],
      "votes": [
        {
          "userId": "507f1f77bcf86cd799439011",
          "vote": "yes"
        }
      ]
    }
  ],
  ...
}
```

**Rules:**
- One vote per user per time slot
- New vote replaces previous vote from same user

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Development Workflow

### Testing with Swagger

1. Start the backend: `pnpm --filter backend start:dev`
2. Open `http://localhost:3000/api` in your browser
3. Expand an endpoint and click "Try it out"
4. Fill in parameters and click "Execute"
5. View response

### Testing with cURL

**Create a user (via mock endpoint):**
```bash
curl -X POST http://localhost:3000/calendar/mock/507f1f77bcf86cd799439011?days=7
```

**Get availability:**
```bash
curl "http://localhost:3000/calendar/availability/507f1f77bcf86cd799439011?startDate=2024-01-01&endDate=2024-01-07"
```

**Find best times:**
```bash
curl "http://localhost:3000/calendar/best-times?userIds=507f1f77bcf86cd799439011,507f1f77bcf86cd799439012&startDate=2024-01-01&endDate=2024-01-07"
```

### Testing with Postman

1. Import the Swagger JSON from `http://localhost:3000/api-json`
2. Create a new environment with `baseUrl = http://localhost:3000`
3. Test endpoints

---

## Rate Limiting (Future)

Not implemented in MVP. Future implementation:

```typescript
// 100 requests per 15 minutes per IP
@UseGuards(ThrottlerGuard)
@Throttle(100, 900)
```

---

## Versioning (Future)

API versioning will be added when breaking changes are introduced:

```
/v1/users
/v2/users
```

Current API is considered v1 (implicit).
