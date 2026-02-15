import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'mobile',
  slug: config.slug ?? 'mobile',
  // We extend the base app.json configuration here
  // This allows us to keep static config in app.json and dynamic config (env vars) here
  ios: {
    ...config.ios,
    bundleIdentifier: "com.synkt.mobile",
    infoPlist: {
      ...config.ios?.infoPlist,
      NSCalendarsUsageDescription: "Synkt needs access to your calendar to find the best times to meet with friends."
    }
  },
  android: {
    ...config.android,
    package: "com.synkt.mobile"
  },
  plugins: [
    ...(config.plugins || []),
    [
      "expo-calendar",
      {
        "calendarPermission": "Synkt needs access to your calendar to find the best times to meet with friends."
      }
    ]
  ],
  extra: {
    ...config.extra,
    // Dynamically inject the API URL from environment variables
    // This supports development (Ngrok) and production (real domain) seamlessly
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    eas: {
      projectId: "your-project-id"
    }
  }
});
