import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AnimatedSplash } from "@/components/animated-splash";
import { AuthGate } from "@/components/auth-gate";
import { queryClient } from "@/lib/query-client";
import { theme } from "@/theme";
import { colors } from "@/theme/colors";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <AnimatedSplash>
            <AuthGate>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="screens/login/index" />
                <Stack.Screen name="screens/register/index" />
                <Stack.Screen name="screens/profile/index" />
              </Stack>
            </AuthGate>
          </AnimatedSplash>
          <StatusBar style="light" />
        </QueryClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
