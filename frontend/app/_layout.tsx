import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

// Store
import { AppStateProvider } from './store/AppStore';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar barStyle="dark-content" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen 
            name="setup" 
            options={{ 
              headerShown: true,
              title: 'App Setup',
              headerStyle: {
                backgroundColor: '#F8F9FA',
                borderBottomWidth: 1,
                borderBottomColor: '#E5E5E7',
              },
              headerTintColor: '#007AFF',
            }} 
          />
        </Stack>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}