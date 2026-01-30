import { Tabs } from "expo-router";
import { Home, Search, ChefHat, CalendarDays, User, ShoppingCart } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused && styles.activeIconContainer}>
              <Home size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused && styles.activeIconContainer}>
              <Search size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="conversion-calculator"
        options={{
          title: "Convert",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused && styles.activeIconContainer}>
              <Search size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ai-chef"
        options={{
          title: "AI Chef",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.aiChefIcon, focused && styles.aiChefIconActive]}>
              <ChefHat size={24} color={focused ? Colors.textOnPrimary : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: "Meals",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused && styles.activeIconContainer}>
              <CalendarDays size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="shopping-list"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused && styles.activeIconContainer}>
              <ShoppingCart size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          href: null,
          title: "Favorites",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: '/profile',
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused && styles.activeIconContainer}>
              <User size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    height: 85,
    paddingTop: 8,
    paddingBottom: 24,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  activeIconContainer: {
    backgroundColor: Colors.primaryLight + '20',
    borderRadius: 12,
    padding: 6,
  },
  aiChefIcon: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 10,
    marginTop: -20,
    borderWidth: 3,
    borderColor: Colors.background,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  aiChefIconActive: {
    backgroundColor: Colors.primary,
  },
});
