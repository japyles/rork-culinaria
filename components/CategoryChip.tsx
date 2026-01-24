import React, { useRef } from 'react';
import { Text, StyleSheet, Pressable, Animated } from 'react-native';
import Colors, { BorderRadius, Spacing, Shadow } from '@/constants/colors';

interface CategoryChipProps {
  label: string;
  icon?: string;
  isSelected?: boolean;
  onPress?: () => void;
  color?: string;
}

export default function CategoryChip({
  label,
  icon,
  isSelected = false,
  onPress,
  color = Colors.primary,
}: CategoryChipProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.chip,
          isSelected && { backgroundColor: color, borderColor: color },
        ]}
      >
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text
          style={[
            styles.label,
            isSelected && styles.labelSelected,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  icon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  labelSelected: {
    color: Colors.textOnPrimary,
  },
});
