import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CalendarDays, Plus, ChevronLeft, ChevronRight, X, Clock, Users } from 'lucide-react-native';
import Colors, { Spacing, Typography, BorderRadius, Shadow } from '@/constants/colors';
import { useRecipes } from '@/contexts/RecipeContext';
import { Recipe } from '@/types/recipe';
import GlassCard from '@/components/GlassCard';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;

export default function MealPlanScreen() {
  const { 
    allRecipes, 
    getRecipeById,
    addMealPlanEntry, 
    removeMealPlanEntry, 
    getMealPlanEntry,
    mealPlanEntries 
  } = useRecipes();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<typeof MEAL_TYPES[number]>('breakfast');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  function getWeekStart(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getWeekDates(startDate: Date) {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  const weekDates = getWeekDates(currentWeekStart);

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const handleAddMeal = (mealType: typeof MEAL_TYPES[number]) => {
    setSelectedMealType(mealType);
    setShowRecipeModal(true);
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    const dateKey = formatDateKey(selectedDate);
    addMealPlanEntry({
      date: dateKey,
      mealType: selectedMealType,
      recipeId: recipe.id,
    });
    setShowRecipeModal(false);
  };

  const handleRemoveMeal = (mealType: typeof MEAL_TYPES[number]) => {
    const dateKey = formatDateKey(selectedDate);
    removeMealPlanEntry(dateKey, mealType);
  };

  const getMealForType = (mealType: typeof MEAL_TYPES[number]): Recipe | undefined => {
    const dateKey = formatDateKey(selectedDate);
    const entry = getMealPlanEntry(dateKey, mealType);
    if (entry) {
      return getRecipeById(entry.recipeId);
    }
    return undefined;
  };

  const hasPlannedMeals = (date: Date): boolean => {
    const dateKey = formatDateKey(date);
    return mealPlanEntries.some((e) => e.date === dateKey);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.secondary + '10', Colors.background, Colors.primary + '10']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <View style={styles.headerIcon}>
              <CalendarDays size={28} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Meal Plan</Text>
            <Text style={styles.subtitle}>Plan your week of delicious meals</Text>
          </Animated.View>

          <GlassCard style={styles.calendarCard}>
            <View style={styles.weekNavigation}>
              <Pressable onPress={goToPreviousWeek} style={styles.navButton}>
                <ChevronLeft size={24} color={Colors.text} />
              </Pressable>
              <Text style={styles.monthText}>
                {currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <Pressable onPress={goToNextWeek} style={styles.navButton}>
                <ChevronRight size={24} color={Colors.text} />
              </Pressable>
            </View>

            <View style={styles.weekDays}>
              {weekDates.map((date, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.dayItem,
                    isSelected(date) && styles.dayItemSelected,
                    isToday(date) && !isSelected(date) && styles.dayItemToday,
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text
                    style={[
                      styles.dayName,
                      isSelected(date) && styles.dayTextSelected,
                    ]}
                  >
                    {DAYS[index]}
                  </Text>
                  <Text
                    style={[
                      styles.dayNumber,
                      isSelected(date) && styles.dayTextSelected,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  {hasPlannedMeals(date) && (
                    <View style={[styles.planIndicator, isSelected(date) && styles.planIndicatorSelected]} />
                  )}
                </Pressable>
              ))}
            </View>
          </GlassCard>

          <View style={styles.mealsSection}>
            <Text style={styles.selectedDateText}>
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>

            {MEAL_TYPES.map((mealType) => {
              const meal = getMealForType(mealType);
              return (
                <GlassCard key={mealType} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealType}>
                      {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                    </Text>
                    {meal && (
                      <Pressable
                        onPress={() => handleRemoveMeal(mealType)}
                        style={styles.removeButton}
                      >
                        <X size={16} color={Colors.textSecondary} />
                      </Pressable>
                    )}
                  </View>
                  {meal ? (
                    <View style={styles.plannedMeal}>
                      <Image source={{ uri: meal.imageUrl }} style={styles.mealImage} />
                      <View style={styles.mealInfo}>
                        <Text style={styles.plannedMealTitle} numberOfLines={2}>{meal.title}</Text>
                        <View style={styles.mealMeta}>
                          <Clock size={12} color={Colors.textSecondary} />
                          <Text style={styles.plannedMealMeta}>
                            {meal.prepTime + meal.cookTime} min
                          </Text>
                          <Users size={12} color={Colors.textSecondary} style={{ marginLeft: 8 }} />
                          <Text style={styles.plannedMealMeta}>
                            {meal.servings}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.addMealButton}
                      onPress={() => handleAddMeal(mealType)}
                    >
                      <Plus size={20} color={Colors.primary} />
                      <Text style={styles.addMealText}>Add {mealType}</Text>
                    </Pressable>
                  )}
                </GlassCard>
              );
            })}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        <Modal
          visible={showRecipeModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)}
              </Text>
              <Pressable onPress={() => setShowRecipeModal(false)} style={styles.closeButton}>
                <X size={24} color={Colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalContent}>
              {allRecipes.map((recipe) => (
                <Pressable
                  key={recipe.id}
                  onPress={() => handleSelectRecipe(recipe)}
                  style={styles.recipeSelectItem}
                >
                  <Image source={{ uri: recipe.imageUrl }} style={styles.recipeSelectImage} />
                  <View style={styles.recipeSelectInfo}>
                    <Text style={styles.recipeSelectTitle} numberOfLines={2}>{recipe.title}</Text>
                    <Text style={styles.recipeSelectMeta}>
                      {recipe.prepTime + recipe.cookTime} min • {recipe.servings} servings
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  calendarCard: {
    marginBottom: Spacing.lg,
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  navButton: {
    padding: Spacing.sm,
  },
  monthText: {
    ...Typography.label,
    color: Colors.text,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 40,
  },
  dayItemSelected: {
    backgroundColor: Colors.primary,
  },
  dayItemToday: {
    backgroundColor: Colors.primary + '20',
  },
  dayName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  dayNumber: {
    ...Typography.label,
    color: Colors.text,
  },
  dayTextSelected: {
    color: Colors.textOnPrimary,
  },
  planIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
    marginTop: Spacing.xs,
  },
  planIndicatorSelected: {
    backgroundColor: Colors.textOnPrimary,
  },
  mealsSection: {
    gap: Spacing.md,
  },
  selectedDateText: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  mealCard: {
    padding: Spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  mealType: {
    ...Typography.label,
    color: Colors.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  plannedMeal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealImage: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.borderLight,
  },
  mealInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  plannedMealTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600' as const,
    marginBottom: Spacing.xs,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plannedMealMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  addMealText: {
    ...Typography.body,
    color: Colors.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  recipeSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  recipeSelectImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.borderLight,
  },
  recipeSelectInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  recipeSelectTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600' as const,
    marginBottom: Spacing.xs,
  },
  recipeSelectMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  bottomPadding: {
    height: Spacing.xxxl,
  },
});
