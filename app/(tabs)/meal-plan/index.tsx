import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
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
import { CalendarDays, Plus, ChevronLeft, ChevronRight, X, Clock, Users, Trash2, ShoppingCart, Check, ChefHat } from 'lucide-react-native';
import Colors, { Spacing, Typography, BorderRadius, Shadow, FLOATING_BAR_HEIGHT } from '@/constants/colors';
import { useRecipes } from '@/contexts/RecipeContext';
import { Recipe, MealPlanEntry, Ingredient } from '@/types/recipe';
import GlassCard from '@/components/GlassCard';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;

interface MealItemWithRecipe {
  entry: MealPlanEntry;
  recipe: Recipe;
}

export default function MealPlanScreen() {
  const router = useRouter();
  const { 
    allRecipes, 
    getRecipeById,
    addMealPlanEntry, 
    removeMealPlanEntry, 
    getMealPlanEntriesForSlot,
    mealPlanEntries,
    addToShoppingList,
  } = useRecipes();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<typeof MEAL_TYPES[number]>('breakfast');
  const [showMealOptionsModal, setShowMealOptionsModal] = useState(false);
  const [selectedMealItem, setSelectedMealItem] = useState<MealItemWithRecipe | null>(null);
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());

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

  const handleMealItemPress = (entry: MealPlanEntry, recipe: Recipe) => {
    setSelectedMealItem({ entry, recipe });
    setShowMealOptionsModal(true);
  };

  const handleDeleteMeal = () => {
    if (selectedMealItem) {
      removeMealPlanEntry(selectedMealItem.entry.id);
      setShowMealOptionsModal(false);
      setSelectedMealItem(null);
    }
  };

  const handleAddToShoppingList = () => {
    if (selectedMealItem) {
      setSelectedIngredients(new Set(selectedMealItem.recipe.ingredients.map(i => i.id)));
      setShowMealOptionsModal(false);
      setShowIngredientModal(true);
    }
  };

  const handleGoToRecipe = () => {
    if (selectedMealItem) {
      setShowMealOptionsModal(false);
      setSelectedMealItem(null);
      router.push(`/recipe/${selectedMealItem.recipe.id}`);
    }
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
    if (selectedMealItem) {
      setSelectedIngredients(new Set(selectedMealItem.recipe.ingredients.map(i => i.id)));
    }
  };

  const deselectAllIngredients = () => {
    setSelectedIngredients(new Set());
  };

  const confirmAddToShoppingList = () => {
    if (selectedMealItem && selectedIngredients.size > 0) {
      const ingredientsToAdd = selectedMealItem.recipe.ingredients.filter(
        ing => selectedIngredients.has(ing.id)
      );
      addToShoppingList(ingredientsToAdd, selectedMealItem.recipe.id, selectedMealItem.recipe.title);
      setShowIngredientModal(false);
      setSelectedMealItem(null);
      setSelectedIngredients(new Set());
    }
  };

  const getMealsForType = (mealType: typeof MEAL_TYPES[number]): MealItemWithRecipe[] => {
    const dateKey = formatDateKey(selectedDate);
    const entries = getMealPlanEntriesForSlot(dateKey, mealType);
    const result: MealItemWithRecipe[] = [];
    for (const entry of entries) {
      const recipe = getRecipeById(entry.recipeId);
      if (recipe) {
        result.push({ entry, recipe });
      }
    }
    return result;
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
              const meals = getMealsForType(mealType);
              return (
                <GlassCard key={mealType} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealType}>
                      {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                    </Text>
                    {meals.length > 0 && (
                      <Text style={styles.mealCount}>{meals.length} item{meals.length !== 1 ? 's' : ''}</Text>
                    )}
                  </View>
                  
                  {meals.length > 0 && (
                    <View style={styles.plannedMeals}>
                      {meals.map(({ entry, recipe }) => (
                        <Pressable
                          key={entry.id}
                          style={styles.plannedMeal}
                          onPress={() => handleMealItemPress(entry, recipe)}
                        >
                          <Image source={{ uri: recipe.imageUrl }} style={styles.mealImage} />
                          <View style={styles.mealInfo}>
                            <Text style={styles.plannedMealTitle} numberOfLines={2}>{recipe.title}</Text>
                            <View style={styles.mealMeta}>
                              <Clock size={12} color={Colors.textSecondary} />
                              <Text style={styles.plannedMealMeta}>
                                {recipe.prepTime + recipe.cookTime} min
                              </Text>
                              <Users size={12} color={Colors.textSecondary} style={{ marginLeft: 8 }} />
                              <Text style={styles.plannedMealMeta}>
                                {recipe.servings}
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  
                  <Pressable
                    style={styles.addMealButton}
                    onPress={() => handleAddMeal(mealType)}
                  >
                    <Plus size={20} color={Colors.primary} />
                    <Text style={styles.addMealText}>Add {mealType}</Text>
                  </Pressable>
                </GlassCard>
              );
            })}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Recipe Selection Modal */}
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

        {/* Meal Options Modal */}
        <Modal
          visible={showMealOptionsModal}
          animationType="fade"
          transparent
        >
          <Pressable 
            style={styles.optionsOverlay}
            onPress={() => {
              setShowMealOptionsModal(false);
              setSelectedMealItem(null);
            }}
          >
            <Pressable style={styles.optionsContainer} onPress={(e) => e.stopPropagation()}>
              {selectedMealItem && (
                <>
                  <View style={styles.optionsHeader}>
                    <Image source={{ uri: selectedMealItem.recipe.imageUrl }} style={styles.optionsImage} />
                    <View style={styles.optionsHeaderInfo}>
                      <Text style={styles.optionsTitle} numberOfLines={2}>{selectedMealItem.recipe.title}</Text>
                      <Text style={styles.optionsMeta}>
                        {selectedMealItem.recipe.ingredients.length} ingredients
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.optionsDivider} />
                  
                  <Pressable style={styles.optionButton} onPress={handleGoToRecipe}>
                    <ChefHat size={22} color={Colors.primary} />
                    <Text style={styles.optionText}>Go to Recipe</Text>
                  </Pressable>
                  
                  <Pressable style={styles.optionButton} onPress={handleAddToShoppingList}>
                    <ShoppingCart size={22} color={Colors.primary} />
                    <Text style={styles.optionText}>Add to Shopping List</Text>
                  </Pressable>
                  
                  <Pressable style={[styles.optionButton, styles.deleteOption]} onPress={handleDeleteMeal}>
                    <Trash2 size={22} color={Colors.error} />
                    <Text style={[styles.optionText, styles.deleteText]}>Remove from Meal Plan</Text>
                  </Pressable>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Ingredient Selection Modal */}
        <Modal
          visible={showIngredientModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Ingredients</Text>
              <Pressable onPress={() => {
                setShowIngredientModal(false);
                setSelectedMealItem(null);
                setSelectedIngredients(new Set());
              }} style={styles.closeButton}>
                <X size={24} color={Colors.text} />
              </Pressable>
            </View>
            
            {selectedMealItem && (
              <>
                <View style={styles.ingredientHeader}>
                  <Text style={styles.ingredientRecipeTitle}>{selectedMealItem.recipe.title}</Text>
                  <View style={styles.selectionActions}>
                    <Pressable onPress={selectAllIngredients} style={styles.selectionButton}>
                      <Text style={styles.selectionButtonText}>Select All</Text>
                    </Pressable>
                    <Pressable onPress={deselectAllIngredients} style={styles.selectionButton}>
                      <Text style={styles.selectionButtonText}>Deselect All</Text>
                    </Pressable>
                  </View>
                </View>
                
                <ScrollView style={styles.ingredientList}>
                  {selectedMealItem.recipe.ingredients.map((ingredient) => (
                    <Pressable
                      key={ingredient.id}
                      style={styles.ingredientItem}
                      onPress={() => toggleIngredient(ingredient.id)}
                    >
                      <View style={[
                        styles.ingredientCheckbox,
                        selectedIngredients.has(ingredient.id) && styles.ingredientCheckboxChecked
                      ]}>
                        {selectedIngredients.has(ingredient.id) && (
                          <Check size={14} color={Colors.textOnPrimary} />
                        )}
                      </View>
                      <View style={styles.ingredientInfo}>
                        <Text style={styles.ingredientName}>{ingredient.name}</Text>
                        <Text style={styles.ingredientAmount}>{ingredient.amount} {ingredient.unit}</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
                
                <View style={styles.ingredientFooter}>
                  <Text style={styles.selectedCount}>
                    {selectedIngredients.size} of {selectedMealItem.recipe.ingredients.length} selected
                  </Text>
                  <Pressable
                    style={[
                      styles.confirmButton,
                      selectedIngredients.size === 0 && styles.confirmButtonDisabled
                    ]}
                    onPress={confirmAddToShoppingList}
                    disabled={selectedIngredients.size === 0}
                  >
                    <ShoppingCart size={18} color={Colors.textOnPrimary} />
                    <Text style={styles.confirmButtonText}>Add to Shopping List</Text>
                  </Pressable>
                </View>
              </>
            )}
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
  mealCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  plannedMeals: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  plannedMeal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  mealImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
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
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  optionsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
  },
  optionsHeader: {
    flexDirection: 'row',
    padding: Spacing.md,
    alignItems: 'center',
  },
  optionsImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.borderLight,
  },
  optionsHeaderInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  optionsTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  optionsMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  optionsDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  optionText: {
    ...Typography.body,
    color: Colors.text,
  },
  deleteOption: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  deleteText: {
    color: Colors.error,
  },
  ingredientHeader: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  ingredientRecipeTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: Spacing.md,
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
    padding: Spacing.lg,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  ingredientCheckbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  ingredientCheckboxChecked: {
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
  ingredientFooter: {
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
  bottomPadding: {
    height: FLOATING_BAR_HEIGHT,
  },
});
