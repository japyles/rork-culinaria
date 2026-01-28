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
  Dimensions,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Sparkles, Video, TrendingUp, Camera, Menu } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.55;
import Colors, { Spacing, Typography, BorderRadius, Shadow } from '@/constants/colors';
import { useRecipes } from '@/contexts/RecipeContext';
import { categories } from '@/mocks/recipes';
import RecipeCard from '@/components/RecipeCard';
import SectionHeader from '@/components/SectionHeader';
import CategoryChip from '@/components/CategoryChip';
import GlassCard from '@/components/GlassCard';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { allRecipes, recentRecipes, favoriteRecipes } = useRecipes();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

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
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.heroContainer}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop' }}
            style={styles.heroImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)']}
              style={styles.heroOverlay}
            >
              <View style={[styles.heroHeader, { paddingTop: insets.top + 8 }]}>
                <View >
                  <Text style={styles.heroTextTop} >
                    Good Morning!
                  </Text>
                	
                </View>
                <Pressable
                  style={styles.heroAvatarContainer}
                  onPress={() => router.push('/profile')}
                >
                  <Image
                    source={{ uri: 'https://plus.unsplash.com/premium_photo-1664369472896-5646e99a26e8?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=200' }}
                    style={styles.heroAvatar}
                  />
                </Pressable>
              </View>
              <View style={styles.heroContent}>
                <Text style={styles.heroGreeting}>HEY,</Text>
                <Text style={styles.heroName}>CHEF.</Text>
                <Text style={styles.heroSubtitle}>Discover delicious{"\n"}recipes today.</Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        <View style={styles.mainContent}>

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
              <View style={styles.quickActionCard}>
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + '15' }]}>
                  <Sparkles size={22} color={Colors.primary} />
                </View>
                <Text style={styles.quickActionText}>AI Recipe</Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.quickAction}
              onPress={() => router.push('/scan-recipe')}
            >
              <View style={styles.quickActionCard}>
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.accent + '15' }]}>
                  <Camera size={22} color={Colors.accent} />
                </View>
                <Text style={styles.quickActionText}>Scan Recipe</Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.quickAction}
              onPress={() => router.push('/video-extract')}
            >
              <View style={styles.quickActionCard}>
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.secondary + '15' }]}>
                  <Video size={22} color={Colors.secondary} />
                </View>
                <Text style={styles.quickActionText}>From Video</Text>
              </View>
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
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  heroContainer: {
    height: HERO_HEIGHT,
    width: '100%',
  },
  heroImage: {
    flex: 1,
    width: '100%',
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarContainer: {
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  heroTextTop: {
		fontSize: 35,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: -1,
    textTranform: 'upper',
  },
  heroAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
  },
  heroContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  heroGreeting: {
    fontSize: 42,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: -1,
  },
  heroName: {
    fontSize: 42,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: -1,
    marginBottom: Spacing.lg,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  mainContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: Spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickAction: {
    flex: 1,
  },
  quickActionCard: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  quickActionText: {
    ...Typography.label,
    color: Colors.text,
    fontSize: 12,
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
