import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RecipeProvider } from "@/contexts/RecipeContext";
import { SocialProvider } from "@/contexts/SocialContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuthGroup) {
      console.log('[Navigation] User not authenticated, redirecting to login');
      router.replace('/login');
    } else if (isAuthenticated && segments[0] === 'login') {
      console.log('[Navigation] User authenticated, redirecting to home');
      router.replace('/(tabs)/(home)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="recipe/[id]"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="video-extract"
        options={{
          title: "Extract from Video",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.text,
        }}
      />
      <Stack.Screen
        name="edit-recipe"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="add-recipe"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="scan-recipe"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="user/[id]"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="favorites-modal"
        options={{
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: [0.46, 0.82],
          sheetCornerRadius: 24,
          sheetGrabberVisible: true,
          sheetExpandsWhenScrolledToEdge: false,
        }}
      />
      <Stack.Screen
        name="recipes-modal"
        options={{
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: [0.46, 0.82],
          sheetCornerRadius: 24,
          sheetGrabberVisible: true,
          sheetExpandsWhenScrolledToEdge: false,
        }}
      />
      <Stack.Screen
        name="followers-modal"
        options={{
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: [0.46, 0.82],
          sheetCornerRadius: 24,
          sheetGrabberVisible: true,
          sheetExpandsWhenScrolledToEdge: false,
        }}
      />
      <Stack.Screen
        name="following-modal"
        options={{
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: [0.46, 0.82],
          sheetCornerRadius: 24,
          sheetGrabberVisible: true,
          sheetExpandsWhenScrolledToEdge: false,
        }}
      />
      <Stack.Screen
        name="paywall"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <RecipeProvider>
            <SocialProvider>
              <SubscriptionProvider>
                <RootLayoutNav />
              </SubscriptionProvider>
            </SocialProvider>
          </RecipeProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
