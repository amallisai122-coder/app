import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppState } from './store/AppStore';

export default function ChallengeScreen() {
  const {
    currentChallenge,
    generateChallenge,
    submitChallengeAnswer,
    completedChallenges,
    settings,
  } = useAppState();

  const [answer, setAnswer] = useState('');
  const [streak, setStreak] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{correct: boolean, reward: number} | null>(null);

  useEffect(() => {
    // Calculate current streak
    const recentChallenges = completedChallenges.slice(-10);
    let currentStreak = 0;
    for (let i = recentChallenges.length - 1; i >= 0; i--) {
      if (recentChallenges[i].correct) {
        currentStreak++;
      } else {
        break;
      }
    }
    setStreak(currentStreak);
  }, [completedChallenges]);

  const handleNewChallenge = async () => {
    setAnswer('');
    setShowResult(false);
    setLastResult(null);
    await generateChallenge();
  };

  const handleSubmitAnswer = () => {
    if (!answer.trim() || !currentChallenge) return;

    const numericAnswer = parseInt(answer);
    if (isNaN(numericAnswer)) {
      Alert.alert('Invalid Answer', 'Please enter a valid number');
      return;
    }

    const correct = submitChallengeAnswer(numericAnswer);
    const reward = correct ? currentChallenge.timeReward + (streak > 0 ? streak * 2 : 0) : 0;
    
    setLastResult({ correct, reward });
    setShowResult(true);

    if (correct) {
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#34C759';
      case 'medium': return '#FF9500';
      case 'hard': return '#FF3B30';
      default: return '#007AFF';
    }
  };

  const todayStats = useMemo(() => {
    const today = new Date().toDateString();
    const todaysChallenges = completedChallenges.filter(c => {
      // Check if the challenge was completed today
      // Since challenge id is timestamp-based, we can extract the date
      const challengeTimestamp = parseInt(c.id);
      if (!isNaN(challengeTimestamp)) {
        const challengeDate = new Date(challengeTimestamp);
        return challengeDate.toDateString() === today;
      }
      return false;
    });

    return {
      attempted: todaysChallenges.length,
      correct: todaysChallenges.filter(c => c.correct).length,
      timeEarned: todaysChallenges
        .filter(c => c.correct)
        .reduce((sum, c) => sum + c.timeReward, 0),
    };
  }, [completedChallenges]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header Stats */}
        <View style={styles.headerStats}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{streak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todayStats.correct}/{todayStats.attempted}</Text>
            <Text style={styles.statLabel}>Today's Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todayStats.timeEarned}m</Text>
            <Text style={styles.statLabel}>Time Earned</Text>
          </View>
        </View>

        {showResult && lastResult ? (
          /* Result Screen */
          <View style={styles.resultContainer}>
            <Ionicons 
              name={lastResult.correct ? 'checkmark-circle' : 'close-circle'}
              size={80}
              color={lastResult.correct ? '#34C759' : '#FF3B30'}
            />
            <Text style={styles.resultTitle}>
              {lastResult.correct ? 'Correct!' : 'Incorrect'}
            </Text>
            {lastResult.correct && (
              <Text style={styles.rewardText}>
                You earned {lastResult.reward} minutes!
                {streak > 1 && ` (${streak}x streak bonus!)`}
              </Text>
            )}
            {!lastResult.correct && currentChallenge && (
              <Text style={styles.correctAnswerText}>
                The correct answer was {currentChallenge.answer}
              </Text>
            )}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleNewChallenge}
            >
              <Text style={styles.primaryButtonText}>Next Challenge</Text>
            </TouchableOpacity>
          </View>
        ) : currentChallenge ? (
          /* Challenge Screen */
          <View style={styles.challengeContainer}>
            <View style={styles.difficultyBadge}>
              <Text style={[
                styles.difficultyText,
                { color: getDifficultyColor(currentChallenge.difficulty) }
              ]}>
                {currentChallenge.difficulty.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.challengeQuestion}>
              {currentChallenge.question}
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.answerInput}
                value={answer}
                onChangeText={setAnswer}
                placeholder="Your answer"
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={handleSubmitAnswer}
                autoFocus
              />
            </View>

            <View style={styles.challengeInfo}>
              <Text style={styles.rewardInfo}>
                <Ionicons name="time" size={16} color="#007AFF" />
                {' '}Reward: {currentChallenge.timeReward} minutes
              </Text>
              {streak > 0 && (
                <Text style={styles.streakBonus}>
                  <Ionicons name="flame" size={16} color="#FF9500" />
                  {' '}Streak bonus: +{streak * 2} minutes
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { opacity: answer.trim() ? 1 : 0.5 }
              ]}
              onPress={handleSubmitAnswer}
              disabled={!answer.trim()}
            >
              <Text style={styles.submitButtonText}>Submit Answer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* No Challenge State */
          <View style={styles.noChallengeContainer}>
            <Ionicons name="calculator-outline" size={80} color="#8E8E93" />
            <Text style={styles.noChallengeTitle}>Ready for a Challenge?</Text>
            <Text style={styles.noChallengeSubtitle}>
              Solve math problems to earn extra time on your apps
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleNewChallenge}
            >
              <Text style={styles.primaryButtonText}>Start Challenge</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Difficulty Setting */}
        <View style={styles.settingsHint}>
          <Text style={styles.hintText}>
            Difficulty: {settings.difficultySetting === 'auto' ? 'Auto-adjusting' : settings.difficultySetting}
          </Text>
          <Text style={styles.hintSubtext}>
            Change in Settings to customize challenge difficulty
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardView: {
    flex: 1,
  },
  headerStats: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
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
  challengeContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  difficultyBadge: {
    alignSelf: 'center',
    marginBottom: 32,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  challengeQuestion: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 48,
  },
  inputContainer: {
    marginBottom: 32,
  },
  answerInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    fontSize: 24,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  challengeInfo: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  rewardInfo: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  streakBonus: {
    fontSize: 16,
    color: '#FF9500',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 16,
  },
  rewardText: {
    fontSize: 18,
    color: '#34C759',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  correctAnswerText: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
  },
  noChallengeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noChallengeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  noChallengeSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  settingsHint: {
    padding: 16,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  hintSubtext: {
    fontSize: 12,
    color: '#C7C7CC',
    marginTop: 4,
  },
});