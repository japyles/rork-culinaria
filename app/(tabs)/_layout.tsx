import { Tabs } from "expo-router";
import React from "react";
import { View, StyleSheet } from "react-native";
import FloatingBottomBar from "@/components/FloatingBottomBar";

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="(home)" />
        <Tabs.Screen name="discover" />
        <Tabs.Screen name="conversion-calculator" />
        <Tabs.Screen name="ai-chef" />
        <Tabs.Screen name="meal-plan" />
        <Tabs.Screen name="shopping-list" />
        <Tabs.Screen name="favorites" />
        <Tabs.Screen name="profile" />
      </Tabs>
      <FloatingBottomBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
