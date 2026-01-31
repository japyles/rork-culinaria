import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AI_CACHE_KEY = 'ai_extraction_cache';
const CACHE_EXPIRY_DAYS = 30;

interface CachedExtraction {
  url: string;
  data: unknown;
  cachedAt: string;
  expiresAt: string;
}

interface AICacheData {
  extractions: Record<string, CachedExtraction>;
}

const getDefaultCacheData = (): AICacheData => ({
  extractions: {},
});

const normalizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url.trim().toLowerCase());
    urlObj.search = '';
    urlObj.hash = '';
    return urlObj.toString();
  } catch {
    return url.trim().toLowerCase();
  }
};

const isExpired = (expiresAt: string): boolean => {
  return new Date(expiresAt) < new Date();
};

export const [AICacheProvider, useAICache] = createContextHook(() => {
  const queryClient = useQueryClient();

  const cacheQuery = useQuery({
    queryKey: ['aiCache'],
    queryFn: async (): Promise<AICacheData> => {
      try {
        const stored = await AsyncStorage.getItem(AI_CACHE_KEY);
        if (stored) {
          const data: AICacheData = JSON.parse(stored);
          const cleanedExtractions: Record<string, CachedExtraction> = {};
          let hasExpired = false;
          
          Object.entries(data.extractions).forEach(([key, extraction]) => {
            if (!isExpired(extraction.expiresAt)) {
              cleanedExtractions[key] = extraction;
            } else {
              hasExpired = true;
              console.log('[AICache] Removing expired cache for:', key);
            }
          });
          
          if (hasExpired) {
            const cleanedData = { extractions: cleanedExtractions };
            await AsyncStorage.setItem(AI_CACHE_KEY, JSON.stringify(cleanedData));
            return cleanedData;
          }
          
          return data;
        }
        return getDefaultCacheData();
      } catch (error) {
        console.error('[AICache] Error loading cache:', error);
        return getDefaultCacheData();
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const addToCacheMutation = useMutation({
    mutationFn: async ({ url, data }: { url: string; data: unknown }): Promise<AICacheData> => {
      const normalizedUrl = normalizeUrl(url);
      const currentCache = cacheQuery.data || getDefaultCacheData();
      
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + CACHE_EXPIRY_DAYS);
      
      const newExtraction: CachedExtraction = {
        url: normalizedUrl,
        data,
        cachedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };
      
      const updatedCache: AICacheData = {
        extractions: {
          ...currentCache.extractions,
          [normalizedUrl]: newExtraction,
        },
      };
      
      await AsyncStorage.setItem(AI_CACHE_KEY, JSON.stringify(updatedCache));
      console.log('[AICache] Added to cache:', normalizedUrl);
      return updatedCache;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['aiCache'], data);
    },
  });

  const getCachedExtraction = useCallback(<T = unknown>(url: string): T | null => {
    const normalizedUrl = normalizeUrl(url);
    const cached = cacheQuery.data?.extractions[normalizedUrl];
    
    if (cached && !isExpired(cached.expiresAt)) {
      console.log('[AICache] Cache hit for:', normalizedUrl);
      return cached.data as T;
    }
    
    console.log('[AICache] Cache miss for:', normalizedUrl);
    return null;
  }, [cacheQuery.data]);

  const hasCachedExtraction = useCallback((url: string): boolean => {
    const normalizedUrl = normalizeUrl(url);
    const cached = cacheQuery.data?.extractions[normalizedUrl];
    return !!cached && !isExpired(cached.expiresAt);
  }, [cacheQuery.data]);

  const { mutateAsync: addToCacheMutateAsync } = addToCacheMutation;

  const addToCache = useCallback(async (url: string, data: unknown) => {
    return addToCacheMutateAsync({ url, data });
  }, [addToCacheMutateAsync]);

  const clearCacheMutation = useMutation({
    mutationFn: async (): Promise<AICacheData> => {
      const emptyCache = getDefaultCacheData();
      await AsyncStorage.setItem(AI_CACHE_KEY, JSON.stringify(emptyCache));
      console.log('[AICache] Cache cleared');
      return emptyCache;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['aiCache'], data);
    },
  });

  const { mutateAsync: clearCacheMutateAsync } = clearCacheMutation;

  const clearCache = useCallback(async () => {
    return clearCacheMutateAsync();
  }, [clearCacheMutateAsync]);

  const cacheSize = Object.keys(cacheQuery.data?.extractions || {}).length;

  return {
    isLoading: cacheQuery.isLoading,
    getCachedExtraction,
    hasCachedExtraction,
    addToCache,
    clearCache,
    cacheSize,
  };
});
