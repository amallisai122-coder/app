import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppState } from '../store/AppStore';

export default function MonitorScreen() {
  const {
    monitoredApps,
    addMonitoredApp,
    updateAppUsage,
    generateChallenge,
    currentChallenge,
  } = useAppState();

  const [showAddApp, setShowAddApp] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  // Simulate app usage tracking (in real app, this would monitor actual usage)
  useEffect(() => {
    const interval = setInterval(() => {
      monitoredApps.forEach(app => {
        if (!app.isBlocked) {
          // Simulate random usage increment
          const increment = Math.random() > 0.8 ? 1 : 0;
          if (increment > 0) {
            updateAppUsage(app.id, app.timeUsed + increment);
          }
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [monitoredApps, updateAppUsage]);

  const handleAppBlock = async (appId: string) => {
    setSelectedApp(appId);
    await generateChallenge();
    setShowChallengeModal(true);
  };

  const addSampleApps = () => {
    const sampleApps = [
      { name: 'Instagram', packageName: 'com.instagram.android', dailyLimit: 30 },
      { name: 'TikTok', packageName: 'com.tiktok.android', dailyLimit: 45 },
      { name: 'Twitter', packageName: 'com.twitter.android', dailyLimit: 25 },
      { name: 'YouTube', packageName: 'com.youtube.android', dailyLimit: 60 },
    ];

    sampleApps.forEach(app => addMonitoredApp(app));
    setShowAddApp(false);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getUsageColor = (timeUsed: number, limit: number) => {
    const percentage = (timeUsed / limit) * 100;
    if (percentage >= 90) return '#FF3B30';
    if (percentage >= 75) return '#FF9500';
    return '#34C759';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>App Monitor</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddApp(true)}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {monitoredApps.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="phone-portrait-outline" size={64} color="#8E8E93" />
            <Text style={styles.emptyTitle}>No Apps Being Monitored</Text>
            <Text style={styles.emptySubtitle}>
              Add apps to start tracking your usage and reducing brain rot
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowAddApp(true)}
            >
              <Text style={styles.primaryButtonText}>Add Apps to Monitor</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.appsList}>
            {monitoredApps.map((app) => (
              <View key={app.id} style={styles.appCard}>
                <View style={styles.appInfo}>
                  <View style={styles.appIconPlaceholder}>
                    <Text style={styles.appIconText}>
                      {app.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.appDetails}>
                    <Text style={styles.appName}>{app.name}</Text>
                    <Text style={styles.appUsage}>
                      {formatTime(app.timeUsed)} / {formatTime(app.dailyLimit)}
                    </Text>
                  </View>
                </View>

                <View style={styles.appControls}>
                  <View style={styles.progressContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${Math.min((app.timeUsed / app.dailyLimit) * 100, 100)}%`,
                          backgroundColor: getUsageColor(app.timeUsed, app.dailyLimit),
                        },
                      ]}
                    />
                  </View>
                  {app.isBlocked ? (
                    <TouchableOpacity
                      style={styles.challengeButton}
                      onPress={() => handleAppBlock(app.id)}
                    >
                      <Text style={styles.challengeButtonText}>Solve to Unlock</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.statusIndicator}>
                      <Ionicons 
                        name="checkmark-circle" 
                        size={20} 
                        color="#34C759" 
                      />
                      <Text style={styles.statusText}>Active</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add App Modal */}
      <Modal
        visible={showAddApp}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddApp(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Apps</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Popular Social Media Apps</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={addSampleApps}
            >
              <Text style={styles.primaryButtonText}>Add Sample Apps</Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>
              This demo adds Instagram, TikTok, Twitter, and YouTube with preset limits.
              In a real app, you would select from installed apps on your device.
            </Text>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Challenge Modal */}
      <Modal
        visible={showChallengeModal}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowChallengeModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Math Challenge</Text>
            <View style={styles.placeholder} />
          </View>
          
          {currentChallenge && (
            <View style={styles.challengeContent}>
              <Text style={styles.challengeTitle}>
                Solve this problem to earn {currentChallenge.timeReward} more minutes
              </Text>
              <Text style={styles.challengeQuestion}>
                {currentChallenge.question}
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  setShowChallengeModal(false);
                  // Navigate to Challenge screen
                }}
              >
                <Text style={styles.primaryButtonText}>Start Challenge</Text>
              </TouchableOpacity>
            </View>
          )}
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
    flexGrow: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  appsList: {
    gap: 12,
  },
  appCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  appIconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appIconText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  appDetails: {
    flex: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  appUsage: {
    fontSize: 14,
    color: '#8E8E93',
  },
  appControls: {
    gap: 8,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  challengeButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  challengeButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  helperText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 16,
    lineHeight: 20,
  },
  challengeContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeTitle: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
  },
  challengeQuestion: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 32,
  },
});