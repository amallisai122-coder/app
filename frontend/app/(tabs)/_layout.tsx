import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'monitor') {
            iconName = focused ? 'timer' : 'timer-outline';
          } else if (route.name === 'challenges') {
            iconName = focused ? 'calculator' : 'calculator-outline';
          } else if (route.name === 'analytics') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: styles.tabBar,
        headerStyle: styles.header,
        headerTintColor: '#007AFF',
      })}
    >
      <Tabs.Screen 
        name="monitor" 
        options={{ 
          title: 'Monitor',
          headerTitle: 'App Monitor'
        }} 
      />
      <Tabs.Screen 
        name="challenges" 
        options={{ 
          title: 'Challenges',
          headerTitle: 'Math Challenges'
        }} 
      />
      <Tabs.Screen 
        name="analytics" 
        options={{ 
          title: 'Analytics',
          headerTitle: 'Your Progress'
        }} 
      />
      <Tabs.Screen 
        name="settings" 
        options={{ 
          title: 'Settings',
          headerTitle: 'Settings'
        }} 
      />
    </Tabs>
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