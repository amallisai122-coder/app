import * as Application from 'expo-application';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DetectedApp {
  id: string;
  packageName: string;
  appName: string;
  displayName: string;
  category: string;
  icon?: string;
  isSystemApp: boolean;
  version?: string;
  installDate?: Date;
  lastUsed?: Date;
}

export interface UsageData {
  packageName: string;
  appName: string;
  timeUsed: number; // minutes
  sessions: UsageSession[];
}

export interface UsageSession {
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes
}

class AppDetectionService {
  private readonly STORAGE_KEY = 'detectedApps';
  private readonly USAGE_KEY = 'appUsage';
  private backendUrl: string;

  constructor() {
    this.backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
  }

  /**
   * Simulate device app detection (In a real app, this would use native modules)
   * For demo purposes, we'll create realistic sample apps
   */
  async detectInstalledApps(): Promise<DetectedApp[]> {
    try {
      // In a real implementation, you would use:
      // - React Native's native modules to access installed apps
      // - Android: PackageManager APIs
      // - iOS: Shared keychain / URL schemes (limited)
      
      // For demo, we'll simulate detecting popular apps with realistic data
      const simulatedApps: DetectedApp[] = [
        {
          id: 'com.instagram.android',
          packageName: 'com.instagram.android',
          appName: 'Instagram',
          displayName: 'Instagram',
          category: 'social',
          isSystemApp: false,
          version: '301.0.0.27.111',
          installDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          id: 'com.tiktok.android',
          packageName: 'com.tiktok.android',
          appName: 'TikTok',
          displayName: 'TikTok',
          category: 'social',
          isSystemApp: false,
          version: '32.5.4',
          installDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          lastUsed: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        },
        {
          id: 'com.twitter.android',
          packageName: 'com.twitter.android',
          appName: 'X (Twitter)',
          displayName: 'X',
          category: 'social',
          isSystemApp: false,
          version: '10.28.0',
          installDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          lastUsed: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        },
        {
          id: 'com.youtube.android',
          packageName: 'com.youtube.android',
          appName: 'YouTube',
          displayName: 'YouTube',
          category: 'entertainment',
          isSystemApp: false,
          version: '19.05.35',
          installDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          lastUsed: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        },
        {
          id: 'com.facebook.android',
          packageName: 'com.facebook.android',
          appName: 'Facebook',
          displayName: 'Facebook',
          category: 'social',
          isSystemApp: false,
          version: '442.0.0.29.118',
          installDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          lastUsed: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        },
        {
          id: 'com.snapchat.android',
          packageName: 'com.snapchat.android',
          appName: 'Snapchat',
          displayName: 'Snapchat',
          category: 'social',
          isSystemApp: false,
          version: '12.75.0.37',
          installDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          lastUsed: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        },
        {
          id: 'com.netflix.android',
          packageName: 'com.netflix.android',
          appName: 'Netflix',
          displayName: 'Netflix',
          category: 'entertainment',
          isSystemApp: false,
          version: '8.109.0',
          installDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
          lastUsed: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        },
        {
          id: 'com.spotify.music',
          packageName: 'com.spotify.music',
          appName: 'Spotify',
          displayName: 'Spotify',
          category: 'music',
          isSystemApp: false,
          version: '8.8.78.545',
          installDate: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000),
          lastUsed: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        },
        {
          id: 'com.discord',
          packageName: 'com.discord',
          appName: 'Discord',
          displayName: 'Discord',
          category: 'communication',
          isSystemApp: false,
          version: '200.15',
          installDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
          lastUsed: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        },
        {
          id: 'com.reddit.frontpage',
          packageName: 'com.reddit.frontpage',
          appName: 'Reddit',
          displayName: 'Reddit',
          category: 'news',
          isSystemApp: false,
          version: '2024.01.0',
          installDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
          lastUsed: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        },
      ];

      // Add device-specific information
      const deviceInfo = await this.getDeviceInfo();
      const appsWithDeviceInfo = simulatedApps.map(app => ({
        ...app,
        // Add some randomness to make it feel more realistic
        lastUsed: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random within last 24h
      }));

      // Store detected apps locally
      await this.storeDetectedApps(appsWithDeviceInfo);
      
      // Sync with backend
      await this.syncWithBackend(appsWithDeviceInfo);

      return appsWithDeviceInfo;
    } catch (error) {
      console.error('Failed to detect installed apps:', error);
      // Return cached apps if detection fails
      return await this.getCachedApps();
    }
  }

  /**
   * Get device information for context
   */
  private async getDeviceInfo() {
    const [deviceName, osName, osVersion, appVersion] = await Promise.all([
      Device.deviceName,
      Device.osName,
      Device.osVersion,
      Application.nativeApplicationVersion,
    ]);

    return {
      deviceName,
      osName,
      osVersion,
      appVersion,
      isDevice: Device.isDevice,
    };
  }

  /**
   * Store detected apps locally for offline access
   */
  private async storeDetectedApps(apps: DetectedApp[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(apps));
    } catch (error) {
      console.error('Failed to store detected apps:', error);
    }
  }

  /**
   * Get cached apps from local storage
   */
  async getCachedApps(): Promise<DetectedApp[]> {
    try {
      const cachedApps = await AsyncStorage.getItem(this.STORAGE_KEY);
      return cachedApps ? JSON.parse(cachedApps) : [];
    } catch (error) {
      console.error('Failed to get cached apps:', error);
      return [];
    }
  }

  /**
   * Sync detected apps with backend
   */
  private async syncWithBackend(apps: DetectedApp[]): Promise<void> {
    try {
      const response = await fetch(`${this.backendUrl}/api/apps/bulk-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apps),
      });

      if (!response.ok) {
        throw new Error(`Backend sync failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Apps synced with backend:', result);
    } catch (error) {
      console.error('Failed to sync apps with backend:', error);
    }
  }

  /**
   * Search apps in backend registry
   */
  async searchApps(query?: string, category?: string): Promise<DetectedApp[]> {
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (category) params.append('category', category);

      const response = await fetch(`${this.backendUrl}/api/apps/search?${params}`);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const result = await response.json();
      return result.apps || [];
    } catch (error) {
      console.error('Failed to search apps:', error);
      return await this.getCachedApps();
    }
  }

  /**
   * Get app categories from backend
   */
  async getAppCategories(): Promise<Array<{name: string; count: number; displayName: string}>> {
    try {
      const response = await fetch(`${this.backendUrl}/api/apps/categories`);
      if (!response.ok) {
        throw new Error(`Categories fetch failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [
        { name: 'social', count: 0, displayName: 'Social' },
        { name: 'entertainment', count: 0, displayName: 'Entertainment' },
        { name: 'communication', count: 0, displayName: 'Communication' },
        { name: 'music', count: 0, displayName: 'Music' },
        { name: 'news', count: 0, displayName: 'News' },
      ];
    }
  }

  /**
   * Simulate real-time usage tracking
   * In a real app, this would use system APIs to monitor app usage
   */
  async startUsageMonitoring(): Promise<void> {
    // This would typically require:
    // - Android: UsageStatsManager (requires special permission)
    // - iOS: Screen Time APIs (limited to own app)
    
    console.log('Starting usage monitoring simulation...');
    
    // Simulate usage tracking with periodic updates
    setInterval(async () => {
      await this.simulateUsageUpdate();
    }, 30000); // Update every 30 seconds
  }

  /**
   * Simulate usage updates for demo purposes
   */
  private async simulateUsageUpdate(): Promise<void> {
    try {
      const apps = await this.getCachedApps();
      const randomApp = apps[Math.floor(Math.random() * apps.length)];
      
      if (randomApp && Math.random() > 0.7) { // 30% chance of usage update
        const usageDuration = Math.floor(Math.random() * 5) + 1; // 1-5 minutes
        
        await this.logUsageSession({
          packageName: randomApp.packageName,
          appName: randomApp.appName,
          duration: usageDuration,
          startTime: new Date(Date.now() - usageDuration * 60 * 1000),
          endTime: new Date(),
        });
      }
    } catch (error) {
      console.error('Failed to simulate usage update:', error);
    }
  }

  /**
   * Log a usage session to backend
   */
  async logUsageSession(session: {
    packageName: string;
    appName: string;
    duration: number;
    startTime: Date;
    endTime: Date;
  }): Promise<void> {
    try {
      const response = await fetch(`${this.backendUrl}/api/usage/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageName: session.packageName,
          appName: session.appName,
          duration: session.duration,
          timestamp: session.endTime,
          date: session.endTime.toISOString().split('T')[0],
          sessionType: 'active',
          userId: 'default',
        }),
      });

      if (!response.ok) {
        throw new Error(`Usage logging failed: ${response.status}`);
      }

      console.log(`Logged ${session.duration} minutes for ${session.appName}`);
    } catch (error) {
      console.error('Failed to log usage session:', error);
    }
  }

  /**
   * Get real-time usage data from backend
   */
  async getRealTimeUsage(): Promise<any[]> {
    try {
      const response = await fetch(`${this.backendUrl}/api/usage/realtime`);
      if (!response.ok) {
        throw new Error(`Real-time usage fetch failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get real-time usage:', error);
      return [];
    }
  }
}

export const appDetectionService = new AppDetectionService();