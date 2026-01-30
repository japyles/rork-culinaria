import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  Animated,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import {
  ChefHat,
  Sparkles,
  Home,
  Search,
  Calculator,
  CalendarDays,
  ShoppingCart,
  Heart,
  User,
  X,
  LogOut,
  Ellipsis,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

import Colors, { Shadow } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  route: string;
}

export default function FloatingBottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const menuItems: MenuItem[] = [
    { id: 'home', label: 'Home', icon: Home, route: '/(tabs)/(home)' },
    { id: 'discover', label: 'Discover', icon: Search, route: '/(tabs)/discover' },
    { id: 'convert', label: 'Convert', icon: Calculator, route: '/(tabs)/conversion-calculator' },
    { id: 'ai-chef', label: 'AI Chef', icon: ChefHat, route: '/(tabs)/ai-chef' },
    { id: 'meals', label: 'Meal Plan', icon: CalendarDays, route: '/(tabs)/meal-plan' },
    { id: 'shop', label: 'Shopping List', icon: ShoppingCart, route: '/(tabs)/shopping-list' },
    { id: 'favorites', label: 'Favorites', icon: Heart, route: '/(tabs)/favorites' },
    { id: 'profile', label: 'Profile', icon: User, route: '/(tabs)/profile' },
  ];

  useEffect(() => {
    Animated.timing(menuAnim, {
      toValue: menuOpen ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [menuOpen, menuAnim]);

  const handleHomePress = () => {
    router.push('/(tabs)/(home)');
  };

  const handleAIPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    router.push('/(tabs)/ai-chef');
  };

  const handleMenuPress = () => {
    setMenuOpen(true);
  };

  const handleMenuItemPress = (route: string) => {
    setMenuOpen(false);
    router.push(route as any);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuTranslateX = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_WIDTH, 0],
  });

  const backdropOpacity = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <>
      <View style={[styles.container, { bottom: insets.bottom + 16 }]}>
        <Pressable
          style={styles.circleButton}
          onPress={handleHomePress}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="light" style={styles.blurView}>
              <Home size={24} color={Colors.text} />
            </BlurView>
          ) : (
            <View style={styles.glassBackground}>
              <Home size={24} color={Colors.text} />
            </View>
          )}
        </Pressable>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Pressable
            style={styles.aiButton}
            onPress={handleAIPress}
          >
            <View style={styles.aiButtonInner}>
              <Sparkles size={20} color="#fff" />
              <ChefHat size={20} color="#fff" />
            </View>
          </Pressable>
        </Animated.View>

        <Pressable
          style={styles.circleButton}
          onPress={handleMenuPress}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="light" style={styles.blurView}>
              <Ellipsis size={24} color={Colors.text} />
            </BlurView>
          ) : (
            <View style={styles.glassBackground}>
              <Ellipsis size={24} color={Colors.text} />
            </View>
          )}
        </Pressable>
      </View>

      <Modal
        visible={menuOpen}
        transparent
        animationType="none"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={styles.modalContainer}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          >
            <Pressable style={styles.backdropPressable} onPress={() => setMenuOpen(false)} />
          </Animated.View>

          <Animated.View
            style={[
              styles.menuContainer,
              { transform: [{ translateX: menuTranslateX }], paddingTop: insets.top },
            ]}
          >
            {Platform.OS === 'ios' ? (
              <BlurView intensity={90} tint="light" style={[styles.menuContent, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Menu</Text>
                <Pressable
                  style={styles.closeButton}
                  onPress={() => setMenuOpen(false)}
                >
                  <X size={24} color={Colors.text} />
                </Pressable>
              </View>

              <View style={styles.menuItems}>
                {menuItems.map((item) => {
                  const isActive = pathname.includes(item.id) || 
                    (item.id === 'home' && (pathname === '/' || pathname === '/(tabs)/(home)'));
                  
                  const IconComponent = item.icon;
                  return (
                    <Pressable
                      key={item.id}
                      style={[styles.menuItem, isActive && styles.menuItemActive]}
                      onPress={() => handleMenuItemPress(item.route)}
                    >
                      <View style={[styles.menuItemIcon, isActive && styles.menuItemIconActive]}>
                        <IconComponent size={22} color={isActive ? Colors.primary : Colors.text} />
                      </View>
                      <Text style={[styles.menuItemLabel, isActive && styles.menuItemLabelActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.menuDivider} />

              <Pressable style={styles.logoutButton} onPress={handleLogout}>
                <LogOut size={22} color={Colors.error} />
                <Text style={styles.logoutText}>Log Out</Text>
              </Pressable>
              </BlurView>
            ) : (
              <View style={[styles.menuContent, styles.menuContentAndroid, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Menu</Text>
                <Pressable
                  style={styles.closeButton}
                  onPress={() => setMenuOpen(false)}
                >
                  <X size={24} color={Colors.text} />
                </Pressable>
              </View>

              <View style={styles.menuItems}>
                {menuItems.map((item) => {
                  const isActive = pathname.includes(item.id) || 
                    (item.id === 'home' && (pathname === '/' || pathname === '/(tabs)/(home)'));
                  
                  const IconComponent = item.icon;
                  return (
                    <Pressable
                      key={item.id}
                      style={[styles.menuItem, isActive && styles.menuItemActive]}
                      onPress={() => handleMenuItemPress(item.route)}
                    >
                      <View style={[styles.menuItemIcon, isActive && styles.menuItemIconActive]}>
                        <IconComponent size={22} color={isActive ? Colors.primary : Colors.text} />
                      </View>
                      <Text style={[styles.menuItemLabel, isActive && styles.menuItemLabelActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.menuDivider} />

              <Pressable style={styles.logoutButton} onPress={handleLogout}>
                <LogOut size={22} color={Colors.error} />
                <Text style={styles.logoutText}>Log Out</Text>
              </Pressable>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  circleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    ...Shadow.md,
  },
  blurView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  glassBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 28,
  },
  aiButton: {
    backgroundColor: Colors.text,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 14,
    ...Shadow.lg,
  },
  aiButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  modalContainer: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  backdropPressable: {
    flex: 1,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: SCREEN_WIDTH * 0.8,
    maxWidth: 320,
  },
  menuContent: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    paddingTop: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  menuContentAndroid: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItems: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginVertical: 2,
  },
  menuItemActive: {
    backgroundColor: Colors.primaryLight + '20',
  },
  menuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuItemIconActive: {
    backgroundColor: Colors.primaryLight + '30',
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  menuItemLabelActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 24,
    marginVertical: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 14,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.error,
  },
});
