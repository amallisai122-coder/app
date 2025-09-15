import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, StatusBar } from 'react-native';

// Screens
import MonitorScreen from './screens/MonitorScreen';
import ChallengeScreen from './screens/ChallengeScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import SettingsScreen from './screens/SettingsScreen';
import SetupScreen from './screens/SetupScreen';

// Store
import { AppStateProvider } from './store/AppStore';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Monitor') {
            iconName = focused ? 'timer' : 'timer-outline';
          } else if (route.name === 'Challenges') {
            iconName = focused ? 'calculator' : 'calculator-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Settings') {
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
      <Tab.Screen name="Monitor" component={MonitorScreen} />
      <Tab.Screen name="Challenges" component={ChallengeScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar barStyle="dark-content" />
        <NavigationContainer independent={true}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="Setup" 
              component={SetupScreen} 
              options={{ 
                headerShown: true,
                title: 'App Setup',
                headerStyle: styles.header,
                headerTintColor: '#007AFF',
              }} 
            />
          </Stack.Navigator>
        </NavigationContainer>
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