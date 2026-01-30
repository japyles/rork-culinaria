import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Check, ChevronRight, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
];

export default function OnboardingScreen() {
  const { updateProfile, isUpdatingProfile, profile } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [step, setStep] = useState(1);

  const handleAvatarSelect = (url: string) => {
    setSelectedAvatar(url);
    setCustomAvatarUrl('');
  };

  const handleCustomAvatarChange = (url: string) => {
    setCustomAvatarUrl(url);
    if (url.trim()) {
      setSelectedAvatar(url.trim());
    }
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleComplete = async () => {
    try {
      await updateProfile({
        avatarUrl: selectedAvatar,
        bio: bio.trim(),
      });
      console.log('[Onboarding] Profile updated successfully');
      router.replace('/');
    } catch (error) {
      console.error('[Onboarding] Error updating profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const handleSkip = () => {
    router.replace('/');
  };

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.primaryDark, '#1a1a2e']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.sparkleContainer}>
                <Sparkles size={32} color="#FFD700" />
              </View>
              <Text style={styles.welcomeText}>Welcome to Culinaria!</Text>
              <Text style={styles.subtitleText}>
                {step === 1
                  ? "Let's personalize your profile"
                  : 'Tell us about yourself'}
              </Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: step === 1 ? '50%' : '100%' },
                  ]}
                />
              </View>
              <Text style={styles.stepText}>Step {step} of 2</Text>
            </View>

            <View style={styles.card}>
              {step === 1 ? (
                <>
                  <Text style={styles.cardTitle}>Choose your avatar</Text>
                  <Text style={styles.cardSubtitle}>
                    Select a photo that represents you
                  </Text>

                  <View style={styles.selectedAvatarContainer}>
                    <Image
                      source={{ uri: selectedAvatar }}
                      style={styles.selectedAvatar}
                    />
                    <View style={styles.avatarBadge}>
                      <Camera size={16} color="#fff" />
                    </View>
                  </View>

                  <View style={styles.avatarGrid}>
                    {AVATAR_OPTIONS.map((url, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.avatarOption,
                          selectedAvatar === url && styles.avatarOptionSelected,
                        ]}
                        onPress={() => handleAvatarSelect(url)}
                        testID={`avatar-option-${index}`}
                      >
                        <Image source={{ uri: url }} style={styles.avatarImage} />
                        {selectedAvatar === url && (
                          <View style={styles.checkBadge}>
                            <Check size={12} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.customUrlContainer}>
                    <Text style={styles.orText}>or use a custom URL</Text>
                    <TextInput
                      style={styles.urlInput}
                      placeholder="https://example.com/your-photo.jpg"
                      placeholderTextColor={Colors.textSecondary}
                      value={customAvatarUrl}
                      onChangeText={handleCustomAvatarChange}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.nextButton}
                    onPress={handleNext}
                    testID="next-button"
                  >
                    <Text style={styles.nextButtonText}>Continue</Text>
                    <ChevronRight size={20} color="#fff" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.cardTitle}>Add a bio</Text>
                  <Text style={styles.cardSubtitle}>
                    Share what makes you passionate about cooking
                  </Text>

                  <View style={styles.bioPreview}>
                    <Image
                      source={{ uri: selectedAvatar }}
                      style={styles.bioAvatar}
                    />
                    <View style={styles.bioInfo}>
                      <Text style={styles.bioName}>
                        {profile?.displayName || 'Your Name'}
                      </Text>
                      <Text style={styles.bioUsername}>
                        @{profile?.username || 'username'}
                      </Text>
                    </View>
                  </View>

                  <TextInput
                    style={styles.bioInput}
                    placeholder="I love experimenting with new recipes and sharing my culinary adventures..."
                    placeholderTextColor={Colors.textSecondary}
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    numberOfLines={4}
                    maxLength={200}
                    textAlignVertical="top"
                    testID="bio-input"
                  />
                  <Text style={styles.charCount}>{bio.length}/200</Text>

                  <View style={styles.bioSuggestions}>
                    <Text style={styles.suggestionsTitle}>Quick suggestions:</Text>
                    <View style={styles.suggestionChips}>
                      {[
                        'Home cook 👨‍🍳',
                        'Food lover 🍕',
                        'Healthy eater 🥗',
                        'Baker 🧁',
                      ].map((suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.suggestionChip}
                          onPress={() => setBio(bio + (bio ? ' ' : '') + suggestion)}
                        >
                          <Text style={styles.suggestionText}>{suggestion}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.completeButton,
                      isUpdatingProfile && styles.buttonDisabled,
                    ]}
                    onPress={handleComplete}
                    disabled={isUpdatingProfile}
                    testID="complete-button"
                  >
                    {isUpdatingProfile ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.completeButtonText}>
                          Complete Setup
                        </Text>
                        <Check size={20} color="#fff" />
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setStep(1)}
                  >
                    <Text style={styles.backButtonText}>Back to avatar</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sparkleContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  stepText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  selectedAvatarContainer: {
    alignSelf: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  selectedAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  avatarOption: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: Colors.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  checkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customUrlContainer: {
    marginBottom: 24,
  },
  orText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  urlInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  bioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  bioAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  bioInfo: {
    flex: 1,
  },
  bioName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  bioUsername: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  bioInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },
  bioSuggestions: {
    marginBottom: 24,
  },
  suggestionsTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionText: {
    fontSize: 13,
    color: Colors.text,
  },
  completeButton: {
    backgroundColor: Colors.success,
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  backButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  skipButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500' as const,
  },
});
