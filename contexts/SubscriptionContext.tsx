import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import Purchases, { PurchasesOffering, CustomerInfo, PurchasesPackage } from 'react-native-purchases';

const getRCApiKey = () => {
  if (__DEV__ || Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY,
  });
};

const apiKey = getRCApiKey();
if (apiKey) {
  Purchases.configure({ apiKey });
  console.log('[RevenueCat] Configured with API key');
} else {
  console.warn('[RevenueCat] No API key found - purchases will not work');
}

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isConfigured, setIsConfigured] = useState(!!apiKey);

  const customerInfoQuery = useQuery({
    queryKey: ['customerInfo'],
    queryFn: async () => {
      if (!isConfigured) return null;
      try {
        const info = await Purchases.getCustomerInfo();
        console.log('[RevenueCat] Customer info fetched:', info.entitlements.active);
        return info;
      } catch (error) {
        console.error('[RevenueCat] Error fetching customer info:', error);
        return null;
      }
    },
    enabled: isConfigured,
    staleTime: 1000 * 60 * 5,
  });

  const offeringsQuery = useQuery({
    queryKey: ['offerings'],
    queryFn: async () => {
      if (!isConfigured) return null;
      try {
        const offerings = await Purchases.getOfferings();
        console.log('[RevenueCat] Offerings fetched:', offerings.current?.identifier);
        return offerings;
      } catch (error) {
        console.error('[RevenueCat] Error fetching offerings:', error);
        return null;
      }
    },
    enabled: isConfigured,
    staleTime: 1000 * 60 * 10,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packageToPurchase: PurchasesPackage) => {
      console.log('[RevenueCat] Purchasing package:', packageToPurchase.identifier);
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return customerInfo;
    },
    onSuccess: (customerInfo) => {
      console.log('[RevenueCat] Purchase successful');
      queryClient.setQueryData(['customerInfo'], customerInfo);
    },
    onError: (error: any) => {
      console.error('[RevenueCat] Purchase error:', error);
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', error.message || 'Something went wrong. Please try again.');
      }
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      console.log('[RevenueCat] Restoring purchases');
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    },
    onSuccess: (customerInfo) => {
      console.log('[RevenueCat] Restore successful');
      queryClient.setQueryData(['customerInfo'], customerInfo);
      const hasActive = Object.keys(customerInfo.entitlements.active).length > 0;
      Alert.alert(
        hasActive ? 'Purchases Restored' : 'No Purchases Found',
        hasActive
          ? 'Your subscription has been restored successfully.'
          : 'No previous purchases were found for this account.'
      );
    },
    onError: (error: any) => {
      console.error('[RevenueCat] Restore error:', error);
      Alert.alert('Restore Failed', error.message || 'Failed to restore purchases. Please try again.');
    },
  });

  const customerInfo = customerInfoQuery.data;
  const offerings = offeringsQuery.data;
  const currentOffering = offerings?.current;

  const hasBasicAccess = customerInfo?.entitlements.active['basic'] !== undefined;
  const hasProAccess = customerInfo?.entitlements.active['pro'] !== undefined;
  const isPremium = hasBasicAccess || hasProAccess;

  const purchasePackage = useCallback(async (pkg: PurchasesPackage) => {
    return purchaseMutation.mutateAsync(pkg);
  }, [purchaseMutation]);

  const restorePurchases = useCallback(async () => {
    return restoreMutation.mutateAsync();
  }, [restoreMutation]);

  const refreshCustomerInfo = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['customerInfo'] });
  }, [queryClient]);

  return {
    isConfigured,
    customerInfo,
    offerings,
    currentOffering,
    hasBasicAccess,
    hasProAccess,
    isPremium,
    isLoadingOfferings: offeringsQuery.isLoading,
    isLoadingCustomerInfo: customerInfoQuery.isLoading,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    purchasePackage,
    restorePurchases,
    refreshCustomerInfo,
  };
});
