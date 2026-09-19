import { focusManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AnimatedSplash } from "@/components/animated-splash";
import { AuthGate } from "@/components/auth-gate";
import { DialogHost } from "@/components/dialog";
import { Timers } from "@/components/timers";
import { PERSIST_MAX_AGE, persistBuster, persister, queryClient, shouldDehydrateQuery } from "@/lib/query-client";
import { theme } from "@/theme";
import { colors } from "@/theme/colors";

/**
 * Na web o expo-router espelha a rota na barra de endereço (/(tabs)/study, /screens/login…).
 * O app é uma SPA autenticada: mantém a URL sempre na raiz. Recarregar volta à Home
 * (ou ao login), decidido pelo AuthGate.
 */
function CleanWebUrl() {
  const pathname = usePathname();
  useEffect(() => {
    if (Platform.OS === "web" && pathname !== "/") window.history.replaceState(null, "", "/");
  }, [pathname]);
  return null;
}

/** No nativo o React Query não sabe quando o app volta ao primeiro plano; liga ao AppState. */
function useAppFocus() {
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = AppState.addEventListener("change", (state) => focusManager.setFocused(state === "active"));
    return () => sub.remove();
  }, []);
}

export default function RootLayout() {
  useAppFocus();
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: PERSIST_MAX_AGE,
            buster: persistBuster,
            dehydrateOptions: { shouldDehydrateQuery },
          }}
        >
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
          <Timers />
          <DialogHost />
          <CleanWebUrl />
          <StatusBar style="light" />
        </PersistQueryClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
