import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { mockUsers, userRecipes, CURRENT_USER_ID } from '@/mocks/users';
import { User, SharedRecipe } from '@/types/recipe';

const FOLLOWING_KEY = 'culinaria_following';
const FOLLOWERS_KEY = 'culinaria_followers';
const SHARED_RECIPES_KEY = 'culinaria_shared_recipes';
const USER_PROFILE_KEY = 'culinaria_user_profile';

export const [SocialProvider, useSocial] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [following, setFollowing] = useState<string[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [sharedRecipes, setSharedRecipes] = useState<SharedRecipe[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<User>(mockUsers[0]);

  const followingQuery = useQuery({
    queryKey: ['following'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(FOLLOWING_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const followersQuery = useQuery({
    queryKey: ['followers'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(FOLLOWERS_KEY);
      return stored ? JSON.parse(stored) : ['user_1', 'user_3'];
    },
  });

  const sharedRecipesQuery = useQuery({
    queryKey: ['sharedRecipes'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(SHARED_RECIPES_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const userProfileQuery = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(USER_PROFILE_KEY);
      return stored ? JSON.parse(stored) : mockUsers[0];
    },
  });

  useEffect(() => {
    if (followingQuery.data) setFollowing(followingQuery.data);
  }, [followingQuery.data]);

  useEffect(() => {
    if (followersQuery.data) setFollowers(followersQuery.data);
  }, [followersQuery.data]);

  useEffect(() => {
    if (sharedRecipesQuery.data) setSharedRecipes(sharedRecipesQuery.data);
  }, [sharedRecipesQuery.data]);

  useEffect(() => {
    if (userProfileQuery.data) setCurrentUserProfile(userProfileQuery.data);
  }, [userProfileQuery.data]);

  const saveFollowingMutation = useMutation({
    mutationFn: async (newFollowing: string[]) => {
      await AsyncStorage.setItem(FOLLOWING_KEY, JSON.stringify(newFollowing));
      return newFollowing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });

  const saveFollowersMutation = useMutation({
    mutationFn: async (newFollowers: string[]) => {
      await AsyncStorage.setItem(FOLLOWERS_KEY, JSON.stringify(newFollowers));
      return newFollowers;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followers'] });
    },
  });

  const saveSharedRecipesMutation = useMutation({
    mutationFn: async (recipes: SharedRecipe[]) => {
      await AsyncStorage.setItem(SHARED_RECIPES_KEY, JSON.stringify(recipes));
      return recipes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedRecipes'] });
    },
  });

  const saveUserProfileMutation = useMutation({
    mutationFn: async (profile: User) => {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });

  const toggleFollow = useCallback((userId: string) => {
    setFollowing((prev) => {
      const isFollowing = prev.includes(userId);
      const newFollowing = isFollowing
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];
      saveFollowingMutation.mutate(newFollowing);
      
      setCurrentUserProfile((profile) => {
        const updatedProfile = {
          ...profile,
          followingCount: newFollowing.length,
        };
        saveUserProfileMutation.mutate(updatedProfile);
        return updatedProfile;
      });
      
      return newFollowing;
    });
  }, []);

  const isFollowing = useCallback((userId: string) => {
    return following.includes(userId);
  }, [following]);

  const shareRecipe = useCallback((recipeId: string, toUserIds: string[], message?: string) => {
    const newShares: SharedRecipe[] = toUserIds.map((toUserId) => ({
      id: `share_${Date.now()}_${toUserId}`,
      recipeId,
      fromUserId: CURRENT_USER_ID,
      toUserId,
      message,
      sharedAt: new Date().toISOString(),
    }));
    
    setSharedRecipes((prev) => {
      const updated = [...newShares, ...prev];
      saveSharedRecipesMutation.mutate(updated);
      return updated;
    });
    
    return newShares;
  }, []);

  const getReceivedShares = useCallback(() => {
    return sharedRecipes.filter((share) => share.toUserId === CURRENT_USER_ID);
  }, [sharedRecipes]);

  const getSentShares = useCallback(() => {
    return sharedRecipes.filter((share) => share.fromUserId === CURRENT_USER_ID);
  }, [sharedRecipes]);

  const updateProfile = useCallback((updates: Partial<User>) => {
    setCurrentUserProfile((prev) => {
      const updated = { ...prev, ...updates };
      saveUserProfileMutation.mutate(updated);
      return updated;
    });
  }, []);

  const allUsers = useMemo(() => {
    return mockUsers.filter((user) => user.id !== CURRENT_USER_ID);
  }, []);

  const getUserById = useCallback((userId: string) => {
    if (userId === CURRENT_USER_ID) return currentUserProfile;
    return mockUsers.find((user) => user.id === userId);
  }, [currentUserProfile]);

  const getUserRecipes = useCallback((userId: string) => {
    return userRecipes[userId] || [];
  }, []);

  const searchUsers = useCallback((query: string) => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return allUsers.filter(
      (user) =>
        user.username.toLowerCase().includes(lowerQuery) ||
        user.displayName.toLowerCase().includes(lowerQuery)
    );
  }, [allUsers]);

  const getFollowingUsers = useMemo(() => {
    return following
      .map((id) => mockUsers.find((user) => user.id === id))
      .filter(Boolean) as User[];
  }, [following]);

  const getFollowersUsers = useMemo(() => {
    return followers
      .map((id) => mockUsers.find((user) => user.id === id))
      .filter(Boolean) as User[];
  }, [followers]);

  const getSuggestedUsers = useMemo(() => {
    return allUsers
      .filter((user) => !following.includes(user.id))
      .sort((a, b) => b.followersCount - a.followersCount)
      .slice(0, 5);
  }, [allUsers, following]);

  const isLoading = followingQuery.isLoading || followersQuery.isLoading || sharedRecipesQuery.isLoading;

  return {
    currentUser: currentUserProfile,
    following,
    followers,
    sharedRecipes,
    allUsers,
    isLoading,
    toggleFollow,
    isFollowing,
    shareRecipe,
    getReceivedShares,
    getSentShares,
    updateProfile,
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
