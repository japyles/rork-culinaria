import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Clock, Users, ChefHat, ShoppingCart, X, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors, { BorderRadius, Spacing, Shadow, Typography } from '@/constants/colors';
import { Recipe } from '@/types/recipe';
import { useRecipes } from '@/contexts/RecipeContext';

interface RecipeCardProps {
  recipe: Recipe;
  variant?: 'default' | 'compact' | 'featured';
}

export default function RecipeCard({ recipe, variant = 'default' }: RecipeCardProps) {
  const router = useRouter();
  const { toggleFavorite, addRecentlyViewed, addToShoppingList } = useRecipes();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    addRecentlyViewed(recipe.id);
    router.push(`/recipe/${recipe.id}`);
  };

  const handleFavorite = () => {
    Animated.sequence([
      Animated.spring(heartAnim, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(heartAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    toggleFavorite(recipe.id);
  };

  const handleOpenIngredientModal = () => {
    setSelectedIngredients(new Set(recipe.ingredients.map(i => i.id)));
    setShowIngredientModal(true);
  };

  const toggleIngredient = (ingredientId: string) => {
    setSelectedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientId)) {
        newSet.delete(ingredientId);
      } else {
        newSet.add(ingredientId);
      }
      return newSet;
    });
  };

  const selectAllIngredients = () => {
    setSelectedIngredients(new Set(recipe.ingredients.map(i => i.id)));
  };

  const deselectAllIngredients = () => {
    setSelectedIngredients(new Set());
  };

  const confirmAddToShoppingList = () => {
    if (selectedIngredients.size > 0) {
      const ingredientsToAdd = recipe.ingredients.filter(
        ing => selectedIngredients.has(ing.id)
      );
      addToShoppingList(ingredientsToAdd, recipe.id, recipe.title);
      setShowIngredientModal(false);
      setSelectedIngredients(new Set());
    }
  };

  const totalTime = recipe.prepTime + recipe.cookTime;

  const renderIngredientModal = () => (
    <Modal
      visible={showIngredientModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={modalStyles.container}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>Select Ingredients</Text>
          <Pressable onPress={() => {
            setShowIngredientModal(false);
            setSelectedIngredients(new Set());
          }} style={modalStyles.closeButton}>
            <X size={24} color={Colors.text} />
          </Pressable>
        </View>
        
        <View style={modalStyles.recipeHeader}>
          <Image source={{ uri: recipe.imageUrl }} style={modalStyles.recipeImage} />
          <View style={modalStyles.recipeInfo}>
            <Text style={modalStyles.recipeTitle} numberOfLines={2}>{recipe.title}</Text>
            <Text style={modalStyles.recipeMeta}>{recipe.ingredients.length} ingredients</Text>
          </View>
        </View>
        
        <View style={modalStyles.selectionActions}>
          <Pressable onPress={selectAllIngredients} style={modalStyles.selectionButton}>
            <Text style={modalStyles.selectionButtonText}>Select All</Text>
          </Pressable>
          <Pressable onPress={deselectAllIngredients} style={modalStyles.selectionButton}>
            <Text style={modalStyles.selectionButtonText}>Deselect All</Text>
          </Pressable>
        </View>
        
        <ScrollView style={modalStyles.ingredientList}>
          {recipe.ingredients.map((ingredient) => (
            <Pressable
              key={ingredient.id}
              style={modalStyles.ingredientItem}
              onPress={() => toggleIngredient(ingredient.id)}
            >
              <View style={[
                modalStyles.checkbox,
                selectedIngredients.has(ingredient.id) && modalStyles.checkboxChecked
              ]}>
                {selectedIngredients.has(ingredient.id) && (
                  <Check size={14} color={Colors.textOnPrimary} />
                )}
              </View>
              <View style={modalStyles.ingredientInfo}>
                <Text style={modalStyles.ingredientName}>{ingredient.name}</Text>
                <Text style={modalStyles.ingredientAmount}>{ingredient.amount} {ingredient.unit}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
        
        <View style={modalStyles.footer}>
          <Text style={modalStyles.selectedCount}>
            {selectedIngredients.size} of {recipe.ingredients.length} selected
          </Text>
          <Pressable
            style={[
              modalStyles.confirmButton,
              selectedIngredients.size === 0 && modalStyles.confirmButtonDisabled
            ]}
            onPress={confirmAddToShoppingList}
            disabled={selectedIngredients.size === 0}
          >
            <ShoppingCart size={18} color={Colors.textOnPrimary} />
            <Text style={modalStyles.confirmButtonText}>Add to Shopping List</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );

  if (variant === 'compact') {
    return (
      <Animated.View style={[styles.compactCard, { transform: [{ scale: scaleAnim }] }]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.compactContent}
        >
          <Image source={{ uri: recipe.imageUrl }} style={styles.compactImage} />
          <View style={styles.compactInfo}>
            <Text style={styles.compactTitle} numberOfLines={2}>{recipe.title}</Text>
            <View style={styles.compactMeta}>
              <Clock size={12} color={Colors.textSecondary} />
              <Text style={styles.compactMetaText}>{totalTime} min</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === 'featured') {
    return (
      <>
        <Animated.View style={[styles.featuredCard, { transform: [{ scale: scaleAnim }] }]}>
          <Pressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Image source={{ uri: recipe.imageUrl }} style={styles.featuredImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']} 
              style={styles.featuredGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <Pressable style={styles.featuredFavorite} onPress={handleFavorite}>
              <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
                <Heart
                  size={22}
                  color={recipe.isFavorite ? Colors.primaryDark : Colors.textOnPrimary}
                  fill={recipe.isFavorite ? Colors.primaryDark : 'transparent'}
                />
              </Animated.View>
            </Pressable>
            <Pressable style={styles.featuredShoppingButton} onPress={handleOpenIngredientModal}>
              <ShoppingCart size={20} color={Colors.textOnPrimary} />
            </Pressable>
            <View style={styles.featuredRatingBadge}>
              <Text style={styles.featuredRatingText}>★ {recipe.rating}</Text>
            </View>
            <View style={styles.featuredContent}>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>{recipe.cuisine}</Text>
              </View>
              <Text style={styles.featuredTitle} numberOfLines={2}>{recipe.title}</Text>
              <View style={styles.featuredMeta}>
                <View style={styles.metaItem}>
                  <Clock size={14} color={Colors.textOnPrimary} />
                  <Text style={styles.featuredMetaText}>{totalTime} min</Text>
                </View>
                <View style={styles.metaItem}>
                  <Users size={14} color={Colors.textOnPrimary} />
                  <Text style={styles.featuredMetaText}>{recipe.servings} servings</Text>
                </View>
                <View style={styles.metaItem}>
                  <ChefHat size={14} color={Colors.textOnPrimary} />
                  <Text style={styles.featuredMetaText}>{recipe.difficulty}</Text>
                </View>
              </View>
            </View>
          </Pressable>
        </Animated.View>
        {renderIngredientModal()}
      </>
    );
  }

  return (
    <>
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={styles.imageContainer}>
            <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
            <Pressable style={styles.favoriteButton} onPress={handleFavorite}>
              <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
                <Heart
                  size={20}
                  color={recipe.isFavorite ? Colors.primaryDark : Colors.text}
                  fill={recipe.isFavorite ? Colors.primaryDark : 'transparent'}
                />
              </Animated.View>
            </Pressable>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
            </View>
          </View>
          <View style={styles.content}>
            <Text style={styles.cuisine}>{recipe.cuisine}</Text>
            <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Clock size={14} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{totalTime} min</Text>
              </View>
              <View style={styles.metaItem}>
                <Users size={14} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{recipe.servings}</Text>
              </View>
              <Pressable onPress={handleOpenIngredientModal} style={styles.shoppingButton}>
                <ShoppingCart size={16} color={Colors.primary} />
              </Pressable>
              <View style={styles.ratingContainer}>
                <Text style={styles.rating}>★ {recipe.rating}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
      {renderIngredientModal()}
    </>
  );
}

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  recipeHeader: {
    flexDirection: 'row',
    padding: Spacing.lg,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.borderLight,
  },
  recipeInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  recipeTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  recipeMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  selectionButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.sm,
  },
  selectionButtonText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  ingredientList: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    ...Typography.body,
    color: Colors.text,
  },
  ingredientAmount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  selectedCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.border,
  },
  confirmButtonText: {
    ...Typography.label,
    color: Colors.textOnPrimary,
  },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadow.md,
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.borderLight,
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.glass.background,
    borderRadius: BorderRadius.full,
    padding: Spacing.sm,
  },
  difficultyBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  difficultyText: {
    color: Colors.textOnPrimary,
    fontSize: 11,
    fontWeight: '600' as const,
  },
  content: {
    padding: Spacing.md,
    marginTop: 18,
  },
  cuisine: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  shoppingButton: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
  },
  ratingContainer: {
    marginLeft: 'auto',
  },
  rating: {
    ...Typography.label,
    color: Colors.accent,
  },
  compactCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadow.sm,
    width: 150,
    marginRight: Spacing.md,
  },
  compactContent: {
    flex: 1,
  },
  compactImage: {
    width: '100%',
    height: 100,
    backgroundColor: Colors.borderLight,
  },
  compactInfo: {
    padding: Spacing.sm,
  },
  compactTitle: {
    ...Typography.bodySmall,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactMetaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  featuredCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.lg,
    marginBottom: Spacing.lg,
  },
  featuredImage: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.borderLight,
  },
  featuredGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  featuredRatingBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  featuredRatingText: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  featuredFavorite: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    padding: Spacing.sm,
  },
  featuredShoppingButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md + 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    padding: Spacing.sm,
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
  },
  featuredBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  featuredBadgeText: {
    color: Colors.textOnPrimary,
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  featuredTitle: {
    ...Typography.h3,
    color: Colors.textOnPrimary,
    marginBottom: Spacing.xs,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredMetaText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    marginLeft: Spacing.xs,
    marginRight: Spacing.md,
  },
});
