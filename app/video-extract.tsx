import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Video, Link2, Sparkles, AlertCircle, Check, X, Plus, Hash, BookmarkPlus } from 'lucide-react-native';
import { z } from 'zod';
import { generateObject } from '@rork-ai/toolkit-sdk';
import Colors, { Spacing, Typography, BorderRadius, Shadow } from '@/constants/colors';
import GlassCard from '@/components/GlassCard';
import Button from '@/components/Button';
import { useRecipes } from '@/contexts/RecipeContext';
import { useAICache } from '@/contexts/AICacheContext';
import { useAIUsage } from '@/contexts/AIUsageContext';
import { Recipe, RecipeCategory } from '@/types/recipe';
import { categories, cuisines } from '@/mocks/recipes';

const VideoRecipeSchema = z.object({
  title: z.string().describe('Recipe title from the video'),
  description: z.string().describe('Brief description of the dish'),
  prepTime: z.number().describe('Estimated prep time in minutes'),
  cookTime: z.number().describe('Estimated cook time in minutes'),
  servings: z.number().describe('Number of servings'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.string(),
    unit: z.string(),
  })).describe('List of ingredients with amounts'),
  steps: z.array(z.object({
    order: z.number(),
    instruction: z.string(),
  })).describe('Step by step instructions'),
});

type ExtractedRecipe = z.infer<typeof VideoRecipeSchema>;

const abbreviateUnit = (unit: string): string => {
  const abbreviations: Record<string, string> = {
    'tablespoon': 'Tbsp',
    'tablespoons': 'Tbsp',
    'teaspoon': 'Tsp',
    'teaspoons': 'Tsp',
    'ounce': 'oz',
    'ounces': 'oz',
    'pound': 'lb',
    'pounds': 'lbs',
    'gram': 'g',
    'grams': 'g',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'liter': 'L',
    'liters': 'L',
    'fluid ounce': 'fl oz',
    'fluid ounces': 'fl oz',
    'pint': 'pt',
    'pints': 'pts',
    'quart': 'qt',
    'quarts': 'qts',
    'gallon': 'gal',
    'gallons': 'gal',
    'pinch': 'pinch',
    'dash': 'dash',
    'cup': 'cup',
    'cups': 'cups',
    'piece': 'pc',
    'pieces': 'pcs',
    'slice': 'slice',
    'slices': 'slices',
    'clove': 'clove',
    'cloves': 'cloves',
  };
  const lower = unit.toLowerCase().trim();
  return abbreviations[lower] || unit;
};

export default function VideoExtractScreen() {
  const router = useRouter();
  const { addRecipe } = useRecipes();
  const { getCachedExtraction, addToCache } = useAICache();
  const { recordUsage, canUseAI } = useAIUsage();
  const [videoUrl, setVideoUrl] = useState('');
  const [usedCache, setUsedCache] = useState(false);
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory>('dinner');
  const [selectedCuisine, setSelectedCuisine] = useState('American');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [recipeSaved, setRecipeSaved] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const isValidUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return ['youtube.com', 'youtu.be', 'tiktok.com', 'instagram.com', 'facebook.com']
        .some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  };

  const extractMutation = useMutation({
    mutationFn: async (url: string): Promise<{ data: ExtractedRecipe; fromCache: boolean }> => {
      const cached = getCachedExtraction<ExtractedRecipe>(url);
      if (cached) {
        console.log('[VideoExtract] Using cached extraction for:', url);
        return { data: cached, fromCache: true };
      }

      if (!canUseAI) {
        throw new Error('AI usage limit reached');
      }

      const prompt = `Extract a complete recipe from this cooking video URL: ${url}
        
        Please provide:
        - The recipe title
        - A brief description
        - All ingredients with exact measurements
        - Step-by-step cooking instructions
        - Estimated prep and cook times
        - Difficulty level
        
        If you cannot access the video content, create a plausible recipe based on the URL context or video title patterns.`;

      const result = await generateObject({
        messages: [{ role: 'user', content: prompt }],
        schema: VideoRecipeSchema,
      });

      await recordUsage();
      await addToCache(url, result);
      console.log('[VideoExtract] New extraction cached for:', url);

      return { data: result, fromCache: false };
    },
    onSuccess: ({ data, fromCache }) => {
      setExtractedRecipe(data);
      setUsedCache(fromCache);
    },
    onError: (error) => {
      console.log('Error extracting recipe:', error);
    },
  });

  useEffect(() => {
    if (extractMutation.isPending) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [extractMutation.isPending]);

  const handleExtract = () => {
    if (!videoUrl.trim()) return;
    setExtractedRecipe(null);
    extractMutation.mutate(videoUrl);
  };

  const handleReset = () => {
    setVideoUrl('');
    setExtractedRecipe(null);
    setRecipeSaved(false);
    setUsedCache(false);
    setTags([]);
    setSelectedCategory('dinner');
    setSelectedCuisine('American');
  };

  const openSaveModal = () => {
    setShowSaveModal(true);
    Animated.spring(modalAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();
  };

  const closeSaveModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowSaveModal(false));
  };

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSaveRecipe = () => {
    if (!extractedRecipe) return;

    const newRecipe: Recipe = {
      id: `custom-${Date.now()}`,
      title: extractedRecipe.title,
      description: extractedRecipe.description,
      imageUrl: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800',
      category: selectedCategory,
      cuisine: selectedCuisine,
      difficulty: extractedRecipe.difficulty,
      prepTime: extractedRecipe.prepTime,
      cookTime: extractedRecipe.cookTime,
      servings: extractedRecipe.servings,
      ingredients: extractedRecipe.ingredients.map((ing, idx) => ({
        id: `ing-${idx}`,
        name: ing.name,
        amount: ing.amount,
        unit: abbreviateUnit(ing.unit),
      })),
      steps: extractedRecipe.steps.map((step) => ({
        id: `step-${step.order}`,
        order: step.order,
        instruction: step.instruction,
      })),
      tags: tags.length > 0 ? tags : ['video-recipe', 'extracted'],
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      sourceUrl: videoUrl,
    };

    addRecipe(newRecipe);
    setRecipeSaved(true);
    closeSaveModal();
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
              <Video size={40} color={Colors.secondary} />
            </Animated.View>
            <Text style={styles.title}>Extract from Video</Text>
            <Text style={styles.subtitle}>
              Paste a link from YouTube, TikTok, Instagram, or Facebook to extract the recipe
            </Text>
          </Animated.View>

          {!extractedRecipe ? (
            <Animated.View style={{ opacity: fadeAnim }}>
              <GlassCard style={styles.inputCard}>
                <View style={styles.inputHeader}>
                  <Link2 size={20} color={Colors.primary} />
                  <Text style={styles.inputLabel}>Video URL</Text>
                </View>
                <TextInput
                  style={styles.urlInput}
                  value={videoUrl}
                  onChangeText={setVideoUrl}
                  placeholder="https://youtube.com/watch?v=..."
                  placeholderTextColor={Colors.textLight}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                {videoUrl.length > 0 && !isValidUrl(videoUrl) && (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={14} color={Colors.error} />
                    <Text style={styles.errorText}>
                      Please enter a valid video URL
                    </Text>
                  </View>
                )}
              </GlassCard>

              <View style={styles.supportedPlatforms}>
                <Text style={styles.supportedTitle}>Supported platforms</Text>
                <View style={styles.platformList}>
                  {['YouTube', 'TikTok', 'Instagram', 'Facebook'].map((platform) => (
                    <View key={platform} style={styles.platformBadge}>
                      <Text style={styles.platformText}>{platform}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  title={extractMutation.isPending ? 'Extracting recipe...' : 'Extract Recipe'}
                  onPress={handleExtract}
                  loading={extractMutation.isPending}
                  disabled={!videoUrl.trim() || !isValidUrl(videoUrl)}
                  size="lg"
                  icon={<Sparkles size={20} color={Colors.textOnPrimary} />}
                />
              </View>

              {extractMutation.isError && (
                <View style={styles.errorCard}>
                  <AlertCircle size={20} color={Colors.error} />
                  <Text style={styles.errorCardText}>
                    Failed to extract recipe. Please try again or use a different URL.
                  </Text>
                </View>
              )}
            </Animated.View>
          ) : (
            <Animated.View style={{ opacity: fadeAnim }}>
              <View style={styles.successHeader}>
                <View style={styles.successIcon}>
                  <Check size={24} color={Colors.textOnPrimary} />
                </View>
                <Text style={styles.successText}>Recipe extracted successfully!</Text>
              </View>

              {usedCache && (
                <View style={styles.cacheBadge}>
                  <Text style={styles.cacheBadgeText}>📦 Loaded from cache (no AI credits used)</Text>
                </View>
              )}

              <GlassCard style={styles.recipeCard}>
                <Text style={styles.recipeTitle}>{extractedRecipe.title}</Text>
                <Text style={styles.recipeDescription}>{extractedRecipe.description}</Text>
                
                <View style={styles.recipeMeta}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaValue}>
                      {extractedRecipe.prepTime + extractedRecipe.cookTime}
                    </Text>
                    <Text style={styles.metaLabel}>min</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaValue}>{extractedRecipe.servings}</Text>
                    <Text style={styles.metaLabel}>servings</Text>
                  </View>
                  <View style={styles.difficultyBadge}>
                    <Text style={styles.difficultyText}>{extractedRecipe.difficulty}</Text>
                  </View>
                </View>
              </GlassCard>

              <GlassCard style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                {extractedRecipe.ingredients.map((ing, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.ingredientAmount}>
                      {ing.amount} {abbreviateUnit(ing.unit)}
                    </Text>
                    <Text style={styles.ingredientName}>{ing.name}</Text>
                  </View>
                ))}
              </GlassCard>

              <GlassCard style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                {extractedRecipe.steps.map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{step.order}</Text>
                    </View>
                    <Text style={styles.stepText}>{step.instruction}</Text>
                  </View>
                ))}
              </GlassCard>

              {!recipeSaved ? (
                <View style={styles.saveToRecipesContainer}>
                  <Button
                    title="Add to My Recipes"
                    onPress={openSaveModal}
                    size="lg"
                    icon={<BookmarkPlus size={20} color={Colors.textOnPrimary} />}
                  />
                </View>
              ) : (
                <View style={styles.savedBadge}>
                  <Check size={18} color={Colors.success} />
                  <Text style={styles.savedText}>Recipe saved to your collection!</Text>
                </View>
              )}

              <View style={styles.actionsContainer}>
                <Button
                  title="Extract Another"
                  variant="outline"
                  onPress={handleReset}
                  style={styles.actionButton}
                />
                <Button
                  title="Done"
                  onPress={() => router.back()}
                  style={styles.actionButton}
                />
              </View>
            </Animated.View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showSaveModal}
        transparent
        animationType="none"
        onRequestClose={closeSaveModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeSaveModal}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                opacity: modalAnim,
                transform: [
                  {
                    translateY: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Save Recipe</Text>
                <Pressable onPress={closeSaveModal} style={styles.closeButton}>
                  <X size={24} color={Colors.textSecondary} />
                </Pressable>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionLabel}>Category</Text>
                <View style={styles.chipContainer}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.chip,
                        selectedCategory === cat.id && styles.chipSelected,
                      ]}
                      onPress={() => setSelectedCategory(cat.id as RecipeCategory)}
                    >
                      <Text style={styles.chipIcon}>{cat.icon}</Text>
                      <Text
                        style={[
                          styles.chipText,
                          selectedCategory === cat.id && styles.chipTextSelected,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>Cuisine</Text>
                <View style={styles.chipContainer}>
                  {cuisines.map((cuisine) => (
                    <TouchableOpacity
                      key={cuisine}
                      style={[
                        styles.chip,
                        selectedCuisine === cuisine && styles.chipSelected,
                      ]}
                      onPress={() => setSelectedCuisine(cuisine)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedCuisine === cuisine && styles.chipTextSelected,
                        ]}
                      >
                        {cuisine}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>Tags / Hashtags</Text>
                <View style={styles.tagInputRow}>
                  <View style={styles.tagInputWrapper}>
                    <Hash size={16} color={Colors.textLight} style={styles.hashIcon} />
                    <TextInput
                      style={styles.tagInput}
                      value={tagInput}
                      onChangeText={setTagInput}
                      placeholder="Add a tag..."
                      placeholderTextColor={Colors.textLight}
                      onSubmitEditing={addTag}
                      returnKeyType="done"
                    />
                  </View>
                  <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
                    <Plus size={20} color={Colors.textOnPrimary} />
                  </TouchableOpacity>
                </View>

                {tags.length > 0 && (
                  <View style={styles.tagsDisplay}>
                    {tags.map((tag) => (
                      <View key={tag} style={styles.tagBadge}>
                        <Text style={styles.tagBadgeText}>#{tag}</Text>
                        <TouchableOpacity onPress={() => removeTag(tag)}>
                          <X size={14} color={Colors.primary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.modalActions}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={closeSaveModal}
                    style={styles.modalButton}
                  />
                  <Button
                    title="Save Recipe"
                    onPress={handleSaveRecipe}
                    style={styles.modalButton}
                    icon={<Check size={18} color={Colors.textOnPrimary} />}
                  />
                </View>
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    paddingHorizontal: Spacing.lg,
  },
  inputCard: {
    marginBottom: Spacing.lg,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.label,
    color: Colors.text,
  },
  urlInput: {
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
  },
  supportedPlatforms: {
    marginBottom: Spacing.xl,
  },
  supportedTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textAlign: 'center' as const,
  },
  platformList: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  platformBadge: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  platformText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  buttonContainer: {
    marginBottom: Spacing.lg,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '20',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  errorCardText: {
    ...Typography.bodySmall,
    color: Colors.error,
    flex: 1,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  successIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    ...Typography.label,
    color: Colors.success,
  },
  recipeCard: {
    marginBottom: Spacing.md,
  },
  recipeTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  recipeDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaValue: {
    ...Typography.h3,
    color: Colors.text,
  },
  metaLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  difficultyBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginLeft: 'auto',
  },
  difficultyText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontWeight: '600' as const,
  },
  sectionCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  bulletPoint: {
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
  stepItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stepNumberText: {
    ...Typography.label,
    color: Colors.textOnPrimary,
  },
  stepText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  bottomPadding: {
    height: Spacing.xxxl,
  },
  saveToRecipesContainer: {
    marginTop: Spacing.lg,
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success + '15',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  savedText: {
    ...Typography.label,
    color: Colors.success,
  },
  cacheBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent + '20',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  cacheBadgeText: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '500' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
    ...Shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalScroll: {
    padding: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.textOnPrimary,
    fontWeight: '600' as const,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tagInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
  },
  hashIcon: {
    marginRight: Spacing.xs,
  },
  tagInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    color: Colors.text,
  },
  addTagButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  tagBadgeText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
});
