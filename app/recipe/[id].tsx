import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Share,
  Dimensions,
  Alert,
  Platform,
  Modal,
  Vibration,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import * as ExpoAv from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Heart,
  Share2,
  Clock,
  Users,
  ChefHat,
  Check,
  MoreVertical,
  Edit3,
  Trash2,
  X,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Sparkles,
  Star,
  MessageSquare,
  User as UserIcon,
} from 'lucide-react-native';
import { Ingredient, User } from '@/types/recipe';
import Colors, { Spacing, Typography, BorderRadius, Shadow } from '@/constants/colors';
import { useRecipes, } from '@/contexts/RecipeContext';
import * as Haptics from 'expo-haptics';
import { useSocial } from '@/contexts/SocialContext';
import GlassCard from '@/components/GlassCard';
import Button from '@/components/Button';
import { mockUsers } from '@/mocks/users';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getRecipeById, toggleFavorite, addRecentlyViewed, isCustomRecipe, deleteRecipe, addReview, getReviewsForRecipe, getAverageRating, addToShoppingList } = useRecipes();
  const { getFollowingUsers, getFollowersUsers, shareRecipe, isFollowing: isFollowingUser } = useSocial();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');
  const [showMenu, setShowMenu] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [showServingAdjuster, setShowServingAdjuster] = useState(false);
  const [adjustedServings, setAdjustedServings] = useState<number | null>(null);
  const [adjustedIngredients, setAdjustedIngredients] = useState<Ingredient[] | null>(null);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedShareUsers, setSelectedShareUsers] = useState<string[]>([]);
  const [shareMessage, setShareMessage] = useState('');
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<ExpoAv.Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const recipe = getRecipeById(id || '');

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (id) {
      addRecentlyViewed(id);
    }
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [id]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
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
  }, [isTimerFinished]);

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
        // Web fallback using HTML5 Audio
        try {
          if (typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
            const webAudio = new window.Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            webAudio.loop = true;
            await webAudio.play();
            // Store reference for cleanup
            (soundRef.current as any) = { webAudio };
          }
        } catch (webAudioError) {
          console.log('Error with web audio:', webAudioError);
        }
      }
    } catch (error) {
      console.log('Error playing alarm:', error);
      if (Platform.OS !== 'web') {
        Vibration.vibrate([500, 500, 500, 500, 500]);
      }
    }
  };

  const stopAlarm = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      // Handle web audio cleanup
      if (soundRef.current && (soundRef.current as any).webAudio) {
        (soundRef.current as any).webAudio.pause();
        (soundRef.current as any).webAudio = null;
      }
      if (Platform.OS !== 'web') {
        Vibration.cancel();
      }
    } catch (error) {
      console.log('Error stopping alarm:', error);
    }
  };

  const openTimer = useCallback(() => {
    if (recipe && typeof recipe.cookTime === 'number' && recipe.cookTime > 0) {
      const cookTimeInSeconds = recipe.cookTime * 60;
      setTimerSeconds(cookTimeInSeconds);
      setIsTimerRunning(false);
      setIsTimerFinished(false);
      setShowTimer(true);
    } else {
      setTimerSeconds(60);
      setIsTimerRunning(false);
      setIsTimerFinished(false);
      setShowTimer(true);
    }
  }, [recipe]);

  const startTimer = () => {
    if (timerSeconds > 0) {
      if (isTimerFinished) {
        stopAlarm();
        setIsTimerFinished(false);
      }
      setIsTimerRunning(true);
    }
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setIsTimerFinished(false);
    stopAlarm();
    const defaultTime = recipe && typeof recipe.cookTime === 'number' && recipe.cookTime > 0 
      ? recipe.cookTime * 60 
      : 60;
    setTimerSeconds(defaultTime);
  };

  const addOneMinute = () => {
    if (isTimerFinished) {
      stopAlarm();
      setIsTimerFinished(false);
    }
    setTimerSeconds((prev) => prev + 60);
  };

  const subtractOneMinute = () => {
    if (isTimerFinished) {
      stopAlarm();
      setIsTimerFinished(false);
    }
    setTimerSeconds((prev) => Math.max(0, prev - 60));
  };

  const closeTimer = () => {
    setShowTimer(false);
    setIsTimerRunning(false);
    stopAlarm();
  };

  const openServingAdjuster = () => {
    if (recipe) {
      setAdjustedServings(adjustedServings ?? recipe.servings);
      setShowServingAdjuster(true);
    }
  };

  const adjustServingsWithAI = async (newServings: number) => {
    if (!recipe || newServings === recipe.servings) {
      if (newServings === recipe?.servings) {
        setAdjustedIngredients(null);
        setAdjustedServings(null);
      }
      setShowServingAdjuster(false);
      return;
    }

    setIsAdjusting(true);
    console.log('Adjusting recipe for', newServings, 'servings');

    try {
      const ingredientSchema = z.object({
        ingredients: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            amount: z.string(),
            unit: z.string(),
          })
        ),
      });

      const ingredientsList = recipe.ingredients
        .map((ing) => `- ${ing.amount} ${ing.unit} ${ing.name}`)
        .join('\n');

      const result = await generateObject({
        messages: [
          {
            role: 'user',
            content: `I have a recipe that serves ${recipe.servings} people with these ingredients:

${ingredientsList}

Please adjust all ingredient amounts for ${newServings} servings. Keep the same units but adjust the amounts proportionally. Use practical measurements (e.g., "1/2" instead of "0.5", "1 1/4" instead of "1.25"). Return the adjusted ingredients with the same IDs and names.`,
          },
        ],
        schema: ingredientSchema,
      });

      console.log('AI adjusted ingredients:', result);
      setAdjustedIngredients(result.ingredients);
      setAdjustedServings(newServings);
      setShowServingAdjuster(false);
    } catch (error) {
      console.error('Error adjusting servings:', error);
      Alert.alert('Error', 'Failed to adjust recipe. Please try again.');
    } finally {
      setIsAdjusting(false);
    }
  };

  const resetServings = () => {
    setAdjustedIngredients(null);
    setAdjustedServings(null);
    setShowServingAdjuster(false);
  };

  const currentServings = adjustedServings ?? recipe?.servings ?? 0;
  const displayIngredients = adjustedIngredients ?? recipe?.ingredients ?? [];

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const canEdit = recipe ? isCustomRecipe(recipe.id) : false;

  const recipeReviews = recipe ? getReviewsForRecipe(recipe.id) : [];
  const averageRating = recipe ? getAverageRating(recipe.id) : null;
  const displayRating = averageRating !== null ? averageRating.toFixed(1) : recipe?.rating.toFixed(1);
  const displayReviewCount = recipeReviews.length > 0 ? recipeReviews.length : recipe?.reviewCount ?? 0;

  const recipeAuthor = recipe?.authorId ? mockUsers.find(u => u.id === recipe.authorId) : null;

  const handleSubmitReview = () => {
    if (!recipe || !reviewComment.trim() || !reviewAuthor.trim()) {
      Alert.alert('Missing Information', 'Please enter your name and a comment.');
      return;
    }
    addReview({
      recipeId: recipe.id,
      rating: reviewRating,
      comment: reviewComment.trim(),
      authorName: reviewAuthor.trim(),
    });
    setShowReviewModal(false);
    setReviewRating(5);
    setReviewComment('');
    setReviewAuthor('');
    Alert.alert('Thank You!', 'Your review has been submitted.');
  };

  const formatReviewDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderStars = (rating: number, size: number = 16, interactive: boolean = false, onPress?: (rating: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => interactive && onPress && onPress(star)}
            disabled={!interactive}
            style={styles.starButton}
          >
            <Star
              size={size}
              color={star <= rating ? '#FFB800' : Colors.borderLight}
              fill={star <= rating ? '#FFB800' : 'transparent'}
            />
          </Pressable>
        ))}
      </View>
    );
  };

  const handleShare = async () => {
    console.log('handleShare called');
    if (!recipe) return;
    setShowShareModal(true);
  };

  const handleExternalShare = async () => {
    if (!recipe) return;
    try {
      const deepLink = Linking.createURL(`/recipe/${recipe.id}`);
      const appStoreUrl = 'https://apps.apple.com/app/id123456789';
      const playStoreUrl = 'https://play.google.com/store/apps/details?id=app.rork.culinaria';
      
      const externalShareMessage = `Check out this recipe: ${recipe.title}\n\nOpen in Culinaria: ${deepLink}\n\nDon't have the app?\niPhone: ${appStoreUrl}\nAndroid: ${playStoreUrl}`;
      
      const shareContent = Platform.select({
        web: {
          title: recipe.title,
          text: externalShareMessage,
        },
        default: {
          message: externalShareMessage,
          title: recipe.title,
        },
      });
      
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share(shareContent as ShareData);
        } else {
          await navigator.clipboard.writeText(externalShareMessage);
          Alert.alert('Copied!', 'Recipe link copied to clipboard');
        }
      } else {
        await Share.share(shareContent as { message: string; title: string });
      }
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedShareUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleShareWithUsers = () => {
    if (!recipe || selectedShareUsers.length === 0) {
      Alert.alert('Select Users', 'Please select at least one user to share with.');
      return;
    }
    shareRecipe(recipe.id, selectedShareUsers, shareMessage || undefined);
    setShowShareModal(false);
    setSelectedShareUsers([]);
    setShareMessage('');
    Alert.alert('Shared!', `Recipe shared with ${selectedShareUsers.length} user${selectedShareUsers.length > 1 ? 's' : ''}.`);
  };

  const allConnectedUsers = [...new Map([...getFollowingUsers, ...getFollowersUsers].map(u => [u.id, u])).values()];

  const handleOpenMenu = () => {
    console.log('handleOpenMenu called');
    setShowMenu(true);
  };

  const handleEdit = () => {
    console.log('handleEdit called');
    setShowMenu(false);
    router.push(`/edit-recipe?id=${recipe?.id}`);
  };

  const handleDelete = () => {
    setShowMenu(false);
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (recipe) {
              deleteRecipe(recipe.id);
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleFavorite = () => {
    console.log('handleFavorite called for recipe:', recipe?.id);
    if (!recipe) return;
    Animated.sequence([
      Animated.spring(heartAnim, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(heartAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    toggleFavorite(recipe.id);
  };

  const toggleStepComplete = (stepOrder: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepOrder)
        ? prev.filter((s) => s !== stepOrder)
        : [...prev, stepOrder]
    );
  };

  if (!recipe) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Recipe not found</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.5, 1],
    extrapolate: 'clamp',
  });

  const totalTime = recipe.prepTime + recipe.cookTime;
  const progress = (completedSteps.length / recipe.steps.length) * 100;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.headerBar, { opacity: headerOpacity }]}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <Pressable onPress={() => router.back()} style={styles.headerButton}>
              <ArrowLeft size={24} color={Colors.text} />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {recipe.title}
            </Text>
            <View style={styles.headerActions}>
              <Pressable 
                onPress={handleFavorite} 
                style={styles.headerButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Heart
                  size={24}
                  color={recipe.isFavorite ? '#FF6B6B' : Colors.text}
                  fill={recipe.isFavorite ? '#FF6B6B' : 'transparent'}
                />
              </Pressable>
              <Pressable 
                onPress={handleShare} 
                style={styles.headerButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Share2 size={24} color={Colors.text} />
              </Pressable>
              {canEdit && (
                <Pressable 
                  onPress={handleOpenMenu} 
                  style={styles.headerButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MoreVertical size={24} color={Colors.text} />
                </Pressable>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.imageContainer}>
          <Animated.Image
            source={{ uri: recipe.imageUrl }}
            style={[styles.heroImage, { transform: [{ scale: imageScale }] }]}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageGradient}
          />
          <SafeAreaView edges={['top']} style={styles.imageOverlay}>
            <View style={styles.overlayHeader}>
              <Pressable onPress={() => router.back()} style={styles.overlayButton}>
                <ArrowLeft size={24} color={Colors.textOnPrimary} />
              </Pressable>
              <View style={styles.overlayActions}>
                <Pressable 
                  onPress={handleFavorite} 
                  style={styles.overlayButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Animated.View style={{ transform: [{ scale: heartAnim }] }} pointerEvents="none">
                    <Heart
                      size={24}
                      color={recipe.isFavorite ? '#FF6B6B' : Colors.textOnPrimary}
                      fill={recipe.isFavorite ? '#FF6B6B' : 'transparent'}
                    />
                  </Animated.View>
                </Pressable>
                <Pressable 
                  onPress={handleShare} 
                  style={styles.overlayButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Share2 size={24} color={Colors.textOnPrimary} />
                </Pressable>
                {canEdit && (
                  <Pressable 
                    onPress={handleOpenMenu} 
                    style={styles.overlayButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MoreVertical size={24} color={Colors.textOnPrimary} />
                  </Pressable>
                )}
              </View>
            </View>
          </SafeAreaView>
          <View style={styles.heroContent}>
            <View style={styles.cuisineBadge}>
              <Text style={styles.cuisineText}>{recipe.cuisine}</Text>
            </View>
            <Text style={styles.heroTitle}>{recipe.title}</Text>
            {recipeAuthor && (
              <Pressable 
                style={styles.authorRow} 
                onPress={() => router.push(`/user/${recipeAuthor.id}`)}
              >
                <Animated.Image source={{ uri: recipeAuthor.avatarUrl }} style={styles.authorAvatar} />
                <Text style={styles.authorName}>by {recipeAuthor.displayName}</Text>
              </Pressable>
            )}
            <Pressable style={styles.ratingRow} onPress={() => setShowReviewModal(true)}>
              <Text style={styles.rating}>★ {displayRating}</Text>
              <Text style={styles.reviewCount}>({displayReviewCount} reviews)</Text>
            </Pressable>
          </View>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.metaCards}>
            <Pressable onPress={openTimer}>
              <GlassCard style={styles.metaCardClickable}>
                <Clock size={20} color={Colors.primary} />
                <Text style={styles.metaValue}>{totalTime}</Text>
                <Text style={styles.metaLabel}>minutes</Text>
                <Text style={styles.metaHint}>Tap to start timer</Text>
              </GlassCard>
            </Pressable>
            <Pressable onPress={openServingAdjuster}>
              <GlassCard style={[styles.metaCardClickable, adjustedServings && styles.metaCardAdjusted]}>
                <Users size={20} color={Colors.secondary} />
                <Text style={styles.metaValue}>{currentServings}</Text>
                <Text style={styles.metaLabel}>servings</Text>
                <View style={styles.aiHintRow}>
                  <Sparkles size={10} color={Colors.secondary} />
                  <Text style={[styles.metaHint, { color: Colors.secondary }]}>AI adjust</Text>
                </View>
              </GlassCard>
            </Pressable>
            <GlassCard style={styles.metaCard}>
              <ChefHat size={20} color={Colors.accent} />
              <Text style={styles.metaValue}>{recipe.difficulty}</Text>
              <Text style={styles.metaLabel}>level</Text>
            </GlassCard>
          </View>

          <Text style={styles.description}>{recipe.description}</Text>

          {recipe.nutrition && (
            <GlassCard style={styles.nutritionCard}>
              <Text style={styles.nutritionTitle}>Nutrition per serving</Text>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutrition.calories}</Text>
                  <Text style={styles.nutritionLabel}>kcal</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutrition.protein}g</Text>
                  <Text style={styles.nutritionLabel}>protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutrition.carbs}g</Text>
                  <Text style={styles.nutritionLabel}>carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutrition.fat}g</Text>
                  <Text style={styles.nutritionLabel}>fat</Text>
                </View>
              </View>
            </GlassCard>
          )}

          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, activeTab === 'ingredients' && styles.tabActive]}
              onPress={() => setActiveTab('ingredients')}
            >
              <Text
                style={[styles.tabText, activeTab === 'ingredients' && styles.tabTextActive]}
              >
                Ingredients
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'instructions' && styles.tabActive]}
              onPress={() => setActiveTab('instructions')}
            >
              <Text
                style={[styles.tabText, activeTab === 'instructions' && styles.tabTextActive]}
              >
                Instructions
              </Text>
            </Pressable>
          </View>

          {activeTab === 'ingredients' ? (
            <View style={styles.ingredientsList}>
              {adjustedServings && (
                <View style={styles.adjustedBanner}>
                  <Sparkles size={14} color={Colors.secondary} />
                  <Text style={styles.adjustedBannerText}>
                    Adjusted for {adjustedServings} servings
                  </Text>
                  <Pressable onPress={resetServings} style={styles.resetButton}>
                    <Text style={styles.resetButtonText}>Reset</Text>
                  </Pressable>
                </View>
              )}
              <Pressable
                style={styles.addAllIngredientsButton}
                onPress={() => {
                  addToShoppingList(displayIngredients, recipe?.id, recipe?.title);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert('Added', `All ${displayIngredients.length} ingredients added to shopping list`);
                }}
              >
                <Plus size={18} color={Colors.textOnPrimary} />
                <Text style={styles.addAllIngredientsText}>Add All Ingredients to Shopping List</Text>
              </Pressable>
              {displayIngredients.map((ingredient, index) => (
                <View key={ingredient.id || index} style={styles.ingredientItem}>
                  <View style={[styles.ingredientBullet, adjustedServings && styles.ingredientBulletAdjusted]} />
                  <Text style={[styles.ingredientAmount, adjustedServings && styles.ingredientAmountAdjusted]}>
                    {ingredient.amount} {ingredient.unit}
                  </Text>
                  <Text style={styles.ingredientName}>{ingredient.name}</Text>
                  <Pressable
                    style={styles.addIngredientButton}
                    onPress={() => {
                      addToShoppingList([ingredient], recipe?.id, recipe?.title);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Alert.alert('Added', `${ingredient.name} added to shopping list`);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Plus size={18} color={Colors.primary} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.stepsList}>
              {completedSteps.length > 0 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {completedSteps.length} of {recipe.steps.length} steps completed
                  </Text>
                </View>
              )}
              {recipe.steps.map((step) => {
                const isCompleted = completedSteps.includes(step.order);
                return (
                  <Pressable
                    key={step.id || step.order}
                    style={[styles.stepItem, isCompleted && styles.stepItemCompleted]}
                    onPress={() => toggleStepComplete(step.order)}
                  >
                    <View style={[styles.stepNumber, isCompleted && styles.stepNumberCompleted]}>
                      {isCompleted ? (
                        <Check size={16} color={Colors.textOnPrimary} />
                      ) : (
                        <Text style={styles.stepNumberText}>{step.order}</Text>
                      )}
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={[styles.stepText, isCompleted && styles.stepTextCompleted]}>
                        {step.instruction}
                      </Text>
                      {step.tip && (
                        <View style={styles.tipContainer}>
                          <Text style={styles.tipText}>💡 {step.tip}</Text>
                        </View>
                      )}
                      {step.duration && (
                        <View style={styles.durationContainer}>
                          <Clock size={12} color={Colors.textSecondary} />
                          <Text style={styles.durationText}>{step.duration} min</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.tagsContainer}>
            {recipe.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>

          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <View style={styles.reviewsTitleRow}>
                <MessageSquare size={20} color={Colors.primary} />
                <Text style={styles.reviewsTitle}>Reviews</Text>
                <Text style={styles.reviewsCount}>({displayReviewCount})</Text>
              </View>
              <Pressable style={styles.addReviewButton} onPress={() => setShowReviewModal(true)}>
                <Plus size={16} color={Colors.textOnPrimary} />
                <Text style={styles.addReviewButtonText}>Add Review</Text>
              </Pressable>
            </View>

            {recipeReviews.length > 0 ? (
              <View style={styles.reviewsList}>
                {recipeReviews.map((review) => (
                  <View key={review.id} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewAuthorRow}>
                        <View style={styles.reviewAvatar}>
                          <UserIcon size={16} color={Colors.textSecondary} />
                        </View>
                        <Text style={styles.reviewAuthor}>{review.authorName}</Text>
                      </View>
                      {renderStars(review.rating, 14)}
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                    <Text style={styles.reviewDate}>{formatReviewDate(review.createdAt)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noReviewsContainer}>
                <MessageSquare size={40} color={Colors.skyblue} />
                <Text style={styles.noReviewsText}>No reviews yet</Text>
                <Text style={styles.noReviewsSubtext}>Be the first to share your experience!</Text>
              </View>
            )}
          </View>

          <View style={styles.bottomPadding} />
        </Animated.View>
      </Animated.ScrollView>

      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.shareModalOverlay}>
          <View style={styles.shareModalContainer}>
            <View style={styles.shareModalHeader}>
              <Text style={styles.shareModalTitle}>Share Recipe</Text>
              <Pressable onPress={() => setShowShareModal(false)} style={styles.shareModalCloseButton}>
                <X size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <Pressable style={styles.externalShareButton} onPress={handleExternalShare}>
              <Share2 size={20} color={Colors.primary} />
              <Text style={styles.externalShareText}>Share via other apps...</Text>
            </Pressable>

            <Text style={styles.shareModalSubtitle}>Share with your connections</Text>

            {allConnectedUsers.length > 0 ? (
              <Animated.ScrollView style={styles.shareUsersList} showsVerticalScrollIndicator={false}>
                {allConnectedUsers.map((user) => (
                  <Pressable
                    key={user.id}
                    style={[
                      styles.shareUserItem,
                      selectedShareUsers.includes(user.id) && styles.shareUserItemSelected,
                    ]}
                    onPress={() => toggleUserSelection(user.id)}
                  >
                    <Animated.Image source={{ uri: user.avatarUrl }} style={styles.shareUserAvatar} />
                    <View style={styles.shareUserInfo}>
                      <Text style={styles.shareUserName}>{user.displayName}</Text>
                      <Text style={styles.shareUserUsername}>@{user.username}</Text>
                    </View>
                    <View style={[
                      styles.shareCheckbox,
                      selectedShareUsers.includes(user.id) && styles.shareCheckboxSelected,
                    ]}>
                      {selectedShareUsers.includes(user.id) && (
                        <Check size={14} color={Colors.textOnPrimary} />
                      )}
                    </View>
                  </Pressable>
                ))}
              </Animated.ScrollView>
            ) : (
              <View style={styles.noConnectionsContainer}>
                <Users size={40} color={Colors.borderLight} />
                <Text style={styles.noConnectionsText}>No connections yet</Text>
                <Text style={styles.noConnectionsSubtext}>Follow users to share recipes with them</Text>
              </View>
            )}

            {selectedShareUsers.length > 0 && (
              <View style={styles.shareMessageSection}>
                <TextInput
                  style={styles.shareMessageInput}
                  placeholder="Add a message (optional)"
                  placeholderTextColor={Colors.textSecondary}
                  value={shareMessage}
                  onChangeText={setShareMessage}
                  multiline
                />
              </View>
            )}

            <Pressable
              style={[
                styles.shareSubmitButton,
                selectedShareUsers.length === 0 && styles.shareSubmitButtonDisabled,
              ]}
              onPress={handleShareWithUsers}
              disabled={selectedShareUsers.length === 0}
            >
              <Text style={styles.shareSubmitButtonText}>
                Share with {selectedShareUsers.length} user{selectedShareUsers.length !== 1 ? 's' : ''}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Recipe Options</Text>
              <Pressable onPress={() => setShowMenu(false)} style={styles.menuCloseButton}>
                <X size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <Pressable style={styles.menuItem} onPress={handleEdit}>
              <Edit3 size={20} color={Colors.primary} />
              <Text style={styles.menuItemText}>Edit Recipe</Text>
            </Pressable>
            <Pressable style={[styles.menuItem, styles.menuItemDanger]} onPress={handleDelete}>
              <Trash2 size={20} color={Colors.error} />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete Recipe</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showServingAdjuster}
        transparent
        animationType="fade"
        onRequestClose={() => setShowServingAdjuster(false)}
      >
        <View style={styles.servingModalOverlay}>
          <View style={styles.servingContainer}>
            <View style={styles.servingHeader}>
              <View style={styles.servingTitleRow}>
                <Sparkles size={20} color={Colors.secondary} />
                <Text style={styles.servingTitle}>AI Serving Adjuster</Text>
              </View>
              <Pressable onPress={() => setShowServingAdjuster(false)} style={styles.servingCloseButton}>
                <X size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.servingSubtitle}>
              Adjust servings and AI will recalculate all ingredients
            </Text>

            <View style={styles.servingSelector}>
              <Pressable
                style={styles.servingSelectorButton}
                onPress={() => setAdjustedServings(Math.max(1, (adjustedServings ?? recipe?.servings ?? 1) - 1))}
                disabled={isAdjusting}
              >
                <Minus size={24} color={Colors.secondary} />
              </Pressable>
              <View style={styles.servingValueContainer}>
                <Text style={styles.servingValue}>{adjustedServings ?? recipe?.servings}</Text>
                <Text style={styles.servingValueLabel}>servings</Text>
              </View>
              <Pressable
                style={styles.servingSelectorButton}
                onPress={() => setAdjustedServings((adjustedServings ?? recipe?.servings ?? 1) + 1)}
                disabled={isAdjusting}
              >
                <Plus size={24} color={Colors.secondary} />
              </Pressable>
            </View>

            <View style={styles.servingQuickButtons}>
              {[2, 4, 6, 8].map((num) => (
                <Pressable
                  key={num}
                  style={[
                    styles.servingQuickButton,
                    (adjustedServings ?? recipe?.servings) === num && styles.servingQuickButtonActive,
                  ]}
                  onPress={() => setAdjustedServings(num)}
                  disabled={isAdjusting}
                >
                  <Text
                    style={[
                      styles.servingQuickButtonText,
                      (adjustedServings ?? recipe?.servings) === num && styles.servingQuickButtonTextActive,
                    ]}
                  >
                    {num}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[styles.adjustButton, isAdjusting && styles.adjustButtonDisabled]}
              onPress={() => adjustServingsWithAI(adjustedServings ?? recipe?.servings ?? 1)}
              disabled={isAdjusting}
            >
              {isAdjusting ? (
                <ActivityIndicator size="small" color={Colors.textOnPrimary} />
              ) : (
                <>
                  <Sparkles size={18} color={Colors.textOnPrimary} />
                  <Text style={styles.adjustButtonText}>Adjust Recipe</Text>
                </>
              )}
            </Pressable>

            {recipe && adjustedServings !== recipe.servings && adjustedIngredients && (
              <Pressable style={styles.resetServingsButton} onPress={resetServings}>
                <Text style={styles.resetServingsText}>Reset to Original ({recipe.servings} servings)</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showReviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.reviewModalOverlay}>
          <View style={styles.reviewModalContainer}>
            <View style={styles.reviewModalHeader}>
              <Text style={styles.reviewModalTitle}>Write a Review</Text>
              <Pressable onPress={() => setShowReviewModal(false)} style={styles.reviewModalCloseButton}>
                <X size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.reviewModalLabel}>Your Rating</Text>
            <View style={styles.reviewRatingSelector}>
              {renderStars(reviewRating, 32, true, setReviewRating)}
            </View>

            <Text style={styles.reviewModalLabel}>Your Name</Text>
            <View style={styles.reviewInputContainer}>
              <UserIcon size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.reviewTextInput}
                placeholder="Enter your name"
                placeholderTextColor={Colors.textSecondary}
                value={reviewAuthor}
                onChangeText={setReviewAuthor}
              />
            </View>

            <Text style={styles.reviewModalLabel}>Your Review</Text>
            <View style={[styles.reviewInputContainer, styles.reviewTextAreaContainer]}>
              <TextInput
                style={styles.reviewTextArea}
                placeholder="Share your experience with this recipe..."
                placeholderTextColor={Colors.textSecondary}
                value={reviewComment}
                onChangeText={setReviewComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <Pressable style={styles.submitReviewButton} onPress={handleSubmitReview}>
              <Text style={styles.submitReviewButtonText}>Submit Review</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTimer}
        transparent
        animationType="fade"
        onRequestClose={closeTimer}
      >
        <View style={styles.timerModalOverlay}>
          <View style={styles.timerContainer}>
            <View style={styles.timerHeader}>
              <Text style={styles.timerTitle}>Cooking Timer</Text>
              <Pressable onPress={closeTimer} style={styles.timerCloseButton}>
                <X size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <Animated.View 
              style={[
                styles.timerDisplay,
                isTimerFinished && styles.timerDisplayFinished,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <Text style={[
                styles.timerText,
                isTimerFinished && styles.timerTextFinished
              ]}>
                {formatTime(timerSeconds)}
              </Text>
              {isTimerFinished && (
                <Text style={styles.timerFinishedLabel}>Time is up!</Text>
              )}
            </Animated.View>

            <View style={styles.timerControls}>
              {!isTimerRunning ? (
                <Pressable 
                  style={[styles.timerButton, styles.timerButtonPrimary]} 
                  onPress={startTimer}
                >
                  <Play size={28} color={Colors.textOnPrimary} />
                  <Text style={styles.timerButtonText}>Start</Text>
                </Pressable>
              ) : (
                <Pressable 
                  style={[styles.timerButton, styles.timerButtonPause]} 
                  onPress={pauseTimer}
                >
                  <Pause size={28} color={Colors.textOnPrimary} />
                  <Text style={styles.timerButtonText}>Pause</Text>
                </Pressable>
              )}

              <Pressable 
                style={[styles.timerButton, styles.timerButtonSecondary]} 
                onPress={resetTimer}
              >
                <RotateCcw size={24} color={Colors.primary} />
                <Text style={styles.timerButtonTextSecondary}>Reset</Text>
              </Pressable>
            </View>

            <View style={styles.timeAdjustRow}>
              <Pressable 
                style={styles.subtractTimeButton} 
                onPress={subtractOneMinute}
              >
                <Minus size={20} color={Colors.error} />
                <Text style={styles.subtractTimeText}>-1 Min</Text>
              </Pressable>
              <Pressable 
                style={styles.addTimeButton} 
                onPress={addOneMinute}
              >
                <Plus size={20} color={Colors.primary} />
                <Text style={styles.addTimeText}>+1 Min</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  headerSafeArea: {
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    ...Typography.label,
    color: Colors.text,
    textAlign: 'center' as const,
    marginHorizontal: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  imageContainer: {
    height: 350,
    position: 'relative',
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: 350,
    backgroundColor: Colors.borderLight,
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  overlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  overlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
  },
  cuisineBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  cuisineText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  heroTitle: {
    ...Typography.h1,
    color: Colors.textOnPrimary,
    marginBottom: Spacing.xs,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  authorName: {
    ...Typography.bodySmall,
    color: Colors.textOnPrimary,
    opacity: 0.9,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  rating: {
    ...Typography.label,
    color: Colors.accent,
  },
  reviewCount: {
    ...Typography.bodySmall,
    color: Colors.textOnPrimary,
    marginLeft: Spacing.xs,
    opacity: 0.8,
  },
  content: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    marginTop: -24,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  metaCards: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  metaCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  metaCardClickable: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minWidth: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 2) / 3,
  },
  metaHint: {
    ...Typography.caption,
    color: Colors.primary,
    fontSize: 10,
    marginTop: Spacing.xs,
  },
  metaValue: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  metaLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  nutritionCard: {
    marginBottom: Spacing.lg,
  },
  nutritionTitle: {
    ...Typography.label,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    ...Typography.h3,
    color: Colors.primary,
  },
  nutritionLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  tabText: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  ingredientsList: {
    marginBottom: Spacing.lg,
  },
  addAllIngredientsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  addAllIngredientsText: {
    ...Typography.label,
    color: Colors.textOnPrimary,
    fontSize: 14,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  ingredientBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: Spacing.md,
  },
  ingredientAmount: {
    ...Typography.body,
    color: Colors.textSecondary,
    width: 80,
  },
  ingredientName: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
    fontWeight: '500' as const,
  },
  addIngredientButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  stepsList: {
    marginBottom: Spacing.lg,
  },
  progressContainer: {
    marginBottom: Spacing.lg,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  stepItemCompleted: {
    opacity: 0.6,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stepNumberCompleted: {
    backgroundColor: Colors.success,
  },
  stepNumberText: {
    ...Typography.label,
    color: Colors.textOnPrimary,
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 24,
  },
  stepTextCompleted: {
    textDecorationLine: 'line-through' as const,
  },
  tipContainer: {
    backgroundColor: Colors.accent + '20',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  tipText: {
    ...Typography.bodySmall,
    color: Colors.text,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  durationText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tag: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  bottomPadding: {
    height: Spacing.xxxl * 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xxxl,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuTitle: {
    ...Typography.label,
    fontSize: 16,
    color: Colors.text,
  },
  menuCloseButton: {
    padding: Spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  menuItemText: {
    ...Typography.body,
    color: Colors.text,
  },
  menuItemTextDanger: {
    color: Colors.error,
  },
  timerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  timerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...Shadow.lg,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.xl,
  },
  timerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  timerCloseButton: {
    padding: Spacing.xs,
  },
  timerDisplay: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: Colors.primary,
    marginBottom: Spacing.xl,
  },
  timerDisplayFinished: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '20',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  timerTextFinished: {
    color: Colors.accent,
  },
  timerFinishedLabel: {
    ...Typography.label,
    color: Colors.accent,
    marginTop: Spacing.xs,
  },
  timerControls: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    minWidth: 120,
  },
  timerButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  timerButtonPause: {
    backgroundColor: Colors.secondary,
  },
  timerButtonSecondary: {
    backgroundColor: Colors.borderLight,
  },
  timerButtonText: {
    ...Typography.label,
    color: Colors.textOnPrimary,
    fontSize: 16,
  },
  timerButtonTextSecondary: {
    ...Typography.label,
    color: Colors.primary,
    fontSize: 16,
  },
  timeAdjustRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  addTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
    gap: Spacing.sm,
  },
  addTimeText: {
    ...Typography.label,
    color: Colors.primary,
  },
  subtractTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: Colors.error + '10',
    gap: Spacing.sm,
  },
  subtractTimeText: {
    ...Typography.label,
    color: Colors.error,
  },
  metaCardAdjusted: {
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  aiHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: Spacing.xs,
  },
  adjustedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  adjustedBannerText: {
    ...Typography.bodySmall,
    color: Colors.secondary,
    flex: 1,
    fontWeight: '500' as const,
  },
  resetButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  resetButtonText: {
    ...Typography.caption,
    color: Colors.secondary,
    fontWeight: '600' as const,
  },
  ingredientBulletAdjusted: {
    backgroundColor: Colors.secondary,
  },
  ingredientAmountAdjusted: {
    color: Colors.secondary,
    fontWeight: '600' as const,
  },
  servingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  servingContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...Shadow.lg,
  },
  servingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.sm,
  },
  servingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  servingTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  servingCloseButton: {
    padding: Spacing.xs,
  },
  servingSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: Spacing.xl,
  },
  servingSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  servingSelectorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingValueContainer: {
    alignItems: 'center',
  },
  servingValue: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: Colors.secondary,
  },
  servingValueLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  servingQuickButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  servingQuickButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingQuickButtonActive: {
    backgroundColor: Colors.secondary,
  },
  servingQuickButtonText: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  servingQuickButtonTextActive: {
    color: Colors.textOnPrimary,
  },
  adjustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    width: '100%',
  },
  adjustButtonDisabled: {
    opacity: 0.7,
  },
  adjustButtonText: {
    ...Typography.label,
    color: Colors.textOnPrimary,
    fontSize: 16,
  },
  resetServingsButton: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
  },
  resetServingsText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textDecorationLine: 'underline' as const,
  },
  reviewsSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  reviewsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  reviewsTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  reviewsCount: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  addReviewButtonText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontWeight: '600' as const,
  },
  reviewsList: {
    gap: Spacing.md,
  },
  reviewItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  reviewAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAuthor: {
    ...Typography.label,
    color: Colors.text,
  },
  reviewComment: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  reviewDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    opacity: 0.7,
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  noReviewsText: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  noReviewsSubtext: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    padding: 2,
  },
  reviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  reviewModalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...Shadow.lg,
  },
  reviewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  reviewModalTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  reviewModalCloseButton: {
    padding: Spacing.xs,
  },
  reviewModalLabel: {
    ...Typography.label,
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  reviewRatingSelector: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  reviewInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  reviewTextAreaContainer: {
    alignItems: 'flex-start',
  },
  reviewTextInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    padding: 0,
  },
  reviewTextArea: {
    flex: 1,
    width: '100%',
    ...Typography.body,
    color: Colors.text,
    minHeight: 100,
    padding: 0,
  },
  submitReviewButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  submitReviewButtonText: {
    ...Typography.label,
    color: Colors.textOnPrimary,
    fontSize: 16,
  },
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  shareModalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '80%',
    ...Shadow.lg,
  },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  shareModalTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  shareModalCloseButton: {
    padding: Spacing.xs,
  },
  externalShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  externalShareText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  shareModalSubtitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  shareUsersList: {
    maxHeight: 300,
  },
  shareUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  shareUserItemSelected: {
    backgroundColor: Colors.primary + '15',
  },
  shareUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing.md,
  },
  shareUserInfo: {
    flex: 1,
  },
  shareUserName: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  shareUserUsername: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  shareCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareCheckboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  noConnectionsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  noConnectionsText: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  noConnectionsSubtext: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  shareMessageSection: {
    marginTop: Spacing.md,
  },
  shareMessageInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
    minHeight: 60,
    textAlignVertical: 'top' as const,
  },
  shareSubmitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  shareSubmitButtonDisabled: {
    backgroundColor: Colors.borderLight,
  },
  shareSubmitButtonText: {
    ...Typography.label,
    color: Colors.textOnPrimary,
    fontSize: 16,
  },
});
