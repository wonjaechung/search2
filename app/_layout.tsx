import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Platform, View, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";

if (Platform.OS !== "web") {
  SplashScreen.preventAutoHideAsync();
}

function injectWebFonts() {
  if (Platform.OS !== "web") return;
  if (typeof document === "undefined") return;
  const link = document.createElement("link");
  link.href =
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
}

injectWebFonts();

function useAppFonts(): boolean {
  const [ready, setReady] = useState(Platform.OS === "web");

  useEffect(() => {
    if (Platform.OS === "web") return;

    let cancelled = false;
    (async () => {
      try {
        const Font = require("expo-font");
        const {
          Inter_400Regular,
          Inter_500Medium,
          Inter_600SemiBold,
          Inter_700Bold,
        } = require("@expo-google-fonts/inter");
        await Font.loadAsync({
          Inter_400Regular,
          Inter_500Medium,
          Inter_600SemiBold,
          Inter_700Bold,
        });
      } catch (_e) {}
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="exchange-search" options={{ headerShown: false }} />
      <Stack.Screen name="order-placeholder" options={{ headerShown: false }} />
    </Stack>
  );
}

function WebMobileWrapper({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== "web") {
    return <>{children}</>;
  }
  return (
    <View style={webStyles.outerContainer}>
      <View style={webStyles.phoneFrame}>
        {children}
      </View>
    </View>
  );
}

const webStyles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    ...(Platform.OS === "web"
      ? { minHeight: "100vh" as any }
      : {}),
  },
  phoneFrame: {
    width: "100%",
    maxWidth: 430,
    flex: 1,
    backgroundColor: "#0D0F14",
    ...(Platform.OS === "web"
      ? {
          height: "100dvh" as any,
          maxHeight: "100dvh" as any,
          boxShadow: "0 0 40px rgba(0,0,0,0.5)" as any,
          boxSizing: "border-box" as any,
          overflow: "hidden" as const,
          display: "flex" as any,
          flexDirection: "column" as any,
        }
      : { overflow: "hidden" as const }),
  },
});

export default function RootLayout() {
  const fontsReady = useAppFonts();

  useEffect(() => {
    if (fontsReady && Platform.OS !== "web") {
      SplashScreen.hideAsync();
    }
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <WebMobileWrapper>
            <GestureHandlerRootView
              style={
                Platform.OS === "web"
                  ? { flex: 1, minHeight: 0, width: "100%", maxWidth: "100%" }
                  : { flex: 1 }
              }
            >
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </WebMobileWrapper>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
