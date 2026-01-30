import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Scale, Thermometer, Droplets, ArrowLeftRight, ChevronDown } from 'lucide-react-native';
import Colors, { Spacing, BorderRadius, Shadow, Typography } from '@/constants/colors';

type ConversionCategory = 'volume' | 'weight' | 'temperature';

interface ConversionUnit {
  id: string;
  name: string;
  shortName: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

const volumeUnits: ConversionUnit[] = [
  { id: 'ml', name: 'Milliliters', shortName: 'ml', toBase: (v) => v, fromBase: (v) => v },
  { id: 'l', name: 'Liters', shortName: 'L', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  { id: 'tsp', name: 'Teaspoons', shortName: 'tsp', toBase: (v) => v * 4.929, fromBase: (v) => v / 4.929 },
  { id: 'tbsp', name: 'Tablespoons', shortName: 'tbsp', toBase: (v) => v * 14.787, fromBase: (v) => v / 14.787 },
  { id: 'floz', name: 'Fluid Ounces', shortName: 'fl oz', toBase: (v) => v * 29.574, fromBase: (v) => v / 29.574 },
  { id: 'cup', name: 'Cups', shortName: 'cup', toBase: (v) => v * 236.588, fromBase: (v) => v / 236.588 },
  { id: 'pint', name: 'Pints', shortName: 'pt', toBase: (v) => v * 473.176, fromBase: (v) => v / 473.176 },
  { id: 'quart', name: 'Quarts', shortName: 'qt', toBase: (v) => v * 946.353, fromBase: (v) => v / 946.353 },
  { id: 'gallon', name: 'Gallons', shortName: 'gal', toBase: (v) => v * 3785.41, fromBase: (v) => v / 3785.41 },
];

const weightUnits: ConversionUnit[] = [
  { id: 'g', name: 'Grams', shortName: 'g', toBase: (v) => v, fromBase: (v) => v },
  { id: 'kg', name: 'Kilograms', shortName: 'kg', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  { id: 'oz', name: 'Ounces', shortName: 'oz', toBase: (v) => v * 28.3495, fromBase: (v) => v / 28.3495 },
  { id: 'lb', name: 'Pounds', shortName: 'lb', toBase: (v) => v * 453.592, fromBase: (v) => v / 453.592 },
  { id: 'mg', name: 'Milligrams', shortName: 'mg', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
];

const temperatureUnits: ConversionUnit[] = [
  { id: 'c', name: 'Celsius', shortName: '°C', toBase: (v) => v, fromBase: (v) => v },
  { id: 'f', name: 'Fahrenheit', shortName: '°F', toBase: (v) => (v - 32) * 5/9, fromBase: (v) => v * 9/5 + 32 },
  { id: 'k', name: 'Kelvin', shortName: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
];

const categories: { id: ConversionCategory; name: string; units: ConversionUnit[] }[] = [
  { id: 'volume', name: 'Volume', units: volumeUnits },
  { id: 'weight', name: 'Weight', units: weightUnits },
  { id: 'temperature', name: 'Temperature', units: temperatureUnits },
];

const quickConversions = [
  { from: '1 cup', to: '236.59 ml', category: 'volume' as const },
  { from: '1 tbsp', to: '3 tsp', category: 'volume' as const },
  { from: '1 oz', to: '28.35 g', category: 'weight' as const },
  { from: '1 lb', to: '453.59 g', category: 'weight' as const },
  { from: '350°F', to: '177°C', category: 'temperature' as const },
  { from: '1 stick butter', to: '113 g', category: 'weight' as const },
];

export default function ConversionCalculatorScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<ConversionCategory>('volume');
  const [inputValue, setInputValue] = useState('');
  const [fromUnit, setFromUnit] = useState<string>('cup');
  const [toUnit, setToUnit] = useState<string>('ml');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const currentUnits = useMemo(() => {
    return categories.find(c => c.id === selectedCategory)?.units || volumeUnits;
  }, [selectedCategory]);

  const fromUnitData = useMemo(() => {
    return currentUnits.find(u => u.id === fromUnit) || currentUnits[0];
  }, [currentUnits, fromUnit]);

  const toUnitData = useMemo(() => {
    return currentUnits.find(u => u.id === toUnit) || currentUnits[1];
  }, [currentUnits, toUnit]);

  const convertedValue = useMemo(() => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue)) return '';
    
    const baseValue = fromUnitData.toBase(numValue);
    const result = toUnitData.fromBase(baseValue);
    
    if (Math.abs(result) < 0.01 && result !== 0) {
      return result.toExponential(2);
    }
    return result.toFixed(result < 10 ? 3 : 2).replace(/\.?0+$/, '');
  }, [inputValue, fromUnitData, toUnitData]);

  const handleCategoryChange = useCallback((category: ConversionCategory) => {
    setSelectedCategory(category);
    const units = categories.find(c => c.id === category)?.units || volumeUnits;
    setFromUnit(units[0].id);
    setToUnit(units[1]?.id || units[0].id);
    setInputValue('');
  }, []);

  const swapUnits = useCallback(() => {
    const tempFrom = fromUnit;
    setFromUnit(toUnit);
    setToUnit(tempFrom);
    if (convertedValue) {
      setInputValue(convertedValue);
    }
  }, [fromUnit, toUnit, convertedValue]);

  const getCategoryColor = (category: ConversionCategory) => {
    switch (category) {
      case 'volume': return Colors.primary;
      case 'weight': return Colors.secondary;
      case 'temperature': return Colors.error;
      default: return Colors.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Conversion Calculator</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          testID="close-button"
        >
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.categorySelector}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && {
                  backgroundColor: getCategoryColor(category.id),
                },
              ]}
              onPress={() => handleCategoryChange(category.id)}
              testID={`category-${category.id}`}
            >
              {category.id === 'volume' && (
                <Droplets size={20} color={selectedCategory === category.id ? Colors.textOnPrimary : Colors.textSecondary} />
              )}
              {category.id === 'weight' && (
                <Scale size={20} color={selectedCategory === category.id ? Colors.textOnPrimary : Colors.textSecondary} />
              )}
              {category.id === 'temperature' && (
                <Thermometer size={20} color={selectedCategory === category.id ? Colors.textOnPrimary : Colors.textSecondary} />
              )}
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category.id && styles.categoryButtonTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.converterCard}>
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>From</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.valueInput}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="0"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="decimal-pad"
                testID="from-input"
              />
              <TouchableOpacity
                style={styles.unitSelector}
                onPress={() => setShowFromPicker(!showFromPicker)}
                testID="from-unit-selector"
              >
                <Text style={styles.unitText}>{fromUnitData.shortName}</Text>
                <ChevronDown size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {showFromPicker && (
              <View style={styles.unitPicker}>
                {currentUnits.map((unit) => (
                  <TouchableOpacity
                    key={unit.id}
                    style={[
                      styles.unitOption,
                      fromUnit === unit.id && styles.unitOptionActive,
                    ]}
                    onPress={() => {
                      setFromUnit(unit.id);
                      setShowFromPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.unitOptionText,
                        fromUnit === unit.id && styles.unitOptionTextActive,
                      ]}
                    >
                      {unit.name} ({unit.shortName})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.swapButton}
            onPress={swapUnits}
            testID="swap-button"
          >
            <ArrowLeftRight size={20} color={Colors.textOnPrimary} />
          </TouchableOpacity>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>To</Text>
            <View style={styles.inputRow}>
              <View style={styles.resultContainer}>
                <Text 
                  style={[
                    styles.resultText,
                    !convertedValue && styles.resultTextPlaceholder,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {convertedValue || '0'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.unitSelector}
                onPress={() => setShowToPicker(!showToPicker)}
                testID="to-unit-selector"
              >
                <Text style={styles.unitText}>{toUnitData.shortName}</Text>
                <ChevronDown size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {showToPicker && (
              <View style={styles.unitPicker}>
                {currentUnits.map((unit) => (
                  <TouchableOpacity
                    key={unit.id}
                    style={[
                      styles.unitOption,
                      toUnit === unit.id && styles.unitOptionActive,
                    ]}
                    onPress={() => {
                      setToUnit(unit.id);
                      setShowToPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.unitOptionText,
                        toUnit === unit.id && styles.unitOptionTextActive,
                      ]}
                    >
                      {unit.name} ({unit.shortName})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.quickSection}>
          <Text style={styles.sectionTitle}>Quick Reference</Text>
          <View style={styles.quickGrid}>
            {quickConversions.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.quickCard,
                  { borderLeftColor: getCategoryColor(item.category) },
                ]}
              >
                <Text style={styles.quickFrom}>{item.from}</Text>
                <Text style={styles.quickEquals}>=</Text>
                <Text style={styles.quickTo}>{item.to}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Cooking Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Common Butter Measurements</Text>
            <Text style={styles.tipText}>1 stick = ½ cup = 8 tbsp = 113g</Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Oven Temperature Guide</Text>
            <Text style={styles.tipText}>Low: 250-300°F (120-150°C){'\n'}Medium: 350-375°F (175-190°C){'\n'}High: 400-450°F (200-230°C)</Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Flour Conversions</Text>
            <Text style={styles.tipText}>1 cup all-purpose flour ≈ 125g{'\n'}1 cup bread flour ≈ 130g</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
  },
  closeButton: {
    position: 'absolute',
    right: Spacing.lg,
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  categorySelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  categoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  categoryButtonText: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  categoryButtonTextActive: {
    color: Colors.textOnPrimary,
  },
  converterCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadow.md,
    marginBottom: Spacing.xl,
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  valueInput: {
    flex: 1,
    ...Typography.h2,
    color: Colors.text,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  resultContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
  },
  resultText: {
    ...Typography.h2,
    color: Colors.primary,
  },
  resultTextPlaceholder: {
    color: Colors.textTertiary,
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minWidth: 80,
  },
  unitText: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  unitPicker: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  unitOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  unitOptionActive: {
    backgroundColor: Colors.primaryLight + '20',
  },
  unitOptionText: {
    ...Typography.body,
    color: Colors.text,
  },
  unitOptionTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  swapButton: {
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    ...Shadow.sm,
  },
  quickSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    ...Shadow.sm,
  },
  quickFrom: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  quickEquals: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginVertical: 2,
  },
  quickTo: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  tipsSection: {
    marginBottom: Spacing.xxxl,
  },
  tipCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  tipTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  tipText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
