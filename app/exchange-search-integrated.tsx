import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Platform, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Colors from "@/constants/colors";
import ExchangeView from "@/components/ExchangeView";
import CoinFilterSheet from "@/components/CoinFilterSheet";
import { COIN_CATEGORIES, FILTER_CATEGORIES, FilterCategoryId, THEME_ITEMS } from "@/lib/coin-data";
import { ExchangeCoin, loadBithumbExchangeCoins } from "@/lib/exchange-data";
import { getScreenWidth } from "@/lib/screen-utils";

type IntegratedTab = "filter" | "saved";
type SavedFilter = {
  id: string;
  name: string;
  filters: Record<FilterCategoryId, string | null>;
  createdAt: number;
};
type SliderItem = {
  id: string;
  title: string;
  subtitle: string;
  filterKey?: FilterCategoryId;
  filterValue?: string;
  isWhole?: boolean;
};
type ActiveFilterChip = {
  key: string;
  label: string;
  categoryId?: FilterCategoryId;
};

const SLIDER_CARD_WIDTH = Math.max(152, Math.min(188, getScreenWidth() * 0.39));

const SAVED_FILTERS_KEY = "saved_coin_filters";

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

export default function ExchangeSearchIntegratedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<IntegratedTab>("filter");
  const [selectedSliderId, setSelectedSliderId] = useState<string | null>("all-market");
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [filterSheetOpenCategory, setFilterSheetOpenCategory] = useState<FilterCategoryId | null>(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<FilterCategoryId, string | null>>({ ...EMPTY_FILTERS });
  const [liveCoins, setLiveCoins] = useState<ExchangeCoin[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveNameText, setSaveNameText] = useState("");
  const [filterEntryChoiceVisible, setFilterEntryChoiceVisible] = useState(false);
  const [filterSheetOpenedFromSaved, setFilterSheetOpenedFromSaved] = useState(false);

  const hasAnyFilters = useMemo(
    () => Object.values(filters).some((value) => value !== null),
    [filters],
  );

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
      if (coins.length > 0) setLiveCoins(coins);
    });
  }, []);

  const sliderItems = useMemo<SliderItem[]>(() => {
    const categories: SliderItem[] = COIN_CATEGORIES.map((item) => ({
      id: `cat-${item.id}`,
      title: item.title,
      subtitle: item.subtitle,
      filterKey: item.filterKey,
      filterValue: item.filterValue,
    }));

    return [
      {
        id: "all-market",
        title: "전체",
        subtitle: "상승/하락 비율",
        isWhole: true,
      },
      ...categories,
      ...THEME_ITEMS.map((item) => ({
        id: `theme-${item.id}`,
        title: item.title,
        subtitle: item.subtitle,
        filterKey: item.filterKey,
        filterValue: item.filterValue,
      })),
    ];
  }, []);

  const marketRatio = useMemo(() => {
    const base = liveCoins.filter((coin) => coin.quoteCurrency === "KRW");
    if (base.length === 0) return { rise: 50, fall: 50, riseCount: 0, fallCount: 0 };
    const riseCount = base.filter((coin) => coin.changePercent > 0).length;
    const fallCount = base.filter((coin) => coin.changePercent < 0).length;
    const sum = riseCount + fallCount;
    if (sum === 0) return { rise: 50, fall: 50, riseCount, fallCount };
    return {
      rise: (riseCount / sum) * 100,
      fall: (fallCount / sum) * 100,
      riseCount,
      fallCount,
    };
  }, [liveCoins]);

  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];
    (Object.entries(filters) as Array<[FilterCategoryId, string | null]>).forEach(([key, value]) => {
      if (!value) return;
      const category = FILTER_CATEGORIES.find((item) => item.id === key);
      if (!category) return;

      let valueLabel = category.options.find((opt) => opt.id === value)?.label;
      if (!valueLabel && key === "streakUp") {
        valueLabel = `${value}일 이상`;
      } else if (!valueLabel && value.startsWith("custom:") && key === "changeRate") {
        const [period, pct, dir] = value.replace("custom:", "").split(":");
        const periodLabel = period === "1h" ? "1시간" : period === "24h" ? "24시간" : period === "7d" ? "7일" : "30일";
        valueLabel = `${periodLabel} ${dir === "up" ? "+" : "-"}${pct}%`;
      } else if (!valueLabel && value.startsWith("customVol:")) {
        const [min, max] = value.replace("customVol:", "").split("-");
        valueLabel = `${min}~${max}조`;
      } else if (!valueLabel && value.startsWith("customRvol:")) {
        const raw = value.replace("customRvol:", "");
        const parts = raw.split(":");
        const period = parts.length === 2 ? parts[0] : "30d";
        const mult = parts.length === 2 ? parts[1] : raw;
        const periodLabel = period === "24h" ? "24시간" : period === "7d" ? "7일" : "30일";
        valueLabel = `${periodLabel} RVOL ${mult}배+`;
      }
      chips.push({
        key: `${key}:${value}`,
        label: valueLabel ? `${category.title} ${valueLabel}` : category.title,
        categoryId: key,
      });
    });

    const uniq = Array.from(new Map(chips.map((item) => [item.label, item])).values());
    return uniq.length > 0 ? uniq.slice(0, 4) : [{ key: "all", label: "전체 종목" }];
  }, [filters, selectedSliderId, sliderItems]);

  const openFilterSheet = () => {
    setActiveTab("filter");
    setFilterSheetOpenCategory(null);
    setFilterSheetVisible(true);
  };

  const openFilterSheetWithCategory = (categoryId: FilterCategoryId) => {
    setActiveTab("filter");
    setFilterSheetOpenCategory(categoryId);
    setFilterSheetVisible(true);
  };

  const resetToDefaultMain = () => {
    setActiveTab("filter");
    setSelectedSliderId("all-market");
    setFilters({ ...EMPTY_FILTERS });
  };

  const clearAllFiltersToWhole = () => {
    setSelectedSliderId("all-market");
    setFilters({ ...EMPTY_FILTERS });
    setActiveTab("filter");
  };

  const clearSingleFilter = (categoryId: FilterCategoryId) => {
    setFilters((prev) => {
      const next = { ...prev, [categoryId]: null };
      const hasRemain = Object.values(next).some((value) => value !== null);
      setSelectedSliderId(hasRemain ? null : "all-market");
      setActiveTab("filter");
      return next;
    });
  };

  const openFilterBuilder = () => {
    if (activeTab === "saved") {
      setFilterSheetOpenedFromSaved(true);
      openFilterSheet();
      return;
    }
    // 이미 필터가 있으면 진입 방식 선택
    if (hasAnyFilters) {
      setFilterEntryChoiceVisible(true);
      return;
    }
    openFilterSheet();
  };

  const applySliderFilter = (item: (typeof sliderItems)[number]) => {
    if (item.isWhole) {
      setActiveTab("filter");
      setSelectedSliderId(item.id);
      setFilters({ ...EMPTY_FILTERS });
      return;
    }
    if (!item.filterKey || !item.filterValue) return;
    setActiveTab("filter");
    if (selectedSliderId === item.id) {
      // 선택된 카드를 다시 누르면 전체 보기(필터 해제)
      setSelectedSliderId(null);
      setFilters({ ...EMPTY_FILTERS });
      return;
    }
    setSelectedSliderId(item.id);
    setFilters({ ...EMPTY_FILTERS, [item.filterKey]: item.filterValue });
  };

  const openSaveModal = () => {
    if (!hasAnyFilters) return;
    setSaveNameText("");
    setSaveModalVisible(true);
  };

  const saveCurrentFilters = async () => {
    const trimmed = saveNameText.trim();
    if (!trimmed) return;
    const next: SavedFilter = {
      id: `sf_${Date.now()}`,
      name: trimmed,
      filters: { ...filters },
      createdAt: Date.now(),
    };
    const updated = [...savedFilters, next];
    setSavedFilters(updated);
    await AsyncStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updated));
    setSaveModalVisible(false);
    setActiveTab("saved");
  };

  const removeSavedFilter = async (id: string) => {
    const updated = savedFilters.filter((item) => item.id !== id);
    setSavedFilters(updated);
    await AsyncStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updated));
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 12 : insets.top + 6 }]}>
        <Pressable style={styles.backButton} hitSlop={8} onPress={() => router.replace("/(tabs)")}>
          <Feather name="chevron-left" size={24} color={Colors.dark.text} />
        </Pressable>
        <Text style={styles.headerTitle}>통합검색</Text>
        <View style={styles.tipBadge}>
          <Text style={styles.tipBadgeText}>활용TIP</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={20} color={Colors.dark.textTertiary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="코인명 또는 심볼 검색"
          placeholderTextColor={Colors.dark.textTertiary}
        />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsRow}
        >
          {sliderItems.map((item) => (
            <Pressable
              key={item.id}
              style={[
                styles.card,
                selectedSliderId === item.id && styles.cardActive,
              ]}
              onPress={() => applySliderFilter(item)}
            >
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              {item.isWhole ? (
                <View style={styles.ratioWrap}>
                  <View style={styles.ratioBar}>
                    <View style={[styles.ratioRise, { width: `${marketRatio.rise}%` }]} />
                    <View style={[styles.ratioFall, { width: `${marketRatio.fall}%` }]} />
                  </View>
                  <View style={styles.ratioLabels}>
                    <Text style={styles.ratioRiseText}>상승 {marketRatio.riseCount}</Text>
                    <Text style={styles.ratioFallText}>하락 {marketRatio.fallCount}</Text>
                  </View>
                </View>
              ) : (
                <Text
                  style={styles.cardSub}
                  numberOfLines={1}
                >
                  {item.subtitle}
                </Text>
              )}
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.segmentWrap}>
          {activeTab === "filter" ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.activeFiltersArea}
              contentContainerStyle={styles.activeFiltersRow}
            >
              {activeFilterChips.map((chip) =>
                chip.categoryId ? (
                  <Pressable
                    key={chip.key}
                    style={styles.activeFilterChip}
                    onPress={() => openFilterSheetWithCategory(chip.categoryId!)}
                  >
                    <Text style={styles.activeFilterChipText}>{chip.label}</Text>
                    <Pressable
                      hitSlop={8}
                      onPress={(e) => {
                        e.stopPropagation();
                        clearSingleFilter(chip.categoryId!);
                      }}
                      style={styles.activeFilterChipClose}
                    >
                      <Feather name="x" size={11} color={Colors.dark.textTertiary} />
                    </Pressable>
                  </Pressable>
                ) : (
                  <View key={chip.key} style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterChipText}>{chip.label}</Text>
                  </View>
                ),
              )}
            </ScrollView>
          ) : (
            <View style={styles.activeFiltersArea} />
          )}

          <View style={styles.actionRow}>
            <Pressable
              onPress={openFilterBuilder}
              style={[styles.segmentMiniBtn, activeTab === "filter" && styles.segmentMiniBtnActive]}
            >
              <Text style={[styles.segmentMiniText, activeTab === "filter" && styles.segmentMiniTextActive]}>
                필터 설정
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setActiveTab("saved");
                setSelectedSliderId(null);
                setFilters({ ...EMPTY_FILTERS });
              }}
              style={[styles.segmentMiniBtn, activeTab === "saved" && styles.segmentMiniBtnActive]}
            >
              <Text style={[styles.segmentMiniText, activeTab === "saved" && styles.segmentMiniTextActive]}>
                저장된 필터
              </Text>
              {savedFilters.length > 0 && (
                <View style={styles.savedBadge}>
                  <Text style={styles.savedBadgeText}>{savedFilters.length > 99 ? "99+" : savedFilters.length}</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={openSaveModal}
              style={[styles.saveMiniBtn, !hasAnyFilters && styles.saveMiniBtnDisabled]}
              disabled={!hasAnyFilters}
            >
              <Feather name="bookmark" size={12} color={hasAnyFilters ? "#FFFFFF" : Colors.dark.textTertiary} />
              <Text style={[styles.saveMiniText, !hasAnyFilters && styles.saveMiniTextDisabled]}>저장</Text>
            </Pressable>
          </View>
        </View>

        {activeTab === "filter" ? (
          <View style={styles.listWrap}>
            <ExchangeView
              compactMode
              searchQuery={query}
              advancedFilters={hasAnyFilters ? filters : undefined}
            />
          </View>
        ) : (
          <View style={styles.savedListWrap}>
            {savedFilters.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>저장된 조건이 없어요</Text>
                <Text style={styles.emptySub}>필터를 설정하고 저장하면 여기에 표시돼요</Text>
                <Pressable
                  onPress={openFilterSheet}
                  style={styles.emptyActionBtn}
                >
                  <Feather name="plus" size={13} color={Colors.dark.accent} />
                  <Text style={styles.emptyActionText}>필터 추가하기</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.savedList}>
                {savedFilters.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.savedItem}
                    onPress={() => {
                      setFilters({ ...item.filters });
                      setSelectedSliderId(null);
                      setActiveTab("filter");
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.savedItemTitle} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.savedItemSub}>저장된 조건 불러오기</Text>
                    </View>
                    <Pressable
                      hitSlop={8}
                      onPress={(e) => {
                        e.stopPropagation();
                        removeSavedFilter(item.id);
                      }}
                      style={styles.savedDeleteBtn}
                    >
                      <Feather name="x" size={14} color={Colors.dark.textTertiary} />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <CoinFilterSheet
        visible={filterSheetVisible}
        onClose={() => {
          setFilterSheetVisible(false);
          setFilterSheetOpenCategory(null);
          if (filterSheetOpenedFromSaved) {
            clearAllFiltersToWhole();
          }
          setFilterSheetOpenedFromSaved(false);
        }}
        filters={filters}
        initialOpenCategory={filterSheetOpenCategory}
        onApply={(nextFilters) => {
          setFilters(nextFilters);
          setSelectedSliderId(null);
          setActiveTab("filter");
          setFilterSheetOpenCategory(null);
          setFilterSheetOpenedFromSaved(false);
          setFilterSheetVisible(false);
        }}
      />

      <Modal
        visible={saveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSaveModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSaveModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>필터 저장</Text>
            <TextInput
              style={styles.modalInput}
              value={saveNameText}
              onChangeText={setSaveNameText}
              placeholder="필터 이름을 입력하세요"
              placeholderTextColor={Colors.dark.textTertiary}
              autoFocus={Platform.OS !== "web"}
              maxLength={30}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setSaveModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>취소</Text>
              </Pressable>
              <Pressable onPress={saveCurrentFilters} style={styles.modalConfirmBtn}>
                <Text style={styles.modalConfirmText}>저장</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={filterEntryChoiceVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterEntryChoiceVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterEntryChoiceVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>나만의 조건 설정하기</Text>
            <Text style={styles.choiceDesc}>
              현재 적용 중인 조건을 이어서 수정할지, 새로운 조건으로 시작할지 선택해 주세요.
            </Text>
            <View style={styles.choiceActions}>
              <Pressable
                onPress={() => {
                  setFilterEntryChoiceVisible(false);
                  openFilterSheet();
                }}
                style={styles.choicePrimaryBtn}
              >
                <Text style={styles.choicePrimaryText}>현재 조건 이어서 수정</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setSelectedSliderId(null);
                  setFilters({ ...EMPTY_FILTERS });
                  setFilterEntryChoiceVisible(false);
                  openFilterSheet();
                }}
                style={styles.choiceSecondaryBtn}
              >
                <Text style={styles.choiceSecondaryText}>새 조건으로 시작</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  backButton: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  tipBadge: {
    minWidth: 54,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  tipBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 10,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: Platform.OS === "web" ? 16 : 15,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.text,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 16,
  },
  cardsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 2,
  },
  card: {
    width: SLIDER_CARD_WIDTH,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
    minHeight: 74,
  },
  cardActive: {
    borderColor: Colors.dark.accent,
    backgroundColor: `${Colors.dark.accent}12`,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  cardSub: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
  },
  ratioWrap: {
    marginTop: 6,
    gap: 5,
  },
  ratioBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: Colors.dark.surfaceElevated,
    overflow: "hidden",
    flexDirection: "row",
  },
  ratioRise: {
    backgroundColor: Colors.dark.positive,
    height: "100%",
  },
  ratioFall: {
    backgroundColor: Colors.dark.negative,
    height: "100%",
  },
  ratioLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratioRiseText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.positive,
  },
  ratioFallText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.negative,
  },
  segmentWrap: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  activeFiltersArea: {
    flex: 1,
    minHeight: 34,
    marginRight: 2,
  },
  activeFiltersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 6,
  },
  activeFilterChip: {
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  activeFilterChipText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  activeFilterChipClose: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.surfaceElevated,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 2,
  },
  segmentMiniBtn: {
    minHeight: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    backgroundColor: Colors.dark.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 9,
    position: "relative",
    maxWidth: 116,
  },
  segmentMiniBtnActive: {
    borderColor: Colors.dark.textSecondary,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  segmentMiniText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  segmentMiniTextActive: {
    color: Colors.dark.text,
    fontFamily: "Inter_700Bold",
  },
  listWrap: {
    minHeight: 520,
  },
  saveMiniBtn: {
    minHeight: 32,
    borderRadius: 10,
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginRight: -2,
  },
  saveMiniBtnDisabled: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  saveMiniText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  saveMiniTextDisabled: {
    color: Colors.dark.textTertiary,
  },
  savedBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.dark.negative,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  savedBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  savedListWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  savedList: {
    gap: 8,
  },
  savedItem: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  savedItemTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  savedItemSub: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textTertiary,
  },
  savedDeleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.surfaceElevated,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    backgroundColor: Colors.dark.surface,
    padding: 14,
    gap: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  choiceDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    marginTop: -2,
  },
  choiceActions: {
    gap: 8,
    marginTop: 2,
  },
  choicePrimaryBtn: {
    minHeight: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.accent,
  },
  choicePrimaryText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  choiceSecondaryBtn: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.surfaceElevated,
  },
  choiceSecondaryText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  modalInput: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    backgroundColor: Colors.dark.surfaceElevated,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.text,
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
  },
  modalCancelBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.surfaceElevated,
  },
  modalCancelText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.accent,
  },
  modalConfirmText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  emptySub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
  },
  emptyActionBtn: {
    marginTop: 8,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
    backgroundColor: `${Colors.dark.accent}10`,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyActionText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.accent,
  },
});

