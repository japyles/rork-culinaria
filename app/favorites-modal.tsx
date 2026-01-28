import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Heart, X } from 'lucide-react-native';
import Colors, { Spacing, Typography, BorderRadius } from '@/constants/colors';
import { useRecipes } from '@/contexts/RecipeContext';
import RecipeCard from '@/components/RecipeCard';

export default function FavoritesModalScreen() {
  const router = useRouter();
  const { favoriteRecipes } = useRecipes();

  const closeSheet = () => {
    router.back();
  };

  

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>❤️</Text>
      <Text style={styles.emptyTitle}>No favorites yet</Text>
      <Text style={styles.emptyText}>
        Start exploring and save recipes you love!
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.surface, Colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <View style={styles.grabberContainer}>
        <View style={styles.grabber} />
      </View>
      
      <View style={styles.sheetHeader}>
        <View style={styles.headerTitleRow}>
          <Heart size={22} color={Colors.primary} />
          <Text style={styles.sheetTitle}>Favorites</Text>
        </View>
        <Pressable onPress={closeSheet} style={styles.closeButton}>
          <X size={22} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <FlatList
        data={favoriteRecipes}
        keyExtractor={(item) => item.id}
        bounces={false}
        overScrollMode="never"
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            <RecipeCard recipe={item} />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  grabberContainer: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  grabber: {
    width: 36,
    height: 4,
    backgroundColor: Colors.textSecondary,
    borderRadius: 2,
    opacity: 0.4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sheetTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.xs,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
  },
  listContent: {
    paddingBottom: Spacing.xxxl,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  cardContainer: {
    paddingHorizontal: Spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
});
