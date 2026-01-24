import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { mockRecipes } from '@/mocks/recipes';
import { Recipe, MealPlan, UserPreferences } from '@/types/recipe';

const FAVORITES_KEY = 'culinaria_favorites';
const MEAL_PLANS_KEY = 'culinaria_meal_plans';
const PREFERENCES_KEY = 'culinaria_preferences';
const RECENT_KEY = 'culinaria_recent';
const CUSTOM_RECIPES_KEY = 'culinaria_custom_recipes';

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

  const isLoading = favoritesQuery.isLoading || mealPlansQuery.isLoading || preferencesQuery.isLoading || customRecipesQuery.isLoading;

  return {
    allRecipes,
    favorites,
    favoriteRecipes,
    recentRecipes,
    mealPlans,
    userPreferences,
    customRecipes,
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
