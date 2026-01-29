export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          display_name: string
          avatar_url: string | null
          bio: string | null
          is_verified: boolean
          joined_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          display_name: string
          avatar_url?: string | null
          bio?: string | null
          is_verified?: boolean
          joined_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          display_name?: string
          avatar_url?: string | null
          bio?: string | null
          is_verified?: boolean
          joined_at?: string
          updated_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          title: string
          description: string
          image_url: string
          category: string
          cuisine: string
          difficulty: string
          prep_time: number
          cook_time: number
          servings: number
          nutrition_calories: number | null
          nutrition_protein: number | null
          nutrition_carbs: number | null
          nutrition_fat: number | null
          nutrition_fiber: number | null
          tags: string[]
          rating: number
          review_count: number
          source_url: string | null
          author_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          image_url: string
          category: string
          cuisine: string
          difficulty: string
          prep_time: number
          cook_time: number
          servings: number
          nutrition_calories?: number | null
          nutrition_protein?: number | null
          nutrition_carbs?: number | null
          nutrition_fat?: number | null
          nutrition_fiber?: number | null
          tags?: string[]
          rating?: number
          review_count?: number
          source_url?: string | null
          author_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          image_url?: string
          category?: string
          cuisine?: string
          difficulty?: string
          prep_time?: number
          cook_time?: number
          servings?: number
          nutrition_calories?: number | null
          nutrition_protein?: number | null
          nutrition_carbs?: number | null
          nutrition_fat?: number | null
          nutrition_fiber?: number | null
          tags?: string[]
          rating?: number
          review_count?: number
          source_url?: string | null
          author_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          name: string
          amount: string
          unit: string
          order_index: number
        }
        Insert: {
          id?: string
          recipe_id: string
          name: string
          amount: string
          unit: string
          order_index: number
        }
        Update: {
          id?: string
          recipe_id?: string
          name?: string
          amount?: string
          unit?: string
          order_index?: number
        }
      }
      recipe_steps: {
        Row: {
          id: string
          recipe_id: string
          order_index: number
          instruction: string
          duration: number | null
          tip: string | null
        }
        Insert: {
          id?: string
          recipe_id: string
          order_index: number
          instruction: string
          duration?: number | null
          tip?: string | null
        }
        Update: {
          id?: string
          recipe_id?: string
          order_index?: number
          instruction?: string
          duration?: number | null
          tip?: string | null
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          recipe_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipe_id?: string
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          recipe_id: string
          user_id: string
          rating: number
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          user_id: string
          rating: number
          comment: string
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          user_id?: string
          rating?: number
          comment?: string
          created_at?: string
        }
      }
      shopping_list_items: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: string
          unit: string
          recipe_id: string | null
          recipe_name: string | null
          is_checked: boolean
          added_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          amount: string
          unit: string
          recipe_id?: string | null
          recipe_name?: string | null
          is_checked?: boolean
          added_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          amount?: string
          unit?: string
          recipe_id?: string | null
          recipe_name?: string | null
          is_checked?: boolean
          added_at?: string
        }
      }
      meal_plan_entries: {
        Row: {
          id: string
          user_id: string
          date: string
          meal_type: string
          recipe_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          meal_type: string
          recipe_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          meal_type?: string
          recipe_id?: string
          created_at?: string
        }
      }
      shared_recipes: {
        Row: {
          id: string
          recipe_id: string
          from_user_id: string
          to_user_id: string
          message: string | null
          shared_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          from_user_id: string
          to_user_id: string
          message?: string | null
          shared_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          from_user_id?: string
          to_user_id?: string
          message?: string | null
          shared_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          dietary_restrictions: string[]
          allergies: string[]
          cuisine_preferences: string[]
          skill_level: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          dietary_restrictions?: string[]
          allergies?: string[]
          cuisine_preferences?: string[]
          skill_level?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          dietary_restrictions?: string[]
          allergies?: string[]
          cuisine_preferences?: string[]
          skill_level?: string
          updated_at?: string
        }
      }
      recently_viewed: {
        Row: {
          id: string
          user_id: string
          recipe_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipe_id?: string
          viewed_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
