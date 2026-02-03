import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types/recipe';
import { supabase } from '@/lib/supabase';

interface RecipeWithAuthor {
  id: string;
  title: string;
  image_url: string;
  author_id: string;
  created_at: string;
  users: { display_name: string; avatar_url: string | null } | null;
}

const NOTIFICATIONS_KEY = 'user_notifications';
const MUTED_USERS_KEY = 'muted_users';
const NOTIFIED_RECIPES_KEY = 'notified_recipes';
const LAST_CHECK_KEY = 'last_notification_check';

export const [NotificationProvider, useNotifications] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const notificationsQuery = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('[Notifications] Fetching notifications for user:', user.id);
      const stored = await AsyncStorage.getItem(`${NOTIFICATIONS_KEY}_${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored) as Notification[];
        console.log('[Notifications] Found', parsed.length, 'notifications');
        return parsed;
      }
      return [];
    },
    enabled: !!user?.id,
  });

  const mutedUsersQuery = useQuery({
    queryKey: ['mutedUsers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('[Notifications] Fetching muted users for user:', user.id);
      const stored = await AsyncStorage.getItem(`${MUTED_USERS_KEY}_${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        console.log('[Notifications] Found', parsed.length, 'muted users');
        return parsed;
      }
      return [];
    },
    enabled: !!user?.id,
  });

  const notifiedRecipesQuery = useQuery({
    queryKey: ['notifiedRecipes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const stored = await AsyncStorage.getItem(`${NOTIFIED_RECIPES_KEY}_${user.id}`);
      return stored ? JSON.parse(stored) as string[] : [];
    },
    enabled: !!user?.id,
  });

  const addNotificationMutation = useMutation({
    mutationFn: async (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const mutedUsers = mutedUsersQuery.data || [];
      if (mutedUsers.includes(notification.fromUserId)) {
        console.log('[Notifications] User is muted, skipping notification');
        return null;
      }

      const newNotification: Notification = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      const currentNotifications = notificationsQuery.data || [];
      const updatedNotifications = [newNotification, ...currentNotifications].slice(0, 50);

      await AsyncStorage.setItem(
        `${NOTIFICATIONS_KEY}_${user.id}`,
        JSON.stringify(updatedNotifications)
      );

      console.log('[Notifications] Added notification:', newNotification.id);
      return newNotification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const currentNotifications = notificationsQuery.data || [];
      const updatedNotifications = currentNotifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      );

      await AsyncStorage.setItem(
        `${NOTIFICATIONS_KEY}_${user.id}`,
        JSON.stringify(updatedNotifications)
      );

      console.log('[Notifications] Marked as read:', notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const currentNotifications = notificationsQuery.data || [];
      const updatedNotifications = currentNotifications.map((n) => ({ ...n, isRead: true }));

      await AsyncStorage.setItem(
        `${NOTIFICATIONS_KEY}_${user.id}`,
        JSON.stringify(updatedNotifications)
      );

      console.log('[Notifications] Marked all as read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const clearNotificationsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      await AsyncStorage.setItem(`${NOTIFICATIONS_KEY}_${user.id}`, JSON.stringify([]));
      console.log('[Notifications] Cleared all notifications');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const toggleMuteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const currentMuted = mutedUsersQuery.data || [];
      const isMuted = currentMuted.includes(userId);

      let updatedMuted: string[];
      if (isMuted) {
        updatedMuted = currentMuted.filter((id) => id !== userId);
        console.log('[Notifications] Unmuted user:', userId);
      } else {
        updatedMuted = [...currentMuted, userId];
        console.log('[Notifications] Muted user:', userId);
      }

      await AsyncStorage.setItem(
        `${MUTED_USERS_KEY}_${user.id}`,
        JSON.stringify(updatedMuted)
      );

      return !isMuted;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mutedUsers', user?.id] });
    },
  });

  const checkForNewRecipesMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return [];

      console.log('[Notifications] Checking for new recipes from followed users...');

      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (!followingData || followingData.length === 0) {
        console.log('[Notifications] Not following anyone');
        return [];
      }

      const followingIds = followingData.map((f: { following_id: string }) => f.following_id);
      const mutedUsers = mutedUsersQuery.data || [];
      const activeFollowing = followingIds.filter(id => !mutedUsers.includes(id));

      if (activeFollowing.length === 0) {
        console.log('[Notifications] All followed users are muted');
        return [];
      }

      const lastCheckStr = await AsyncStorage.getItem(`${LAST_CHECK_KEY}_${user.id}`);
      const lastCheck = lastCheckStr ? new Date(lastCheckStr) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const { data: newRecipes, error } = await supabase
        .from('recipes')
        .select(`
          id,
          title,
          image_url,
          author_id,
          created_at,
          users!recipes_author_id_fkey(display_name, avatar_url)
        `)
        .in('author_id', activeFollowing)
        .gt('created_at', lastCheck.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Notifications] Error fetching new recipes:', error);
        return [];
      }

      const notifiedRecipes = [...(notifiedRecipesQuery.data || [])];
      const currentNotifications = notificationsQuery.data || [];
      const newNotifications: Notification[] = [];

      const recipes = (newRecipes || []) as unknown as RecipeWithAuthor[];
      for (const recipe of recipes) {
        if (notifiedRecipes.includes(recipe.id)) continue;
        if (recipe.author_id === user.id) continue;

        const authorInfo = recipe.users;
        
        const notification: Notification = {
          id: `notif_${recipe.id}_${Date.now()}`,
          type: 'new_recipe',
          fromUserId: recipe.author_id,
          fromUserName: authorInfo?.display_name || 'Unknown User',
          fromUserAvatar: authorInfo?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          recipeImageUrl: recipe.image_url,
          isRead: false,
          createdAt: recipe.created_at,
        };

        newNotifications.push(notification);
        notifiedRecipes.push(recipe.id);
      }

      if (newNotifications.length > 0) {
        const updatedNotifications = [...newNotifications, ...currentNotifications].slice(0, 50);
        await AsyncStorage.setItem(
          `${NOTIFICATIONS_KEY}_${user.id}`,
          JSON.stringify(updatedNotifications)
        );
        await AsyncStorage.setItem(
          `${NOTIFIED_RECIPES_KEY}_${user.id}`,
          JSON.stringify(notifiedRecipes.slice(-200))
        );
        console.log('[Notifications] Added', newNotifications.length, 'new notifications');
      }

      await AsyncStorage.setItem(`${LAST_CHECK_KEY}_${user.id}`, new Date().toISOString());

      return newNotifications;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifiedRecipes', user?.id] });
    },
  });

  const { mutateAsync: addNotificationAsync } = addNotificationMutation;
  const { mutate: markAsReadMutate } = markAsReadMutation;
  const { mutate: markAllAsReadMutate } = markAllAsReadMutation;
  const { mutate: clearNotificationsMutate } = clearNotificationsMutation;
  const { mutate: toggleMuteUserMutate } = toggleMuteUserMutation;
  const { mutateAsync: checkForNewRecipesAsync } = checkForNewRecipesMutation;

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
      return addNotificationAsync(notification);
    },
    [addNotificationAsync]
  );

  const markAsRead = useCallback(
    (notificationId: string) => {
      markAsReadMutate(notificationId);
    },
    [markAsReadMutate]
  );

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutate();
  }, [markAllAsReadMutate]);

  const clearNotifications = useCallback(() => {
    clearNotificationsMutate();
  }, [clearNotificationsMutate]);

  const toggleMuteUser = useCallback(
    (userId: string) => {
      toggleMuteUserMutate(userId);
    },
    [toggleMuteUserMutate]
  );

  const checkForNewRecipes = useCallback(() => {
    return checkForNewRecipesAsync();
  }, [checkForNewRecipesAsync]);

  useEffect(() => {
    if (user?.id) {
      checkForNewRecipesAsync().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const isUserMuted = useCallback(
    (userId: string) => {
      return mutedUsersQuery.data?.includes(userId) || false;
    },
    [mutedUsersQuery.data]
  );

  const notifications = useMemo(() => notificationsQuery.data || [], [notificationsQuery.data]);
  const mutedUsers = useMemo(() => mutedUsersQuery.data || [], [mutedUsersQuery.data]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const isLoading = notificationsQuery.isLoading || mutedUsersQuery.isLoading;
  const isCheckingForNew = checkForNewRecipesMutation.isPending;

  return {
    notifications,
    mutedUsers,
    unreadCount,
    isLoading,
    isCheckingForNew,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    toggleMuteUser,
    isUserMuted,
    checkForNewRecipes,
  };
});
