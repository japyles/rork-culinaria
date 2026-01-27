import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingCart, Check, Trash2, X } from 'lucide-react-native';
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
    backgroundColor: Colors.borderLight,
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
});
