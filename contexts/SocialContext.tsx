import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { User, SharedRecipe } from '@/types/recipe';
import { mockUsers } from '@/mocks/users';

const isSupabaseConfigured = !!(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

interface DbUser {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  joined_at: string;
}

interface DbSharedRecipe {
  id: string;
  recipe_id: string;
  from_user_id: string;
  to_user_id: string;
  message: string | null;
  shared_at: string;
}

const LOCAL_FOLLOWING_KEY = 'local_following';

export const [SocialProvider, useSocial] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const [localFollowing, setLocalFollowing] = useState<string[]>([]);

  // Load local following from AsyncStorage
  useEffect(() => {
    const loadLocalFollowing = async () => {
      try {
        const stored = await AsyncStorage.getItem(LOCAL_FOLLOWING_KEY);
        if (stored) {
          setLocalFollowing(JSON.parse(stored));
        }
      } catch (err) {
        console.error('[Social] Error loading local following:', err);
      }
    };
    loadLocalFollowing();
  }, []);

  const saveLocalFollowing = async (following: string[]) => {
    try {
      await AsyncStorage.setItem(LOCAL_FOLLOWING_KEY, JSON.stringify(following));
    } catch (err) {
      console.error('[Social] Error saving local following:', err);
    }
  };

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        console.log('[Social] Supabase not configured, using mock users');
        return mockUsers.filter(u => u.id !== 'user_current');
      }

      try {
        console.log('[Social] Fetching all users...');
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('display_name');

        if (error) {
          console.error('[Social] Error fetching users:', error.message || JSON.stringify(error));
          console.log('[Social] Falling back to mock users');
          return mockUsers.filter(u => u.id !== 'user_current');
        }

        if (!data || data.length === 0) {
          console.log('[Social] No users found, using mock users');
          return mockUsers.filter(u => u.id !== 'user_current');
        }

        const usersWithCounts = await Promise.all(
          ((data || []) as DbUser[]).map(async (u) => {
            const [recipesCount, followersCount, followingCount] = await Promise.all([
              supabase.from('recipes').select('id', { count: 'exact', head: true }).eq('author_id', u.id),
              supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', u.id),
              supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', u.id),
            ]);

            return {
              id: u.id,
              username: u.username,
              displayName: u.display_name,
              avatarUrl: u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
              bio: u.bio || '',
              recipesCount: recipesCount.count || 0,
              followersCount: followersCount.count || 0,
              followingCount: followingCount.count || 0,
              isVerified: u.is_verified,
              joinedAt: u.joined_at,
            } as User;
          })
        );

        console.log('[Social] Fetched', usersWithCounts.length, 'users');
        return usersWithCounts;
      } catch (err) {
        console.error('[Social] Network error fetching users:', err);
        console.log('[Social] Falling back to mock users');
        return mockUsers.filter(u => u.id !== 'user_current');
      }
    },
  });

  const followingQuery = useQuery({
    queryKey: ['following', user?.id],
    queryFn: async () => {
      if (!isSupabaseConfigured || !user?.id) {
        console.log('[Social] Using local following state');
        return localFollowing;
      }
      
      console.log('[Social] Fetching following for user:', user.id);
      try {
        const { data, error } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        if (error) {
          console.error('[Social] Error fetching following:', error);
          return localFollowing;
        }

        return (data || []).map((f: { following_id: string }) => f.following_id);
      } catch (err) {
        console.error('[Social] Network error fetching following:', err);
        return localFollowing;
      }
    },
  });

  const followersQuery = useQuery({
    queryKey: ['followers', user?.id],
    queryFn: async () => {
      if (!isSupabaseConfigured || !user?.id) {
        console.log('[Social] Using empty followers (local mode)');
        return [];
      }
      
      console.log('[Social] Fetching followers for user:', user.id);
      try {
        const { data, error } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', user.id);

        if (error) {
          console.error('[Social] Error fetching followers:', error);
          return [];
        }

        return (data || []).map((f: { follower_id: string }) => f.follower_id);
      } catch (err) {
        console.error('[Social] Network error fetching followers:', err);
        return [];
      }
    },
  });

  const sharedRecipesQuery = useQuery({
    queryKey: ['sharedRecipes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('[Social] Fetching shared recipes for user:', user.id);
      const { data, error } = await supabase
        .from('shared_recipes')
        .select('*')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('shared_at', { ascending: false });

      if (error) {
        console.error('[Social] Error fetching shared recipes:', error);
        throw error;
      }

      return ((data || []) as DbSharedRecipe[]).map((s): SharedRecipe => ({
        id: s.id,
        recipeId: s.recipe_id,
        fromUserId: s.from_user_id,
        toUserId: s.to_user_id,
        message: s.message || undefined,
        sharedAt: s.shared_at,
      }));
    },
    enabled: !!user?.id,
  });

  const toggleFollowMutation = useMutation({
    mutationFn: async (userId: string) => {
      const isCurrentlyFollowing = localFollowing.includes(userId);
      console.log('[Social] toggleFollow called for:', userId, 'currently following:', isCurrentlyFollowing);

      // Handle local-only mode (no Supabase or not authenticated)
      if (!isSupabaseConfigured || !user?.id) {
        console.log('[Social] Using local follow state for user:', userId);
        let newFollowing: string[];
        if (isCurrentlyFollowing) {
          console.log('[Social] Locally unfollowing user:', userId);
          newFollowing = localFollowing.filter(id => id !== userId);
        } else {
          console.log('[Social] Locally following user:', userId);
          newFollowing = [...localFollowing, userId];
        }
        console.log('[Social] New following list:', newFollowing);
        return { newFollowing, isLocal: true, userId };
      }

      if (isCurrentlyFollowing) {
        console.log('[Social] Unfollowing user:', userId);
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;
      } else {
        console.log('[Social] Following user:', userId);
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: userId } as any);

        if (error) throw error;
      }
      return { isLocal: false, userId };
    },
    onSuccess: (result) => {
      if (result?.isLocal && result.newFollowing) {
        console.log('[Social] Updating local following state:', result.newFollowing);
        setLocalFollowing(result.newFollowing);
        saveLocalFollowing(result.newFollowing);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const shareRecipeMutation = useMutation({
    mutationFn: async ({ recipeId, toUserIds, message }: { 
      recipeId: string; 
      toUserIds: string[]; 
      message?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      console.log('[Social] Sharing recipe:', recipeId, 'to', toUserIds.length, 'users');
      const { error } = await supabase
        .from('shared_recipes')
        .insert(
          toUserIds.map((toUserId) => ({
            recipe_id: recipeId,
            from_user_id: user.id,
            to_user_id: toUserId,
            message,
          })) as any
        );

      if (error) throw error;
      console.log('[Social] Recipe shared successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedRecipes', user?.id] });
    },
  });

  const { mutate: toggleFollowMutate } = toggleFollowMutation;
  const { mutate: shareRecipeMutate } = shareRecipeMutation;

  const toggleFollow = useCallback((userId: string) => {
    toggleFollowMutate(userId);
  }, [toggleFollowMutate]);

  const isFollowing = useCallback((userId: string) => {
    // Prioritize localFollowing for local mode to ensure immediate UI updates
    if (!isSupabaseConfigured || !user?.id) {
      const result = localFollowing.includes(userId);
      console.log('[Social] isFollowing (local):', userId, result, 'localFollowing:', localFollowing);
      return result;
    }
    const followingData = followingQuery.data || [];
    const result = followingData.includes(userId);
    console.log('[Social] isFollowing (remote):', userId, result);
    return result;
  }, [followingQuery.data, localFollowing, user?.id]);

  const shareRecipe = useCallback((recipeId: string, toUserIds: string[], message?: string) => {
    shareRecipeMutate({ recipeId, toUserIds, message });
    return [];
  }, [shareRecipeMutate]);

  const getReceivedShares = useCallback(() => {
    return sharedRecipesQuery.data?.filter((share) => share.toUserId === user?.id) || [];
  }, [sharedRecipesQuery.data, user?.id]);

  const getSentShares = useCallback(() => {
    return sharedRecipesQuery.data?.filter((share) => share.fromUserId === user?.id) || [];
  }, [sharedRecipesQuery.data, user?.id]);

  const getUserById = useCallback((userId: string) => {
    if (userId === user?.id) return profile;
    return usersQuery.data?.find((u) => u.id === userId);
  }, [usersQuery.data, user?.id, profile]);

  const getUserRecipes = useCallback((_userId: string) => {
    return [];
  }, []);

  const searchUsers = useCallback((query: string) => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return (usersQuery.data || []).filter(
      (u) =>
        u.id !== user?.id &&
        (u.username.toLowerCase().includes(lowerQuery) ||
          u.displayName.toLowerCase().includes(lowerQuery))
    );
  }, [usersQuery.data, user?.id]);

  const allUsers = useMemo(() => {
    return (usersQuery.data || []).filter((u) => u.id !== user?.id);
  }, [usersQuery.data, user?.id]);

  const getFollowingUsers = useMemo(() => {
    const followingIds = followingQuery.data || localFollowing;
    return (usersQuery.data || []).filter((u) => followingIds.includes(u.id));
  }, [usersQuery.data, followingQuery.data, localFollowing]);

  const getFollowersUsers = useMemo(() => {
    const followerIds = followersQuery.data || [];
    return (usersQuery.data || []).filter((u) => followerIds.includes(u.id));
  }, [usersQuery.data, followersQuery.data]);

  const getSuggestedUsers = useMemo(() => {
    const followingIds = followingQuery.data || localFollowing;
    return allUsers
      .filter((u) => !followingIds.includes(u.id))
      .sort((a, b) => b.followersCount - a.followersCount)
      .slice(0, 5);
  }, [allUsers, followingQuery.data, localFollowing]);

  const isLoading = usersQuery.isLoading;
  const isLoadingUserData = followingQuery.isLoading || 
    followersQuery.isLoading || sharedRecipesQuery.isLoading;

  return {
    currentUser: profile,
    following: (!isSupabaseConfigured || !user?.id) ? localFollowing : (followingQuery.data || []),
    isFollowPending: toggleFollowMutation.isPending,
    followers: followersQuery.data || [],
    sharedRecipes: sharedRecipesQuery.data || [],
    allUsers,
    isLoading,
    isLoadingUserData,
    isLoadingUsers: usersQuery.isLoading,
    toggleFollow,
    isFollowing,
    shareRecipe,
    getReceivedShares,
    getSentShares,
    updateProfile: () => {},
    getUserById,
    getUserRecipes,
    searchUsers,
    getFollowingUsers,
    getFollowersUsers,
    getSuggestedUsers,
  };
});

export function useUserSearch(query: string) {
  const { searchUsers } = useSocial();
  return useMemo(() => searchUsers(query), [searchUsers, query]);
}
