import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';

// Store
import { AppStateProvider } from './store/AppStore';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar barStyle="dark-content" />
        <Redirect href="/(tabs)/monitor" />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}