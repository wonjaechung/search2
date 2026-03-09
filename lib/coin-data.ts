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
  /** 김치 프리미엄(%): 양수 = 국내가 글로벌보다 비쌈, 음수 = 국내가 더 쌈 */
  kimchiPremium?: number;
  /** 거래소 입금 압력(추정 지표): 양수면 입금/매도 압력, 음수면 출금/보유 성향 */
  exchangeInflow?: number;
  /** 미실현 손익(추정 지표, %): 양수면 이익 구간, 음수면 손실 구간 */
  unrealizedPnl?: number;
  /** 보유자 중 수익 구간 비율(%) */
  profitHolderRatio?: number;
  /** 소수 계정 거래 집중도(%): 상위 소수 계정의 거래 비중 */
  smallAccountConcentration?: number;
  /** 이동평균선(선택): 실제 값이 있으면 배열 판단에 우선 사용 */
  ma5?: number;
  ma20?: number;
  ma60?: number;
}

export type CoinCategoryType = "layer1" | "layer2" | "defi" | "meme" | "ai" | "gaming" | "rwa" | "infra";

export type FilterCategoryId = "marketCap" | "changeRate" | "volume" | "rvol" | "category" | "staking" | "lending" | "newListing" | "circulatingRatio" | "athDrop" | "atlRise" | "streakUp" | "streakDown" | "newHigh" | "newLow" | "maCross" | "maArray" | "rsi" | "beta" | "kimchiPremium" | "exchangeInflow" | "smallAccountConcentration" | "unrealizedPnl";

export interface FilterGroup {
  id: string;
  title: string;
  icon: string;
  categories: FilterCategoryId[];
}

export const FILTER_GROUPS: FilterGroup[] = [
  { id: "basic", title: "기본", icon: "info", categories: ["category", "marketCap", "circulatingRatio", "kimchiPremium", "staking", "lending"] },
  { id: "supply", title: "수급", icon: "bar-chart-2", categories: ["volume", "exchangeInflow", "smallAccountConcentration", "unrealizedPnl", "newListing"] },
  { id: "price", title: "가격", icon: "trending-up", categories: ["changeRate", "streakUp", "streakDown", "newHigh", "newLow", "athDrop", "atlRise"] },
  { id: "technical", title: "기술", icon: "activity", categories: ["rvol", "maCross", "maArray", "rsi", "beta"] },
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
      { id: "mega", label: "100조 이상", description: "BTC, ETH 등 초대형" },
      { id: "large", label: "10조 ~ 100조", description: "대형 코인" },
      { id: "mid", label: "1조 ~ 10조", description: "중형 코인" },
      { id: "small", label: "1조 미만", description: "소형 코인" },
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
      { id: "high", label: "거래 상위 10개", description: "가장 돈이 많이 몰린 종목" },
      { id: "mid", label: "거래 상위 11~50개", description: "중간 거래량 구간" },
      { id: "low", label: "거래 51위 이하", description: "상대적으로 거래 적음" },
    ],
  },
  {
    id: "exchangeInflow",
    title: "거래소 입금",
    subtitle: "최근 3일 입금량 급증 기준 필터",
    options: [
      { id: "inflow_caution", label: "주의 신호 (입금량 300%+)", description: "최근 3일 입금량이 평소 대비 3배 이상 급증" },
      { id: "inflow_warning", label: "경고 신호 (입금량 400%+)", description: "최근 3일 입금량이 평소 대비 4배 이상 급증" },
      { id: "inflow_risk", label: "위험 신호 (입금량 500%+)", description: "최근 3일 입금량이 평소 대비 5배 이상 급증" },
    ],
  },
  {
    id: "unrealizedPnl",
    title: "미실현 손익",
    subtitle: "보유자 수익 비율(%) 기준 구간",
    options: [
      { id: "profit80", label: "수익 보유자 80% 이상", description: "대다수 보유자가 수익 구간" },
      { id: "profit60", label: "수익 보유자 60~80%", description: "수익 보유자가 우세한 구간" },
      { id: "breakeven", label: "수익 보유자 40~60%", description: "손익분기(중립) 구간" },
      { id: "loss40", label: "수익 보유자 40% 미만", description: "손실 보유자가 우세한 구간" },
    ],
  },
  {
    id: "smallAccountConcentration",
    title: "소수 계정 거래 집중",
    subtitle: "최근 24시간 소수 계정 거래 비중 기준 필터",
    options: [
      { id: "sac_caution", label: "주의 신호 (집중도 50%+)", description: "소수 계정 거래 비중 50% 이상" },
      { id: "sac_warning", label: "경고 신호 (집중도 75%+)", description: "소수 계정 거래 비중 75% 이상" },
      { id: "sac_risk", label: "위험 신호 (집중도 90%+)", description: "소수 계정 거래 비중 90% 이상" },
    ],
  },
  {
    id: "rvol",
    title: "상대 거래량 (RVOL)",
    subtitle: "평균 거래량 대비 증가 배수",
    options: [
      { id: "rvol_200", label: "RVOL 2배 이상", description: "평소 대비 거래량 폭발" },
      { id: "rvol_300", label: "RVOL 3배 이상", description: "평소 대비 초과 거래" },
      { id: "rvol_500", label: "RVOL 5배 이상", description: "이상 급등 거래량" },
    ],
  },
  {
    id: "maCross",
    title: "이동평균선 돌파",
    subtitle: "단기선이 장기선을 돌파하는 추세 전환 신호",
    options: [
      { id: "gc", label: "골든크로스", description: "5일선이 20일선을 상향 돌파" },
      { id: "dc", label: "데드크로스", description: "5일선이 20일선을 하향 돌파" },
    ],
  },
  {
    id: "maArray",
    title: "이동평균선 배열",
    subtitle: "단기·중기·장기 이평선 정렬 상태",
    options: [
      { id: "arr_bull", label: "정배열", description: "5일선 > 20일선 > 60일선" },
      { id: "arr_bear", label: "역배열", description: "5일선 < 20일선 < 60일선" },
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
    id: "newHigh",
    title: "신고가",
    subtitle: "최근 일정 기간 내 고점 돌파 기준",
    options: [
      { id: "4w", label: "4주 신고가", description: "최근 4주 기준 고점 돌파" },
      { id: "12w", label: "12주 신고가", description: "최근 12주 기준 고점 돌파" },
      { id: "52w", label: "52주 신고가", description: "최근 52주 기준 고점 돌파" },
    ],
  },
  {
    id: "newLow",
    title: "신저가",
    subtitle: "최근 일정 기간 내 저점 이탈 기준",
    options: [
      { id: "4w", label: "4주 신저가", description: "최근 4주 기준 저점 이탈" },
      { id: "12w", label: "12주 신저가", description: "최근 12주 기준 저점 이탈" },
      { id: "52w", label: "52주 신저가", description: "최근 52주 기준 저점 이탈" },
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
    title: "코인 대여",
    subtitle: "코인 대여 가능 여부",
    options: [
      { id: "yes", label: "대여 가능", description: "빌려주고 이자 수익" },
      { id: "no", label: "대여 불가", description: "대여 지원 안 됨" },
    ],
  },
  {
    id: "kimchiPremium",
    title: "김치 프리미엄",
    subtitle: "글로벌 시세차이",
    options: [
      { id: "premium", label: "김프 종목 (0% 이상)", description: "국내가 해외보다 비싼 종목" },
      { id: "discount", label: "역프 종목 (0% 미만)", description: "국내가 해외보다 싼 종목" },
      { id: "premium_high", label: "김프 과열 (3% 이상)", description: "평균보다 프리미엄이 크게 낀 종목" },
      { id: "neutral", label: "시세 비슷 (-0.5~0.5%)", description: "국내·해외 시세 차이가 거의 없음" },
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
    subtitle: "과매수·과매도 구간 확인",
    options: [
      { id: "oversold", label: "과매도 (30 이하)", description: "반등 가능성 높은 구간" },
      { id: "weak", label: "약세 (30~50)", description: "매수세가 약한 구간" },
      { id: "neutral", label: "중립 (40~60)", description: "방향성 탐색 중" },
      { id: "strong", label: "강세 (50~70)", description: "매수세가 강한 구간" },
      { id: "overbought", label: "과매수 (70 이상)", description: "조정 가능성 있는 구간" },
    ],
  },
  {
    id: "beta",
    title: "마켓 베타",
    subtitle: "비트코인 대비 변동성 크기",
    options: [
      { id: "same_mid", label: "유사 (0.8 ~ 1.2)", description: "BTC와 거의 같은 폭" },
      { id: "same_high", label: "고변동 (2.0 이상)", description: "BTC 오르면 2배 이상 오름" },
      { id: "opp_mid", label: "유사 (-1.2 ~ -0.8)", description: "BTC와 거의 같은 폭" },
      { id: "opp_high", label: "고변동 (-2.0 이하)", description: "BTC 오르면 2배 이상 내림" },
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
  { id: "btc", name: "비트코인", symbol: "BTC", iconType: "mci", iconName: "bitcoin", iconColor: "#F7931A", change: 2.3, change1h: 0.4, price: "98,450,000", marketCap: "1,382조", rank: 1, changeWeek: 5.1, changeMonth: 12.8, volume24h: "32조", rVol: 1.2, category: "layer1", tags: ["layer1"], stakable: false, lendable: true, circulatingRatio: 93, athDrop: { all: 5, y1: 2, m6: 0, m3: 0, m1: 0 }, atlRise: { all: 98000, y1: 120, m6: 55, m3: 30, m1: 12 }, streak: 3, rsi: 58, beta: 1.0 },
  { id: "eth", name: "이더리움", symbol: "ETH", iconType: "mci", iconName: "ethereum", iconColor: "#627EEA", change: 1.8, change1h: 0.2, price: "4,520,000", marketCap: "488조", rank: 2, changeWeek: 3.9, changeMonth: 10.1, volume24h: "18조", rVol: 1.1, category: "layer1", tags: ["layer1", "layer2"], stakable: true, lendable: true, circulatingRatio: 100, athDrop: { all: 8, y1: 5, m6: 3, m3: 2, m1: 0 }, atlRise: { all: 5200, y1: 85, m6: 40, m3: 22, m1: 10 }, streak: 2, rsi: 52, beta: 0.85 },
  { id: "bnb", name: "바이낸스코인", symbol: "BNB", iconType: "feather", iconName: "hexagon", iconColor: "#F0B90B", change: 1.5, change1h: 0.1, price: "872,000", marketCap: "95조", rank: 3, changeWeek: 2.8, changeMonth: 8.4, volume24h: "3.2조", rVol: 0.9, category: "layer1", tags: ["layer1", "defi"], stakable: true, lendable: true, circulatingRatio: 82, athDrop: { all: 12, y1: 8, m6: 5, m3: 3 }, atlRise: { all: 8500, y1: 65, m6: 35, m3: 15 }, streak: 1, rsi: 48, beta: 0.65 },
  { id: "sol", name: "솔라나", symbol: "SOL", iconType: "feather", iconName: "zap", iconColor: "#00B8D9", change: 3.1, change1h: 0.8, price: "245,800", marketCap: "88조", rank: 4, changeWeek: 8.4, changeMonth: 22.5, volume24h: "8.5조", rVol: 2.1, category: "layer1", tags: ["layer1", "meme", "defi"], stakable: true, lendable: true, circulatingRatio: 75, athDrop: { all: 3, y1: 0, m6: 0, m3: 0, m1: 0 }, atlRise: { all: 24000, y1: 340, m6: 120, m3: 55, m1: 22 }, streak: 5, rsi: 72, beta: 1.35 },
  { id: "xrp", name: "리플", symbol: "XRP", iconType: "feather", iconName: "send", iconColor: "#00AAE4", change: -0.8, change1h: -0.3, price: "852", marketCap: "42조", rank: 5, changeWeek: -2.1, changeMonth: 5.3, volume24h: "4.8조", rVol: 1.5, category: "layer1", tags: ["layer1", "rwa"], stakable: false, lendable: true, circulatingRatio: 56, athDrop: { all: 45, y1: 30, m6: 18, m3: 10 }, atlRise: { all: 280, y1: 50, m6: 25, m3: 12 }, streak: 0, downStreak: 3, rsi: 38, beta: 0.42 },
  { id: "doge", name: "도지코인", symbol: "DOGE", iconType: "feather", iconName: "circle", iconColor: "#C3A634", change: 4.1, change1h: 1.2, price: "425", marketCap: "22조", rank: 6, changeWeek: 6.2, changeMonth: -1.5, volume24h: "5.1조", rVol: 2.8, category: "meme", tags: ["meme"], stakable: false, lendable: true, circulatingRatio: 100, athDrop: { all: 42, y1: 35, m6: 20, m3: 8 }, atlRise: { all: 150000, y1: 200, m6: 80, m3: 30 }, streak: 1, rsi: 62, beta: 1.8 },
  { id: "link", name: "체인링크", symbol: "LINK", iconType: "feather", iconName: "link", iconColor: "#2A5ADA", change: 3.4, change1h: 0.5, price: "22,500", marketCap: "14조", rank: 7, changeWeek: 7.8, changeMonth: 15.2, volume24h: "1.8조", rVol: 1.4, category: "infra", tags: ["infra", "rwa", "defi"], stakable: true, lendable: true, circulatingRatio: 62, athDrop: { all: 55, y1: 20, m6: 10, m3: 5 }, atlRise: { all: 6300, y1: 180, m6: 85, m3: 35 }, streak: 3, rsi: 61, beta: 1.12 },
  { id: "sui", name: "수이", symbol: "SUI", iconType: "feather", iconName: "droplet", iconColor: "#4DA2FF", change: 12.3, change1h: 3.1, price: "4,850", marketCap: "12조", rank: 8, changeWeek: 18.5, changeMonth: 42.1, volume24h: "6.2조", rVol: 4.5, category: "layer1", tags: ["layer1", "layer2", "defi"], stakable: true, lendable: false, listingDays: 6, circulatingRatio: 28, athDrop: { all: 2, y1: 0, m6: 0, m3: 0, m1: 0 }, atlRise: { all: 1200, y1: 450, m6: 180, m3: 85, m1: 42 }, streak: 4, rsi: 78, beta: 1.65 },
  { id: "pepe", name: "페페", symbol: "PEPE", iconType: "feather", iconName: "smile", iconColor: "#3CB043", change: 8.5, change1h: 2.4, price: "0.015", marketCap: "6.3조", rank: 9, changeWeek: 15.2, changeMonth: 35.8, volume24h: "4.2조", rVol: 3.8, category: "meme", tags: ["meme"], stakable: false, lendable: false, circulatingRatio: 93, athDrop: { all: 18, y1: 10, m6: 5, m3: 2 }, atlRise: { all: 450000, y1: 800, m6: 350, m3: 120 }, streak: 3, rsi: 74, beta: 2.1 },
  { id: "shib", name: "시바이누", symbol: "SHIB", iconType: "feather", iconName: "target", iconColor: "#FFA500", change: 5.2, change1h: 1.5, price: "0.038", marketCap: "5.8조", rank: 10, changeWeek: 8.1, changeMonth: 12.3, volume24h: "2.1조", rVol: 2.3, category: "meme", tags: ["meme"], stakable: false, lendable: false, circulatingRatio: 100, athDrop: { all: 58, y1: 40, m6: 25, m3: 12 }, atlRise: { all: 380000, y1: 150, m6: 60, m3: 25 }, streak: 2, rsi: 65, beta: 1.72 },
  { id: "uni", name: "유니스왑", symbol: "UNI", iconType: "feather", iconName: "repeat", iconColor: "#FF007A", change: 2.8, change1h: 0.3, price: "18,200", marketCap: "5.5조", rank: 11, changeWeek: 4.2, changeMonth: 9.8, volume24h: "1.2조", rVol: 1.0, category: "defi", tags: ["defi"], stakable: false, lendable: true, circulatingRatio: 60, athDrop: { all: 62, y1: 45, m6: 30, m3: 15 }, atlRise: { all: 530, y1: 80, m6: 35, m3: 18 }, streak: 2, rsi: 45, beta: 0.92 },
  { id: "aave", name: "에이브", symbol: "AAVE", iconType: "feather", iconName: "layers", iconColor: "#B6509E", change: 1.9, change1h: 0.1, price: "345,000", marketCap: "5.1조", rank: 12, changeWeek: 3.5, changeMonth: 11.2, volume24h: "850억", rVol: 0.8, category: "defi", tags: ["defi", "rwa"], stakable: true, lendable: true, circulatingRatio: 91, athDrop: { all: 48, y1: 30, m6: 18, m3: 8 }, atlRise: { all: 620, y1: 90, m6: 45, m3: 20 }, streak: 1, rsi: 50, beta: 0.78 },
  { id: "rndr", name: "렌더", symbol: "RNDR", iconType: "feather", iconName: "cpu", iconColor: "#E44C65", change: 9.4, change1h: 2.8, price: "12,800", marketCap: "4.9조", rank: 13, changeWeek: 15.2, changeMonth: 28.5, volume24h: "2.5조", rVol: 3.2, category: "ai", tags: ["ai"], stakable: false, lendable: true, circulatingRatio: 74, athDrop: { all: 15, y1: 5, m6: 2, m3: 0, m1: 0 }, atlRise: { all: 3200, y1: 250, m6: 110, m3: 55, m1: 28 }, streak: 4, rsi: 71, beta: 1.45 },
  { id: "apt", name: "앱토스", symbol: "APT", iconType: "feather", iconName: "box", iconColor: "#2DD8A3", change: 7.1, change1h: 1.8, price: "15,200", marketCap: "4.5조", rank: 14, changeWeek: 12.3, changeMonth: 18.9, volume24h: "1.8조", rVol: 2.0, category: "layer1", tags: ["layer1", "layer2"], stakable: true, lendable: true, circulatingRatio: 22, athDrop: { all: 25, y1: 15, m6: 8, m3: 3 }, atlRise: { all: 450, y1: 120, m6: 55, m3: 25 }, streak: 3, rsi: 67, beta: 1.18 },
  { id: "fet", name: "페치AI", symbol: "FET", iconType: "feather", iconName: "cpu", iconColor: "#1E1B4B", change: 11.2, change1h: 3.5, price: "3,250", marketCap: "3.8조", rank: 15, changeWeek: 22.1, changeMonth: 45.3, volume24h: "3.1조", rVol: 5.1, category: "ai", tags: ["ai"], stakable: true, lendable: false, listingDays: 13, circulatingRatio: 85, athDrop: { all: 8, y1: 3, m6: 0, m3: 0, m1: 0 }, atlRise: { all: 8500, y1: 380, m6: 150, m3: 75, m1: 45 }, streak: 6, rsi: 82, beta: 1.95 },
  { id: "arb", name: "아비트럼", symbol: "ARB", iconType: "feather", iconName: "wind", iconColor: "#28A0F0", change: 4.5, change1h: 0.9, price: "1,850", marketCap: "3.5조", rank: 16, changeWeek: 8.1, changeMonth: 14.2, volume24h: "1.5조", rVol: 1.7, category: "layer2", tags: ["layer2"], stakable: false, lendable: true, circulatingRatio: 35, athDrop: { all: 72, y1: 60, m6: 45, m3: 25 }, atlRise: { all: 85, y1: 30, m6: 15, m3: 8 }, streak: 2, rsi: 55, beta: 1.08 },
  { id: "mkr", name: "메이커", symbol: "MKR", iconType: "feather", iconName: "shield", iconColor: "#1AAB9B", change: -0.5, change1h: -0.1, price: "2,150,000", marketCap: "2.8조", rank: 17, changeWeek: -1.2, changeMonth: 3.5, volume24h: "420억", rVol: 0.6, category: "defi", tags: ["defi", "rwa"], stakable: false, lendable: false, circulatingRatio: 95, athDrop: { all: 38, y1: 22, m6: 12, m3: 5 }, atlRise: { all: 720, y1: 60, m6: 30, m3: 15 }, streak: 0, downStreak: 2, rsi: 28, beta: -0.15 },
  { id: "ondo", name: "온도파이낸스", symbol: "ONDO", iconType: "feather", iconName: "briefcase", iconColor: "#1C64F2", change: 6.8, change1h: 1.9, price: "2,450", marketCap: "2.5조", rank: 18, changeWeek: 14.5, changeMonth: 32.1, volume24h: "2.8조", rVol: 3.5, category: "rwa", tags: ["rwa"], stakable: false, lendable: false, listingDays: 27, circulatingRatio: 15, athDrop: { all: 10, y1: 5, m6: 2, m3: 0 }, atlRise: { all: 1800, y1: 300, m6: 120, m3: 55 }, streak: 5, rsi: 73, beta: 0.35 },
  { id: "op", name: "옵티미즘", symbol: "OP", iconType: "feather", iconName: "sunrise", iconColor: "#FF0420", change: 3.2, change1h: 0.6, price: "3,120", marketCap: "2.2조", rank: 19, changeWeek: 5.8, changeMonth: 10.5, volume24h: "980억", rVol: 1.1, category: "layer2", tags: ["layer2"], stakable: false, lendable: true, circulatingRatio: 30, athDrop: { all: 65, y1: 50, m6: 35, m3: 18 }, atlRise: { all: 180, y1: 40, m6: 20, m3: 10 }, streak: 2, rsi: 42, beta: 1.22 },
  { id: "floki", name: "플로키", symbol: "FLOKI", iconType: "feather", iconName: "star", iconColor: "#E8A317", change: 6.7, change1h: 2.0, price: "0.28", marketCap: "1.8조", rank: 20, changeWeek: 12.8, changeMonth: 25.4, volume24h: "1.2조", rVol: 2.9, category: "meme", tags: ["meme"], stakable: false, lendable: false, circulatingRatio: 100, athDrop: { all: 35, y1: 20, m6: 10, m3: 5 }, atlRise: { all: 280000, y1: 400, m6: 180, m3: 65 }, streak: 3, rsi: 68, beta: 1.88 },
  { id: "akt", name: "아카시", symbol: "AKT", iconType: "feather", iconName: "cloud", iconColor: "#FF4444", change: 5.6, change1h: 1.3, price: "8,500", marketCap: "1.5조", rank: 21, changeWeek: 9.2, changeMonth: 18.7, volume24h: "650억", rVol: 2.4, category: "infra", tags: ["infra", "depin"], stakable: true, lendable: false, circulatingRatio: 68, athDrop: { all: 22, y1: 12, m6: 5, m3: 2 }, atlRise: { all: 4200, y1: 200, m6: 90, m3: 40 }, streak: 2, rsi: 25, beta: -0.3 },
  { id: "hnt", name: "헬륨", symbol: "HNT", iconType: "feather", iconName: "radio", iconColor: "#474DFF", change: 3.8, change1h: 0.7, price: "9,200", marketCap: "1.2조", rank: 22, changeWeek: 5.5, changeMonth: 8.9, volume24h: "280억", rVol: 1.3, category: "infra", tags: ["infra", "depin"], stakable: false, lendable: false, circulatingRatio: 78, athDrop: { all: 82, y1: 70, m6: 55, m3: 35 }, atlRise: { all: 45, y1: 15, m6: 8, m3: 3 }, streak: 1, rsi: 33, beta: 0.28 },
];

export function filterCoins(
  filters: Record<FilterCategoryId, string | null>,
  sourceCoins: CoinItem[] = ALL_COINS,
): CoinItem[] {
  const kimchiPremiumAvg = sourceCoins.length > 0
    ? sourceCoins.reduce((sum, coin) => sum + (coin.kimchiPremium ?? 0), 0) / sourceCoins.length
    : 0;
  const estimateExchangeInflow = (coin: CoinItem): number => {
    if (typeof coin.exchangeInflow === "number") return coin.exchangeInflow;
    const weekly = coin.changeWeek ?? coin.change ?? 0;
    const rvol = coin.rVol ?? 1;
    return (-weekly * 0.6) + ((rvol - 1) * 2);
  };
  const estimateUnrealizedPnl = (coin: CoinItem): number => {
    if (typeof coin.unrealizedPnl === "number") return coin.unrealizedPnl;
    const monthly = coin.changeMonth ?? coin.change ?? 0;
    const athBonus = (coin.athDrop?.all ?? 50) < 15 ? 8 : 0;
    const rsiPenalty = (coin.rsi ?? 50) < 35 ? 8 : 0;
    return monthly + athBonus - rsiPenalty;
  };
  const estimateExchangeInflowSpikePct = (coin: CoinItem): number => {
    const explicit = coin.exchangeInflow;
    if (typeof explicit === "number") {
      // If large enough, treat as already-percent value.
      if (explicit >= 20) return Math.max(0, explicit);
      return Math.max(0, explicit * 100);
    }
    const score = estimateExchangeInflow(coin);
    return Math.max(0, score * 100);
  };
  const estimateProfitHolderRatio = (coin: CoinItem): number => {
    if (typeof coin.profitHolderRatio === "number") return Math.max(0, Math.min(100, coin.profitHolderRatio));
    const pnl = estimateUnrealizedPnl(coin);
    const ratio = 50 + (pnl * 2); // pnl 1% ~= 수익 보유자 2%p로 근사
    return Math.max(0, Math.min(100, ratio));
  };
  const estimateSmallAccountConcentration = (coin: CoinItem): number => {
    if (typeof coin.smallAccountConcentration === "number") {
      return Math.max(0, Math.min(100, coin.smallAccountConcentration));
    }
    const rvol = coin.rVol ?? 1;
    const cap = parseMarketCap(coin.marketCap);
    const capFactor = cap > 0 ? Math.max(0, Math.min(1, 1 - (Math.log10(cap + 1) / 7))) : 0.4;
    const base = 35 + ((rvol - 1) * 12) + (capFactor * 20);
    return Math.max(5, Math.min(98, base));
  };
  const parseMaCrossFilter = (value: string): {
    short: number;
    long: number;
    withinDays: number;
    direction: "up" | "down";
  } | null => {
    // New format: macross:5:20:1:up|down
    if (value.startsWith("macross:")) {
      const parts = value.replace("macross:", "").split(":");
      if (parts.length < 4) return null;
      const short = parseInt(parts[0], 10);
      const long = parseInt(parts[1], 10);
      const withinDays = parseInt(parts[2], 10);
      const direction = parts[3] === "down" ? "down" : "up";
      if (![short, long, withinDays].every(Number.isFinite)) return null;
      return { short, long, withinDays, direction };
    }
    // Backward compatibility: ma:short:mid:long:within:bull|bear
    if (value.startsWith("ma:")) {
      const parts = value.replace("ma:", "").split(":");
      if (parts.length < 5) return null;
      const short = parseInt(parts[0], 10);
      const long = parseInt(parts[2], 10);
      const withinDays = parseInt(parts[3], 10);
      const direction = parts[4] === "bear" ? "down" : "up";
      if (![short, long, withinDays].every(Number.isFinite)) return null;
      return { short, long, withinDays, direction };
    }
    return null;
  };
  const estimateMaCrossSignal = (
    coin: CoinItem,
    short: number,
    long: number,
    withinDays: number,
  ): "up" | "down" | "none" => {
    if (coin.ma5 && coin.ma20 && short === 5 && long === 20) {
      if (coin.ma5 > coin.ma20) return "up";
      if (coin.ma5 < coin.ma20) return "down";
      return "none";
    }
    const c1d = coin.change ?? 0;
    const c7d = coin.changeWeek ?? c1d;
    const up = coin.streak ?? 0;
    const down = coin.downStreak ?? 0;
    const recentBias = (c1d * 0.8) + (c7d * 0.5) + (up * 0.9) - (down * 0.9);
    const gapFactor = Math.max(1, (long - short) / 10);
    const threshold = withinDays <= 1 ? 2.8 * gapFactor : withinDays <= 3 ? 2.2 * gapFactor : 1.6 * gapFactor;
    if (recentBias >= threshold) return "up";
    if (recentBias <= -threshold) return "down";
    return "none";
  };
  const estimateMaArraySignal = (coin: CoinItem): "bull" | "bear" | "mixed" => {
    if (coin.ma5 && coin.ma20 && coin.ma60) {
      if (coin.ma5 > coin.ma20 && coin.ma20 > coin.ma60) return "bull";
      if (coin.ma5 < coin.ma20 && coin.ma20 < coin.ma60) return "bear";
      return "mixed";
    }
    const c1d = coin.change ?? 0;
    const c7d = coin.changeWeek ?? c1d;
    const c30d = coin.changeMonth ?? c7d;
    const up = coin.streak ?? 0;
    const down = coin.downStreak ?? 0;
    const score = (c1d * 0.8) + (c7d * 0.9) + (c30d * 0.25) + (up * 1.2) - (down * 1.2);
    if (score >= 6) return "bull";
    if (score <= -6) return "bear";
    return "mixed";
  };
  const parseLookbackWeeks = (value: string): number | null => {
    if (value === "4w") return 4;
    if (value === "12w") return 12;
    if (value === "52w") return 52;
    if (value.startsWith("scan:")) {
      const parts = value.replace("scan:", "").split(":");
      const weeks = parseInt(parts[1], 10);
      return Number.isFinite(weeks) ? weeks : null;
    }
    return null;
  };
  const isNearRecentHigh = (coin: CoinItem, weeks: number): boolean => {
    const drop = weeks >= 52
      ? (coin.athDrop?.y1 ?? coin.athDrop?.all ?? 100)
      : weeks >= 12
        ? (coin.athDrop?.m3 ?? coin.athDrop?.all ?? 100)
        : (coin.athDrop?.m1 ?? coin.athDrop?.all ?? 100);
    const momentum = (coin.changeWeek ?? coin.change ?? 0) > 0;
    return drop <= 3 && momentum;
  };
  const isNearRecentLow = (coin: CoinItem, weeks: number): boolean => {
    const rise = weeks >= 52
      ? (coin.atlRise?.y1 ?? coin.atlRise?.all ?? 999999)
      : weeks >= 12
        ? (coin.atlRise?.m3 ?? coin.atlRise?.all ?? 999999)
        : (coin.atlRise?.m1 ?? coin.atlRise?.all ?? 999999);
    const weakness = (coin.changeWeek ?? coin.change ?? 0) < 0;
    return rise <= 30 && weakness;
  };
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
        if (f === "large" && (cap < 100000 || cap >= 1000000)) return false;
        if (f === "mid" && (cap < 10000 || cap >= 100000)) return false;
        if (f === "small" && cap >= 10000) return false;
      }
    }
    if (filters.changeRate) {
      const cr = filters.changeRate;
      if (cr.startsWith("custom:")) {
        const parts = cr.replace("custom:", "").split(":");
        const period = parts[0];
        const pct = parseFloat(parts[1]);
        const dir = parts[2];
        let val = coin.change;
        if (period === "1h") val = coin.change1h ?? 0;
        else if (period === "7d") val = coin.changeWeek ?? 0;
        else if (period === "30d") val = coin.changeMonth ?? 0;
        if (dir === "up" && val < pct) return false;
        if (dir === "down" && val > -pct) return false;
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
      } else {
        const volumeRank = volumeRankById.get(coin.id) ?? Number.MAX_SAFE_INTEGER;
        if (vf === "high" && volumeRank > 10) return false;
        if (vf === "mid" && (volumeRank <= 10 || volumeRank > 50)) return false;
        if (vf === "low" && volumeRank <= 50) return false;
      }
    }
    if (filters.exchangeInflow) {
      const spikePct = estimateExchangeInflowSpikePct(coin);
      const f = filters.exchangeInflow;
      // Align with warning table thresholds: 300% / 400% / 500%+
      if (f === "inflow_caution" && spikePct < 300) return false;
      if (f === "inflow_warning" && spikePct < 400) return false;
      if (f === "inflow_risk" && spikePct < 500) return false;
      // Backward compatibility for previously saved values.
      if (f === "inflow_strong" && spikePct < 300) return false;
      if (f === "inflow_mid" && (spikePct < 300 || spikePct >= 400)) return false;
      if (f === "inflow_neutral" && spikePct >= 300) return false;
      if (f === "outflow" && spikePct >= 50) return false;
    }
    if (filters.smallAccountConcentration) {
      const ratio = estimateSmallAccountConcentration(coin);
      const f = filters.smallAccountConcentration;
      if (f === "sac_caution" && ratio < 50) return false;
      if (f === "sac_warning" && ratio < 75) return false;
      if (f === "sac_risk" && ratio < 90) return false;
    }
    if (filters.unrealizedPnl) {
      const profitRatio = estimateProfitHolderRatio(coin);
      const f = filters.unrealizedPnl;
      if (f === "profit80" && profitRatio < 80) return false;
      if (f === "profit60" && (profitRatio < 60 || profitRatio >= 80)) return false;
      if (f === "breakeven" && (profitRatio < 40 || profitRatio > 60)) return false;
      if (f === "loss40" && profitRatio >= 40) return false;
      // Backward compatibility for previously saved filters.
      if (f === "profit_high" && profitRatio < 80) return false;
      if (f === "profit_mid" && (profitRatio < 60 || profitRatio >= 80)) return false;
      if (f === "loss_zone" && profitRatio >= 40) return false;
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
    const maCrossValue = filters.maCross ?? (
      filters.maArray && (filters.maArray.startsWith("macross:") || filters.maArray.startsWith("ma:"))
        ? filters.maArray
        : null
    );
    if (maCrossValue) {
      const parsed = parseMaCrossFilter(maCrossValue);
      if (!parsed) return false;
      if (!(parsed.short < parsed.long)) return false;
      const dir = estimateMaCrossSignal(coin, parsed.short, parsed.long, parsed.withinDays);
      if (parsed.direction === "up" && dir !== "up") return false;
      if (parsed.direction === "down" && dir !== "down") return false;
    }
    if (filters.maArray && !filters.maArray.startsWith("macross:") && !filters.maArray.startsWith("ma:")) {
      const arr = estimateMaArraySignal(coin);
      if (filters.maArray === "arr_bull" && arr !== "bull") return false;
      if (filters.maArray === "arr_bear" && arr !== "bear") return false;
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
    if (filters.kimchiPremium) {
      const kp = coin.kimchiPremium ?? 0;
      const f = filters.kimchiPremium;
      if (f.startsWith("custom:")) {
        const parts = f.replace("custom:", "").split(":");
        const minP = parseFloat(parts[0]);
        const maxP = parseFloat(parts[1]);
        if (!Number.isFinite(minP) || !Number.isFinite(maxP) || kp < minP || kp > maxP) return false;
      } else if (f.startsWith("usdtDiff:")) {
        const parts = f.replace("usdtDiff:", "").split(":");
        const pct = parseFloat(parts[0]);
        const dir = parts[1]; // "high" | "low"
        const usdtVal = parts.length >= 4 ? parseFloat(parts[3]) : kimchiPremiumAvg;
        if (dir === "high" && kp < usdtVal + pct) return false;
        if (dir === "low" && kp > usdtVal - pct) return false;
      } else {
        if (f === "premium_high" && kp < 3) return false;
        if (f === "premium" && (kp < 0 || kp > 3)) return false;
        if (f === "neutral" && (kp < -0.5 || kp > 0.5)) return false;
        if (f === "discount" && kp >= 0) return false;
      }
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
        const pct = parseFloat(parts[1]);
        const dir = parts[2];
        const dropData = coin.athDrop;
        if (!dropData) return false;
        const val = dropData[period] ?? dropData.all;
        if (dir === "under" && val > pct) return false;
        if (dir === "over" && val < pct) return false;
      }
    }
    if (filters.atlRise) {
      const f = filters.atlRise;
      if (f.startsWith("custom:")) {
        const parts = f.replace("custom:", "").split(":");
        const period = parts[0] as "all" | "y1" | "m6" | "m3" | "m1";
        const pct = parseFloat(parts[1]);
        const dir = parts[2];
        const riseData = coin.atlRise;
        if (!riseData) return false;
        const val = riseData[period] ?? riseData.all;
        if (dir === "under" && val > pct) return false;
        if (dir === "over" && val < pct) return false;
      }
    }
    if (filters.streakUp) {
      const raw = filters.streakUp;
      const minDays = raw.startsWith("streakWin:") ? parseInt(raw.split(":")[2], 10) : parseInt(raw, 10);
      if (isNaN(minDays) || (coin.streak ?? 0) < minDays) return false;
    }
    if (filters.streakDown) {
      const raw = filters.streakDown;
      const minDays = raw.startsWith("streakWin:") ? parseInt(raw.split(":")[2], 10) : parseInt(raw, 10);
      if (isNaN(minDays) || (coin.downStreak ?? 0) < minDays) return false;
    }
    if (filters.newHigh) {
      const weeks = parseLookbackWeeks(filters.newHigh);
      if (!weeks || !isNearRecentHigh(coin, weeks)) return false;
    }
    if (filters.newLow) {
      const weeks = parseLookbackWeeks(filters.newLow);
      if (!weeks || !isNearRecentLow(coin, weeks)) return false;
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
        if (f === "weak" && (rsi < 30 || rsi > 50)) return false;
        if (f === "neutral" && (rsi < 40 || rsi > 60)) return false;
        if (f === "strong" && (rsi < 50 || rsi > 70)) return false;
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
        if (f === "same_mid" && (b < 0.8 || b > 1.2)) return false;
        if (f === "same_high" && b < 2.0) return false;
        if (f === "opp_mid" && (b < -1.2 || b > -0.8)) return false;
        if (f === "opp_high" && b > -2.0) return false;
      }
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
    filterValue: "small",
  },
];
