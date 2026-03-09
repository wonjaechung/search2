import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  StyleSheet,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import {
  CoinItem,
  ALL_COINS,
  FilterCategoryId,
  filterCoins,
  FILTER_CATEGORIES,
  ThemeItem,
} from "@/lib/coin-data";
import CoinFilterSheet from "./CoinFilterSheet";
import WebModalWrapper from "./WebModalWrapper";
import CoinLogo from "./CoinLogo";
import { ensureCoinLogos } from "@/lib/coin-logos";


type SortKey = "rank" | "change" | "changeWeek" | "changeMonth" | "volume24h" | "marketCap";
type SortDirection = "asc" | "desc";

const EMPTY_FILTERS: Record<FilterCategoryId, string | null> = {
  marketCap: null, changeRate: null, volume: null, rvol: null, category: null, staking: null, lending: null, newListing: null,
  circulatingRatio: null, athDrop: null, atlRise: null, streakUp: null, streakDown: null, newHigh: null, newLow: null, maCross: null, maArray: null, rsi: null, beta: null, kimchiPremium: null, exchangeInflow: null, smallAccountConcentration: null, unrealizedPnl: null,
};

const ROW_HEIGHT = 56;
const HEADER_HEIGHT = 38;
const LEFT_COL_WIDTH = 140;
const DATA_COL_WIDTH = 76;
const WIDE_COL_WIDTH = 100;

interface CoinListSheetProps {
  visible: boolean;
  onClose: () => void;
  initialTitle?: string;
  initialFilters?: Record<FilterCategoryId, string | null>;
  initialTheme?: ThemeItem | null;
  coinsSource?: CoinItem[];
  onSaveFilter?: (filters: Record<FilterCategoryId, string | null>, name: string) => void;
  saveMode?: "default" | "choose";
  onSaveAsNewFilter?: (filters: Record<FilterCategoryId, string | null>, name: string) => void | Promise<void>;
  onUpdateExistingFilter?: (filters: Record<FilterCategoryId, string | null>, name: string) => void | Promise<void>;
}

function parseKoreanNumber(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/,/g, "");
  let num = parseFloat(cleaned.replace(/[조억만원]/g, "")) || 0;
  if (cleaned.includes("조")) num *= 1_000_000_000_000;
  else if (cleaned.includes("억")) num *= 100_000_000;
  else if (cleaned.includes("만")) num *= 10_000;
  return num;
}

function fmtPct(val: number): string {
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(2)}%`;
}

function CoinIcon({ coin }: { coin: CoinItem }) {
  return (
    <CoinLogo
      symbol={coin.symbol}
      size={20}
      iconType={coin.iconType}
      iconName={coin.iconName}
      iconColor={coin.iconColor}
    />
  );
}

export default function CoinListSheet({
  visible,
  onClose,
  initialTitle,
  initialFilters,
  initialTheme,
  coinsSource,
  onSaveFilter,
  saveMode = "default",
  onSaveAsNewFilter,
  onUpdateExistingFilter,
}: CoinListSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [filters, setFilters] = useState<Record<FilterCategoryId, string | null>>({ ...EMPTY_FILTERS });
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [filterSheetOpenCategory, setFilterSheetOpenCategory] = useState<FilterCategoryId | null>(null);

  const leftScrollRef = useRef<ScrollView>(null);
  const rightScrollRef = useRef<ScrollView>(null);
  const scrollingRef = useRef<"left" | "right" | null>(null);

  useEffect(() => {
    if (visible) {
      setFilters(initialFilters ?? { ...EMPTY_FILTERS });
      setSearchQuery("");
      setSortKey("rank");
      setSortDir("asc");
    }
  }, [visible, initialFilters]);

  const hasActiveFilters = Object.values(filters).some(v => v !== null);

  const [filterSaved, setFilterSaved] = useState(false);
  const [saveNameVisible, setSaveNameVisible] = useState(false);
  const [saveNameText, setSaveNameText] = useState("");
  const [saveOptionVisible, setSaveOptionVisible] = useState(false);
  const [pendingSave, setPendingSave] = useState<{
    filters: Record<FilterCategoryId, string | null>;
    name: string;
  } | null>(null);

  const generateDefaultName = useCallback((f: Record<FilterCategoryId, string | null>) => {
    if (initialTheme) return initialTheme.title;
    const activeKeys = Object.entries(f)
      .filter(([, v]) => v !== null)
      .map(([k]) => {
        const cat = FILTER_CATEGORIES.find(c => c.id === k);
        return cat?.title || k;
      });
    return activeKeys.join(" + ");
  }, [initialTheme]);

  const openSaveNamePopup = useCallback(() => {
    if (!hasActiveFilters) return;
    setSaveNameText(generateDefaultName(filters));
    setSaveNameVisible(true);
  }, [hasActiveFilters, filters, generateDefaultName]);

  const confirmSave = useCallback(() => {
    const name = saveNameText.trim() || generateDefaultName(filters);
    const payload = { filters: { ...filters }, name };
    setSaveNameVisible(false);

    if (saveMode === "choose" && onSaveAsNewFilter && onUpdateExistingFilter) {
      setPendingSave(payload);
      setSaveOptionVisible(true);
      return;
    }

    if (!onSaveFilter) return;
    onSaveFilter(payload.filters, payload.name);
    setFilterSaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setFilterSaved(false), 2000);
  }, [filters, saveNameText, generateDefaultName, saveMode, onSaveFilter, onSaveAsNewFilter, onUpdateExistingFilter]);

  const baseCoins = useMemo(() => {
    const source = coinsSource ?? ALL_COINS;
    const hasFilter = Object.values(filters).some(v => v !== null);
    if (hasFilter) return filterCoins(filters, source);
    return [...source];
  }, [filters, coinsSource]);

  useEffect(() => {
    ensureCoinLogos(baseCoins.map((coin) => coin.symbol));
  }, [baseCoins]);

  const filteredCoins = useMemo(() => {
    let coins = baseCoins;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      coins = coins.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
      );
    }
    return coins;
  }, [baseCoins, searchQuery]);

  const sortedCoins = useMemo(() => {
    const list = [...filteredCoins];
    list.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortKey) {
        case "rank": aVal = a.rank ?? 999; bVal = b.rank ?? 999; break;
        case "change": aVal = a.change; bVal = b.change; break;
        case "changeWeek": aVal = a.changeWeek ?? 0; bVal = b.changeWeek ?? 0; break;
        case "changeMonth": aVal = a.changeMonth ?? 0; bVal = b.changeMonth ?? 0; break;
        case "marketCap": aVal = parseKoreanNumber(a.marketCap ?? "0"); bVal = parseKoreanNumber(b.marketCap ?? "0"); break;
        case "volume24h": aVal = parseKoreanNumber(a.volume24h ?? "0"); bVal = parseKoreanNumber(b.volume24h ?? "0"); break;
        default: aVal = 0; bVal = 0;
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
    return list;
  }, [filteredCoins, sortKey, sortDir]);

  const handleSort = useCallback((key: SortKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "rank" ? "asc" : "desc");
    }
  }, [sortKey]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  const navigateToOrderPlaceholder = useCallback(
    (coin: CoinItem) => {
      // Close modal first, then navigate so the new screen is visible immediately.
      onClose();
      setTimeout(() => {
        router.push({
          pathname: "/order-placeholder",
          params: { name: coin.name, symbol: coin.symbol },
        });
      }, Platform.OS === "web" ? 0 : 180);
    },
    [onClose, router],
  );

  const removeFilter = useCallback((catId: FilterCategoryId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilters(prev => ({ ...prev, [catId]: null }));
  }, []);

  const activeFilterEntries = Object.entries(filters).filter(([_, v]) => v !== null);

  const handleLeftScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (scrollingRef.current === "right") return;
    scrollingRef.current = "left";
    rightScrollRef.current?.scrollTo({ y: e.nativeEvent.contentOffset.y, animated: false });
    setTimeout(() => { scrollingRef.current = null; }, 16);
  }, []);

  const handleRightScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (scrollingRef.current === "left") return;
    scrollingRef.current = "right";
    leftScrollRef.current?.scrollTo({ y: e.nativeEvent.contentOffset.y, animated: false });
    setTimeout(() => { scrollingRef.current = null; }, 16);
  }, []);

  const renderSortHeader = useCallback((label: string, sortKeyVal: SortKey, width?: number) => {
    const isActive = sortKey === sortKeyVal;
    return (
      <Pressable
        key={sortKeyVal}
        onPress={() => handleSort(sortKeyVal)}
        style={[styles.colHeader, width ? { width } : undefined]}
      >
        <Text style={[styles.colHeaderText, isActive && { color: Colors.dark.accent }]}>
          {label}
        </Text>
        <Feather
          name={isActive ? (sortDir === "asc" ? "chevron-up" : "chevron-down") : "chevron-down"}
          size={12}
          color={isActive ? Colors.dark.accent : Colors.dark.textTertiary}
        />
      </Pressable>
    );
  }, [sortKey, sortDir, handleSort]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <WebModalWrapper>
      <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 16 : insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Pressable
                onPress={handleClose}
                hitSlop={12}
                style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]}
              >
                <Feather name="arrow-left" size={20} color={Colors.dark.text} />
              </Pressable>
              <Text style={styles.headerTitle} numberOfLines={1}>코인 골라보기</Text>
            </View>
            <View style={styles.headerRight}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFilterSheetOpenCategory(null);
                  setFilterSheetVisible(true);
                }}
                style={({ pressed }) => [styles.headerActionBtn, pressed && { opacity: 0.5 }]}
              >
                <Feather name="plus" size={14} color={Colors.dark.text} />
                <Text style={styles.headerActionText}>필터 추가</Text>
              </Pressable>
              {hasActiveFilters && (
                <Pressable
                  onPress={openSaveNamePopup}
                  style={({ pressed }) => [styles.headerActionBtn, filterSaved && styles.headerActionBtnSaved, pressed && { opacity: 0.5 }]}
                >
                  <Feather name={filterSaved ? "check" : "save"} size={14} color={filterSaved ? Colors.dark.positive : Colors.dark.text} />
                  <Text style={[styles.headerActionText, filterSaved && { color: Colors.dark.positive }]}>
                    {filterSaved ? "저장됨" : "필터 저장"}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {activeFilterEntries.length > 0 && (
            <View style={styles.filterChipsRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsScroll}>
                {activeFilterEntries.map(([catId, val]) => {
                  const cat = FILTER_CATEGORIES.find(c => c.id === catId);
                  if (!cat) return null;
                  const option = cat.options.find(o => o.id === val);
                  let valueLabel = option?.label ?? "";
                  if (!valueLabel && val) {
                    const pMap: Record<string, string> = { "1h": "1시간", "24h": "24시간", "7d": "7일", "30d": "30일", "90d": "90일", "1y": "1년", "6m": "6개월", "3m": "3개월", "1m": "1개월", "all": "전체" };
                    if (val.startsWith("customRank:")) {
                      const p = val.replace("customRank:", "").split("-");
                      valueLabel = `순위 ${p[0]}~${p[1]}위`;
                    } else if (val.startsWith("customCap:")) {
                      const p = val.replace("customCap:", "").split("-");
                      valueLabel = `${p[0]}~${p[1]}조원`;
                    } else if (val.startsWith("custom:") && catId === "changeRate") {
                      const p = val.replace("custom:", "").split(":");
                      valueLabel = `${pMap[p[0]] || p[0]} ${p[2] === "up" ? "+" : "-"}${p[1]}%`;
                    } else if (val.startsWith("custom:") && catId === "athDrop") {
                      const p = val.replace("custom:", "").split(":");
                      valueLabel = `${pMap[p[0]] || p[0]} 기준 -${p[1]}% ${p[2] === "under" ? "이하" : "이상"}`;
                    } else if (val.startsWith("custom:") && catId === "atlRise") {
                      const p = val.replace("custom:", "").split(":");
                      valueLabel = `${pMap[p[0]] || p[0]} 기준 +${p[1]}% ${p[2] === "under" ? "이하" : "이상"}`;
                    } else if (val.startsWith("custom:") && (catId === "rsi")) {
                      const p = val.replace("custom:", "").split(":");
                      valueLabel = `RSI ${p[0]}~${p[1]}`;
                    } else if (val.startsWith("custom:") && (catId === "beta")) {
                      const p = val.replace("custom:", "").split(":");
                      valueLabel = `${p[0]}~${p[1]}`;
                    } else if (val.startsWith("custom:") && catId === "kimchiPremium") {
                      const p = val.replace("custom:", "").split(":");
                      valueLabel = `김프 ${p[0]}~${p[1]}%`;
                    } else if (val.startsWith("usdtDiff:") && catId === "kimchiPremium") {
                      const p = val.replace("usdtDiff:", "").split(":");
                      valueLabel = `평균 김프 대비 ${p[0]}% ${p[1] === "high" ? "더 높은" : "더 낮은"}`;
                    } else if (val.startsWith("streakWin:") && (catId === "streakUp" || catId === "streakDown")) {
                      const p = val.split(":");
                      valueLabel = `${p[1]}일 내 ${p[2]}일 연속 ${catId === "streakUp" ? "상승" : "하락"}`;
                    } else if (val.startsWith("scan:") && (catId === "newHigh" || catId === "newLow")) {
                      const p = val.split(":");
                      valueLabel = `${p[1]}일 내 ${p[2]}주 ${catId === "newHigh" ? "신고가" : "신저가"}`;
                    } else if (val.startsWith("macross:") && catId === "maCross") {
                      const p = val.replace("macross:", "").split(":");
                      valueLabel = `${p[0]}일선/${p[1]}일선 · ${p[2]}일 · ${p[3] === "up" ? "상향돌파" : "하향돌파"}`;
                    } else if (val.startsWith("ma:") && catId === "maCross") {
                      const p = val.replace("ma:", "").split(":");
                      valueLabel = `${p[0]}일선/${p[2]}일선 · ${p[3]}일 · ${p[4] === "bull" ? "상향돌파" : "하향돌파"}`;
                    } else if (val.startsWith("customVol:")) {
                      const parts = val.replace("customVol:", "").split("-");
                      valueLabel = `${parts[0]}~${parts[1]}억`;
                    } else if (val.startsWith("customRvol:")) {
                      const raw = val.replace("customRvol:", "");
                      const parts = raw.split(":");
                      const period = parts.length === 2 ? parts[0] : "30d";
                      const mult = parts.length === 2 ? parts[1] : raw;
                      const pLabel = period === "24h" ? "24시간" : period === "7d" ? "7일" : "30일";
                      valueLabel = `${pLabel} RVOL ${mult}배+`;
                    } else {
                      valueLabel = val;
                    }
                  }
                  return (
                    <Pressable
                      key={catId}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setFilterSheetOpenCategory(catId as FilterCategoryId);
                        setFilterSheetVisible(true);
                      }}
                      style={styles.filterChip}
                    >
                      <Text style={styles.filterChipText}>
                        <Text style={styles.filterChipCategory}>{cat.title}</Text>
                        {"\n"}
                        <Text style={styles.filterChipValue}>{valueLabel}</Text>
                      </Text>
                      <Feather name="chevron-down" size={12} color={Colors.dark.textSecondary} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {sortedCoins.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="search" size={32} color={Colors.dark.textTertiary} />
            <Text style={styles.emptyTitle}>결과 없음</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? `"${searchQuery}"에 해당하는 코인이 없어요` : "조건에 맞는 코인이 없어요"}
            </Text>
          </View>
        ) : (
          <View style={styles.tableWrap}>
            <View style={styles.fixedCol}>
              <View style={[styles.fixedColHeader, { height: HEADER_HEIGHT }]}>
                <Text style={styles.colHeaderText}>가상자산명</Text>
              </View>
              <ScrollView
                ref={leftScrollRef}
                showsVerticalScrollIndicator={false}
                onScroll={handleLeftScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingBottom: (hasActiveFilters ? 90 : 0) + (Platform.OS === "web" ? 34 : insets.bottom + 16) }}
              >
                {sortedCoins.map((coin) => (
                  <Pressable
                    key={coin.id}
                    style={[styles.fixedRow, { height: ROW_HEIGHT }]}
                    onPress={() => navigateToOrderPlaceholder(coin)}
                  >
                    <View style={[styles.coinIcon, { backgroundColor: `${coin.iconColor}15` }]}>
                      <CoinIcon coin={coin} />
                    </View>
                    <View style={styles.nameWrap}>
                      <Text style={styles.coinName} numberOfLines={1}>{coin.name}</Text>
                      <Text style={styles.coinTicker}>{coin.symbol}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
              <View>
                <View style={[styles.scrollHeader, { height: HEADER_HEIGHT }]}>
                  {renderSortHeader("오늘", "change")}
                  {renderSortHeader("1주일", "changeWeek")}
                  {renderSortHeader("1개월", "changeMonth")}
                  {renderSortHeader("거래량(24H)", "volume24h", WIDE_COL_WIDTH)}
                  {renderSortHeader("시가총액", "marketCap", WIDE_COL_WIDTH)}
                </View>
                <ScrollView
                  ref={rightScrollRef}
                  showsVerticalScrollIndicator={false}
                  onScroll={handleRightScroll}
                  scrollEventThrottle={16}
                  contentContainerStyle={{ paddingBottom: (hasActiveFilters ? 90 : 0) + (Platform.OS === "web" ? 34 : insets.bottom + 16) }}
                >
                  {sortedCoins.map((coin) => (
                    <Pressable
                      key={coin.id}
                      style={[styles.scrollRow, { height: ROW_HEIGHT }]}
                      onPress={() => navigateToOrderPlaceholder(coin)}
                    >
                      <View style={styles.dataCell}>
                        <Text style={[styles.dataCellText, { color: coin.change >= 0 ? Colors.dark.positive : Colors.dark.negative }]}>
                          {fmtPct(coin.change)}
                        </Text>
                      </View>
                      <View style={styles.dataCell}>
                        <Text style={[styles.dataCellText, { color: (coin.changeWeek ?? 0) >= 0 ? Colors.dark.positive : Colors.dark.negative }]}>
                          {fmtPct(coin.changeWeek ?? 0)}
                        </Text>
                      </View>
                      <View style={styles.dataCell}>
                        <Text style={[styles.dataCellText, { color: (coin.changeMonth ?? 0) >= 0 ? Colors.dark.positive : Colors.dark.negative }]}>
                          {fmtPct(coin.changeMonth ?? 0)}
                        </Text>
                      </View>
                      <View style={[styles.dataCell, { width: WIDE_COL_WIDTH }]}>
                        <Text style={styles.dataCellWhite}>{coin.volume24h ?? "-"}</Text>
                      </View>
                      <View style={[styles.dataCell, { width: WIDE_COL_WIDTH }]}>
                        <Text style={styles.dataCellWhite}>{coin.marketCap ?? "-"}</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      <CoinFilterSheet
        visible={filterSheetVisible}
        onClose={() => {
          setFilterSheetVisible(false);
          setFilterSheetOpenCategory(null);
        }}
        filters={filters}
        coinsSource={coinsSource}
        onApply={(newFilters) => {
          setFilters(newFilters);
        }}
        initialOpenCategory={filterSheetOpenCategory}
      />

      {saveNameVisible && (
        <Pressable style={styles.saveNameOverlay} onPress={() => setSaveNameVisible(false)}>
          <Pressable style={styles.saveNameModal} onPress={() => {}}>
            <Text style={styles.saveNameTitle}>필터 이름 입력</Text>
            <TextInput
              style={styles.saveNameInput}
              value={saveNameText}
              onChangeText={setSaveNameText}
              placeholder="필터 이름을 입력하세요"
              placeholderTextColor={Colors.dark.textTertiary}
              autoFocus={Platform.OS !== "web"}
              selectTextOnFocus
              maxLength={30}
            />
            <View style={styles.saveNameActions}>
              <Pressable
                onPress={() => setSaveNameVisible(false)}
                style={({ pressed }) => [styles.saveNameBtn, styles.saveNameCancelBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.saveNameCancelText}>취소</Text>
              </Pressable>
              <Pressable
                onPress={confirmSave}
                style={({ pressed }) => [styles.saveNameBtn, styles.saveNameConfirmBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.saveNameConfirmText}>저장</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      )}

      {saveOptionVisible && (
        <Pressable
          style={styles.saveNameOverlay}
          onPress={() => {
            setSaveOptionVisible(false);
            setPendingSave(null);
          }}
        >
          <Pressable style={styles.saveNameModal} onPress={() => {}}>
            <Text style={styles.saveNameTitle}>저장 방식 선택</Text>
            <Text style={styles.saveNameSubtitle}>
              현재 필터를 기존에 덮어쓸지, 새 필터로 저장할지 선택하세요.
            </Text>
            <View style={styles.saveNameActionsColumn}>
              <Pressable
                onPress={async () => {
                  if (!pendingSave || !onSaveAsNewFilter) return;
                  await onSaveAsNewFilter(pendingSave.filters, pendingSave.name);
                  setSaveOptionVisible(false);
                  setPendingSave(null);
                  setFilterSaved(true);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setTimeout(() => setFilterSaved(false), 2000);
                }}
                style={({ pressed }) => [styles.saveNameBtn, styles.saveNameCancelBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.saveNameCancelText}>새 필터로 저장</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (!pendingSave || !onUpdateExistingFilter) return;
                  await onUpdateExistingFilter(pendingSave.filters, pendingSave.name);
                  setSaveOptionVisible(false);
                  setPendingSave(null);
                  setFilterSaved(true);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setTimeout(() => setFilterSaved(false), 2000);
                }}
                style={({ pressed }) => [styles.saveNameBtn, styles.saveNameConfirmBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.saveNameConfirmText}>기존 필터 업데이트</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      )}
      </WebModalWrapper>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.divider,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  headerActionBtnSaved: {
    borderColor: Colors.dark.positive,
    backgroundColor: `${Colors.dark.positive}15`,
  },
  headerActionText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.text,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 10,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: Platform.OS === "web" ? 16 : 14,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.text,
    padding: 0,
  },
  filterChipsRow: {
    paddingBottom: 10,
  },
  filterChipsScroll: {
    paddingHorizontal: 12,
    gap: 6,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  filterChipText: {
    flexShrink: 1,
  },
  filterChipCategory: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  filterChipValue: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
  },
  tableWrap: {
    flex: 1,
    flexDirection: "row",
  },
  fixedCol: {
    width: LEFT_COL_WIDTH,
    borderRightWidth: 1,
    borderRightColor: Colors.dark.divider,
  },
  fixedColHeader: {
    justifyContent: "center",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.divider,
  },
  fixedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.divider,
  },
  coinIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  nameWrap: {
    flex: 1,
  },
  coinName: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  coinTicker: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
    marginTop: 1,
  },
  scrollHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.divider,
  },
  colHeader: {
    width: DATA_COL_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
    paddingHorizontal: 6,
  },
  colHeaderText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textTertiary,
  },
  scrollRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.divider,
  },
  dataCell: {
    width: DATA_COL_WIDTH,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  dataCellText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  dataCellWhite: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.text,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingBottom: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.textSecondary,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
    textAlign: "center",
  },
  saveNameOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 999,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: 30,
  },
  saveNameModal: {
    width: "100%",
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.dark.divider,
  },
  saveNameTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
    textAlign: "center" as const,
  },
  saveNameSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
    textAlign: "center" as const,
    lineHeight: 18,
  },
  saveNameInput: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.divider,
  },
  saveNameActions: {
    flexDirection: "row" as const,
    gap: 10,
  },
  saveNameActionsColumn: {
    gap: 10,
  },
  saveNameBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center" as const,
  },
  saveNameCancelBtn: {
    backgroundColor: Colors.dark.surface,
  },
  saveNameCancelText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  saveNameConfirmBtn: {
    backgroundColor: Colors.dark.accent,
  },
  saveNameConfirmText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
  },
});
