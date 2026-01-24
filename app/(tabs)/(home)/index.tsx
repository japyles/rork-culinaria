import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Animated,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Sparkles, Video, TrendingUp, Camera } from 'lucide-react-native';
import Colors, { Spacing, Typography, BorderRadius, Shadow } from '@/constants/colors';
import { useRecipes } from '@/contexts/RecipeContext';
import { categories } from '@/mocks/recipes';
import RecipeCard from '@/components/RecipeCard';
import SectionHeader from '@/components/SectionHeader';
import CategoryChip from '@/components/CategoryChip';
import GlassCard from '@/components/GlassCard';

export default function HomeScreen() {
  const router = useRouter();
  const { allRecipes, recentRecipes, favoriteRecipes } = useRecipes();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const featuredRecipe = allRecipes[0];
  const trendingRecipes = allRecipes.slice(1, 5);

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/discover?category=${categoryId}`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, '#FFF8E7', Colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View
            style={[
              styles.header,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View>
              <Text style={styles.greeting}>Good morning,</Text>
              <Text style={styles.title}>What's cooking today?</Text>
            </View>
            <Pressable
              style={styles.avatarContainer}
              onPress={() => router.push('/favorites')}
            >
              <Image
                source={{ uri: 'https://plus.unsplash.com/premium_photo-1664369472896-5646e99a26e8?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=200' }}
                style={styles.avatar}
              />
            </Pressable>
          </Animated.View>

          <Animated.View
            style={[
              styles.quickActions,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Pressable
              style={styles.quickAction}
              onPress={() => router.push('/ai-chef')}
            >
              <GlassCard style={styles.quickActionCard}>
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + '20' }]}>
                  <Sparkles size={24} color={Colors.primary} />
                </View>
                <Text style={styles.quickActionText}>AI Recipe</Text>
              </GlassCard>
            </Pressable>
            <Pressable
              style={styles.quickAction}
              onPress={() => router.push('/scan-recipe')}
            >
              <GlassCard style={styles.quickActionCard}>
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.accent + '20' }]}>
                  <Camera size={24} color={Colors.accent} />
                </View>
                <Text style={styles.quickActionText}>Scan Recipe</Text>
              </GlassCard>
            </Pressable>
            <Pressable
              style={styles.quickAction}
              onPress={() => router.push('/video-extract')}
            >
              <GlassCard style={styles.quickActionCard}>
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.secondary + '20' }]}>
                  <Video size={24} color={Colors.secondary} />
                </View>
                <Text style={styles.quickActionText}>From Video</Text>
              </GlassCard>
            </Pressable>
          </Animated.View>

          {featuredRecipe && (
            <View style={styles.section}>
              <SectionHeader
                title="Featured"
                subtitle="Chef's pick of the day"
                showSeeAll={false}
              />
              <View style={styles.featuredContainer}>
                <RecipeCard recipe={featuredRecipe} variant="featured" />
              </View>
            </View>
          )}

          <View style={styles.section}>
            <SectionHeader
              title="Categories"
              showSeeAll={false}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {categories.map((category) => (
                <CategoryChip
                  key={category.id}
                  label={category.name}
                  icon={category.icon}
                  color={category.color}
                  onPress={() => handleCategoryPress(category.id)}
                />
              ))}
            </ScrollView>
          </View>

          {recentRecipes.length > 0 && (
            <View style={styles.section}>
              <SectionHeader
                title="Continue Cooking"
                subtitle="Pick up where you left off"
                onSeeAll={() => router.push('/discover')}
              />
              <FlatList
                data={recentRecipes.slice(0, 4)}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <RecipeCard recipe={item} variant="compact" />
                )}
              />
            </View>
          )}

          <View style={styles.section}>
            <SectionHeader
              title="Trending Now"
              subtitle="Popular this week"
              onSeeAll={() => router.push('/discover')}
            />
            <View style={styles.trendingIcon}>
              <TrendingUp size={16} color={Colors.success} />
            </View>
            <View style={styles.recipesList}>
              {trendingRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </View>
          </View>

          <View style={styles.bottomPadding} />
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
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  greeting: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  avatarContainer: {
    borderRadius: BorderRadius.full,
    borderWidth: 3,
    borderColor: Colors.primary,
    ...Shadow.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  quickAction: {
    flex: 1,
  },
  quickActionCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionText: {
    ...Typography.label,
    color: Colors.text,
  },
  section: {
    marginTop: Spacing.lg,
  },
  featuredContainer: {
    paddingHorizontal: Spacing.lg,
  },
  categoriesContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  horizontalList: {
    paddingHorizontal: Spacing.lg,
  },
  trendingIcon: {
    position: 'absolute',
    right: Spacing.lg,
    top: Spacing.xs,
  },
  recipesList: {
    paddingHorizontal: Spacing.lg,
  },
  bottomPadding: {
    height: Spacing.xxxl,
  },
});
