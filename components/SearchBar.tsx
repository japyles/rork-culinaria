import React, { useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Search, X, SlidersHorizontal } from 'lucide-react-native';
import Colors, { BorderRadius, Spacing, Shadow } from '@/constants/colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  showFilter?: boolean;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search recipes...',
  onFilterPress,
  showFilter = true,
}: SearchBarProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleFocus = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.02,
      useNativeDriver: true,
    }).start();
  };

  const handleBlur = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleClear = () => {
    onChangeText('');
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.searchSection}>
        <Search size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <X size={18} color={Colors.textSecondary} />
          </Pressable>
        )}
      </View>
      {showFilter && (
        <Pressable onPress={onFilterPress} style={styles.filterButton}>
          <SlidersHorizontal size={20} color={Colors.primary} />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  input: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: Spacing.xs,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  filterButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
});
