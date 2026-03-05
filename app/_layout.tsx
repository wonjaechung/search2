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
      <Stack.Screen name="exchange-search-integrated" options={{ headerShown: false }} />
      <Stack.Screen name="order-placeholder" options={{ headerShown: false }} />
    </Stack>
  );
}

function WebMobileWrapper({ children }: { children: React.ReactNode }) {
  const [isMobileWeb, setIsMobileWeb] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const update = () => {
      setIsMobileWeb(window.innerWidth <= 820);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  const outerStyle = isMobileWeb ? webStyles.outerContainerMobile : webStyles.outerContainer;
  const frameStyle = isMobileWeb ? webStyles.phoneFrameMobile : webStyles.phoneFrame;

  return (
    <View style={outerStyle}>
      <View style={frameStyle}>
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
    backgroundColor: "#E5E7EB",
    ...(Platform.OS === "web"
      ? { minHeight: "100vh" as any }
      : {}),
  },
  outerContainerMobile: {
    flex: 1,
    width: "100%",
    alignItems: "stretch",
    justifyContent: "flex-start",
    backgroundColor: "#E5E7EB",
    ...(Platform.OS === "web"
      ? {
          minHeight: "100dvh" as any,
          overscrollBehavior: "none" as any,
        }
      : {}),
  },
  phoneFrame: {
    width: "100%",
    maxWidth: 430,
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  phoneFrameMobile: {
    width: "100%",
    maxWidth: "100%",
    flex: 1,
    backgroundColor: "#FFFFFF",
    ...(Platform.OS === "web"
      ? {
          height: "100dvh" as any,
          maxHeight: "100dvh" as any,
          boxSizing: "border-box" as any,
          overflow: "hidden" as const,
          display: "flex" as any,
          flexDirection: "column" as any,
          boxShadow: "none" as any,
          overscrollBehavior: "none" as any,
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
