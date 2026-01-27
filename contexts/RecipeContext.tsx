import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { mockRecipes } from '@/mocks/recipes';
import { Recipe, MealPlan, UserPreferences, Review, ShoppingListItem, MealPlanEntry, Ingredient } from '@/types/recipe';

const FAVORITES_KEY = 'culinaria_favorites';
const MEAL_PLANS_KEY = 'culinaria_meal_plans';
const PREFERENCES_KEY = 'culinaria_preferences';
const RECENT_KEY = 'culinaria_recent';
const CUSTOM_RECIPES_KEY = 'culinaria_custom_recipes';
const REVIEWS_KEY = 'culinaria_reviews';
const SHOPPING_LIST_KEY = 'culinaria_shopping_list';
const MEAL_PLAN_ENTRIES_KEY = 'culinaria_meal_plan_entries';

export const [RecipeProvider, useRecipes] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    dietaryRestrictions: [],
    allergies: [],
    cuisinePreferences: [],
    skillLevel: 'intermediate',
  });
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [mealPlanEntries, setMealPlanEntries] = useState<MealPlanEntry[]>([]);

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const mealPlansQuery = useQuery({
    queryKey: ['mealPlans'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const preferencesQuery = useQuery({
    queryKey: ['preferences'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
      return stored ? JSON.parse(stored) : null;
    },
  });

  const recentQuery = useQuery({
    queryKey: ['recent'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(RECENT_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const customRecipesQuery = useQuery({
    queryKey: ['customRecipes'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(CUSTOM_RECIPES_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const reviewsQuery = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(REVIEWS_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const shoppingListQuery = useQuery({
    queryKey: ['shoppingList'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(SHOPPING_LIST_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const mealPlanEntriesQuery = useQuery({
    queryKey: ['mealPlanEntries'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(MEAL_PLAN_ENTRIES_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  useEffect(() => {
    if (favoritesQuery.data) setFavorites(favoritesQuery.data);
  }, [favoritesQuery.data]);

  useEffect(() => {
    if (mealPlansQuery.data) setMealPlans(mealPlansQuery.data);
  }, [mealPlansQuery.data]);

  useEffect(() => {
    if (preferencesQuery.data) setUserPreferences(preferencesQuery.data);
  }, [preferencesQuery.data]);

  useEffect(() => {
    if (recentQuery.data) setRecentlyViewed(recentQuery.data);
  }, [recentQuery.data]);

  useEffect(() => {
    if (customRecipesQuery.data) setCustomRecipes(customRecipesQuery.data);
  }, [customRecipesQuery.data]);

  useEffect(() => {
    if (reviewsQuery.data) setReviews(reviewsQuery.data);
  }, [reviewsQuery.data]);

  useEffect(() => {
    if (shoppingListQuery.data) setShoppingList(shoppingListQuery.data);
  }, [shoppingListQuery.data]);

  useEffect(() => {
    if (mealPlanEntriesQuery.data) setMealPlanEntries(mealPlanEntriesQuery.data);
  }, [mealPlanEntriesQuery.data]);

  const saveFavoritesMutation = useMutation({
    mutationFn: async (newFavorites: string[]) => {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      return newFavorites;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const saveMealPlansMutation = useMutation({
    mutationFn: async (newPlans: MealPlan[]) => {
      await AsyncStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(newPlans));
      return newPlans;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
    },
  });

  const savePreferencesMutation = useMutation({
    mutationFn: async (prefs: UserPreferences) => {
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
      return prefs;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });

  const saveRecentMutation = useMutation({
    mutationFn: async (recent: string[]) => {
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(recent));
      return recent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent'] });
    },
  });

  const saveCustomRecipesMutation = useMutation({
    mutationFn: async (recipes: Recipe[]) => {
      await AsyncStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(recipes));
      return recipes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customRecipes'] });
    },
  });

  const saveReviewsMutation = useMutation({
    mutationFn: async (newReviews: Review[]) => {
      await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(newReviews));
      return newReviews;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const saveShoppingListMutation = useMutation({
    mutationFn: async (items: ShoppingListItem[]) => {
      await AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(items));
      return items;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoppingList'] });
    },
  });

  const saveMealPlanEntriesMutation = useMutation({
    mutationFn: async (entries: MealPlanEntry[]) => {
      await AsyncStorage.setItem(MEAL_PLAN_ENTRIES_KEY, JSON.stringify(entries));
      return entries;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlanEntries'] });
    },
  });

  const toggleFavorite = useCallback((recipeId: string) => {
    setFavorites((prev) => {
      const newFavorites = prev.includes(recipeId)
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId];
      saveFavoritesMutation.mutate(newFavorites);
      return newFavorites;
    });
  }, []);

  const addRecentlyViewed = useCallback((recipeId: string) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((id) => id !== recipeId);
      const newRecent = [recipeId, ...filtered].slice(0, 10);
      saveRecentMutation.mutate(newRecent);
      return newRecent;
    });
  }, []);

  const addMealPlan = useCallback((plan: MealPlan) => {
    setMealPlans((prev) => {
      const newPlans = [...prev, plan];
      saveMealPlansMutation.mutate(newPlans);
      return newPlans;
    });
  }, []);

  const updateMealPlan = useCallback((planId: string, updates: Partial<MealPlan>) => {
    setMealPlans((prev) => {
      const newPlans = prev.map((plan) =>
        plan.id === planId ? { ...plan, ...updates } : plan
      );
      saveMealPlansMutation.mutate(newPlans);
      return newPlans;
    });
  }, []);

  const deleteMealPlan = useCallback((planId: string) => {
    setMealPlans((prev) => {
      const newPlans = prev.filter((plan) => plan.id !== planId);
      saveMealPlansMutation.mutate(newPlans);
      return newPlans;
    });
  }, []);

  const updatePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    setUserPreferences((prev) => {
      const newPrefs = { ...prev, ...prefs };
      savePreferencesMutation.mutate(newPrefs);
      return newPrefs;
    });
  }, []);

  const addRecipe = useCallback((recipe: Recipe) => {
    setCustomRecipes((prev) => {
      const newRecipes = [recipe, ...prev];
      saveCustomRecipesMutation.mutate(newRecipes);
      return newRecipes;
    });
  }, []);

  const deleteRecipe = useCallback((recipeId: string) => {
    setCustomRecipes((prev) => {
      const newRecipes = prev.filter((r) => r.id !== recipeId);
      saveCustomRecipesMutation.mutate(newRecipes);
      return newRecipes;
    });
    setFavorites((prev) => {
      const newFavorites = prev.filter((id) => id !== recipeId);
      saveFavoritesMutation.mutate(newFavorites);
      return newFavorites;
    });
    setRecentlyViewed((prev) => {
      const newRecent = prev.filter((id) => id !== recipeId);
      saveRecentMutation.mutate(newRecent);
      return newRecent;
    });
  }, []);

  const updateRecipe = useCallback((recipeId: string, updates: Partial<Recipe>) => {
    setCustomRecipes((prev) => {
      const newRecipes = prev.map((r) =>
        r.id === recipeId ? { ...r, ...updates } : r
      );
      saveCustomRecipesMutation.mutate(newRecipes);
      return newRecipes;
    });
  }, []);

  const isCustomRecipe = useCallback((recipeId: string) => {
    return customRecipes.some((r) => r.id === recipeId);
  }, [customRecipes]);

  const addReview = useCallback((review: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...review,
      id: `review_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setReviews((prev) => {
      const newReviews = [newReview, ...prev];
      saveReviewsMutation.mutate(newReviews);
      return newReviews;
    });
    return newReview;
  }, []);

  const getReviewsForRecipe = useCallback((recipeId: string) => {
    return reviews.filter((r) => r.recipeId === recipeId);
  }, [reviews]);

  const getAverageRating = useCallback((recipeId: string) => {
    const recipeReviews = reviews.filter((r) => r.recipeId === recipeId);
    if (recipeReviews.length === 0) return null;
    const total = recipeReviews.reduce((sum, r) => sum + r.rating, 0);
    return total / recipeReviews.length;
  }, [reviews]);

  const addToShoppingList = useCallback((ingredients: Ingredient[], recipeId?: string, recipeName?: string) => {
    setShoppingList((prev) => {
      const newItems: ShoppingListItem[] = ingredients.map((ing) => ({
        id: `shop_${Date.now()}_${ing.id}`,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        recipeId,
        recipeName,
        isChecked: false,
        addedAt: new Date().toISOString(),
      }));
      const updated = [...prev, ...newItems];
      saveShoppingListMutation.mutate(updated);
      return updated;
    });
  }, []);

  const toggleShoppingItem = useCallback((itemId: string) => {
    setShoppingList((prev) => {
      const updated = prev.map((item) =>
        item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
      );
      saveShoppingListMutation.mutate(updated);
      return updated;
    });
  }, []);

  const removeShoppingItem = useCallback((itemId: string) => {
    setShoppingList((prev) => {
      const updated = prev.filter((item) => item.id !== itemId);
      saveShoppingListMutation.mutate(updated);
      return updated;
    });
  }, []);

  const clearCheckedItems = useCallback(() => {
    setShoppingList((prev) => {
      const updated = prev.filter((item) => !item.isChecked);
      saveShoppingListMutation.mutate(updated);
      return updated;
    });
  }, []);

  const clearShoppingList = useCallback(() => {
    setShoppingList([]);
    saveShoppingListMutation.mutate([]);
  }, []);

  const addMealPlanEntry = useCallback((entry: Omit<MealPlanEntry, 'id'>) => {
    const newEntry: MealPlanEntry = {
      ...entry,
      id: `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setMealPlanEntries((prev) => {
      const updated = [...prev, newEntry];
      saveMealPlanEntriesMutation.mutate(updated);
      return updated;
    });
  }, []);

  const removeMealPlanEntry = useCallback((entryId: string) => {
    setMealPlanEntries((prev) => {
      const updated = prev.filter((e) => e.id !== entryId);
      saveMealPlanEntriesMutation.mutate(updated);
      return updated;
    });
  }, []);

  const getMealPlanEntriesForSlot = useCallback((date: string, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    return mealPlanEntries.filter((e) => e.date === date && e.mealType === mealType);
  }, [mealPlanEntries]);

  const getMealPlanForDate = useCallback((date: string) => {
    return mealPlanEntries.filter((e) => e.date === date);
  }, [mealPlanEntries]);

  const allRecipes = useMemo(() => {
    const combined = [...customRecipes, ...mockRecipes];
    return combined.map((recipe) => ({
      ...recipe,
      isFavorite: favorites.includes(recipe.id),
    }));
  }, [favorites, customRecipes]);

  const favoriteRecipes = useMemo(() => {
    return allRecipes.filter((recipe) => favorites.includes(recipe.id));
  }, [allRecipes, favorites]);

  const recentRecipes = useMemo(() => {
    return recentlyViewed
      .map((id) => allRecipes.find((r) => r.id === id))
      .filter(Boolean) as Recipe[];
  }, [allRecipes, recentlyViewed]);

  const getRecipeById = useCallback((id: string) => {
    return allRecipes.find((recipe) => recipe.id === id);
  }, [allRecipes]);

  const isLoading = favoritesQuery.isLoading || mealPlansQuery.isLoading || preferencesQuery.isLoading || customRecipesQuery.isLoading || reviewsQuery.isLoading || shoppingListQuery.isLoading || mealPlanEntriesQuery.isLoading;

  return {
    allRecipes,
    favorites,
    favoriteRecipes,
    recentRecipes,
    mealPlans,
    userPreferences,
    customRecipes,
    reviews,
    shoppingList,
    mealPlanEntries,
    isLoading,
    toggleFavorite,
    addRecentlyViewed,
    addMealPlan,
    updateMealPlan,
    deleteMealPlan,
    updatePreferences,
    getRecipeById,
    addRecipe,
    deleteRecipe,
    updateRecipe,
    isCustomRecipe,
    addReview,
    getReviewsForRecipe,
    getAverageRating,
    addToShoppingList,
    toggleShoppingItem,
    removeShoppingItem,
    clearCheckedItems,
    clearShoppingList,
    addMealPlanEntry,
    removeMealPlanEntry,
    getMealPlanEntriesForSlot,
    getMealPlanForDate,
  };
});

export function useFilteredRecipes(
  search: string,
  category?: string,
  cuisine?: string,
  difficulty?: string
) {
  const { allRecipes } = useRecipes();

  return useMemo(() => {
    return allRecipes.filter((recipe) => {
      const matchesSearch =
        !search ||
        recipe.title.toLowerCase().includes(search.toLowerCase()) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase())) ||
        recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory = !category || recipe.category === category;
      const matchesCuisine = !cuisine || recipe.cuisine === cuisine;
      const matchesDifficulty = !difficulty || recipe.difficulty === difficulty;

      return matchesSearch && matchesCategory && matchesCuisine && matchesDifficulty;
    });
  }, [allRecipes, search, category, cuisine, difficulty]);
}

export function useRecipesByCategory(category: string) {
  const { allRecipes } = useRecipes();
  return useMemo(() => {
    return allRecipes.filter((recipe) => recipe.category === category);
  }, [allRecipes, category]);
}
