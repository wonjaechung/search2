import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

export default function OrderPlaceholderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ name?: string; symbol?: string }>();

  const coinName = (params.name ?? params.symbol ?? "선택한 종목") as string;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 14 : insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <Feather name="chevron-left" size={30} color={Colors.dark.text} />
        </Pressable>
      </View>

      <View style={styles.center}>
        <Text style={styles.title}>{coinName}</Text>
        <Text style={styles.message}>주문 화면으로 이동 예정입니다</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    minHeight: 52,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  backButton: {
    width: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  message: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
  },
});

