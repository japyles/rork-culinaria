import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  BadgeCheck,
  ChefHat,
  Users,
  UserPlus,
  Calendar,
} from 'lucide-react-native';
import Colors, { Spacing, Typography, BorderRadius } from '@/constants/colors';
import { useSocial } from '@/contexts/SocialContext';
import { useRecipes } from '@/contexts/RecipeContext';
import RecipeCard from '@/components/RecipeCard';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getUserById, isFollowing, toggleFollow, isLoadingUsers, isFollowPending } = useSocial();
  const { allRecipes } = useRecipes();

  const user = useMemo(() => getUserById(id), [id, getUserById]);
  const userRecipes = useMemo(
    () => allRecipes.filter((r) => r.authorId === id),
    [allRecipes, id]
  );
  const following = isFollowing(id);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, []);

  if (isLoadingUsers) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>User not found</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.backLink}>Go back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.text} />
            </Pressable>
          </View>

          <View style={styles.profileSection}>
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />

            <View style={styles.nameRow}>
              <Text style={styles.displayName}>{user.displayName}</Text>
              {user.isVerified && (
                <BadgeCheck size={20} color={Colors.primary} />
              )}
            </View>
            <Text style={styles.username}>@{user.username}</Text>
            <Text style={styles.bio}>{user.bio}</Text>

            <View style={styles.joinedRow}>
              <Calendar size={14} color={Colors.textSecondary} />
              <Text style={styles.joinedText}>
                Joined {formatDate(user.joinedAt)}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ChefHat size={18} color={Colors.primary} />
                <Text style={styles.statValue}>{user.recipesCount}</Text>
                <Text style={styles.statLabel}>Recipes</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Users size={18} color={Colors.primary} />
                <Text style={styles.statValue}>
                  {user.followersCount > 1000
                    ? `${(user.followersCount / 1000).toFixed(1)}K`
                    : user.followersCount}
                </Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <UserPlus size={18} color={Colors.primary} />
                <Text style={styles.statValue}>{user.followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>

            <Pressable
              style={[
                styles.followButton,
                following && styles.followingButton,
                isFollowPending && styles.followButtonDisabled,
              ]}
              onPress={() => {
                console.log('[UserProfile] Follow button pressed for:', user.id);
                toggleFollow(user.id);
              }}
              disabled={isFollowPending}
            >
              <Text
                style={[
                  styles.followButtonText,
                  following && styles.followingButtonText,
                ]}
              >
                {isFollowPending ? 'Loading...' : following ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.recipesSection}>
            <Text style={styles.sectionTitle}>
              Recipes by {user.displayName.split(' ')[0]}
            </Text>

            {userRecipes.length > 0 ? (
              <View style={styles.recipesGrid}>
                {userRecipes.map((recipe) => (
                  <View key={recipe.id} style={styles.recipeCardWrapper}>
                    <RecipeCard recipe={recipe} variant="compact" />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyRecipes}>
                <ChefHat size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyText}>
                  No recipes shared yet
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  displayName: {
    ...Typography.h2,
    color: Colors.text,
  },
  username: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  bio: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  joinedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  joinedText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    ...Typography.h3,
    color: Colors.text,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.borderLight,
  },
  followButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxxl,
    borderRadius: BorderRadius.full,
    width: '100%',
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  followButtonText: {
    ...Typography.bodyBold,
    color: Colors.textOnPrimary,
  },
  followingButtonText: {
    color: Colors.primary,
  },
  followButtonDisabled: {
    opacity: 0.6,
  },
  recipesSection: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  recipesGrid: {
    paddingHorizontal: Spacing.lg,
  },
  recipeCardWrapper: {
    marginBottom: Spacing.md,
  },
  emptyRecipes: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  backLink: {
    ...Typography.body,
    color: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
