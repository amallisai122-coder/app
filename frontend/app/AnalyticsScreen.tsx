import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-gifted-charts';
import { useAppState } from './store/AppStore';

const { width: screenWidth } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const {
    monitoredApps,
    completedChallenges,
    usageSessions,
    achievements,
  } = useAppState();

  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    calculateAnalytics();
  }, [monitoredApps, completedChallenges, usageSessions, selectedPeriod]);

  const calculateAnalytics = () => {
    const now = new Date();
    const daysBack = selectedPeriod === 'week' ? 7 : 30;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysBack);

    // Filter recent challenges
    const recentChallenges = completedChallenges.filter(challenge => {
      const challengeDate = new Date(challenge.id);
      return challengeDate >= startDate;
    });

    // Calculate daily challenge completion
    const dailyData = [];
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daysChallenges = recentChallenges.filter(c => {
        const challengeDate = new Date(c.id);
        return challengeDate.toDateString() === date.toDateString();
      });

      dailyData.push({
        value: daysChallenges.filter(c => c.correct).length,
        label: date.getDate().toString(),
        frontColor: '#007AFF',
        ...(Platform.OS !== 'web' && { gradientColor: '#007AFF' }),
        spacing: 6,
        labelWidth: 30,
        labelTextStyle: { color: '#8E8E93', fontSize: 10 },
      });
    }

    // App usage distribution
    const appUsageData = monitoredApps.map(app => ({
      value: app.timeUsed,
      color: getRandomColor(),
      text: app.timeUsed > 0 ? `${Math.round((app.timeUsed / getTotalUsage()) * 100)}%` : '0%',
      label: app.name,
    })).filter(app => app.value > 0);

    // Weekly progress
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const dayApps = monitoredApps.filter(app => {
        return app.timeUsed < app.dailyLimit;
      });

      weeklyProgress.push({
        value: (dayApps.length / Math.max(monitoredApps.length, 1)) * 100,
        dataPointText: `${dayApps.length}`,
        hideDataPoint: false,
        dataPointColor: '#007AFF',
        dataPointRadius: 4,
      });
    }

    setAnalyticsData({
      dailyChallenges: dailyData,
      appUsage: appUsageData,
      weeklyProgress: weeklyProgress,
      totalChallenges: recentChallenges.length,
      correctChallenges: recentChallenges.filter(c => c.correct).length,
      timeEarned: recentChallenges.filter(c => c.correct).reduce((sum, c) => sum + c.timeReward, 0),
      averageAccuracy: recentChallenges.length > 0 
        ? (recentChallenges.filter(c => c.correct).length / recentChallenges.length * 100).toFixed(1)
        : 0,
    });
  };

  const getTotalUsage = () => {
    return monitoredApps.reduce((sum, app) => sum + app.timeUsed, 0);
  };

  const getRandomColor = () => {
    const colors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#FF2D92', '#5AC8FA'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  const currentStreak = calculateCurrentStreak();

  function calculateCurrentStreak() {
    const recent = completedChallenges.slice(-10);
    let streak = 0;
    for (let i = recent.length - 1; i >= 0; i--) {
      if (recent[i].correct) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  if (!analyticsData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Calculating analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'week' && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod('week')}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === 'week' && styles.periodButtonTextActive
              ]}>Week</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'month' && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod('month')}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === 'month' && styles.periodButtonTextActive
              ]}>Month</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.metricNumber}>{currentStreak}</Text>
            <Text style={styles.metricLabel}>Current Streak</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.metricNumber}>{analyticsData.correctChallenges}</Text>
            <Text style={styles.metricLabel}>Challenges Won</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="time" size={24} color="#007AFF" />
            <Text style={styles.metricNumber}>{analyticsData.timeEarned}m</Text>
            <Text style={styles.metricLabel}>Time Earned</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="star" size={24} color="#FF9500" />
            <Text style={styles.metricNumber}>{unlockedAchievements}</Text>
            <Text style={styles.metricLabel}>Achievements</Text>
          </View>
        </View>

        {/* Daily Challenge Performance */}
        {analyticsData.dailyChallenges.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Daily Challenge Performance</Text>
            <BarChart
              data={analyticsData.dailyChallenges}
              barWidth={22}
              spacing={24}
              roundedTop
              roundedBottom
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: '#8E8E93' }}
              noOfSections={3}
              maxValue={Math.max(5, Math.max(...analyticsData.dailyChallenges.map(d => d.value)))}
              height={200}
              width={screenWidth - 80}
            />
          </View>
        )}

        {/* App Usage Distribution */}
        {analyticsData.appUsage.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>App Usage Distribution</Text>
            <View style={styles.pieChartContainer}>
              <PieChart
                data={analyticsData.appUsage}
                donut
                {...(Platform.OS !== 'web' && { showGradient: true })}
                sectionAutoFocus
                radius={80}
                innerRadius={60}
                innerCircleColor={'#F2F2F7'}
                centerLabelComponent={() => (
                  <View style={styles.centerLabel}>
                    <Text style={styles.centerLabelValue}>{getTotalUsage()}m</Text>
                    <Text style={styles.centerLabelText}>Total</Text>
                  </View>
                )}
              />
              <View style={styles.legend}>
                {analyticsData.appUsage.map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>{item.label}</Text>
                    <Text style={styles.legendValue}>{item.value}m</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Weekly Progress */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weekly Goal Progress</Text>
          <Text style={styles.chartSubtitle}>Days within daily limits</Text>
          <LineChart
            data={analyticsData.weeklyProgress}
            height={150}
            showVerticalLines
            spacing={44}
            initialSpacing={0}
            color1="#007AFF"
            dataPointsColor1="#007AFF"
            hideRules
            hideYAxisText
            xAxisColor="#E5E5EA"
            yAxisColor="#E5E5EA"
            width={screenWidth - 80}
          />
        </View>

        {/* Achievements */}
        <View style={styles.achievementsCard}>
          <Text style={styles.chartTitle}>Achievements</Text>
          <View style={styles.achievementsList}>
            {achievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementItem}>
                <View style={[
                  styles.achievementIcon,
                  { opacity: achievement.unlocked ? 1 : 0.3 }
                ]}>
                  <Ionicons 
                    name={achievement.icon as any} 
                    size={24} 
                    color={achievement.unlocked ? '#007AFF' : '#8E8E93'} 
                  />
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={[
                    styles.achievementTitle,
                    { color: achievement.unlocked ? '#000' : '#8E8E93' }
                  ]}>
                    {achievement.title}
                  </Text>
                  <Text style={styles.achievementDescription}>
                    {achievement.description}
                  </Text>
                  {achievement.unlocked && achievement.unlockedAt && (
                    <Text style={styles.achievementDate}>
                      Unlocked {achievement.unlockedAt.toLocaleDateString()}
                    </Text>
                  )}
                </View>
                {achievement.unlocked && (
                  <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryCard}>
          <Text style={styles.chartTitle}>Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Accuracy Rate</Text>
              <Text style={styles.summaryValue}>{analyticsData.averageAccuracy}%</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Challenges</Text>
              <Text style={styles.summaryValue}>{analyticsData.totalChallenges}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Apps Monitored</Text>
              <Text style={styles.summaryValue}>{monitoredApps.length}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#FFF',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#007AFF',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  pieChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centerLabel: {
    alignItems: 'center',
  },
  centerLabelValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  centerLabelText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  legend: {
    flex: 1,
    marginLeft: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  legendValue: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  achievementsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  achievementsList: {
    gap: 16,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  achievementDate: {
    fontSize: 12,
    color: '#34C759',
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});