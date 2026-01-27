import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Colors, { BorderRadius, Spacing, Shadow } from '@/constants/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export default function GlassCard({ children, style, padding = Spacing.lg, backgroundColor=Colors.glass.background }: GlassCardProps) {
  return (
    <View style={[styles.container, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    
  },
});
