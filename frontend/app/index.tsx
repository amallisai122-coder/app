import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';

// Components
import SplashScreen from './SplashScreen';

// Store
import { AppStateProvider } from './store/AppStore';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
        <SplashScreen onAnimationComplete={() => setShowSplash(false)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar barStyle="dark-content" />
        <Redirect href="/(tabs)/monitor" />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}