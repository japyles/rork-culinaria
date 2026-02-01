import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ScrollView,
  Platform,
  Vibration,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Play, Pause, Timer } from 'lucide-react-native';
import * as ExpoAv from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, BorderRadius } from '@/constants/colors';

const ITEM_HEIGHT = 50;

export default function TimerScreen() {
  const insets = useSafeAreaInsets();
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [pickerHours, setPickerHours] = useState(0);
  const [pickerMinutes, setPickerMinutes] = useState(0);
  
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<ExpoAv.Audio.Sound | null>(null);
  const webAudioRef = useRef<HTMLAudioElement | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hoursScrollRef = useRef<ScrollView>(null);
  const minutesScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (webAudioRef.current) {
        webAudioRef.current.pause();
        webAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, timerSeconds]);

  useEffect(() => {
    if (isTimerRunning && timerSeconds === 0) {
      setIsTimerRunning(false);
      setIsTimerFinished(true);
      playAlarm();
    }
  }, [timerSeconds, isTimerRunning]);

  useEffect(() => {
    if (isTimerFinished) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isTimerFinished, pulseAnim]);

  const playAlarm = async () => {
    try {
      if (Platform.OS !== 'web') {
        Vibration.vibrate([500, 500, 500, 500, 500]);
      }
      
      if (Platform.OS !== 'web') {
        try {
          await ExpoAv.Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
          });
          
          const { sound } = await ExpoAv.Audio.Sound.createAsync(
            { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
            { shouldPlay: true, isLooping: true }
          );
          soundRef.current = sound;
        } catch (audioError) {
          console.log('Error with native audio:', audioError);
        }
      } else {
        try {
          if (typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
            const webAudio = new window.Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            webAudio.loop = true;
            await webAudio.play();
            webAudioRef.current = webAudio;
          }
        } catch (webAudioError) {
          console.log('Web audio error:', webAudioError);
        }
      }
    } catch (error) {
      console.log('Alarm error:', error);
    }
  };

  const stopAlarm = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    if (webAudioRef.current) {
      webAudioRef.current.pause();
      webAudioRef.current = null;
    }
    if (Platform.OS !== 'web') {
      Vibration.cancel();
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    if (timerSeconds === 0) {
      const totalSeconds = pickerHours * 3600 + pickerMinutes * 60;
      if (totalSeconds > 0) {
        setTimerSeconds(totalSeconds);
      }
    }
    setIsTimerRunning(true);
    setIsTimerFinished(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const resetTimer = async () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setIsTimerFinished(false);
    setPickerHours(0);
    setPickerMinutes(0);
    await stopAlarm();
    hoursScrollRef.current?.scrollTo({ y: 0, animated: true });
    minutesScrollRef.current?.scrollTo({ y: 0, animated: true });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleHoursScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (index >= 0 && index < 24 && index !== pickerHours) {
      setPickerHours(index);
    }
  };

  const handleMinutesScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (index >= 0 && index < 60 && index !== pickerMinutes) {
      setPickerMinutes(index);
    }
  };

  const handleHoursScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(23, index));
    setPickerHours(clampedIndex);
    hoursScrollRef.current?.scrollTo({ y: clampedIndex * ITEM_HEIGHT, animated: true });
    Haptics.selectionAsync();
  };

  const handleMinutesScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(59, index));
    setPickerMinutes(clampedIndex);
    minutesScrollRef.current?.scrollTo({ y: clampedIndex * ITEM_HEIGHT, animated: true });
    Haptics.selectionAsync();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6B8BA4', '#8FA4B8', '#B8C5D0', '#C9D1D9']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      
      <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.header}>
          <Timer size={28} color="#2C3E50" />
          <Text style={styles.headerTitle}>Cooking Timer</Text>
        </View>

        {isTimerRunning || timerSeconds > 0 ? (
          <View style={styles.currentTimerSection}>
            <Text style={styles.currentTimerLabel}>
              {isTimerFinished ? 'Timer Complete!' : 'Current Timer'}
            </Text>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Text style={[
                styles.currentTimerValue,
                isTimerFinished && styles.currentTimerValueFinished
              ]}>
                {formatTime(timerSeconds)}
              </Text>
            </Animated.View>
            {isTimerFinished && (
              <Text style={styles.timerFinishedSubtext}>Time is up!</Text>
            )}
          </View>
        ) : (
          <View style={styles.currentTimerSection}>
            <Text style={styles.currentTimerLabel}>Current Timer</Text>
            <Text style={styles.currentTimerValue}>
              {pickerHours > 0 || pickerMinutes > 0 
                ? `${pickerHours > 0 ? `${pickerHours}hr ` : ''}${pickerMinutes}min 0sec`
                : '0min 0sec'
              }
            </Text>
          </View>
        )}

        <View style={styles.timerDivider} />

        <Text style={styles.timerQuestion}>
          How long do you want to{'\n'}cook for?
        </Text>

        <View style={styles.pickerContainer}>
          <View style={styles.pickerColumn}>
            <ScrollView
              ref={hoursScrollRef}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onScroll={handleHoursScroll}
              onMomentumScrollEnd={handleHoursScrollEnd}
              scrollEventThrottle={16}
              contentContainerStyle={styles.pickerScrollContent}
              style={styles.pickerScroll}
            >
              {[...Array(24)].map((_, i) => (
                <View key={i} style={styles.pickerItem}>
                  <Text style={[
                    styles.pickerItemText,
                    i === pickerHours && styles.pickerItemTextActive
                  ]}>
                    {i}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <Text style={styles.pickerLabel}>hour</Text>
          </View>

          <View style={styles.pickerColumn}>
            <ScrollView
              ref={minutesScrollRef}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onScroll={handleMinutesScroll}
              onMomentumScrollEnd={handleMinutesScrollEnd}
              scrollEventThrottle={16}
              contentContainerStyle={styles.pickerScrollContent}
              style={styles.pickerScroll}
            >
              {[...Array(60)].map((_, i) => (
                <View key={i} style={styles.pickerItem}>
                  <Text style={[
                    styles.pickerItemText,
                    i === pickerMinutes && styles.pickerItemTextActive
                  ]}>
                    {i}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <Text style={styles.pickerLabel}>min</Text>
          </View>
        </View>

        <View style={styles.timerButtonsContainer}>
          {!isTimerRunning ? (
            <Pressable 
              style={[styles.timerStartButton, timerSeconds === 0 && pickerHours === 0 && pickerMinutes === 0 && styles.timerStartButtonDisabled]} 
              onPress={() => {
                if (timerSeconds === 0) {
                  const totalSeconds = pickerHours * 3600 + pickerMinutes * 60;
                  setTimerSeconds(totalSeconds);
                }
                startTimer();
              }}
              disabled={timerSeconds === 0 && pickerHours === 0 && pickerMinutes === 0}
            >
              <Play size={20} color="#5A7A8A" style={{ marginRight: 8 }} />
              <Text style={styles.timerStartButtonText}>Start Timer</Text>
            </Pressable>
          ) : (
            <Pressable 
              style={styles.timerStartButton} 
              onPress={pauseTimer}
            >
              <Pause size={20} color="#5A7A8A" style={{ marginRight: 8 }} />
              <Text style={styles.timerStartButtonText}>Pause</Text>
            </Pressable>
          )}

          <Pressable onPress={resetTimer} style={styles.timerResetButton}>
            <Text style={styles.timerResetButtonText}>Reset Timer</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: BorderRadius.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#2C3E50',
  },
  currentTimerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  currentTimerLabel: {
    fontSize: 16,
    color: 'rgba(44, 62, 80, 0.6)',
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  currentTimerValue: {
    fontSize: 48,
    fontWeight: '300' as const,
    color: '#2C3E50',
    letterSpacing: 2,
  },
  currentTimerValueFinished: {
    color: '#E74C3C',
  },
  timerFinishedSubtext: {
    fontSize: 16,
    color: '#E74C3C',
    fontWeight: '500' as const,
    marginTop: 8,
  },
  timerDivider: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(44, 62, 80, 0.15)',
    marginVertical: 24,
  },
  timerQuestion: {
    fontSize: 20,
    color: '#2C3E50',
    fontWeight: '500' as const,
    textAlign: 'center' as const,
    lineHeight: 28,
    marginBottom: 30,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 40,
  },
  pickerColumn: {
    alignItems: 'center',
  },
  pickerScroll: {
    height: 150,
    width: 60,
  },
  pickerScrollContent: {
    paddingVertical: 50,
  },
  pickerItem: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemText: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.35)',
    fontWeight: '400' as const,
  },
  pickerItemTextActive: {
    fontSize: 32,
    color: '#2C3E50',
    fontWeight: '600' as const,
  },
  pickerLabel: {
    fontSize: 18,
    color: '#2C3E50',
    fontWeight: '500' as const,
    marginTop: Spacing.xs,
  },
  timerButtonsContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 'auto' as const,
  },
  timerStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F0E8',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerStartButtonDisabled: {
    opacity: 0.5,
  },
  timerStartButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#5A7A8A',
  },
  timerResetButton: {
    padding: Spacing.md,
  },
  timerResetButtonText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500' as const,
  },
});
