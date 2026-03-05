import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  Pressable,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import ComparisonChart from "@/components/ComparisonChart";
import PeriodSelector from "@/components/PeriodSelector";
import PresetCard from "@/components/PresetCard";
import AssetSearchSheet from "@/components/AssetSearchSheet";
import InvestSimCard from "@/components/InvestSimCard";
import CoinPicker from "@/components/CoinPicker";
import ScheduleCalendar from "@/components/ScheduleCalendar";
import ScheduleDetailSheet from "@/components/ScheduleDetailSheet";
import WebScrollArrows from "@/components/WebScrollArrows";
import ExchangeView from "@/components/ExchangeView";
import {
  ASSETS,
  getChartData,
  getTimeLabels,
  Period,
  PRESET_COMPARISONS,
  PresetComparison,
} from "@/lib/mock-data";
import { COIN_CATEGORIES } from "@/lib/coin-data";
import { SCHEDULE_ITEMS, ScheduleItem } from "@/lib/schedule-data";

type TopNavTab = "exchange" | "recommend" | "explore" | "trends";

const TOP_NAV_ITEMS: { key: TopNavTab; label: string }[] = [
  { key: "exchange", label: "거래소" },
  { key: "recommend", label: "추천" },
  { key: "trends", label: "동향" },
];

const CUSTOM_PRESETS_KEY = "custom_comparison_presets";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTopTab, setActiveTopTab] = useState<TopNavTab>("exchange");
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("24H");
  const [selectedAssets, setSelectedAssets] = useState<string[]>(["btc", "eth"]);
  const [customMode, setCustomMode] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>("btc-vs-eth");
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [scheduleDetailVisible, setScheduleDetailVisible] = useState(false);
  const [scheduleEventItem, setScheduleEventItem] = useState<ScheduleItem | null>(null);
  const [customPresets, setCustomPresets] = useState<PresetComparison[]>([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(CUSTOM_PRESETS_KEY).then((val) => {
      if (val) {
        try { setCustomPresets(JSON.parse(val)); } catch {}
      }
    });
  }, []);

  const allPresets = useMemo(() => [
    ...PRESET_COMPARISONS,
    ...customPresets,
  ], [customPresets]);

  const displayedPresets = useMemo(() => {
    if (showSavedOnly) return customPresets;
    return allPresets;
  }, [showSavedOnly, allPresets, customPresets]);

  const openSaveModal = useCallback(() => {
    if (selectedAssets.length < 2) return;

    const isDuplicate = allPresets.some(
      (p) => JSON.stringify([...p.assetIds].sort()) === JSON.stringify([...selectedAssets].sort())
    );
    if (isDuplicate) {
      Alert.alert("이미 저장됨", "동일한 조합이 이미 저장되어 있어요.");
      return;
    }

    const symbols = selectedAssets.map((id) => ASSETS.find((a) => a.id === id)?.symbol || id.toUpperCase());
    setSaveTitle(symbols.join(" · "));
    setSaveModalVisible(true);
  }, [selectedAssets, allPresets]);

  const confirmSavePreset = useCallback(() => {
    const title = saveTitle.trim();
    if (!title) return;

    const newPreset: PresetComparison = {
      id: "custom-" + Date.now().toString(),
      title,
      subtitle: "내가 저장한 비교 조합",
      assetIds: [...selectedAssets],
      isCustom: true,
    };

    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    AsyncStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(updated));
    setActivePresetId(newPreset.id);
    setCustomMode(false);
    setSaveModalVisible(false);
    setSaveTitle("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [saveTitle, selectedAssets, customPresets]);

  const deleteCustomPreset = useCallback((presetId: string) => {
    const updated = customPresets.filter((p) => p.id !== presetId);
    setCustomPresets(updated);
    AsyncStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(updated));
    if (activePresetId === presetId) {
      setActivePresetId("btc-vs-eth");
      setSelectedAssets(["btc", "eth"]);
      setCustomMode(false);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [customPresets, activePresetId]);

  const chartDatasets = useMemo(() => {
    if (selectedAssets.length === 0) return [];
    return selectedAssets.map((id, index) => {
      const asset = ASSETS.find((a) => a.id === id);
      if (!asset) return null;
      return {
        data: getChartData(id, selectedPeriod),
        color: Colors.chartColors[index % Colors.chartColors.length],
        label: asset.name,
      };
    }).filter(Boolean) as { data: number[]; color: string; label: string }[];
  }, [selectedAssets, selectedPeriod]);

  const timeLabels = useMemo(
    () => getTimeLabels(selectedPeriod),
    [selectedPeriod]
  );

  const chartColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    selectedAssets.forEach((id, index) => {
      map[id] = Colors.chartColors[index % Colors.chartColors.length];
    });
    return map;
  }, [selectedAssets]);

  const toggleAsset = useCallback((assetId: string) => {
    setSelectedAssets((prev) => {
      if (prev.includes(assetId)) {
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== assetId);
      }
      if (prev.length >= 5) return prev;
      return [...prev, assetId];
    });
    setActivePresetId(null);
    setCustomMode(true);
  }, []);

  const removeAsset = useCallback((assetId: string) => {
    setSelectedAssets((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((id) => id !== assetId);
    });
    setActivePresetId(null);
    setCustomMode(true);
  }, []);

  const selectPreset = useCallback((presetId: string, assetIds: string[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedAssets(assetIds);
    setActivePresetId(presetId);
    setCustomMode(false);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setRefreshing(false);
    }, 1200);
  }, []);

  const webTopInset = Platform.OS === "web" ? 16 : 0;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <View style={{ paddingTop: Platform.OS === "web" ? webTopInset : insets.top }}>
        <View style={styles.topNavContainer}>
          <View style={styles.topNav}>
            {TOP_NAV_ITEMS.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setActiveTopTab(item.key);
                }}
              >
                <Text
                  style={
                    activeTopTab === item.key
                      ? styles.topNavActive
                      : styles.topNavInactive
                  }
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.topNavIcons}>
            <Pressable
              style={styles.topNavIconBtn}
              onPress={() => {
                if (activeTopTab === "exchange") {
                  router.push("/exchange-search");
                }
              }}
            >
              <Feather name="search" size={20} color={Colors.dark.text} />
            </Pressable>
            <Pressable
              style={styles.topNavIconBtn}
              onPress={() => {
                if (activeTopTab === "exchange") {
                  router.push("/exchange-search-integrated");
                }
              }}
            >
              <MaterialCommunityIcons name="magnify-plus-outline" size={20} color={Colors.dark.text} />
            </Pressable>
            <Pressable style={styles.topNavIconBtn}>
              <Ionicons name="notifications-outline" size={20} color={Colors.dark.text} />
            </Pressable>
            <Pressable style={styles.topNavIconBtn}>
              <Ionicons name="settings-outline" size={20} color={Colors.dark.text} />
            </Pressable>
          </View>
        </View>
      </View>

      {activeTopTab === "exchange" && <ExchangeView />}

      {activeTopTab === "explore" && (<ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.dark.accent}
            colors={[Colors.dark.accent]}
            progressBackgroundColor={Colors.dark.surface}
          />
        }
      >
        <View>
          <View style={styles.presetSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>비교 차트</Text>
                <Text style={styles.sectionSubtitle}>
                  {showSavedOnly
                    ? customPresets.length > 0 ? `내가 저장한 ${customPresets.length}개 조합` : "저장된 조합이 없어요"
                    : "자산 간 수익률을 한눈에 비교해보세요"}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowSavedOnly(prev => {
                    const next = !prev;
                    if (next) {
                      if (customPresets.length > 0) {
                        const first = customPresets[0];
                        setSelectedAssets(first.assetIds);
                        setActivePresetId(first.id);
                        setCustomMode(false);
                      } else {
                        setSelectedAssets([]);
                        setActivePresetId(null);
                        setCustomMode(false);
                      }
                    } else {
                      setSelectedAssets(["btc", "eth"]);
                      setActivePresetId("btc-vs-eth");
                      setCustomMode(false);
                    }
                    return next;
                  });
                }}
                style={[styles.bookmarkButton, showSavedOnly && styles.bookmarkButtonActive]}
              >
                <Feather name="bookmark" size={18} color={showSavedOnly ? Colors.dark.accent : Colors.dark.textTertiary} />
                {customPresets.length > 0 && !showSavedOnly && (
                  <View style={styles.presetCountBadge}>
                    <Text style={styles.presetCountText}>{customPresets.length}</Text>
                  </View>
                )}
              </Pressable>
            </View>
            {showSavedOnly && customPresets.length === 0 ? (
              <View style={styles.emptyBookmark}>
                <Text style={styles.emptyBookmarkText}>저장된 조합이 없어요</Text>
                <Text style={styles.emptyBookmarkHint}>아래 + 버튼으로 자산을 골라보세요</Text>
              </View>
            ) : (
              <WebScrollArrows
                contentContainerStyle={styles.presetScroll}
                scrollAmount={280}
              >
                {displayedPresets.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    isActive={activePresetId === preset.id && !customMode}
                    onPress={() => selectPreset(preset.id, preset.assetIds)}
                    onDelete={preset.isCustom ? () => deleteCustomPreset(preset.id) : undefined}
                  />
                ))}
                {showSavedOnly && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setSelectedAssets([]);
                      setActivePresetId(null);
                      setCustomMode(true);
                    }}
                    style={({ pressed }) => [styles.newComboCard, pressed && { opacity: 0.7 }]}
                  >
                    <Feather name="plus" size={22} color={Colors.dark.accent} />
                  </Pressable>
                )}
              </WebScrollArrows>
            )}
          </View>

          <View style={styles.chartCard}>
            <View style={styles.periodRow}>
              <Text style={styles.periodLabel}>기간 선택</Text>
              <PeriodSelector selected={selectedPeriod} onSelect={setSelectedPeriod} />
            </View>

            {chartDatasets.length > 0 ? (
              <ComparisonChart datasets={chartDatasets} timeLabels={timeLabels} />
            ) : (
              <View style={styles.emptyChart}>
                <Feather name="bar-chart-2" size={36} color={Colors.dark.textTertiary} />
                <Text style={styles.emptyText}>종목을 선택해주세요</Text>
              </View>
            )}

            <View style={styles.selectedBar}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedChipScroll}
              >
                {selectedAssets.length < 5 && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setSearchVisible(true);
                    }}
                    style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.7 }]}
                  >
                    <Feather name="plus" size={16} color={Colors.dark.accent} />
                  </Pressable>
                )}

                {customMode && selectedAssets.length >= 2 && (
                  <Pressable
                    onPress={openSaveModal}
                    style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.7 }]}
                  >
                    <Feather name="bookmark" size={14} color={Colors.dark.accent} />
                    <Text style={styles.saveButtonText}>저장</Text>
                  </Pressable>
                )}

                {selectedAssets.map((id, index) => {
                  const asset = ASSETS.find(a => a.id === id);
                  const color = Colors.chartColors[index % Colors.chartColors.length];
                  return (
                    <View key={id} style={[styles.selectedChip, { borderColor: color }]}>
                      <View style={[styles.selectedDot, { backgroundColor: color }]} />
                      <Text style={styles.selectedChipText}>{asset?.symbol}</Text>
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          removeAsset(id);
                        }}
                        hitSlop={6}
                      >
                        <Feather name="x" size={12} color={Colors.dark.textTertiary} />
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          <InvestSimCard assetIds={selectedAssets} period={selectedPeriod} />
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <CoinPicker categories={COIN_CATEGORIES} />
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <ScheduleCalendar
            items={SCHEDULE_ITEMS}
            onShowMore={() => setScheduleDetailVisible(true)}
            onItemPress={(item) => {
              setScheduleEventItem(item);
              setScheduleDetailVisible(true);
            }}
          />
        </View>

      </ScrollView>)}

      {activeTopTab !== "exchange" && activeTopTab !== "explore" && (
        <View style={styles.placeholderView}>
          <Feather name="compass" size={40} color={Colors.dark.textTertiary} />
          <Text style={styles.placeholderText}>준비 중입니다</Text>
        </View>
      )}

      <AssetSearchSheet
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        selectedAssets={selectedAssets}
        onToggle={toggleAsset}
        chartColorMap={chartColorMap}
      />

      <ScheduleDetailSheet
        visible={scheduleDetailVisible}
        onClose={() => {
          setScheduleDetailVisible(false);
          setScheduleEventItem(null);
        }}
        items={SCHEDULE_ITEMS}
        initialEventItem={scheduleEventItem}
      />

      <Modal
        visible={saveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSaveModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSaveModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>비교 조합 저장</Text>
              <Text style={styles.modalSubtitle}>이름을 입력해주세요</Text>
              <TextInput
                style={styles.modalInput}
                value={saveTitle}
                onChangeText={setSaveTitle}
                placeholder="예: 내 포트폴리오"
                placeholderTextColor={Colors.dark.textTertiary}
                autoFocus
                maxLength={20}
                selectTextOnFocus
              />
              <View style={styles.modalButtons}>
                <Pressable
                  onPress={() => setSaveModalVisible(false)}
                  style={({ pressed }) => [styles.modalBtnCancel, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.modalBtnCancelText}>취소</Text>
                </Pressable>
                <Pressable
                  onPress={confirmSavePreset}
                  style={({ pressed }) => [styles.modalBtnConfirm, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.modalBtnConfirmText}>저장</Text>
                </Pressable>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    ...(Platform.OS === "web"
      ? { width: "100%" as any, maxWidth: "100%" as any, minHeight: 0, minWidth: 0 }
      : {}),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {},
  topNavContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 12,
  },
  topNav: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 4,
    gap: 20,
    alignItems: "center",
  },
  topNavIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  topNavIconBtn: {
    width: 36,
    height: 36,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  searchHeaderWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  searchHeaderContainer: {
    paddingBottom: 6,
  },
  searchHeaderInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 44,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
    borderRadius: 0,
  },
  searchHeaderInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
    paddingVertical: 0,
    ...(Platform.OS === "web"
      ? ({
          outlineWidth: 0,
          outlineStyle: "none",
          borderWidth: 0,
          backgroundColor: "transparent",
          caretColor: Colors.dark.accent,
        } as any)
      : {}),
  },
  searchCancelBtn: {
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  searchCancelText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
  },
  searchFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 8,
  },
  searchHeaderInlineFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${Colors.dark.accent}80`,
    backgroundColor: "transparent",
  },
  searchHeaderInlineFilterButtonActive: {
    borderColor: `${Colors.dark.accent}80`,
    backgroundColor: `${Colors.dark.accent}12`,
  },
  searchHeaderInlineFilterText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.accent,
  },
  searchHeaderInlineFilterTextActive: {
    color: Colors.dark.accent,
    fontFamily: "Inter_600SemiBold",
  },
  searchFilterChipScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 20,
  },
  searchFilterCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingRight: 10,
    borderRadius: 14,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  searchFilterCardText: {
    lineHeight: 16,
  },
  searchFilterCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: 2,
  },
  searchFilterCardClose: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  searchFilterCardCategory: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  searchFilterCardValue: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
  },
  searchFilterClearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  searchFilterClearText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textTertiary,
  },
  placeholderView: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 12,
    paddingBottom: 100,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  topNavActive: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  topNavInactive: {
    fontSize: 17,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textTertiary,
  },
  chartCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 14,
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  periodLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textTertiary,
  },
  emptyChart: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textTertiary,
  },
  selectedBar: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.divider,
    paddingVertical: 10,
  },
  selectedChipScroll: {
    flexDirection: "row",
    paddingHorizontal: 14,
    gap: 8,
    alignItems: "center",
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: 20,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1.5,
  },
  selectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  selectedChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: Colors.dark.accent,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: `${Colors.dark.accent}18`,
  },
  saveButtonText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.accent,
  },
  presetSection: {
    marginTop: 12,
    marginBottom: 6,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 14,
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
  bookmarkButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.dark.surfaceElevated,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  bookmarkButtonActive: {
    backgroundColor: `${Colors.dark.accent}20`,
  },
  presetCountBadge: {
    position: "absolute" as const,
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.dark.negative,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  presetCountText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
  },
  emptyBookmark: {
    alignItems: "center" as const,
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 6,
  },
  emptyBookmarkText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  emptyBookmarkHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
  },
  newComboCard: {
    width: 90,
    alignSelf: "stretch" as const,
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${Colors.dark.accent}30`,
    borderStyle: "dashed" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 10,
    gap: 8,
  },
  newComboIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.dark.accent}15`,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  newComboText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.accent,
    textAlign: "center" as const,
    lineHeight: 16,
  },
  emptyBookmarkBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginTop: 12,
    backgroundColor: `${Colors.dark.accent}15`,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.dark.accent}30`,
  },
  emptyBookmarkBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.accent,
  },
  presetScroll: {
    paddingHorizontal: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.divider,
    marginHorizontal: 20,
    marginTop: 28,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  modalCard: {
    width: "100%",
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.dark.surfaceElevated,
    alignItems: "center",
  },
  modalBtnCancelText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  modalBtnConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.dark.accent,
    alignItems: "center",
  },
  modalBtnConfirmText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
