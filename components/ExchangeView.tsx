import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { FilterCategoryId, filterCoins } from "@/lib/coin-data";
import { getFavoriteMarkets } from "@/lib/favorites";
import {
  EXCHANGE_COINS,
  EXCHANGE_SUB_TABS,
  EXCHANGE_FILTERS,
  ExchangeCoin,
  ExchangeSubTab,
  ExchangeFilter,
  loadBithumbExchangeCoins,
} from "@/lib/exchange-data";

type SortKey = "name" | "price" | "change" | "volume";
type SortDir = "asc" | "desc";

function CoinRow({ coin }: { coin: ExchangeCoin }) {
  const isPositive = coin.changePercent > 0;
  const isNegative = coin.changePercent < 0;
  const changeColor = isPositive
    ? "#FF4757"
    : isNegative
      ? "#4A90FF"
      : Colors.dark.textSecondary;

  return (
    <Pressable style={styles.coinRow}>
      <View style={styles.coinNameCol}>
        <View style={styles.coinNameRow}>
          <Text style={styles.coinName} numberOfLines={1}>
            {coin.name}
          </Text>
        </View>
        <Text style={styles.coinSymbol}>{coin.symbol}</Text>
      </View>
      <Text style={[styles.coinPrice, { color: changeColor }]} numberOfLines={1}>
        {coin.priceFormatted}
      </Text>
      <Text style={[styles.coinChange, { color: changeColor }]} numberOfLines={1}>
        {isPositive ? "+" : ""}
        {coin.changePercent.toFixed(2)}%
      </Text>
      <Text style={styles.coinVolume} numberOfLines={1}>
        {coin.volume}
      </Text>
    </Pressable>
  );
}

export default function ExchangeView({
  searchQuery = "",
  advancedFilters,
  compactMode = false,
}: {
  searchQuery?: string;
  advancedFilters?: Record<FilterCategoryId, string | null>;
  compactMode?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [liveCoins, setLiveCoins] = useState<ExchangeCoin[]>(EXCHANGE_COINS);
  const [favoriteMarkets, setFavoriteMarkets] = useState<string[]>([]);
  const [subTab, setSubTab] = useState<ExchangeSubTab>("krw");
  const [filter, setFilter] = useState<ExchangeFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("volume");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const hasAdvancedFilters = !!advancedFilters && Object.values(advancedFilters).some((v) => v !== null);
  const advancedSymbols = useMemo(() => {
    if (!advancedFilters || !hasAdvancedFilters) return null;
    const coins = filterCoins(advancedFilters);
    return new Set(coins.map((c) => c.symbol.toLowerCase()));
  }, [advancedFilters, hasAdvancedFilters]);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey],
  );

  useEffect(() => {
    loadBithumbExchangeCoins().then((coins) => {
      if (coins.length > 0) setLiveCoins(coins);
    });
  }, []);

  useEffect(() => {
    getFavoriteMarkets().then(setFavoriteMarkets);
  }, []);

  useEffect(() => {
    if (subTab === "favorites") {
      getFavoriteMarkets().then(setFavoriteMarkets);
    }
  }, [subTab]);

  const filteredCoins = useMemo(() => {
    let coins = liveCoins;
    if (subTab === "krw") {
      coins = coins.filter((c) => c.quoteCurrency === "KRW");
    } else if (subTab === "btc") {
      coins = coins.filter((c) => c.quoteCurrency === "BTC");
    }
    if (filter !== "all") {
      coins = coins.filter((c) => c.category.includes(filter));
    }
    if (subTab === "owned") {
      coins = [];
    } else if (subTab === "favorites") {
      coins = coins.filter((c) => favoriteMarkets.includes(c.market));
    }
    if (advancedSymbols) {
      coins = coins.filter((c) => advancedSymbols.has(c.symbol.toLowerCase()));
    }
    const keyword = searchQuery.trim().toLowerCase();
    if (keyword.length > 0) {
      coins = coins.filter((c) =>
        c.name.toLowerCase().includes(keyword) || c.symbol.toLowerCase().includes(keyword)
      );
    }

    const sorted = [...coins].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "price":
          cmp = a.price - b.price;
          break;
        case "change":
          cmp = a.changePercent - b.changePercent;
          break;
        case "volume":
          cmp = a.accTradePrice24h - b.accTradePrice24h;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [liveCoins, filter, subTab, sortKey, sortDir, searchQuery, advancedSymbols, favoriteMarkets]);

  const renderCoin = useCallback(
    ({ item }: { item: ExchangeCoin }) => <CoinRow coin={item} />,
    [],
  );

  const webTopInset = Platform.OS === "web" ? 0 : 0;

  return (
    <View style={styles.container}>
      {!compactMode && (
        <View style={styles.portfolioBar}>
          <View style={styles.portfolioLeft}>
            <Text style={styles.portfolioLabel}>내 보유자산</Text>
            <Feather
              name="chevron-right"
              size={16}
              color={Colors.dark.textTertiary}
            />
          </View>
          <Text style={styles.portfolioValue}>0원 0.00%</Text>
        </View>
      )}

      {!compactMode && (
        <View style={styles.subTabRow}>
          {EXCHANGE_SUB_TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setSubTab(tab.key);
              }}
              style={[
                styles.subTabItem,
                subTab === tab.key && styles.subTabItemActive,
              ]}
            >
              <Text
                style={[
                  styles.subTabText,
                  subTab === tab.key && styles.subTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {!compactMode && (
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRowScroll}
            contentContainerStyle={[styles.filterRow, styles.filterRowContent]}
          >
            {EXCHANGE_FILTERS.map((f) => (
              <Pressable
                key={f.key}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setFilter(f.key);
                }}
                style={[
                  styles.filterChip,
                  filter === f.key && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filter === f.key && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={styles.filterDropdownFixed}>
            <Feather
              name="chevron-down"
              size={18}
              color={Colors.dark.textTertiary}
            />
          </Pressable>
        </View>
      )}

      <View style={styles.tableHeader}>
        <Pressable
          style={styles.headerNameCol}
          onPress={() => handleSort("name")}
        >
          <Text style={styles.headerText}>자산명</Text>
          <SortIndicator active={sortKey === "name"} dir={sortDir} />
        </Pressable>
        <Pressable
          style={styles.headerPriceCol}
          onPress={() => handleSort("price")}
        >
          <Text style={styles.headerText}>현재가</Text>
          <SortIndicator active={sortKey === "price"} dir={sortDir} />
        </Pressable>
        <Pressable
          style={styles.headerChangeCol}
          onPress={() => handleSort("change")}
        >
          <Text style={styles.headerText}>어제·변동</Text>
          <SortIndicator active={sortKey === "change"} dir={sortDir} />
        </Pressable>
        <View style={styles.headerVolumeCol}>
          <Text style={styles.headerText}>거래금액</Text>
          <SortIndicator active={sortKey === "volume"} dir={sortDir} />
        </View>
      </View>

      {subTab === "owned" || subTab === "favorites" ? (
        <View style={styles.emptyState}>
          <Feather
            name={subTab === "owned" ? "briefcase" : "star"}
            size={32}
            color={Colors.dark.textTertiary}
          />
          <Text style={styles.emptyText}>
            {subTab === "owned"
              ? "보유중인 자산이 없습니다"
              : "관심 자산을 추가해주세요"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCoins}
          renderItem={renderCoin}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 80,
          }}
          scrollEnabled={filteredCoins.length > 0}
        />
      )}
    </View>
  );
}

function SortIndicator({
  active,
  dir,
}: {
  active: boolean;
  dir: SortDir;
}) {
  return (
    <View style={styles.sortIcon}>
      <Ionicons
        name="caret-up"
        size={8}
        color={
          active && dir === "asc" ? Colors.dark.text : Colors.dark.textTertiary
        }
        style={{ marginBottom: -2 }}
      />
      <Ionicons
        name="caret-down"
        size={8}
        color={
          active && dir === "desc"
            ? Colors.dark.text
            : Colors.dark.textTertiary
        }
        style={{ marginTop: -2 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    ...(Platform.OS === "web"
      ? { width: "100%", maxWidth: "100%", minWidth: 0, minHeight: 0, overflow: "hidden" as const }
      : {}),
  },
  portfolioBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 42,
    backgroundColor: Colors.dark.surface,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  portfolioLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  portfolioLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
  },
  portfolioValue: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
  },
  subTabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  subTabItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  subTabItemActive: {
    borderBottomColor: Colors.dark.text,
  },
  subTabText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textTertiary,
  },
  subTabTextActive: {
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
  },
  filterRowScroll: {
    flex: 1,
    minHeight: 52,
  },
  filterRow: {
    flexDirection: "row",
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
    minHeight: 52,
  },
  filterRowContent: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    minHeight: 30,
    paddingVertical: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    justifyContent: "center",
    backgroundColor: Colors.dark.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  filterChipText: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  filterDropdownFixed: {
    width: 40,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,
    backgroundColor: "transparent",
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    paddingRight: 24,
    paddingVertical: 8,
    marginTop: 0,
    backgroundColor: Colors.dark.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.cardBorder,
  },
  headerNameCol: {
    flex: 2.2,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  headerPriceCol: {
    flex: 2,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
  },
  headerChangeCol: {
    flex: 1.5,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
  },
  headerVolumeCol: {
    flex: 2,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
  },
  headerText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textTertiary,
  },
  sortIcon: {
    alignItems: "center",
    justifyContent: "center",
    height: 14,
  },
  coinRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    paddingRight: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.divider,
    minWidth: 0,
    backgroundColor: Colors.dark.surface,
  },
  coinNameCol: {
    flex: 2,
    minWidth: 0,
  },
  coinNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  coinName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
    flexShrink: 1,
  },
  coinSymbol: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  coinPrice: {
    flex: 2,
    minWidth: 0,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
  },
  coinChange: {
    flex: 1.5,
    minWidth: 0,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
  },
  coinVolume: {
    flex: 2,
    minWidth: 0,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
    textAlign: "right",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textTertiary,
  },
});
