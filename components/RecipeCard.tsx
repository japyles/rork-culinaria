import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Clock, Users, ChefHat, ShoppingCart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
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

  const handleAddToShoppingList = () => {
    addToShoppingList(recipe.ingredients, recipe.id, recipe.title);
  };

  const totalTime = recipe.prepTime + recipe.cookTime;

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
    );
  }

  return (
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
            <Pressable onPress={handleAddToShoppingList} style={styles.shoppingButton}>
              <ShoppingCart size={16} color={Colors.primary} />
            </Pressable>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>★ {recipe.rating}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

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
