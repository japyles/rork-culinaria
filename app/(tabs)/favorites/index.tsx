import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Settings, BookOpen, Clock, TrendingUp } from 'lucide-react-native';
import Colors, { Spacing, Typography, BorderRadius, Shadow, FLOATING_BAR_HEIGHT } from '@/constants/colors';
import { useRecipes } from '@/contexts/RecipeContext';
import RecipeCard from '@/components/RecipeCard';
import GlassCard from '@/components/GlassCard';

type TabType = 'favorites' | 'recent';

export default function FavoritesScreen() {
  const { favoriteRecipes, recentRecipes } = useRecipes();
  const [activeTab, setActiveTab] = useState<TabType>('favorites');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.spring(tabIndicatorAnim, {
      toValue: activeTab === 'favorites' ? 0 : 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const currentRecipes = activeTab === 'favorites' ? favoriteRecipes : recentRecipes;

  const stats = {
    totalSaved: favoriteRecipes.length,
    totalCooked: recentRecipes.length,
    avgTime: Math.round(
      favoriteRecipes.reduce((acc, r) => acc + r.prepTime + r.cookTime, 0) /
        (favoriteRecipes.length || 1)
    ),
  };

  const renderHeader = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.profileSection}>
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: 'https://plus.unsplash.com/premium_photo-1664369472896-5646e99a26e8?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=200' }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Home Chef</Text>
            <Text style={styles.profileSubtitle}>Cooking enthusiast</Text>
          </View>
          <Pressable style={styles.settingsButton}>
            <Settings size={22} color={Colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.statsContainer}>
          <GlassCard style={styles.statCard}>
            <Heart size={20} color={Colors.primaryDark} />
            <Text style={styles.statValue}>{stats.totalSaved}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <BookOpen size={20} color={Colors.secondary} />
            <Text style={styles.statValue}>{stats.totalCooked}</Text>
            <Text style={styles.statLabel}>Viewed</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Clock size={20} color={Colors.accent} />
            <Text style={styles.statValue}>{stats.avgTime}m</Text>
            <Text style={styles.statLabel}>Avg Time</Text>
          </GlassCard>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              transform: [
                {
                  translateX: tabIndicatorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 200],
                  }),
                },
              ],
            },
          ]}
        />
        <Pressable
          style={styles.tab}
          onPress={() => setActiveTab('favorites')}
        >
          <Heart
            size={18}
            color={activeTab === 'favorites' ? Colors.textOnPrimary : Colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'favorites' && styles.tabTextActive,
            ]}
          >
            Favorites
          </Text>
        </Pressable>
        <Pressable
          style={styles.tab}
          onPress={() => setActiveTab('recent')}
        >
          <TrendingUp
            size={18}
            color={activeTab === 'recent' ? Colors.textOnPrimary : Colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'recent' && styles.tabTextActive,
            ]}
          >
            Recent
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>
        {activeTab === 'favorites' ? 'Your Favorites' : 'Recently Viewed'}
      </Text>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>
        {activeTab === 'favorites' ? '❤️' : '👀'}
      </Text>
      <Text style={styles.emptyTitle}>
        {activeTab === 'favorites' ? 'No favorites yet' : 'No recent recipes'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'favorites'
          ? 'Start exploring and save recipes you love!'
          : 'Browse recipes to build your cooking history'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primaryDark + '10', Colors.background, Colors.secondary + '10']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <FlatList
          data={currentRecipes}
          keyExtractor={(item) => item.id}
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
  listContent: {
    paddingBottom: FLOATING_BAR_HEIGHT,
  },
  profileSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileName: {
    ...Typography.h2,
    color: Colors.text,
  },
  profileSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  statValue: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    left: Spacing.xs,
    top: Spacing.xs,
    bottom: Spacing.xs,
    width: 200,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    zIndex: 1,
  },
  tabText: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textOnPrimary,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
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
  },
});
