# Setup Instructions

Complete setup guide for Synkt development on Windows and macOS.

## Prerequisites

### All Platforms
- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **pnpm** 8.0.0 or higher
  ```bash
  npm install -g pnpm
  ```
- **Git** for version control
- **MongoDB** (local or MongoDB Atlas)
  - Local: [Download MongoDB Community](https://www.mongodb.com/try/download/community)
  - Cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available)

### Mobile Development

#### macOS (for iOS development)
- **Xcode** 14+ from the Mac App Store
- **Xcode Command Line Tools**
  ```bash
  xcode-select --install
  ```
- **CocoaPods** (for iOS dependencies)
  ```bash
  sudo gem install cocoapods
  ```
- **Watchman** (recommended)
  ```bash
  brew install watchman
  ```

#### Windows (for Android development)
- **Android Studio** ([Download](https://developer.android.com/studio))
- **Android SDK** (installed via Android Studio)
- **Java Development Kit (JDK)** 11 or higher

#### Both Platforms
- **Expo CLI**
  ```bash
  npm install -g expo-cli
  ```

## Initial Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd synkt

# Install all dependencies
pnpm install
```

This will install dependencies for all workspaces (mobile, backend, shared).

### 2. MongoDB Setup

#### Option A: Local MongoDB (Recommended for Development)

**Windows:**
1. Download MongoDB Community Server
2. Install with default settings
3. MongoDB will run as a Windows service on `mongodb://localhost:27017`

**macOS:**
```bash
# Install via Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify it's running
mongosh
```

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Whitelist your IP address
5. Create a database user

### 3. Backend Configuration

```bash
cd apps/backend

# Copy environment template
cp .env.example .env

# Edit .env with your values
```

**Required environment variables:**

```env
# Database
MONGODB_URI=mongodb://localhost:27017/synkt
# Or for Atlas: mongodb+srv://username:password@cluster.mongodb.net/synkt

# JWT (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d

# Server
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8081
```

**For Google Calendar integration (later):**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add credentials to `.env`:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
   ```

### 4. Mobile App Configuration

```bash
cd apps/mobile

# Create app.config.js if needed (already exists from template)
```

The mobile app uses Expo's managed workflow, so most configuration is handled automatically.

## Running the Application

### Development Mode (Recommended)

From the root directory:

```bash
# Start both mobile and backend concurrently
pnpm dev
```

### Individual Services

**Backend only:**
```bash
cd apps/backend
pnpm start:dev

# API available at http://localhost:3000
# Swagger docs at http://localhost:3000/api
```

**Mobile only:**
```bash
cd apps/mobile
pnpm start

# Then press:
# - 'i' for iOS simulator (macOS only)
# - 'a' for Android emulator
# - 'w' for web browser
```

## Platform-Specific Setup

### iOS (macOS only)

1. **Install iOS Simulator:**
   - Open Xcode
   - Go to Xcode → Preferences → Components
   - Download iOS simulators

2. **Run on iOS:**
   ```bash
   cd apps/mobile
   pnpm ios
   ```

3. **First time setup:**
   - Expo will install CocoaPods dependencies
   - This may take 5-10 minutes on first run

### Android (Windows or macOS)

1. **Setup Android Studio:**
   - Install Android Studio
   - Open SDK Manager (Tools → SDK Manager)
   - Install Android SDK Platform 33 (or latest)
   - Install Android SDK Build-Tools
   - Install Android Emulator

2. **Configure Environment Variables:**

   **Windows (PowerShell):**
   ```powershell
   [System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\YourUsername\AppData\Local\Android\Sdk', 'User')
   ```

   **macOS/Linux:**
   ```bash
   # Add to ~/.zshrc or ~/.bashrc
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

3. **Create Android Virtual Device (AVD):**
   - Open Android Studio
   - Tools → Device Manager
   - Create Virtual Device
   - Select a device (e.g., Pixel 5)
   - Download and select a system image (e.g., Android 13)

4. **Run on Android:**
   ```bash
   cd apps/mobile
   pnpm android
   ```

## Verification

### Backend Health Check

```bash
# Test API is running
curl http://localhost:3000

# View Swagger documentation
# Open http://localhost:3000/api in your browser
```

### Mobile App

1. Start the Expo dev server
2. Scan QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app
3. App should load on your device

## Troubleshooting

### Common Issues

**"Cannot connect to MongoDB"**
- Ensure MongoDB is running: `mongosh` (should connect)
- Check `MONGODB_URI` in `.env`
- For Atlas: verify IP whitelist and credentials

**"Module not found" errors**
- Clear node_modules and reinstall:
  ```bash
  rm -rf node_modules
  pnpm install
  ```

**Expo "Unable to resolve module"**
- Clear Expo cache:
  ```bash
  cd apps/mobile
  pnpm start --clear
  ```

**iOS build fails**
- Clean CocoaPods:
  ```bash
  cd apps/mobile/ios
  pod deintegrate
  pod install
  ```

**Android emulator won't start**
- Ensure virtualization is enabled in BIOS
- Check Android Studio → AVD Manager for emulator status

### Getting Help

- Check the [Architecture docs](./ARCHITECTURE.md) for system design
- Review [API documentation](./API.md) for endpoint details
- See [Calendar Integration](./CALENDAR_INTEGRATION.md) for OAuth setup

## Next Steps

1. ✅ Verify backend is running at `http://localhost:3000/api`
2. ✅ Verify mobile app loads on simulator/emulator
3. 📖 Read the [Architecture documentation](./ARCHITECTURE.md)
4. 🔧 Set up Google Calendar OAuth (see [Calendar Integration](./CALENDAR_INTEGRATION.md))
5. 💻 Start developing!
