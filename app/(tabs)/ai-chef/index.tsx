import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, ChefHat, Utensils, Clock, Users, Flame, BookmarkPlus, Check, X, Plus, Hash } from 'lucide-react-native';
import { z } from 'zod';
import { generateObject } from '@rork-ai/toolkit-sdk';
import Colors, { Spacing, Typography, BorderRadius, Shadow } from '@/constants/colors';
import { dietaryPreferences } from '@/mocks/recipes';
import IngredientInput from '@/components/IngredientInput';
import CategoryChip from '@/components/CategoryChip';
import Button from '@/components/Button';
import GlassCard from '@/components/GlassCard';
import { Recipe, RecipeCategory } from '@/types/recipe';
import { useRecipes } from '@/contexts/RecipeContext';
import { useAIUsage } from '@/contexts/AIUsageContext';
import { categories, cuisines } from '@/mocks/recipes';
import { useRouter } from 'expo-router';

const RecipeSchema = z.object({
  title: z.string().describe('Creative recipe title'),
  description: z.string().describe('Brief appetizing description'),
  prepTime: z.number().describe('Preparation time in minutes'),
  cookTime: z.number().describe('Cooking time in minutes'),
  servings: z.number().describe('Number of servings'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.string(),
    unit: z.string(),
  })),
  steps: z.array(z.object({
    order: z.number(),
    instruction: z.string(),
    tip: z.string().optional(),
  })),
  tips: z.array(z.string()).describe('Pro cooking tips'),
});

type GeneratedRecipe = z.infer<typeof RecipeSchema>;

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

export default function AIChefScreen() {
  const { addRecipe } = useRecipes();
  const router = useRouter();
  const {
    canUseAI,
    usageLimit,
    currentUsage,
    usagePercentage,
    generationsRemaining,
    subscriptionTier,
    recordUsage,
  } = useAIUsage();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null);
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
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Create a delicious recipe using these ingredients: ${ingredients.join(', ')}.
        ${selectedPreferences.length > 0 ? `Dietary preferences: ${selectedPreferences.join(', ')}.` : ''}
        ${additionalNotes ? `Additional notes: ${additionalNotes}` : ''}
        Make it creative, practical, and appetizing.`;

      const result = await generateObject({
        messages: [{ role: 'user', content: prompt }],
        schema: RecipeSchema,
      });

      await recordUsage();

      return result;
    },
    onSuccess: (data) => {
      setGeneratedRecipe(data);
    },
    onError: (error) => {
      console.log('Error generating recipe:', error);
    },
  });

  const handleAddIngredient = (ingredient: string) => {
    setIngredients([...ingredients, ingredient]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const togglePreference = (prefId: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(prefId)
        ? prev.filter((id) => id !== prefId)
        : [...prev, prefId]
    );
  };

  const handleGenerate = () => {
    if (ingredients.length === 0) return;
    if (!canUseAI) {
      return;
    }
    setGeneratedRecipe(null);
    generateMutation.mutate();
  };

  const handleReset = () => {
    setGeneratedRecipe(null);
    setIngredients([]);
    setSelectedPreferences([]);
    setAdditionalNotes('');
    setRecipeSaved(false);
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
    if (!generatedRecipe) return;

    const newRecipe: Recipe = {
      id: `ai-${Date.now()}`,
      title: generatedRecipe.title,
      description: generatedRecipe.description,
      imageUrl: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800',
      category: selectedCategory,
      cuisine: selectedCuisine,
      difficulty: generatedRecipe.difficulty,
      prepTime: generatedRecipe.prepTime,
      cookTime: generatedRecipe.cookTime,
      servings: generatedRecipe.servings,
      ingredients: generatedRecipe.ingredients.map((ing, idx) => ({
        id: `ing-${idx}`,
        name: ing.name,
        amount: ing.amount,
        unit: abbreviateUnit(ing.unit),
      })),
      steps: generatedRecipe.steps.map((step) => ({
        id: `step-${step.order}`,
        order: step.order,
        instruction: step.instruction,
        tip: step.tip,
      })),
      tags: tags.length > 0 ? tags : ['ai-generated', 'ai-chef'],
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    addRecipe(newRecipe);
    setRecipeSaved(true);
    closeSaveModal();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary + '10', Colors.background, Colors.secondary + '10']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
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
                <LinearGradient
                  colors={Colors.gradient.warm as [string, string, ...string[]]}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <ChefHat size={40} color={Colors.textOnPrimary} />
                </LinearGradient>
              </Animated.View>
              <Text style={styles.title}>AI Chef</Text>
              <Text style={styles.subtitle}>
                Tell me what ingredients you have, and I&apos;ll create a delicious recipe for you
              </Text>
            </Animated.View>

            <GlassCard style={styles.usageCard}>
              <View style={styles.usageHeader}>
                <View style={styles.usageTierBadge}>
                  <Text style={styles.usageTierText}>
                    {subscriptionTier === 'pro' ? 'Pro' : subscriptionTier === 'basic' ? 'Basic' : 'Free'}
                  </Text>
                </View>
                <Text style={styles.usageTitle}>AI Usage This Month</Text>
              </View>
              
              <View style={styles.usageBarContainer}>
                <View style={styles.usageBarBackground}>
                  <View 
                    style={[
                      styles.usageBarFill, 
                      { 
                        width: `${Math.min(usagePercentage, 100)}%`,
                        backgroundColor: usagePercentage > 80 ? Colors.error : usagePercentage > 50 ? Colors.warning : Colors.primary,
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.usagePercentText}>{Math.round(usagePercentage)}%</Text>
              </View>
              
              <View style={styles.usageDetails}>
                <View style={styles.usageDetailItem}>
                  <Text style={styles.usageDetailLabel}>Used</Text>
                  <Text style={styles.usageDetailValue}>${currentUsage.toFixed(2)}</Text>
                </View>
                <View style={styles.usageDetailItem}>
                  <Text style={styles.usageDetailLabel}>Limit</Text>
                  <Text style={styles.usageDetailValue}>${usageLimit.toFixed(2)}</Text>
                </View>
                <View style={styles.usageDetailItem}>
                  <Text style={styles.usageDetailLabel}>Remaining</Text>
                  <Text style={[styles.usageDetailValue, { color: canUseAI ? Colors.success : Colors.error }]}>
                    {generationsRemaining} gen{generationsRemaining !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              {!canUseAI && (
                <Pressable style={styles.upgradePrompt} onPress={() => router.push('/paywall')}>
                  <Text style={styles.upgradePromptText}>
                    {subscriptionTier === 'free' 
                      ? 'Upgrade to Basic for $1.10/mo AI or Pro for $4.00/mo AI'
                      : subscriptionTier === 'basic'
                        ? 'Upgrade to Pro for $4.00/mo AI budget'
                        : 'Monthly limit reached. Resets next month.'}
                  </Text>
                  {subscriptionTier !== 'pro' && (
                    <Sparkles size={16} color={Colors.primary} />
                  )}
                </Pressable>
              )}
            </GlassCard>

            {!generatedRecipe ? (
              <Animated.View style={{ opacity: fadeAnim }}>
                <GlassCard style={styles.inputSection}>
                  <View style={styles.sectionHeader}>
                    <Utensils size={20} color={Colors.primary} />
                    <Text style={styles.sectionTitle}>Your Ingredients</Text>
                  </View>
                  <IngredientInput
                    ingredients={ingredients}
                    onAddIngredient={handleAddIngredient}
                    onRemoveIngredient={handleRemoveIngredient}
                    placeholder="Add ingredient (e.g., chicken, tomatoes)"
                  />
                </GlassCard>

                <GlassCard style={styles.inputSection}>
                  <View style={styles.sectionHeader}>
                    <Flame size={20} color={Colors.secondary} />
                    <Text style={styles.sectionTitle}>Dietary Preferences</Text>
                  </View>
                  <View style={styles.preferencesContainer}>
                    {dietaryPreferences.map((pref) => (
                      <CategoryChip
                        key={pref.id}
                        label={pref.name}
                        icon={pref.icon}
                        isSelected={selectedPreferences.includes(pref.id)}
                        onPress={() => togglePreference(pref.id)}
                        color={Colors.secondary}
                      />
                    ))}
                  </View>
                </GlassCard>

                <GlassCard style={styles.inputSection}>
                  <View style={styles.sectionHeader}>
                    <Sparkles size={20} color={Colors.accent} />
                    <Text style={styles.sectionTitle}>Special Requests</Text>
                  </View>
                  <TextInput
                    style={styles.notesInput}
                    value={additionalNotes}
                    onChangeText={setAdditionalNotes}
                    placeholder="Any special requests? (e.g., quick meal, family dinner)"
                    placeholderTextColor={Colors.textLight}
                    multiline
                    numberOfLines={3}
                  />
                </GlassCard>

                <View style={styles.generateContainer}>
                  <Button
                    title={generateMutation.isPending ? 'Creating magic...' : 'Generate Recipe'}
                    onPress={handleGenerate}
                    loading={generateMutation.isPending}
                    disabled={ingredients.length === 0 || !canUseAI}
                    size="lg"
                    icon={<Sparkles size={20} color={Colors.textOnPrimary} />}
                  />
                  {ingredients.length === 0 && (
                    <Text style={styles.hintText}>Add at least one ingredient to get started</Text>
                  )}
                  {!canUseAI && ingredients.length > 0 && (
                    <Pressable onPress={() => router.push('/paywall')}>
                      <Text style={styles.limitReachedText}>
                        Monthly AI limit reached. {subscriptionTier !== 'pro' ? 'Tap to upgrade!' : 'Resets next month.'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </Animated.View>
            ) : (
              <Animated.View style={{ opacity: fadeAnim }}>
                <GlassCard style={styles.recipeCard}>
                  <Text style={styles.recipeTitle}>{generatedRecipe.title}</Text>
                  <Text style={styles.recipeDescription}>{generatedRecipe.description}</Text>

                  <View style={styles.recipeMeta}>
                    <View style={styles.metaItem}>
                      <Clock size={16} color={Colors.primary} />
                      <Text style={styles.metaText}>
                        {generatedRecipe.prepTime + generatedRecipe.cookTime} min
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Users size={16} color={Colors.primary} />
                      <Text style={styles.metaText}>{generatedRecipe.servings} servings</Text>
                    </View>
                    <View style={styles.difficultyBadge}>
                      <Text style={styles.difficultyText}>{generatedRecipe.difficulty}</Text>
                    </View>
                  </View>
                </GlassCard>

                <GlassCard style={styles.recipeSection}>
                  <Text style={styles.recipeSectionTitle}>Ingredients</Text>
                  {generatedRecipe.ingredients.map((ing, index) => (
                    <View key={index} style={styles.ingredientItem}>
                      <View style={styles.ingredientBullet} />
                      <Text style={styles.ingredientText}>
                        {ing.amount} {ing.unit} {ing.name}
                      </Text>
                    </View>
                  ))}
                </GlassCard>

                <GlassCard style={styles.recipeSection}>
                  <Text style={styles.recipeSectionTitle}>Instructions</Text>
                  {generatedRecipe.steps.map((step, index) => (
                    <View key={index} style={styles.stepItem}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{step.order}</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepText}>{step.instruction}</Text>
                        {step.tip && (
                          <View style={styles.tipContainer}>
                            <Text style={styles.tipText}>💡 {step.tip}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </GlassCard>

                {generatedRecipe.tips && generatedRecipe.tips.length > 0 && (
                  <GlassCard style={styles.recipeSection}>
                    <Text style={styles.recipeSectionTitle}>Pro Tips</Text>
                    {generatedRecipe.tips.map((tip, index) => (
                      <View key={index} style={styles.proTipItem}>
                        <Text style={styles.proTipText}>✨ {tip}</Text>
                      </View>
                    ))}
                  </GlassCard>
                )}

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
                    title="Generate Another"
                    variant="outline"
                    onPress={handleReset}
                    style={styles.actionButton}
                  />
                </View>
              </Animated.View>
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  iconContainer: {
    marginBottom: Spacing.md,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    paddingHorizontal: Spacing.lg,
  },
  inputSection: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.text,
  },
  preferencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  notesInput: {
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  generateContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  hintText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
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
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    ...Typography.bodySmall,
    color: Colors.text,
  },
  difficultyBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  difficultyText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontWeight: '600' as const,
  },
  recipeSection: {
    marginBottom: Spacing.md,
  },
  recipeSectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: Spacing.sm,
  },
  ingredientText: {
    ...Typography.body,
    color: Colors.text,
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
  stepContent: {
    flex: 1,
  },
  stepText: {
    ...Typography.body,
    color: Colors.text,
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
  proTipItem: {
    marginBottom: Spacing.sm,
  },
  proTipText: {
    ...Typography.body,
    color: Colors.text,
  },
  actionsContainer: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  bottomPadding: {
    height: Spacing.xxxl,
  },
  usageCard: {
    marginBottom: Spacing.md,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  usageTierBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  usageTierText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  usageTitle: {
    ...Typography.label,
    color: Colors.text,
  },
  usageBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  usageBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden' as const,
  },
  usageBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  usagePercentText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    width: 36,
    textAlign: 'right' as const,
  },
  usageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageDetailItem: {
    alignItems: 'center',
  },
  usageDetailLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  usageDetailValue: {
    ...Typography.label,
    color: Colors.text,
  },
  upgradePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '15',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  upgradePromptText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  limitReachedText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.sm,
    textAlign: 'center' as const,
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
