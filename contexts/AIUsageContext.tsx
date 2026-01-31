import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscription } from './SubscriptionContext';

const AI_USAGE_KEY = 'ai_usage_data';
const COST_PER_GENERATION = 0.08;

export const USAGE_LIMITS = {
  basic: 1.10,
  pro: 4.00,
  free: 0.16,
} as const;

interface AIUsageData {
  month: string;
  totalSpent: number;
  generations: number;
  lastUpdated: string;
}

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getDefaultUsageData = (): AIUsageData => ({
  month: getCurrentMonth(),
  totalSpent: 0,
  generations: 0,
  lastUpdated: new Date().toISOString(),
});

export const [AIUsageProvider, useAIUsage] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { hasBasicAccess, hasProAccess } = useSubscription();

  const usageQuery = useQuery({
    queryKey: ['aiUsage'],
    queryFn: async (): Promise<AIUsageData> => {
      try {
        const stored = await AsyncStorage.getItem(AI_USAGE_KEY);
        if (stored) {
          const data: AIUsageData = JSON.parse(stored);
          const currentMonth = getCurrentMonth();
          if (data.month !== currentMonth) {
            console.log('[AIUsage] New month detected, resetting usage');
            const newData = getDefaultUsageData();
            await AsyncStorage.setItem(AI_USAGE_KEY, JSON.stringify(newData));
            return newData;
          }
          return data;
        }
        const defaultData = getDefaultUsageData();
        await AsyncStorage.setItem(AI_USAGE_KEY, JSON.stringify(defaultData));
        return defaultData;
      } catch (error) {
        console.error('[AIUsage] Error loading usage data:', error);
        return getDefaultUsageData();
      }
    },
    staleTime: 1000 * 60,
  });

  const recordUsageMutation = useMutation({
    mutationFn: async (): Promise<AIUsageData> => {
      const currentData = usageQuery.data || getDefaultUsageData();
      const currentMonth = getCurrentMonth();
      
      let updatedData: AIUsageData;
      if (currentData.month !== currentMonth) {
        updatedData = {
          month: currentMonth,
          totalSpent: COST_PER_GENERATION,
          generations: 1,
          lastUpdated: new Date().toISOString(),
        };
      } else {
        updatedData = {
          ...currentData,
          totalSpent: currentData.totalSpent + COST_PER_GENERATION,
          generations: currentData.generations + 1,
          lastUpdated: new Date().toISOString(),
        };
      }
      
      await AsyncStorage.setItem(AI_USAGE_KEY, JSON.stringify(updatedData));
      console.log('[AIUsage] Usage recorded:', updatedData);
      return updatedData;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['aiUsage'], data);
    },
  });

  const usageLimit = useMemo(() => {
    if (hasProAccess) return USAGE_LIMITS.pro;
    if (hasBasicAccess) return USAGE_LIMITS.basic;
    return USAGE_LIMITS.free;
  }, [hasBasicAccess, hasProAccess]);

  const currentUsage = usageQuery.data?.totalSpent ?? 0;
  const remainingBudget = Math.max(0, usageLimit - currentUsage);
  const usagePercentage = Math.min(100, (currentUsage / usageLimit) * 100);
  const canUseAI = remainingBudget >= COST_PER_GENERATION;
  const generationsRemaining = Math.floor(remainingBudget / COST_PER_GENERATION);

  const { mutateAsync: recordUsageMutateAsync } = recordUsageMutation;

  const recordUsage = useCallback(async () => {
    return recordUsageMutateAsync();
  }, [recordUsageMutateAsync]);

  const refreshUsage = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['aiUsage'] });
  }, [queryClient]);

  const subscriptionTier = useMemo(() => {
    if (hasProAccess) return 'pro' as const;
    if (hasBasicAccess) return 'basic' as const;
    return 'free' as const;
  }, [hasBasicAccess, hasProAccess]);

  return {
    isLoading: usageQuery.isLoading,
    currentUsage,
    usageLimit,
    remainingBudget,
    usagePercentage,
    canUseAI,
    generationsRemaining,
    generationsUsed: usageQuery.data?.generations ?? 0,
    costPerGeneration: COST_PER_GENERATION,
    subscriptionTier,
    recordUsage,
    refreshUsage,
    isRecording: recordUsageMutation.isPending,
  };
});
