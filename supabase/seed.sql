-- =============================================
-- CULINARIA SEED DATA
-- =============================================
-- Run this AFTER creating test users in Supabase Auth
-- 
-- TEST USER CREDENTIALS:
-- =============================================
-- Email: maria@test.com | Password: Test123! | Username: chef_maria
-- Email: james@test.com | Password: Test123! | Username: healthy_james
-- Email: sophie@test.com | Password: Test123! | Username: baking_sophie
-- Email: raj@test.com | Password: Test123! | Username: spice_master
-- Email: emma@test.com | Password: Test123! | Username: vegan_emma
-- Email: mike@test.com | Password: Test123! | Username: grillmaster_mike
-- Email: isabella@test.com | Password: Test123! | Username: pasta_queen
-- Email: tom@test.com | Password: Test123! | Username: quick_bites_tom
-- Email: lin@test.com | Password: Test123! | Username: asian_fusion_lin
-- Email: alex@test.com | Password: Test123! | Username: comfort_food_alex
-- =============================================

-- First, create the test users in Supabase Auth Dashboard or via API
-- Then run this script to populate the database

-- =============================================
-- STEP 1: Create users in auth.users first via Supabase Dashboard
-- Go to Authentication > Users > Add User
-- Create each user with the emails and passwords above
-- =============================================

-- =============================================
-- STEP 2: After creating auth users, update the public.users table
-- The trigger should auto-create entries, but we need to update them
-- =============================================

-- Note: Replace the UUIDs below with actual UUIDs from your auth.users table
-- You can find these in the Supabase Dashboard under Authentication > Users

-- For convenience, here's a script that updates users based on email
-- Run this after creating the auth users:

UPDATE public.users SET
  username = 'chef_maria',
  display_name = 'Maria Santos',
  avatar_url = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  bio = 'Professional chef & cookbook author. Sharing my passion for Mediterranean cuisine 🍝',
  is_verified = true
WHERE email = 'maria@test.com';

UPDATE public.users SET
  username = 'healthy_james',
  display_name = 'James Chen',
  avatar_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  bio = 'Fitness enthusiast | Meal prep expert | Healthy eating made simple 💪',
  is_verified = true
WHERE email = 'james@test.com';

UPDATE public.users SET
  username = 'baking_sophie',
  display_name = 'Sophie Williams',
  avatar_url = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
  bio = 'Baker & dessert lover 🧁 From rustic breads to elegant pastries',
  is_verified = true
WHERE email = 'sophie@test.com';

UPDATE public.users SET
  username = 'spice_master',
  display_name = 'Raj Patel',
  avatar_url = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
  bio = 'Indian cuisine specialist | Spice merchant | Food photographer 📸',
  is_verified = true
WHERE email = 'raj@test.com';

UPDATE public.users SET
  username = 'vegan_emma',
  display_name = 'Emma Green',
  avatar_url = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
  bio = 'Plant-based recipes that everyone will love 🌱 Making vegan cooking accessible',
  is_verified = true
WHERE email = 'emma@test.com';

UPDATE public.users SET
  username = 'grillmaster_mike',
  display_name = 'Mike Johnson',
  avatar_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
  bio = 'BBQ champion | Pitmaster | Weekend warrior on the grill 🔥',
  is_verified = false
WHERE email = 'mike@test.com';

UPDATE public.users SET
  username = 'pasta_queen',
  display_name = 'Isabella Romano',
  avatar_url = 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop',
  bio = 'Italian nonna recipes passed down generations 🇮🇹 Authentic pasta & more',
  is_verified = true
WHERE email = 'isabella@test.com';

UPDATE public.users SET
  username = 'quick_bites_tom',
  display_name = 'Tom Anderson',
  avatar_url = 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&h=200&fit=crop',
  bio = 'Busy parent | 30-minute meals | Making dinner stress-free ⏱️',
  is_verified = false
WHERE email = 'tom@test.com';

UPDATE public.users SET
  username = 'asian_fusion_lin',
  display_name = 'Lin Wei',
  avatar_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
  bio = 'Blending Eastern & Western flavors | Culinary school graduate 🍜',
  is_verified = true
WHERE email = 'lin@test.com';

UPDATE public.users SET
  username = 'comfort_food_alex',
  display_name = 'Alex Thompson',
  avatar_url = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
  bio = 'Soul food & Southern comfort | Recipes that warm the heart ❤️',
  is_verified = false
WHERE email = 'alex@test.com';

-- =============================================
-- STEP 3: Insert Recipes
-- =============================================
-- Note: These use subqueries to get the user IDs from email

-- Recipe 1: Creamy Tuscan Garlic Chicken (by Maria)
INSERT INTO public.recipes (
  title, description, image_url, category, cuisine, difficulty,
  prep_time, cook_time, servings, nutrition_calories, nutrition_protein,
  nutrition_carbs, nutrition_fat, tags, rating, review_count, author_id
)
SELECT
  'Creamy Tuscan Garlic Chicken',
  'A rich and creamy Italian-inspired dish with sun-dried tomatoes and spinach.',
  'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800',
  'dinner', 'Italian', 'Medium',
  15, 30, 4, 420, 38, 8, 26,
  ARRAY['creamy', 'italian', 'chicken', 'quick dinner'],
  4.8, 234, id
FROM public.users WHERE email = 'maria@test.com';

-- Recipe 2: Avocado Toast with Poached Eggs (by James)
INSERT INTO public.recipes (
  title, description, image_url, category, cuisine, difficulty,
  prep_time, cook_time, servings, nutrition_calories, nutrition_protein,
  nutrition_carbs, nutrition_fat, tags, rating, review_count, author_id
)
SELECT
  'Avocado Toast with Poached Eggs',
  'A classic healthy breakfast with perfectly poached eggs on creamy avocado toast.',
  'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800',
  'breakfast', 'American', 'Easy',
  5, 10, 2, 320, 14, 28, 18,
  ARRAY['healthy', 'breakfast', 'quick', 'vegetarian'],
  4.6, 189, id
FROM public.users WHERE email = 'james@test.com';

-- Recipe 3: Thai Green Curry (by Lin)
INSERT INTO public.recipes (
  title, description, image_url, category, cuisine, difficulty,
  prep_time, cook_time, servings, nutrition_calories, nutrition_protein,
  nutrition_carbs, nutrition_fat, tags, rating, review_count, author_id
)
SELECT
  'Thai Green Curry',
  'Aromatic and spicy Thai curry with tender vegetables and creamy coconut milk.',
  'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800',
  'dinner', 'Thai', 'Medium',
  20, 25, 4, 480, 32, 18, 34,
  ARRAY['spicy', 'thai', 'curry', 'coconut'],
  4.9, 312, id
FROM public.users WHERE email = 'lin@test.com';

-- Recipe 4: Classic Tiramisu (by Sophie)
INSERT INTO public.recipes (
  title, description, image_url, category, cuisine, difficulty,
  prep_time, cook_time, servings, nutrition_calories, nutrition_protein,
  nutrition_carbs, nutrition_fat, tags, rating, review_count, author_id
)
SELECT
  'Classic Tiramisu',
  'Layers of coffee-soaked ladyfingers and mascarpone cream dusted with cocoa.',
  'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800',
  'dessert', 'Italian', 'Medium',
  30, 0, 8, 380, 8, 42, 20,
  ARRAY['dessert', 'italian', 'coffee', 'no-bake'],
  4.9, 456, id
FROM public.users WHERE email = 'sophie@test.com';

-- Recipe 5: Fresh Mango Smoothie Bowl (by Emma)
INSERT INTO public.recipes (
  title, description, image_url, category, cuisine, difficulty,
  prep_time, cook_time, servings, nutrition_calories, nutrition_protein,
  nutrition_carbs, nutrition_fat, tags, rating, review_count, author_id
)
SELECT
  'Fresh Mango Smoothie Bowl',
  'A refreshing tropical smoothie bowl topped with fresh fruits and granola.',
  'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800',
  'breakfast', 'Tropical', 'Easy',
  10, 0, 1, 340, 12, 62, 8,
  ARRAY['healthy', 'tropical', 'quick', 'vegan-option'],
  4.7, 145, id
FROM public.users WHERE email = 'emma@test.com';

-- Recipe 6: Crispy Korean Fried Chicken (by Lin)
INSERT INTO public.recipes (
  title, description, image_url, category, cuisine, difficulty,
  prep_time, cook_time, servings, nutrition_calories, nutrition_protein,
  nutrition_carbs, nutrition_fat, tags, rating, review_count, author_id
)
SELECT
  'Crispy Korean Fried Chicken',
  'Double-fried chicken coated in a sweet and spicy gochujang glaze.',
  'https://images.unsplash.com/photo-1575932444877-5106bee2a599?w=800',
  'dinner', 'Korean', 'Hard',
  30, 45, 4, 520, 42, 28, 26,
  ARRAY['korean', 'fried', 'spicy', 'crispy'],
  4.9, 567, id
FROM public.users WHERE email = 'lin@test.com';

-- Recipe 7: Mediterranean Quinoa Salad (by Emma)
INSERT INTO public.recipes (
  title, description, image_url, category, cuisine, difficulty,
  prep_time, cook_time, servings, nutrition_calories, nutrition_protein,
  nutrition_carbs, nutrition_fat, tags, rating, review_count, author_id
)
SELECT
  'Mediterranean Quinoa Salad',
  'A light and nutritious salad with quinoa, feta, olives, and fresh vegetables.',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
  'lunch', 'Mediterranean', 'Easy',
  15, 15, 4, 280, 12, 32, 14,
  ARRAY['healthy', 'vegetarian', 'meal-prep', 'light'],
  4.6, 234, id
FROM public.users WHERE email = 'emma@test.com';

-- Recipe 8: Homemade Matcha Latte (by Lin)
INSERT INTO public.recipes (
  title, description, image_url, category, cuisine, difficulty,
  prep_time, cook_time, servings, nutrition_calories, nutrition_protein,
  nutrition_carbs, nutrition_fat, tags, rating, review_count, author_id
)
SELECT
  'Homemade Matcha Latte',
  'A creamy and earthy Japanese-inspired matcha latte with frothy milk.',
  'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800',
  'beverage', 'Japanese', 'Easy',
  5, 0, 1, 120, 4, 18, 4,
  ARRAY['japanese', 'healthy', 'caffeine', 'quick'],
  4.5, 189, id
FROM public.users WHERE email = 'lin@test.com';

-- =============================================
-- STEP 4: Insert Recipe Ingredients
-- =============================================

-- Ingredients for Recipe 1: Creamy Tuscan Garlic Chicken
INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Chicken breast', '4', 'pieces', 0
FROM public.recipes r WHERE r.title = 'Creamy Tuscan Garlic Chicken';

INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Heavy cream', '1', 'cup', 1
FROM public.recipes r WHERE r.title = 'Creamy Tuscan Garlic Chicken';

INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Parmesan cheese', '1/2', 'cup', 2
FROM public.recipes r WHERE r.title = 'Creamy Tuscan Garlic Chicken';

INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Sun-dried tomatoes', '1/2', 'cup', 3
FROM public.recipes r WHERE r.title = 'Creamy Tuscan Garlic Chicken';

INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Spinach', '2', 'cups', 4
FROM public.recipes r WHERE r.title = 'Creamy Tuscan Garlic Chicken';

INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Garlic', '4', 'cloves', 5
FROM public.recipes r WHERE r.title = 'Creamy Tuscan Garlic Chicken';

-- Ingredients for Recipe 2: Avocado Toast
INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Sourdough bread', '2', 'slices', 0
FROM public.recipes r WHERE r.title = 'Avocado Toast with Poached Eggs';

INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Ripe avocado', '1', 'whole', 1
FROM public.recipes r WHERE r.title = 'Avocado Toast with Poached Eggs';

INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Eggs', '2', 'large', 2
FROM public.recipes r WHERE r.title = 'Avocado Toast with Poached Eggs';

INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Lemon juice', '1', 'tsp', 3
FROM public.recipes r WHERE r.title = 'Avocado Toast with Poached Eggs';

INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Red pepper flakes', '1/4', 'tsp', 4
FROM public.recipes r WHERE r.title = 'Avocado Toast with Poached Eggs';

-- Ingredients for Recipe 3: Thai Green Curry
INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Green curry paste', '3', 'tbsp', 0
FROM public.recipes r WHERE r.title = 'Thai Green Curry';

INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Coconut milk', '2', 'cans', 1
FROM public.recipes r WHERE r.title = 'Thai Green Curry';

INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Chicken thighs', '1', 'lb', 2
FROM public.recipes r WHERE r.title = 'Thai Green Curry';

INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Thai basil', '1', 'cup', 3
FROM public.recipes r WHERE r.title = 'Thai Green Curry';

INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Bamboo shoots', '1', 'cup', 4
FROM public.recipes r WHERE r.title = 'Thai Green Curry';

INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Bell peppers', '2', 'whole', 5
FROM public.recipes r WHERE r.title = 'Thai Green Curry';

-- Ingredients for Recipe 4: Classic Tiramisu
INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Mascarpone cheese', '500', 'g', 0
FROM public.recipes r WHERE r.title = 'Classic Tiramisu';

INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Ladyfinger biscuits', '300', 'g', 1
FROM public.recipes r WHERE r.title = 'Classic Tiramisu';

INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Strong espresso', '2', 'cups', 2
FROM public.recipes r WHERE r.title = 'Classic Tiramisu';

INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Egg yolks', '4', 'large', 3
FROM public.recipes r WHERE r.title = 'Classic Tiramisu';

INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Sugar', '100', 'g', 4
FROM public.recipes r WHERE r.title = 'Classic Tiramisu';

INSERT INTO public.recipe_ingredients (recipe_id, name, amount, unit, order_index)
SELECT r.id, 'Cocoa powder', '2', 'tbsp', 5
FROM public.recipes r WHERE r.title = 'Classic Tiramisu';

-- =============================================
-- STEP 5: Insert Recipe Steps
-- =============================================

-- Steps for Recipe 1: Creamy Tuscan Garlic Chicken
INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration)
SELECT r.id, 1, 'Season chicken breasts with salt and pepper.', 2
FROM public.recipes r WHERE r.title = 'Creamy Tuscan Garlic Chicken';

INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration)
SELECT r.id, 2, 'Heat oil in a large skillet over medium-high heat. Cook chicken 5-6 minutes per side until golden.', 12
FROM public.recipes r WHERE r.title = 'Creamy Tuscan Garlic Chicken';

INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration)
SELECT r.id, 3, 'Remove chicken and set aside. Add garlic to the pan and sauté for 1 minute.', 2
FROM public.recipes r WHERE r.title = 'Creamy Tuscan Garlic Chicken';

INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration)
SELECT r.id, 4, 'Add heavy cream, parmesan, and sun-dried tomatoes. Simmer for 5 minutes.', 5
FROM public.recipes r WHERE r.title = 'Creamy Tuscan Garlic Chicken';

INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration)
SELECT r.id, 5, 'Add spinach and cook until wilted. Return chicken to the pan and simmer for 5 more minutes.', 6
FROM public.recipes r WHERE r.title = 'Creamy Tuscan Garlic Chicken';

-- Steps for Recipe 2: Avocado Toast
INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration)
SELECT r.id, 1, 'Toast the sourdough bread until golden and crispy.', 3
FROM public.recipes r WHERE r.title = 'Avocado Toast with Poached Eggs';

INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration)
SELECT r.id, 2, 'Mash avocado with lemon juice, salt, and pepper.', 2
FROM public.recipes r WHERE r.title = 'Avocado Toast with Poached Eggs';

INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration, tip)
SELECT r.id, 3, 'Bring water to a gentle simmer. Create a vortex and slide in eggs. Poach for 3-4 minutes.', 4, 'Add a splash of vinegar to help the eggs hold their shape.'
FROM public.recipes r WHERE r.title = 'Avocado Toast with Poached Eggs';

INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration)
SELECT r.id, 4, 'Spread avocado on toast, top with poached eggs, and sprinkle with red pepper flakes.', 1
FROM public.recipes r WHERE r.title = 'Avocado Toast with Poached Eggs';

-- Steps for Recipe 3: Thai Green Curry
INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration)
SELECT r.id, 1, 'Heat a tablespoon of coconut cream in a wok over high heat.', 2
FROM public.recipes r WHERE r.title = 'Thai Green Curry';

INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration)
SELECT r.id, 2, 'Add curry paste and fry until fragrant, about 2 minutes.', 2
FROM public.recipes r WHERE r.title = 'Thai Green Curry';

INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration)
SELECT r.id, 3, 'Add chicken and cook until sealed on all sides.', 5
FROM public.recipes r WHERE r.title = 'Thai Green Curry';

INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration)
SELECT r.id, 4, 'Pour in coconut milk and bring to a simmer.', 3
FROM public.recipes r WHERE r.title = 'Thai Green Curry';

INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration)
SELECT r.id, 5, 'Add vegetables and cook for 10-12 minutes until tender.', 12
FROM public.recipes r WHERE r.title = 'Thai Green Curry';

INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration)
SELECT r.id, 6, 'Stir in Thai basil and serve with jasmine rice.', 1
FROM public.recipes r WHERE r.title = 'Thai Green Curry';

-- Steps for Recipe 4: Classic Tiramisu
INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration)
SELECT r.id, 1, 'Whisk egg yolks and sugar until pale and thick.', 5
FROM public.recipes r WHERE r.title = 'Classic Tiramisu';

INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration)
SELECT r.id, 2, 'Fold in mascarpone until smooth.', 3
FROM public.recipes r WHERE r.title = 'Classic Tiramisu';

INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration)
SELECT r.id, 3, 'Dip ladyfingers quickly in espresso and layer in a dish.', 10
FROM public.recipes r WHERE r.title = 'Classic Tiramisu';

INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration)
SELECT r.id, 4, 'Spread half the mascarpone mixture over the ladyfingers.', 3
FROM public.recipes r WHERE r.title = 'Classic Tiramisu';

INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration, tip)
SELECT r.id, 5, 'Repeat layers and refrigerate for at least 4 hours.', 240, 'Best made a day ahead for optimal flavor.'
FROM public.recipes r WHERE r.title = 'Classic Tiramisu';

INSERT INTO public.recipe_steps (recipe_id, order_index, instruction, duration)
SELECT r.id, 6, 'Dust generously with cocoa powder before serving.', 1
FROM public.recipes r WHERE r.title = 'Classic Tiramisu';

-- =============================================
-- STEP 6: Add some sample follows
-- =============================================
-- Maria follows James and Sophie
INSERT INTO public.follows (follower_id, following_id)
SELECT 
  (SELECT id FROM public.users WHERE email = 'maria@test.com'),
  (SELECT id FROM public.users WHERE email = 'james@test.com')
WHERE EXISTS (SELECT 1 FROM public.users WHERE email = 'maria@test.com')
  AND EXISTS (SELECT 1 FROM public.users WHERE email = 'james@test.com');

INSERT INTO public.follows (follower_id, following_id)
SELECT 
  (SELECT id FROM public.users WHERE email = 'maria@test.com'),
  (SELECT id FROM public.users WHERE email = 'sophie@test.com')
WHERE EXISTS (SELECT 1 FROM public.users WHERE email = 'maria@test.com')
  AND EXISTS (SELECT 1 FROM public.users WHERE email = 'sophie@test.com');

-- James follows Maria and Lin
INSERT INTO public.follows (follower_id, following_id)
SELECT 
  (SELECT id FROM public.users WHERE email = 'james@test.com'),
  (SELECT id FROM public.users WHERE email = 'maria@test.com')
WHERE EXISTS (SELECT 1 FROM public.users WHERE email = 'james@test.com')
  AND EXISTS (SELECT 1 FROM public.users WHERE email = 'maria@test.com');

INSERT INTO public.follows (follower_id, following_id)
SELECT 
  (SELECT id FROM public.users WHERE email = 'james@test.com'),
  (SELECT id FROM public.users WHERE email = 'lin@test.com')
WHERE EXISTS (SELECT 1 FROM public.users WHERE email = 'james@test.com')
  AND EXISTS (SELECT 1 FROM public.users WHERE email = 'lin@test.com');
