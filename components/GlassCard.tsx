import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Colors, { BorderRadius, Spacing, Shadow } from '@/constants/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export default function GlassCard({ children, style, padding = Spacing.lg }: GlassCardProps) {
  return (
    <View style={[styles.container, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.glass.background,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    ...Shadow.md,
  },
});
