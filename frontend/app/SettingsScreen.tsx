import React, { useState } from 'react';
import { Alert } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppState } from './store/AppStore';

export default function SettingsScreen() {
  const {
    settings,
    updateSettings,
    monitoredApps,
    removeMonitoredApp,
    achievements,
    completedChallenges,
    resetAllData, // Add this function to the store
  } = useAppState();

  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);

  const difficultyOptions = [
    { value: 'auto', label: 'Auto-adjusting', description: 'AI adapts difficulty based on your performance' },
    { value: 'easy', label: 'Easy', description: 'Simple single-digit problems' },
    { value: 'medium', label: 'Medium', description: 'Two-digit operations and basic multiplication' },
    { value: 'hard', label: 'Hard', description: 'Complex multi-digit calculations' },
  ];

  const goalOptions = [30, 45, 60, 90, 120]; // minutes

  const handleRemoveApp = (appId: string, appName: string) => {
    Alert.alert(
      'Remove App',
      `Are you sure you want to stop monitoring ${appName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => removeMonitoredApp(appId)
        },
      ]
    );
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your progress, challenges, and analytics. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            // In a real app, you would implement data clearing
            Alert.alert('Success', 'All data has been reset.');
          }
        },
      ]
    );
  };

  const getDifficultyLabel = (value: string) => {
    return difficultyOptions.find(opt => opt.value === value)?.label || 'Medium';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>

        {/* Challenge Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Challenge Settings</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowDifficultyModal(true)}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Difficulty Level</Text>
              <Text style={styles.settingDescription}>
                {getDifficultyLabel(settings.difficultySetting)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowGoalModal(true)}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Daily Goal</Text>
              <Text style={styles.settingDescription}>
                Save {settings.dailyGoal} minutes per day
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>
                Get reminders and progress updates
              </Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(value) => updateSettings({ notificationsEnabled: value })}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Weekend Mode</Text>
              <Text style={styles.settingDescription}>
                Relax limits on weekends
              </Text>
            </View>
            <Switch
              value={settings.weekendMode}
              onValueChange={(value) => updateSettings({ weekendMode: value })}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        {/* Monitored Apps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monitored Apps ({monitoredApps.length})</Text>
          {monitoredApps.length === 0 ? (
            <Text style={styles.emptyText}>No apps being monitored</Text>
          ) : (
            monitoredApps.map((app) => (
              <View key={app.id} style={styles.appItem}>
                <View style={styles.appIconPlaceholder}>
                  <Text style={styles.appIconText}>
                    {app.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>{app.name}</Text>
                  <Text style={styles.appLimit}>
                    Daily limit: {Math.floor(app.dailyLimit / 60)}h {app.dailyLimit % 60}m
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveApp(app.id, app.name)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{completedChallenges.length}</Text>
              <Text style={styles.statLabel}>Total Challenges</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {completedChallenges.filter(c => c.correct).length}
              </Text>
              <Text style={styles.statLabel}>Correct Answers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {achievements.filter(a => a.unlocked).length}
              </Text>
              <Text style={styles.statLabel}>Achievements</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {completedChallenges.filter(c => c.correct).reduce((sum, c) => sum + c.timeReward, 0)}m
              </Text>
              <Text style={styles.statLabel}>Time Earned</Text>
            </View>
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.dangerItem} onPress={handleResetData}>
            <Ionicons name="trash" size={20} color="#FF3B30" />
            <Text style={styles.dangerText}>Reset All Data</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Build</Text>
            <Text style={styles.infoValue}>Demo</Text>
          </View>
        </View>
      </ScrollView>

      {/* Difficulty Modal */}
      <Modal
        visible={showDifficultyModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDifficultyModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Difficulty Level</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.modalContent}>
            {difficultyOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.optionItem}
                onPress={() => {
                  updateSettings({ difficultySetting: option.value as any });
                  setShowDifficultyModal(false);
                }}
              >
                <View style={styles.optionInfo}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                {settings.difficultySetting === option.value && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Goal Modal */}
      <Modal
        visible={showGoalModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowGoalModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Daily Goal</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              How many minutes do you want to save per day by reducing social media usage?
            </Text>
            {goalOptions.map((goal) => (
              <TouchableOpacity
                key={goal}
                style={styles.optionItem}
                onPress={() => {
                  updateSettings({ dailyGoal: goal });
                  setShowGoalModal(false);
                }}
              >
                <Text style={styles.optionLabel}>{goal} minutes</Text>
                {settings.dailyGoal === goal && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  settingItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  appItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  appIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appIconText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  appLimit: {
    fontSize: 14,
    color: '#8E8E93',
  },
  removeButton: {
    padding: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  dangerItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dangerText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  infoItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 16,
    color: '#000',
  },
  infoValue: {
    fontSize: 16,
    color: '#8E8E93',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  placeholder: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalDescription: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
    lineHeight: 24,
  },
  optionItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
});