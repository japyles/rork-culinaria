import React, { useRef, useEffect, useMemo, useState } from 'react';
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
import { Sparkles, Video, TrendingUp, Camera, PenLine, User, LogOut } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.55;
import Colors, { Spacing, Typography, BorderRadius, Shadow } from '@/constants/colors';
import { useRecipes } from '@/contexts/RecipeContext';
import { useSocial } from '@/contexts/SocialContext';
import { categories } from '@/mocks/recipes';
import RecipeCard from '@/components/RecipeCard';
import SectionHeader from '@/components/SectionHeader';
import CategoryChip from '@/components/CategoryChip';
import GlassCard from '@/components/GlassCard';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { allRecipes, recentRecipes, favoriteRecipes } = useRecipes();
  const { currentUser } = useSocial();
  const { signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
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

  const timeOfDayGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    return 'Evening';
  }, []);

  const featuredRecipe = useMemo(() => {
    if (allRecipes.length === 0) return null;
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    const index = dayOfYear % allRecipes.length;
    return allRecipes[index];
  }, [allRecipes]);

  const { getUserById } = useSocial();

  const featuredAuthor = useMemo(() => {
    if (!featuredRecipe?.authorId) return null;
    return getUserById(featuredRecipe.authorId) ?? null;
  }, [featuredRecipe, getUserById]);
  const trendingRecipes = allRecipes.slice(1, 5);

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/discover?category=${categoryId}`);
  };

  const handleAvatarPress = () => {
    setShowDropdown(!showDropdown);
  };

  const handleProfilePress = () => {
    setShowDropdown(false);
    router.push('/(tabs)/profile');
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
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
                    Good {timeOfDayGreeting},{"\n"}{currentUser?.displayName ?? 'Chef'}!
                  </Text>
                	
                </View>
                <View>
                  <Pressable
                    style={styles.heroAvatarContainer}
                    onPress={handleAvatarPress}
                  >
                    <Image
                      source={{ uri: currentUser?.avatarUrl ?? 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop' }}
                      style={styles.heroAvatar}
                    />
                  </Pressable>
                  {showDropdown && (
                    <View style={styles.dropdownMenu}>
                      <Pressable style={styles.dropdownItem} onPress={handleProfilePress}>
                        <User size={18} color={Colors.text} />
                        <Text style={styles.dropdownText}>Profile</Text>
                      </Pressable>
                      <View style={styles.dropdownDivider} />
                      <Pressable style={styles.dropdownItem} onPress={handleLogout}>
                        <LogOut size={18} color={Colors.error} />
                        <Text style={[styles.dropdownText, { color: Colors.error }]}>Log Out</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
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
            <Pressable
              style={styles.quickAction}
              onPress={() => router.push('/add-recipe')}
            >
              <View style={styles.quickActionCard}>
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.success + '15' }]}>
                  <PenLine size={22} color={Colors.success} />
                </View>
                <Text style={styles.quickActionText}>Add Manual</Text>
              </View>
            </Pressable>
          </Animated.View>

          {featuredRecipe && (
            <View style={styles.section}>
              <SectionHeader
                title="Featured"
                subtitle={featuredAuthor?.displayName ? `Chef ${featuredAuthor.displayName}'s pick of the day` : "Chef's pick of the day"}
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
		fontSize: 28,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: -1,
    textTransform: 'uppercase',
  },
  heroAvatar: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.full,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 54,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    minWidth: 150,
    ...Shadow.md,
    zIndex: 100,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: Colors.border,
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
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    marginBottom: Spacing.lg,
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
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
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
