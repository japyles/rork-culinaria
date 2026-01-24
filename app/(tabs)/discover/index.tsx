import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import Colors, { Spacing, Typography, BorderRadius, Shadow } from '@/constants/colors';
import { useFilteredRecipes } from '@/contexts/RecipeContext';
import { categories, cuisines } from '@/mocks/recipes';
import RecipeCard from '@/components/RecipeCard';
import SearchBar from '@/components/SearchBar';
import CategoryChip from '@/components/CategoryChip';
import Button from '@/components/Button';

const difficulties = ['Easy', 'Medium', 'Hard'];

export default function DiscoverScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    params.category
  );
  const [selectedCuisine, setSelectedCuisine] = useState<string | undefined>();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const filteredRecipes = useFilteredRecipes(
    search,
    selectedCategory,
    selectedCuisine,
    selectedDifficulty
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (selectedCuisine) count++;
    if (selectedDifficulty) count++;
    return count;
  }, [selectedCategory, selectedCuisine, selectedDifficulty]);

  const clearFilters = () => {
    setSelectedCategory(undefined);
    setSelectedCuisine(undefined);
    setSelectedDifficulty(undefined);
  };

  const renderHeader = () => (
    <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Discover</Text>
      <Text style={styles.subtitle}>Find your next culinary adventure</Text>

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          onFilterPress={() => setShowFilters(true)}
          placeholder="Search recipes, ingredients..."
        />
        {activeFiltersCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        <CategoryChip
          label="All"
          isSelected={!selectedCategory}
          onPress={() => setSelectedCategory(undefined)}
        />
        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            label={category.name}
            icon={category.icon}
            color={category.color}
            isSelected={selectedCategory === category.id}
            onPress={() =>
              setSelectedCategory(
                selectedCategory === category.id ? undefined : category.id
              )
            }
          />
        ))}
      </ScrollView>

      <Text style={styles.resultsCount}>
        {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
      </Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <RecipeCard recipe={item} />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🍳</Text>
              <Text style={styles.emptyTitle}>No recipes found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your search or filters
              </Text>
              <Button
                title="Clear filters"
                variant="outline"
                size="sm"
                onPress={clearFilters}
              />
            </View>
          }
        />

        <Modal
          visible={showFilters}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <Pressable onPress={() => setShowFilters(false)} style={styles.closeButton}>
                <X size={24} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.filterSectionTitle}>Cuisine</Text>
              <View style={styles.filterOptions}>
                {cuisines.map((cuisine) => (
                  <Pressable
                    key={cuisine}
                    style={[
                      styles.filterOption,
                      selectedCuisine === cuisine && styles.filterOptionSelected,
                    ]}
                    onPress={() =>
                      setSelectedCuisine(
                        selectedCuisine === cuisine ? undefined : cuisine
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedCuisine === cuisine && styles.filterOptionTextSelected,
                      ]}
                    >
                      {cuisine}
                    </Text>
                    {selectedCuisine === cuisine && (
                      <Check size={16} color={Colors.textOnPrimary} />
                    )}
                  </Pressable>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Difficulty</Text>
              <View style={styles.filterOptions}>
                {difficulties.map((difficulty) => (
                  <Pressable
                    key={difficulty}
                    style={[
                      styles.filterOption,
                      selectedDifficulty === difficulty && styles.filterOptionSelected,
                    ]}
                    onPress={() =>
                      setSelectedDifficulty(
                        selectedDifficulty === difficulty ? undefined : difficulty
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedDifficulty === difficulty && styles.filterOptionTextSelected,
                      ]}
                    >
                      {difficulty}
                    </Text>
                    {selectedDifficulty === difficulty && (
                      <Check size={16} color={Colors.textOnPrimary} />
                    )}
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Clear all"
                variant="ghost"
                onPress={clearFilters}
                style={styles.clearButton}
              />
              <Button
                title="Apply filters"
                onPress={() => setShowFilters(false)}
                style={styles.applyButton}
              />
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    right: Spacing.lg + 4,
    top: -4,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: Colors.textOnPrimary,
    fontSize: 10,
    fontWeight: '700' as const,
  },
  categoriesContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  resultsCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  listContent: {
    paddingBottom: Spacing.xxxl,
  },
  cardContainer: {
    paddingHorizontal: Spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl * 2,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    fontSize: 64,
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
    marginBottom: Spacing.lg,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  filterSectionTitle: {
    ...Typography.label,
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  filterOptionSelected: {
    backgroundColor: Colors.primary,
  },
  filterOptionText: {
    ...Typography.bodySmall,
    color: Colors.text,
  },
  filterOptionTextSelected: {
    color: Colors.textOnPrimary,
    fontWeight: '600' as const,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.md,
  },
  clearButton: {
    flex: 1,
  },
  applyButton: {
    flex: 2,
  },
});
