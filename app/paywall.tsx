import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check, Crown, ChefHat, Sparkles, Zap } from 'lucide-react-native';
import { PurchasesPackage } from 'react-native-purchases';
import Colors, { Spacing, Typography, BorderRadius } from '@/constants/colors';
import { useSubscription } from '@/contexts/SubscriptionContext';
import Button from '@/components/Button';

const BASIC_FEATURES = [
  'Unlimited recipe saves',
  'Weekly meal planning',
  'Shopping list generator',
  'Basic nutritional info',
];

const PRO_FEATURES = [
  'Everything in Basic',
  'AI Chef recommendations',
  'Advanced meal planning',
  'Recipe scaling & conversion',
  'Priority support',
  'Ad-free experience',
];

export default function PaywallScreen() {
  const router = useRouter();
  const {
    currentOffering,
    isLoadingOfferings,
    isPurchasing,
    isRestoring,
    purchasePackage,
    restorePurchases,
    hasBasicAccess,
    hasProAccess,
  } = useSubscription();

  const basicPackage = currentOffering?.availablePackages.find(
    (pkg) => pkg.identifier === 'basic'
  );
  const proPackage = currentOffering?.availablePackages.find(
    (pkg) => pkg.identifier === 'pro'
  );

  const handlePurchase = useCallback(async (pkg: PurchasesPackage) => {
    try {
      await purchasePackage(pkg);
      router.back();
    } catch (error) {
      console.log('[Paywall] Purchase cancelled or failed');
    }
  }, [purchasePackage, router]);

  const handleRestore = useCallback(async () => {
    await restorePurchases();
  }, [restorePurchases]);

  const renderFeature = (feature: string, index: number) => (
    <View key={index} style={styles.featureRow}>
      <Check size={18} color={Colors.primary} />
      <Text style={styles.featureText}>{feature}</Text>
    </View>
  );

  if (isLoadingOfferings) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary + '20', Colors.background]}
        style={styles.gradient}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Crown size={28} color={Colors.primary} />
          </View>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color={Colors.text} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Unlock Premium</Text>
            <Text style={styles.heroSubtitle}>
              Get the most out of your cooking journey with our premium features
            </Text>
          </View>

          <View style={styles.plansContainer}>
            <Pressable
              style={[
                styles.planCard,
                hasBasicAccess && styles.planCardActive,
              ]}
              onPress={() => basicPackage && handlePurchase(basicPackage)}
              disabled={isPurchasing || hasBasicAccess}
            >
              <View style={styles.planHeader}>
                <View style={styles.planIconContainer}>
                  <ChefHat size={24} color={Colors.secondary} />
                </View>
                <Text style={styles.planName}>Basic</Text>
                {hasBasicAccess && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                )}
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>$5</Text>
                <Text style={styles.period}>/month</Text>
              </View>
              <View style={styles.featuresContainer}>
                {BASIC_FEATURES.map(renderFeature)}
              </View>
              {!hasBasicAccess && (
                <View style={styles.selectButton}>
                  <Text style={styles.selectButtonText}>
                    {isPurchasing ? 'Processing...' : 'Get Basic'}
                  </Text>
                </View>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.planCard,
                styles.planCardPro,
                hasProAccess && styles.planCardActive,
              ]}
              onPress={() => proPackage && handlePurchase(proPackage)}
              disabled={isPurchasing || hasProAccess}
            >
              <View style={styles.popularBadge}>
                <Sparkles size={12} color={Colors.textOnPrimary} />
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
              <View style={styles.planHeader}>
                <View style={[styles.planIconContainer, styles.proIconContainer]}>
                  <Zap size={24} color={Colors.primary} />
                </View>
                <Text style={styles.planName}>Pro</Text>
                {hasProAccess && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                )}
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>$15</Text>
                <Text style={styles.period}>/month</Text>
              </View>
              <View style={styles.featuresContainer}>
                {PRO_FEATURES.map(renderFeature)}
              </View>
              {!hasProAccess && (
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.proButton}
                >
                  <Text style={styles.proButtonText}>
                    {isPurchasing ? 'Processing...' : 'Get Pro'}
                  </Text>
                </LinearGradient>
              )}
            </Pressable>
          </View>

          <View style={styles.restoreSection}>
            <Pressable
              onPress={handleRestore}
              disabled={isRestoring}
              style={styles.restoreButton}
            >
              <Text style={styles.restoreText}>
                {isRestoring ? 'Restoring...' : 'Restore Purchases'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.termsSection}>
            <Text style={styles.termsText}>
              Subscriptions automatically renew unless cancelled at least 24 hours before
              the end of the current period. You can manage and cancel your subscriptions
              in your account settings.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  heroSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  heroTitle: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center' as const,
  },
  heroSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    maxWidth: 280,
  },
  plansContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  planCardPro: {
    borderColor: Colors.primary,
  },
  planCardActive: {
    borderColor: Colors.success,
    backgroundColor: Colors.success + '10',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  popularText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontWeight: '600' as const,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  planIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proIconContainer: {
    backgroundColor: Colors.primary + '20',
  },
  planName: {
    ...Typography.h2,
    color: Colors.text,
    flex: 1,
  },
  activeBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  activeBadgeText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontWeight: '600' as const,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.lg,
  },
  price: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  period: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  featuresContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  selectButton: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  selectButtonText: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  proButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  proButtonText: {
    ...Typography.bodyBold,
    color: Colors.textOnPrimary,
  },
  restoreSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  restoreButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  restoreText: {
    ...Typography.body,
    color: Colors.primary,
  },
  termsSection: {
    paddingHorizontal: Spacing.xl,
  },
  termsText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 18,
  },
});
