import React, { useState, useMemo, useEffect, useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Modal, TextInput, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, withTiming, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { CoinCategory, CoinItem, FilterCategoryId, filterCoins, FILTER_CATEGORIES, THEME_ITEMS, ThemeItem } from "@/lib/coin-data";
import CoinFilterSheet from "./CoinFilterSheet";
import CoinListSheet from "./CoinListSheet";
import { getScreenWidth } from "@/lib/screen-utils";
import WebScrollArrows from "./WebScrollArrows";

const CARD_WIDTH = getScreenWidth() * 0.65;

const EMPTY_FILTERS: Record<FilterCategoryId, string | null> = {
  marketCap: null, changeRate: null, volume: null, rvol: null, category: null, staking: null, lending: null, newListing: null,
  circulatingRatio: null, athDrop: null, atlRise: null, streakUp: null, streakDown: null, newHigh: null, newLow: null, maCross: null, maArray: null, rsi: null, beta: null, kimchiPremium: null, exchangeInflow: null, smallAccountConcentration: null, unrealizedPnl: null,
};

function CoinRow({ coin }: { coin: CoinItem }) {
  const isPositive = coin.change >= 0;

  const getIcon = () => {
    if (coin.iconType === "mci") {
      return <MaterialCommunityIcons name={coin.iconName as any} size={20} color={coin.iconColor} />;
    }
    return <Feather name={coin.iconName as any} size={16} color={coin.iconColor} />;
  };

  return (
    <View style={styles.coinRow}>
      <View style={[styles.coinIcon, { backgroundColor: `${coin.iconColor}15` }]}>
        {getIcon()}
      </View>
      <View style={styles.coinInfo}>
        <Text style={styles.coinName} numberOfLines={1}>{coin.name}</Text>
        <Text style={styles.coinSymbol}>{coin.symbol}</Text>
      </View>
      <Text
        style={[
          styles.coinChange,
          { color: isPositive ? Colors.dark.positive : Colors.dark.negative },
        ]}
      >
        {isPositive ? "+" : ""}{coin.change}%
      </Text>
    </View>
  );
}

function FilteredCoinRow({ coin }: { coin: CoinItem }) {
  const isPositive = coin.change >= 0;

  const getIcon = () => {
    if (coin.iconType === "mci") {
      return <MaterialCommunityIcons name={coin.iconName as any} size={22} color={coin.iconColor} />;
    }
    return <Feather name={coin.iconName as any} size={18} color={coin.iconColor} />;
  };

  const tags: { label: string; color: string }[] = [];
  if (coin.category === "layer1") tags.push({ label: "레이어1", color: "#00B8D9" });
  if (coin.category === "layer2") tags.push({ label: "레이어2", color: "#28A0F0" });
  if (coin.category === "defi") tags.push({ label: "DeFi", color: "#FF007A" });
  if (coin.category === "meme") tags.push({ label: "밈코인", color: "#FFD93D" });
  if (coin.category === "ai") tags.push({ label: "AI", color: "#A855F7" });
  if (coin.category === "rwa") tags.push({ label: "RWA", color: "#1C64F2" });
  if (coin.category === "infra") tags.push({ label: "인프라", color: "#FF4444" });
  if (coin.stakable) tags.push({ label: "스테이킹", color: Colors.dark.accent });

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.filteredRow}>
      <View style={[styles.filteredIcon, { backgroundColor: `${coin.iconColor}15` }]}>
        {getIcon()}
      </View>
      <View style={styles.filteredInfo}>
        <View style={styles.filteredNameRow}>
          <Text style={styles.filteredName}>{coin.name}</Text>
          <Text style={styles.filteredSymbol}>{coin.symbol}</Text>
        </View>
        {tags.length > 0 && (
          <View style={styles.tagRow}>
            {tags.slice(0, 3).map((tag, i) => (
              <View key={i} style={[styles.miniTag, { backgroundColor: `${tag.color}15` }]}>
                <Text style={[styles.miniTagText, { color: tag.color }]}>{tag.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <Text
        style={[
          styles.filteredChange,
          { color: isPositive ? Colors.dark.positive : Colors.dark.negative },
        ]}
      >
        {isPositive ? "+" : ""}{coin.change}%
      </Text>
    </Animated.View>
  );
}

function CategoryCard({ category, onSeeAll }: { category: CoinCategory; onSeeAll: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{category.title}</Text>
        <Text style={styles.cardSubtitle}>{category.subtitle}</Text>
      </View>
      <View style={styles.coinList}>
        {category.coins.map((coin) => (
          <CoinRow key={coin.id} coin={coin} />
        ))}
      </View>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSeeAll();
        }}
        style={({ pressed }) => [styles.seeAllButton, pressed && { opacity: 0.6 }]}
      >
        <Text style={styles.seeAllText}>더 보기</Text>
      </Pressable>
    </View>
  );
}

function ThemeRow({ theme, onPress }: { theme: ThemeItem; onPress: () => void }) {
  const resultCount = useMemo(() => {
    const f = { ...EMPTY_FILTERS, [theme.filterKey]: theme.filterValue };
    return filterCoins(f).length;
  }, [theme]);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [styles.themeRow, pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}
    >
      <View style={[styles.themeIcon, { backgroundColor: `${theme.iconColor}15` }]}>
        <Feather name={theme.icon as any} size={20} color={theme.iconColor} />
      </View>
      <View style={styles.themeTextCol}>
        <Text style={styles.themeTitle}>{theme.title}</Text>
        <Text style={styles.themeSubtitle} numberOfLines={1}>{theme.subtitle}</Text>
      </View>
      <View style={styles.themeRight}>
        <Text style={styles.themeCount}>{resultCount}</Text>
        <Feather name="chevron-right" size={16} color={Colors.dark.textTertiary} />
      </View>
    </Pressable>
  );
}

function ActiveFilterChips({
  filters,
  onRemove,
  activeThemeTitle,
  onClearTheme,
}: {
  filters: Record<FilterCategoryId, string | null>;
  onRemove: (catId: FilterCategoryId) => void;
  activeThemeTitle?: string;
  onClearTheme?: () => void;
}) {
  const activeFilters = Object.entries(filters).filter(([_, v]) => v !== null);
  if (activeFilters.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.activeFiltersScroll}
    >
      {activeThemeTitle && onClearTheme ? (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClearTheme();
          }}
          style={styles.activeThemeChip}
        >
          <Text style={styles.activeThemeChipText}>{activeThemeTitle}</Text>
          <Feather name="x" size={12} color="#FFF" />
        </Pressable>
      ) : (
        activeFilters.map(([catId, optionId]) => {
          const cat = FILTER_CATEGORIES.find(c => c.id === catId);
          const option = cat?.options.find(o => o.id === optionId);
          if (!cat || !option) return null;

          return (
            <Pressable
              key={catId}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onRemove(catId as FilterCategoryId);
              }}
              style={styles.activeChip}
            >
              <Text style={styles.activeChipText}>{option.label}</Text>
              <Feather name="x" size={12} color={Colors.dark.accent} />
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

interface CoinPickerProps {
  categories: CoinCategory[];
}

const SAVED_FILTERS_KEY = "saved_coin_filters";

interface SavedFilter {
  id: string;
  name: string;
  filters: Record<FilterCategoryId, string | null>;
  createdAt: number;
}

export default function CoinPicker({ categories }: CoinPickerProps) {
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<Record<FilterCategoryId, string | null>>({ ...EMPTY_FILTERS });
  const [activeTheme, setActiveTheme] = useState<ThemeItem | null>(null);
  const [coinListVisible, setCoinListVisible] = useState(false);
  const [coinListTitle, setCoinListTitle] = useState("");
  const [coinListFilters, setCoinListFilters] = useState<Record<FilterCategoryId, string | null>>({ ...EMPTY_FILTERS });
  const [coinListTheme, setCoinListTheme] = useState<ThemeItem | null>(null);

  const [filterFromBookmark, setFilterFromBookmark] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [saveNameVisible, setSaveNameVisible] = useState(false);
  const [saveNameText, setSaveNameText] = useState("");
  const [pendingSaveFilters, setPendingSaveFilters] = useState<Record<FilterCategoryId, string | null> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(SAVED_FILTERS_KEY).then(val => {
      if (val) try { setSavedFilters(JSON.parse(val)); } catch {}
    });
  }, []);

  useEffect(() => {
    if (!coinListVisible) {
      AsyncStorage.getItem(SAVED_FILTERS_KEY).then(val => {
        if (val) try { setSavedFilters(JSON.parse(val)); } catch {}
      });
    }
  }, [coinListVisible]);

  const isFiltering = Object.values(filters).some(v => v !== null);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const filteredCoins = useMemo(() => isFiltering ? filterCoins(filters) : [], [filters, isFiltering]);

  const removeFilter = (catId: FilterCategoryId) => {
    setFilters(prev => ({ ...prev, [catId]: null }));
    setActiveTheme(null);
  };

  const handleThemePress = (theme: ThemeItem) => {
    setCoinListTheme(theme);
    setCoinListTitle(theme.title);
    setCoinListFilters({ ...EMPTY_FILTERS, [theme.filterKey]: theme.filterValue });
    setCoinListVisible(true);
  };

  const handleSeeAll = (category: CoinCategory) => {
    setCoinListTheme(null);
    setCoinListTitle(category.title);
    if (category.filterKey && category.filterValue) {
      setCoinListFilters({ ...EMPTY_FILTERS, [category.filterKey]: category.filterValue });
    } else {
      setCoinListFilters({ ...EMPTY_FILTERS });
    }
    setCoinListVisible(true);
  };

  const clearTheme = () => {
    setActiveTheme(null);
    setFilters({ ...EMPTY_FILTERS });
  };

  const generateDefaultName = useCallback((f: Record<FilterCategoryId, string | null>, theme?: ThemeItem | null) => {
    if (theme) return theme.title;
    const activeKeys = Object.entries(f)
      .filter(([, v]) => v !== null)
      .map(([k]) => {
        const cat = FILTER_CATEGORIES.find(c => c.id === k);
        return cat?.title || k;
      });
    return activeKeys.join(" + ");
  }, []);

  const openSavePopup = useCallback((filtersToSave: Record<FilterCategoryId, string | null>, theme?: ThemeItem | null) => {
    const defaultName = generateDefaultName(filtersToSave, theme);
    setSaveNameText(defaultName);
    setPendingSaveFilters({ ...filtersToSave });
    setSaveNameVisible(true);
  }, [generateDefaultName]);

  const confirmSaveFilter = useCallback(async () => {
    if (!pendingSaveFilters) return;
    const name = saveNameText.trim() || generateDefaultName(pendingSaveFilters);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newSaved: SavedFilter = {
      id: `sf_${Date.now()}`,
      name,
      filters: { ...pendingSaveFilters },
      createdAt: Date.now(),
    };
    const updated = [...savedFilters, newSaved];
    setSavedFilters(updated);
    await AsyncStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updated));
    setSaveNameVisible(false);
    setPendingSaveFilters(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [pendingSaveFilters, saveNameText, savedFilters, generateDefaultName]);

  const saveCurrentFilter = useCallback(() => {
    if (activeFilterCount === 0) return;
    openSavePopup(filters, activeTheme);
  }, [filters, activeFilterCount, activeTheme, openSavePopup]);

  const deleteSavedFilter = useCallback(async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = savedFilters.filter(s => s.id !== id);
    setSavedFilters(updated);
    await AsyncStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updated));
  }, [savedFilters]);

  const loadSavedFilter = useCallback((saved: SavedFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCoinListTheme(null);
    setCoinListTitle(saved.name);
    setCoinListFilters(saved.filters);
    setCoinListVisible(true);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>코인 골라보기</Text>
          <Text style={styles.sectionSubtitle}>
            {isFiltering
              ? activeTheme ? activeTheme.title : `${activeFilterCount}개 필터 적용 중`
              : "조건별 탐색 · 필터 검색"}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <Pressable
            style={[styles.filterButton, showSavedFilters && styles.bookmarkButtonActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowSavedFilters(prev => !prev);
            }}
          >
            <Feather name="bookmark" size={15} color={showSavedFilters ? Colors.dark.accent : Colors.dark.textSecondary} />
            {savedFilters.length > 0 && !showSavedFilters && (
              <View style={styles.filterCountBadge}>
                <Text style={styles.filterCountText}>{savedFilters.length}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {isFiltering && !showSavedFilters && (
        <ActiveFilterChips
          filters={filters}
          onRemove={removeFilter}
          activeThemeTitle={activeTheme?.title}
          onClearTheme={clearTheme}
        />
      )}

      {showSavedFilters && savedFilters.length > 0 && (
        <View style={styles.savedFiltersList}>
          {savedFilters.map(sf => {
            const count = filterCoins(sf.filters).length;
            const periodMap: Record<string, string> = { "1h": "1시간", "24h": "24시간", "7d": "7일", "30d": "30일", "90d": "90일", "1y": "1년", "all": "전체" };
            const filterTags = Object.entries(sf.filters)
              .filter(([, v]) => v !== null)
              .map(([k, v]) => {
                const cat = FILTER_CATEGORIES.find(c => c.id === k);
                if (!cat || !v) return null;
                const opt = cat.options.find(o => o.id === v);
                let valLabel = opt?.label || "";
                if (!valLabel && typeof v === "string") {
                  if (v.startsWith("customRank:")) {
                    const p = v.replace("customRank:", "").split("-");
                    valLabel = `순위 ${p[0]}~${p[1]}위`;
                  } else if (v.startsWith("customCap:")) {
                    const p = v.replace("customCap:", "").split("-");
                    valLabel = `${p[0]}~${p[1]}조원`;
                  } else if (v.startsWith("customVol:")) {
                    const p = v.replace("customVol:", "").split("-");
                    valLabel = `${p[0]}~${p[1]}억`;
                  } else if (v.startsWith("customRvol:")) {
                    const raw = v.replace("customRvol:", "");
                    const parts = raw.split(":");
                    const period = parts.length === 2 ? parts[0] : "30d";
                    const mult = parts.length === 2 ? parts[1] : raw;
                    const pLabel = period === "24h" ? "24시간" : period === "7d" ? "7일" : "30일";
                    valLabel = `${pLabel} RVOL ${mult}배+`;
                  } else if (v.startsWith("custom:")) {
                    const parts = v.replace("custom:", "").split(":");
                    if (k === "changeRate" && parts.length === 3) {
                      valLabel = `${periodMap[parts[0]] || parts[0]} ${parts[2] === "up" ? "+" : "-"}${parts[1]}%`;
                    } else if ((k === "athDrop" || k === "atlRise") && parts.length === 3) {
                      const pLabel = periodMap[parts[0]] || parts[0];
                      const dir = parts[2] === "under" ? "이하" : "이상";
                      valLabel = `${pLabel} 기준 ${parts[1]}% ${dir}`;
                    } else if ((k === "rsi" || k === "beta") && parts.length === 2) {
                      valLabel = `${parts[0]}~${parts[1]}`;
                    } else {
                      valLabel = v;
                    }
                  } else {
                    valLabel = v;
                  }
                }
                return `${cat.title}: ${valLabel}`;
              })
              .filter(Boolean);
            return (
              <Pressable
                key={sf.id}
                onPress={() => loadSavedFilter(sf)}
                style={({ pressed }) => [styles.savedFilterCard, pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}
              >
                <View style={styles.savedFilterTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.savedFilterName} numberOfLines={1}>{sf.name}</Text>
                    <Text style={styles.savedFilterCount}>{count}개 코인</Text>
                  </View>
                  <Pressable
                    onPress={() => deleteSavedFilter(sf.id)}
                    hitSlop={10}
                    style={({ pressed }) => [pressed && { opacity: 0.5 }]}
                  >
                    <Feather name="x" size={14} color={Colors.dark.textTertiary} />
                  </Pressable>
                </View>
                <View style={styles.savedFilterTags}>
                  {filterTags.map((tag, i) => (
                    <View key={i} style={styles.savedFilterTag}>
                      <Text style={styles.savedFilterTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilterFromBookmark(true);
              setFilterVisible(true);
            }}
            style={({ pressed }) => [styles.emptyAddFilterBtn, { marginTop: 8, alignSelf: "center" as const }, pressed && { opacity: 0.7 }]}
          >
            <Feather name="plus" size={14} color={Colors.dark.accent} />
            <Text style={styles.emptyAddFilterText}>필터 추가하기</Text>
          </Pressable>
        </View>
      )}

      {showSavedFilters && savedFilters.length === 0 && (
        <View style={styles.emptySavedFilters}>
          <Text style={styles.emptySavedText}>저장된 필터가 없어요</Text>
          <Text style={styles.emptySavedHint}>필터를 설정하고 저장하면 여기에 표시돼요</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilterFromBookmark(true);
              setFilterVisible(true);
            }}
            style={({ pressed }) => [styles.emptyAddFilterBtn, pressed && { opacity: 0.7 }]}
          >
            <Feather name="plus" size={14} color={Colors.dark.accent} />
            <Text style={styles.emptyAddFilterText}>필터 추가하기</Text>
          </Pressable>
        </View>
      )}

      {!isFiltering && !showSavedFilters && (
        <>
          <WebScrollArrows
            contentContainerStyle={styles.scrollContent}
            scrollAmount={CARD_WIDTH + 12}
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH + 12}
            snapToAlignment="start"
          >
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} onSeeAll={() => handleSeeAll(cat)} />
            ))}
          </WebScrollArrows>

          <View style={styles.themeSection}>
            <View style={styles.themeDivider}>
              <View style={styles.themeDividerLine} />
              <Text style={styles.themeSectionLabel}>인기 필터</Text>
              <View style={styles.themeDividerLine} />
            </View>
            <View style={styles.themeList}>
              {THEME_ITEMS.map(theme => (
                <ThemeRow
                  key={theme.id}
                  theme={theme}
                  onPress={() => handleThemePress(theme)}
                />
              ))}
            </View>
          </View>
        </>
      )}

      {isFiltering && (
        <View style={styles.filteredList}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCoinListTheme(null);
              setCoinListTitle("코인 골라보기");
              setCoinListFilters(filters);
              setCoinListVisible(true);
            }}
            style={({ pressed }) => [styles.seeAllFilteredButton, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.seeAllFilteredText}>{filteredCoins.length}개 코인 보기</Text>
            <Feather name="chevron-right" size={16} color={Colors.dark.accent} />
          </Pressable>
        </View>
      )}

      <CoinFilterSheet
        visible={filterVisible}
        onClose={() => {
          setFilterVisible(false);
          setFilterFromBookmark(false);
        }}
        filters={filters}
        onApply={(newFilters) => {
          setActiveTheme(null);
          setFilters(newFilters);
          const hasAny = Object.values(newFilters).some(v => v !== null);
          if (hasAny) {
            setCoinListTheme(null);
            setCoinListTitle("코인 골라보기");
            setCoinListFilters(newFilters);
            setCoinListVisible(true);
          }
          setFilterFromBookmark(false);
        }}
      />

      <CoinListSheet
        visible={coinListVisible}
        onClose={() => {
          setCoinListVisible(false);
          setFilters({ ...EMPTY_FILTERS });
          setActiveTheme(null);
        }}
        initialTitle={coinListTitle}
        initialFilters={coinListFilters}
        initialTheme={coinListTheme}
        onSaveFilter={async (f, name) => {
          const newSaved: SavedFilter = {
            id: `sf_${Date.now()}`,
            name,
            filters: { ...f },
            createdAt: Date.now(),
          };
          const updated = [...savedFilters, newSaved];
          setSavedFilters(updated);
          await AsyncStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updated));
        }}
      />

      <Modal
        visible={saveNameVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSaveNameVisible(false)}
      >
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
                onPress={confirmSaveFilter}
                style={({ pressed }) => [styles.saveNameBtn, styles.saveNameConfirmBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.saveNameConfirmText}>저장</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.dark.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    position: "relative",
  },
  filterButtonActive: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  bookmarkButtonActive: {
    borderColor: Colors.dark.accent,
    backgroundColor: `${Colors.dark.accent}20`,
  },
  filterCountBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.dark.negative,
    alignItems: "center",
    justifyContent: "center",
  },
  filterCountText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
  },
  activeFiltersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: `${Colors.dark.accent}15`,
    borderWidth: 1,
    borderColor: `${Colors.dark.accent}30`,
  },
  activeChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.accent,
  },
  activeThemeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.dark.accent,
  },
  activeThemeChipText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.dark.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    marginRight: 12,
    overflow: "hidden",
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  cardSubtitle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  coinList: {
    paddingHorizontal: 12,
    gap: 2,
  },
  coinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  coinIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  coinInfo: {
    flex: 1,
  },
  coinName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  coinSymbol: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
    marginTop: 1,
  },
  coinChange: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  seeAllButton: {
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.divider,
    marginTop: 8,
  },
  seeAllText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  themeSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  themeDivider: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    paddingHorizontal: 4,
  },
  themeDividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: Colors.dark.divider,
  },
  themeSectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textTertiary,
  },
  themeList: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    overflow: "hidden",
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.divider,
  },
  themeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  themeTextCol: {
    flex: 1,
    gap: 2,
  },
  themeTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  themeSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
  },
  themeRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  themeCount: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textTertiary,
  },
  filteredList: {
    marginHorizontal: 16,
    backgroundColor: Colors.dark.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    overflow: "hidden",
  },
  filteredRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.divider,
  },
  filteredIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filteredInfo: {
    flex: 1,
    gap: 4,
  },
  filteredNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filteredName: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  filteredSymbol: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textTertiary,
  },
  tagRow: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
  },
  miniTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniTagText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
  },
  filteredChange: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  emptyFiltered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyFilteredText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textTertiary,
  },
  resetInlineButton: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  resetInlineText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.accent,
  },
  seeAllFilteredButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
  },
  seeAllFilteredText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.accent,
  },
  savedFiltersList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  savedFilterCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  savedFilterTop: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  savedFilterCount: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
  },
  savedFilterTags: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 6,
  },
  savedFilterTag: {
    backgroundColor: `${Colors.dark.accent}15`,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  savedFilterTagText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.accent,
  },
  emptySavedFilters: {
    alignItems: "center" as const,
    paddingVertical: 24,
    gap: 6,
  },
  emptyAddFilterBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
    backgroundColor: `${Colors.dark.accent}10`,
  },
  emptyAddFilterText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.accent,
  },
  emptySavedText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  emptySavedHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
  },
  savedFilterName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
    marginBottom: 2,
  },
  saveNameOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
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
