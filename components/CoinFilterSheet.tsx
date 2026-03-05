import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  Dimensions,
  Platform,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, withTiming, FadeIn, SlideInRight, SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { FILTER_CATEGORIES, FILTER_GROUPS, FilterCategoryId, FilterCategory, CoinItem, filterCoins } from "@/lib/coin-data";
import { getScreenWidth, getScreenHeight } from "@/lib/screen-utils";
import WebModalWrapper from "./WebModalWrapper";

const SCREEN_WIDTH = getScreenWidth();
const SCREEN_HEIGHT = getScreenHeight();
const RVOL_PERIOD_OPTIONS = [
  { key: "24h", label: "24시간" },
  { key: "7d", label: "7일" },
  { key: "30d", label: "30일" },
] as const;

interface CoinFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: Record<FilterCategoryId, string | null>;
  onApply: (filters: Record<FilterCategoryId, string | null>) => void;
  initialOpenCategory?: FilterCategoryId | null;
  coinsSource?: CoinItem[];
}

function FilterOptionRow({ option, isSelected, onPress }: {
  option: { id: string; label: string; description?: string };
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [styles.optionRow, pressed && { opacity: 0.7 }]}
    >
      <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
        {option.label}
      </Text>
      {isSelected && (
        <Feather name="check" size={20} color={Colors.dark.accent} />
      )}
    </Pressable>
  );
}

function FilterCategoryRow({ category, hasSelection, onPress }: {
  category: FilterCategory;
  hasSelection: boolean;
  selectedLabel?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [styles.categoryRow, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.categoryRowLeft}>
        <Text style={[styles.categoryRowTitle, hasSelection && styles.categoryRowTitleActive]}>
          {category.title}
        </Text>
        {hasSelection && (
          <View style={styles.activeDot} />
        )}
      </View>
      <Feather name="chevron-right" size={18} color={Colors.dark.textTertiary} />
    </Pressable>
  );
}

export default function CoinFilterSheet({
  visible,
  onClose,
  filters,
  onApply,
  initialOpenCategory,
  coinsSource,
}: CoinFilterSheetProps) {
  const insets = useSafeAreaInsets();
  const [isMobileWeb, setIsMobileWeb] = useState(false);
  const [localFilters, setLocalFilters] = useState<Record<FilterCategoryId, string | null>>({ ...filters });
  const [detailCategory, setDetailCategory] = useState<FilterCategoryId | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const [customRankMin, setCustomRankMin] = useState("");
  const [customRankMax, setCustomRankMax] = useState("");
  const [customCapMin, setCustomCapMin] = useState("");
  const [customCapMax, setCustomCapMax] = useState("");
  const [customChangePeriod, setCustomChangePeriod] = useState("24h");
  const [customChangePct, setCustomChangePct] = useState("");
  const [customChangeDir, setCustomChangeDir] = useState<"up" | "down">("up");
  const [customVolMin, setCustomVolMin] = useState("");
  const [customVolMax, setCustomVolMax] = useState("");
  const [customRvolPeriod, setCustomRvolPeriod] = useState<(typeof RVOL_PERIOD_OPTIONS)[number]["key"]>("30d");
  const [customRvolPct, setCustomRvolPct] = useState("");
  const [athPeriod, setAthPeriod] = useState("all");
  const [athPct, setAthPct] = useState("");
  const [athDir, setAthDir] = useState<"under" | "over">("over");
  const [atlPeriod, setAtlPeriod] = useState("all");
  const [atlPct, setAtlPct] = useState("");
  const [atlDir, setAtlDir] = useState<"under" | "over">("over");
  const [customRsiMin, setCustomRsiMin] = useState("");
  const [customRsiMax, setCustomRsiMax] = useState("");
  const [customBetaMin, setCustomBetaMin] = useState("");
  const [customBetaMax, setCustomBetaMax] = useState("");
  const [rsiPeriod, setRsiPeriod] = useState("14");
  const [betaDir, setBetaDir] = useState<"same" | "opp">("same");

  const activeFilterCount = Object.values(localFilters).filter(Boolean).length;
  const resultCount = filterCoins(localFilters, coinsSource).length;
  const currentDetail = detailCategory ? FILTER_CATEGORIES.find(c => c.id === detailCategory) : null;
  const footerBottomPadding = Platform.OS === "web"
    ? (isMobileWeb ? 36 : 20)
    : Math.max(insets.bottom, 20);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const update = () => setIsMobileWeb(window.innerWidth <= 820);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const toggleOption = useCallback((categoryId: FilterCategoryId, optionId: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [categoryId]: prev[categoryId] === optionId ? null : optionId,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLocalFilters({
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
    });
  }, []);

  const handleApply = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const savedFilters = { ...localFilters };
    onClose();
    if (Platform.OS === "web") {
      setTimeout(() => onApply(savedFilters), 150);
    } else {
      onApply(savedFilters);
    }
  }, [localFilters, onApply, onClose]);

  React.useEffect(() => {
    if (visible) {
      setLocalFilters({ ...filters });
      setDetailCategory(initialOpenCategory ?? null);
      setActiveTab(0);
      setCustomRankMin("");
      setCustomRankMax("");
      setCustomCapMin("");
      setCustomCapMax("");
      setCustomChangePeriod("24h");
      setCustomChangePct("");
      setCustomChangeDir("up");
      setCustomVolMin("");
      setCustomVolMax("");
      setCustomRvolPeriod("30d");
      setCustomRvolPct("");
      setCustomRsiMin("");
      setCustomRsiMax("");
      setCustomBetaMin("");
      setCustomBetaMax("");
      const mc = filters.marketCap;
      if (mc && mc.startsWith("customRank:")) {
        const parts = mc.replace("customRank:", "").split("-");
        setCustomRankMin(parts[0]);
        setCustomRankMax(parts[1]);
      }
      if (mc && mc.startsWith("customCap:")) {
        const parts = mc.replace("customCap:", "").split("-");
        setCustomCapMin(parts[0]);
        setCustomCapMax(parts[1]);
      }
      const cr = filters.changeRate;
      if (cr && cr.startsWith("custom:")) {
        const parts = cr.replace("custom:", "").split(":");
        setCustomChangePeriod(parts[0]);
        setCustomChangePct(parts[1]);
        setCustomChangeDir(parts[2] as "up" | "down");
      }
      const volumeFilter = filters.volume;
      if (volumeFilter && volumeFilter.startsWith("customVol:")) {
        const parts = volumeFilter.replace("customVol:", "").split("-");
        setCustomVolMin(parts[0]);
        setCustomVolMax(parts[1]);
      }
      const rvolFilter = filters.rvol;
      if (rvolFilter && rvolFilter.startsWith("customRvol:")) {
        const raw = rvolFilter.replace("customRvol:", "");
        const parts = raw.split(":");
        if (parts.length === 2) {
          setCustomRvolPeriod(parts[0] as (typeof RVOL_PERIOD_OPTIONS)[number]["key"]);
          setCustomRvolPct(parts[1]);
        } else {
          setCustomRvolPeriod("30d");
          setCustomRvolPct(raw);
        }
      }
      setAthPeriod("all");
      setAthPct("");
      setAthDir("over");
      setAtlPeriod("all");
      setAtlPct("");
      setAtlDir("over");
      const ad = filters.athDrop;
      if (ad && ad.startsWith("custom:")) {
        const parts = ad.replace("custom:", "").split(":");
        setAthPeriod(parts[0]);
        setAthPct(parts[1]);
        setAthDir(parts[2] as "under" | "over");
      }
      const ar = filters.atlRise;
      if (ar && ar.startsWith("custom:")) {
        const parts = ar.replace("custom:", "").split(":");
        setAtlPeriod(parts[0]);
        setAtlPct(parts[1]);
        setAtlDir(parts[2] as "under" | "over");
      }
      const rsiF = filters.rsi;
      if (rsiF && rsiF.startsWith("custom:")) {
        const parts = rsiF.replace("custom:", "").split(":");
        setCustomRsiMin(parts[0]);
        setCustomRsiMax(parts[1]);
      }
      const betaF = filters.beta;
      if (betaF && betaF.startsWith("custom:")) {
        const parts = betaF.replace("custom:", "").split(":");
        setCustomBetaMin(parts[0]);
        setCustomBetaMax(parts[1]);
      }
      if (betaF && (betaF.startsWith("opp_") || betaF === "negative")) {
        setBetaDir("opp");
      } else {
        setBetaDir("same");
      }
    }
  }, [visible, initialOpenCategory]);

  if (!visible) return null;

  const topPad = Platform.OS === "web" ? 16 : insets.top;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <WebModalWrapper>
      <Animated.View
        entering={FadeIn.duration(200)}
        style={[styles.fullScreen, { paddingTop: topPad }]}
      >
        {detailCategory && currentDetail ? (
          <Animated.View
            entering={SlideInRight.duration(250)}
            style={styles.fullContent}
            key={detailCategory}
          >
            <View style={styles.detailHeader}>
              <Pressable
                onPress={() => {
                  if (initialOpenCategory) {
                    handleApply();
                  } else {
                    setDetailCategory(null);
                  }
                }}
                hitSlop={20}
                style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
              >
                <Feather name="chevron-left" size={24} color={Colors.dark.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.detailScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.detailContent}
            >
              <Text style={styles.detailTitle}>{currentDetail.title}</Text>
              <Text style={styles.detailSubtitle}>{currentDetail.subtitle}</Text>

              {detailCategory === "marketCap" ? (
                <>
                  <Text style={styles.sectionLabel}>순위권</Text>
                  <View style={styles.optionsList}>
                    {currentDetail.options.filter(o => o.id.startsWith("top")).map(option => (
                      <FilterOptionRow
                        key={option.id}
                        option={option}
                        isSelected={localFilters.marketCap === option.id}
                        onPress={() => toggleOption("marketCap", option.id)}
                      />
                    ))}
                  </View>

                  <View style={styles.customInputSection}>
                    <Text style={styles.customInputLabel}>직접 설정</Text>
                    <View style={styles.customInputRow}>
                      <TextInput
                        style={[styles.customInput, localFilters.marketCap?.startsWith("customRank:") && styles.customInputActive]}
                        placeholder="최소"
                        placeholderTextColor={Colors.dark.textTertiary}
                        keyboardType="number-pad"
                        value={customRankMin}
                        onChangeText={setCustomRankMin}
                      />
                      <Text style={styles.customInputSep}>~</Text>
                      <TextInput
                        style={[styles.customInput, localFilters.marketCap?.startsWith("customRank:") && styles.customInputActive]}
                        placeholder="최대"
                        placeholderTextColor={Colors.dark.textTertiary}
                        keyboardType="number-pad"
                        value={customRankMax}
                        onChangeText={setCustomRankMax}
                      />
                      <Text style={styles.customInputUnit}>위</Text>
                      <Pressable
                        onPress={() => {
                          if (customRankMin && customRankMax) {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setLocalFilters(prev => ({ ...prev, marketCap: `customRank:${customRankMin}-${customRankMax}` }));
                          }
                        }}
                        style={({ pressed }) => [
                          styles.customApplyBtn,
                          (!customRankMin || !customRankMax) && styles.customApplyBtnDisabled,
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Feather name="check" size={16} color={customRankMin && customRankMax ? Colors.dark.accent : Colors.dark.textTertiary} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.sectionDivider} />

                  <Text style={styles.sectionLabel}>시가총액 규모</Text>
                  <View style={styles.optionsList}>
                    {currentDetail.options.filter(o => ["mega", "large", "mid", "small"].includes(o.id)).map(option => (
                      <FilterOptionRow
                        key={option.id}
                        option={option}
                        isSelected={localFilters.marketCap === option.id}
                        onPress={() => toggleOption("marketCap", option.id)}
                      />
                    ))}
                  </View>

                  <View style={styles.customInputSection}>
                    <Text style={styles.customInputLabel}>직접 설정</Text>
                    <View style={styles.customInputRow}>
                      <TextInput
                        style={[styles.customInput, localFilters.marketCap?.startsWith("customCap:") && styles.customInputActive]}
                        placeholder="최소"
                        placeholderTextColor={Colors.dark.textTertiary}
                        keyboardType="decimal-pad"
                        value={customCapMin}
                        onChangeText={setCustomCapMin}
                      />
                      <Text style={styles.customInputSep}>~</Text>
                      <TextInput
                        style={[styles.customInput, localFilters.marketCap?.startsWith("customCap:") && styles.customInputActive]}
                        placeholder="최대"
                        placeholderTextColor={Colors.dark.textTertiary}
                        keyboardType="decimal-pad"
                        value={customCapMax}
                        onChangeText={setCustomCapMax}
                      />
                      <Text style={styles.customInputUnit}>조</Text>
                      <Pressable
                        onPress={() => {
                          if (customCapMin && customCapMax) {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setLocalFilters(prev => ({ ...prev, marketCap: `customCap:${customCapMin}-${customCapMax}` }));
                          }
                        }}
                        style={({ pressed }) => [
                          styles.customApplyBtn,
                          (!customCapMin || !customCapMax) && styles.customApplyBtnDisabled,
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Feather name="check" size={16} color={customCapMin && customCapMax ? Colors.dark.accent : Colors.dark.textTertiary} />
                      </Pressable>
                    </View>
                  </View>
                </>
              ) : detailCategory === "changeRate" ? (
                <>
                  <Text style={styles.crSectionTitle}>기간</Text>
                  <View style={styles.customChipRow}>
                    {(["1h", "24h", "7d", "30d"] as const).map(p => (
                      <Pressable
                        key={p}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setCustomChangePeriod(p);
                          if (customChangePct) {
                            setLocalFilters(prev => ({ ...prev, changeRate: `custom:${p}:${customChangePct}:${customChangeDir}` }));
                          }
                        }}
                        style={[styles.periodChip, customChangePeriod === p && styles.periodChipActive]}
                      >
                        <Text style={[styles.periodChipText, customChangePeriod === p && styles.periodChipTextActive]}>
                          {p === "1h" ? "1시간" : p === "24h" ? "24시간" : p === "7d" ? "7일" : "30일"}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={[styles.crSectionTitle, { marginTop: 20 }]}>빠른 선택</Text>
                  <View style={styles.crQuickGrid}>
                    {[
                      { label: "+3% 이상", pct: "3", dir: "up" as const },
                      { label: "+5% 이상", pct: "5", dir: "up" as const },
                      { label: "+10% 이상", pct: "10", dir: "up" as const },
                      { label: "+20% 이상", pct: "20", dir: "up" as const },
                      { label: "-3% 이하", pct: "3", dir: "down" as const },
                      { label: "-5% 이하", pct: "5", dir: "down" as const },
                      { label: "-10% 이하", pct: "10", dir: "down" as const },
                      { label: "-20% 이하", pct: "20", dir: "down" as const },
                    ].map(item => {
                      const isActive = localFilters.changeRate === `custom:${customChangePeriod}:${item.pct}:${item.dir}`;
                      return (
                        <Pressable
                          key={item.label}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            const val = `custom:${customChangePeriod}:${item.pct}:${item.dir}`;
                            setCustomChangePct(item.pct);
                            setCustomChangeDir(item.dir);
                            setLocalFilters(prev => ({ ...prev, changeRate: prev.changeRate === val ? null : val }));
                          }}
                          style={[
                            styles.crQuickChip,
                            item.dir === "up" ? styles.crQuickChipUp : styles.crQuickChipDown,
                            isActive && (item.dir === "up" ? styles.crQuickChipUpActive : styles.crQuickChipDownActive),
                          ]}
                        >
                          <Text style={[
                            styles.crQuickChipText,
                            item.dir === "up" ? styles.crQuickChipTextUp : styles.crQuickChipTextDown,
                            isActive && styles.crQuickChipTextActive,
                          ]}>
                            {item.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.sectionDivider} />
                  <Text style={styles.crSectionTitle}>직접 입력</Text>
                  <View style={[styles.customInputRow, { marginTop: 8 }]}>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        const next = customChangeDir === "up" ? "down" : "up";
                        setCustomChangeDir(next);
                        if (customChangePct) {
                          setLocalFilters(prev => ({ ...prev, changeRate: `custom:${customChangePeriod}:${customChangePct}:${next}` }));
                        }
                      }}
                      style={[styles.dirToggle, customChangeDir === "up" ? styles.dirToggleUp : styles.dirToggleDown]}
                    >
                      <Feather name={customChangeDir === "up" ? "trending-up" : "trending-down"} size={16} color={customChangeDir === "up" ? "#4CAF50" : "#F44336"} />
                    </Pressable>
                    <TextInput
                      style={[styles.customInput, { flex: 1 }, localFilters.changeRate?.startsWith("custom:") && styles.customInputActive]}
                      placeholder="예: 5"
                      placeholderTextColor={Colors.dark.textTertiary}
                      keyboardType="decimal-pad"
                      value={customChangePct}
                      onChangeText={(t) => {
                        setCustomChangePct(t);
                        if (t) {
                          setLocalFilters(prev => ({ ...prev, changeRate: `custom:${customChangePeriod}:${t}:${customChangeDir}` }));
                        } else {
                          setLocalFilters(prev => ({ ...prev, changeRate: null }));
                        }
                      }}
                    />
                    <Text style={styles.customInputUnit}>% {customChangeDir === "up" ? "이상" : "이하"}</Text>
                  </View>
                  {localFilters.changeRate && (
                    <View style={styles.crSummary}>
                      <Feather name="info" size={13} color={Colors.dark.textTertiary} />
                      <Text style={styles.crSummaryText}>
                        {(() => {
                          const pLabel = customChangePeriod === "1h" ? "1시간" : customChangePeriod === "24h" ? "24시간" : customChangePeriod === "7d" ? "7일" : "30일";
                          return customChangeDir === "up"
                            ? `${pLabel} 동안 ${customChangePct}% 이상 오른 코인`
                            : `${pLabel} 동안 ${customChangePct}% 이상 내린 코인`;
                        })()}
                      </Text>
                    </View>
                  )}
                </>
              ) : detailCategory === "volume" ? (
                <>
                  <Text style={styles.sectionLabel}>거래 금액</Text>
                  <View style={styles.optionsList}>
                    {currentDetail.options.map(option => (
                      <FilterOptionRow
                        key={option.id}
                        option={option}
                        isSelected={localFilters.volume === option.id}
                        onPress={() => toggleOption("volume", option.id)}
                      />
                    ))}
                  </View>

                  <View style={styles.customInputSection}>
                    <Text style={styles.customInputLabel}>직접 설정</Text>
                    <View style={styles.customInputRow}>
                      <TextInput
                        style={[styles.customInput, localFilters.volume?.startsWith("customVol:") && styles.customInputActive]}
                        placeholder="최소"
                        placeholderTextColor={Colors.dark.textTertiary}
                        keyboardType="decimal-pad"
                        value={customVolMin}
                        onChangeText={(t) => {
                          setCustomVolMin(t);
                          if (t && customVolMax) {
                            setLocalFilters((prev) => ({ ...prev, volume: `customVol:${t}-${customVolMax}` }));
                          } else {
                            setLocalFilters((prev) => ({ ...prev, volume: null }));
                          }
                        }}
                      />
                      <Text style={styles.customInputSep}>~</Text>
                      <TextInput
                        style={[styles.customInput, localFilters.volume?.startsWith("customVol:") && styles.customInputActive]}
                        placeholder="최대"
                        placeholderTextColor={Colors.dark.textTertiary}
                        keyboardType="decimal-pad"
                        value={customVolMax}
                        onChangeText={(t) => {
                          setCustomVolMax(t);
                          if (customVolMin && t) {
                            setLocalFilters((prev) => ({ ...prev, volume: `customVol:${customVolMin}-${t}` }));
                          } else {
                            setLocalFilters((prev) => ({ ...prev, volume: null }));
                          }
                        }}
                      />
                      <Text style={styles.customInputUnit}>조</Text>
                    </View>
                  </View>
                </>
              ) : detailCategory === "rvol" ? (
                <>
                  <Text style={styles.sectionLabel}>상대 거래량 (RVOL)</Text>
                  <Text style={[styles.detailSubtitle, { marginBottom: 12 }]}>
                    선택한 기간의 평균 거래량과 비교해 얼마나 늘었는지
                  </Text>
                  <View style={styles.customInputSection}>
                    <Text style={styles.customInputLabel}>평균 기준 기간</Text>
                    <View style={styles.customChipRow}>
                      {RVOL_PERIOD_OPTIONS.map((p) => (
                        <Pressable
                          key={p.key}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setCustomRvolPeriod(p.key);
                            if (customRvolPct) {
                              setLocalFilters((prev) => ({ ...prev, rvol: `customRvol:${p.key}:${customRvolPct}` }));
                            }
                          }}
                          style={[styles.periodChip, customRvolPeriod === p.key && styles.periodChipActive]}
                        >
                          <Text style={[styles.periodChipText, customRvolPeriod === p.key && styles.periodChipTextActive]}>
                            {p.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={styles.sectionDivider} />
                  <Text style={styles.customInputLabel}>빠른 선택</Text>
                  <View style={styles.optionsList}>
                    {currentDetail.options.map(option => (
                      <FilterOptionRow
                        key={option.id}
                        option={option}
                        isSelected={localFilters.rvol === option.id}
                        onPress={() => toggleOption("rvol", option.id)}
                      />
                    ))}
                  </View>

                  <View style={styles.customInputSection}>
                    <Text style={styles.customInputLabel}>직접 설정</Text>
                    <View style={styles.customInputRow}>
                      <Text style={styles.customInputUnit}>평균 대비</Text>
                      <TextInput
                        style={[styles.customInput, localFilters.rvol?.startsWith("customRvol:") && styles.customInputActive]}
                        placeholder="예: 2"
                        placeholderTextColor={Colors.dark.textTertiary}
                        keyboardType="decimal-pad"
                        value={customRvolPct}
                        onChangeText={(t) => {
                          setCustomRvolPct(t);
                          if (t) {
                            setLocalFilters((prev) => ({ ...prev, rvol: `customRvol:${customRvolPeriod}:${t}` }));
                          } else {
                            setLocalFilters((prev) => ({ ...prev, rvol: null }));
                          }
                        }}
                      />
                      <Text style={styles.customInputUnit}>배 이상</Text>
                    </View>
                  </View>
                </>
              ) : detailCategory === "athDrop" || detailCategory === "atlRise" ? (
                (() => {
                  const isAth = detailCategory === "athDrop";
                  const period = isAth ? athPeriod : atlPeriod;
                  const setPeriod = isAth ? setAthPeriod : setAtlPeriod;
                  const pct = isAth ? athPct : atlPct;
                  const setPct = isAth ? setAthPct : setAtlPct;
                  const dir = isAth ? athDir : atlDir;
                  const setDir = isAth ? setAthDir : setAtlDir;
                  const filterKey = isAth ? "athDrop" as const : "atlRise" as const;
                  const quickItems = isAth
                    ? [
                        { label: "-10% 이내", pct: "10", dir: "under" as const, desc: "고점 근처" },
                        { label: "-30% 이내", pct: "30", dir: "under" as const, desc: "소폭 조정" },
                        { label: "-50% 이상", pct: "50", dir: "over" as const, desc: "상당한 하락" },
                        { label: "-70% 이상", pct: "70", dir: "over" as const, desc: "바닥권" },
                      ]
                    : [
                        { label: "+50% 이내", pct: "50", dir: "under" as const, desc: "저점 근처" },
                        { label: "+200% 이상", pct: "200", dir: "over" as const, desc: "소폭 반등" },
                        { label: "+500% 이상", pct: "500", dir: "over" as const, desc: "상당한 반등" },
                        { label: "+1000% 이상", pct: "1000", dir: "over" as const, desc: "대폭 상승" },
                      ];
                  return (
                    <>
                      <Text style={styles.crSectionTitle}>기준 기간</Text>
                      <View style={styles.customChipRow}>
                        {([
                          { key: "all", label: "전체" },
                          { key: "y1", label: "1년" },
                          { key: "m6", label: "6개월" },
                          { key: "m3", label: "3개월" },
                          { key: "m1", label: "1개월" },
                        ] as const).map(p => (
                          <Pressable
                            key={p.key}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setPeriod(p.key);
                              if (pct) {
                                setLocalFilters(prev => ({ ...prev, [filterKey]: `custom:${p.key}:${pct}:${dir}` }));
                              }
                            }}
                            style={[styles.periodChip, period === p.key && styles.periodChipActive]}
                          >
                            <Text style={[styles.periodChipText, period === p.key && styles.periodChipTextActive]}>
                              {p.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      <Text style={[styles.crSectionTitle, { marginTop: 20 }]}>빠른 선택</Text>
                      <View style={styles.crQuickGrid}>
                        {quickItems.map(item => {
                          const val = `custom:${period}:${item.pct}:${item.dir}`;
                          const isActive = localFilters[filterKey] === val;
                          return (
                            <Pressable
                              key={item.label}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setPct(item.pct);
                                setDir(item.dir);
                                setLocalFilters(prev => ({
                                  ...prev,
                                  [filterKey]: prev[filterKey] === val ? null : val,
                                }));
                              }}
                              style={[
                                styles.crQuickChip,
                                isAth
                                  ? (item.dir === "under" ? styles.crQuickChipUp : styles.crQuickChipDown)
                                  : (item.dir === "over" ? styles.crQuickChipUp : styles.crQuickChipDown),
                                isActive && (isAth
                                  ? (item.dir === "under" ? styles.crQuickChipUpActive : styles.crQuickChipDownActive)
                                  : (item.dir === "over" ? styles.crQuickChipUpActive : styles.crQuickChipDownActive)),
                              ]}
                            >
                              <Text style={[
                                styles.crQuickChipText,
                                isAth
                                  ? (item.dir === "under" ? styles.crQuickChipTextUp : styles.crQuickChipTextDown)
                                  : (item.dir === "over" ? styles.crQuickChipTextUp : styles.crQuickChipTextDown),
                                isActive && styles.crQuickChipTextActive,
                              ]}>
                                {item.label}
                              </Text>
                              <Text style={[styles.crQuickChipDesc, isActive && styles.crQuickChipDescActive]}>
                                {item.desc}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      <View style={styles.sectionDivider} />
                      <Text style={styles.crSectionTitle}>직접 입력</Text>
                      <View style={[styles.customInputRow, { marginTop: 8 }]}>
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            const next = dir === "under" ? "over" : "under";
                            setDir(next);
                            if (pct) {
                              setLocalFilters(prev => ({ ...prev, [filterKey]: `custom:${period}:${pct}:${next}` }));
                            }
                          }}
                          style={[styles.dirToggle, dir === "under" ? styles.dirToggleUp : styles.dirToggleDown]}
                        >
                          <Feather name={dir === "under" ? "chevrons-down" : "chevrons-up"} size={16} color={dir === "under" ? "#4CAF50" : "#F44336"} />
                        </Pressable>
                        <TextInput
                          style={[styles.customInput, { flex: 1 }, localFilters[filterKey]?.startsWith("custom:") && styles.customInputActive]}
                          placeholder="예: 30"
                          placeholderTextColor={Colors.dark.textTertiary}
                          keyboardType="decimal-pad"
                          value={pct}
                          onChangeText={(t) => {
                            setPct(t);
                            if (t) {
                              setLocalFilters(prev => ({ ...prev, [filterKey]: `custom:${period}:${t}:${dir}` }));
                            } else {
                              setLocalFilters(prev => ({ ...prev, [filterKey]: null }));
                            }
                          }}
                        />
                        <Text style={styles.customInputUnit}>% {dir === "under" ? "이내" : "이상"}</Text>
                      </View>
                      {localFilters[filterKey] && (
                        <View style={styles.crSummary}>
                          <Feather name="info" size={13} color={Colors.dark.textTertiary} />
                          <Text style={styles.crSummaryText}>
                            {(() => {
                              const pLabel = period === "all" ? "역대" : period === "y1" ? "1년" : period === "m6" ? "6개월" : period === "m3" ? "3개월" : "1개월";
                              return isAth
                                ? `${pLabel} 고점 대비 ${pct}% ${dir === "under" ? "이내로 하락" : "이상 하락"}한 코인`
                                : `${pLabel} 저점 대비 ${pct}% ${dir === "over" ? "이상 상승" : "이내 상승"}한 코인`;
                            })()}
                          </Text>
                        </View>
                      )}
                    </>
                  );
                })()
              ) : detailCategory === "streakUp" || detailCategory === "streakDown" ? (
                <>
                  <Text style={styles.streakSubtitle}>어제 종가 기준</Text>
                  <View style={styles.optionsList}>
                    {currentDetail.options.map(option => (
                      <FilterOptionRow
                        key={option.id}
                        option={option}
                        isSelected={localFilters[detailCategory] === option.id}
                        onPress={() => toggleOption(detailCategory, option.id)}
                      />
                    ))}
                  </View>
                </>
              ) : detailCategory === "rsi" ? (
                <>
                  <View style={styles.taGaugeContainer}>
                    <View style={styles.taGaugeBar}>
                      <View style={[styles.taGaugeSegment, { flex: 3, backgroundColor: "rgba(76,175,80,0.35)", borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }]} />
                      <View style={[styles.taGaugeSegment, { flex: 2, backgroundColor: "rgba(76,175,80,0.15)" }]} />
                      <View style={[styles.taGaugeSegment, { flex: 2, backgroundColor: "rgba(255,255,255,0.06)" }]} />
                      <View style={[styles.taGaugeSegment, { flex: 2, backgroundColor: "rgba(244,67,54,0.15)" }]} />
                      <View style={[styles.taGaugeSegment, { flex: 1, backgroundColor: "rgba(244,67,54,0.35)", borderTopRightRadius: 6, borderBottomRightRadius: 6 }]} />
                    </View>
                    <View style={styles.taGaugeLabels}>
                      <Text style={[styles.taGaugeLabel, { color: "#4CAF50" }]}>0</Text>
                      <Text style={[styles.taGaugeLabel, { color: "#4CAF50" }]}>30</Text>
                      <Text style={styles.taGaugeLabel}>50</Text>
                      <Text style={[styles.taGaugeLabel, { color: "#F44336" }]}>70</Text>
                      <Text style={[styles.taGaugeLabel, { color: "#F44336" }]}>100</Text>
                    </View>
                    <View style={styles.taGaugeLabelRow}>
                      <Text style={[styles.taGaugeZone, { color: "#4CAF50" }]}>과매도</Text>
                      <Text style={styles.taGaugeZone}>중립</Text>
                      <Text style={[styles.taGaugeZone, { color: "#F44336" }]}>과매수</Text>
                    </View>
                  </View>

                  <View style={styles.taInfoCard}>
                    <Text style={styles.taInfoText}>
                      최근 가격 흐름의 <Text style={{ color: Colors.dark.text, fontFamily: "Inter_600SemiBold" }}>과열/침체 정도</Text>를 수치로 보여줘요
                    </Text>
                    <View style={styles.taInfoRow}>
                      <View style={[styles.taInfoBadge, { backgroundColor: "rgba(76,175,80,0.12)" }]}>
                        <Feather name="arrow-down-circle" size={13} color="#4CAF50" />
                        <Text style={[styles.taInfoBadgeText, { color: "#4CAF50" }]}>30 이하 → 과매도 구간 (반등 가능성)</Text>
                      </View>
                      <View style={[styles.taInfoBadge, { backgroundColor: "rgba(244,67,54,0.12)" }]}>
                        <Feather name="arrow-up-circle" size={13} color="#F44336" />
                        <Text style={[styles.taInfoBadgeText, { color: "#F44336" }]}>70 이상 → 과매수 구간 (조정 가능성)</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.taSectionHeader}>
                    <Text style={styles.taSectionTitle}>캔들 기간</Text>
                    <Text style={styles.taSectionDesc}>어떤 기간의 가격 흐름을 볼까요?</Text>
                  </View>
                  <View style={styles.taPeriodRow}>
                    {([
                      { id: "7", label: "7일", desc: "단기 트레이딩" },
                      { id: "14", label: "14일", desc: "가장 일반적" },
                      { id: "21", label: "21일", desc: "중기 관점" },
                    ] as const).map(p => {
                      const active = rsiPeriod === p.id;
                      return (
                        <Pressable
                          key={p.id}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setRsiPeriod(p.id);
                          }}
                          style={[styles.taPeriodChip, active && styles.taPeriodChipActive]}
                        >
                          <Text style={[styles.taPeriodLabel, active && styles.taPeriodLabelActive]}>{p.label}</Text>
                          <Text style={[styles.taPeriodDesc, active && styles.taPeriodDescActive]}>{p.desc}</Text>
                          {p.id === "14" && !active && <View style={styles.taDefaultBadge}><Text style={styles.taDefaultBadgeText}>추천</Text></View>}
                          {active && <Feather name="check-circle" size={14} color={Colors.dark.accent} style={{ position: "absolute", top: 8, right: 8 }} />}
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={styles.taHintCard}>
                    <Feather name="info" size={12} color={Colors.dark.textTertiary} />
                    <Text style={styles.taHintText}>
                      {rsiPeriod === "7" ? "7일 RSI는 변동이 빠르고 민감해요. 단타 트레이더에게 적합해요." : rsiPeriod === "14" ? "14일 RSI는 가장 많이 쓰이는 기본값이에요. 대부분의 분석에 적합해요." : "21일 RSI는 노이즈를 걸러내고 더 안정적인 신호를 보여줘요."}
                    </Text>
                  </View>

                  <View style={styles.taSectionHeader}>
                    <Text style={styles.taSectionTitle}>상태 선택</Text>
                  </View>
                  <View style={styles.taChipGrid}>
                    {currentDetail.options.map(option => {
                      const sel = localFilters.rsi === option.id;
                      const color = option.id === "oversold" ? "#4CAF50" : option.id === "weak" ? "#66BB6A" : option.id === "neutral" ? "#78909C" : option.id === "strong" ? "#FF7043" : "#F44336";
                      return (
                        <Pressable
                          key={option.id}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            toggleOption("rsi", option.id);
                          }}
                          style={[styles.taChip, sel && { borderColor: color, backgroundColor: `${color}18` }]}
                        >
                          <View style={[styles.taChipDot, { backgroundColor: color }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.taChipLabel, sel && { color: Colors.dark.text }]}>{option.label}</Text>
                            {option.description && <Text style={[styles.taChipDesc, sel && { color: Colors.dark.textSecondary }]}>{option.description}</Text>}
                          </View>
                          {sel && <Feather name="check" size={16} color={color} />}
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.sectionDivider} />
                  <View style={styles.taSectionHeader}>
                    <Text style={styles.taSectionTitle}>직접 설정</Text>
                    <Text style={styles.taSectionDesc}>RSI 범위를 직접 입력 (0~100)</Text>
                  </View>
                  <View style={styles.taCustomRow}>
                    <TextInput
                      style={[styles.taCustomInput, localFilters.rsi?.startsWith("custom:") && styles.taCustomInputActive]}
                      placeholder="최소"
                      placeholderTextColor={Colors.dark.textTertiary}
                      keyboardType="decimal-pad"
                      value={customRsiMin}
                      onChangeText={setCustomRsiMin}
                    />
                    <View style={styles.taCustomSep}><Text style={styles.taCustomSepText}>~</Text></View>
                    <TextInput
                      style={[styles.taCustomInput, localFilters.rsi?.startsWith("custom:") && styles.taCustomInputActive]}
                      placeholder="최대"
                      placeholderTextColor={Colors.dark.textTertiary}
                      keyboardType="decimal-pad"
                      value={customRsiMax}
                      onChangeText={setCustomRsiMax}
                    />
                    <Pressable
                      onPress={() => {
                        if (customRsiMin && customRsiMax) {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setLocalFilters(prev => ({ ...prev, rsi: `custom:${customRsiMin}:${customRsiMax}` }));
                        }
                      }}
                      style={[styles.taCustomApply, (!customRsiMin || !customRsiMax) && { opacity: 0.3 }]}
                    >
                      <Text style={styles.taCustomApplyText}>적용</Text>
                    </Pressable>
                  </View>
                  {localFilters.rsi && (
                    <View style={styles.crSummary}>
                      <Feather name="check-circle" size={13} color={Colors.dark.accent} />
                      <Text style={styles.crSummaryText}>
                        {localFilters.rsi.startsWith("custom:")
                          ? `RSI ${customRsiMin}~${customRsiMax} 범위 (${rsiPeriod}일 기준)`
                          : `${currentDetail.options.find(o => o.id === localFilters.rsi)?.label ?? ""} (${rsiPeriod}일 기준)`}
                      </Text>
                    </View>
                  )}
                </>
              ) : detailCategory === "beta" ? (
                <>
                  <View style={styles.taGaugeContainer}>
                    <View style={styles.taGaugeBar}>
                      <View style={[styles.taGaugeSegment, { flex: 1, backgroundColor: "rgba(168,85,247,0.4)", borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }]} />
                      <View style={[styles.taGaugeSegment, { flex: 1, backgroundColor: "rgba(247,147,26,0.2)" }]} />
                      <View style={[styles.taGaugeSegment, { flex: 1, backgroundColor: "rgba(255,255,255,0.06)" }]} />
                      <View style={[styles.taGaugeSegment, { flex: 1, backgroundColor: "rgba(244,67,54,0.35)", borderTopRightRadius: 6, borderBottomRightRadius: 6 }]} />
                    </View>
                    <View style={styles.taGaugeLabels}>
                      <Text style={[styles.taGaugeLabel, { color: "#A855F7" }]}>-1</Text>
                      <Text style={[styles.taGaugeLabel, { color: Colors.dark.accent }]}>0</Text>
                      <Text style={styles.taGaugeLabel}>0.8</Text>
                      <Text style={styles.taGaugeLabel}>1.2</Text>
                      <Text style={[styles.taGaugeLabel, { color: "#F44336" }]}>2.0+</Text>
                    </View>
                    <View style={styles.taGaugeLabelRow}>
                      <Text style={[styles.taGaugeZone, { color: "#A855F7" }]}>역방향</Text>
                      <Text style={[styles.taGaugeZone, { color: Colors.dark.accent }]}>저변동</Text>
                      <Text style={styles.taGaugeZone}>유사</Text>
                      <Text style={[styles.taGaugeZone, { color: "#F44336" }]}>고변동</Text>
                    </View>
                  </View>

                  <View style={styles.taInfoCard}>
                    <Text style={styles.taInfoText}>
                      비트코인이 오르면 이 코인도 오를까?{"\n"}
                      <Text style={{ color: Colors.dark.text, fontFamily: "Inter_600SemiBold" }}>얼마나 같이 움직이는지</Text> 숫자로 보여줘요
                    </Text>
                    <View style={styles.taExampleRow}>
                      <Text style={styles.taExampleLabel}>BTC가 +10% 오르면?</Text>
                    </View>
                    <View style={styles.betaExampleGrid}>
                      <View style={styles.betaExampleItem}>
                        <Text style={[styles.betaExampleValue, { color: "#78909C" }]}>β 0.5</Text>
                        <Text style={[styles.betaExampleResult, { color: "#4CAF50" }]}>+5%</Text>
                      </View>
                      <View style={styles.betaExampleItem}>
                        <Text style={[styles.betaExampleValue, { color: Colors.dark.accent }]}>β 1.0</Text>
                        <Text style={[styles.betaExampleResult, { color: "#4CAF50" }]}>+10%</Text>
                      </View>
                      <View style={styles.betaExampleItem}>
                        <Text style={[styles.betaExampleValue, { color: "#F44336" }]}>β 3.0</Text>
                        <Text style={[styles.betaExampleResult, { color: "#4CAF50" }]}>+30%</Text>
                      </View>
                      <View style={styles.betaExampleItem}>
                        <Text style={[styles.betaExampleValue, { color: "#A855F7" }]}>β -0.4</Text>
                        <Text style={[styles.betaExampleResult, { color: "#F44336" }]}>-4%</Text>
                      </View>
                      <View style={styles.betaExampleItem}>
                        <Text style={[styles.betaExampleValue, { color: "#7C3AED" }]}>β -3.0</Text>
                        <Text style={[styles.betaExampleResult, { color: "#F44336" }]}>-30%</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.taSectionHeader}>
                    <Text style={styles.taSectionTitle}>방향 선택</Text>
                  </View>
                  <View style={styles.betaDirRow}>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setBetaDir("same");
                      }}
                      style={[styles.betaDirBtn, betaDir === "same" && styles.betaDirBtnActive]}
                    >
                      <Feather name="trending-up" size={16} color={betaDir === "same" ? Colors.dark.accent : Colors.dark.textTertiary} />
                      <Text style={[styles.betaDirText, betaDir === "same" && styles.betaDirTextActive]}>같은 방향</Text>
                      <Text style={styles.betaDirDesc}>BTC 오르면 같이 오름</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setBetaDir("opp");
                      }}
                      style={[styles.betaDirBtn, betaDir === "opp" && styles.betaDirBtnActiveOpp]}
                    >
                      <Feather name="shuffle" size={16} color={betaDir === "opp" ? "#A855F7" : Colors.dark.textTertiary} />
                      <Text style={[styles.betaDirText, betaDir === "opp" && styles.betaDirTextActiveOpp]}>반대 방향</Text>
                      <Text style={styles.betaDirDesc}>BTC 오르면 내림</Text>
                    </Pressable>
                  </View>

                  <View style={styles.taSectionHeader}>
                    <Text style={styles.taSectionTitle}>변동 크기</Text>
                  </View>
                  <View style={styles.taChipGrid}>
                    {currentDetail.options
                      .filter(o => betaDir === "same" ? o.id.startsWith("same_") : o.id.startsWith("opp_"))
                      .map(option => {
                      const sel = localFilters.beta === option.id;
                      const color = betaDir === "same"
                        ? (option.id === "same_mid" ? Colors.dark.accent : "#F44336")
                        : (option.id === "opp_mid" ? "#A855F7" : "#7C3AED");
                      return (
                        <Pressable
                          key={option.id}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            toggleOption("beta", option.id);
                          }}
                          style={[styles.taChip, sel && { borderColor: color, backgroundColor: `${color}18` }]}
                        >
                          <View style={[styles.taChipDot, { backgroundColor: color }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.taChipLabel, sel && { color: Colors.dark.text }]}>{option.label}</Text>
                            {option.description && <Text style={[styles.taChipDesc, sel && { color: Colors.dark.textSecondary }]}>{option.description}</Text>}
                          </View>
                          {sel && <Feather name="check" size={16} color={color} />}
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.sectionDivider} />
                  <View style={styles.taSectionHeader}>
                    <Text style={styles.taSectionTitle}>직접 설정</Text>
                    <Text style={styles.taSectionDesc}>베타 범위를 직접 입력 (음수 가능)</Text>
                  </View>
                  <View style={styles.taCustomRow}>
                    <TextInput
                      style={[styles.taCustomInput, localFilters.beta?.startsWith("custom:") && styles.taCustomInputActive]}
                      placeholder="최소"
                      placeholderTextColor={Colors.dark.textTertiary}
                      keyboardType="numbers-and-punctuation"
                      value={customBetaMin}
                      onChangeText={setCustomBetaMin}
                    />
                    <View style={styles.taCustomSep}><Text style={styles.taCustomSepText}>~</Text></View>
                    <TextInput
                      style={[styles.taCustomInput, localFilters.beta?.startsWith("custom:") && styles.taCustomInputActive]}
                      placeholder="최대"
                      placeholderTextColor={Colors.dark.textTertiary}
                      keyboardType="numbers-and-punctuation"
                      value={customBetaMax}
                      onChangeText={setCustomBetaMax}
                    />
                    <Pressable
                      onPress={() => {
                        if (customBetaMin && customBetaMax) {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setLocalFilters(prev => ({ ...prev, beta: `custom:${customBetaMin}:${customBetaMax}` }));
                        }
                      }}
                      style={[styles.taCustomApply, (!customBetaMin || !customBetaMax) && { opacity: 0.3 }]}
                    >
                      <Text style={styles.taCustomApplyText}>적용</Text>
                    </Pressable>
                  </View>
                  {localFilters.beta && (
                    <View style={styles.crSummary}>
                      <Feather name="check-circle" size={13} color={Colors.dark.accent} />
                      <Text style={styles.crSummaryText}>
                        {localFilters.beta.startsWith("custom:")
                          ? `베타 ${customBetaMin}~${customBetaMax} 범위의 코인`
                          : `${currentDetail.options.find(o => o.id === localFilters.beta)?.label ?? ""} 코인`}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.optionsList}>
                  {currentDetail.options.map(option => (
                    <FilterOptionRow
                      key={option.id}
                      option={option}
                      isSelected={localFilters[detailCategory] === option.id}
                      onPress={() => toggleOption(detailCategory, option.id)}
                    />
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: footerBottomPadding }]}>
              <Pressable
                onPress={handleApply}
                style={({ pressed }) => [
                  styles.applyButton,
                  resultCount === 0 && styles.applyButtonDisabled,
                  pressed && { opacity: 0.85 },
                ]}
                disabled={resultCount === 0}
              >
                <Text style={styles.applyText}>
                  {resultCount > 0 ? `${resultCount}개 보기` : "조건에 맞는 코인 없음"}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={styles.fullContent}
          >
            <View style={styles.mainHeader}>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
              >
                <Feather name="chevron-left" size={24} color={Colors.dark.text} />
              </Pressable>
              <Text style={styles.mainHeaderTitle}>필터 설정</Text>
              {activeFilterCount > 0 && (
                <Pressable
                  onPress={resetFilters}
                  hitSlop={10}
                  style={({ pressed }) => [styles.headerResetBtn, pressed && { opacity: 0.6 }]}
                >
                  <Feather name="refresh-cw" size={13} color={Colors.dark.textSecondary} />
                  <Text style={styles.headerResetText}>초기화</Text>
                </Pressable>
              )}
            </View>

            {activeFilterCount > 0 && (
              <View style={styles.activeChipsBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeChipsScroll}>
                  {FILTER_CATEGORIES.map(cat => {
                    const val = localFilters[cat.id];
                    if (!val) return null;
                    let label = cat.options.find(o => o.id === val)?.label;
                    if (!label && val.startsWith("customRank:")) {
                      const parts = val.replace("customRank:", "").split("-");
                      label = `${parts[0]}~${parts[1]}위`;
                    }
                    if (!label && val.startsWith("customCap:")) {
                      const parts = val.replace("customCap:", "").split("-");
                      label = `${parts[0]}~${parts[1]}조`;
                    }
                    if (!label && val.startsWith("custom:") && cat.id === "changeRate") {
                      const parts = val.replace("custom:", "").split(":");
                      const pLabel = parts[0] === "1h" ? "1시간" : parts[0] === "24h" ? "24시간" : parts[0] === "7d" ? "7일" : "30일";
                      label = `${pLabel} ${parts[2] === "up" ? "+" : "-"}${parts[1]}%`;
                    }
                    if (!label && val.startsWith("custom:") && cat.id === "athDrop") {
                      const parts = val.replace("custom:", "").split(":");
                      const pLabel = parts[0] === "all" ? "역대" : parts[0] === "y1" ? "1년" : parts[0] === "m6" ? "6개월" : parts[0] === "m3" ? "3개월" : "1개월";
                      label = `${pLabel} 고점 -${parts[1]}% ${parts[2] === "under" ? "이내" : "이상"}`;
                    }
                    if (!label && val.startsWith("custom:") && cat.id === "atlRise") {
                      const parts = val.replace("custom:", "").split(":");
                      const pLabel = parts[0] === "all" ? "역대" : parts[0] === "y1" ? "1년" : parts[0] === "m6" ? "6개월" : parts[0] === "m3" ? "3개월" : "1개월";
                      label = `${pLabel} 저점 +${parts[1]}% ${parts[2] === "over" ? "이상" : "이내"}`;
                    }
                    if (!label && val.startsWith("customVol:")) {
                      const parts = val.replace("customVol:", "").split("-");
                      label = `거래량 ${parts[0]}~${parts[1]}조`;
                    }
                    if (!label && val.startsWith("customRvol:")) {
                      const raw = val.replace("customRvol:", "");
                      const parts = raw.split(":");
                      const period = parts.length === 2 ? parts[0] : "30d";
                      const mult = parts.length === 2 ? parts[1] : raw;
                      const pLabel = period === "24h" ? "24시간" : period === "7d" ? "7일" : "30일";
                      label = `${pLabel} RVOL ${mult}배 이상`;
                    }
                    if (!label && val.startsWith("custom:") && cat.id === "rsi") {
                      const parts = val.replace("custom:", "").split(":");
                      label = `RSI ${parts[0]}~${parts[1]}`;
                    }
                    if (!label && val.startsWith("custom:") && cat.id === "beta") {
                      const parts = val.replace("custom:", "").split(":");
                      label = `베타 ${parts[0]}~${parts[1]}`;
                    }
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setLocalFilters(prev => ({ ...prev, [cat.id]: null }));
                        }}
                        style={({ pressed }) => [styles.activeChip, pressed && { opacity: 0.7 }]}
                      >
                        <Text style={styles.activeChipText}>{label}</Text>
                        <Feather name="x" size={11} color={Colors.dark.textSecondary} />
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.tabBar}>
              {FILTER_GROUPS.map((group, idx) => {
                const isActive = activeTab === idx;
                const tabFilterCount = group.categories.filter(cId => localFilters[cId] !== null).length;
                return (
                  <Pressable
                    key={group.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveTab(idx);
                    }}
                    style={[styles.tabItem, isActive && styles.tabItemActive]}
                  >
                    <View style={styles.tabLabelRow}>
                      <Feather name={group.icon as any} size={13} color={isActive ? Colors.dark.accent : Colors.dark.textTertiary} />
                      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{group.title}</Text>
                    </View>
                    {tabFilterCount > 0 && (
                      <View style={styles.tabBadge}>
                        <Text style={styles.tabBadgeText}>{tabFilterCount}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentInner} showsVerticalScrollIndicator={false}>
              {(() => {
                const group = FILTER_GROUPS[activeTab];
                return (
                  <View style={styles.tabCards}>
                    {group.categories.map(catId => {
                      const cat = FILTER_CATEGORIES.find(c => c.id === catId);
                      if (!cat) return null;
                      const hasFilter = localFilters[cat.id] !== null;
                      const selectedOption = hasFilter
                        ? cat.options.find(o => o.id === localFilters[cat.id])
                        : null;
                      let selectedLabel = selectedOption?.label;
                      if (!selectedLabel && hasFilter) {
                        const val = localFilters[cat.id]!;
                        if (val.startsWith("customRank:")) { const p = val.replace("customRank:", "").split("-"); selectedLabel = `${p[0]}~${p[1]}위`; }
                        else if (val.startsWith("customCap:")) { const p = val.replace("customCap:", "").split("-"); selectedLabel = `${p[0]}~${p[1]}조`; }
                        else if (val.startsWith("custom:") && cat.id === "changeRate") { const p = val.replace("custom:", "").split(":"); selectedLabel = `${p[0] === "1h" ? "1시간" : p[0] === "24h" ? "24시간" : p[0] === "7d" ? "7일" : "30일"} ${p[2] === "up" ? "+" : "-"}${p[1]}%`; }
                        else if (val.startsWith("customVol:")) { const p = val.replace("customVol:", "").split("-"); selectedLabel = `${p[0]}~${p[1]}조`; }
                        else if (val.startsWith("customRvol:")) {
                          const raw = val.replace("customRvol:", "");
                          const parts = raw.split(":");
                          const period = parts.length === 2 ? parts[0] : "30d";
                          const mult = parts.length === 2 ? parts[1] : raw;
                          const pLabel = period === "24h" ? "24시간" : period === "7d" ? "7일" : "30일";
                          selectedLabel = `${pLabel} RVOL ${mult}배+`;
                        }
                        else if (val.startsWith("custom:") && cat.id === "rsi") { const p = val.replace("custom:", "").split(":"); selectedLabel = `RSI ${p[0]}~${p[1]}`; }
                        else if (val.startsWith("custom:") && cat.id === "beta") { const p = val.replace("custom:", "").split(":"); selectedLabel = `${p[0]}~${p[1]}`; }
                        else if (val.startsWith("custom:") && cat.id === "athDrop") { const p = val.replace("custom:", "").split(":"); selectedLabel = `고점 -${p[1]}%`; }
                        else if (val.startsWith("custom:") && cat.id === "atlRise") { const p = val.replace("custom:", "").split(":"); selectedLabel = `저점 +${p[1]}%`; }
                      }
                      return (
                        <Pressable
                          key={cat.id}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setDetailCategory(cat.id);
                          }}
                          style={({ pressed }) => [styles.filterCard, hasFilter && styles.filterCardActive, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
                        >
                          <View style={styles.filterCardTop}>
                            <Text style={[styles.filterCardTitle, hasFilter && styles.filterCardTitleActive]}>{cat.title}</Text>
                            <Feather name="chevron-right" size={16} color={hasFilter ? Colors.dark.accent : Colors.dark.textTertiary} />
                          </View>
                          <Text style={styles.filterCardDesc} numberOfLines={1}>
                            {hasFilter && selectedLabel ? selectedLabel : cat.subtitle}
                          </Text>
                          {hasFilter && (
                            <Pressable
                              onPress={(e) => {
                                e.stopPropagation?.();
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setLocalFilters(prev => ({ ...prev, [cat.id]: null }));
                              }}
                              hitSlop={8}
                              style={({ pressed }) => [styles.filterCardClear, pressed && { opacity: 0.6 }]}
                            >
                              <Feather name="x" size={12} color={Colors.dark.accent} />
                              <Text style={styles.filterCardClearText}>해제</Text>
                            </Pressable>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })()}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: footerBottomPadding }]}>
              <Pressable
                onPress={handleApply}
                style={({ pressed }) => [
                  styles.applyButton,
                  resultCount === 0 && styles.applyButtonDisabled,
                  pressed && { opacity: 0.85 },
                ]}
                disabled={resultCount === 0}
              >
                <Text style={styles.applyText}>
                  {resultCount > 0 ? `${resultCount}개 코인 보기` : "조건에 맞는 코인 없음"}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </Animated.View>
      </WebModalWrapper>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  fullContent: {
    flex: 1,
  },
  mainHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  mainHeaderTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  headerResetBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  headerResetText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
    marginBottom: 6,
  },
  mainSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    marginBottom: 32,
  },
  categoryList: {
    gap: 24,
  },
  filterGroup: {
    gap: 0,
  },
  filterGroupHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginBottom: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  filterGroupTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textTertiary,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.divider,
  },
  categoryRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryRowTitle: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.text,
  },
  categoryRowTitleActive: {
    color: Colors.dark.accent,
    fontFamily: "Inter_700Bold",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.accent,
  },
  activeFiltersSection: {
    marginTop: 28,
  },
  activeFiltersTitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
    marginBottom: 12,
  },
  activeChipsBar: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.divider,
  },
  activeChipsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  activeChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.dark.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  activeChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.text,
  },
  tabBar: {
    flexDirection: "row" as const,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 6,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: Colors.dark.surfaceElevated,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
    borderColor: "transparent",
    position: "relative" as const,
  },
  tabItemActive: {
    backgroundColor: "rgba(247,147,26,0.1)",
    borderColor: "rgba(247,147,26,0.3)",
  },
  tabLabelRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  tabText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textTertiary,
  },
  tabTextActive: {
    color: Colors.dark.accent,
  },
  tabBadge: {
    position: "absolute" as const,
    top: -4,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.dark.accent,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContentInner: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  tabCards: {
    gap: 12,
  },
  filterCard: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  filterCardActive: {
    borderColor: "rgba(247,147,26,0.3)",
    backgroundColor: "rgba(247,147,26,0.06)",
  },
  filterCardTop: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 4,
  },
  filterCardTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  filterCardTitleActive: {
    color: Colors.dark.accent,
  },
  filterCardDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
  },
  filterCardClear: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    marginTop: 10,
    alignSelf: "flex-start" as const,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "rgba(247,147,26,0.1)",
  },
  filterCardClearText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.accent,
  },
  tabContentSpacer: {
    flex: 0,
  },
  detailScroll: {
    flex: 1,
  },
  detailContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  detailTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
    marginBottom: 6,
  },
  detailSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    marginBottom: 32,
  },
  optionsList: {
    gap: 0,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.divider,
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.text,
  },
  optionLabelActive: {
    color: Colors.dark.accent,
    fontFamily: "Inter_700Bold",
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.dark.divider,
    marginVertical: 20,
  },
  customInputSection: {
    marginTop: 16,
  },
  customInputLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textTertiary,
    marginBottom: 10,
  },
  customInputRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  customInput: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    textAlign: "center" as const,
  },
  customInputActive: {
    borderColor: Colors.dark.accent,
  },
  customInputSep: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
  },
  customInputUnit: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
  },
  customApplyBtn: {
    minWidth: 52,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.dark.surfaceElevated,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  customApplyBtnDisabled: {
    opacity: 0.5,
  },
  customChipRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
    marginTop: 8,
  },
  rvolHintText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
    marginTop: 8,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  periodChipActive: {
    backgroundColor: "rgba(247,147,26,0.15)",
    borderColor: Colors.dark.accent,
  },
  periodChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
  },
  periodChipTextActive: {
    color: Colors.dark.accent,
    fontFamily: "Inter_600SemiBold",
  },
  dirToggle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
  },
  dirToggleUp: {
    backgroundColor: "rgba(76,175,80,0.15)",
    borderColor: "#4CAF50",
  },
  dirToggleDown: {
    backgroundColor: "rgba(244,67,54,0.15)",
    borderColor: "#F44336",
  },
  dirToggleText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  crSectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  crQuickGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  crQuickChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  crQuickChipUp: {
    backgroundColor: "rgba(76,175,80,0.06)",
    borderColor: "rgba(76,175,80,0.2)",
  },
  crQuickChipDown: {
    backgroundColor: "rgba(244,67,54,0.06)",
    borderColor: "rgba(244,67,54,0.2)",
  },
  crQuickChipUpActive: {
    backgroundColor: "rgba(76,175,80,0.2)",
    borderColor: "#4CAF50",
  },
  crQuickChipDownActive: {
    backgroundColor: "rgba(244,67,54,0.2)",
    borderColor: "#F44336",
  },
  crQuickChipText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  crQuickChipTextUp: {
    color: "rgba(76,175,80,0.7)",
  },
  crQuickChipTextDown: {
    color: "rgba(244,67,54,0.7)",
  },
  crQuickChipTextActive: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  crSummary: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(247,147,26,0.08)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(247,147,26,0.15)",
  },
  crSummaryText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.divider,
    gap: 12,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  resetText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
  },
  applyButton: {
    flex: 1,
    backgroundColor: Colors.dark.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  applyButtonDisabled: {
    backgroundColor: Colors.dark.surfaceElevated,
  },
  applyText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  crQuickChipDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  crQuickChipDescActive: {
    color: "rgba(255,255,255,0.7)",
  },
  streakSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
    marginBottom: 20,
  },
  taGaugeContainer: {
    marginBottom: 20,
  },
  taGaugeBar: {
    flexDirection: "row" as const,
    height: 10,
    borderRadius: 6,
    overflow: "hidden" as const,
  },
  taGaugeSegment: {
    height: "100%" as const,
  },
  taGaugeLabels: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  taGaugeLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textTertiary,
  },
  taGaugeLabelRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginTop: 2,
    paddingHorizontal: 8,
  },
  taGaugeZone: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textTertiary,
  },
  taInfoCard: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  taInfoText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  taInfoRow: {
    gap: 6,
  },
  taInfoBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  taInfoBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  taExampleRow: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
  },
  taExampleText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textTertiary,
  },
  taExampleLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  betaExampleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  betaExampleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  betaExampleValue: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  betaExampleResult: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  taSectionHeader: {
    marginBottom: 12,
  },
  taSectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  taSectionDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  taPeriodRow: {
    flexDirection: "row" as const,
    gap: 8,
    marginBottom: 8,
  },
  taPeriodChip: {
    flex: 1,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    alignItems: "center" as const,
    position: "relative" as const,
  },
  taPeriodChipActive: {
    borderColor: Colors.dark.accent,
    backgroundColor: "rgba(247,147,26,0.08)",
  },
  taPeriodLabel: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.textSecondary,
  },
  taPeriodLabelActive: {
    color: Colors.dark.text,
  },
  taPeriodDesc: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  taPeriodDescActive: {
    color: Colors.dark.textSecondary,
  },
  taDefaultBadge: {
    position: "absolute" as const,
    top: -6,
    right: -4,
    backgroundColor: Colors.dark.accent,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  taDefaultBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  taHintCard: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 8,
    marginBottom: 24,
  },
  taHintText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
    flex: 1,
    lineHeight: 17,
  },
  taChipGrid: {
    gap: 6,
    marginBottom: 8,
  },
  taChip: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  taChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taChipLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  taChipDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
    marginTop: 1,
  },
  taCustomRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  taCustomInput: {
    flex: 1,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    textAlign: "center" as const,
  },
  taCustomInputActive: {
    borderColor: Colors.dark.accent,
  },
  taCustomSep: {
    width: 20,
    alignItems: "center" as const,
  },
  taCustomSepText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textTertiary,
  },
  taCustomApply: {
    backgroundColor: "rgba(247,147,26,0.15)",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  taCustomApplyText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.accent,
  },
  betaDirRow: {
    flexDirection: "row" as const,
    gap: 10,
    marginBottom: 8,
  },
  betaDirBtn: {
    flex: 1,
    alignItems: "center" as const,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    backgroundColor: Colors.dark.surfaceElevated,
    gap: 4,
  },
  betaDirBtnActive: {
    borderColor: "rgba(247,147,26,0.4)",
    backgroundColor: "rgba(247,147,26,0.08)",
  },
  betaDirBtnActiveOpp: {
    borderColor: "rgba(168,85,247,0.4)",
    backgroundColor: "rgba(168,85,247,0.08)",
  },
  betaDirText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  betaDirTextActive: {
    color: Colors.dark.accent,
  },
  betaDirTextActiveOpp: {
    color: "#A855F7",
  },
  betaDirDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
  },
});
