import React, { useState, useRef, useEffect, Component, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { 
  Camera, 
  X, 
  ImageIcon, 
  Check, 
  RotateCcw, 
  Sparkles,
  Clock,
  Users,
  ChefHat,
  Plus,
  Trash2,
  SwitchCamera,
} from 'lucide-react-native';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import Colors, { Spacing, Typography, BorderRadius } from '@/constants/colors';
import { useRecipes } from '@/contexts/RecipeContext';
import { RecipeCategory } from '@/types/recipe';

const RecipeSchema = z.object({
  title: z.string().describe('The title of the recipe'),
  description: z.string().describe('A brief description of the dish'),
  category: z.enum(['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'beverage']).describe('The category of the recipe'),
  cuisine: z.string().describe('The cuisine type (e.g., Italian, Mexican, etc.)'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('Difficulty level'),
  prepTime: z.number().describe('Preparation time in minutes'),
  cookTime: z.number().describe('Cooking time in minutes'),
  servings: z.number().describe('Number of servings'),
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.string(),
    unit: z.string(),
  })).describe('List of ingredients with amounts and units'),
  steps: z.array(z.object({
    instruction: z.string(),
    duration: z.number().optional(),
    tip: z.string().optional(),
  })).describe('Cooking steps/instructions'),
  tags: z.array(z.string()).describe('Relevant tags for the recipe'),
});

type ExtractedRecipe = z.infer<typeof RecipeSchema>;

type ScreenMode = 'camera' | 'preview' | 'extracting' | 'editing' | 'gallery';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class CameraErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log('Camera Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function CameraComponent({ cameraRef, facing, onCameraReady, children }: { cameraRef: React.RefObject<any>; facing: 'front' | 'back'; onCameraReady?: () => void; children: ReactNode }) {
  const [CameraViewComponent, setCameraViewComponent] = useState<any>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const loadCamera = async () => {
      try {
        console.log('Loading expo-camera module...');
        const cameraModule = await import('expo-camera');
        console.log('expo-camera module loaded, keys:', Object.keys(cameraModule));
        if (mounted && cameraModule.CameraView) {
          console.log('Setting CameraView component');
          setCameraViewComponent(() => cameraModule.CameraView);
          setIsLoading(false);
        } else if (mounted) {
          console.error('CameraView not found in module');
          setCameraError('Camera component not available');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load camera module:', err);
        if (mounted) {
          setCameraError('Failed to load camera');
          setIsLoading(false);
        }
      }
    };

    loadCamera();
    return () => { mounted = false; };
  }, []);

  if (cameraError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff' }}>{cameraError}</Text>
      </View>
    );
  }

  if (isLoading || !CameraViewComponent) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ color: '#fff', marginTop: 16 }}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <CameraViewComponent 
      ref={cameraRef}
      style={{ flex: 1 }}
      facing={facing}
      onCameraReady={onCameraReady}
    >
      {children}
    </CameraViewComponent>
  );
}

export default function ScanRecipeScreen() {
  const router = useRouter();
  const { addRecipe } = useRecipes();
  const cameraRef = useRef<any>(null);
  
  const [permission, setPermission] = useState<{ granted: boolean } | null>(null);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [mode, setMode] = useState<ScreenMode>(Platform.OS === 'web' ? 'gallery' : 'camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('back');

  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    try {
      console.log('Taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });
      
      if (photo?.uri) {
        console.log('Picture taken:', photo.uri);
        setCapturedImage(photo.uri);
        setMode('preview');
        
        if (photo.base64) {
          extractRecipeFromImage(photo.base64);
        }
      }
    } catch (err) {
      console.error('Error taking picture:', err);
      setError('Failed to take picture. Please try again.');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('Image picked:', result.assets[0].uri);
        setCapturedImage(result.assets[0].uri);
        setMode('preview');
        
        if (result.assets[0].base64) {
          extractRecipeFromImage(result.assets[0].base64);
        }
      }
    } catch (err) {
      console.error('Error picking image:', err);
      setError('Failed to pick image. Please try again.');
    }
  };

  const extractRecipeFromImage = async (base64Image: string) => {
    setMode('extracting');
    setError(null);
    
    try {
      console.log('Extracting recipe from image...');
      
      const result = await generateObject({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this image of a recipe and extract all the recipe information. If the image shows a recipe card, cookbook page, or handwritten recipe, extract the title, description, ingredients with amounts, cooking steps, estimated times, and other relevant details. If you cannot clearly see a recipe, make reasonable inferences based on any food or cooking-related content visible. Provide realistic estimates for times and servings if not explicitly shown. IMPORTANT: Always use abbreviated measurement units (e.g., "Tbsp" instead of "Tablespoon", "tsp" instead of "teaspoon", "oz" instead of "ounce", "lb" instead of "pound", "cup" instead of "cups", "ml" instead of "milliliter", "g" instead of "gram", "kg" instead of "kilogram").',
              },
              {
                type: 'image',
                image: `data:image/jpeg;base64,${base64Image}`,
              },
            ],
          },
        ],
        schema: RecipeSchema,
      });

      console.log('Recipe extracted:', result);
      setExtractedRecipe(result);
      setMode('editing');
    } catch (err) {
      console.error('Error extracting recipe:', err);
      setError('Failed to extract recipe from image. Please try again or use a clearer image.');
      setMode('preview');
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveRecipe = async () => {
    if (!extractedRecipe || isSaving) return;

    setIsSaving(true);
    
    const recipeData = {
      title: extractedRecipe.title,
      description: extractedRecipe.description,
      imageUrl: capturedImage || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800',
      category: extractedRecipe.category as RecipeCategory,
      cuisine: extractedRecipe.cuisine,
      difficulty: extractedRecipe.difficulty,
      prepTime: extractedRecipe.prepTime,
      cookTime: extractedRecipe.cookTime,
      servings: extractedRecipe.servings,
      ingredients: extractedRecipe.ingredients.map((ing, idx) => ({
        id: `ing-${idx}`,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
      })),
      steps: extractedRecipe.steps.map((step, idx) => ({
        id: `step-${idx}`,
        order: idx + 1,
        instruction: step.instruction,
        duration: step.duration,
        tip: step.tip,
      })),
      tags: extractedRecipe.tags,
    };

    try {
      console.log('Saving recipe:', recipeData);
      const savedRecipe = await addRecipe(recipeData);
      const recipeId = (savedRecipe as any)?.id;
      
      console.log('Recipe saved with ID:', recipeId);
      
      Alert.alert(
        'Recipe Saved!',
        `"${extractedRecipe.title}" has been added to your recipes.`,
        [
          {
            text: 'View Recipe',
            onPress: () => {
              if (recipeId) {
                router.replace(`/recipe/${recipeId}`);
              } else {
                router.back();
              }
            },
          },
          {
            text: 'Done',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err) {
      console.error('Error saving recipe:', err);
      Alert.alert('Error', 'Failed to save recipe. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setExtractedRecipe(null);
    setError(null);
    setMode('camera');
  };

  const updateRecipeField = (field: keyof ExtractedRecipe, value: unknown) => {
    if (!extractedRecipe) return;
    setExtractedRecipe({ ...extractedRecipe, [field]: value });
  };

  const updateIngredient = (index: number, field: string, value: string) => {
    if (!extractedRecipe) return;
    const newIngredients = [...extractedRecipe.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setExtractedRecipe({ ...extractedRecipe, ingredients: newIngredients });
  };

  const addIngredient = () => {
    if (!extractedRecipe) return;
    setExtractedRecipe({
      ...extractedRecipe,
      ingredients: [...extractedRecipe.ingredients, { name: '', amount: '', unit: '' }],
    });
  };

  const removeIngredient = (index: number) => {
    if (!extractedRecipe) return;
    const newIngredients = extractedRecipe.ingredients.filter((_, i) => i !== index);
    setExtractedRecipe({ ...extractedRecipe, ingredients: newIngredients });
  };

  const updateStep = (index: number, instruction: string) => {
    if (!extractedRecipe) return;
    const newSteps = [...extractedRecipe.steps];
    newSteps[index] = { ...newSteps[index], instruction };
    setExtractedRecipe({ ...extractedRecipe, steps: newSteps });
  };

  const addStep = () => {
    if (!extractedRecipe) return;
    setExtractedRecipe({
      ...extractedRecipe,
      steps: [...extractedRecipe.steps, { instruction: '' }],
    });
  };

  const removeStep = (index: number) => {
    if (!extractedRecipe) return;
    const newSteps = extractedRecipe.steps.filter((_, i) => i !== index);
    setExtractedRecipe({ ...extractedRecipe, steps: newSteps });
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  useEffect(() => {
    if (Platform.OS !== 'web' && !permission && !permissionRequested) {
      setPermissionRequested(true);
      
      const requestCameraPermission = async () => {
        try {
          console.log('Requesting camera permission...');
          const cameraModule: any = await import('expo-camera');
          console.log('Camera module loaded for permissions');
          
          let status;
          if (cameraModule.CameraNativeModule?.requestCameraPermissionsAsync) {
            status = await cameraModule.CameraNativeModule.requestCameraPermissionsAsync();
          } else if (cameraModule.Camera?.requestCameraPermissionsAsync) {
            status = await cameraModule.Camera.requestCameraPermissionsAsync();
          } else if (cameraModule.requestCameraPermissionsAsync) {
            status = await cameraModule.requestCameraPermissionsAsync();
          } else {
            console.log('No permission function found, defaulting to gallery mode');
            setMode('gallery');
            setPermission({ granted: false });
            return;
          }
          
          console.log('Camera permission status:', status);
          setPermission({ granted: status?.granted ?? false });
        } catch (err) {
          console.error('Failed to request camera permission:', err);
          setMode('gallery');
          setPermission({ granted: false });
        }
      };
      
      requestCameraPermission();
    }
  }, [permission, permissionRequested]);

  if (Platform.OS === 'web' || mode === 'gallery') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.galleryModeContainer}>
          <View style={styles.galleryHeader}>
            <Pressable style={styles.closeButton} onPress={() => router.back()}>
              <X size={24} color={Colors.text} />
            </Pressable>
            <Text style={styles.galleryTitle}>Add Recipe from Image</Text>
            <View style={{ width: 44 }} />
          </View>
          
          <View style={styles.galleryContent}>
            <View style={styles.galleryIconContainer}>
              <ImageIcon size={64} color={Colors.primary} />
            </View>
            <Text style={styles.galleryMainText}>Select a Recipe Image</Text>
            <Text style={styles.gallerySubText}>
              Choose an image of a recipe from your gallery and our AI will extract all the details
            </Text>
            <Pressable style={styles.pickImageButton} onPress={pickImage}>
              <ImageIcon size={24} color={Colors.textOnPrimary} />
              <Text style={styles.pickImageText}>Choose from Gallery</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera size={64} color={Colors.textSecondary} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan recipes from photos
          </Text>
          <Pressable style={styles.permissionButton} onPress={() => {
              setPermissionRequested(false);
              setPermission(null);
            }}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
          <Pressable style={styles.galleryButton} onPress={pickImage}>
            <ImageIcon size={20} color={Colors.primary} />
            <Text style={styles.galleryButtonText}>Pick from Gallery</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'extracting') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.extractingContainer}>
          <View style={styles.extractingAnimation}>
            <Sparkles size={48} color={Colors.primary} />
          </View>
          <Text style={styles.extractingTitle}>Analyzing Recipe...</Text>
          <Text style={styles.extractingText}>
            Our AI is reading the recipe from your image
          </Text>
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'editing' && extractedRecipe) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.editHeader}>
          <Pressable style={styles.headerButton} onPress={handleRetake}>
            <RotateCcw size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.editHeaderTitle}>Edit Recipe</Text>
          <Pressable style={styles.saveButton} onPress={handleSaveRecipe}>
            <Check size={24} color={Colors.textOnPrimary} />
          </Pressable>
        </View>

        <ScrollView 
          style={styles.editScrollView}
          contentContainerStyle={styles.editContent}
          showsVerticalScrollIndicator={false}
        >
          {capturedImage ? (
            <View style={styles.imageEditContainer}>
              <Image source={{ uri: capturedImage }} style={styles.previewImage} />
              <View style={styles.imageEditOverlay}>
                <Pressable
                  style={styles.imageEditButton}
                  onPress={async () => {
                    try {
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
                        setCapturedImage(result.assets[0].uri);
                      }
                    } catch (err) {
                      console.error('Error taking photo:', err);
                    }
                  }}
                >
                  <Camera size={20} color={Colors.textOnPrimary} />
                  <Text style={styles.imageEditButtonText}>Camera</Text>
                </Pressable>
                <Pressable
                  style={styles.imageEditButton}
                  onPress={async () => {
                    try {
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 0.8,
                      });
                      if (!result.canceled && result.assets[0]) {
                        setCapturedImage(result.assets[0].uri);
                      }
                    } catch (err) {
                      console.error('Error picking image:', err);
                    }
                  }}
                >
                  <ImageIcon size={20} color={Colors.textOnPrimary} />
                  <Text style={styles.imageEditButtonText}>Gallery</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.noImageContainer}>
              <Pressable
                style={styles.addImageButton}
                onPress={async () => {
                  try {
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      allowsEditing: true,
                      aspect: [4, 3],
                      quality: 0.8,
                    });
                    if (!result.canceled && result.assets[0]) {
                      setCapturedImage(result.assets[0].uri);
                    }
                  } catch (err) {
                    console.error('Error picking image:', err);
                  }
                }}
              >
                <ImageIcon size={32} color={Colors.primary} />
                <Text style={styles.addImageText}>Add Recipe Image</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={extractedRecipe.title}
              onChangeText={(text) => updateRecipeField('title', text)}
              placeholder="Recipe title"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={extractedRecipe.description}
              onChangeText={(text) => updateRecipeField('description', text)}
              placeholder="Brief description"
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Text style={styles.formLabel}>Cuisine</Text>
              <TextInput
                style={styles.input}
                value={extractedRecipe.cuisine}
                onChangeText={(text) => updateRecipeField('cuisine', text)}
                placeholder="e.g., Italian"
                placeholderTextColor={Colors.textLight}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.formLabel}>Difficulty</Text>
              <View style={styles.difficultyRow}>
                {(['Easy', 'Medium', 'Hard'] as const).map((diff) => (
                  <Pressable
                    key={diff}
                    style={[
                      styles.difficultyChip,
                      extractedRecipe.difficulty === diff && styles.difficultyChipActive,
                    ]}
                    onPress={() => updateRecipeField('difficulty', diff)}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        extractedRecipe.difficulty === diff && styles.difficultyTextActive,
                      ]}
                    >
                      {diff}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <View style={styles.timeIcon}>
                <Clock size={16} color={Colors.primary} />
              </View>
              <Text style={styles.timeLabel}>Prep</Text>
              <TextInput
                style={styles.timeField}
                value={String(extractedRecipe.prepTime)}
                onChangeText={(text) => updateRecipeField('prepTime', parseInt(text) || 0)}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={Colors.textLight}
              />
              <Text style={styles.timeUnit}>min</Text>
            </View>
            <View style={styles.timeInput}>
              <View style={styles.timeIcon}>
                <ChefHat size={16} color={Colors.secondary} />
              </View>
              <Text style={styles.timeLabel}>Cook</Text>
              <TextInput
                style={styles.timeField}
                value={String(extractedRecipe.cookTime)}
                onChangeText={(text) => updateRecipeField('cookTime', parseInt(text) || 0)}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={Colors.textLight}
              />
              <Text style={styles.timeUnit}>min</Text>
            </View>
            <View style={styles.timeInput}>
              <View style={styles.timeIcon}>
                <Users size={16} color={Colors.accent} />
              </View>
              <Text style={styles.timeLabel}>Serves</Text>
              <TextInput
                style={styles.timeField}
                value={String(extractedRecipe.servings)}
                onChangeText={(text) => updateRecipeField('servings', parseInt(text) || 1)}
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.formLabel}>Ingredients</Text>
              <Pressable style={styles.addButton} onPress={addIngredient}>
                <Plus size={18} color={Colors.primary} />
              </Pressable>
            </View>
            {extractedRecipe.ingredients.map((ing, index) => (
              <View key={index} style={styles.ingredientRow}>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  value={ing.amount}
                  onChangeText={(text) => updateIngredient(index, 'amount', text)}
                  placeholder="Qty"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  style={[styles.input, styles.unitInput]}
                  value={ing.unit}
                  onChangeText={(text) => updateIngredient(index, 'unit', text)}
                  placeholder="Unit"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  style={[styles.input, styles.nameInput]}
                  value={ing.name}
                  onChangeText={(text) => updateIngredient(index, 'name', text)}
                  placeholder="Ingredient name"
                  placeholderTextColor={Colors.textLight}
                />
                <Pressable 
                  style={styles.removeButton}
                  onPress={() => removeIngredient(index)}
                >
                  <Trash2 size={18} color={Colors.error} />
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.formLabel}>Instructions</Text>
              <Pressable style={styles.addButton} onPress={addStep}>
                <Plus size={18} color={Colors.primary} />
              </Pressable>
            </View>
            {extractedRecipe.steps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.stepInput]}
                  value={step.instruction}
                  onChangeText={(text) => updateStep(index, text)}
                  placeholder="Step instruction"
                  placeholderTextColor={Colors.textLight}
                  multiline
                />
                <Pressable 
                  style={styles.removeButton}
                  onPress={() => removeStep(index)}
                >
                  <Trash2 size={18} color={Colors.error} />
                </Pressable>
              </View>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (mode === 'preview' && capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.fullPreviewImage} />
          
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.previewActions}>
            <Pressable style={styles.retakeButton} onPress={handleRetake}>
              <RotateCcw size={24} color={Colors.text} />
              <Text style={styles.retakeText}>Retake</Text>
            </Pressable>
            <Pressable 
              style={styles.extractButton} 
              onPress={() => {
                if (capturedImage) {
                  fetch(capturedImage)
                    .then(res => res.blob())
                    .then(blob => {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64 = (reader.result as string).split(',')[1];
                        extractRecipeFromImage(base64);
                      };
                      reader.readAsDataURL(blob);
                    });
                }
              }}
            >
              <Sparkles size={24} color={Colors.textOnPrimary} />
              <Text style={styles.extractText}>Extract Recipe</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const cameraFallback = (
    <SafeAreaView style={styles.container}>
      <View style={styles.permissionContainer}>
        <Camera size={64} color={Colors.textSecondary} />
        <Text style={styles.permissionTitle}>Camera Unavailable</Text>
        <Text style={styles.permissionText}>
          Unable to access the camera. You can still pick images from your gallery.
        </Text>
        <Pressable style={styles.galleryButton} onPress={pickImage}>
          <ImageIcon size={20} color={Colors.primary} />
          <Text style={styles.galleryButtonText}>Pick from Gallery</Text>
        </Pressable>
        <Pressable style={[styles.galleryButton, { marginTop: 8 }]} onPress={() => router.back()}>
          <X size={20} color={Colors.textSecondary} />
          <Text style={[styles.galleryButtonText, { color: Colors.textSecondary }]}>Go Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  return (
    <CameraErrorBoundary fallback={cameraFallback}>
      <View style={styles.cameraContainer}>
        <CameraComponent 
          cameraRef={cameraRef} 
          facing={facing}
          onCameraReady={() => console.log('Camera is ready')}
        >
          <SafeAreaView style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <Pressable style={styles.closeButton} onPress={() => router.back()}>
                <X size={24} color={Colors.textOnPrimary} />
              </Pressable>
              <Text style={styles.cameraTitle}>Scan Recipe</Text>
              <Pressable style={styles.flipButton} onPress={toggleCameraFacing}>
                <SwitchCamera size={24} color={Colors.textOnPrimary} />
              </Pressable>
            </View>

            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>

            <Text style={styles.scanHint}>
              Position the recipe within the frame
            </Text>

            <View style={styles.cameraActions}>
              <Pressable style={styles.galleryPickButton} onPress={pickImage}>
                <ImageIcon size={28} color={Colors.textOnPrimary} />
              </Pressable>
              
              <Pressable style={styles.captureButton} onPress={takePicture}>
                <View style={styles.captureInner} />
              </Pressable>

              <View style={{ width: 56 }} />
            </View>
          </SafeAreaView>
        </CameraComponent>
      </View>
    </CameraErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTitle: {
    ...Typography.h3,
    color: Colors.textOnPrimary,
  },
  scanFrame: {
    width: 280,
    height: 360,
    alignSelf: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scanHint: {
    ...Typography.body,
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  cameraActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing.xxxl,
    gap: Spacing.xxxl,
  },
  galleryPickButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.textOnPrimary,
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.textOnPrimary,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  permissionTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  permissionText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  permissionButtonText: {
    ...Typography.label,
    color: Colors.textOnPrimary,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  galleryButtonText: {
    ...Typography.label,
    color: Colors.primary,
  },
  extractingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  extractingAnimation: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  extractingTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  extractingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  loader: {
    marginTop: Spacing.xxl,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullPreviewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  errorBanner: {
    position: 'absolute',
    top: 100,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.error + 'E6',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    ...Typography.body,
    color: Colors.textOnPrimary,
    textAlign: 'center',
  },
  previewActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl + 20,
    gap: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  retakeText: {
    ...Typography.label,
    color: Colors.text,
  },
  extractButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  extractText: {
    ...Typography.label,
    color: Colors.textOnPrimary,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editHeaderTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editScrollView: {
    flex: 1,
  },
  editContent: {
    padding: Spacing.lg,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
  },
  imageEditContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  imageEditOverlay: {
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
  imageEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.md,
  },
  imageEditButtonText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontWeight: '600' as const,
  },
  noImageContainer: {
    marginBottom: Spacing.lg,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
  },
  addImageText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  formSection: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    ...Typography.label,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  halfInput: {
    flex: 1,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  difficultyChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  difficultyChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  difficultyText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  difficultyTextActive: {
    color: Colors.textOnPrimary,
  },
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  timeInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  timeIcon: {
    marginRight: Spacing.xs,
  },
  timeLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  timeField: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    textAlign: 'center',
    padding: 0,
  },
  timeUnit: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    alignItems: 'center',
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
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    alignItems: 'flex-start',
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
    ...Typography.label,
    color: Colors.textOnPrimary,
    fontSize: 12,
  },
  stepInput: {
    flex: 1,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  galleryModeContainer: {
    flex: 1,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  galleryTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  galleryContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  galleryIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  galleryMainText: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  gallerySubText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  pickImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  pickImageText: {
    ...Typography.label,
    color: Colors.textOnPrimary,
  },
});
