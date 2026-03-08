import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Modal } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import Colors from "@/constants/colors";
import CoinFilterSheet from "@/components/CoinFilterSheet";
import CoinListSheet from "@/components/CoinListSheet";
import WebScrollArrows from "@/components/WebScrollArrows";
import CoinLogo from "@/components/CoinLogo";
import { EXCHANGE_COINS, ExchangeCoin, loadBithumbExchangeCoins } from "@/lib/exchange-data";
import { ensureCoinLogos } from "@/lib/coin-logos";
import { getFavoriteMarkets, toggleFavoriteMarket } from "@/lib/favorites";
import { getScreenWidth } from "@/lib/screen-utils";
import {
  ALL_COINS,
  COIN_CATEGORIES,
  CoinItem,
  FilterCategoryId,
  THEME_ITEMS,
  filterCoins,
} from "@/lib/coin-data";

type SavedFilter = {
  id: string;
  name: string;
  filters: Record<FilterCategoryId, string | null>;
  createdAt: number;
};

const SAVED_FILTERS_KEY = "saved_coin_filters";
const BOTTOM_CAROUSEL_CARD_WIDTH = getScreenWidth() * 0.44;
const BOTTOM_CAROUSEL_GAP = 8;

const EMPTY_FILTERS: Record<FilterCategoryId, string | null> = {
  marketCap: null,
  changeRate: null,
  volume: null,
  rvol: null,
  category: null,
  staking: null,
  lending: null,
  newListing: null,
  circulatingRatio: null,
  athDrop: null,
  atlRise: null,
  streakUp: null,
  streakDown: null,
  rsi: null,
  beta: null,
};

function buildLiveBySymbol(coins: ExchangeCoin[]): Record<string, ExchangeCoin> {
  const map: Record<string, ExchangeCoin> = {};
  coins
    .filter((coin) => coin.quoteCurrency === "KRW")
    .forEach((coin) => {
      const key = coin.symbol.toLowerCase();
      if (!map[key]) map[key] = coin;
    });
  return map;
}

function hashSymbol(symbol: string): number {
  let h = 0;
  for (let i = 0; i < symbol.length; i += 1) {
    h = (h * 31 + symbol.charCodeAt(i)) >>> 0;
  }
  return h;
}

function formatToKoreanUnit(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0억";
  const eok = value / 100_000_000;
  if (eok >= 10_000) return `${(eok / 10_000).toFixed(1).replace(/\.0$/, "")}조`;
  return `${eok.toFixed(0)}억`;
}

export default function ExchangeSearchHub() {
  const router = useRouter();
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [conditionFilters, setConditionFilters] = useState<Record<FilterCategoryId, string | null>>({
    ...EMPTY_FILTERS,
  });

  const [listVisible, setListVisible] = useState(false);
  const [listTitle, setListTitle] = useState("코인 골라보기");
  const [listFilters, setListFilters] = useState<Record<FilterCategoryId, string | null>>({
    ...EMPTY_FILTERS,
  });
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [editingSavedFilterId, setEditingSavedFilterId] = useState<string | null>(null);
  const [savedListVisible, setSavedListVisible] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState("cat-consecutive-rise");
  const [liveBySymbol, setLiveBySymbol] = useState<Record<string, ExchangeCoin>>(
    () => buildLiveBySymbol(EXCHANGE_COINS),
  );
  const [liveExchangeCoins, setLiveExchangeCoins] = useState<ExchangeCoin[]>(EXCHANGE_COINS);
  const [favoriteMarkets, setFavoriteMarkets] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(SAVED_FILTERS_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedFilters(parsed);
        }
      } catch {}
    });
  }, []);

  useEffect(() => {
    loadBithumbExchangeCoins().then((coins) => {
      setLiveExchangeCoins(coins);
      setLiveBySymbol(buildLiveBySymbol(coins));
    });
  }, []);

  useEffect(() => {
    ensureCoinLogos(liveExchangeCoins.map((coin) => coin.symbol));
  }, [liveExchangeCoins]);

  useEffect(() => {
    getFavoriteMarkets().then(setFavoriteMarkets);
  }, []);

  const filterUniverse = useMemo<CoinItem[]>(() => {
    if (liveExchangeCoins.length === 0) return ALL_COINS;

    const baseBySymbol = new Map(ALL_COINS.map((coin) => [coin.symbol.toLowerCase(), coin]));
    const symbolSeen = new Set<string>();
    const krwSorted = [...liveExchangeCoins]
      .filter((coin) => coin.quoteCurrency === "KRW")
      .sort((a, b) => b.accTradePrice24h - a.accTradePrice24h);

    return krwSorted
      .filter((coin) => {
        const key = coin.symbol.toLowerCase();
        if (symbolSeen.has(key)) return false;
        symbolSeen.add(key);
        return true;
      })
      .map((coin, index) => {
        const key = coin.symbol.toLowerCase();
        const base = baseBySymbol.get(key);
        const seed = hashSymbol(coin.symbol);
        const marketCapEstimate = coin.accTradePrice24h * (45 + (seed % 60));
        const weekDelta = coin.changePercent * (1.8 + ((seed % 25) / 10));
        const monthDelta = coin.changePercent * (3.2 + ((seed % 40) / 10));
        const fallbackIconColors = ["#00B8D9", "#F7931A", "#627EEA", "#FF4757", "#4DA2FF", "#A855F7"];

        return {
          id: base?.id ?? key,
          name: coin.name,
          symbol: coin.symbol,
          iconType: base?.iconType ?? "feather",
          iconName: base?.iconName ?? "circle",
          iconColor: base?.iconColor ?? fallbackIconColors[seed % fallbackIconColors.length],
          change: coin.changePercent,
          change1h: coin.changePercent * (0.18 + ((seed % 7) / 100)),
          price: coin.priceFormatted,
          marketCap: formatToKoreanUnit(marketCapEstimate),
          rank: index + 1,
          changeWeek: weekDelta,
          changeMonth: monthDelta,
          volume24h: formatToKoreanUnit(coin.accTradePrice24h),
          rVol: 0.8 + (seed % 55) / 10,
          category: base?.category ?? "layer1",
          tags: base?.tags ?? [],
          stakable: base?.stakable ?? (seed % 3 !== 0),
          lendable: base?.lendable ?? (seed % 4 !== 0),
          listingDays: base?.listingDays ?? (30 + (seed % 600)),
          circulatingRatio: base?.circulatingRatio ?? (20 + (seed % 80)),
          athDrop: base?.athDrop ?? { all: 10 + (seed % 70), y1: 5 + (seed % 30), m6: 3 + (seed % 15), m3: 1 + (seed % 10), m1: seed % 6 },
          atlRise: base?.atlRise ?? { all: 100 + (seed % 4000), y1: 50 + (seed % 500), m6: 20 + (seed % 250), m3: 10 + (seed % 120), m1: 4 + (seed % 40) },
          streak: base?.streak ?? (1 + (seed % 7)),
          downStreak: base?.downStreak ?? (seed % 4),
          rsi: base?.rsi ?? (25 + (seed % 55)),
          beta: base?.beta ?? (-1 + (seed % 350) / 100),
        } as CoinItem;
      });
  }, [liveExchangeCoins]);

  const popularSearches = useMemo(
    () =>
      liveExchangeCoins
        .filter((coin) => coin.quoteCurrency === "KRW")
        .sort((a, b) => b.accTradePrice24h - a.accTradePrice24h)
        .slice(0, 10),
    [liveExchangeCoins],
  );

  const baseBySymbol = useMemo(
    () => new Map(ALL_COINS.map((coin) => [coin.symbol.toLowerCase(), coin])),
    [],
  );

  const openListWithFilters = (
    title: string,
    filters: Record<FilterCategoryId, string | null>,
    sourceSavedFilterId?: string,
  ) => {
    setListTitle(title);
    setListFilters(filters);
    setEditingSavedFilterId(sourceSavedFilterId ?? null);
    setListVisible(true);
  };

  const saveAsNewFilter = async (filters: Record<FilterCategoryId, string | null>, name: string) => {
    const next: SavedFilter = {
      id: `sf_${Date.now()}`,
      name,
      filters: { ...filters },
      createdAt: Date.now(),
    };
    const updated = [...savedFilters, next];
    setSavedFilters(updated);
    await AsyncStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updated));
  };

  const removeSavedFilter = async (id: string) => {
    const updated = savedFilters.filter((item) => item.id !== id);
    setSavedFilters(updated);
    await AsyncStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updated));
  };

  const presetCards = useMemo(() => {
    const cards: Array<
      { type: "category"; id: string; title: string; subtitle: string; filterKey?: FilterCategoryId; filterValue?: string; count: number } |
      { type: "theme"; id: string; title: string; subtitle: string; filterKey: FilterCategoryId; filterValue: string }
    > = [];

    let insertedThemeCards = false;
    COIN_CATEGORIES.forEach((cat) => {
      cards.push({
        type: "category",
        id: `cat-${cat.id}`,
        title: cat.title,
        subtitle: cat.subtitle,
        filterKey: cat.filterKey,
        filterValue: cat.filterValue,
        count: cat.coins.length,
      });

      if (cat.title === "연속 상승세") {
        THEME_ITEMS.forEach((theme) => {
          cards.push({
            type: "theme",
            id: `theme-${theme.id}`,
            title: theme.title,
            subtitle: theme.subtitle,
            filterKey: theme.filterKey,
            filterValue: theme.filterValue,
          });
        });
        insertedThemeCards = true;
      }
    });

    if (!insertedThemeCards) {
      THEME_ITEMS.forEach((theme) => {
        cards.push({
          type: "theme",
          id: `theme-${theme.id}`,
          title: theme.title,
          subtitle: theme.subtitle,
          filterKey: theme.filterKey,
          filterValue: theme.filterValue,
        });
      });
    }

    return cards;
  }, []);

  const selectedPreset = useMemo(
    () => presetCards.find((card) => card.id === selectedPresetId) ?? presetCards[0],
    [presetCards, selectedPresetId],
  );

  const previewCoins = useMemo(() => {
    if (!selectedPreset?.filterKey || !selectedPreset.filterValue) return [];
    const base = { ...EMPTY_FILTERS, [selectedPreset.filterKey]: selectedPreset.filterValue };
    return filterCoins(base).slice(0, 5);
  }, [selectedPreset]);

  const bottomCarouselCards = useMemo(() => {
    const categoryCards = COIN_CATEGORIES.map((cat) => ({
      id: `cat-${cat.id}`,
      title: cat.title,
      subtitle: cat.subtitle,
      filterKey: cat.filterKey,
      filterValue: cat.filterValue,
      coins: cat.coins.slice(0, 3),
    }));

    const themeCards = THEME_ITEMS.map((theme) => {
      const base = { ...EMPTY_FILTERS, [theme.filterKey]: theme.filterValue };
      const matched = filterCoins(base);
      const topMatched = matched.slice(0, 3);
      const missing = Math.max(0, 3 - topMatched.length);
      const fallback = missing > 0
        ? ALL_COINS.filter((coin) => !topMatched.some((picked) => picked.id === coin.id)).slice(0, missing)
        : [];

      return {
        id: `theme-${theme.id}`,
        title: theme.title,
        subtitle: theme.subtitle,
        filterKey: theme.filterKey,
        filterValue: theme.filterValue,
        coins: [...topMatched, ...fallback].slice(0, 3),
      };
    });

    return [...categoryCards, ...themeCards];
  }, []);

  const openCategoryList = (title: string, filterKey?: FilterCategoryId, filterValue?: string) => {
    const base = { ...EMPTY_FILTERS };
    if (filterKey && filterValue) {
      base[filterKey] = filterValue;
    }
    openListWithFilters(title, base);
  };

  const renderCoinIcon = (coin: CoinItem) => {
    return (
      <CoinLogo
        symbol={coin.symbol}
        size={20}
        iconType={coin.iconType}
        iconName={coin.iconName}
        iconColor={coin.iconColor}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>조건 검색</Text>
          <Pressable
            style={styles.headerActionBtn}
            onPress={() => setFilterSheetVisible(true)}
          >
            <Text style={styles.headerActionText}>나만의 조건 설정하기</Text>
          </Pressable>
          <Pressable
            style={styles.headerActionBtn}
            onPress={() => setSavedListVisible(true)}
          >
            <Text style={styles.headerActionText}>저장된 조건</Text>
            {savedFilters.length > 0 && (
              <View style={styles.savedCountBadge}>
                <Text style={styles.savedCountBadgeText}>
                  {savedFilters.length > 99 ? "99+" : savedFilters.length}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.bottomCarouselSection}>
          <WebScrollArrows
            contentContainerStyle={styles.bottomCarouselRow}
            scrollAmount={BOTTOM_CAROUSEL_CARD_WIDTH + BOTTOM_CAROUSEL_GAP}
            decelerationRate="fast"
            snapToInterval={BOTTOM_CAROUSEL_CARD_WIDTH + BOTTOM_CAROUSEL_GAP}
            snapToAlignment="start"
          >
            {bottomCarouselCards.map((card) => (
              <View key={`compare-${card.id}`} style={styles.bottomCarouselCard}>
                <View style={styles.bottomCarouselHeader}>
                  <Text style={styles.bottomCarouselCardTitle}>{card.title}</Text>
                  <Text style={styles.bottomCarouselCardSub} numberOfLines={1}>
                    {card.subtitle}
                  </Text>
                </View>
                <View style={styles.bottomCarouselCoinList}>
                  {card.coins.map((coin) => {
                    const live = liveBySymbol[coin.symbol.toLowerCase()];
                    const displayChange = live?.changePercent ?? coin.change;
                    const positive = displayChange >= 0;
                    return (
                      <Pressable
                        key={`compare-${card.id}-${coin.id}`}
                        style={styles.bottomCarouselCoinRow}
                        onPress={() =>
                          router.push({
                            pathname: "/order-placeholder",
                            params: { name: coin.name, symbol: coin.symbol },
                          })
                        }
                      >
                        <View style={[styles.bottomCarouselCoinIconWrap, { backgroundColor: `${coin.iconColor}15` }]}>
                          {renderCoinIcon(coin)}
                        </View>
                        <View style={styles.bottomCarouselCoinInfo}>
                          <Text style={styles.bottomCarouselCoinName} numberOfLines={1}>
                            {coin.name}
                          </Text>
                          <Text style={styles.bottomCarouselCoinSymbol}>{coin.symbol}</Text>
                        </View>
                        <Text
                          style={[
                            styles.bottomCarouselCoinChange,
                            { color: positive ? Colors.dark.positive : Colors.dark.negative },
                          ]}
                        >
                          {positive ? "+" : ""}
                          {displayChange.toFixed(1)}%
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable
                  onPress={() => openCategoryList(card.title, card.filterKey, card.filterValue)}
                  style={styles.bottomCarouselMoreButton}
                >
                  <Text style={styles.bottomCarouselMoreText}>더 보기</Text>
                </Pressable>
              </View>
            ))}
          </WebScrollArrows>
        </View>

        {popularSearches.length > 0 && (
          <View style={styles.popularSection}>
            <Text style={styles.popularTitle}>인기 검색</Text>
            <View style={styles.popularList}>
              {popularSearches.map((coin, index) => {
                const iconCoin = baseBySymbol.get(coin.symbol.toLowerCase());
                const iconColor = iconCoin?.iconColor ?? Colors.dark.textTertiary;
                const isPositive = coin.changePercent >= 0;
                const isFavorite = favoriteMarkets.includes(coin.market);

                return (
                  <Pressable
                    key={coin.market}
                    style={[styles.popularRow, index === popularSearches.length - 1 && styles.popularRowLast]}
                    onPress={() =>
                      router.push({
                        pathname: "/order-placeholder",
                        params: { name: coin.name, symbol: coin.symbol },
                      })
                    }
                  >
                    <Text style={[styles.popularRank, index < 3 && styles.popularRankTop]}>
                      {index + 1}
                    </Text>
                    <View style={[styles.popularIconWrap, { backgroundColor: `${iconColor}15` }]}>
                      <CoinLogo
                        symbol={coin.symbol}
                        size={18}
                        iconType={iconCoin?.iconType}
                        iconName={iconCoin?.iconName}
                        iconColor={iconColor}
                      />
                    </View>
                    <View style={styles.popularNameCol}>
                      <Text style={styles.popularName} numberOfLines={1}>
                        {coin.symbol}
                      </Text>
                    </View>
                    <View style={styles.popularPriceCol}>
                      <Text style={styles.popularPrice} numberOfLines={1}>
                        {coin.priceFormatted}
                      </Text>
                      <Text
                        style={[
                          styles.popularChange,
                          { color: isPositive ? Colors.dark.positive : Colors.dark.negative },
                        ]}
                      >
                        {isPositive ? "+" : ""}
                        {coin.changePercent.toFixed(2)}%
                      </Text>
                    </View>
                    <Pressable
                      hitSlop={8}
                      onPress={async (e) => {
                        e.stopPropagation();
                        const next = await toggleFavoriteMarket(coin.market);
                        setFavoriteMarkets(next);
                      }}
                      style={styles.popularStarBtn}
                    >
                      <Ionicons
                        name={isFavorite ? "star" : "star-outline"}
                        size={18}
                        color={isFavorite ? Colors.dark.accent : Colors.dark.textTertiary}
                      />
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

      </View>

      <CoinFilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        filters={conditionFilters}
        coinsSource={filterUniverse}
        onApply={(nextFilters) => {
          setFilterSheetVisible(false);
          const hasAny = Object.values(nextFilters).some((v) => v !== null);
          openListWithFilters(hasAny ? "조건 검색 결과" : "전체 코인", nextFilters);
          // 거래소 메인과 분리된 검색 전용 조건이므로 상태를 남기지 않음
          setConditionFilters({ ...EMPTY_FILTERS });
        }}
      />

      <CoinListSheet
        visible={listVisible}
        onClose={() => {
          setListVisible(false);
          setConditionFilters({ ...EMPTY_FILTERS });
          setEditingSavedFilterId(null);
        }}
        initialTitle={listTitle}
        initialFilters={listFilters}
        coinsSource={filterUniverse}
        saveMode={editingSavedFilterId ? "choose" : "default"}
        onSaveAsNewFilter={saveAsNewFilter}
        onUpdateExistingFilter={async (filters, name) => {
          if (!editingSavedFilterId) return;
          const updated = savedFilters.map((item) =>
            item.id === editingSavedFilterId
              ? { ...item, name, filters: { ...filters } }
              : item,
          );
          setSavedFilters(updated);
          await AsyncStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updated));
        }}
        onSaveFilter={async (filters, name) => {
          await saveAsNewFilter(filters, name);
        }}
      />

      <Modal
        visible={savedListVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSavedListVisible(false)}
      >
        <Pressable style={styles.savedModalOverlay} onPress={() => setSavedListVisible(false)}>
          <Pressable style={styles.savedModalCard} onPress={() => {}}>
            <View style={styles.savedModalHeader}>
              <Text style={styles.savedModalTitle}>저장된 조건</Text>
              <Pressable onPress={() => setSavedListVisible(false)} hitSlop={8}>
                <Feather name="x" size={16} color={Colors.dark.textTertiary} />
              </Pressable>
            </View>
            {savedFilters.length === 0 ? (
              <View style={styles.savedModalEmptyWrap}>
                <Text style={styles.savedModalEmptyTitle}>저장된 조건이 없어요</Text>
                <Text style={styles.savedModalEmptyHint}>필터를 설정하고 저장하면 여기에 표시돼요</Text>
                <Pressable
                  onPress={() => {
                    setSavedListVisible(false);
                    setFilterSheetVisible(true);
                  }}
                  style={styles.savedModalEmptyActionBtn}
                >
                  <Feather name="plus" size={13} color={Colors.dark.accent} />
                  <Text style={styles.savedModalEmptyActionText}>필터 추가하기</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView style={styles.savedModalList} contentContainerStyle={styles.savedModalListContent}>
                {savedFilters.map((saved) => (
                  <Pressable
                    key={saved.id}
                    style={styles.savedModalItem}
                    onPress={() => {
                      setSavedListVisible(false);
                      openListWithFilters(saved.name, saved.filters, saved.id);
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.savedModalItemTitle} numberOfLines={1}>
                        {saved.name}
                      </Text>
                      <Text style={styles.savedModalItemSub}>
                        {filterCoins(saved.filters, filterUniverse).length}개 코인
                      </Text>
                    </View>
                    <View style={styles.savedModalActions}>
                      <Pressable
                        hitSlop={8}
                        onPress={(e) => {
                          e.stopPropagation();
                          removeSavedFilter(saved.id);
                        }}
                        style={styles.savedModalDeleteBtn}
                      >
                        <Feather name="x" size={14} color={Colors.dark.textTertiary} />
                      </Pressable>
                      <Feather name="chevron-right" size={14} color={Colors.dark.textTertiary} />
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 24,
  },
  section: {
    gap: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
    marginRight: "auto",
  },
  headerActionBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 10,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  headerActionText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  savedCountBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.negative,
  },
  savedCountBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textTertiary,
  },
  dualRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  dualCard: {
    flex: 1,
    minWidth: 0,
  },
  presetRow: {
    gap: 10,
    paddingRight: 16,
  },
  presetCard: {
    width: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    backgroundColor: Colors.dark.surface,
    padding: 14,
    gap: 4,
  },
  presetCardActive: {
    borderColor: Colors.dark.accent,
    backgroundColor: `${Colors.dark.accent}10`,
  },
  presetTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  presetSub: {
    fontSize: 10.5,
    lineHeight: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
  },
  previewWrap: {
    marginTop: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 8,
  },
  previewActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 2,
    marginBottom: 2,
  },
  previewMore: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.accent,
  },
  previewList: {
    gap: 4,
  },
  previewRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  previewRank: {
    width: 20,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textTertiary,
    textAlign: "right",
  },
  previewIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  previewNameCol: {
    flex: 1,
    minWidth: 0,
  },
  previewName: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  previewChange: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  bottomCarouselSection: {
    marginTop: 14,
    gap: 10,
  },
  bottomCarouselRow: {
    paddingRight: 8,
    alignItems: "flex-start",
  },
  bottomCarouselCard: {
    width: BOTTOM_CAROUSEL_CARD_WIDTH,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    backgroundColor: Colors.dark.surface,
    marginRight: BOTTOM_CAROUSEL_GAP,
    overflow: "hidden",
  },
  bottomCarouselHeader: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 6,
  },
  bottomCarouselCardTitle: {
    fontSize: 13.5,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  bottomCarouselCardSub: {
    marginTop: 2,
    fontSize: 9.5,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
  },
  bottomCarouselCoinList: {
    paddingHorizontal: 8,
    gap: 2,
  },
  bottomCarouselCoinRow: {
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  bottomCarouselCoinIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomCarouselCoinInfo: {
    flex: 1,
    minWidth: 0,
  },
  bottomCarouselCoinName: {
    fontSize: 11.5,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  bottomCarouselCoinSymbol: {
    marginTop: 1,
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textTertiary,
  },
  bottomCarouselCoinChange: {
    fontSize: 11.5,
    fontFamily: "Inter_700Bold",
  },
  bottomCarouselMoreButton: {
    minHeight: 34,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.divider,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  bottomCarouselMoreText: {
    fontSize: 10.5,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  popularSection: {
    marginTop: 14,
    gap: 10,
  },
  popularTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  popularList: {
    borderRadius: 14,
    backgroundColor: Colors.dark.surface,
    overflow: "hidden",
  },
  popularRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.divider,
  },
  popularRowLast: {
    borderBottomWidth: 0,
  },
  popularRank: {
    width: 16,
    textAlign: "right",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textTertiary,
  },
  popularRankTop: {
    color: Colors.dark.accent,
  },
  popularIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  popularNameCol: {
    flex: 1,
    minWidth: 0,
  },
  popularName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  popularPriceCol: {
    alignItems: "flex-end",
    minWidth: 86,
    marginRight: 4,
  },
  popularPrice: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  popularChange: {
    marginTop: 1,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  popularStarBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    marginLeft: 2,
  },
  themeRow: {
    gap: 8,
    paddingRight: 16,
  },
  themeChip: {
    borderRadius: 18,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  themeChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  featureCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  featureTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  featureLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${Colors.dark.accent}18`,
  },
  featureTextCol: {
    flex: 1,
    minWidth: 0,
  },
  featureTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  featureSub: {
    marginTop: 1,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
  },
  savedModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  savedModalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    backgroundColor: Colors.dark.surface,
    maxHeight: "70%",
  },
  savedModalHeader: {
    minHeight: 50,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.divider,
  },
  savedModalTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  savedModalList: {
    flexGrow: 0,
  },
  savedModalListContent: {
    padding: 10,
    gap: 8,
  },
  savedModalItem: {
    borderRadius: 10,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    backgroundColor: Colors.dark.surfaceElevated,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  savedModalActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  savedModalDeleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  savedModalItemTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  savedModalItemSub: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textTertiary,
  },
  savedModalEmptyWrap: {
    alignItems: "center",
    paddingVertical: 26,
    paddingHorizontal: 16,
    gap: 6,
  },
  savedModalEmptyTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  savedModalEmptyHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
  },
  savedModalEmptyActionBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
    backgroundColor: `${Colors.dark.accent}10`,
  },
  savedModalEmptyActionText: {
    fontSize: 12.5,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.accent,
  },
});
