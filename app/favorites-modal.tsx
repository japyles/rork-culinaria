import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  Pressable,
  Image,
  Dimensions,
  PanResponder,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Heart, X, BookOpen, Clock, TrendingUp, GripHorizontal } from 'lucide-react-native';
import Colors, { Spacing, Typography, BorderRadius } from '@/constants/colors';
import { useRecipes } from '@/contexts/RecipeContext';
import RecipeCard from '@/components/RecipeCard';
import GlassCard from '@/components/GlassCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const DETENTS = {
  HALF: 0.5,
  THREE_QUARTER: 0.75,
  FULL: 1,
};

type TabType = 'favorites' | 'recent';

export default function FavoritesModalScreen() {
  const router = useRouter();
  const { favoriteRecipes, recentRecipes } = useRecipes();
  const [activeTab, setActiveTab] = useState<TabType>('favorites');
  const [currentDetent, setCurrentDetent] = useState(DETENTS.HALF);
  
  const sheetHeight = useRef(new Animated.Value(SCREEN_HEIGHT * DETENTS.HALF)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  const snapToDetent = useCallback((detent: number) => {
    setCurrentDetent(detent);
    Animated.spring(sheetHeight, {
      toValue: SCREEN_HEIGHT * detent,
      friction: 10,
      tension: 50,
      useNativeDriver: false,
    }).start();
  }, [sheetHeight]);

  const closeSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(sheetHeight, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  }, [sheetHeight, backdropOpacity, router]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        const newHeight = SCREEN_HEIGHT * currentDetent - gestureState.dy;
        const clampedHeight = Math.max(
          SCREEN_HEIGHT * 0.2,
          Math.min(SCREEN_HEIGHT, newHeight)
        );
        sheetHeight.setValue(clampedHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const velocity = gestureState.vy;
        const currentHeight = SCREEN_HEIGHT * currentDetent - gestureState.dy;
        const currentRatio = currentHeight / SCREEN_HEIGHT;

        if (velocity > 1.5 || (velocity > 0.5 && currentRatio < 0.4)) {
          closeSheet();
          return;
        }

        if (velocity < -0.5) {
          if (currentDetent === DETENTS.HALF) {
            snapToDetent(DETENTS.THREE_QUARTER);
          } else if (currentDetent === DETENTS.THREE_QUARTER) {
            snapToDetent(DETENTS.FULL);
          } else {
            snapToDetent(DETENTS.FULL);
          }
          return;
        }

        if (velocity > 0.5) {
          if (currentDetent === DETENTS.FULL) {
            snapToDetent(DETENTS.THREE_QUARTER);
          } else if (currentDetent === DETENTS.THREE_QUARTER) {
            snapToDetent(DETENTS.HALF);
          } else {
            snapToDetent(DETENTS.HALF);
          }
          return;
        }

        if (currentRatio < 0.35) {
          closeSheet();
        } else if (currentRatio < 0.625) {
          snapToDetent(DETENTS.HALF);
        } else if (currentRatio < 0.875) {
          snapToDetent(DETENTS.THREE_QUARTER);
        } else {
          snapToDetent(DETENTS.FULL);
        }
      },
    })
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(sheetHeight, {
        toValue: SCREEN_HEIGHT * DETENTS.HALF,
        friction: 10,
        tension: 50,
        useNativeDriver: false,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
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
    <View>
      <View style={styles.statsContainer}>
        <GlassCard style={styles.statCard}>
          <Heart size={18} color={Colors.primaryDark} />
          <Text style={styles.statValue}>{stats.totalSaved}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <BookOpen size={18} color={Colors.secondary} />
          <Text style={styles.statValue}>{stats.totalCooked}</Text>
          <Text style={styles.statLabel}>Viewed</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Clock size={18} color={Colors.accent} />
          <Text style={styles.statValue}>{stats.avgTime}m</Text>
          <Text style={styles.statLabel}>Avg Time</Text>
        </GlassCard>
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
                    outputRange: [0, 160],
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
            size={16}
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
            size={16}
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
    </View>
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
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: backdropOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.5],
          }) },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
        <LinearGradient
          colors={[Colors.surface, Colors.background]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        
        <View {...panResponder.panHandlers} style={styles.handleContainer}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <View style={styles.headerTitleRow}>
              <Heart size={22} color={Colors.primary} />
              <Text style={styles.sheetTitle}>Favorites</Text>
            </View>
            <Pressable onPress={closeSheet} style={styles.closeButton}>
              <X size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>
        </View>

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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  handleContainer: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
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
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  statValue: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    marginBottom: Spacing.md,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    left: Spacing.xs,
    top: Spacing.xs,
    bottom: Spacing.xs,
    width: 160,
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
    fontSize: 13,
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
