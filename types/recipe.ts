export interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

export interface Step {
  id: string;
  order: number;
  instruction: string;
  duration?: number;
  tip?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: RecipeCategory;
  cuisine: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: Ingredient[];
  steps: Step[];
  nutrition?: NutritionInfo;
  tags: string[];
  rating: number;
  reviewCount: number;
  isFavorite?: boolean;
  createdAt: string;
  sourceUrl?: string;
  authorId?: string;
}

export type RecipeCategory = 
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'dessert'
  | 'snack'
  | 'beverage';

export interface MealPlanDay {
  date: string;
  meals: {
    breakfast?: Recipe;
    lunch?: Recipe;
    dinner?: Recipe;
    snacks?: Recipe[];
  };
}

export interface MealPlan {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  days: MealPlanDay[];
}

export interface DietaryPreference {
  id: string;
  name: string;
  icon: string;
}

export interface UserPreferences {
  dietaryRestrictions: string[];
  allergies: string[];
  cuisinePreferences: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface VideoExtractionResult {
  title: string;
  ingredients: Ingredient[];
  steps: Step[];
  sourceUrl: string;
  thumbnailUrl?: string;
}

export interface Review {
  id: string;
  recipeId: string;
  rating: number;
  comment: string;
  authorName: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  recipesCount: number;
  followersCount: number;
  followingCount: number;
  isVerified?: boolean;
  joinedAt: string;
}

export interface SharedRecipe {
  id: string;
  recipeId: string;
  fromUserId: string;
  toUserId: string;
  message?: string;
  sharedAt: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  amount: string;
  unit: string;
  recipeId?: string;
  recipeName?: string;
  isChecked: boolean;
  addedAt: string;
}

export interface MealPlanEntry {
  id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  recipeId: string;
}
