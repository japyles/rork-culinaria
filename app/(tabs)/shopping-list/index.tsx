import React, { useRef, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
  Modal,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingCart, Check, X, Truck, ExternalLink, Copy, FileDown } from 'lucide-react-native';
import * as Print from 'expo-print';

import Colors, { Spacing, Typography, BorderRadius, Shadow } from '@/constants/colors';
import { useRecipes } from '@/contexts/RecipeContext';
import GlassCard from '@/components/GlassCard';
import Button from '@/components/Button';

export default function ShoppingListScreen() {
  const { 
    shoppingList, 
    toggleShoppingItem, 
    removeShoppingItem, 
    clearCheckedItems, 
    clearShoppingList 
  } = useRecipes();
  
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof shoppingList> = {};
    
    shoppingList.forEach((item) => {
      const key = item.recipeName || 'Other Items';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    
    return groups;
  }, [shoppingList]);

  const checkedCount = shoppingList.filter((item) => item.isChecked).length;
  const totalCount = shoppingList.length;
  const uncheckedItems = useMemo(() => 
    shoppingList.filter((item) => !item.isChecked), 
    [shoppingList]
  );

  const formatItemsForClipboard = (items: typeof shoppingList) => {
    return items.map((item) => `• ${item.amount} ${item.unit} ${item.name}`.trim()).join('\n');
  };

  const handleInstacart = async () => {
    setShowDeliveryModal(false);
    const items = uncheckedItems.length > 0 ? uncheckedItems : shoppingList;
    if (items.length === 0) {
      Alert.alert('Empty List', 'Add some items to your shopping list first.');
      return;
    }
    const searchTerms = items.map((item) => item.name).slice(0, 5).join(' ');
    const appUrl = `instacart://store/search?query=${encodeURIComponent(searchTerms)}`;
    const webUrl = `https://www.instacart.com/store/search_v3/search?search_term=${encodeURIComponent(searchTerms)}`;
    
    try {
      if (Platform.OS !== 'web') {
        const canOpen = await Linking.canOpenURL(appUrl);
        if (canOpen) {
          await Linking.openURL(appUrl);
          return;
        }
      }
      await Linking.openURL(webUrl);
    } catch (error) {
      console.log('Error opening Instacart:', error);
      try {
        await Linking.openURL(webUrl);
      } catch {
        Alert.alert('Error', 'Could not open Instacart. Please try again.');
      }
    }
  };

  const handleWalmart = async () => {
    setShowDeliveryModal(false);
    const items = uncheckedItems.length > 0 ? uncheckedItems : shoppingList;
    if (items.length === 0) {
      Alert.alert('Empty List', 'Add some items to your shopping list first.');
      return;
    }
    const searchTerms = items.map((item) => item.name).slice(0, 5).join(' ');
    const appUrl = `walmart://search?query=${encodeURIComponent(searchTerms)}`;
    const webUrl = `https://www.walmart.com/search?q=${encodeURIComponent(searchTerms)}`;
    
    try {
      if (Platform.OS !== 'web') {
        const canOpen = await Linking.canOpenURL(appUrl);
        if (canOpen) {
          await Linking.openURL(appUrl);
          return;
        }
      }
      await Linking.openURL(webUrl);
    } catch (error) {
      console.log('Error opening Walmart:', error);
      try {
        await Linking.openURL(webUrl);
      } catch {
        Alert.alert('Error', 'Could not open Walmart. Please try again.');
      }
    }
  };

  const handleAmazon = async () => {
    setShowDeliveryModal(false);
    const items = uncheckedItems.length > 0 ? uncheckedItems : shoppingList;
    if (items.length === 0) {
      Alert.alert('Empty List', 'Add some items to your shopping list first.');
      return;
    }
    const searchTerms = items.map((item) => item.name).slice(0, 5).join(' ');
    const appUrl = `amazon://amazonfresh/search?keywords=${encodeURIComponent(searchTerms)}`;
    const webUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchTerms)}&i=amazonfresh`;
    
    try {
      if (Platform.OS !== 'web') {
        const canOpen = await Linking.canOpenURL(appUrl);
        if (canOpen) {
          await Linking.openURL(appUrl);
          return;
        }
      }
      await Linking.openURL(webUrl);
    } catch (error) {
      console.log('Error opening Amazon:', error);
      try {
        await Linking.openURL(webUrl);
      } catch {
        Alert.alert('Error', 'Could not open Amazon Fresh. Please try again.');
      }
    }
  };

  const handleCopyList = async () => {
    setShowDeliveryModal(false);
    const items = uncheckedItems.length > 0 ? uncheckedItems : shoppingList;
    if (items.length === 0) {
      Alert.alert('Empty List', 'Add some items to your shopping list first.');
      return;
    }
    const listText = formatItemsForClipboard(items);
    try {
      if (Platform.OS === 'web' && navigator?.clipboard) {
        await navigator.clipboard.writeText(listText);
      } else {
        const Clipboard = await import('expo-clipboard');
        await Clipboard.setStringAsync(listText);
      }
      Alert.alert('Copied!', 'Shopping list copied to clipboard. Paste it into any grocery app.');
    } catch (error) {
      console.log('Error copying to clipboard:', error);
      Alert.alert('Error', 'Could not copy to clipboard. Please try again.');
    }
  };

  const generatePdfHtml = () => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const itemsToExport = uncheckedItems.length > 0 ? uncheckedItems : shoppingList;
    
    const groupedForPdf: Record<string, typeof shoppingList> = {};
    itemsToExport.forEach((item) => {
      const key = item.recipeName || 'Other Items';
      if (!groupedForPdf[key]) {
        groupedForPdf[key] = [];
      }
      groupedForPdf[key].push(item);
    });

    const groupsHtml = Object.entries(groupedForPdf)
      .map(
        ([recipeName, items]) => `
        <div class="group">
          <h3>${recipeName}</h3>
          <ul>
            ${items
              .map(
                (item) => `
              <li>
                <span class="checkbox">☐</span>
                <span class="item-name">${item.name}</span>
                <span class="item-amount">${item.amount} ${item.unit}</span>
              </li>
            `
              )
              .join('')}
          </ul>
        </div>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Shopping List</title>
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              padding: 40px;
              color: #1a1a2e;
              background: #fff;
            }
            .header {
              text-align: center;
              margin-bottom: 32px;
              padding-bottom: 24px;
              border-bottom: 2px solid #e8e8e8;
            }
            .header h1 {
              font-size: 28px;
              font-weight: 700;
              color: #E07A5F;
              margin-bottom: 8px;
            }
            .header p {
              font-size: 14px;
              color: #666;
            }
            .summary {
              background: #f8f9fa;
              padding: 16px;
              border-radius: 8px;
              margin-bottom: 24px;
              text-align: center;
            }
            .summary span {
              font-size: 18px;
              font-weight: 600;
              color: #1a1a2e;
            }
            .group {
              margin-bottom: 24px;
            }
            .group h3 {
              font-size: 16px;
              font-weight: 600;
              color: #E07A5F;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px solid #e8e8e8;
            }
            ul {
              list-style: none;
            }
            li {
              display: flex;
              align-items: center;
              padding: 12px 0;
              border-bottom: 1px solid #f0f0f0;
              gap: 12px;
            }
            li:last-child {
              border-bottom: none;
            }
            .checkbox {
              font-size: 18px;
              color: #ccc;
            }
            .item-name {
              flex: 1;
              font-size: 16px;
              color: #1a1a2e;
            }
            .item-amount {
              font-size: 14px;
              color: #666;
              min-width: 100px;
              text-align: right;
            }
            .footer {
              margin-top: 40px;
              padding-top: 24px;
              border-top: 2px solid #e8e8e8;
              text-align: center;
              font-size: 12px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🛒 Shopping List</h1>
            <p>${currentDate}</p>
          </div>
          <div class="summary">
            <span>${itemsToExport.length} item${itemsToExport.length !== 1 ? 's' : ''} to buy</span>
          </div>
          ${groupsHtml}
          <div class="footer">
            Generated by RecipeApp
          </div>
        </body>
      </html>
    `;
  };

  const handleSaveAsPdf = async () => {
    setShowDeliveryModal(false);
    const items = uncheckedItems.length > 0 ? uncheckedItems : shoppingList;
    if (items.length === 0) {
      Alert.alert('Empty List', 'Add some items to your shopping list first.');
      return;
    }

    try {
      const html = generatePdfHtml();

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 250);
        } else {
          Alert.alert('Error', 'Please allow popups to print the shopping list.');
        }
        return;
      }

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      console.log('PDF generated at:', uri);

      const Sharing = await import('expo-sharing');
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save or Share Shopping List',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF Created', 'Your shopping list PDF has been created but sharing is not available on this device.');
      }
    } catch (error) {
      console.log('Error creating PDF:', error);
      Alert.alert('Error', 'Could not create PDF. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary + '10', Colors.background, Colors.secondary + '10']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <View style={styles.headerIcon}>
              <ShoppingCart size={28} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Shopping List</Text>
            <Text style={styles.subtitle}>
              {totalCount === 0 
                ? 'Your shopping list is empty' 
                : `${checkedCount} of ${totalCount} items checked`}
            </Text>
          </Animated.View>

          {totalCount > 0 && (
            <>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }
                    ]} 
                  />
                </View>
              </View>
              
              <View style={styles.actionButtonsRow}>
                <Pressable 
                  style={styles.primaryActionButton}
                  onPress={() => setShowDeliveryModal(true)}
                >
                  <Truck size={20} color={Colors.textOnPrimary} />
                  <Text style={styles.primaryActionButtonText}>Order</Text>
                </Pressable>

                <Pressable 
                  style={styles.secondaryActionButton}
                  onPress={handleCopyList}
                >
                  <Copy size={20} color={Colors.primary} />
                  <Text style={styles.secondaryActionButtonText}>Copy</Text>
                </Pressable>

                <Pressable 
                  style={styles.secondaryActionButton}
                  onPress={handleSaveAsPdf}
                >
                  <FileDown size={20} color={Colors.primary} />
                  <Text style={styles.secondaryActionButtonText}>PDF</Text>
                </Pressable>
              </View>
            </>
          )}

          {totalCount === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <ShoppingCart size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No items in your shopping list</Text>
              <Text style={styles.emptySubtext}>
                Add ingredients from recipes by tapping the shopping cart icon on recipe cards
              </Text>
            </GlassCard>
          ) : (
            <>
              {Object.entries(groupedItems).map(([recipeName, items]) => (
                <GlassCard key={recipeName} style={styles.groupCard}>
                  <Text style={styles.groupTitle}>{recipeName}</Text>
                  {items.map((item) => (
                    <ShoppingItem
                      key={item.id}
                      item={item}
                      onToggle={() => toggleShoppingItem(item.id)}
                      onRemove={() => removeShoppingItem(item.id)}
                    />
                  ))}
                </GlassCard>
              ))}

              <View style={styles.actionsContainer}>
                {checkedCount > 0 && (
                  <Button
                    title="Clear Checked Items"
                    onPress={clearCheckedItems}
                    variant="secondary"
                    style={styles.actionButton}
                  />
                )}
                <Button
                  title="Clear All"
                  onPress={clearShoppingList}
                  variant="ghost"
                  style={styles.actionButton}
                />
              </View>
            </>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>

        <Modal
          visible={showDeliveryModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDeliveryModal(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setShowDeliveryModal(false)}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Order Groceries</Text>
              <Text style={styles.modalSubtitle}>
                Choose a delivery service to order your ingredients
              </Text>

              <View style={styles.deliveryOptions}>
                <Pressable style={styles.deliveryOption} onPress={handleInstacart}>
                  <View style={[styles.deliveryIconContainer, { backgroundColor: '#43B02A' }]}>
                    <Text style={styles.deliveryIconText}>🥕</Text>
                  </View>
                  <View style={styles.deliveryOptionInfo}>
                    <Text style={styles.deliveryOptionTitle}>Instacart</Text>
                    <Text style={styles.deliveryOptionDesc}>Same-day delivery from local stores</Text>
                  </View>
                  <ExternalLink size={18} color={Colors.textSecondary} />
                </Pressable>

                <Pressable style={styles.deliveryOption} onPress={handleWalmart}>
                  <View style={[styles.deliveryIconContainer, { backgroundColor: '#0071DC' }]}>
                    <Text style={styles.deliveryIconText}>🛒</Text>
                  </View>
                  <View style={styles.deliveryOptionInfo}>
                    <Text style={styles.deliveryOptionTitle}>Walmart</Text>
                    <Text style={styles.deliveryOptionDesc}>Grocery pickup & delivery</Text>
                  </View>
                  <ExternalLink size={18} color={Colors.textSecondary} />
                </Pressable>

                <Pressable style={styles.deliveryOption} onPress={handleAmazon}>
                  <View style={[styles.deliveryIconContainer, { backgroundColor: '#FF9900' }]}>
                    <Text style={styles.deliveryIconText}>📦</Text>
                  </View>
                  <View style={styles.deliveryOptionInfo}>
                    <Text style={styles.deliveryOptionTitle}>Amazon Fresh</Text>
                    <Text style={styles.deliveryOptionDesc}>Fresh groceries delivered</Text>
                  </View>
                  <ExternalLink size={18} color={Colors.textSecondary} />
                </Pressable>


              </View>

              <Pressable 
                style={styles.cancelButton} 
                onPress={() => setShowDeliveryModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

interface ShoppingItemProps {
  item: {
    id: string;
    name: string;
    amount: string;
    unit: string;
    isChecked: boolean;
  };
  onToggle: () => void;
  onRemove: () => void;
}

function ShoppingItem({ item, onToggle, onRemove }: ShoppingItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={[styles.itemContainer, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable onPress={handleToggle} style={styles.itemPressable}>
        <View style={[styles.checkbox, item.isChecked && styles.checkboxChecked]}>
          {item.isChecked && <Check size={14} color={Colors.textOnPrimary} />}
        </View>
        <View style={styles.itemTextContainer}>
          <Text style={[styles.itemName, item.isChecked && styles.itemNameChecked]}>
            {item.name}
          </Text>
          <Text style={[styles.itemAmount, item.isChecked && styles.itemAmountChecked]}>
            {item.amount} {item.unit}
          </Text>
        </View>
      </Pressable>
      <Pressable onPress={onRemove} style={styles.removeButton}>
        <X size={18} color={Colors.textSecondary} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  progressContainer: {
    marginBottom: Spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.backgroundDark,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  emptyCard: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  groupCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  groupTitle: {
    ...Typography.label,
    color: Colors.primary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemName: {
    ...Typography.body,
    color: Colors.text,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  itemAmount: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  itemAmountChecked: {
    textDecorationLine: 'line-through',
  },
  removeButton: {
    padding: Spacing.sm,
  },
  actionsContainer: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
  bottomPadding: {
    height: Spacing.xxxl,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  primaryActionButtonText: {
    ...Typography.body,
    color: Colors.textOnPrimary,
    fontWeight: '600' as const,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '15',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  secondaryActionButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xxxl : Spacing.xl,
    paddingTop: Spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  deliveryOptions: {
    gap: Spacing.sm,
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  deliveryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryIconText: {
    fontSize: 24,
  },
  deliveryOptionInfo: {
    flex: 1,
  },
  deliveryOptionTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  deliveryOptionDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.sm,
  },
  cancelButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
});
