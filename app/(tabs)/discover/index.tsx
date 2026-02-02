import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Check, Users, BadgeCheck, ChefHat, ArrowUp, ArrowDown } from 'lucide-react-native';
import Colors, { Spacing, Typography, BorderRadius, Shadow } from '@/constants/colors';
import { useFilteredRecipes } from '@/contexts/RecipeContext';
import { useSocial, useUserSearch } from '@/contexts/SocialContext';
import { categories, cuisines } from '@/mocks/recipes';
import { User } from '@/types/recipe';
import RecipeCard from '@/components/RecipeCard';
import SearchBar from '@/components/SearchBar';
import CategoryChip from '@/components/CategoryChip';
import Button from '@/components/Button';

const difficulties = ['Easy', 'Medium', 'Hard'];
type SearchMode = 'recipes' | 'users';
type SortOption = 'none' | 'rating_high' | 'rating_low';

export default function DiscoverScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('recipes');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    params.category
  );
  const [selectedCuisine, setSelectedCuisine] = useState<string | undefined>();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('none');

  const { isFollowing, toggleFollow, getSuggestedUsers } = useSocial();
  const searchedUsers = useUserSearch(search);

  const filteredRecipes = useFilteredRecipes(
    search,
    selectedCategory,
    selectedCuisine,
    selectedDifficulty
  );

  const sortedRecipes = useMemo(() => {
    if (sortBy === 'none') return filteredRecipes;
    
    return [...filteredRecipes].sort((a, b) => {
      if (sortBy === 'rating_high') {
        return b.rating - a.rating;
      } else {
        return a.rating - b.rating;
      }
    });
  }, [filteredRecipes, sortBy]);

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
    if (sortBy !== 'none') count++;
    return count;
  }, [selectedCategory, selectedCuisine, selectedDifficulty, sortBy]);

  const clearFilters = () => {
    setSelectedCategory(undefined);
    setSelectedCuisine(undefined);
    setSelectedDifficulty(undefined);
    setSortBy('none');
  };

  const renderUserItem = useCallback(
    ({ item }: { item: User }) => {
      const following = isFollowing(item.id);
      return (
        <Pressable
          style={styles.userCard}
          onPress={() => router.push(`/user/${item.id}`)}
        >
          <Image source={{ uri: item.avatarUrl }} style={styles.userAvatar} />
          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.userDisplayName}>{item.displayName}</Text>
              {item.isVerified && (
                <BadgeCheck size={14} color={Colors.primary} />
              )}
            </View>
            <Text style={styles.userUsername}>@{item.username}</Text>
            <Text style={styles.userStats}>
              {item.recipesCount} recipes · {item.followersCount > 1000
                ? `${(item.followersCount / 1000).toFixed(1)}K`
                : item.followersCount} followers
            </Text>
          </View>
          <Pressable
            style={[
              styles.followButton,
              following && styles.followingButton,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              toggleFollow(item.id);
            }}
          >
            <Text
              style={[
                styles.followButtonText,
                following && styles.followingButtonText,
              ]}
            >
              {following ? 'Following' : 'Follow'}
            </Text>
          </Pressable>
        </Pressable>
      );
    },
    [isFollowing, toggleFollow, router]
  );

  const renderHeader = useCallback(() => (
    <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
      <View style={styles.modeToggle}>
        <Pressable
          style={[
            styles.modeButton,
            searchMode === 'recipes' && styles.modeButtonActive,
          ]}
          onPress={() => setSearchMode('recipes')}
        >
          <ChefHat size={16} color={searchMode === 'recipes' ? Colors.textOnPrimary : Colors.textSecondary} />
          <Text
            style={[
              styles.modeButtonText,
              searchMode === 'recipes' && styles.modeButtonTextActive,
            ]}
          >
            Recipes
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.modeButton,
            searchMode === 'users' && styles.modeButtonActive,
          ]}
          onPress={() => setSearchMode('users')}
        >
          <Users size={16} color={searchMode === 'users' ? Colors.textOnPrimary : Colors.textSecondary} />
          <Text
            style={[
              styles.modeButtonText,
              searchMode === 'users' && styles.modeButtonTextActive,
            ]}
          >
            Users
          </Text>
        </Pressable>
      </View>

      {searchMode === 'recipes' && (
        <>
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
            {sortedRecipes.length} recipe{sortedRecipes.length !== 1 ? 's' : ''} found
            {sortBy !== 'none' && ` · Sorted by ${sortBy === 'rating_high' ? 'highest' : 'lowest'} rating`}
          </Text>
        </>
      )}

      {searchMode === 'users' && !search && (
        <View style={styles.suggestedSection}>
          <Text style={styles.suggestedTitle}>Suggested Users</Text>
        </View>
      )}

      {searchMode === 'users' && search && (
        <Text style={styles.resultsCount}>
          {searchedUsers.length} user{searchedUsers.length !== 1 ? 's' : ''} found
        </Text>
      )}
    </Animated.View>
  ), [searchMode, fadeAnim, selectedCategory, sortedRecipes.length, searchedUsers.length, search, sortBy]);

  const displayedUsers = search ? searchedUsers : getSuggestedUsers;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.fixedHeader}>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>Find recipes and connect with cooks</Text>

          <View style={styles.searchContainer}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              onFilterPress={() => setShowFilters(true)}
              placeholder={searchMode === 'recipes' ? "Search recipes, ingredients..." : "Search users..."}
            />
            {activeFiltersCount > 0 && searchMode === 'recipes' && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </View>
        </View>

        {searchMode === 'recipes' ? (
          <FlatList
            data={sortedRecipes}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderHeader}
            renderItem={({ item }) => (
              <View style={styles.cardContainer}>
                <RecipeCard recipe={item} />
              </View>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
        ) : (
          <FlatList
            data={displayedUsers}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderHeader}
            renderItem={renderUserItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Users size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyTitle}>No users found</Text>
                <Text style={styles.emptyText}>
                  Try a different search term
                </Text>
              </View>
            }
          />
        )}

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
              <Text style={styles.filterSectionTitle}>Sort by Rating</Text>
              <View style={styles.filterOptions}>
                <Pressable
                  style={[
                    styles.filterOption,
                    sortBy === 'rating_high' && styles.filterOptionSelected,
                  ]}
                  onPress={() => setSortBy(sortBy === 'rating_high' ? 'none' : 'rating_high')}
                >
                  <ArrowUp size={14} color={sortBy === 'rating_high' ? Colors.textOnPrimary : Colors.text} />
                  <Text
                    style={[
                      styles.filterOptionText,
                      sortBy === 'rating_high' && styles.filterOptionTextSelected,
                    ]}
                  >
                    Highest First
                  </Text>
                  {sortBy === 'rating_high' && (
                    <Check size={16} color={Colors.textOnPrimary} />
                  )}
                </Pressable>
                <Pressable
                  style={[
                    styles.filterOption,
                    sortBy === 'rating_low' && styles.filterOptionSelected,
                  ]}
                  onPress={() => setSortBy(sortBy === 'rating_low' ? 'none' : 'rating_low')}
                >
                  <ArrowDown size={14} color={sortBy === 'rating_low' ? Colors.textOnPrimary : Colors.text} />
                  <Text
                    style={[
                      styles.filterOptionText,
                      sortBy === 'rating_low' && styles.filterOptionTextSelected,
                    ]}
                  >
                    Lowest First
                  </Text>
                  {sortBy === 'rating_low' && (
                    <Check size={16} color={Colors.textOnPrimary} />
                  )}
                </Pressable>
              </View>

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
  fixedHeader: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  searchContainer: {
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
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    padding: 4,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  modeButtonActive: {
    backgroundColor: Colors.primary,
  },
  modeButtonText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  modeButtonTextActive: {
    color: Colors.textOnPrimary,
    fontWeight: '600' as const,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  userDisplayName: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  userUsername: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  userStats: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  followButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  followButtonText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontWeight: '600' as const,
  },
  followingButtonText: {
    color: Colors.primary,
  },
  suggestedSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  suggestedTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
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
