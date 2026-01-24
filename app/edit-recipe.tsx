import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Plus, Trash2, Camera, ImageIcon } from 'lucide-react-native';
import Colors, { Spacing, Typography, BorderRadius } from '@/constants/colors';
import { useRecipes } from '@/contexts/RecipeContext';
import Button from '@/components/Button';
import { Ingredient, Step, RecipeCategory } from '@/types/recipe';

const CATEGORIES: { value: RecipeCategory; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'snack', label: 'Snack' },
  { value: 'beverage', label: 'Beverage' },
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getRecipeById, updateRecipe, isCustomRecipe } = useRecipes();

  const recipe = getRecipeById(id || '');
  const canEdit = recipe && isCustomRecipe(recipe.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState<RecipeCategory>('dinner');
  const [cuisine, setCuisine] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title);
      setDescription(recipe.description);
      setImageUrl(recipe.imageUrl);
      setCategory(recipe.category);
      setCuisine(recipe.cuisine);
      setDifficulty(recipe.difficulty);
      setPrepTime(recipe.prepTime.toString());
      setCookTime(recipe.cookTime.toString());
      setServings(recipe.servings.toString());
      setIngredients([...recipe.ingredients]);
      setSteps([...recipe.steps]);
      setTags([...recipe.tags]);
    }
  }, [recipe]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a recipe title');
      return;
    }

    if (ingredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return;
    }

    if (steps.length === 0) {
      Alert.alert('Error', 'Please add at least one step');
      return;
    }

    updateRecipe(id!, {
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800',
      category,
      cuisine: cuisine.trim() || 'International',
      difficulty,
      prepTime: parseInt(prepTime) || 10,
      cookTime: parseInt(cookTime) || 20,
      servings: parseInt(servings) || 4,
      ingredients: ingredients.filter((ing) => ing.name.trim()),
      steps: steps.filter((step) => step.instruction.trim()).map((step, index) => ({
        ...step,
        order: index + 1,
      })),
      tags: tags.filter((tag) => tag.trim()),
    });

    router.back();
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: Date.now().toString(), name: '', amount: '', unit: '' },
    ]);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addStep = () => {
    setSteps([
      ...steps,
      { id: Date.now().toString(), order: steps.length + 1, instruction: '' },
    ]);
  };

  const updateStep = (index: number, instruction: string) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], instruction };
    setSteps(updated);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim().toLowerCase())) {
      setTags([...tags, newTag.trim().toLowerCase()]);
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  if (!recipe || !canEdit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {!recipe ? 'Recipe not found' : 'This recipe cannot be edited'}
          </Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Recipe</Text>
          <Pressable onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Info</Text>
            
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Recipe title"
              placeholderTextColor={Colors.textLight}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description"
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Recipe Image</Text>
            {imageUrl ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
                <View style={styles.imageOverlay}>
                  <Pressable
                    style={styles.imageActionButton}
                    onPress={async () => {
                      const { status } = await ImagePicker.requestCameraPermissionsAsync();
                      if (status !== 'granted') {
                        Alert.alert('Permission needed', 'Camera permission is required to take photos');
                        return;
                      }
                      const result = await ImagePicker.launchCameraAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 0.8,
                      });
                      if (!result.canceled && result.assets[0]) {
                        setImageUrl(result.assets[0].uri);
                      }
                    }}
                  >
                    <Camera size={20} color={Colors.textOnPrimary} />
                    <Text style={styles.imageActionText}>Camera</Text>
                  </Pressable>
                  <Pressable
                    style={styles.imageActionButton}
                    onPress={async () => {
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 0.8,
                      });
                      if (!result.canceled && result.assets[0]) {
                        setImageUrl(result.assets[0].uri);
                      }
                    }}
                  >
                    <ImageIcon size={20} color={Colors.textOnPrimary} />
                    <Text style={styles.imageActionText}>Gallery</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.noImageContainer}>
                <View style={styles.imageButtonsRow}>
                  <Pressable
                    style={styles.pickImageButton}
                    onPress={async () => {
                      const { status } = await ImagePicker.requestCameraPermissionsAsync();
                      if (status !== 'granted') {
                        Alert.alert('Permission needed', 'Camera permission is required to take photos');
                        return;
                      }
                      const result = await ImagePicker.launchCameraAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 0.8,
                      });
                      if (!result.canceled && result.assets[0]) {
                        setImageUrl(result.assets[0].uri);
                      }
                    }}
                  >
                    <Camera size={24} color={Colors.primary} />
                    <Text style={styles.pickImageText}>Take Photo</Text>
                  </Pressable>
                  <Pressable
                    style={styles.pickImageButton}
                    onPress={async () => {
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 0.8,
                      });
                      if (!result.canceled && result.assets[0]) {
                        setImageUrl(result.assets[0].uri);
                      }
                    }}
                  >
                    <ImageIcon size={24} color={Colors.primary} />
                    <Text style={styles.pickImageText}>From Gallery</Text>
                  </Pressable>
                </View>
              </View>
            )}
            <Text style={styles.label}>Or enter URL</Text>
            <TextInput
              style={styles.input}
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Cuisine</Text>
            <TextInput
              style={styles.input}
              value={cuisine}
              onChangeText={setCuisine}
              placeholder="e.g., Italian, Mexican, Asian"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.value}
                  style={[styles.chip, category === cat.value && styles.chipActive]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Text
                    style={[styles.chipText, category === cat.value && styles.chipTextActive]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Difficulty</Text>
            <View style={styles.chipRow}>
              {DIFFICULTIES.map((diff) => (
                <Pressable
                  key={diff}
                  style={[styles.chip, difficulty === diff && styles.chipActive]}
                  onPress={() => setDifficulty(diff)}
                >
                  <Text
                    style={[styles.chipText, difficulty === diff && styles.chipTextActive]}
                  >
                    {diff}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time & Servings</Text>
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Prep (min)</Text>
                <TextInput
                  style={styles.input}
                  value={prepTime}
                  onChangeText={setPrepTime}
                  placeholder="10"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Cook (min)</Text>
                <TextInput
                  style={styles.input}
                  value={cookTime}
                  onChangeText={setCookTime}
                  placeholder="20"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Servings</Text>
                <TextInput
                  style={styles.input}
                  value={servings}
                  onChangeText={setServings}
                  placeholder="4"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <Pressable onPress={addIngredient} style={styles.addButton}>
                <Plus size={18} color={Colors.primary} />
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>
            {ingredients.map((ingredient, index) => (
              <View key={ingredient.id} style={styles.ingredientRow}>
                <View style={styles.ingredientInputs}>
                  <TextInput
                    style={[styles.input, styles.amountInput]}
                    value={ingredient.amount}
                    onChangeText={(v) => updateIngredient(index, 'amount', v)}
                    placeholder="Amt"
                    placeholderTextColor={Colors.textLight}
                  />
                  <TextInput
                    style={[styles.input, styles.unitInput]}
                    value={ingredient.unit}
                    onChangeText={(v) => updateIngredient(index, 'unit', v)}
                    placeholder="Unit"
                    placeholderTextColor={Colors.textLight}
                  />
                  <TextInput
                    style={[styles.input, styles.nameInput]}
                    value={ingredient.name}
                    onChangeText={(v) => updateIngredient(index, 'name', v)}
                    placeholder="Ingredient name"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>
                <Pressable onPress={() => removeIngredient(index)} style={styles.removeButton}>
                  <Trash2 size={18} color={Colors.error} />
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              <Pressable onPress={addStep} style={styles.addButton}>
                <Plus size={18} color={Colors.primary} />
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>
            {steps.map((step, index) => (
              <View key={step.id} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.stepInput]}
                  value={step.instruction}
                  onChangeText={(v) => updateStep(index, v)}
                  placeholder="Describe this step..."
                  placeholderTextColor={Colors.textLight}
                  multiline
                />
                <Pressable onPress={() => removeStep(index)} style={styles.removeButton}>
                  <Trash2 size={18} color={Colors.error} />
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagInputRow}>
              <TextInput
                style={[styles.input, styles.tagInput]}
                value={newTag}
                onChangeText={setNewTag}
                placeholder="Add a tag"
                placeholderTextColor={Colors.textLight}
                onSubmitEditing={addTag}
              />
              <Pressable onPress={addTag} style={styles.addTagButton}>
                <Plus size={20} color={Colors.textOnPrimary} />
              </Pressable>
            </View>
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                  <Pressable onPress={() => removeTag(index)} style={styles.tagRemove}>
                    <X size={14} color={Colors.textSecondary} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center' as const,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  saveButtonText: {
    ...Typography.label,
    color: Colors.textOnPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  imagePreviewContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  imageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.md,
  },
  imageActionText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontWeight: '600' as const,
  },
  noImageContainer: {
    marginBottom: Spacing.sm,
  },
  imageButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  pickImageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
  },
  pickImageText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textOnPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  rowItem: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  addButtonText: {
    ...Typography.label,
    color: Colors.primary,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  ingredientInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  amountInput: {
    width: 60,
  },
  unitInput: {
    width: 70,
  },
  nameInput: {
    flex: 1,
  },
  removeButton: {
    padding: Spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  stepNumberText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontWeight: '700' as const,
  },
  stepInput: {
    flex: 1,
    minHeight: 60,
    textAlignVertical: 'top' as const,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  tagText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  tagRemove: {
    padding: Spacing.xs,
  },
  bottomPadding: {
    height: Spacing.xxxl * 2,
  },
});
