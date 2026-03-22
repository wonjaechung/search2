import React, { useState, useCallback, useEffect, useRef } from "react";
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
  PanResponder,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, withTiming, FadeIn, SlideInRight, SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
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

  const [mcCustomMode, setMcCustomMode] = useState(false);
  const [mcRangeMin, setMcRangeMin] = useState(1);
  const [mcRangeMax, setMcRangeMax] = useState(100);
  const mcSliderWidth = useRef(0);
  const mcDragThumb = useRef<"min" | "max" | null>(null);
  const [customCapMin, setCustomCapMin] = useState("");
  const [customCapMax, setCustomCapMax] = useState("");
  const [customChangePeriod, setCustomChangePeriod] = useState("24h");
  const [customChangePct, setCustomChangePct] = useState("");
  const [customChangeDir, setCustomChangeDir] = useState<"up" | "down">("up");
  const [changeCustomMode, setChangeCustomMode] = useState(false);
  const [changeRangeMin, setChangeRangeMin] = useState(0);
  const [changeRangeMax, setChangeRangeMax] = useState(50);
  const sliderTrackWidth = useRef(0);
  const activeDragThumb = useRef<"min" | "max" | null>(null);
  const [customVolMin, setCustomVolMin] = useState("");
  const [customVolMax, setCustomVolMax] = useState("");
  const [customRvolPeriod, setCustomRvolPeriod] = useState<(typeof RVOL_PERIOD_OPTIONS)[number]["key"]>("30d");
  const [customRvolPct, setCustomRvolPct] = useState("");
  const [athPeriod, setAthPeriod] = useState("all");
  const [athPct, setAthPct] = useState("");
  const [athDir, setAthDir] = useState<"under" | "over">("over");
  const [athCustomMode, setAthCustomMode] = useState(false);
  const [athRangeMin, setAthRangeMin] = useState(0);
  const [athRangeMax, setAthRangeMax] = useState(100);
  const athSliderWidth = useRef(0);
  const athDragThumb = useRef<"min" | "max" | null>(null);
  const [atlPeriod, setAtlPeriod] = useState("all");
  const [atlPct, setAtlPct] = useState("");
  const [atlDir, setAtlDir] = useState<"under" | "over">("over");
  const [atlCustomMode, setAtlCustomMode] = useState(false);
  const [atlRangeMin, setAtlRangeMin] = useState(0);
  const [atlRangeMax, setAtlRangeMax] = useState(1000);
  const atlSliderWidth = useRef(0);
  const atlDragThumb = useRef<"min" | "max" | null>(null);
  const [customRsiMin, setCustomRsiMin] = useState("");
  const [customRsiMax, setCustomRsiMax] = useState("");
  const [customBetaMin, setCustomBetaMin] = useState("");
  const [customBetaMax, setCustomBetaMax] = useState("");
  const [rsiPeriod, setRsiPeriod] = useState("14");
  const [betaDir, setBetaDir] = useState<"same" | "opp">("same");
  const [maAlignDir, setMaAlignDir] = useState<"golden" | "death">("golden");
  const [maShort, setMaShort] = useState("5");
  const [maMid, setMaMid] = useState("20");
  const [maLong, setMaLong] = useState("60");
  const [volCustomMode, setVolCustomMode] = useState(false);
  const [volRangeMin, setVolRangeMin] = useState(1);
  const [volRangeMax, setVolRangeMax] = useState(100);
  const volSliderWidth = useRef(0);
  const volDragThumb = useRef<"min" | "max" | null>(null);
  const [newHLType, setNewHLType] = useState<"high" | "low">("high");
  const [newHLPeriod, setNewHLPeriod] = useState("7");
  const [crossDir, setCrossDir] = useState<"golden" | "death">("golden");
  const [crossShort, setCrossShort] = useState("5");
  const [crossLong, setCrossLong] = useState("20");
  const [crossPeriod, setCrossPeriod] = useState("7");

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
      maAlign: null,
      maCross: null,
      newHighLow: null,
      depositSurge: null,
      fewAccount: null,
      unrealizedPnl: null,
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
      setMcCustomMode(false);
      setMcRangeMin(1);
      setMcRangeMax(100);
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
        setMcCustomMode(true);
        setMcRangeMin(parseInt(parts[0], 10) || 1);
        setMcRangeMax(parseInt(parts[1], 10) || 100);
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
              {detailCategory !== "beta" && detailCategory !== "rsi" && detailCategory !== "rvol" && detailCategory !== "maAlign" && detailCategory !== "maCross" && detailCategory !== "changeRate" && detailCategory !== "athDrop" && detailCategory !== "atlRise" && detailCategory !== "newHighLow" && detailCategory !== "volume" && detailCategory !== "depositSurge" && detailCategory !== "fewAccount" && detailCategory !== "unrealizedPnl" && currentDetail.subtitle ? (
                <Text style={styles.detailSubtitle}>{currentDetail.subtitle}</Text>
              ) : null}

              {detailCategory === "marketCap" ? (
                <>
                  <Text style={styles.sectionLabel}>순위권</Text>
                  <View style={styles.optionsList}>
                    {currentDetail.options.filter(o => o.id.startsWith("top")).map(option => (
                      <FilterOptionRow
                        key={option.id}
                        option={option}
                        isSelected={!mcCustomMode && localFilters.marketCap === option.id}
                        onPress={() => {
                          setMcCustomMode(false);
                          toggleOption("marketCap", option.id);
                        }}
                      />
                    ))}
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setMcCustomMode(!mcCustomMode);
                        if (!mcCustomMode) {
                          setLocalFilters(prev => ({ ...prev, marketCap: `customRank:${mcRangeMin}-${mcRangeMax}` }));
                        }
                      }}
                    >
                      <Text style={[styles.taSectionTitle, mcCustomMode && { color: Colors.dark.accent }]}>직접설정</Text>
                    </Pressable>
                  </View>
                  {mcCustomMode && (() => {
                    const sliderMax = 200;
                    const minRatio = mcRangeMin / sliderMax;
                    const maxRatio = mcRangeMax / sliderMax;
                    const handleMcSlider = (e: GestureResponderEvent, isGrant?: boolean) => {
                      const x = Math.max(0, e.nativeEvent.locationX);
                      const w = mcSliderWidth.current || 200;
                      const pct = Math.round(Math.min(1, Math.max(0, x / w)) * sliderMax);
                      const val = Math.max(1, pct);
                      if (isGrant) {
                        const distToMin = Math.abs(val - mcRangeMin);
                        const distToMax = Math.abs(val - mcRangeMax);
                        mcDragThumb.current = distToMin <= distToMax ? "min" : "max";
                      }
                      let newMin = mcRangeMin;
                      let newMax = mcRangeMax;
                      if (mcDragThumb.current === "min") {
                        newMin = Math.min(val, mcRangeMax);
                      } else {
                        newMax = Math.max(val, mcRangeMin);
                      }
                      setMcRangeMin(newMin);
                      setMcRangeMax(newMax);
                      setLocalFilters(prev => ({ ...prev, marketCap: `customRank:${newMin}-${newMax}` }));
                    };
                    return (
                      <View style={{ marginTop: 12, backgroundColor: Colors.dark.surface, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20 }}>
                        <View style={{ flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, marginBottom: 14 }}>
                          <View style={{ flex: 1, backgroundColor: Colors.dark.card, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 }}>
                            <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.dark.text, textAlign: "center" as const }}>
                              {mcRangeMin}위
                            </Text>
                          </View>
                          <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.dark.textTertiary }}>~</Text>
                          <View style={{ flex: 1, backgroundColor: Colors.dark.card, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 }}>
                            <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.dark.text, textAlign: "center" as const }}>
                              {mcRangeMax}위
                            </Text>
                          </View>
                        </View>
                        <View
                          onLayout={(ev: LayoutChangeEvent) => { mcSliderWidth.current = ev.nativeEvent.layout.width; }}
                          onStartShouldSetResponder={() => true}
                          onMoveShouldSetResponder={() => true}
                          onResponderGrant={(e: GestureResponderEvent) => handleMcSlider(e, true)}
                          onResponderMove={(e: GestureResponderEvent) => handleMcSlider(e)}
                          style={{ height: 40, justifyContent: "center" as const }}
                        >
                          <View style={{ height: 4, borderRadius: 2, backgroundColor: Colors.dark.card, position: "absolute" as const, left: 0, right: 0 }} />
                          <View style={{ height: 4, borderRadius: 2, backgroundColor: Colors.dark.accent, position: "absolute" as const, left: `${minRatio * 100}%` as any, right: `${(1 - maxRatio) * 100}%` as any }} />
                          <View style={{
                            position: "absolute" as const, left: `${minRatio * 100}%` as any, marginLeft: -12,
                            width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff",
                            shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
                          }} />
                          <View style={{
                            position: "absolute" as const, left: `${maxRatio * 100}%` as any, marginLeft: -12,
                            width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff",
                            shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
                          }} />
                        </View>
                        <View style={{ flexDirection: "row" as const, justifyContent: "space-between" as const, marginTop: 4 }}>
                          <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.dark.textTertiary }}>1위</Text>
                          <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.dark.textTertiary }}>{sliderMax}위</Text>
                        </View>
                      </View>
                    );
                  })()}

                  <View style={styles.sectionDivider} />

                  <Text style={styles.sectionLabel}>시가총액 규모</Text>
                  <View style={styles.optionsList}>
                    {currentDetail.options.filter(o => !o.id.startsWith("top")).map(option => (
                      <FilterOptionRow
                        key={option.id}
                        option={option}
                        isSelected={!mcCustomMode && localFilters.marketCap === option.id}
                        onPress={() => {
                          setMcCustomMode(false);
                          toggleOption("marketCap", option.id);
                        }}
                      />
                    ))}
                  </View>

                </>
              ) : detailCategory === "changeRate" ? (
                <>
                  <View style={styles.taInfoCard}>
                    <Text style={styles.taInfoText}>
                      선택한 기간 동안{"\n"}
                      <Text style={{ color: Colors.dark.text, fontFamily: "Inter_600SemiBold" }}>가격이 얼마나 올랐거나 내렸는지</Text> 필터링해요
                    </Text>
                    <View style={{ marginTop: 12, alignItems: "center" as const }}>
                      <Svg width="100%" height={65} viewBox="0 0 200 65">
                        {/* baseline */}
                        <Path d="M20,35 L180,35" stroke={Colors.dark.textTertiary} strokeWidth={1} strokeDasharray="4,3" fill="none" opacity={0.5} />
                        {/* up line */}
                        <Path d="M20,35 Q60,33 100,28 Q140,18 180,10" stroke="#4CAF50" strokeWidth={2.5} fill="none" />
                        {/* down line */}
                        <Path d="M20,35 Q60,37 100,42 Q140,52 180,58" stroke="#F44336" strokeWidth={2.5} fill="none" />
                      </Svg>
                      <View style={{ flexDirection: "row" as const, gap: 16, marginTop: 2 }}>
                        <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 4 }}>
                          <View style={{ width: 10, height: 2.5, backgroundColor: "#4CAF50", borderRadius: 1 }} />
                          <Text style={{ fontSize: 10, fontFamily: "Inter_500Medium", color: "#4CAF50" }}>상승</Text>
                        </View>
                        <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 4 }}>
                          <View style={{ width: 10, height: 2.5, backgroundColor: "#F44336", borderRadius: 1 }} />
                          <Text style={{ fontSize: 10, fontFamily: "Inter_500Medium", color: "#F44336" }}>하락</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>기간</Text>
                  </View>
                  <View style={styles.betaDirRow}>
                    {([
                      { id: "1h", label: "1시간" },
                      { id: "24h", label: "24시간" },
                      { id: "7d", label: "7일" },
                      { id: "30d", label: "30일" },
                    ] as const).map(p => (
                      <Pressable
                        key={p.id}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setCustomChangePeriod(p.id);
                          if (customChangePct) {
                            setLocalFilters(prev => ({ ...prev, changeRate: `custom:${p.id}:${customChangePct}:${customChangeDir}` }));
                          }
                        }}
                        style={[styles.betaDirBtn, customChangePeriod === p.id && { borderColor: Colors.dark.accent, backgroundColor: "rgba(10,132,255,0.1)" }]}
                      >
                        <Text style={[styles.betaDirText, customChangePeriod === p.id && { color: Colors.dark.accent }]}>{p.label}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>방향</Text>
                  </View>
                  <View style={styles.betaDirRow}>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setCustomChangeDir("up");
                        if (customChangePct) {
                          setLocalFilters(prev => ({ ...prev, changeRate: `custom:${customChangePeriod}:${customChangePct}:up` }));
                        }
                      }}
                      style={[styles.betaDirBtn, customChangeDir === "up" && { borderColor: "#4CAF50", backgroundColor: "rgba(76,175,80,0.1)" }]}
                    >
                      <Feather name="trending-up" size={16} color={customChangeDir === "up" ? "#4CAF50" : Colors.dark.textTertiary} />
                      <Text style={[styles.betaDirText, customChangeDir === "up" && { color: "#4CAF50" }]}>상승</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setCustomChangeDir("down");
                        if (customChangePct) {
                          setLocalFilters(prev => ({ ...prev, changeRate: `custom:${customChangePeriod}:${customChangePct}:down` }));
                        }
                      }}
                      style={[styles.betaDirBtn, customChangeDir === "down" && { borderColor: "#F44336", backgroundColor: "rgba(244,67,54,0.1)" }]}
                    >
                      <Feather name="trending-down" size={16} color={customChangeDir === "down" ? "#F44336" : Colors.dark.textTertiary} />
                      <Text style={[styles.betaDirText, customChangeDir === "down" && { color: "#F44336" }]}>하락</Text>
                    </Pressable>
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>변동폭</Text>
                  </View>
                  <View style={styles.betaDirRow}>
                    {[
                      { id: "5", label: "5% 이상" },
                      { id: "10", label: "10% 이상" },
                    ].map(item => {
                      const isActive = !changeCustomMode && customChangePct === item.id && localFilters.changeRate === `custom:${customChangePeriod}:${item.id}:${customChangeDir}`;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setChangeCustomMode(false);
                            setCustomChangePct(item.id);
                            const val = `custom:${customChangePeriod}:${item.id}:${customChangeDir}`;
                            setLocalFilters(prev => ({ ...prev, changeRate: prev.changeRate === val ? null : val }));
                          }}
                          style={[styles.betaDirBtn, isActive && { borderColor: Colors.dark.accent, backgroundColor: "rgba(10,132,255,0.1)" }]}
                        >
                          <Text style={[styles.betaDirText, isActive && { color: Colors.dark.accent }]}>{item.label}</Text>
                        </Pressable>
                      );
                    })}
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setChangeCustomMode(true);
                        setLocalFilters(prev => ({ ...prev, changeRate: `custom:${customChangePeriod}:${changeRangeMin}:${changeRangeMax}:${customChangeDir}` }));
                      }}
                      style={[styles.betaDirBtn, changeCustomMode && { borderColor: Colors.dark.accent, backgroundColor: "rgba(10,132,255,0.1)" }]}
                    >
                      <Text style={[styles.betaDirText, changeCustomMode && { color: Colors.dark.accent }]}>직접설정</Text>
                    </Pressable>
                  </View>
                  {changeCustomMode && (() => {
                    const sliderMax = 50;
                    const minRatio = changeRangeMin / sliderMax;
                    const maxRatio = changeRangeMax / sliderMax;
                    const handleSliderTouch = (e: GestureResponderEvent, isGrant?: boolean) => {
                      const x = Math.max(0, e.nativeEvent.locationX);
                      const w = sliderTrackWidth.current || 200;
                      const pct = Math.round(Math.min(1, Math.max(0, x / w)) * sliderMax);
                      if (isGrant) {
                        const distToMin = Math.abs(pct - changeRangeMin);
                        const distToMax = Math.abs(pct - changeRangeMax);
                        activeDragThumb.current = distToMin <= distToMax ? "min" : "max";
                      }
                      let newMin = changeRangeMin;
                      let newMax = changeRangeMax;
                      if (activeDragThumb.current === "min") {
                        newMin = Math.min(pct, changeRangeMax);
                      } else {
                        newMax = Math.max(pct, changeRangeMin);
                      }
                      setChangeRangeMin(newMin);
                      setChangeRangeMax(newMax);
                      setLocalFilters(prev => ({ ...prev, changeRate: `custom:${customChangePeriod}:${newMin}:${newMax}:${customChangeDir}` }));
                    };
                    return (
                      <View style={{ marginTop: 12, backgroundColor: Colors.dark.surface, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20 }}>
                        <View style={{ flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, marginBottom: 14 }}>
                          <View style={{ flex: 1, backgroundColor: Colors.dark.card, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 }}>
                            <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.dark.text, textAlign: "center" as const }}>
                              {changeRangeMin}% 이상
                            </Text>
                          </View>
                          <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.dark.textTertiary }}>~</Text>
                          <View style={{ flex: 1, backgroundColor: Colors.dark.card, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 }}>
                            <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.dark.text, textAlign: "center" as const }}>
                              {changeRangeMax}% 이하
                            </Text>
                          </View>
                        </View>
                        <View
                          onLayout={(ev: LayoutChangeEvent) => {
                            sliderTrackWidth.current = ev.nativeEvent.layout.width;
                          }}
                          onStartShouldSetResponder={() => true}
                          onMoveShouldSetResponder={() => true}
                          onResponderGrant={(e: GestureResponderEvent) => handleSliderTouch(e, true)}
                          onResponderMove={(e: GestureResponderEvent) => handleSliderTouch(e)}
                          style={{ height: 40, justifyContent: "center" as const }}
                        >
                          <View style={{ height: 4, borderRadius: 2, backgroundColor: Colors.dark.card, position: "absolute" as const, left: 0, right: 0 }} />
                          <View style={{ height: 4, borderRadius: 2, backgroundColor: Colors.dark.accent, position: "absolute" as const, left: `${minRatio * 100}%` as any, right: `${(1 - maxRatio) * 100}%` as any }} />
                          <View style={{
                            position: "absolute" as const,
                            left: `${minRatio * 100}%` as any,
                            marginLeft: -12,
                            width: 24, height: 24, borderRadius: 12,
                            backgroundColor: "#fff",
                            shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4,
                            elevation: 4,
                          }} />
                          <View style={{
                            position: "absolute" as const,
                            left: `${maxRatio * 100}%` as any,
                            marginLeft: -12,
                            width: 24, height: 24, borderRadius: 12,
                            backgroundColor: "#fff",
                            shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4,
                            elevation: 4,
                          }} />
                        </View>
                        <View style={{ flexDirection: "row" as const, justifyContent: "space-between" as const, marginTop: 4 }}>
                          <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.dark.textTertiary }}>0%</Text>
                          <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.dark.textTertiary }}>{sliderMax}%</Text>
                        </View>
                      </View>
                    );
                  })()}
                </>
              ) : detailCategory === "volume" ? (
                <>
                  <View style={styles.taInfoCard}>
                    <Text style={styles.taInfoText}>
                      24시간 동안 거래된 금액이{"\n"}
                      <Text style={{ color: Colors.dark.text, fontFamily: "Inter_600SemiBold" }}>얼마나 큰 코인인지</Text> 필터링해요
                    </Text>
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>거래 순위</Text>
                  </View>
                  <View style={styles.optionsList}>
                    {[
                      { id: "top5", label: "Top 5" },
                      { id: "top10", label: "Top 10" },
                      { id: "top20", label: "Top 20" },
                      { id: "top50", label: "Top 50" },
                      { id: "top100", label: "Top 100" },
                    ].map(item => {
                      const isActive = !volCustomMode && localFilters.volume === item.id;
                      return (
                        <FilterOptionRow
                          key={item.id}
                          option={item}
                          isSelected={isActive}
                          onPress={() => {
                            setVolCustomMode(false);
                            toggleOption("volume", item.id);
                          }}
                        />
                      );
                    })}
                  </View>
                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setVolCustomMode(!volCustomMode);
                        if (!volCustomMode) {
                          setLocalFilters(prev => ({ ...prev, volume: `customRank:${volRangeMin}-${volRangeMax}` }));
                        }
                      }}
                    >
                      <Text style={[styles.taSectionTitle, volCustomMode && { color: Colors.dark.accent }]}>직접설정</Text>
                    </Pressable>
                  </View>
                  {volCustomMode && (() => {
                    const sliderMax = 200;
                    const minRatio = volRangeMin / sliderMax;
                    const maxRatio = volRangeMax / sliderMax;
                    const handleVolSlider = (e: GestureResponderEvent, isGrant?: boolean) => {
                      const x = Math.max(0, e.nativeEvent.locationX);
                      const w = volSliderWidth.current || 200;
                      const pct = Math.round(Math.min(1, Math.max(0, x / w)) * sliderMax);
                      const val = Math.max(1, pct);
                      if (isGrant) {
                        const distToMin = Math.abs(val - volRangeMin);
                        const distToMax = Math.abs(val - volRangeMax);
                        volDragThumb.current = distToMin <= distToMax ? "min" : "max";
                      }
                      let newMin = volRangeMin;
                      let newMax = volRangeMax;
                      if (volDragThumb.current === "min") {
                        newMin = Math.min(val, volRangeMax);
                      } else {
                        newMax = Math.max(val, volRangeMin);
                      }
                      setVolRangeMin(newMin);
                      setVolRangeMax(newMax);
                      setLocalFilters(prev => ({ ...prev, volume: `customRank:${newMin}-${newMax}` }));
                    };
                    return (
                      <View style={{ marginTop: 12, backgroundColor: Colors.dark.surface, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20 }}>
                        <View style={{ flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, marginBottom: 14 }}>
                          <View style={{ flex: 1, backgroundColor: Colors.dark.card, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 }}>
                            <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.dark.text, textAlign: "center" as const }}>
                              {volRangeMin}위
                            </Text>
                          </View>
                          <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.dark.textTertiary }}>~</Text>
                          <View style={{ flex: 1, backgroundColor: Colors.dark.card, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 }}>
                            <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.dark.text, textAlign: "center" as const }}>
                              {volRangeMax}위
                            </Text>
                          </View>
                        </View>
                        <View
                          onLayout={(ev: LayoutChangeEvent) => { volSliderWidth.current = ev.nativeEvent.layout.width; }}
                          onStartShouldSetResponder={() => true}
                          onMoveShouldSetResponder={() => true}
                          onResponderGrant={(e: GestureResponderEvent) => handleVolSlider(e, true)}
                          onResponderMove={(e: GestureResponderEvent) => handleVolSlider(e)}
                          style={{ height: 40, justifyContent: "center" as const }}
                        >
                          <View style={{ height: 4, borderRadius: 2, backgroundColor: Colors.dark.card, position: "absolute" as const, left: 0, right: 0 }} />
                          <View style={{ height: 4, borderRadius: 2, backgroundColor: Colors.dark.accent, position: "absolute" as const, left: `${minRatio * 100}%` as any, right: `${(1 - maxRatio) * 100}%` as any }} />
                          <View style={{
                            position: "absolute" as const, left: `${minRatio * 100}%` as any, marginLeft: -12,
                            width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff",
                            shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
                          }} />
                          <View style={{
                            position: "absolute" as const, left: `${maxRatio * 100}%` as any, marginLeft: -12,
                            width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff",
                            shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
                          }} />
                        </View>
                        <View style={{ flexDirection: "row" as const, justifyContent: "space-between" as const, marginTop: 4 }}>
                          <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.dark.textTertiary }}>1위</Text>
                          <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.dark.textTertiary }}>{sliderMax}위</Text>
                        </View>
                      </View>
                    );
                  })()}
                </>
              ) : detailCategory === "rvol" ? (
                <>
                  <View style={styles.taInfoCard}>
                    <Text style={styles.taInfoText}>
                      평균 거래량 대비 지금 얼마나 활발할까?{"\n"}
                      <Text style={{ color: Colors.dark.text, fontFamily: "Inter_600SemiBold" }}>평소 대비 거래량</Text>을 배수로 보여줘요
                    </Text>
                    <View style={{ marginTop: 10 }}>
                      {[
                        { label: "평소", mult: 1.0, color: Colors.dark.textSecondary, isBase: true },
                        { label: "2배", mult: 2.0, color: Colors.dark.accent },
                        { label: "3배", mult: 3.0, color: "#FF9800" },
                        { label: "5배", mult: 5.0, color: "#F44336" },
                      ].map((item, idx) => {
                        const barWidth = Math.min(item.mult / 5.0, 1) * 100;
                        return (
                          <View key={idx} style={styles.betaBarRow}>
                            <Text style={[styles.betaBarLabel, { color: item.color }]}>{item.label}</Text>
                            <View style={styles.betaBarTrack}>
                              {item.isBase ? (
                                <View style={[styles.betaBarFill, {
                                  width: `${barWidth}%`,
                                  backgroundColor: "transparent",
                                  borderWidth: 1.5,
                                  borderColor: Colors.dark.textTertiary,
                                  borderStyle: "dashed" as const,
                                }]} />
                              ) : (
                                <View style={[styles.betaBarFill, {
                                  width: `${barWidth}%`,
                                  backgroundColor: `${item.color}99`,
                                }]} />
                              )}
                            </View>
                            <Text style={[styles.betaBarResult, { color: item.isBase ? Colors.dark.textSecondary : item.color }]}>{item.mult}x</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>평균 기준 기간</Text>
                  </View>
                  <View style={styles.betaDirRow}>
                    {RVOL_PERIOD_OPTIONS.map(p => {
                      const active = customRvolPeriod === p.key;
                      return (
                        <Pressable
                          key={p.key}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setCustomRvolPeriod(p.key);
                          }}
                          style={[styles.betaDirBtn, active && styles.betaDirBtnActive]}
                        >
                          <Text style={[styles.betaDirText, active && styles.betaDirTextActive]}>{p.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>최소 거래량</Text>
                  </View>
                  <View style={styles.betaDirRow}>
                    {currentDetail.options.map(option => {
                      const sel = localFilters.rvol === option.id;
                      const color = option.id === "rvol_200" ? Colors.dark.accent : option.id === "rvol_300" ? "#FF9800" : "#F44336";
                      return (
                        <Pressable
                          key={option.id}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            toggleOption("rvol", option.id);
                          }}
                          style={[styles.betaDirBtn, sel && { borderColor: color, backgroundColor: `${color}18` }]}
                        >
                          <Text style={[styles.betaDirText, sel && { color }]}>{option.label}</Text>
                          <Text style={styles.betaDirDesc}>{option.description}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.sectionDivider} />
                  <View style={[styles.taSectionHeader, { marginTop: 4 }]}>
                    <Text style={styles.taSectionTitle}>직접 설정</Text>
                  </View>
                  <View style={styles.taCustomRow}>
                    <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.dark.textSecondary }}>평균 대비</Text>
                    <TextInput
                      style={[styles.taCustomInput, { flex: 1 }, localFilters.rvol?.startsWith("customRvol:") && styles.taCustomInputActive]}
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
                    <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.dark.textSecondary }}>배 이상</Text>
                  </View>
                </>
              ) : detailCategory === "depositSurge" ? (
                <>
                  <View style={styles.taInfoCard}>
                    <Text style={styles.taInfoText}>
                      평소보다 거래소 입금량이 급격히 늘어난 코인이에요.{"\n"}
                      <Text style={{ color: Colors.dark.text, fontFamily: "Inter_600SemiBold" }}>대량 매도 신호</Text>일 수 있어 주의가 필요해요
                    </Text>
                    <View style={{ marginTop: 10 }}>
                      {[
                        { label: "평소", mult: 1.0, color: Colors.dark.textSecondary, isBase: true, badge: "1x" },
                        { label: "3배", mult: 3.0, color: Colors.dark.accent, isBase: false, badge: "주의" },
                        { label: "4배", mult: 4.0, color: "#FF9800", isBase: false, badge: "경고" },
                        { label: "5배", mult: 5.0, color: "#F44336", isBase: false, badge: "위험" },
                      ].map((item, idx) => {
                        const barWidth = Math.min(item.mult / 5.0, 1) * 100;
                        return (
                          <View key={idx} style={styles.betaBarRow}>
                            <Text style={[styles.betaBarLabel, { color: item.color }]}>{item.label}</Text>
                            <View style={styles.betaBarTrack}>
                              {item.isBase ? (
                                <View style={[styles.betaBarFill, {
                                  width: `${barWidth}%`,
                                  backgroundColor: "transparent",
                                  borderWidth: 1.5,
                                  borderColor: Colors.dark.textTertiary,
                                  borderStyle: "dashed" as const,
                                }]} />
                              ) : (
                                <View style={[styles.betaBarFill, {
                                  width: `${barWidth}%`,
                                  backgroundColor: `${item.color}99`,
                                }]} />
                              )}
                            </View>
                            <Text style={[styles.betaBarResult, { color: item.isBase ? Colors.dark.textSecondary : item.color }]}>{item.badge}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>입금량 기준</Text>
                  </View>
                  <View style={styles.betaDirRow}>
                    {currentDetail.options.map(option => {
                      const sel = localFilters.depositSurge === option.id;
                      const color = option.id === "dep_300" ? Colors.dark.accent : option.id === "dep_400" ? "#FF9800" : "#F44336";
                      return (
                        <Pressable
                          key={option.id}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            toggleOption("depositSurge", option.id);
                          }}
                          style={[styles.betaDirBtn, sel && { borderColor: color, backgroundColor: `${color}18` }]}
                        >
                          <Text style={[styles.betaDirText, sel && { color }]}>{option.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : detailCategory === "fewAccount" ? (
                <>
                  <View style={styles.taInfoCard}>
                    <Text style={styles.taInfoText}>
                      소수의 계정이 전체 거래량의 대부분을 차지하는 코인이에요.{"\n"}
                      <Text style={{ color: Colors.dark.text, fontFamily: "Inter_600SemiBold" }}>가격 조작 위험</Text>이 있을 수 있어요
                    </Text>
                    <View style={{ marginTop: 10 }}>
                      {[
                        { label: "50%", pct: 50, color: Colors.dark.accent, badge: "주의" },
                        { label: "75%", pct: 75, color: "#FF9800", badge: "경고" },
                        { label: "90%", pct: 90, color: "#F44336", badge: "위험" },
                      ].map((item, idx) => {
                        const barWidth = item.pct;
                        return (
                          <View key={idx} style={styles.betaBarRow}>
                            <Text style={[styles.betaBarLabel, { color: item.color }]}>{item.label}</Text>
                            <View style={styles.betaBarTrack}>
                              <View style={[styles.betaBarFill, {
                                width: `${barWidth}%`,
                                backgroundColor: `${item.color}99`,
                              }]} />
                            </View>
                            <Text style={[styles.betaBarResult, { color: item.color }]}>{item.badge}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>집중도 기준</Text>
                  </View>
                  <View style={styles.betaDirRow}>
                    {currentDetail.options.map(option => {
                      const sel = localFilters.fewAccount === option.id;
                      const color = option.id === "conc_50" ? Colors.dark.accent : option.id === "conc_75" ? "#FF9800" : "#F44336";
                      return (
                        <Pressable
                          key={option.id}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            toggleOption("fewAccount", option.id);
                          }}
                          style={[styles.betaDirBtn, sel && { borderColor: color, backgroundColor: `${color}18` }]}
                        >
                          <Text style={[styles.betaDirText, sel && { color }]}>{option.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : detailCategory === "unrealizedPnl" ? (
                <>
                  <View style={styles.taInfoCard}>
                    <Text style={styles.taInfoText}>
                      현재 가격 기준으로{"\n"}
                      <Text style={{ color: Colors.dark.text, fontFamily: "Inter_600SemiBold" }}>수익 구간에 있는 보유자 비율</Text>을 확인해요
                    </Text>
                  </View>

                  {currentDetail.options.map(option => (
                    <FilterOptionRow
                      key={option.id}
                      option={option}
                      isSelected={localFilters.unrealizedPnl === option.id}
                      onPress={() => toggleOption("unrealizedPnl", option.id)}
                    />
                  ))}
                </>
              ) : detailCategory === "athDrop" ? (
                <>
                  <View style={styles.taInfoCard}>
                    <Text style={styles.taInfoText}>
                      선택한 기간의 최고가 대비{"\n"}
                      <Text style={{ color: Colors.dark.text, fontFamily: "Inter_600SemiBold" }}>지금 얼마나 떨어져 있는지</Text> 확인해요
                    </Text>
                    <View style={{ marginTop: 12, alignItems: "center" as const }}>
                      <Svg width="100%" height={65} viewBox="0 0 200 65">
                        {/* 고점 기준선 */}
                        <Path d="M10,18 L190,18" stroke={Colors.dark.textTertiary} strokeWidth={1} strokeDasharray="4,3" fill="none" opacity={0.4} />
                        {/* price line: was at high, dropped down */}
                        <Path d="M10,20 Q50,19 80,18 Q100,18 120,25 Q150,38 180,48" stroke="#F44336" strokeWidth={2.5} fill="none" />
                        {/* drop arrow */}
                        <Path d="M150,22 L150,40" stroke="#F44336" strokeWidth={1.5} fill="none" opacity={0.6} />
                        <Path d="M147,37 L150,42 L153,37" stroke="#F44336" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.6} />
                      </Svg>
                      <View style={{ flexDirection: "row" as const, gap: 16, marginTop: 2 }}>
                        <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 4 }}>
                          <View style={{ width: 10, height: 2.5, backgroundColor: "#F44336", borderRadius: 1 }} />
                          <Text style={{ fontSize: 10, fontFamily: "Inter_500Medium", color: Colors.dark.textSecondary }}>현재 가격</Text>
                        </View>
                        <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 4 }}>
                          <View style={{ width: 10, height: 1, backgroundColor: Colors.dark.textTertiary, borderRadius: 1 }} />
                          <Text style={{ fontSize: 10, fontFamily: "Inter_500Medium", color: Colors.dark.textSecondary }}>고점</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>기준 기간</Text>
                  </View>
                  <View style={styles.betaDirRow}>
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
                          setAthPeriod(p.key);
                          if (localFilters.athDrop) {
                            if (athCustomMode) {
                              setLocalFilters(prev => ({ ...prev, athDrop: `custom:${p.key}:${athRangeMin}:${athRangeMax}` }));
                            } else if (athPct) {
                              setLocalFilters(prev => ({ ...prev, athDrop: `custom:${p.key}:${athPct}:${athDir}` }));
                            }
                          }
                        }}
                        style={[styles.betaDirBtn, athPeriod === p.key && { borderColor: Colors.dark.accent, backgroundColor: "rgba(10,132,255,0.1)" }]}
                      >
                        <Text style={[styles.betaDirText, athPeriod === p.key && { color: Colors.dark.accent }]}>{p.label}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>하락폭</Text>
                  </View>
                  <View style={styles.betaDirRow}>
                    {[
                      { id: "10", label: "10% 이내", dir: "under" as const },
                      { id: "30", label: "30% 이내", dir: "under" as const },
                      { id: "50", label: "50% 이상", dir: "over" as const },
                    ].map(item => {
                      const val = `custom:${athPeriod}:${item.id}:${item.dir}`;
                      const isActive = !athCustomMode && localFilters.athDrop === val;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setAthCustomMode(false);
                            setAthPct(item.id);
                            setAthDir(item.dir);
                            setLocalFilters(prev => ({ ...prev, athDrop: prev.athDrop === val ? null : val }));
                          }}
                          style={[styles.betaDirBtn, isActive && { borderColor: Colors.dark.accent, backgroundColor: "rgba(10,132,255,0.1)" }]}
                        >
                          <Text style={[styles.betaDirText, isActive && { color: Colors.dark.accent }]}>{item.label}</Text>
                        </Pressable>
                      );
                    })}
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setAthCustomMode(true);
                        setLocalFilters(prev => ({ ...prev, athDrop: `custom:${athPeriod}:${athRangeMin}:${athRangeMax}` }));
                      }}
                      style={[styles.betaDirBtn, athCustomMode && { borderColor: Colors.dark.accent, backgroundColor: "rgba(10,132,255,0.1)" }]}
                    >
                      <Text style={[styles.betaDirText, athCustomMode && { color: Colors.dark.accent }]}>직접설정</Text>
                    </Pressable>
                  </View>
                  {athCustomMode && (() => {
                    const sliderMax = 100;
                    const minRatio = athRangeMin / sliderMax;
                    const maxRatio = athRangeMax / sliderMax;
                    const handleAthSlider = (e: GestureResponderEvent, isGrant?: boolean) => {
                      const x = Math.max(0, e.nativeEvent.locationX);
                      const w = athSliderWidth.current || 200;
                      const pct = Math.round(Math.min(1, Math.max(0, x / w)) * sliderMax);
                      if (isGrant) {
                        const distToMin = Math.abs(pct - athRangeMin);
                        const distToMax = Math.abs(pct - athRangeMax);
                        athDragThumb.current = distToMin <= distToMax ? "min" : "max";
                      }
                      let newMin = athRangeMin;
                      let newMax = athRangeMax;
                      if (athDragThumb.current === "min") {
                        newMin = Math.min(pct, athRangeMax);
                      } else {
                        newMax = Math.max(pct, athRangeMin);
                      }
                      setAthRangeMin(newMin);
                      setAthRangeMax(newMax);
                      setLocalFilters(prev => ({ ...prev, athDrop: `custom:${athPeriod}:${newMin}:${newMax}` }));
                    };
                    return (
                      <View style={{ marginTop: 12, backgroundColor: Colors.dark.surface, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20 }}>
                        <View style={{ flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, marginBottom: 14 }}>
                          <View style={{ flex: 1, backgroundColor: Colors.dark.card, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 }}>
                            <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.dark.text, textAlign: "center" as const }}>
                              {athRangeMin}% 이상
                            </Text>
                          </View>
                          <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.dark.textTertiary }}>~</Text>
                          <View style={{ flex: 1, backgroundColor: Colors.dark.card, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 }}>
                            <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.dark.text, textAlign: "center" as const }}>
                              {athRangeMax}% 이하
                            </Text>
                          </View>
                        </View>
                        <View
                          onLayout={(ev: LayoutChangeEvent) => { athSliderWidth.current = ev.nativeEvent.layout.width; }}
                          onStartShouldSetResponder={() => true}
                          onMoveShouldSetResponder={() => true}
                          onResponderGrant={(e: GestureResponderEvent) => handleAthSlider(e, true)}
                          onResponderMove={(e: GestureResponderEvent) => handleAthSlider(e)}
                          style={{ height: 40, justifyContent: "center" as const }}
                        >
                          <View style={{ height: 4, borderRadius: 2, backgroundColor: Colors.dark.card, position: "absolute" as const, left: 0, right: 0 }} />
                          <View style={{ height: 4, borderRadius: 2, backgroundColor: Colors.dark.accent, position: "absolute" as const, left: `${minRatio * 100}%` as any, right: `${(1 - maxRatio) * 100}%` as any }} />
                          <View style={{
                            position: "absolute" as const, left: `${minRatio * 100}%` as any, marginLeft: -12,
                            width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff",
                            shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
                          }} />
                          <View style={{
                            position: "absolute" as const, left: `${maxRatio * 100}%` as any, marginLeft: -12,
                            width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff",
                            shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
                          }} />
                        </View>
                        <View style={{ flexDirection: "row" as const, justifyContent: "space-between" as const, marginTop: 4 }}>
                          <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.dark.textTertiary }}>0%</Text>
                          <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.dark.textTertiary }}>100%</Text>
                        </View>
                      </View>
                    );
                  })()}
                </>
              ) : detailCategory === "atlRise" ? (
                <>
                  <View style={styles.taInfoCard}>
                    <Text style={styles.taInfoText}>
                      선택한 기간의 최저가 대비{"\n"}
                      <Text style={{ color: Colors.dark.text, fontFamily: "Inter_600SemiBold" }}>지금 얼마나 올라와 있는지</Text> 확인해요
                    </Text>
                    <View style={{ marginTop: 12, alignItems: "center" as const }}>
                      <Svg width="100%" height={65} viewBox="0 0 200 65">
                        {/* 저점 기준선 */}
                        <Path d="M10,48 L190,48" stroke={Colors.dark.textTertiary} strokeWidth={1} strokeDasharray="4,3" fill="none" opacity={0.4} />
                        {/* price line: was at low, rose up */}
                        <Path d="M10,46 Q50,47 80,48 Q100,48 120,40 Q150,25 180,14" stroke="#4CAF50" strokeWidth={2.5} fill="none" />
                        {/* rise arrow */}
                        <Path d="M150,44 L150,26" stroke="#4CAF50" strokeWidth={1.5} fill="none" opacity={0.6} />
                        <Path d="M147,29 L150,24 L153,29" stroke="#4CAF50" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.6} />
                      </Svg>
                      <View style={{ flexDirection: "row" as const, gap: 16, marginTop: 2 }}>
                        <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 4 }}>
                          <View style={{ width: 10, height: 2.5, backgroundColor: "#4CAF50", borderRadius: 1 }} />
                          <Text style={{ fontSize: 10, fontFamily: "Inter_500Medium", color: Colors.dark.textSecondary }}>현재 가격</Text>
                        </View>
                        <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 4 }}>
                          <View style={{ width: 10, height: 1, backgroundColor: Colors.dark.textTertiary, borderRadius: 1 }} />
                          <Text style={{ fontSize: 10, fontFamily: "Inter_500Medium", color: Colors.dark.textSecondary }}>저점</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>기준 기간</Text>
                  </View>
                  <View style={styles.betaDirRow}>
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
                          setAtlPeriod(p.key);
                          if (localFilters.atlRise) {
                            if (atlCustomMode) {
                              setLocalFilters(prev => ({ ...prev, atlRise: `custom:${p.key}:${atlRangeMin}:${atlRangeMax}` }));
                            } else if (atlPct) {
                              setLocalFilters(prev => ({ ...prev, atlRise: `custom:${p.key}:${atlPct}:${atlDir}` }));
                            }
                          }
                        }}
                        style={[styles.betaDirBtn, atlPeriod === p.key && { borderColor: Colors.dark.accent, backgroundColor: "rgba(10,132,255,0.1)" }]}
                      >
                        <Text style={[styles.betaDirText, atlPeriod === p.key && { color: Colors.dark.accent }]}>{p.label}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>상승폭</Text>
                  </View>
                  <View style={styles.betaDirRow}>
                    {[
                      { id: "20", label: "20% 이내", dir: "under" as const },
                      { id: "100", label: "100% 이상", dir: "over" as const },
                    ].map(item => {
                      const val = `custom:${atlPeriod}:${item.id}:${item.dir}`;
                      const isActive = !atlCustomMode && localFilters.atlRise === val;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setAtlCustomMode(false);
                            setAtlPct(item.id);
                            setAtlDir(item.dir);
                            setLocalFilters(prev => ({ ...prev, atlRise: prev.atlRise === val ? null : val }));
                          }}
                          style={[styles.betaDirBtn, isActive && { borderColor: Colors.dark.accent, backgroundColor: "rgba(10,132,255,0.1)" }]}
                        >
                          <Text style={[styles.betaDirText, isActive && { color: Colors.dark.accent }]}>{item.label}</Text>
                        </Pressable>
                      );
                    })}
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setAtlCustomMode(true);
                        setLocalFilters(prev => ({ ...prev, atlRise: `custom:${atlPeriod}:${atlRangeMin}:${atlRangeMax}` }));
                      }}
                      style={[styles.betaDirBtn, atlCustomMode && { borderColor: Colors.dark.accent, backgroundColor: "rgba(10,132,255,0.1)" }]}
                    >
                      <Text style={[styles.betaDirText, atlCustomMode && { color: Colors.dark.accent }]}>직접설정</Text>
                    </Pressable>
                  </View>
                  {atlCustomMode && (() => {
                    const sliderMax = 1000;
                    const minRatio = atlRangeMin / sliderMax;
                    const maxRatio = atlRangeMax / sliderMax;
                    const handleAtlSlider = (e: GestureResponderEvent, isGrant?: boolean) => {
                      const x = Math.max(0, e.nativeEvent.locationX);
                      const w = atlSliderWidth.current || 200;
                      const pct = Math.round(Math.min(1, Math.max(0, x / w)) * sliderMax);
                      if (isGrant) {
                        const distToMin = Math.abs(pct - atlRangeMin);
                        const distToMax = Math.abs(pct - atlRangeMax);
                        atlDragThumb.current = distToMin <= distToMax ? "min" : "max";
                      }
                      let newMin = atlRangeMin;
                      let newMax = atlRangeMax;
                      if (atlDragThumb.current === "min") {
                        newMin = Math.min(pct, atlRangeMax);
                      } else {
                        newMax = Math.max(pct, atlRangeMin);
                      }
                      setAtlRangeMin(newMin);
                      setAtlRangeMax(newMax);
                      setLocalFilters(prev => ({ ...prev, atlRise: `custom:${atlPeriod}:${newMin}:${newMax}` }));
                    };
                    return (
                      <View style={{ marginTop: 12, backgroundColor: Colors.dark.surface, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20 }}>
                        <View style={{ flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, marginBottom: 14 }}>
                          <View style={{ flex: 1, backgroundColor: Colors.dark.card, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 }}>
                            <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.dark.text, textAlign: "center" as const }}>
                              {atlRangeMin}% 이상
                            </Text>
                          </View>
                          <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.dark.textTertiary }}>~</Text>
                          <View style={{ flex: 1, backgroundColor: Colors.dark.card, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 }}>
                            <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.dark.text, textAlign: "center" as const }}>
                              {atlRangeMax}% 이하
                            </Text>
                          </View>
                        </View>
                        <View
                          onLayout={(ev: LayoutChangeEvent) => { atlSliderWidth.current = ev.nativeEvent.layout.width; }}
                          onStartShouldSetResponder={() => true}
                          onMoveShouldSetResponder={() => true}
                          onResponderGrant={(e: GestureResponderEvent) => handleAtlSlider(e, true)}
                          onResponderMove={(e: GestureResponderEvent) => handleAtlSlider(e)}
                          style={{ height: 40, justifyContent: "center" as const }}
                        >
                          <View style={{ height: 4, borderRadius: 2, backgroundColor: Colors.dark.card, position: "absolute" as const, left: 0, right: 0 }} />
                          <View style={{ height: 4, borderRadius: 2, backgroundColor: Colors.dark.accent, position: "absolute" as const, left: `${minRatio * 100}%` as any, right: `${(1 - maxRatio) * 100}%` as any }} />
                          <View style={{
                            position: "absolute" as const, left: `${minRatio * 100}%` as any, marginLeft: -12,
                            width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff",
                            shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
                          }} />
                          <View style={{
                            position: "absolute" as const, left: `${maxRatio * 100}%` as any, marginLeft: -12,
                            width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff",
                            shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
                          }} />
                        </View>
                        <View style={{ flexDirection: "row" as const, justifyContent: "space-between" as const, marginTop: 4 }}>
                          <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.dark.textTertiary }}>0%</Text>
                          <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.dark.textTertiary }}>{sliderMax}%</Text>
                        </View>
                      </View>
                    );
                  })()}
                </>
              ) : detailCategory === "newHighLow" ? (
                <>
                  <View style={styles.taInfoCard}>
                    <Text style={styles.taInfoText}>
                      선택한 기간 내에서{"\n"}
                      <Text style={{ color: Colors.dark.text, fontFamily: "Inter_600SemiBold" }}>최고가 또는 최저가를 갱신한 코인</Text>을 찾아요
                    </Text>
                    <View style={{ marginTop: 12, alignItems: "center" as const }}>
                      <Svg width="100%" height={65} viewBox="0 0 200 65">
                        {/* previous high dotted line */}
                        <Path d="M10,22 L190,22" stroke={Colors.dark.textTertiary} strokeWidth={1} strokeDasharray="4,3" fill="none" opacity={0.4} />
                        {/* price line going up and breaking through */}
                        <Path d="M10,50 Q40,45 70,38 Q100,28 120,22 Q140,14 170,8" stroke="#4CAF50" strokeWidth={2.5} fill="none" />
                        {/* breakout marker */}
                        <Path d="M120,22 L120,16" stroke="#FFC107" strokeWidth={2.5} strokeLinecap="round" fill="none" />
                        <Path d="M116,19 L120,14 L124,19" stroke="#FFC107" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </Svg>
                      <View style={{ flexDirection: "row" as const, gap: 16, marginTop: 2 }}>
                        <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 4 }}>
                          <View style={{ width: 10, height: 2.5, backgroundColor: "#4CAF50", borderRadius: 1 }} />
                          <Text style={{ fontSize: 10, fontFamily: "Inter_500Medium", color: Colors.dark.textSecondary }}>가격</Text>
                        </View>
                        <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 4 }}>
                          <View style={{ width: 10, height: 1, backgroundColor: Colors.dark.textTertiary, borderRadius: 1 }} />
                          <Text style={{ fontSize: 10, fontFamily: "Inter_500Medium", color: Colors.dark.textSecondary }}>이전 고점</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>신호 선택</Text>
                  </View>
                  <View style={styles.betaDirRow}>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setNewHLType("high");
                        setLocalFilters(prev => ({ ...prev, newHighLow: `high_${newHLPeriod}` }));
                      }}
                      style={[styles.betaDirBtn, newHLType === "high" && { borderColor: "#4CAF50", backgroundColor: "rgba(76,175,80,0.1)" }]}
                    >
                      <Feather name="trending-up" size={16} color={newHLType === "high" ? "#4CAF50" : Colors.dark.textTertiary} />
                      <Text style={[styles.betaDirText, newHLType === "high" && { color: "#4CAF50" }]}>신고가</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setNewHLType("low");
                        setLocalFilters(prev => ({ ...prev, newHighLow: `low_${newHLPeriod}` }));
                      }}
                      style={[styles.betaDirBtn, newHLType === "low" && { borderColor: "#F44336", backgroundColor: "rgba(244,67,54,0.1)" }]}
                    >
                      <Feather name="trending-down" size={16} color={newHLType === "low" ? "#F44336" : Colors.dark.textTertiary} />
                      <Text style={[styles.betaDirText, newHLType === "low" && { color: "#F44336" }]}>신저가</Text>
                    </Pressable>
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>기간</Text>
                  </View>
                  <View style={styles.betaDirRow}>
                    {[
                      { id: "7", label: "7일 이내" },
                      { id: "30", label: "30일 이내" },
                      { id: "90", label: "90일 이내" },
                    ].map(p => (
                      <Pressable
                        key={p.id}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setNewHLPeriod(p.id);
                          setLocalFilters(prev => ({ ...prev, newHighLow: `${newHLType}_${p.id}` }));
                        }}
                        style={[styles.betaDirBtn, newHLPeriod === p.id && { borderColor: Colors.dark.accent, backgroundColor: "rgba(10,132,255,0.1)" }]}
                      >
                        <Text style={[styles.betaDirText, newHLPeriod === p.id && { color: Colors.dark.accent }]}>{p.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
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
                  <View style={styles.taInfoCard}>
                    <Text style={styles.taInfoText}>
                      최근에 너무 많이 올랐거나 빠졌을까?{"\n"}
                      <Text style={{ color: Colors.dark.text, fontFamily: "Inter_600SemiBold" }}>가격 과열/침체 정도</Text>를 0~100 숫자로 보여줘요
                    </Text>
                    <View style={{ marginTop: 10 }}>
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
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
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

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>상태 선택</Text>
                  </View>
                  <View style={styles.betaDirRow}>
                    {currentDetail.options.map(option => {
                      const sel = localFilters.rsi === option.id;
                      const color = option.id === "oversold" ? "#4CAF50" : option.id === "neutral" ? "#78909C" : "#F44336";
                      return (
                        <Pressable
                          key={option.id}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            toggleOption("rsi", option.id);
                          }}
                          style={[styles.betaDirBtn, sel && { borderColor: color, backgroundColor: `${color}18` }]}
                        >
                          <Text style={[styles.betaDirText, sel && { color }]}>{option.label}</Text>
                          <Text style={styles.betaDirDesc}>{option.description}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                </>
              ) : detailCategory === "beta" ? (
                <>
                  <View style={styles.taInfoCard}>
                    <Text style={styles.taInfoText}>
                      비트코인이 오르면 이 코인도 오를까?{"\n"}
                      <Text style={{ color: Colors.dark.text, fontFamily: "Inter_600SemiBold" }}>얼마나 같이 움직이는지</Text> 숫자로 보여줘요
                    </Text>
                    <View style={{ marginBottom: 4 }} />
                    {[
                      { label: "BTC", beta: 1.0, result: "+10%", color: Colors.dark.textSecondary, barColor: "rgba(255,255,255,0.15)", isBtc: true },
                      { label: "β 0.5", beta: 0.5, result: "+5%", color: "#78909C", barColor: "#78909C" },
                      { label: "β 1.0", beta: 1.0, result: "+10%", color: Colors.dark.accent, barColor: Colors.dark.accent },
                      { label: "β 2.0", beta: 2.0, result: "+20%", color: "#F44336", barColor: "#F44336" },
                      { label: "β -0.5", beta: -0.5, result: "-5%", color: "#A855F7", barColor: "#A855F7" },
                      { label: "β -2.0", beta: -2.0, result: "-20%", color: "#7C3AED", barColor: "#7C3AED" },
                    ].map((item, idx) => {
                      const barWidth = Math.min(Math.abs(item.beta) / 2.0, 1) * 100;
                      const isNeg = item.beta < 0;
                      return (
                        <View key={idx} style={styles.betaBarRow}>
                          <Text style={[styles.betaBarLabel, { color: item.color }]}>{item.label}</Text>
                          <View style={styles.betaBarTrack}>
                            {item.isBtc ? (
                              <View style={[styles.betaBarFill, {
                                width: `${barWidth}%`,
                                backgroundColor: "transparent",
                                borderWidth: 1.5,
                                borderColor: Colors.dark.textTertiary,
                                borderStyle: "dashed" as const,
                              }]} />
                            ) : (
                              <View style={[styles.betaBarFill, {
                                width: `${barWidth}%`,
                                backgroundColor: `${item.barColor}99`,
                              }]} />
                            )}
                          </View>
                          <Text style={[styles.betaBarResult, { color: isNeg ? "#F44336" : item.isBtc ? Colors.dark.textSecondary : "#4CAF50" }]}>{item.result}</Text>
                        </View>
                      );
                    })}
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
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

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>변동 크기</Text>
                  </View>
                  <View style={styles.betaDirRow}>
                    {currentDetail.options
                      .filter(o => betaDir === "same" ? o.id.startsWith("same_") : o.id.startsWith("opp_"))
                      .map(option => {
                      const sel = localFilters.beta === option.id;
                      const colorMap: Record<string, string> = {
                        same_low: "#78909C",
                        same_mid: Colors.dark.accent,
                        same_high: "#F44336",
                        opp_low: "#78909C",
                        opp_mid: "#A855F7",
                        opp_high: "#7C3AED",
                      };
                      const color = colorMap[option.id] ?? Colors.dark.accent;
                      return (
                        <Pressable
                          key={option.id}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            toggleOption("beta", option.id);
                          }}
                          style={[styles.betaDirBtn, sel && { borderColor: color, backgroundColor: `${color}18` }]}
                        >
                          <Text style={[styles.betaDirText, sel && { color }]}>{option.label}</Text>
                          <Text style={styles.betaDirDesc}>{option.description}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                </>
              ) : detailCategory === "maAlign" ? (
                <>
                  <View style={styles.taInfoCard}>
                    <Text style={styles.taInfoText}>
                      단기·중기·장기 이동평균선의 순서로{"\n"}
                      <Text style={{ color: Colors.dark.text, fontFamily: "Inter_600SemiBold" }}>지금 상승 추세인지 하락 추세인지</Text> 알 수 있어요
                    </Text>
                    <View style={{ marginTop: 12, flexDirection: "row" as const, gap: 12 }}>
                      {/* 정배열 mini chart */}
                      <View style={{ flex: 1, alignItems: "center" as const }}>
                        <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#4CAF50", marginBottom: 6 }}>정배열 (상승추세)</Text>
                        <Svg width="100%" height={60} viewBox="0 0 120 60">
                          <Path d="M10,45 Q40,44 60,42 Q80,38 110,30" stroke="#9C27B0" strokeWidth={2} fill="none" />
                          <Path d="M10,40 Q40,36 60,30 Q80,22 110,18" stroke="#FF9800" strokeWidth={2} fill="none" />
                          <Path d="M10,35 Q40,28 60,20 Q80,12 110,8" stroke="#4CAF50" strokeWidth={2.5} fill="none" />
                        </Svg>
                        <View style={{ flexDirection: "row" as const, gap: 10, marginTop: 4 }}>
                          <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 4 }}>
                            <View style={{ width: 10, height: 2.5, backgroundColor: "#4CAF50", borderRadius: 1 }} />
                            <Text style={{ fontSize: 9, fontFamily: "Inter_500Medium", color: "#4CAF50" }}>단기</Text>
                          </View>
                          <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 4 }}>
                            <View style={{ width: 10, height: 2, backgroundColor: "#FF9800", borderRadius: 1 }} />
                            <Text style={{ fontSize: 9, fontFamily: "Inter_500Medium", color: "#FF9800" }}>중기</Text>
                          </View>
                          <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 4 }}>
                            <View style={{ width: 10, height: 2, backgroundColor: "#9C27B0", borderRadius: 1 }} />
                            <Text style={{ fontSize: 9, fontFamily: "Inter_500Medium", color: "#9C27B0" }}>장기</Text>
                          </View>
                        </View>
                      </View>
                      {/* 역배열 mini chart */}
                      <View style={{ flex: 1, alignItems: "center" as const }}>
                        <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#F44336", marginBottom: 6 }}>역배열 (하락추세)</Text>
                        <Svg width="100%" height={60} viewBox="0 0 120 60">
                          <Path d="M10,15 Q40,16 60,18 Q80,22 110,30" stroke="#9C27B0" strokeWidth={2} fill="none" />
                          <Path d="M10,20 Q40,24 60,30 Q80,38 110,42" stroke="#FF9800" strokeWidth={2} fill="none" />
                          <Path d="M10,25 Q40,32 60,40 Q80,48 110,52" stroke="#4CAF50" strokeWidth={2.5} fill="none" />
                        </Svg>
                        <View style={{ flexDirection: "row" as const, gap: 10, marginTop: 4 }}>
                          <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 4 }}>
                            <View style={{ width: 10, height: 2.5, backgroundColor: "#4CAF50", borderRadius: 1 }} />
                            <Text style={{ fontSize: 9, fontFamily: "Inter_500Medium", color: "#4CAF50" }}>단기</Text>
                          </View>
                          <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 4 }}>
                            <View style={{ width: 10, height: 2, backgroundColor: "#FF9800", borderRadius: 1 }} />
                            <Text style={{ fontSize: 9, fontFamily: "Inter_500Medium", color: "#FF9800" }}>중기</Text>
                          </View>
                          <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 4 }}>
                            <View style={{ width: 10, height: 2, backgroundColor: "#9C27B0", borderRadius: 1 }} />
                            <Text style={{ fontSize: 9, fontFamily: "Inter_500Medium", color: "#9C27B0" }}>장기</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>이평선 설정</Text>
                  </View>
                  <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 6 }}>
                    <TextInput
                      style={[styles.taCustomInput, { width: 48, textAlign: "center" as const, paddingHorizontal: 4 }]}
                      keyboardType="number-pad"
                      value={maShort}
                      onChangeText={setMaShort}
                      placeholder="5"
                      placeholderTextColor={Colors.dark.textTertiary}
                    />
                    <Text style={{ fontSize: 13, color: Colors.dark.textTertiary }}>-</Text>
                    <TextInput
                      style={[styles.taCustomInput, { width: 48, textAlign: "center" as const, paddingHorizontal: 4 }]}
                      keyboardType="number-pad"
                      value={maMid}
                      onChangeText={setMaMid}
                      placeholder="20"
                      placeholderTextColor={Colors.dark.textTertiary}
                    />
                    <Text style={{ fontSize: 13, color: Colors.dark.textTertiary }}>-</Text>
                    <TextInput
                      style={[styles.taCustomInput, { width: 48, textAlign: "center" as const, paddingHorizontal: 4 }]}
                      keyboardType="number-pad"
                      value={maLong}
                      onChangeText={setMaLong}
                      placeholder="60"
                      placeholderTextColor={Colors.dark.textTertiary}
                    />
                    <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.dark.textSecondary }}>일 이동평균선</Text>
                  </View>
                  <View style={styles.taHintCard}>
                    <Feather name="info" size={12} color={Colors.dark.textTertiary} />
                    <Text style={styles.taHintText}>5·20·60이 가장 일반적이에요. 더 긴 추세를 보려면 10·50·200을 추천해요.</Text>
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>추세 방향</Text>
                  </View>
                  <View style={styles.betaDirRow}>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setMaAlignDir("golden");
                        setLocalFilters(prev => ({ ...prev, maAlign: `golden_${maShort}_${maMid}_${maLong}` }));
                      }}
                      style={[styles.betaDirBtn, maAlignDir === "golden" && { borderColor: "#4CAF50", backgroundColor: "rgba(76,175,80,0.1)" }]}
                    >
                      <Feather name="trending-up" size={16} color={maAlignDir === "golden" ? "#4CAF50" : Colors.dark.textTertiary} />
                      <Text style={[styles.betaDirText, maAlignDir === "golden" && { color: "#4CAF50" }]}>정배열</Text>
                      <Text style={styles.betaDirDesc}>상승 추세</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setMaAlignDir("death");
                        setLocalFilters(prev => ({ ...prev, maAlign: `death_${maShort}_${maMid}_${maLong}` }));
                      }}
                      style={[styles.betaDirBtn, maAlignDir === "death" && { borderColor: "#F44336", backgroundColor: "rgba(244,67,54,0.1)" }]}
                    >
                      <Feather name="trending-down" size={16} color={maAlignDir === "death" ? "#F44336" : Colors.dark.textTertiary} />
                      <Text style={[styles.betaDirText, maAlignDir === "death" && { color: "#F44336" }]}>역배열</Text>
                      <Text style={styles.betaDirDesc}>하락 추세</Text>
                    </Pressable>
                  </View>
                </>
              ) : detailCategory === "maCross" ? (
                <>
                  <View style={styles.taInfoCard}>
                    <Text style={styles.taInfoText}>
                      단기 이평선이 장기 이평선을 뚫고 지나가면{"\n"}
                      <Text style={{ color: Colors.dark.text, fontFamily: "Inter_600SemiBold" }}>추세가 바뀌는 신호</Text>로 볼 수 있어요
                    </Text>
                    <View style={{ marginTop: 12, flexDirection: "row" as const, gap: 12 }}>
                      {/* 골든크로스 mini chart */}
                      <View style={{ flex: 1, alignItems: "center" as const }}>
                        <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#4CAF50", marginBottom: 6 }}>골든크로스</Text>
                        <Svg width="100%" height={60} viewBox="0 0 120 60">
                          <Path d="M10,20 Q40,28 60,35 Q80,42 110,48" stroke="#9C27B0" strokeWidth={2} fill="none" opacity={0.6} />
                          <Path d="M10,50 Q40,42 60,35 Q80,22 110,12" stroke="#4CAF50" strokeWidth={2.5} fill="none" />
                          {/* cross point */}
                          <Path d="M58,35 L62,35" stroke="#FFC107" strokeWidth={4} fill="none" strokeLinecap="round" />
                        </Svg>
                        <Text style={{ fontSize: 10, fontFamily: "Inter_500Medium", color: "#4CAF50", marginTop: 2 }}>상승 전환</Text>
                      </View>
                      {/* 데드크로스 mini chart */}
                      <View style={{ flex: 1, alignItems: "center" as const }}>
                        <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#F44336", marginBottom: 6 }}>데드크로스</Text>
                        <Svg width="100%" height={60} viewBox="0 0 120 60">
                          <Path d="M10,48 Q40,40 60,32 Q80,22 110,15" stroke="#9C27B0" strokeWidth={2} fill="none" opacity={0.6} />
                          <Path d="M10,12 Q40,22 60,32 Q80,42 110,50" stroke="#4CAF50" strokeWidth={2.5} fill="none" />
                          {/* cross point */}
                          <Path d="M58,32 L62,32" stroke="#FFC107" strokeWidth={4} fill="none" strokeLinecap="round" />
                        </Svg>
                        <Text style={{ fontSize: 10, fontFamily: "Inter_500Medium", color: "#F44336", marginTop: 2 }}>하락 전환</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row" as const, justifyContent: "center" as const, gap: 16, marginTop: 8 }}>
                      <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 4 }}>
                        <View style={{ width: 10, height: 2.5, backgroundColor: "#4CAF50", borderRadius: 1 }} />
                        <Text style={{ fontSize: 9, fontFamily: "Inter_500Medium", color: Colors.dark.textSecondary }}>단기</Text>
                      </View>
                      <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 4 }}>
                        <View style={{ width: 10, height: 2, backgroundColor: "#9C27B0", borderRadius: 1 }} />
                        <Text style={{ fontSize: 9, fontFamily: "Inter_500Medium", color: Colors.dark.textSecondary }}>장기</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>이평선 설정</Text>
                  </View>
                  <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 6 }}>
                    <TextInput
                      style={[styles.taCustomInput, { width: 48, textAlign: "center" as const, paddingHorizontal: 4 }]}
                      keyboardType="number-pad"
                      value={crossShort}
                      onChangeText={setCrossShort}
                      placeholder="5"
                      placeholderTextColor={Colors.dark.textTertiary}
                    />
                    <Text style={{ fontSize: 13, color: Colors.dark.textTertiary }}>·</Text>
                    <TextInput
                      style={[styles.taCustomInput, { width: 48, textAlign: "center" as const, paddingHorizontal: 4 }]}
                      keyboardType="number-pad"
                      value={crossLong}
                      onChangeText={setCrossLong}
                      placeholder="20"
                      placeholderTextColor={Colors.dark.textTertiary}
                    />
                    <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.dark.textSecondary }}>일 이동평균선</Text>
                  </View>
                  <View style={styles.taHintCard}>
                    <Feather name="info" size={12} color={Colors.dark.textTertiary} />
                    <Text style={styles.taHintText}>5·20이 가장 일반적이에요. 장기 추세는 20·60 또는 50·200을 추천해요.</Text>
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>신호 선택</Text>
                  </View>
                  <View style={styles.betaDirRow}>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setCrossDir("golden");
                        setLocalFilters(prev => ({ ...prev, maCross: `golden_${crossShort}_${crossLong}_${crossPeriod}` }));
                      }}
                      style={[styles.betaDirBtn, crossDir === "golden" && { borderColor: "#4CAF50", backgroundColor: "rgba(76,175,80,0.1)" }]}
                    >
                      <Feather name="trending-up" size={16} color={crossDir === "golden" ? "#4CAF50" : Colors.dark.textTertiary} />
                      <Text style={[styles.betaDirText, crossDir === "golden" && { color: "#4CAF50" }]}>골든크로스</Text>
                      <Text style={styles.betaDirDesc}>상승 전환</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setCrossDir("death");
                        setLocalFilters(prev => ({ ...prev, maCross: `death_${crossShort}_${crossLong}_${crossPeriod}` }));
                      }}
                      style={[styles.betaDirBtn, crossDir === "death" && { borderColor: "#F44336", backgroundColor: "rgba(244,67,54,0.1)" }]}
                    >
                      <Feather name="trending-down" size={16} color={crossDir === "death" ? "#F44336" : Colors.dark.textTertiary} />
                      <Text style={[styles.betaDirText, crossDir === "death" && { color: "#F44336" }]}>데드크로스</Text>
                      <Text style={styles.betaDirDesc}>하락 전환</Text>
                    </Pressable>
                  </View>

                  <View style={[styles.taSectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.taSectionTitle}>발생 시점</Text>
                  </View>
                  <View style={styles.betaDirRow}>
                    {[
                      { id: "3", label: "최근 3일" },
                      { id: "7", label: "최근 7일" },
                      { id: "14", label: "최근 14일" },
                    ].map(p => (
                      <Pressable
                        key={p.id}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setCrossPeriod(p.id);
                          setLocalFilters(prev => ({ ...prev, maCross: `${crossDir}_${crossShort}_${crossLong}_${p.id}` }));
                        }}
                        style={[styles.betaDirBtn, crossPeriod === p.id && { borderColor: Colors.dark.accent, backgroundColor: "rgba(10,132,255,0.1)" }]}
                      >
                        <Text style={[styles.betaDirText, crossPeriod === p.id && { color: Colors.dark.accent }]}>{p.label}</Text>
                      </Pressable>
                    ))}
                  </View>
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
                      label = `거래량 ${parts[0]}~${parts[1]}억`;
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
                        else if (val.startsWith("customVol:")) { const p = val.replace("customVol:", "").split("-"); selectedLabel = `${p[0]}~${p[1]}억`; }
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
    marginBottom: 8,
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
  betaBarRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 6,
  },
  betaBarLabel: {
    width: 42,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right" as const,
  },
  betaBarTrack: {
    flex: 1,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 4,
    overflow: "hidden" as const,
  },
  betaBarFill: {
    height: "100%" as const,
    borderRadius: 4,
  },
  betaBarResult: {
    width: 36,
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    textAlign: "right" as const,
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
