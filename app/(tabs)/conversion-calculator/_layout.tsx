import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function ConversionCalculatorLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Conversion Calculator",
        }} 
      />
    </Stack>
  );
}
