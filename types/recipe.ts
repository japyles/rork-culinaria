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
