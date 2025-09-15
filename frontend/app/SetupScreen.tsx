import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppState } from '../store/AppStore';

export default function SetupScreen() {
  const navigation = useNavigation();
  const { addMonitoredApp, updateSettings } = useAppState();
  
  const [step, setStep] = useState(1);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [customLimits, setCustomLimits] = useState<{[key: string]: number}>({});
  const [difficulty, setDifficulty] = useState('auto');
  const [dailyGoal, setDailyGoal] = useState(60);

  const popularApps = [
    { id: 'instagram', name: 'Instagram', packageName: 'com.instagram.android', defaultLimit: 30 },
    { id: 'tiktok', name: 'TikTok', packageName: 'com.tiktok.android', defaultLimit: 45 },
    { id: 'twitter', name: 'Twitter', packageName: 'com.twitter.android', defaultLimit: 25 },
    { id: 'youtube', name: 'YouTube', packageName: 'com.youtube.android', defaultLimit: 60 },
    { id: 'facebook', name: 'Facebook', packageName: 'com.facebook.android', defaultLimit: 30 },
    { id: 'snapchat', name: 'Snapchat', packageName: 'com.snapchat.android', defaultLimit: 20 },
  ];

  const difficultyOptions = [
    { value: 'auto', label: 'Auto-adjusting', description: 'AI adapts to your skill level' },
    { value: 'easy', label: 'Easy', description: 'Simple math problems' },
    { value: 'medium', label: 'Medium', description: 'Moderate difficulty' },
    { value: 'hard', label: 'Hard', description: 'Challenging problems' },
  ];

  const goalOptions = [30, 45, 60, 90, 120];

  const handleAppToggle = (appId: string) => {
    setSelectedApps(prev => {
      if (prev.includes(appId)) {
        return prev.filter(id => id !== appId);
      } else {
        return [...prev, appId];
      }
    });
  };

  const handleLimitChange = (appId: string, limit: string) => {
    const numLimit = parseInt(limit) || 0;
    setCustomLimits(prev => ({
      ...prev,
      [appId]: numLimit
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (selectedApps.length === 0) {
        Alert.alert('Select Apps', 'Please select at least one app to monitor.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else {
      handleFinishSetup();
    }
  };

  const handleFinishSetup = () => {
    // Add selected apps
    selectedApps.forEach(appId => {
      const app = popularApps.find(a => a.id === appId);
      if (app) {
        addMonitoredApp({
          name: app.name,
          packageName: app.packageName,
          dailyLimit: customLimits[appId] || app.defaultLimit,
        });
      }
    });

    // Update settings
    updateSettings({
      difficultySetting: difficulty as any,
      dailyGoal,
    });

    Alert.alert(
      'Setup Complete!',
      'Your Brain Rot Reduction app is ready. Start monitoring your usage and earning time through challenges!',
      [
        { text: 'Get Started', onPress: () => navigation.goBack() }
      ]
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Apps to Monitor</Text>
      <Text style={styles.stepDescription}>
        Choose which social media apps you want to limit and track
      </Text>

      <ScrollView style={styles.appsList} showsVerticalScrollIndicator={false}>
        {popularApps.map((app) => (
          <TouchableOpacity
            key={app.id}
            style={[
              styles.appOption,
              selectedApps.includes(app.id) && styles.appOptionSelected
            ]}
            onPress={() => handleAppToggle(app.id)}
          >
            <View style={styles.appOptionIcon}>
              <Text style={styles.appOptionIconText}>
                {app.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.appOptionInfo}>
              <Text style={styles.appOptionName}>{app.name}</Text>
              <Text style={styles.appOptionLimit}>
                Default: {app.defaultLimit} minutes/day
              </Text>
            </View>
            <View style={styles.checkbox}>
              {selectedApps.includes(app.id) && (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStep2 = () => (
    <KeyboardAvoidingView 
      style={styles.stepContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.stepTitle}>Set Time Limits</Text>
      <Text style={styles.stepDescription}>
        Customize daily time limits for each selected app
      </Text>

      <ScrollView style={styles.limitsList} showsVerticalScrollIndicator={false}>
        {selectedApps.map((appId) => {
          const app = popularApps.find(a => a.id === appId);
          if (!app) return null;

          return (
            <View key={appId} style={styles.limitItem}>
              <View style={styles.limitAppInfo}>
                <View style={styles.limitAppIcon}>
                  <Text style={styles.limitAppIconText}>
                    {app.name.charAt(0)}
                  </Text>
                </View>
                <Text style={styles.limitAppName}>{app.name}</Text>
              </View>
              <View style={styles.limitInput}>
                <TextInput
                  style={styles.limitTextInput}
                  value={(customLimits[appId] || app.defaultLimit).toString()}
                  onChangeText={(text) => handleLimitChange(appId, text)}
                  keyboardType="numeric"
                  placeholder="60"
                />
                <Text style={styles.limitUnit}>min</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Challenge Difficulty</Text>
      <Text style={styles.stepDescription}>
        Choose how challenging you want the math problems to be
      </Text>

      <View style={styles.optionsList}>
        {difficultyOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.difficultyOption,
              difficulty === option.value && styles.difficultyOptionSelected
            ]}
            onPress={() => setDifficulty(option.value)}
          >
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>{option.label}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            <View style={[
              styles.radioButton,
              difficulty === option.value && styles.radioButtonSelected
            ]}>
              {difficulty === option.value && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Set Your Daily Goal</Text>
      <Text style={styles.stepDescription}>
        How many minutes do you want to save per day?
      </Text>

      <View style={styles.goalGrid}>
        {goalOptions.map((goal) => (
          <TouchableOpacity
            key={goal}
            style={[
              styles.goalOption,
              dailyGoal === goal && styles.goalOptionSelected
            ]}
            onPress={() => setDailyGoal(goal)}
          >
            <Text style={[
              styles.goalValue,
              dailyGoal === goal && styles.goalValueSelected
            ]}>
              {goal}
            </Text>
            <Text style={[
              styles.goalLabel,
              dailyGoal === goal && styles.goalLabelSelected
            ]}>
              minutes
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.goalInfo}>
        <Ionicons name="information-circle" size={20} color="#007AFF" />
        <Text style={styles.goalInfoText}>
          This goal helps track your progress and motivates you to reduce screen time
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {step} of 4</Text>
      </View>

      {/* Step Content */}
      <View style={styles.content}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        {step > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {step === 4 ? 'Finish Setup' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  progressContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 24,
    marginBottom: 32,
  },
  appsList: {
    flex: 1,
  },
  appOption: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  appOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  appOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appOptionIconText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  appOptionInfo: {
    flex: 1,
  },
  appOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  appOptionLimit: {
    fontSize: 14,
    color: '#8E8E93',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  limitsList: {
    flex: 1,
  },
  limitItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  limitAppInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  limitAppIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  limitAppIconText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  limitAppName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  limitInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  limitTextInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    textAlign: 'center',
    minWidth: 60,
    marginRight: 8,
  },
  limitUnit: {
    fontSize: 14,
    color: '#8E8E93',
  },
  optionsList: {
    gap: 12,
  },
  difficultyOption: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  difficultyOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#007AFF',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  goalOption: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  goalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  goalValueSelected: {
    color: '#007AFF',
  },
  goalLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  goalLabelSelected: {
    color: '#007AFF',
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  goalInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#E5E5EA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});