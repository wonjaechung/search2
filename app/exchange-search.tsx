import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, SectionList, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import Colors from "@/constants/colors";
import WebScrollArrows from "@/components/WebScrollArrows";
import ExchangeSearchHub from "@/components/ExchangeSearchHub";
import { EXCHANGE_COINS, ExchangeCoin, loadBithumbExchangeCoins } from "@/lib/exchange-data";
import { ALL_COINS } from "@/lib/coin-data";

const MOCK_RECENT_SEARCHES = [
  "비트코인",
  "이더리움",
  "리플",
  "솔라나",
  "도지코인",
  "체인링크",
  "아발란체",
  "폴리곤",
  "시바이누",
  "폴카닷",
];

export default function ExchangeSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(MOCK_RECENT_SEARCHES);
  const [liveCoins, setLiveCoins] = useState<ExchangeCoin[]>(EXCHANGE_COINS);
  const [isMobileWeb, setIsMobileWeb] = useState(false);

  useEffect(() => {
    loadBithumbExchangeCoins().then((coins) => {
      if (coins.length > 0) setLiveCoins(coins);
    });
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const update = () => {
      setIsMobileWeb(window.innerWidth <= 820);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const t = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return [];
    return liveCoins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(keyword) ||
        coin.symbol.toLowerCase().includes(keyword),
    );
  }, [liveCoins, query]);

  const coinIconMap = useMemo(() => {
    const byId = new Map(ALL_COINS.map((coin) => [coin.id, coin]));
    const bySymbol = new Map(ALL_COINS.map((coin) => [coin.symbol.toLowerCase(), coin]));
    return { byId, bySymbol };
  }, []);

  const groupedResults = useMemo(() => {
    const byQuote = filtered.reduce<Record<string, ExchangeCoin[]>>((acc, coin) => {
      const quote = coin.quoteCurrency;
      if (!acc[quote]) acc[quote] = [];
      acc[quote].push(coin);
      return acc;
    }, {});

    return (["KRW", "BTC"] as const)
      .filter((quote) => (byQuote[quote]?.length ?? 0) > 0)
      .map((quote) => ({
        title: quote,
        data: byQuote[quote].sort((a, b) => b.accTradePrice24h - a.accTradePrice24h),
      }));
  }, [filtered]);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 14 : insets.top + 8 }]}>
        <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={8} style={styles.backButton}>
          <Feather name="chevron-left" size={30} color={Colors.dark.text} />
        </Pressable>
        <View style={styles.searchWrap}>
          <Feather name="search" size={22} color={Colors.dark.textSecondary} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="코인명 또는 심볼 검색"
            placeholderTextColor={Colors.dark.textTertiary}
            selectionColor={Colors.dark.accent}
            cursorColor={Colors.dark.accent}
            style={styles.searchInput}
          />
        </View>
      </View>

      {recentSearches.length > 0 && (
        <View style={styles.recentList}>
          <WebScrollArrows contentContainerStyle={styles.recentRow}>
            {recentSearches.map((item) => (
              <Pressable
                style={styles.recentChip}
                key={item}
                onPress={() =>
                  router.push({
                    pathname: "/order-placeholder",
                    params: { name: item, symbol: item },
                  })
                }
              >
                <Text style={styles.recentChipText} numberOfLines={1}>
                  {item}
                </Text>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    setRecentSearches((prev) => prev.filter((keyword) => keyword !== item));
                  }}
                  hitSlop={8}
                >
                  <Feather name="x" size={16} color={Colors.dark.textTertiary} />
                </Pressable>
              </Pressable>
            ))}
          </WebScrollArrows>
        </View>
      )}

      {query.trim().length === 0 ? (
        <ScrollView
          style={styles.hubScroll}
          contentContainerStyle={styles.hubScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ExchangeSearchHub />
        </ScrollView>
      ) : (
        <SectionList
          sections={groupedResults}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() =>
                router.push({
                  pathname: "/order-placeholder",
                  params: { name: item.name, symbol: item.symbol },
                })
              }
            >
              {(() => {
                const iconMeta =
                  coinIconMap.byId.get(item.id) ?? coinIconMap.bySymbol.get(item.symbol.toLowerCase());
                const iconColor = iconMeta?.iconColor ?? Colors.dark.textTertiary;
                return (
                  <View style={[styles.coinIconWrap, { backgroundColor: `${iconColor}15` }]}>
                    {iconMeta ? (
                      iconMeta.iconType === "mci" ? (
                        <MaterialCommunityIcons name={iconMeta.iconName as never} size={18} color={iconColor} />
                      ) : (
                        <Feather name={iconMeta.iconName as never} size={15} color={iconColor} />
                      )
                    ) : (
                      <Feather name="circle" size={12} color={iconColor} />
                    )}
                  </View>
                );
              })()}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.coinName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.coinSymbol}>{`${item.symbol}/${item.quoteCurrency}`}</Text>
              </View>
              <View style={styles.priceCol}>
                <Text
                  style={[
                    styles.coinPrice,
                    { color: item.changePercent > 0 ? "#FF4757" : item.changePercent < 0 ? "#4A90FF" : Colors.dark.text },
                  ]}
                  numberOfLines={1}
                >
                {item.priceFormatted}
                </Text>
                <Text
                  style={[
                    styles.coinChange,
                    { color: item.changePercent > 0 ? "#FF4757" : item.changePercent < 0 ? "#4A90FF" : Colors.dark.textSecondary },
                  ]}
                >
                  {item.changePercent > 0 ? "+" : ""}
                  {item.changePercent.toFixed(2)}%
                </Text>
              </View>
            </Pressable>
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
          )}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <View style={styles.noResultWrap}>
              <Text style={styles.noResultText}>검색 결과가 없습니다</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  backButton: {
    width: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    borderRadius: 18,
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: Platform.OS === "web" ? 16 : 30 / 2,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.text,
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          outlineWidth: 0,
          caretColor: Colors.dark.accent,
        } as any)
      : {}),
  },
  recentRow: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 10,
    alignItems: "center",
  },
  recentList: {
    flexGrow: 0,
    minHeight: 56,
    maxHeight: 56,
  },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 170,
    gap: 8,
    borderRadius: 22,
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  recentChipText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
  },
  hubScroll: {
    flex: 1,
  },
  hubScrollContent: {
    paddingBottom: 18,
  },
  listContent: {
    paddingBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.divider,
  },
  sectionHeader: {
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: Colors.dark.surface,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  coinIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  coinName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  coinSymbol: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textTertiary,
  },
  coinPrice: {
    fontSize: 30 / 2,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
    textAlign: "right",
  },
  coinChange: {
    marginTop: 1,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "right",
  },
  priceCol: {
    alignItems: "flex-end",
    minWidth: 84,
  },
  noResultWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  noResultText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textTertiary,
  },
});
