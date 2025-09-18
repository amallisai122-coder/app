import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppState } from './store/AppStore';
import DynamicAppSelection from './DynamicAppSelection';
import { DetectedApp } from './services/AppDetectionService';

export default function MonitorScreen() {
  const {
    monitoredApps,
    addMonitoredAppsFromDetected,
    refreshRealTimeUsage,
    generateChallenge,
    currentChallenge,
    startUsageMonitoring,
  } = useAppState();

  const [showAppSelection, setShowAppSelection] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Start usage monitoring when component mounts
  useEffect(() => {
    startUsageMonitoring();
  }, []);

  // Auto-refresh usage data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshRealTimeUsage();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshRealTimeUsage();
    } catch (error) {
      console.error('Refresh failed:', error);
      Alert.alert('Error', 'Failed to refresh usage data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAppBlock = async (appId: string) => {
    setSelectedApp(appId);
    await generateChallenge();
    setShowChallengeModal(true);
  };

  const handleAppsSelected = async (selectedApps: DetectedApp[]) => {
    try {
      // Show limit selection dialog for each app
      const customLimits: Record<string, number> = {};
      
      for (const app of selectedApps) {
        const defaultLimit = getDefaultLimitByCategory(app.category);
        customLimits[app.packageName] = defaultLimit;
      }

      await addMonitoredAppsFromDetected(selectedApps, customLimits);
      
      Alert.alert(
        'Success', 
        `Added ${selectedApps.length} app${selectedApps.length > 1 ? 's' : ''} to monitoring!`
      );
    } catch (error) {
      console.error('Failed to add apps:', error);
      Alert.alert('Error', 'Failed to add apps to monitoring');
    }
  };

  const getDefaultLimitByCategory = (category: string): number => {
    const limits: Record<string, number> = {
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
    return limits[category] || 60;
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

  const getCategoryIcon = (category?: string) => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      social: 'people',
      entertainment: 'play-circle',
      communication: 'chatbubbles',
      music: 'musical-notes',
      news: 'newspaper',
      productivity: 'briefcase',
      games: 'game-controller',
      shopping: 'bag',
      finance: 'card',
    };
    return icons[category || 'social'] || 'apps';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>App Monitor</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              console.log('Add button pressed');
              setShowAppSelection(true);
            }}
            activeOpacity={0.7}
            testID="add-apps-button"
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {monitoredApps.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="phone-portrait-outline" size={64} color="#8E8E93" />
            <Text style={styles.emptyTitle}>No Apps Being Monitored</Text>
            <Text style={styles.emptySubtitle}>
              Add apps from your device to start tracking usage and reducing brain rot
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowAppSelection(true)}
            >
              <Text style={styles.primaryButtonText}>Scan & Add Apps</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Stats Summary */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{monitoredApps.length}</Text>
                <Text style={styles.statLabel}>Apps Monitored</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {monitoredApps.filter(app => app.isBlocked).length}
                </Text>
                <Text style={styles.statLabel}>Currently Blocked</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {Math.round(monitoredApps.reduce((acc, app) => acc + (app.percentage || 0), 0) / monitoredApps.length)}%
                </Text>
                <Text style={styles.statLabel}>Avg Usage</Text>
              </View>
            </View>

            <View style={styles.appsList}>
              {monitoredApps.map((app) => (
                <View key={app.id} style={styles.appCard}>
                  <View style={styles.appInfo}>
                    <View style={[styles.appIconPlaceholder, { backgroundColor: getCategoryColor(app.category) }]}>
                      <Ionicons 
                        name={getCategoryIcon(app.category)} 
                        size={24} 
                        color="#FFF" 
                      />
                    </View>
                    <View style={styles.appDetails}>
                      <Text style={styles.appName}>{app.displayName || app.name}</Text>
                      <Text style={styles.appUsage}>
                        {formatTime(app.timeUsed)} / {formatTime(app.dailyLimit)}
                      </Text>
                      {app.category && (
                        <Text style={styles.appCategory}>{app.category.toUpperCase()}</Text>
                      )}
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
          </>
        )}
      </ScrollView>

      {/* Dynamic App Selection Modal */}
      <DynamicAppSelection
        visible={showAppSelection}
        onClose={() => setShowAppSelection(false)}
        onAppsSelected={handleAppsSelected}
      />

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
                  // Navigate to Challenge screen would go here
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

  function getCategoryColor(category?: string): string {
    const colors: Record<string, string> = {
      social: '#FF3B30',
      entertainment: '#FF9500',
      communication: '#007AFF',
      music: '#AF52DE',
      news: '#5856D6',
      productivity: '#34C759',
      games: '#FF2D92',
      shopping: '#FF6B35',
      finance: '#30B0C7',
    };
    return colors[category || 'social'] || '#007AFF';
  }
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
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
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
  appCategory: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2,
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