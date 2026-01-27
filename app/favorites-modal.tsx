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
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Heart, X } from 'lucide-react-native';
import Colors, { Spacing, Typography, BorderRadius } from '@/constants/colors';
import { useRecipes } from '@/contexts/RecipeContext';
import RecipeCard from '@/components/RecipeCard';
import GlassCard from '@/components/GlassCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const DETENTS = {
  HALF: 0.5,
  THREE_QUARTER: 0.75,
  FULL: 0.9,
};

export default function FavoritesModalScreen() {
  const router = useRouter();
  const { favoriteRecipes } = useRecipes();
  const [currentDetent, setCurrentDetent] = useState(DETENTS.HALF);
  const currentDetentRef = useRef(DETENTS.HALF);
  
  const sheetHeight = useRef(new Animated.Value(SCREEN_HEIGHT * DETENTS.HALF)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const snapToDetent = useCallback((detent: number) => {
    setCurrentDetent(detent);
    currentDetentRef.current = detent;
    Animated.timing(sheetHeight, {
      toValue: SCREEN_HEIGHT * detent,
      duration: 250,
      easing: Easing.out(Easing.cubic),
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
        const detent = currentDetentRef.current;
        const newHeight = SCREEN_HEIGHT * detent - gestureState.dy;
        const clampedHeight = Math.max(
          SCREEN_HEIGHT * 0.2,
          Math.min(SCREEN_HEIGHT * DETENTS.FULL, newHeight)
        );
        sheetHeight.setValue(clampedHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const detent = currentDetentRef.current;
        const velocity = gestureState.vy;
        const currentHeight = SCREEN_HEIGHT * detent - gestureState.dy;
        const currentRatio = currentHeight / SCREEN_HEIGHT;

        if (velocity > 1.5 || (velocity > 0.5 && currentRatio < 0.4)) {
          closeSheet();
          return;
        }

        if (velocity < -0.5) {
          if (detent === DETENTS.HALF) {
            snapToDetent(DETENTS.THREE_QUARTER);
          } else if (detent === DETENTS.THREE_QUARTER) {
            snapToDetent(DETENTS.FULL);
          } else {
            snapToDetent(DETENTS.FULL);
          }
          return;
        }

        if (velocity > 0.5) {
          if (detent === DETENTS.FULL) {
            snapToDetent(DETENTS.THREE_QUARTER);
          } else if (detent === DETENTS.THREE_QUARTER) {
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
      Animated.timing(sheetHeight, {
        toValue: SCREEN_HEIGHT * DETENTS.HALF,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  

  const renderHeader = () => (
    <View>
      <Text style={styles.sectionTitle}>Your Favorites</Text>
    </View>
  );

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
          data={favoriteRecipes}
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
