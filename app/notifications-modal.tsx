import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, X, CheckCheck, Trash2, ChefHat } from 'lucide-react-native';
import Colors, { Spacing, Typography, BorderRadius } from '@/constants/colors';
import { useNotifications } from '@/contexts/NotificationContext';
import { Notification } from '@/types/recipe';

export default function NotificationsModalScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    isCheckingForNew,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    checkForNewRecipes,
  } = useNotifications();

  const closeSheet = () => {
    router.back();
  };

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      markAsRead(notification.id);
      router.back();
      setTimeout(() => {
        router.push(`/recipe/${notification.recipeId}`);
      }, 100);
    },
    [markAsRead, router]
  );

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotificationItem = useCallback(
    ({ item }: { item: Notification }) => {
      return (
        <Pressable
          style={[
            styles.notificationItem,
            !item.isRead && styles.notificationItemUnread,
          ]}
          onPress={() => handleNotificationPress(item)}
        >
          <Image
            source={{ uri: item.fromUserAvatar }}
            style={styles.userAvatar}
          />
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.fromUserName}
              </Text>
              <Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt)}</Text>
            </View>
            <Text style={styles.notificationText}>
              Posted a new recipe
            </Text>
            <View style={styles.recipePreview}>
              <Image
                source={{ uri: item.recipeImageUrl }}
                style={styles.recipeImage}
              />
              <Text style={styles.recipeTitle} numberOfLines={2}>
                {item.recipeTitle}
              </Text>
            </View>
          </View>
          {!item.isRead && <View style={styles.unreadDot} />}
        </Pressable>
      );
    },
    [handleNotificationPress]
  );

  const handleRefresh = useCallback(async () => {
    await checkForNewRecipes();
  }, [checkForNewRecipes]);

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
          <Bell size={22} color={Colors.primary} />
          <Text style={styles.sheetTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {notifications.length > 0 && (
            <>
              <Pressable
                onPress={markAllAsRead}
                style={styles.headerButton}
                hitSlop={8}
              >
                <CheckCheck size={20} color={Colors.textSecondary} />
              </Pressable>
              <Pressable
                onPress={clearNotifications}
                style={styles.headerButton}
                hitSlop={8}
              >
                <Trash2 size={20} color={Colors.textSecondary} />
              </Pressable>
            </>
          )}
          <Pressable onPress={closeSheet} style={styles.closeButton}>
            <X size={22} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isCheckingForNew}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <ChefHat size={48} color={Colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtext}>
                When people you follow post new recipes, you&apos;ll see them here
              </Text>
            </View>
          }
        />
      )}
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
    paddingTop: Spacing.sm,
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
  unreadBadge: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontWeight: '700' as const,
    fontSize: 11,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  closeButton: {
    padding: Spacing.xs,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    position: 'relative',
  },
  notificationItemUnread: {
    backgroundColor: Colors.primary + '08',
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    borderBottomWidth: 0,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  userName: {
    ...Typography.bodyBold,
    color: Colors.text,
    flex: 1,
  },
  timeAgo: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  notificationText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  recipePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  recipeImage: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
  },
  recipeTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    flex: 1,
    fontSize: 13,
  },
  unreadDot: {
    position: 'absolute',
    top: Spacing.md + 4,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: Spacing.md,
    textAlign: 'center' as const,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: Spacing.sm,
  },
});
