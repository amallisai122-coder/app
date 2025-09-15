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

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
    paddingBottom: 8,
    paddingTop: 8,
    height: 88,
  },
  header: {
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
});