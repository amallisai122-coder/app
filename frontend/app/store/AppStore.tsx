import React, { createContext, useContext, useEffect } from 'react';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appDetectionService, DetectedApp } from '../services/AppDetectionService';

// Types
export interface MonitoredApp {
  id: string;
  name: string;
  packageName: string;
  displayName: string;
  dailyLimit: number; // minutes
  timeUsed: number; // minutes today
  isBlocked: boolean;
  icon?: string;
  category?: string;
  percentage?: number;
}

export interface Challenge {
  id: string;
  question: string;
  answer: number;
  options?: number[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeReward: number; // minutes
  completed: boolean;
  correct?: boolean;
}

export interface UsageSession {
  id: string;
  appId: string;
  packageName: string;
  appName: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes
  date: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

interface AppState {
  // Monitored Apps - Enhanced for dynamic functionality
  monitoredApps: MonitoredApp[];
  addMonitoredAppsFromDetected: (detectedApps: DetectedApp[], limits?: Record<string, number>) => Promise<void>;
  removeMonitoredApp: (id: string) => Promise<void>;
  updateAppUsage: (id: string, timeUsed: number) => void;
  blockApp: (id: string) => void;
  unblockApp: (id: string) => void;
  refreshRealTimeUsage: () => Promise<void>;

  // Challenges
  currentChallenge: Challenge | null;
  completedChallenges: Challenge[];
  generateChallenge: (difficulty?: 'easy' | 'medium' | 'hard') => Promise<void>;
  submitChallengeAnswer: (answer: number) => Promise<boolean>;
  
  // Usage Sessions - Enhanced for real-time tracking
  usageSessions: UsageSession[];
  addUsageSession: (session: Omit<UsageSession, 'id'>) => Promise<void>;
  startUsageMonitoring: () => void;
  
  // Achievements
  achievements: Achievement[];
  unlockAchievement: (id: string) => void;
  
  // Settings
  settings: {
    difficultySetting: 'auto' | 'easy' | 'medium' | 'hard';
    notificationsEnabled: boolean;
    weekendMode: boolean;
    dailyGoal: number; // minutes saved per day
    realTimeMonitoring: boolean;
  };
  updateSettings: (newSettings: Partial<AppState['settings']>) => void;
  
  // Dynamic App Management
  detectedApps: DetectedApp[];
  loadDetectedApps: () => Promise<void>;
  syncWithBackend: () => Promise<void>;
  
  // Persistence
  loadData: () => Promise<void>;
  saveData: () => Promise<void>;
  resetAllData: () => Promise<void>;
}

const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  monitoredApps: [],
  currentChallenge: null,
  completedChallenges: [],
  usageSessions: [],
  detectedApps: [],
  achievements: [
    {
      id: '1',
      title: 'First Challenge',
      description: 'Complete your first math challenge',
      icon: 'trophy',
      unlocked: false,
    },
    {
      id: '2',
      title: 'Week Warrior',
      description: 'Stay within limits for 7 consecutive days',
      icon: 'calendar',
      unlocked: false,
    },
    {
      id: '3',
      title: 'Math Master',
      description: 'Answer 50 challenges correctly',
      icon: 'calculator',
      unlocked: false,
    },
    {
      id: '4',
      title: 'App Detective',
      description: 'Monitor your first dynamic app',
      icon: 'search',
      unlocked: false,
    },
  ],
  settings: {
    difficultySetting: 'auto',
    notificationsEnabled: true,
    weekendMode: false,
    dailyGoal: 60,
    realTimeMonitoring: true,
  },

  // Enhanced Actions for Dynamic Functionality
  addMonitoredAppsFromDetected: async (detectedApps, limits = {}) => {
    try {
      const newMonitoredApps: MonitoredApp[] = detectedApps.map(app => ({
        id: app.id,
        name: app.appName,
        packageName: app.packageName,
        displayName: app.displayName,
        dailyLimit: limits[app.packageName] || getDefaultLimit(app.category),
        timeUsed: 0,
        isBlocked: false,
        icon: app.icon,
        category: app.category,
        percentage: 0,
      }));

      // Add to backend
      for (const app of newMonitoredApps) {
        try {
          const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/apps/monitored`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              packageName: app.packageName,
              appName: app.name,
              displayName: app.displayName,
              icon: app.icon,
              dailyLimit: app.dailyLimit,
              category: app.category,
              userId: 'default',
            }),
          });

          if (!response.ok) {
            console.warn(`Failed to add ${app.name} to backend:`, response.status);
          }
        } catch (error) {
          console.error(`Failed to sync ${app.name} with backend:`, error);
        }
      }

      // Update local state
      set((state) => ({
        monitoredApps: [...state.monitoredApps, ...newMonitoredApps]
      }));

      // Unlock achievement for first dynamic app
      if (get().monitoredApps.length === newMonitoredApps.length) {
        get().unlockAchievement('4');
      }

      await get().saveData();
    } catch (error) {
      console.error('Failed to add monitored apps:', error);
      throw error;
    }
  },

  removeMonitoredApp: async (id) => {
    try {
      // Remove from backend
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/apps/monitored/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.warn('Failed to remove app from backend:', response.status);
      }

      // Update local state
      set((state) => ({
        monitoredApps: state.monitoredApps.filter(app => app.id !== id)
      }));

      await get().saveData();
    } catch (error) {
      console.error('Failed to remove monitored app:', error);
    }
  },

  updateAppUsage: (id, timeUsed) => {
    set((state) => ({
      monitoredApps: state.monitoredApps.map(app =>
        app.id === id 
          ? { 
              ...app, 
              timeUsed, 
              isBlocked: timeUsed >= app.dailyLimit,
              percentage: Math.min((timeUsed / app.dailyLimit) * 100, 100)
            }
          : app
      )
    }));
    get().saveData();
  },

  refreshRealTimeUsage: async () => {
    try {
      const usageData = await appDetectionService.getRealTimeUsage();
      
      set((state) => ({
        monitoredApps: state.monitoredApps.map(app => {
          const usage = usageData.find(u => u.packageName === app.packageName);
          return usage ? {
            ...app,
            timeUsed: usage.timeUsed,
            isBlocked: usage.isBlocked,
            percentage: usage.percentage,
          } : app;
        })
      }));
    } catch (error) {
      console.error('Failed to refresh real-time usage:', error);
    }
  },

  blockApp: (id) => {
    set((state) => ({
      monitoredApps: state.monitoredApps.map(app =>
        app.id === id ? { ...app, isBlocked: true } : app
      )
    }));
    get().saveData();
  },

  unblockApp: (id) => {
    set((state) => ({
      monitoredApps: state.monitoredApps.map(app =>
        app.id === id ? { ...app, isBlocked: false } : app
      )
    }));
    get().saveData();
  },

  generateChallenge: async (difficulty) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/challenges/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          difficulty: difficulty || get().settings.difficultySetting,
          user_performance: get().completedChallenges.slice(-10),
        }),
      });

      if (response.ok) {
        const challenge = await response.json();
        set({ currentChallenge: challenge });
      } else {
        // Fallback to local generation
        const localChallenge = generateLocalChallenge(difficulty || 'medium');
        set({ currentChallenge: localChallenge });
      }
    } catch (error) {
      // Fallback to local generation
      const localChallenge = generateLocalChallenge(difficulty || 'medium');
      set({ currentChallenge: localChallenge });
      console.error('Challenge generation error:', error);
    }
  },

  submitChallengeAnswer: async (answer) => {
    const { currentChallenge } = get();
    if (!currentChallenge) return false;

    try {
      // Submit to backend
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/challenges/${currentChallenge.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answer }),
      });

      let correct = false;
      let timeReward = 0;

      if (response.ok) {
        const result = await response.json();
        correct = result.correct;
        timeReward = result.timeReward;
      } else {
        // Fallback to local validation
        correct = answer === currentChallenge.answer;
        timeReward = correct ? currentChallenge.timeReward : 0;
      }

      const completedChallenge = {
        ...currentChallenge,
        completed: true,
        correct,
      };

      set((state) => ({
        completedChallenges: [...state.completedChallenges, completedChallenge],
        currentChallenge: null,
      }));

      // Check for achievements
      const { completedChallenges } = get();
      if (completedChallenges.length === 1) {
        get().unlockAchievement('1'); // First Challenge
      }
      if (completedChallenges.filter(c => c.correct).length === 50) {
        get().unlockAchievement('3'); // Math Master
      }

      await get().saveData();
      return correct;
    } catch (error) {
      console.error('Failed to submit challenge:', error);
      return false;
    }
  },

  addUsageSession: async (session) => {
    const newSession: UsageSession = {
      ...session,
      id: Date.now().toString(),
    };

    try {
      // Log to backend
      await appDetectionService.logUsageSession({
        packageName: session.packageName,
        appName: session.appName,
        duration: session.duration,
        startTime: session.startTime,
        endTime: session.endTime || new Date(),
      });

      set((state) => ({
        usageSessions: [...state.usageSessions, newSession]
      }));

      await get().saveData();
    } catch (error) {
      console.error('Failed to add usage session:', error);
    }
  },

  startUsageMonitoring: () => {
    const { settings } = get();
    if (settings.realTimeMonitoring) {
      // Start the app detection service monitoring
      appDetectionService.startUsageMonitoring();
      
      // Set up periodic refresh of usage data
      const refreshInterval = setInterval(() => {
        get().refreshRealTimeUsage();
      }, 60000); // Refresh every minute

      // Store interval ID for cleanup (you might want to add this to the store)
      // In a real app, you'd handle cleanup in useEffect
    }
  },

  loadDetectedApps: async () => {
    try {
      const apps = await appDetectionService.getCachedApps();
      set({ detectedApps: apps });
    } catch (error) {
      console.error('Failed to load detected apps:', error);
    }
  },

  syncWithBackend: async () => {
    try {
      // Sync detected apps with backend
      const apps = await appDetectionService.detectInstalledApps();
      set({ detectedApps: apps });
    } catch (error) {
      console.error('Failed to sync with backend:', error);
    }
  },

  unlockAchievement: (id) => {
    set((state) => ({
      achievements: state.achievements.map(achievement =>
        achievement.id === id
          ? { ...achievement, unlocked: true, unlockedAt: new Date() }
          : achievement
      )
    }));
    get().saveData();
  },

  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings }
    }));
    get().saveData();
  },

  loadData: async () => {
    try {
      const data = await AsyncStorage.getItem('brainRotAppData');
      if (data) {
        const parsedData = JSON.parse(data);
        set(parsedData);
      }
      // Also load detected apps
      await get().loadDetectedApps();
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  },

  saveData: async () => {
    try {
      const state = get();
      const dataToSave = {
        monitoredApps: state.monitoredApps,
        completedChallenges: state.completedChallenges,
        usageSessions: state.usageSessions,
        achievements: state.achievements,
        settings: state.settings,
      };
      await AsyncStorage.setItem('brainRotAppData', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  },

  resetAllData: async () => {
    try {
      // Clear all local storage
      await AsyncStorage.clear();
      
      // Reset all monitored apps from backend
      const state = get();
      for (const app of state.monitoredApps) {
        try {
          await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/apps/monitored/${app.id}`, {
            method: 'DELETE',
          });
        } catch (error) {
          console.warn(`Failed to remove ${app.name} from backend:`, error);
        }
      }

      // Reset state to initial values
      set({
        monitoredApps: [],
        currentChallenge: null,
        completedChallenges: [],
        usageSessions: [],
        detectedApps: [],
        achievements: [
          {
            id: '1',
            title: 'First Challenge',
            description: 'Complete your first math challenge',
            icon: 'trophy',
            unlocked: false,
          },
          {
            id: '2',
            title: 'Week Warrior',
            description: 'Stay within limits for 7 consecutive days',
            icon: 'calendar',
            unlocked: false,
          },
          {
            id: '3',
            title: 'Math Master',
            description: 'Answer 50 challenges correctly',
            icon: 'calculator',
            unlocked: false,
          },
          {
            id: '4',
            title: 'App Detective',
            description: 'Monitor your first dynamic app',
            icon: 'search',
            unlocked: false,
          },
        ],
        settings: {
          difficultySetting: 'auto',
          notificationsEnabled: true,
          weekendMode: false,
          dailyGoal: 60,
          realTimeMonitoring: true,
        },
      });

      console.log('All data has been reset successfully');
    } catch (error) {
      console.error('Failed to reset data:', error);
      throw error;
    }
  },
}));

// Helper function to get default limits based on app category
function getDefaultLimit(category: string): number {
  const defaults: Record<string, number> = {
    social: 30,
    entertainment: 60,
    games: 45,
    communication: 120,
    music: 180,
    news: 45,
    productivity: 240,
    shopping: 30,
    finance: 60,
  };
  return defaults[category] || 60;
}

// Local challenge generation fallback
function generateLocalChallenge(difficulty: 'easy' | 'medium' | 'hard'): Challenge {
  const challenges = {
    easy: [
      { question: '7 + 8 = ?', answer: 15, timeReward: 5 },
      { question: '15 - 6 = ?', answer: 9, timeReward: 5 },
      { question: '4 × 3 = ?', answer: 12, timeReward: 5 },
      { question: '18 ÷ 6 = ?', answer: 3, timeReward: 5 },
    ],
    medium: [
      { question: '23 + 47 = ?', answer: 70, timeReward: 8 },
      { question: '84 - 29 = ?', answer: 55, timeReward: 8 },
      { question: '12 × 7 = ?', answer: 84, timeReward: 8 },
      { question: '144 ÷ 12 = ?', answer: 12, timeReward: 8 },
    ],
    hard: [
      { question: '156 + 289 = ?', answer: 445, timeReward: 12 },
      { question: '500 - 247 = ?', answer: 253, timeReward: 12 },
      { question: '23 × 18 = ?', answer: 414, timeReward: 12 },
      { question: '2880 ÷ 24 = ?', answer: 120, timeReward: 12 },
    ],
  };

  const difficultyQuestions = challenges[difficulty];
  const selectedQuestion = difficultyQuestions[Math.floor(Math.random() * difficultyQuestions.length)];

  return {
    id: Date.now().toString(),
    ...selectedQuestion,
    difficulty,
    completed: false,
  };
}

// Context Provider
const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const store = useAppStore();

  useEffect(() => {
    store.loadData();
  }, []);

  return (
    <AppStateContext.Provider value={store}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}