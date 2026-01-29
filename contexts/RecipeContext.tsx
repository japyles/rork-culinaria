import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Recipe, MealPlan, UserPreferences, Review, ShoppingListItem, MealPlanEntry, Ingredient } from '@/types/recipe';

interface DbRecipe {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  cuisine: string;
  difficulty: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  nutrition_calories: number | null;
  nutrition_protein: number | null;
  nutrition_carbs: number | null;
  nutrition_fat: number | null;
  nutrition_fiber: number | null;
  tags: string[];
  rating: number;
  review_count: number;
  source_url: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
  recipe_ingredients: DbIngredient[];
  recipe_steps: DbStep[];
}

interface DbIngredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
  order_index: number;
}

interface DbStep {
  id: string;
  order_index: number;
  instruction: string;
  duration: number | null;
  tip: string | null;
}

interface DbReview {
  id: string;
  recipe_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  users: { display_name: string } | null;
}

interface DbShoppingItem {
  id: string;
  user_id: string;
  name: string;
  amount: string;
  unit: string;
  recipe_id: string | null;
  recipe_name: string | null;
  is_checked: boolean;
  added_at: string;
}

interface DbMealPlanEntry {
  id: string;
  user_id: string;
  date: string;
  meal_type: string;
  recipe_id: string;
  created_at: string;
}

interface DbPreferences {
  dietary_restrictions: string[];
  allergies: string[];
  cuisine_preferences: string[];
  skill_level: string;
}

export const [RecipeProvider, useRecipes] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const recipesQuery = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      console.log('[Recipes] Fetching all recipes...');
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients(*),
          recipe_steps(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Recipes] Error fetching recipes:', error);
        throw error;
      }

      console.log('[Recipes] Fetched', recipes?.length, 'recipes');
      
      return ((recipes || []) as DbRecipe[]).map((r): Recipe => ({
        id: r.id,
        title: r.title,
        description: r.description,
        imageUrl: r.image_url,
        category: r.category as Recipe['category'],
        cuisine: r.cuisine,
        difficulty: r.difficulty as Recipe['difficulty'],
        prepTime: r.prep_time,
        cookTime: r.cook_time,
        servings: r.servings,
        ingredients: (r.recipe_ingredients || [])
          .sort((a, b) => a.order_index - b.order_index)
          .map((ing) => ({
            id: ing.id,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
          })),
        steps: (r.recipe_steps || [])
          .sort((a, b) => a.order_index - b.order_index)
          .map((step) => ({
            id: step.id,
            order: step.order_index,
            instruction: step.instruction,
            duration: step.duration || undefined,
            tip: step.tip || undefined,
          })),
        nutrition: r.nutrition_calories ? {
          calories: r.nutrition_calories,
          protein: r.nutrition_protein || 0,
          carbs: r.nutrition_carbs || 0,
          fat: r.nutrition_fat || 0,
          fiber: r.nutrition_fiber || undefined,
        } : undefined,
        tags: r.tags || [],
        rating: Number(r.rating) || 0,
        reviewCount: r.review_count || 0,
        createdAt: r.created_at,
        sourceUrl: r.source_url || undefined,
        authorId: r.author_id,
      }));
    },
  });

  const favoritesQuery = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('[Recipes] Fetching favorites for user:', user.id);
      const { data, error } = await supabase
        .from('favorites')
        .select('recipe_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('[Recipes] Error fetching favorites:', error);
        throw error;
      }

      return (data || []).map((f: { recipe_id: string }) => f.recipe_id);
    },
    enabled: !!user?.id,
  });

  const recentlyViewedQuery = useQuery({
    queryKey: ['recentlyViewed', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('[Recipes] Fetching recently viewed for user:', user.id);
      const { data, error } = await supabase
        .from('recently_viewed')
        .select('recipe_id')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('[Recipes] Error fetching recently viewed:', error);
        throw error;
      }

      return (data || []).map(r => r.recipe_id);
    },
    enabled: !!user?.id,
  });

  const preferencesQuery = useQuery({
    queryKey: ['preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('[Recipes] Fetching preferences for user:', user.id);
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[Recipes] Error fetching preferences:', error);
        throw error;
      }

      if (!data) return null;

      const prefs = data as DbPreferences;
      return {
        dietaryRestrictions: prefs.dietary_restrictions || [],
        allergies: prefs.allergies || [],
        cuisinePreferences: prefs.cuisine_preferences || [],
        skillLevel: prefs.skill_level as UserPreferences['skillLevel'],
      };
    },
    enabled: !!user?.id,
  });

  const reviewsQuery = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      console.log('[Recipes] Fetching all reviews...');
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          users!reviews_user_id_fkey(display_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Recipes] Error fetching reviews:', error);
        throw error;
      }

      return ((data || []) as DbReview[]).map((r): Review => ({
        id: r.id,
        recipeId: r.recipe_id,
        rating: r.rating,
        comment: r.comment,
        authorName: r.users?.display_name || 'Anonymous',
        createdAt: r.created_at,
      }));
    },
  });

  const shoppingListQuery = useQuery({
    queryKey: ['shoppingList', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('[Recipes] Fetching shopping list for user:', user.id);
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('[Recipes] Error fetching shopping list:', error);
        throw error;
      }

      return ((data || []) as DbShoppingItem[]).map((item): ShoppingListItem => ({
        id: item.id,
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        recipeId: item.recipe_id || undefined,
        recipeName: item.recipe_name || undefined,
        isChecked: item.is_checked,
        addedAt: item.added_at,
      }));
    },
    enabled: !!user?.id,
  });

  const mealPlanEntriesQuery = useQuery({
    queryKey: ['mealPlanEntries', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('[Recipes] Fetching meal plan entries for user:', user.id);
      const { data, error } = await supabase
        .from('meal_plan_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) {
        console.error('[Recipes] Error fetching meal plan entries:', error);
        throw error;
      }

      return ((data || []) as DbMealPlanEntry[]).map((entry): MealPlanEntry => ({
        id: entry.id,
        date: entry.date,
        mealType: entry.meal_type as MealPlanEntry['mealType'],
        recipeId: entry.recipe_id,
      }));
    },
    enabled: !!user?.id,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const currentFavorites = favoritesQuery.data || [];
      const isFavorite = currentFavorites.includes(recipeId);

      if (isFavorite) {
        console.log('[Recipes] Removing favorite:', recipeId);
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId);

        if (error) throw error;
      } else {
        console.log('[Recipes] Adding favorite:', recipeId);
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, recipe_id: recipeId } as { user_id: string; recipe_id: string });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });

  const addRecentlyViewedMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      if (!user?.id) return;

      console.log('[Recipes] Adding recently viewed:', recipeId);
      const { error } = await supabase
        .from('recently_viewed')
        .upsert(
          { user_id: user.id, recipe_id: recipeId, viewed_at: new Date().toISOString() } as { user_id: string; recipe_id: string; viewed_at: string },
          { onConflict: 'user_id,recipe_id' }
        );

      if (error) {
        console.error('[Recipes] Error adding recently viewed:', error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentlyViewed', user?.id] });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (prefs: Partial<UserPreferences>) => {
      if (!user?.id) throw new Error('Not authenticated');

      console.log('[Recipes] Updating preferences:', prefs);
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          dietary_restrictions: prefs.dietaryRestrictions,
          allergies: prefs.allergies,
          cuisine_preferences: prefs.cuisinePreferences,
          skill_level: prefs.skillLevel,
        } as { user_id: string; dietary_restrictions?: string[]; allergies?: string[]; cuisine_preferences?: string[]; skill_level?: string }, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences', user?.id] });
    },
  });

  const addRecipeMutation = useMutation({
    mutationFn: async (recipe: Omit<Recipe, 'id' | 'rating' | 'reviewCount' | 'createdAt'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      console.log('[Recipes] Adding new recipe:', recipe.title);
      
      const { data: newRecipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          title: recipe.title,
          description: recipe.description,
          image_url: recipe.imageUrl,
          category: recipe.category,
          cuisine: recipe.cuisine,
          difficulty: recipe.difficulty,
          prep_time: recipe.prepTime,
          cook_time: recipe.cookTime,
          servings: recipe.servings,
          nutrition_calories: recipe.nutrition?.calories,
          nutrition_protein: recipe.nutrition?.protein,
          nutrition_carbs: recipe.nutrition?.carbs,
          nutrition_fat: recipe.nutrition?.fat,
          nutrition_fiber: recipe.nutrition?.fiber,
          tags: recipe.tags,
          source_url: recipe.sourceUrl,
          author_id: user.id,
        } as any)
        .select()
        .single();

      if (recipeError) throw recipeError;

      if (recipe.ingredients.length > 0) {
        const { error: ingError } = await supabase
          .from('recipe_ingredients')
          .insert(
            recipe.ingredients.map((ing, index) => ({
              recipe_id: (newRecipe as any).id,
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
              order_index: index,
            })) as any
          );

        if (ingError) throw ingError;
      }

      if (recipe.steps.length > 0) {
        const { error: stepError } = await supabase
          .from('recipe_steps')
          .insert(
            recipe.steps.map((step) => ({
              recipe_id: (newRecipe as any).id,
              order_index: step.order,
              instruction: step.instruction,
              duration: step.duration,
              tip: step.tip,
            })) as any
          );

        if (stepError) throw stepError;
      }

      console.log('[Recipes] Recipe added successfully:', (newRecipe as any).id);
      return newRecipe;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });

  const updateRecipeMutation = useMutation({
    mutationFn: async ({ recipeId, updates }: { recipeId: string; updates: Partial<Recipe> }) => {
      if (!user?.id) throw new Error('Not authenticated');

      console.log('[Recipes] Updating recipe:', recipeId);
      
      const { error } = await supabase
        .from('recipes')
        .update({
          title: updates.title,
          description: updates.description,
          image_url: updates.imageUrl,
          category: updates.category,
          cuisine: updates.cuisine,
          difficulty: updates.difficulty,
          prep_time: updates.prepTime,
          cook_time: updates.cookTime,
          servings: updates.servings,
          nutrition_calories: updates.nutrition?.calories,
          nutrition_protein: updates.nutrition?.protein,
          nutrition_carbs: updates.nutrition?.carbs,
          nutrition_fat: updates.nutrition?.fat,
          nutrition_fiber: updates.nutrition?.fiber,
          tags: updates.tags,
          source_url: updates.sourceUrl,
        } as any)
        .eq('id', recipeId)
        .eq('author_id', user.id);

      if (error) throw error;

      if (updates.ingredients) {
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId);
        
        const { error: ingError } = await supabase
          .from('recipe_ingredients')
          .insert(
            updates.ingredients.map((ing, index) => ({
              recipe_id: recipeId,
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
              order_index: index,
            })) as any
          );

        if (ingError) throw ingError;
      }

      if (updates.steps) {
        await supabase.from('recipe_steps').delete().eq('recipe_id', recipeId);
        
        const { error: stepError } = await supabase
          .from('recipe_steps')
          .insert(
            updates.steps.map((step) => ({
              recipe_id: recipeId,
              order_index: step.order,
              instruction: step.instruction,
              duration: step.duration,
              tip: step.tip,
            })) as any
          );

        if (stepError) throw stepError;
      }

      console.log('[Recipes] Recipe updated successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      console.log('[Recipes] Deleting recipe:', recipeId);
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)
        .eq('author_id', user.id);

      if (error) throw error;
      console.log('[Recipes] Recipe deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['recentlyViewed'] });
    },
  });

  const addReviewMutation = useMutation({
    mutationFn: async (review: Omit<Review, 'id' | 'createdAt' | 'authorName'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      console.log('[Recipes] Adding review for recipe:', review.recipeId);
      const { error } = await supabase
        .from('reviews')
        .insert({
          recipe_id: review.recipeId,
          user_id: user.id,
          rating: review.rating,
          comment: review.comment,
        } as any);

      if (error) throw error;
      console.log('[Recipes] Review added successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });

  const addToShoppingListMutation = useMutation({
    mutationFn: async ({ ingredients, recipeId, recipeName }: { 
      ingredients: Ingredient[]; 
      recipeId?: string; 
      recipeName?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      console.log('[Recipes] Adding to shopping list:', ingredients.length, 'items');
      const { error } = await supabase
        .from('shopping_list_items')
        .insert(
          ingredients.map((ing) => ({
            user_id: user.id,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            recipe_id: recipeId,
            recipe_name: recipeName,
          })) as any
        );

      if (error) throw error;
      console.log('[Recipes] Shopping list updated');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoppingList', user?.id] });
    },
  });

  const toggleShoppingItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const currentItem = shoppingListQuery.data?.find(i => i.id === itemId);
      if (!currentItem) throw new Error('Item not found');

      const { error } = await supabase
        .from('shopping_list_items')
        .update({ is_checked: !currentItem.isChecked })
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoppingList', user?.id] });
    },
  });

  const removeShoppingItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoppingList', user?.id] });
    },
  });

  const clearCheckedItemsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('user_id', user.id)
        .eq('is_checked', true);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoppingList', user?.id] });
    },
  });

  const clearShoppingListMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoppingList', user?.id] });
    },
  });

  const addMealPlanEntryMutation = useMutation({
    mutationFn: async (entry: Omit<MealPlanEntry, 'id'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      console.log('[Recipes] Adding meal plan entry:', entry);
      const { error } = await supabase
        .from('meal_plan_entries')
        .insert({
          user_id: user.id,
          date: entry.date,
          meal_type: entry.mealType,
          recipe_id: entry.recipeId,
        } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlanEntries', user?.id] });
    },
  });

  const removeMealPlanEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('meal_plan_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlanEntries', user?.id] });
    },
  });

  const { mutate: toggleFavoriteMutate } = toggleFavoriteMutation;
  const { mutate: addRecentlyViewedMutate } = addRecentlyViewedMutation;
  const { mutate: updatePreferencesMutate } = updatePreferencesMutation;
  const { mutateAsync: addRecipeAsync } = addRecipeMutation;
  const { mutate: updateRecipeMutate } = updateRecipeMutation;
  const { mutate: deleteRecipeMutate } = deleteRecipeMutation;
  const { mutateAsync: addReviewAsync } = addReviewMutation;
  const { mutate: addToShoppingListMutate } = addToShoppingListMutation;
  const { mutate: toggleShoppingItemMutate } = toggleShoppingItemMutation;
  const { mutate: removeShoppingItemMutate } = removeShoppingItemMutation;
  const { mutate: clearCheckedItemsMutate } = clearCheckedItemsMutation;
  const { mutate: clearShoppingListMutate } = clearShoppingListMutation;
  const { mutate: addMealPlanEntryMutate } = addMealPlanEntryMutation;
  const { mutate: removeMealPlanEntryMutate } = removeMealPlanEntryMutation;

  const toggleFavorite = useCallback((recipeId: string) => {
    toggleFavoriteMutate(recipeId);
  }, [toggleFavoriteMutate]);

  const addRecentlyViewed = useCallback((recipeId: string) => {
    addRecentlyViewedMutate(recipeId);
  }, [addRecentlyViewedMutate]);

  const updatePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    updatePreferencesMutate(prefs);
  }, [updatePreferencesMutate]);

  const addRecipe = useCallback((recipe: Omit<Recipe, 'id' | 'rating' | 'reviewCount' | 'createdAt'>) => {
    return addRecipeAsync(recipe);
  }, [addRecipeAsync]);

  const updateRecipe = useCallback((recipeId: string, updates: Partial<Recipe>) => {
    updateRecipeMutate({ recipeId, updates });
  }, [updateRecipeMutate]);

  const deleteRecipe = useCallback((recipeId: string) => {
    deleteRecipeMutate(recipeId);
  }, [deleteRecipeMutate]);

  const isCustomRecipe = useCallback((recipeId: string) => {
    const recipe = recipesQuery.data?.find(r => r.id === recipeId);
    return recipe?.authorId === user?.id;
  }, [recipesQuery.data, user?.id]);

  const addReview = useCallback((review: Omit<Review, 'id' | 'createdAt' | 'authorName'>) => {
    return addReviewAsync(review);
  }, [addReviewAsync]);

  const getReviewsForRecipe = useCallback((recipeId: string) => {
    return reviewsQuery.data?.filter(r => r.recipeId === recipeId) || [];
  }, [reviewsQuery.data]);

  const getAverageRating = useCallback((recipeId: string) => {
    const recipeReviews = reviewsQuery.data?.filter(r => r.recipeId === recipeId) || [];
    if (recipeReviews.length === 0) return null;
    return recipeReviews.reduce((sum, r) => sum + r.rating, 0) / recipeReviews.length;
  }, [reviewsQuery.data]);

  const addToShoppingList = useCallback((ingredients: Ingredient[], recipeId?: string, recipeName?: string) => {
    addToShoppingListMutate({ ingredients, recipeId, recipeName });
  }, [addToShoppingListMutate]);

  const toggleShoppingItem = useCallback((itemId: string) => {
    toggleShoppingItemMutate(itemId);
  }, [toggleShoppingItemMutate]);

  const removeShoppingItem = useCallback((itemId: string) => {
    removeShoppingItemMutate(itemId);
  }, [removeShoppingItemMutate]);

  const clearCheckedItems = useCallback(() => {
    clearCheckedItemsMutate();
  }, [clearCheckedItemsMutate]);

  const clearShoppingList = useCallback(() => {
    clearShoppingListMutate();
  }, [clearShoppingListMutate]);

  const addMealPlanEntry = useCallback((entry: Omit<MealPlanEntry, 'id'>) => {
    addMealPlanEntryMutate(entry);
  }, [addMealPlanEntryMutate]);

  const removeMealPlanEntry = useCallback((entryId: string) => {
    removeMealPlanEntryMutate(entryId);
  }, [removeMealPlanEntryMutate]);

  const getMealPlanEntriesForSlot = useCallback((date: string, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    return mealPlanEntriesQuery.data?.filter(e => e.date === date && e.mealType === mealType) || [];
  }, [mealPlanEntriesQuery.data]);

  const getMealPlanForDate = useCallback((date: string) => {
    return mealPlanEntriesQuery.data?.filter(e => e.date === date) || [];
  }, [mealPlanEntriesQuery.data]);

  const favorites = favoritesQuery.data || [];
  const recentlyViewed = recentlyViewedQuery.data || [];

  const allRecipes = useMemo(() => {
    return (recipesQuery.data || []).map((recipe) => ({
      ...recipe,
      isFavorite: favorites.includes(recipe.id),
    }));
  }, [recipesQuery.data, favorites]);

  const favoriteRecipes = useMemo(() => {
    return allRecipes.filter((recipe) => favorites.includes(recipe.id));
  }, [allRecipes, favorites]);

  const recentRecipes = useMemo(() => {
    return recentlyViewed
      .map((id) => allRecipes.find((r) => r.id === id))
      .filter(Boolean) as Recipe[];
  }, [allRecipes, recentlyViewed]);

  const customRecipes = useMemo(() => {
    return allRecipes.filter((recipe) => recipe.authorId === user?.id);
  }, [allRecipes, user?.id]);

  const getRecipeById = useCallback((id: string) => {
    return allRecipes.find((recipe) => recipe.id === id);
  }, [allRecipes]);

  const userPreferences = preferencesQuery.data || {
    dietaryRestrictions: [],
    allergies: [],
    cuisinePreferences: [],
    skillLevel: 'intermediate' as const,
  };

  const isLoading = recipesQuery.isLoading || favoritesQuery.isLoading || 
    recentlyViewedQuery.isLoading || preferencesQuery.isLoading || 
    reviewsQuery.isLoading || shoppingListQuery.isLoading || mealPlanEntriesQuery.isLoading;

  return {
    allRecipes,
    favorites,
    favoriteRecipes,
    recentRecipes,
    mealPlans: [] as MealPlan[],
    userPreferences,
    customRecipes,
    reviews: reviewsQuery.data || [],
    shoppingList: shoppingListQuery.data || [],
    mealPlanEntries: mealPlanEntriesQuery.data || [],
    isLoading,
    toggleFavorite,
    addRecentlyViewed,
    addMealPlan: () => {},
    updateMealPlan: () => {},
    deleteMealPlan: () => {},
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
