import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Animated,
  ScrollView,
} from 'react-native';
import { Plus, X } from 'lucide-react-native';
import Colors, { BorderRadius, Spacing, Shadow, Typography } from '@/constants/colors';

interface IngredientInputProps {
  ingredients: string[];
  onAddIngredient: (ingredient: string) => void;
  onRemoveIngredient: (index: number) => void;
  placeholder?: string;
}

export default function IngredientInput({
  ingredients,
  onAddIngredient,
  onRemoveIngredient,
  placeholder = 'Add an ingredient...',
}: IngredientInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const buttonAnim = useRef(new Animated.Value(1)).current;

  const handleAdd = () => {
    if (inputValue.trim()) {
      Animated.sequence([
        Animated.spring(buttonAnim, { toValue: 0.9, useNativeDriver: true }),
        Animated.spring(buttonAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]).start();
      onAddIngredient(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
          <Pressable
            onPress={handleAdd}
            style={[styles.addButton, !inputValue.trim() && styles.addButtonDisabled]}
            disabled={!inputValue.trim()}
          >
            <Plus size={20} color={Colors.textOnPrimary} />
          </Pressable>
        </Animated.View>
      </View>
      {ingredients.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsContainer}
        >
          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{ingredient}</Text>
              <Pressable onPress={() => onRemoveIngredient(index)} style={styles.removeButton}>
                <X size={14} color={Colors.textSecondary} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  addButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  tagsContainer: {
    flexDirection: 'row',
    paddingVertical: Spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  tagText: {
    ...Typography.bodySmall,
    color: Colors.text,
    marginRight: Spacing.xs,
  },
  removeButton: {
    padding: Spacing.xs,
  },
});
