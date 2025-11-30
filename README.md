# Synkt

**Calendar sync app to help friends find the best times to meet**

Synkt automatically syncs calendars from Google and Apple, analyzes availability across friend groups, and recommends the optimal times for social events.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Or run individually
pnpm mobile    # Start Expo mobile app
pnpm backend   # Start NestJS API server
```

## 📁 Project Structure

This is a monorepo containing:

- **`apps/mobile`** - React Native mobile app (Expo with Expo Router)
- **`apps/backend`** - NestJS API server
- **`packages/shared`** - Shared TypeScript types and utilities

## 📚 Documentation

- [Setup Instructions](./docs/SETUP.md) - Detailed setup for Windows and macOS
- [Architecture](./docs/ARCHITECTURE.md) - System design and technical decisions
- [API Documentation](./docs/API.md) - REST API endpoints
- [Calendar Integration](./docs/CALENDAR_INTEGRATION.md) - Google/Apple calendar setup

## 🛠️ Tech Stack

### Mobile App
- **React Native** with Expo SDK 54
- **Expo Router** for file-based routing
- **Zustand** for state management
- **TypeScript** for type safety

### Backend
- **NestJS** with TypeScript
- **MongoDB** with Mongoose
- **Swagger** for API documentation
- **Passport** for OAuth authentication

### Shared
- **pnpm** workspaces for monorepo management
- **ESLint** and **Prettier** for code quality

## 🎯 MVP Features

- ✅ User authentication (Google/Apple OAuth)
- ✅ Calendar sync (Google Calendar API, iOS EventKit)
- ✅ Availability visualization
- ✅ Group creation (up to 6 members)
- ✅ Smart time recommendations
- ✅ RSVP/voting system

## 🔧 Development

### Prerequisites
- Node.js 18+
- pnpm 8+
- MongoDB (local or Atlas)
- Expo CLI
- iOS Simulator (macOS) or Android Emulator

### Environment Variables

Create `.env` files in both `apps/mobile` and `apps/backend`. See `.env.example` files for required variables.

## 📱 Running the Mobile App

```bash
# Start Expo dev server
cd apps/mobile
pnpm start

# Run on specific platform
pnpm ios      # iOS (macOS only)
pnpm android  # Android
pnpm web      # Web browser
```

## 🖥️ Running the Backend

```bash
# Start NestJS in watch mode
cd apps/backend
pnpm start:dev

# API will be available at http://localhost:3000
# Swagger docs at http://localhost:3000/api
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## 📄 License

Private - All rights reserved

## 👥 Team

Built with ❤️ by the Synkt team