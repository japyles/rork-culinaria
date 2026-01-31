import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, Animated, Image } from "react-native";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RecipeProvider } from "@/contexts/RecipeContext";
import { SocialProvider } from "@/contexts/SocialContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AIUsageProvider } from "@/contexts/AIUsageContext";
import { AICacheProvider } from "@/contexts/AICacheContext";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AnimatedSplash({ onAnimationComplete }: { onAnimationComplete: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const tiltXAnim = useRef(new Animated.Value(0)).current;
  const tiltYAnim = useRef(new Animated.Value(0)).current;
  const fadeOutAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const tiltAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(tiltXAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(tiltYAnim, {
            toValue: 0.5,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(tiltXAnim, {
            toValue: -0.5,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(tiltYAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(tiltXAnim, {
            toValue: 0.7,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(tiltYAnim, {
            toValue: -0.7,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(tiltXAnim, {
            toValue: -1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(tiltYAnim, {
            toValue: -0.5,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(tiltXAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(tiltYAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      tiltAnimation.start();
    });

    const timeout = setTimeout(() => {
      tiltAnimation.stop();
      Animated.timing(fadeOutAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onAnimationComplete();
      });
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  const rotateX = tiltXAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-25deg', '0deg', '25deg'],
  });

  const rotateY = tiltYAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-25deg', '0deg', '25deg'],
  });

  const rotateZ = Animated.add(tiltXAnim, tiltYAnim).interpolate({
    inputRange: [-2, 0, 2],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  return (
    <Animated.View style={[splashStyles.container, { opacity: fadeOutAnim }]}>
      <Animated.View
        style={[
          splashStyles.iconContainer,
          {
            opacity: opacityAnim,
            transform: [
              { scale: scaleAnim },
              { perspective: 800 },
              { rotateX },
              { rotateY },
              { rotateZ },
            ],
          },
        ]}
      >
        <Image
          source={require('../assets/images/splash-icon.png')}
          style={splashStyles.icon}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  iconContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 150,
    height: 150,
  },
});

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
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const handleAnimationComplete = () => {
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <RecipeProvider>
            <SocialProvider>
              <SubscriptionProvider>
                <AIUsageProvider>
                    <AICacheProvider>
                      <RootLayoutNav />
                  {showSplash && <AnimatedSplash onAnimationComplete={handleAnimationComplete} />}
                    </AICacheProvider>
                  </AIUsageProvider>
              </SubscriptionProvider>
            </SocialProvider>
          </RecipeProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
