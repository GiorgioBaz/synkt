import { StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { calendarService } from '@/services/calendarService';
import Constants from 'expo-constants';
import { Availability } from '@synkt/shared';
import { Text, View } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function TabOneScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);

  const loadAvailabilities = async (id: string) => {
    try {
      const now = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(now.getDate() + 30);
      
      const data = await calendarService.getAvailability(id, now, thirtyDaysLater);
      setAvailabilities(data);
    } catch (error) {
      console.error('Failed to load availabilities:', error);
    }
  };

  const processUrl = async (url: string | null) => {
    if (!url) return;
    const { queryParams } = Linking.parse(url);
    if (queryParams?.userId) {
      const newUserId = queryParams.userId as string;
      await calendarService.saveUserId(newUserId);
      setUserId(newUserId);
      
      setSyncing(true);
      try {
        await calendarService.syncGoogleCalendar(newUserId);
        await loadAvailabilities(newUserId);
        Alert.alert('Success', 'Calendar synced successfully!');
      } catch (error) {
        Alert.alert('Error', 'Failed to sync calendar.');
        console.error('Sync error:', error);
      } finally {
        setSyncing(false);
      }
    }
  };

  useEffect(() => {
    // Check for existing user
    calendarService.getUserId().then((id) => {
      if (id) {
        setUserId(id);
        loadAvailabilities(id);
      }
    });

    // 1. Handle Cold Start (App launched from link)
    Linking.getInitialURL().then(processUrl);

    // 2. Handle Running Redirects
    const subscription = Linking.addEventListener('url', (event) => processUrl(event.url));
    
    return () => subscription.remove();
  }, []);

  const handleConnect = async () => {
    const authUrl = `${API_URL}/auth/google`;
    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, 'mobile://auth-success');
      
      if (result.type === 'success') {
        processUrl(result.url);
      }
    } catch (error) {
      console.error('WebBrowser error:', error);
      Alert.alert('Error', 'Could not open login browser.');
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>Sync your availability</Text>
      </View>

      {userId ? (
        <View style={styles.content}>
          <View style={[styles.card, styles.connectionCard]}>
            <View style={styles.cardHeader}>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Connected</Text>
              </View>
              <MaterialCommunityIcons name="google" size={24} color="#4285F4" />
            </View>
            <Text style={styles.userIdLabel}>Connected Account ID</Text>
            <Text style={styles.userIdValue}>{userId.slice(-12)}</Text>
            
            <Pressable 
              style={({pressed}) => [
                styles.syncButton, 
                pressed && styles.buttonPressed,
                syncing && styles.buttonDisabled
              ]}
              onPress={async () => {
                setSyncing(true);
                await calendarService.syncGoogleCalendar(userId);
                await loadAvailabilities(userId);
                setSyncing(false);
                Alert.alert('Success', 'Calendar synced successfully!');
              }}
              disabled={syncing}
            >
              <MaterialCommunityIcons 
                name={syncing ? "sync" : "refresh"} 
                size={20} 
                color="white" 
                style={syncing ? styles.spinning : undefined} 
              />
              <Text style={styles.syncButtonText}>
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Busy Slots</Text>
            <Text style={styles.sectionBadge}>{availabilities.filter(a => a.busyBlocks.length > 0).length} Days</Text>
          </View>

          {availabilities.filter(a => a.busyBlocks.length > 0).length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No busy events found for the next 30 days.</Text>
            </View>
          ) : (
            availabilities
              .filter(day => day.busyBlocks.length > 0)
              .slice(0, 7)
              .map((day, i) => (
                <View key={i} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayDate}>
                      {new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.blocksContainer}>
                    {day.busyBlocks.map((block, bi) => (
                      <View key={bi} style={styles.blockRow}>
                        <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
                        <Text style={styles.blockTime}>
                          {new Date(block.start).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} - {new Date(block.end).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
          )}

          <Pressable 
            style={({pressed}) => [styles.disconnectButton, pressed && styles.opacityPressed]}
            onPress={() => {
              Alert.alert(
                'Disconnect',
                'Are you sure you want to disconnect your Google Calendar?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Disconnect', 
                    style: 'destructive',
                    onPress: () => {
                      calendarService.clearUserId();
                      setUserId(null);
                      setAvailabilities([]);
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.disconnectText}>Disconnect Account</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.welcomeContainer}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="calendar-sync" size={40} color="#4285F4" />
          </View>
          <Text style={styles.welcomeTitle}>Connect Your Calendar</Text>
          <Text style={styles.welcomeDesc}>
            Synkt uses your calendar to show when you're busy, helping you find the perfect time to meet without the back-and-forth.
          </Text>
          
          <Pressable 
            style={({pressed}) => [styles.googleButton, pressed && styles.buttonPressed]}
            onPress={handleConnect}
          >
            <MaterialCommunityIcons name="google" size={20} color="white" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </Pressable>
          
          <Text style={styles.privacyNote}>
            We only store your busy time blocks. Your event titles and details are never saved.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: 'black',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F0F0F0',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  content: {
    padding: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  connectionCard: {
    marginBottom: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
    textTransform: 'uppercase',
  },
  userIdLabel: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  userIdValue: {
    fontSize: 16,
    color: '#333',
    marginTop: 4,
    fontWeight: '500',
  },
  syncButton: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  googleButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sectionBadge: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#EEE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  dayCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: '#F0F0F0',
    borderLeftColor: '#4285F4',
  },
  dayDate: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  blocksContainer: {
    gap: 6,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  blockTime: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  disconnectButton: {
    marginTop: 32,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disconnectText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 15,
  },
  welcomeContainer: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 500,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeDesc: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  privacyNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    fontSize: 15,
  },
  opacityPressed: {
    opacity: 0.6,
  },
  dayHeader: {
    marginBottom: 10,
  },
  spinning: {
    // Note: Reanimated would be better for actual spinning, 
    // but this is a simplified polish.
  }
});
