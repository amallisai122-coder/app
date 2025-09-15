import React, { createContext, useContext, useEffect } from 'react';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface MonitoredApp {
  id: string;
  name: string;
  packageName: string;
  dailyLimit: number; // minutes
  timeUsed: number; // minutes today
  isBlocked: boolean;
  icon?: string;
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
  // Monitored Apps
  monitoredApps: MonitoredApp[];
  addMonitoredApp: (app: Omit<MonitoredApp, 'id' | 'timeUsed' | 'isBlocked'>) => void;
  removeMonitoredApp: (id: string) => void;
  updateAppUsage: (id: string, timeUsed: number) => void;
  blockApp: (id: string) => void;
  unblockApp: (id: string) => void;

  // Challenges
  currentChallenge: Challenge | null;
  completedChallenges: Challenge[];
  generateChallenge: (difficulty?: 'easy' | 'medium' | 'hard') => Promise<void>;
  submitChallengeAnswer: (answer: number) => boolean;
  
  // Usage Sessions
  usageSessions: UsageSession[];
  addUsageSession: (session: Omit<UsageSession, 'id'>) => void;
  
  // Achievements
  achievements: Achievement[];
  unlockAchievement: (id: string) => void;
  
  // Settings
  settings: {
    difficultySetting: 'auto' | 'easy' | 'medium' | 'hard';
    notificationsEnabled: boolean;
    weekendMode: boolean;
    dailyGoal: number; // minutes saved per day
  };
  updateSettings: (newSettings: Partial<AppState['settings']>) => void;
  
  // Persistence
  loadData: () => Promise<void>;
  saveData: () => Promise<void>;
}

const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  monitoredApps: [],
  currentChallenge: null,
  completedChallenges: [],
  usageSessions: [],
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
  ],
  settings: {
    difficultySetting: 'auto',
    notificationsEnabled: true,
    weekendMode: false,
    dailyGoal: 60,
  },

  // Actions
  addMonitoredApp: (app) => {
    const newApp: MonitoredApp = {
      ...app,
      id: Date.now().toString(),
      timeUsed: 0,
      isBlocked: false,
    };
    set((state) => ({
      monitoredApps: [...state.monitoredApps, newApp]
    }));
    get().saveData();
  },

  removeMonitoredApp: (id) => {
    set((state) => ({
      monitoredApps: state.monitoredApps.filter(app => app.id !== id)
    }));
    get().saveData();
  },

  updateAppUsage: (id, timeUsed) => {
    set((state) => ({
      monitoredApps: state.monitoredApps.map(app =>
        app.id === id 
          ? { ...app, timeUsed, isBlocked: timeUsed >= app.dailyLimit }
          : app
      )
    }));
    get().saveData();
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
    }
  },

  submitChallengeAnswer: (answer) => {
    const { currentChallenge } = get();
    if (!currentChallenge) return false;

    const correct = answer === currentChallenge.answer;
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

    get().saveData();
    return correct;
  },

  addUsageSession: (session) => {
    const newSession: UsageSession = {
      ...session,
      id: Date.now().toString(),
    };
    set((state) => ({
      usageSessions: [...state.usageSessions, newSession]
    }));
    get().saveData();
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
}));

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