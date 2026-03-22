export interface CoinCategory {
  id: string;
  title: string;
  subtitle: string;
  coins: CoinItem[];
  filterKey?: FilterCategoryId;
  filterValue?: string;
}

export interface CoinItem {
  id: string;
  name: string;
  symbol: string;
  iconType: "mci" | "feather";
  iconName: string;
  iconColor: string;
  change: number;
  change1h?: number;
  price?: string;
  marketCap?: string;
  rank?: number;
  changeWeek?: number;
  changeMonth?: number;
  volume24h?: string;
  rVol?: number;
  category?: CoinCategoryType;
  tags?: string[];
  stakable?: boolean;
  lendable?: boolean;
  exchange?: string[];
  listingDays?: number;
  circulatingRatio?: number;
  athDrop?: { all: number; y1?: number; m6?: number; m3?: number; m1?: number };
  atlRise?: { all: number; y1?: number; m6?: number; m3?: number; m1?: number };
  streak?: number;
  downStreak?: number;
  rsi?: number;
  beta?: number;
  maAlign?: {
    "5_20_60"?: "golden" | "death" | "none";
    "10_50_200"?: "golden" | "death" | "none";
  };
  maCross?: {
    type: "golden" | "death";
    short: number;
    long: number;
    daysAgo: number;
  }[];
  newHighLow?: {
    high?: number;
    low?: number;
  };
  depositSurge?: number;   // 입금량 급등 배수 (e.g. 3.5 = 350%)
  fewAccountConc?: number; // 소수 계정 거래 집중도 % (e.g. 75 = 75%)
  profitHolderPct?: number; // 수익 구간 보유자 비율 % (e.g. 72 = 72%)
}

export type CoinCategoryType = "layer1" | "layer2" | "defi" | "meme" | "ai" | "gaming" | "rwa" | "infra";

export type FilterCategoryId = "marketCap" | "changeRate" | "volume" | "rvol" | "category" | "staking" | "lending" | "newListing" | "circulatingRatio" | "athDrop" | "atlRise" | "streakUp" | "streakDown" | "rsi" | "beta" | "maAlign" | "maCross" | "newHighLow" | "depositSurge" | "fewAccount" | "unrealizedPnl";

export interface FilterGroup {
  id: string;
  title: string;
  icon: string;
  categories: FilterCategoryId[];
}

export const FILTER_GROUPS: FilterGroup[] = [
  { id: "basic", title: "기본", icon: "info", categories: ["category", "marketCap", "circulatingRatio", "staking", "lending", "newListing"] },
  { id: "supply", title: "수급", icon: "bar-chart-2", categories: ["volume", "rvol", "depositSurge", "fewAccount", "unrealizedPnl"] },
  { id: "price", title: "가격", icon: "trending-up", categories: ["changeRate", "streakUp", "streakDown", "newHighLow", "athDrop", "atlRise"] },
  { id: "technical", title: "기술", icon: "activity", categories: ["rsi", "beta", "maAlign", "maCross"] },
];

export interface FilterOption {
  id: string;
  label: string;
  description?: string;
}

export interface FilterCategory {
  id: FilterCategoryId;
  title: string;
  subtitle: string;
  options: FilterOption[];
}

export interface ThemeItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  filterKey: FilterCategoryId;
  filterValue: string;
}

export const THEME_ITEMS: ThemeItem[] = [
  {
    id: "contrarian",
    title: "역방향 코인",
    subtitle: "비트코인과 반대로 움직이는 코인",
    icon: "shuffle",
    iconColor: "#A855F7",
    filterKey: "beta",
    filterValue: "negative",
  },
  {
    id: "oversold",
    title: "과매도 구간",
    subtitle: "RSI 30 이하, 반등 가능성 높은 코인",
    icon: "download",
    iconColor: "#00B8D9",
    filterKey: "rsi",
    filterValue: "oversold",
  },
  {
    id: "volatile",
    title: "화끈한 변동성",
    subtitle: "위아래 움직임이 커서 단타에 딱!",
    icon: "activity",
    iconColor: "#FF4757",
    filterKey: "changeRate",
    filterValue: "custom:24h:10:up",
  },
  {
    id: "staking-yield",
    title: "쏠쏠한 이자 수익",
    subtitle: "보유만 해도 따박따박 이자가 나와요",
    icon: "dollar-sign",
    iconColor: "#F7931A",
    filterKey: "staking",
    filterValue: "yes",
  },
  {
    id: "lendable",
    title: "코인 대여 가능",
    subtitle: "코인을 빌려서 하락장에도 대비해요",
    icon: "repeat",
    iconColor: "#FFD93D",
    filterKey: "lending",
    filterValue: "yes",
  },
];

export const FILTER_CATEGORIES: FilterCategory[] = [
  {
    id: "marketCap",
    title: "시가총액",
    subtitle: "순위 또는 규모 기준으로 필터",
    options: [
      { id: "top5", label: "TOP 5", description: "1~5위" },
      { id: "top10", label: "TOP 10", description: "1~10위" },
      { id: "top20", label: "TOP 20", description: "1~20위" },
      { id: "top50", label: "TOP 50", description: "1~50위" },
      { id: "top100", label: "TOP 100", description: "1~100위" },
      { id: "mega", label: "100조 이상" },
      { id: "cap_50_100", label: "50조 ~ 100조" },
      { id: "cap_1_50", label: "1조 ~ 50조" },
      { id: "cap_5000_1t", label: "5000억 ~ 1조" },
      { id: "cap_1000_5000", label: "1000억 ~ 5000억" },
      { id: "cap_under_1000", label: "1000억 미만" },
    ],
  },
  {
    id: "circulatingRatio",
    title: "유통량 비율",
    subtitle: "전체 발행량 중 실제 유통 비율",
    options: [
      { id: "under30", label: "30% 이하", description: "유통량 적음 · 희소성 높음" },
      { id: "30to50", label: "30~50%", description: "중간 수준" },
      { id: "50to80", label: "50~80%", description: "대부분 유통 중" },
      { id: "over80", label: "80% 이상", description: "거의 전량 유통" },
    ],
  },
  {
    id: "changeRate",
    title: "등락률",
    subtitle: "기간별 가격 변동률",
    options: [],
  },
  {
    id: "athDrop",
    title: "고점 대비 하락률",
    subtitle: "최고가에서 얼마나 빠졌는지",
    options: [],
  },
  {
    id: "atlRise",
    title: "저점 대비 상승률",
    subtitle: "최저가에서 얼마나 올랐는지",
    options: [],
  },
  {
    id: "volume",
    title: "거래대금",
    subtitle: "거래 금액 규모 기준 필터",
    options: [
      { id: "top5", label: "Top 5" },
      { id: "top10", label: "Top 10" },
      { id: "top20", label: "Top 20" },
      { id: "top50", label: "Top 50" },
      { id: "top100", label: "Top 100" },
    ],
  },
  {
    id: "rvol",
    title: "상대 거래량",
    subtitle: "평균 대비 거래량이 얼마나 많은지",
    options: [
      { id: "rvol_200", label: "2배 이상", description: "관심 증가" },
      { id: "rvol_300", label: "3배 이상", description: "거래 급증" },
      { id: "rvol_500", label: "5배 이상", description: "거래 폭발" },
    ],
  },
  {
    id: "depositSurge",
    title: "거래소 입금",
    subtitle: "평소 대비 거래소 입금량 급등",
    options: [
      { id: "dep_300", label: "3배 이상" },
      { id: "dep_400", label: "4배 이상" },
      { id: "dep_500", label: "5배 이상" },
    ],
  },
  {
    id: "fewAccount",
    title: "소수 계정 거래 집중",
    subtitle: "소수 계정에 거래가 집중된 코인",
    options: [
      { id: "conc_50", label: "50% 이상" },
      { id: "conc_75", label: "75% 이상" },
      { id: "conc_90", label: "90% 이상" },
    ],
  },
  {
    id: "unrealizedPnl",
    title: "미실현 손익",
    subtitle: "수익 구간 보유자 비율 기준",
    options: [
      { id: "pnl_75", label: "수익 보유자 75% 이상" },
      { id: "pnl_50_75", label: "수익 보유자 50~75%" },
      { id: "pnl_25_50", label: "수익 보유자 25~50%" },
      { id: "pnl_25", label: "수익 보유자 25% 미만" },
    ],
  },
  {
    id: "maAlign",
    title: "이평선 배열",
    subtitle: "지금 상승 추세인지 하락 추세인지",
    options: [
      { id: "golden_5_20_60", label: "정배열", description: "5·20·60일" },
      { id: "death_5_20_60", label: "역배열", description: "5·20·60일" },
      { id: "golden_10_50_200", label: "정배열", description: "10·50·200일" },
      { id: "death_10_50_200", label: "역배열", description: "10·50·200일" },
    ],
  },
  {
    id: "maCross",
    title: "이평선 돌파",
    subtitle: "최근 골든크로스·데드크로스 발생",
    options: [
      { id: "golden", label: "골든크로스", description: "상승 전환" },
      { id: "death", label: "데드크로스", description: "하락 전환" },
    ],
  },
  {
    id: "newHighLow",
    title: "신고가/신저가",
    subtitle: "최근 최고가 또는 최저가를 갱신한 코인",
    options: [
      { id: "high_7", label: "신고가 7일" },
      { id: "high_30", label: "신고가 30일" },
      { id: "high_90", label: "신고가 90일" },
      { id: "low_7", label: "신저가 7일" },
      { id: "low_30", label: "신저가 30일" },
      { id: "low_90", label: "신저가 90일" },
    ],
  },
  {
    id: "streakUp",
    title: "연속 상승",
    subtitle: "가격이 연속으로 상승한 일수",
    options: [
      { id: "2", label: "2일 이상" },
      { id: "3", label: "3일 이상" },
      { id: "4", label: "4일 이상" },
      { id: "5", label: "5일 이상" },
    ],
  },
  {
    id: "streakDown",
    title: "연속 하락",
    subtitle: "가격이 연속으로 하락한 일수",
    options: [
      { id: "2", label: "2일 이상" },
      { id: "3", label: "3일 이상" },
      { id: "4", label: "4일 이상" },
      { id: "5", label: "5일 이상" },
    ],
  },
  {
    id: "category",
    title: "카테고리",
    subtitle: "프로젝트 유형 및 테마",
    options: [
      { id: "layer1", label: "레이어1", description: "자체 블록체인 메인넷" },
      { id: "layer2", label: "레이어2", description: "확장성 솔루션" },
      { id: "defi", label: "DeFi", description: "탈중앙 금융" },
      { id: "meme", label: "밈코인", description: "커뮤니티 기반" },
      { id: "ai", label: "AI", description: "인공지능 프로젝트" },
      { id: "rwa", label: "RWA", description: "실물자산 토큰화" },
      { id: "infra", label: "인프라", description: "DePIN / 인프라" },
      { id: "depin", label: "DePIN", description: "탈중앙 물리 인프라" },
    ],
  },
  {
    id: "staking",
    title: "스테이킹",
    subtitle: "보유 시 이자 수익 여부",
    options: [
      { id: "yes", label: "스테이킹 가능", description: "맡겨두면 이자 수익" },
      { id: "no", label: "스테이킹 불가", description: "이자 수익 없음" },
    ],
  },
  {
    id: "lending",
    title: "대여 가능",
    subtitle: "코인 대여 가능 여부",
    options: [
      { id: "yes", label: "대여 가능", description: "빌려주고 이자 수익" },
      { id: "no", label: "대여 불가", description: "대여 지원 안 됨" },
    ],
  },
  {
    id: "newListing",
    title: "신규 상장",
    subtitle: "상장 후 경과 기간 기준",
    options: [
      { id: "7d", label: "7일 이내", description: "최근 7일 내 상장" },
      { id: "14d", label: "14일 이내", description: "최근 14일 내 상장" },
      { id: "30d", label: "30일 이내", description: "최근 30일 내 상장" },
    ],
  },
  {
    id: "rsi",
    title: "RSI",
    subtitle: "최근 가격이 과열인지 침체인지",
    options: [
      { id: "oversold", label: "RSI 30 이하", description: "많이 빠짐" },
      { id: "neutral", label: "RSI 30~70", description: "보통" },
      { id: "overbought", label: "RSI 70 이상", description: "많이 오름" },
    ],
  },
  {
    id: "beta",
    title: "마켓 베타",
    subtitle: "BTC 대비 얼마나 같이 움직이지는지",
    options: [
      { id: "same_low", label: "BTC 절반 이하", description: "β < 0.5" },
      { id: "same_mid", label: "BTC 따라감", description: "β 0.9 ~ 1.1" },
      { id: "same_high", label: "BTC 1.5배 이상", description: "β > 1.5" },
      { id: "opp_low", label: "BTC 절반 이하", description: "β -0.5 ~ 0" },
      { id: "opp_mid", label: "BTC 따라감", description: "β -1.1 ~ -0.9" },
      { id: "opp_high", label: "BTC 1.5배 이상", description: "β < -1.5" },
    ],
  },
];

function parseVolume(v?: string): number {
  if (!v) return 0;
  const match = v.match(/([\d.]+)(조|억|만)?/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = match[2];
  if (unit === "조") return num * 10000;
  if (unit === "억") return num;
  if (unit === "만") return num / 10000;
  return num;
}

function parseMarketCap(v?: string): number {
  if (!v) return 0;
  const clean = v.replace(/,/g, "");
  const match = clean.match(/([\d.]+)(조|억|만)?/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = match[2];
  if (unit === "조") return num * 10000;
  if (unit === "억") return num;
  if (unit === "만") return num / 10000;
  return num;
}

export const ALL_COINS: CoinItem[] = [
  { id: "btc", name: "비트코인", symbol: "BTC", iconType: "mci", iconName: "bitcoin", iconColor: "#F7931A", change: 2.3, change1h: 0.4, price: "98,450,000", marketCap: "1,382조", rank: 1, changeWeek: 5.1, changeMonth: 12.8, volume24h: "32조", rVol: 1.2, category: "layer1", tags: ["layer1"], stakable: false, lendable: true, circulatingRatio: 93, athDrop: { all: 5, y1: 2, m6: 0, m3: 0, m1: 0 }, atlRise: { all: 98000, y1: 120, m6: 55, m3: 30, m1: 12 }, streak: 3, rsi: 58, beta: 1.0, maAlign: { "5_20_60": "golden", "10_50_200": "golden" }, maCross: [{ type: "golden", short: 5, long: 20, daysAgo: 5 }], newHighLow: { high: 3 }, depositSurge: 2.1, profitHolderPct: 82 },
  { id: "eth", name: "이더리움", symbol: "ETH", iconType: "mci", iconName: "ethereum", iconColor: "#627EEA", change: 1.8, change1h: 0.2, price: "4,520,000", marketCap: "488조", rank: 2, changeWeek: 3.9, changeMonth: 10.1, volume24h: "18조", rVol: 1.1, category: "layer1", tags: ["layer1", "layer2"], stakable: true, lendable: true, circulatingRatio: 100, athDrop: { all: 8, y1: 5, m6: 3, m3: 2, m1: 0 }, atlRise: { all: 5200, y1: 85, m6: 40, m3: 22, m1: 10 }, streak: 2, rsi: 52, beta: 0.85, maAlign: { "5_20_60": "golden", "10_50_200": "none" }, maCross: [{ type: "golden", short: 5, long: 20, daysAgo: 2 }], profitHolderPct: 68 },
  { id: "bnb", name: "바이낸스코인", symbol: "BNB", iconType: "feather", iconName: "hexagon", iconColor: "#F0B90B", change: 1.5, change1h: 0.1, price: "872,000", marketCap: "95조", rank: 3, changeWeek: 2.8, changeMonth: 8.4, volume24h: "3.2조", rVol: 0.9, category: "layer1", tags: ["layer1", "defi"], stakable: true, lendable: true, circulatingRatio: 82, athDrop: { all: 12, y1: 8, m6: 5, m3: 3 }, atlRise: { all: 8500, y1: 65, m6: 35, m3: 15 }, streak: 1, rsi: 48, beta: 0.65, maAlign: { "5_20_60": "none", "10_50_200": "golden" } },
  { id: "sol", name: "솔라나", symbol: "SOL", iconType: "feather", iconName: "zap", iconColor: "#00B8D9", change: 3.1, change1h: 0.8, price: "245,800", marketCap: "88조", rank: 4, changeWeek: 8.4, changeMonth: 22.5, volume24h: "8.5조", rVol: 2.1, category: "layer1", tags: ["layer1", "meme", "defi"], stakable: true, lendable: true, circulatingRatio: 75, athDrop: { all: 3, y1: 0, m6: 0, m3: 0, m1: 0 }, atlRise: { all: 24000, y1: 340, m6: 120, m3: 55, m1: 22 }, streak: 5, rsi: 72, beta: 1.35, maAlign: { "5_20_60": "golden", "10_50_200": "golden" }, maCross: [{ type: "golden", short: 5, long: 20, daysAgo: 1 }, { type: "golden", short: 20, long: 60, daysAgo: 8 }], newHighLow: { high: 1 }, depositSurge: 4.2, fewAccountConc: 35, profitHolderPct: 88 },
  { id: "xrp", name: "리플", symbol: "XRP", iconType: "feather", iconName: "send", iconColor: "#00AAE4", change: -0.8, change1h: -0.3, price: "852", marketCap: "42조", rank: 5, changeWeek: -2.1, changeMonth: 5.3, volume24h: "4.8조", rVol: 1.5, category: "layer1", tags: ["layer1", "rwa"], stakable: false, lendable: true, circulatingRatio: 56, athDrop: { all: 45, y1: 30, m6: 18, m3: 10 }, atlRise: { all: 280, y1: 50, m6: 25, m3: 12 }, streak: 0, downStreak: 3, rsi: 38, beta: 0.42, maAlign: { "5_20_60": "death", "10_50_200": "death" }, maCross: [{ type: "death", short: 5, long: 20, daysAgo: 3 }], newHighLow: { low: 5 }, depositSurge: 5.5, fewAccountConc: 82, profitHolderPct: 22 },
  { id: "doge", name: "도지코인", symbol: "DOGE", iconType: "feather", iconName: "circle", iconColor: "#C3A634", change: 4.1, change1h: 1.2, price: "425", marketCap: "22조", rank: 6, changeWeek: 6.2, changeMonth: -1.5, volume24h: "5.1조", rVol: 2.8, category: "meme", tags: ["meme"], stakable: false, lendable: true, circulatingRatio: 100, athDrop: { all: 42, y1: 35, m6: 20, m3: 8 }, atlRise: { all: 150000, y1: 200, m6: 80, m3: 30 }, streak: 1, rsi: 62, beta: 1.8, maAlign: { "5_20_60": "golden", "10_50_200": "none" } },
  { id: "link", name: "체인링크", symbol: "LINK", iconType: "feather", iconName: "link", iconColor: "#2A5ADA", change: 3.4, change1h: 0.5, price: "22,500", marketCap: "14조", rank: 7, changeWeek: 7.8, changeMonth: 15.2, volume24h: "1.8조", rVol: 1.4, category: "infra", tags: ["infra", "rwa", "defi"], stakable: true, lendable: true, circulatingRatio: 62, athDrop: { all: 55, y1: 20, m6: 10, m3: 5 }, atlRise: { all: 6300, y1: 180, m6: 85, m3: 35 }, streak: 3, rsi: 61, beta: 1.12, maAlign: { "5_20_60": "golden", "10_50_200": "golden" } },
  { id: "sui", name: "수이", symbol: "SUI", iconType: "feather", iconName: "droplet", iconColor: "#4DA2FF", change: 12.3, change1h: 3.1, price: "4,850", marketCap: "12조", rank: 8, changeWeek: 18.5, changeMonth: 42.1, volume24h: "6.2조", rVol: 4.5, category: "layer1", tags: ["layer1", "layer2", "defi"], stakable: true, lendable: false, listingDays: 6, circulatingRatio: 28, athDrop: { all: 2, y1: 0, m6: 0, m3: 0, m1: 0 }, atlRise: { all: 1200, y1: 450, m6: 180, m3: 85, m1: 42 }, streak: 4, rsi: 78, beta: 1.65, maAlign: { "5_20_60": "golden", "10_50_200": "golden" }, maCross: [{ type: "golden", short: 5, long: 20, daysAgo: 6 }], newHighLow: { high: 2 }, depositSurge: 3.8, fewAccountConc: 55, profitHolderPct: 76 },
  { id: "pepe", name: "페페", symbol: "PEPE", iconType: "feather", iconName: "smile", iconColor: "#3CB043", change: 8.5, change1h: 2.4, price: "0.015", marketCap: "6.3조", rank: 9, changeWeek: 15.2, changeMonth: 35.8, volume24h: "4.2조", rVol: 3.8, category: "meme", tags: ["meme"], stakable: false, lendable: false, circulatingRatio: 93, athDrop: { all: 18, y1: 10, m6: 5, m3: 2 }, atlRise: { all: 450000, y1: 800, m6: 350, m3: 120 }, streak: 3, rsi: 74, beta: 2.1, maAlign: { "5_20_60": "golden", "10_50_200": "none" }, maCross: [{ type: "golden", short: 5, long: 20, daysAgo: 4 }], newHighLow: { high: 6 }, depositSurge: 3.2, profitHolderPct: 42 },
  { id: "shib", name: "시바이누", symbol: "SHIB", iconType: "feather", iconName: "target", iconColor: "#FFA500", change: 5.2, change1h: 1.5, price: "0.038", marketCap: "5.8조", rank: 10, changeWeek: 8.1, changeMonth: 12.3, volume24h: "2.1조", rVol: 2.3, category: "meme", tags: ["meme"], stakable: false, lendable: false, circulatingRatio: 100, athDrop: { all: 58, y1: 40, m6: 25, m3: 12 }, atlRise: { all: 380000, y1: 150, m6: 60, m3: 25 }, streak: 2, rsi: 65, beta: 1.72 },
  { id: "uni", name: "유니스왑", symbol: "UNI", iconType: "feather", iconName: "repeat", iconColor: "#FF007A", change: 2.8, change1h: 0.3, price: "18,200", marketCap: "5.5조", rank: 11, changeWeek: 4.2, changeMonth: 9.8, volume24h: "1.2조", rVol: 1.0, category: "defi", tags: ["defi"], stakable: false, lendable: true, circulatingRatio: 60, athDrop: { all: 62, y1: 45, m6: 30, m3: 15 }, atlRise: { all: 530, y1: 80, m6: 35, m3: 18 }, streak: 2, rsi: 45, beta: 0.92 },
  { id: "aave", name: "에이브", symbol: "AAVE", iconType: "feather", iconName: "layers", iconColor: "#B6509E", change: 1.9, change1h: 0.1, price: "345,000", marketCap: "5.1조", rank: 12, changeWeek: 3.5, changeMonth: 11.2, volume24h: "850억", rVol: 0.8, category: "defi", tags: ["defi", "rwa"], stakable: true, lendable: true, circulatingRatio: 91, athDrop: { all: 48, y1: 30, m6: 18, m3: 8 }, atlRise: { all: 620, y1: 90, m6: 45, m3: 20 }, streak: 1, rsi: 50, beta: 0.78 },
  { id: "rndr", name: "렌더", symbol: "RNDR", iconType: "feather", iconName: "cpu", iconColor: "#E44C65", change: 9.4, change1h: 2.8, price: "12,800", marketCap: "4.9조", rank: 13, changeWeek: 15.2, changeMonth: 28.5, volume24h: "2.5조", rVol: 3.2, category: "ai", tags: ["ai"], stakable: false, lendable: true, circulatingRatio: 74, athDrop: { all: 15, y1: 5, m6: 2, m3: 0, m1: 0 }, atlRise: { all: 3200, y1: 250, m6: 110, m3: 55, m1: 28 }, streak: 4, rsi: 71, beta: 1.45 },
  { id: "apt", name: "앱토스", symbol: "APT", iconType: "feather", iconName: "box", iconColor: "#2DD8A3", change: 7.1, change1h: 1.8, price: "15,200", marketCap: "4.5조", rank: 14, changeWeek: 12.3, changeMonth: 18.9, volume24h: "1.8조", rVol: 2.0, category: "layer1", tags: ["layer1", "layer2"], stakable: true, lendable: true, circulatingRatio: 22, athDrop: { all: 25, y1: 15, m6: 8, m3: 3 }, atlRise: { all: 450, y1: 120, m6: 55, m3: 25 }, streak: 3, rsi: 67, beta: 1.18 },
  { id: "fet", name: "페치AI", symbol: "FET", iconType: "feather", iconName: "cpu", iconColor: "#1E1B4B", change: 11.2, change1h: 3.5, price: "3,250", marketCap: "3.8조", rank: 15, changeWeek: 22.1, changeMonth: 45.3, volume24h: "3.1조", rVol: 5.1, category: "ai", tags: ["ai"], stakable: true, lendable: false, listingDays: 13, circulatingRatio: 85, athDrop: { all: 8, y1: 3, m6: 0, m3: 0, m1: 0 }, atlRise: { all: 8500, y1: 380, m6: 150, m3: 75, m1: 45 }, streak: 6, rsi: 82, beta: 1.95 },
  { id: "arb", name: "아비트럼", symbol: "ARB", iconType: "feather", iconName: "wind", iconColor: "#28A0F0", change: 4.5, change1h: 0.9, price: "1,850", marketCap: "3.5조", rank: 16, changeWeek: 8.1, changeMonth: 14.2, volume24h: "1.5조", rVol: 1.7, category: "layer2", tags: ["layer2"], stakable: false, lendable: true, circulatingRatio: 35, athDrop: { all: 72, y1: 60, m6: 45, m3: 25 }, atlRise: { all: 85, y1: 30, m6: 15, m3: 8 }, streak: 2, rsi: 55, beta: 1.08 },
  { id: "mkr", name: "메이커", symbol: "MKR", iconType: "feather", iconName: "shield", iconColor: "#1AAB9B", change: -0.5, change1h: -0.1, price: "2,150,000", marketCap: "2.8조", rank: 17, changeWeek: -1.2, changeMonth: 3.5, volume24h: "420억", rVol: 0.6, category: "defi", tags: ["defi", "rwa"], stakable: false, lendable: false, circulatingRatio: 95, athDrop: { all: 38, y1: 22, m6: 12, m3: 5 }, atlRise: { all: 720, y1: 60, m6: 30, m3: 15 }, streak: 0, downStreak: 2, rsi: 28, beta: -0.15, maCross: [{ type: "death", short: 5, long: 20, daysAgo: 2 }], newHighLow: { low: 8 }, fewAccountConc: 92, profitHolderPct: 15 },
  { id: "ondo", name: "온도파이낸스", symbol: "ONDO", iconType: "feather", iconName: "briefcase", iconColor: "#1C64F2", change: 6.8, change1h: 1.9, price: "2,450", marketCap: "2.5조", rank: 18, changeWeek: 14.5, changeMonth: 32.1, volume24h: "2.8조", rVol: 3.5, category: "rwa", tags: ["rwa"], stakable: false, lendable: false, listingDays: 27, circulatingRatio: 15, athDrop: { all: 10, y1: 5, m6: 2, m3: 0 }, atlRise: { all: 1800, y1: 300, m6: 120, m3: 55 }, streak: 5, rsi: 73, beta: 0.35 },
  { id: "op", name: "옵티미즘", symbol: "OP", iconType: "feather", iconName: "sunrise", iconColor: "#FF0420", change: 3.2, change1h: 0.6, price: "3,120", marketCap: "2.2조", rank: 19, changeWeek: 5.8, changeMonth: 10.5, volume24h: "980억", rVol: 1.1, category: "layer2", tags: ["layer2"], stakable: false, lendable: true, circulatingRatio: 30, athDrop: { all: 65, y1: 50, m6: 35, m3: 18 }, atlRise: { all: 180, y1: 40, m6: 20, m3: 10 }, streak: 2, rsi: 42, beta: 1.22 },
  { id: "floki", name: "플로키", symbol: "FLOKI", iconType: "feather", iconName: "star", iconColor: "#E8A317", change: 6.7, change1h: 2.0, price: "0.28", marketCap: "1.8조", rank: 20, changeWeek: 12.8, changeMonth: 25.4, volume24h: "1.2조", rVol: 2.9, category: "meme", tags: ["meme"], stakable: false, lendable: false, circulatingRatio: 100, athDrop: { all: 35, y1: 20, m6: 10, m3: 5 }, atlRise: { all: 280000, y1: 400, m6: 180, m3: 65 }, streak: 3, rsi: 68, beta: 1.88 },
  { id: "akt", name: "아카시", symbol: "AKT", iconType: "feather", iconName: "cloud", iconColor: "#FF4444", change: 5.6, change1h: 1.3, price: "8,500", marketCap: "1.5조", rank: 21, changeWeek: 9.2, changeMonth: 18.7, volume24h: "650억", rVol: 2.4, category: "infra", tags: ["infra", "depin"], stakable: true, lendable: false, circulatingRatio: 68, athDrop: { all: 22, y1: 12, m6: 5, m3: 2 }, atlRise: { all: 4200, y1: 200, m6: 90, m3: 40 }, streak: 2, rsi: 25, beta: -0.3, maCross: [{ type: "death", short: 5, long: 20, daysAgo: 7 }], newHighLow: { low: 15 } },
  { id: "hnt", name: "헬륨", symbol: "HNT", iconType: "feather", iconName: "radio", iconColor: "#474DFF", change: 3.8, change1h: 0.7, price: "9,200", marketCap: "1.2조", rank: 22, changeWeek: 5.5, changeMonth: 8.9, volume24h: "280억", rVol: 1.3, category: "infra", tags: ["infra", "depin"], stakable: false, lendable: false, circulatingRatio: 78, athDrop: { all: 82, y1: 70, m6: 55, m3: 35 }, atlRise: { all: 45, y1: 15, m6: 8, m3: 3 }, streak: 1, rsi: 33, beta: 0.28 },
];

export function filterCoins(
  filters: Record<FilterCategoryId, string | null>,
  sourceCoins: CoinItem[] = ALL_COINS,
): CoinItem[] {
  const volumeRankById = new Map(
    [...sourceCoins]
      .sort((a, b) => parseVolume(b.volume24h) - parseVolume(a.volume24h))
      .map((coin, index) => [coin.id, index + 1]),
  );

  return sourceCoins.filter(coin => {
    if (filters.marketCap) {
      const f = filters.marketCap;
      if (f.startsWith("customRank:")) {
        const parts = f.replace("customRank:", "").split("-");
        const minR = parseInt(parts[0], 10);
        const maxR = parseInt(parts[1], 10);
        const r = coin.rank ?? 999;
        if (r < minR || r > maxR) return false;
      } else if (f.startsWith("customCap:")) {
        const parts = f.replace("customCap:", "").split("-");
        const minC = parseFloat(parts[0]);
        const maxC = parseFloat(parts[1]);
        const cap = parseMarketCap(coin.marketCap);
        const capInJo = cap / 10000;
        if (capInJo < minC || capInJo > maxC) return false;
      } else {
        const r = coin.rank ?? 999;
        if (f === "top5" && r > 5) return false;
        if (f === "top10" && r > 10) return false;
        if (f === "top20" && r > 20) return false;
        if (f === "top50" && r > 50) return false;
        if (f === "top100" && r > 100) return false;
        const cap = parseMarketCap(coin.marketCap);
        if (f === "mega" && cap < 1000000) return false;
        if (f === "cap_50_100" && (cap < 500000 || cap >= 1000000)) return false;
        if (f === "cap_1_50" && (cap < 10000 || cap >= 500000)) return false;
        if (f === "cap_5000_1t" && (cap < 5000 || cap >= 10000)) return false;
        if (f === "cap_1000_5000" && (cap < 1000 || cap >= 5000)) return false;
        if (f === "cap_under_1000" && cap >= 1000) return false;
      }
    }
    if (filters.changeRate) {
      const cr = filters.changeRate;
      if (cr.startsWith("custom:")) {
        const parts = cr.replace("custom:", "").split(":");
        const period = parts[0];
        let val = coin.change;
        if (period === "1h") val = coin.change1h ?? 0;
        else if (period === "7d") val = coin.changeWeek ?? 0;
        else if (period === "30d") val = coin.changeMonth ?? 0;
        if (parts.length === 4) {
          // range format: custom:period:min:max:dir
          const min = parseFloat(parts[1]);
          const max = parseFloat(parts[2]);
          const dir = parts[3];
          const absVal = Math.abs(val);
          if (dir === "up" && (val < 0 || absVal < min || absVal > max)) return false;
          if (dir === "down" && (val > 0 || absVal < min || absVal > max)) return false;
        } else {
          const pct = parseFloat(parts[1]);
          const dir = parts[2];
          if (dir === "up" && val < pct) return false;
          if (dir === "down" && val > -pct) return false;
        }
      }
    }
    if (filters.volume) {
      const vf = filters.volume;
      if (vf.startsWith("customVol:")) {
        const parts = vf.replace("customVol:", "").split("-");
        const minV = parseFloat(parts[0]);
        const maxV = parseFloat(parts[1]);
        const vol = parseVolume(coin.volume24h);
        if (vol < minV || vol > maxV) return false;
      } else if (vf.startsWith("customRank:")) {
        const parts = vf.replace("customRank:", "").split("-");
        const minR = parseInt(parts[0], 10);
        const maxR = parseInt(parts[1], 10);
        const volumeRank = volumeRankById.get(coin.id) ?? Number.MAX_SAFE_INTEGER;
        if (volumeRank < minR || volumeRank > maxR) return false;
      } else {
        const volumeRank = volumeRankById.get(coin.id) ?? Number.MAX_SAFE_INTEGER;
        if (vf === "top5" && volumeRank > 5) return false;
        if (vf === "top10" && volumeRank > 10) return false;
        if (vf === "top20" && volumeRank > 20) return false;
        if (vf === "top50" && volumeRank > 50) return false;
        if (vf === "top100" && volumeRank > 100) return false;
      }
    }
    if (filters.rvol) {
      const rf = filters.rvol;
      if (rf.startsWith("customRvol:")) {
        const raw = rf.replace("customRvol:", "");
        const parts = raw.split(":");
        const threshold = parseFloat(parts.length === 2 ? parts[1] : raw);
        if ((coin.rVol ?? 0) < threshold) return false;
      } else if (rf.startsWith("rvol_")) {
        const mult = parseInt(rf.replace("rvol_", ""), 10) / 100;
        if ((coin.rVol ?? 0) < mult) return false;
      }
    }
    if (filters.depositSurge) {
      const f = filters.depositSurge;
      const mult = parseInt(f.replace("dep_", ""), 10) / 100;
      if ((coin.depositSurge ?? 0) < mult) return false;
    }
    if (filters.fewAccount) {
      const f = filters.fewAccount;
      const pct = parseInt(f.replace("conc_", ""), 10);
      if ((coin.fewAccountConc ?? 0) < pct) return false;
    }
    if (filters.unrealizedPnl) {
      const f = filters.unrealizedPnl;
      const pct = coin.profitHolderPct ?? 0;
      if (f === "pnl_75" && pct < 75) return false;
      if (f === "pnl_50_75" && (pct < 50 || pct >= 75)) return false;
      if (f === "pnl_25_50" && (pct < 25 || pct >= 50)) return false;
      if (f === "pnl_25" && pct >= 25) return false;
    }
    if (filters.category) {
      const tags = coin.tags ?? [];
      if (!tags.includes(filters.category) && coin.category !== filters.category) return false;
    }
    if (filters.staking) {
      if (filters.staking === "yes" && !coin.stakable) return false;
      if (filters.staking === "no" && coin.stakable) return false;
    }
    if (filters.lending) {
      if (filters.lending === "yes" && !coin.lendable) return false;
      if (filters.lending === "no" && coin.lendable) return false;
    }
    if (filters.newListing) {
      const thresholdDays = filters.newListing === "7d" ? 7 : filters.newListing === "14d" ? 14 : 30;
      const listingDays = coin.listingDays ?? Number.POSITIVE_INFINITY;
      if (listingDays > thresholdDays) return false;
    }
    if (filters.circulatingRatio) {
      const cr = coin.circulatingRatio ?? 0;
      const f = filters.circulatingRatio;
      if (f === "under30" && cr > 30) return false;
      if (f === "30to50" && (cr < 30 || cr > 50)) return false;
      if (f === "50to80" && (cr < 50 || cr > 80)) return false;
      if (f === "over80" && cr < 80) return false;
    }
    if (filters.athDrop) {
      const f = filters.athDrop;
      if (f.startsWith("custom:")) {
        const parts = f.replace("custom:", "").split(":");
        const period = parts[0] as "all" | "y1" | "m6" | "m3" | "m1";
        const dropData = coin.athDrop;
        if (!dropData) return false;
        const val = dropData[period] ?? dropData.all;
        if (parts.length === 3) {
          // range format: custom:period:min:max
          const min = parseFloat(parts[1]);
          const max = parseFloat(parts[2]);
          if (val < min || val > max) return false;
        } else {
          const pct = parseFloat(parts[1]);
          const dir = parts[2];
          if (dir === "under" && val > pct) return false;
          if (dir === "over" && val < pct) return false;
        }
      }
    }
    if (filters.atlRise) {
      const f = filters.atlRise;
      if (f.startsWith("custom:")) {
        const parts = f.replace("custom:", "").split(":");
        const period = parts[0] as "all" | "y1" | "m6" | "m3" | "m1";
        const riseData = coin.atlRise;
        if (!riseData) return false;
        const val = riseData[period] ?? riseData.all;
        if (parts.length === 3) {
          const min = parseFloat(parts[1]);
          const max = parseFloat(parts[2]);
          if (val < min || val > max) return false;
        } else {
          const pct = parseFloat(parts[1]);
          const dir = parts[2];
          if (dir === "under" && val > pct) return false;
          if (dir === "over" && val < pct) return false;
        }
      }
    }
    if (filters.streakUp) {
      const minDays = parseInt(filters.streakUp, 10);
      if (isNaN(minDays) || (coin.streak ?? 0) < minDays) return false;
    }
    if (filters.streakDown) {
      const minDays = parseInt(filters.streakDown, 10);
      if (isNaN(minDays) || (coin.downStreak ?? 0) < minDays) return false;
    }
    if (filters.rsi) {
      const rsi = coin.rsi ?? 50;
      const f = filters.rsi;
      if (f.startsWith("custom:")) {
        const parts = f.replace("custom:", "").split(":");
        const min = parseFloat(parts[0]);
        const max = parseFloat(parts[1]);
        if (rsi < min || rsi > max) return false;
      } else {
        if (f === "oversold" && rsi > 30) return false;
        if (f === "neutral" && (rsi < 30 || rsi > 70)) return false;
        if (f === "overbought" && rsi < 70) return false;
      }
    }
    if (filters.beta) {
      const b = coin.beta ?? 1.0;
      const f = filters.beta;
      if (f.startsWith("custom:")) {
        const parts = f.replace("custom:", "").split(":");
        const min = parseFloat(parts[0]);
        const max = parseFloat(parts[1]);
        if (b < min || b > max) return false;
      } else {
        if (f === "negative" && b >= 0) return false;
        if (f === "same_low" && (b < 0 || b >= 0.5)) return false;
        if (f === "same_mid" && (b < 0.9 || b > 1.1)) return false;
        if (f === "same_high" && b < 1.5) return false;
        if (f === "opp_low" && (b > 0 || b < -0.5)) return false;
        if (f === "opp_mid" && (b < -1.1 || b > -0.9)) return false;
        if (f === "opp_high" && b > -1.5) return false;
      }
    }
    if (filters.maAlign) {
      const f = filters.maAlign;
      const ma = coin.maAlign;
      if (!ma) return false;
      // format: "golden_5_20_60" or "death_10_50_200"
      const parts = f.split("_");
      const dir = parts[0] as "golden" | "death";
      const key = parts.slice(1).join("_") as keyof NonNullable<typeof ma>;
      if (ma[key] !== dir) return false;
    }
    if (filters.maCross) {
      const f = filters.maCross;
      const crosses = coin.maCross;
      if (!crosses || crosses.length === 0) return false;
      // format: "golden_5_20_14" => type_short_long_withinDays
      const parts = f.split("_");
      const dir = parts[0] as "golden" | "death";
      const short = parseInt(parts[1], 10);
      const long = parseInt(parts[2], 10);
      const withinDays = parseInt(parts[3], 10);
      const match = crosses.some(c => c.type === dir && c.short === short && c.long === long && c.daysAgo <= withinDays);
      if (!match) return false;
    }
    if (filters.newHighLow) {
      const f = filters.newHighLow;
      const parts = f.split("_");
      const type = parts[0] as "high" | "low";
      const days = parseInt(parts[1], 10);
      const hl = coin.newHighLow;
      if (!hl) return false;
      const val = type === "high" ? hl.high : hl.low;
      if (val === undefined || val > days) return false;
    }
    return true;
  });
}

export const COIN_CATEGORIES: CoinCategory[] = [
  {
    id: "consecutive-rise",
    title: "연속 상승세",
    subtitle: "최근 꾸준히 오르고 있는 종목들",
    coins: ALL_COINS.filter(c => c.change > 0 && (c.changeWeek ?? 0) > 0 && (c.changeMonth ?? 0) > 0).sort((a, b) => (b.changeMonth ?? 0) - (a.changeMonth ?? 0)).slice(0, 3),
    filterKey: "streakUp",
    filterValue: "2",
  },
  {
    id: "volume-boom",
    title: "거래량 폭발",
    subtitle: "지금 돈이 가장 많이 몰리는 중",
    coins: ALL_COINS.sort((a, b) => parseVolume(b.volume24h) - parseVolume(a.volume24h)).slice(0, 3),
    filterKey: "volume",
    filterValue: "high",
  },
  {
    id: "net-buy-1pct",
    title: "급등 종목",
    subtitle: "24시간 내 가장 많이 오른 코인",
    coins: [...ALL_COINS].sort((a, b) => b.change - a.change).slice(0, 3),
    filterKey: "changeRate",
    filterValue: "custom:24h:5:up",
  },
  {
    id: "bluechip",
    title: "튼튼한 대장주",
    subtitle: "시가총액이 커서 믿을 수 있어요",
    coins: ALL_COINS.sort((a, b) => parseMarketCap(b.marketCap) - parseMarketCap(a.marketCap)).slice(0, 3),
    filterKey: "marketCap",
    filterValue: "top10",
  },
  {
    id: "smallcap",
    title: "주목할 소형주",
    subtitle: "시총은 작지만 최근 주목받는 중",
    coins: ALL_COINS.filter(c => parseMarketCap(c.marketCap) < 50000).sort((a, b) => b.change - a.change).slice(0, 3),
    filterKey: "marketCap",
    filterValue: "cap_under_1000",
  },
];
