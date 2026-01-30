import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/recipe';

interface DbUser {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  joined_at: string;
  updated_at: string;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    console.log('[Auth] Initializing auth state...');
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[Auth] Initial session:', session ? 'exists' : 'none');
      setSession(session);
      setUser(session?.user ?? null);
      setIsInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[Auth] Auth state changed:', _event);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (_event === 'SIGNED_OUT') {
        queryClient.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const profileQuery = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('[Auth] Fetching profile for user:', user.id);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // If user not found in users table, return a default profile (expected for new signups)
        if (error.code === 'PGRST116') {
          console.log('[Auth] User not found in users table, returning default profile for new user');
          return {
            id: user.id,
            username: user.email?.split('@')[0] || 'user',
            displayName: user.email?.split('@')[0] || 'User',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
            bio: '',
            recipesCount: 0,
            followersCount: 0,
            followingCount: 0,
            isVerified: false,
            joinedAt: new Date().toISOString(),
          } as User;
        }
        throw error;
      }

      const dbUser = data as DbUser;

      const profile: User = {
        id: dbUser.id,
        username: dbUser.username,
        displayName: dbUser.display_name,
        avatarUrl: dbUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
        bio: dbUser.bio || '',
        recipesCount: 0,
        followersCount: 0,
        followingCount: 0,
        isVerified: dbUser.is_verified,
        joinedAt: dbUser.joined_at,
      };

      const [recipesCount, followersCount, followingCount] = await Promise.all([
        supabase.from('recipes').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', user.id),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', user.id),
      ]);

      profile.recipesCount = recipesCount.count || 0;
      profile.followersCount = followersCount.count || 0;
      profile.followingCount = followingCount.count || 0;

      console.log('[Auth] Profile loaded:', profile.displayName);
      return profile;
    },
    enabled: !!user?.id,
  });

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      console.log('[Auth] Signing in with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Auth] Sign in error:', error);
        throw error;
      }

      console.log('[Auth] Sign in successful');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      username, 
      displayName 
    }: { 
      email: string; 
      password: string; 
      username: string; 
      displayName: string;
    }) => {
      console.log('[Auth] Signing up with email:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName,
          },
        },
      });

      if (error) {
        console.error('[Auth] Sign up error:', error);
        throw error;
      }

      console.log('[Auth] Sign up successful');
      return data;
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      console.log('[Auth] Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[Auth] Sign out error:', error);
        throw error;
      }
      console.log('[Auth] Sign out successful');
    },
    onSuccess: () => {
      setSession(null);
      setUser(null);
      queryClient.clear();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      if (!user?.id) throw new Error('Not authenticated');

      console.log('[Auth] Updating profile:', updates);
      const { error } = await (supabase
        .from('users') as any)
        .update({
          display_name: updates.displayName,
          username: updates.username,
          avatar_url: updates.avatarUrl,
          bio: updates.bio,
        })
        .eq('id', user.id);

      if (error) {
        console.error('[Auth] Update profile error:', error);
        throw error;
      }

      console.log('[Auth] Profile updated successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      console.log('[Auth] Sending password reset email to:', email);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        console.error('[Auth] Reset password error:', error);
        throw error;
      }
      console.log('[Auth] Password reset email sent');
    },
  });

  const { mutateAsync: signInAsync } = signInMutation;
  const { mutateAsync: signUpAsync } = signUpMutation;
  const { mutateAsync: signOutAsync } = signOutMutation;
  const { mutateAsync: updateProfileAsync } = updateProfileMutation;
  const { mutateAsync: resetPasswordAsync } = resetPasswordMutation;

  const signIn = useCallback(
    (email: string, password: string) => signInAsync({ email, password }),
    [signInAsync]
  );

  const signUp = useCallback(
    (email: string, password: string, username: string, displayName: string) =>
      signUpAsync({ email, password, username, displayName }),
    [signUpAsync]
  );

  const signOut = useCallback(() => signOutAsync(), [signOutAsync]);

  const updateProfile = useCallback(
    (updates: Partial<User>) => updateProfileAsync(updates),
    [updateProfileAsync]
  );

  const resetPassword = useCallback(
    (email: string) => resetPasswordAsync(email),
    [resetPasswordAsync]
  );

  // Only show loading during initial auth check, not during profile fetch
  // This prevents the profile page from being stuck on "Loading..."
  const isLoading = isInitializing;
  const isProfileLoading = profileQuery.isLoading;
  const isAuthenticated = !!session && !!user;

  return {
    session,
    user,
    profile: profileQuery.data ?? null,
    isLoading,
    isProfileLoading,
    isAuthenticated,
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    profileError: profileQuery.error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    signInError: signInMutation.error,
    signUpError: signUpMutation.error,
  };
});
