import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Animated } from 'react-native';
import { Calendar, ChevronRight } from 'lucide-react-native';
import Colors, { BorderRadius, Spacing, Shadow, Typography } from '@/constants/colors';
import { MealPlanDay } from '@/types/recipe';

interface MealPlanCardProps {
  day: MealPlanDay;
  onPress?: () => void;
}

export default function MealPlanCard({ day, onPress }: MealPlanCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const meals = [
    { type: 'Breakfast', recipe: day.meals.breakfast },
    { type: 'Lunch', recipe: day.meals.lunch },
    { type: 'Dinner', recipe: day.meals.dinner },
  ].filter((m) => m.recipe);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <View style={styles.header}>
          <View style={styles.dateContainer}>
            <Calendar size={16} color={Colors.primary} />
            <Text style={styles.date}>{formatDate(day.date)}</Text>
          </View>
          <ChevronRight size={20} color={Colors.textSecondary} />
        </View>
        <View style={styles.mealsContainer}>
          {meals.length > 0 ? (
            meals.map((meal, index) => (
              <View key={index} style={styles.mealItem}>
                {meal.recipe?.imageUrl && (
                  <Image source={{ uri: meal.recipe.imageUrl }} style={styles.mealImage} />
                )}
                <View style={styles.mealInfo}>
                  <Text style={styles.mealType}>{meal.type}</Text>
                  <Text style={styles.mealName} numberOfLines={1}>
                    {meal.recipe?.title}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No meals planned</Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
    marginBottom: Spacing.md,
  },
  pressable: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  date: {
    ...Typography.label,
    color: Colors.text,
  },
  mealsContainer: {
    gap: Spacing.sm,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mealImage: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.borderLight,
  },
  mealInfo: {
    flex: 1,
  },
  mealType: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
  },
  mealName: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  emptyText: {
    ...Typography.bodySmall,
    color: Colors.textLight,
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
    paddingVertical: Spacing.md,
  },
});
