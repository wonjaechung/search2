export interface ExchangeCoin {
  id: string;
  market: string;
  quoteCurrency: "KRW" | "BTC";
  name: string;
  symbol: string;
  price: number;
  priceFormatted: string;
  changePercent: number;
  volume: string;
  accTradePrice24h: number;
  tags?: string[];
  category: string[];
}

type BithumbMarket = {
  market: string;
  korean_name: string;
  english_name: string;
};

type BithumbTicker = {
  market: string;
  trade_price: number;
  signed_change_rate: number;
  acc_trade_price_24h: number;
};

function formatPrice(quote: "KRW" | "BTC", price: number): string {
  if (quote === "KRW") {
    if (!Number.isFinite(price)) return "0";
    if (price >= 100) return Math.round(price).toLocaleString("ko-KR");
    if (price >= 10) return price.toFixed(2);
    if (price >= 1) return price.toFixed(3);
    return price.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  }
  return price.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

function formatVolumeKrw(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  const millions = Math.round(value / 1_000_000);
  return `${millions.toLocaleString("ko-KR")}백만`;
}

function formatVolumeBtc(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 BTC";
  return `${value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")} BTC`;
}

function toExchangeCoin(marketInfo: BithumbMarket, ticker: BithumbTicker): ExchangeCoin | null {
  const [quote, base] = marketInfo.market.split("-");
  if (quote !== "KRW" && quote !== "BTC") return null;

  const quoteCurrency = quote as "KRW" | "BTC";
  const changePercent = (ticker.signed_change_rate ?? 0) * 100;
  const accTradePrice24h = ticker.acc_trade_price_24h ?? 0;
  const majorSymbols = new Set(["BTC", "ETH", "XRP", "SOL", "ADA", "DOGE", "TRX", "AVAX", "LINK", "DOT"]);

  return {
    id: `${quote}-${base}`.toLowerCase(),
    market: marketInfo.market,
    quoteCurrency,
    name: marketInfo.korean_name || base,
    symbol: base,
    price: ticker.trade_price ?? 0,
    priceFormatted: formatPrice(quoteCurrency, ticker.trade_price ?? 0),
    changePercent,
    volume: quoteCurrency === "KRW" ? formatVolumeKrw(accTradePrice24h) : formatVolumeBtc(accTradePrice24h),
    accTradePrice24h,
    category: [
      "all",
      ...(changePercent > 0 ? ["rising"] : []),
      ...(majorSymbols.has(base) ? ["major"] : []),
    ],
  };
}

async function fetchTickersChunk(markets: string[]): Promise<BithumbTicker[]> {
  if (markets.length === 0) return [];
  const url = `https://api.bithumb.com/v1/ticker?markets=${markets.join(",")}`;
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`ticker fetch failed: ${response.status}`);
  return response.json();
}

let bithumbCoinsCache: ExchangeCoin[] | null = null;
let bithumbCoinsPromise: Promise<ExchangeCoin[]> | null = null;

export async function loadBithumbExchangeCoins(): Promise<ExchangeCoin[]> {
  if (bithumbCoinsCache) return bithumbCoinsCache;
  if (bithumbCoinsPromise) return bithumbCoinsPromise;

  bithumbCoinsPromise = (async () => {
    try {
      const marketRes = await fetch("https://api.bithumb.com/v1/market/all?isDetails=false", {
        headers: { accept: "application/json" },
      });
      if (!marketRes.ok) throw new Error(`market fetch failed: ${marketRes.status}`);
      const allMarkets = (await marketRes.json()) as BithumbMarket[];

      const targetMarkets = allMarkets.filter((m) => m.market.startsWith("KRW-") || m.market.startsWith("BTC-"));
      const tickers: BithumbTicker[] = [];
      const chunkSize = 80;

      for (let i = 0; i < targetMarkets.length; i += chunkSize) {
        const chunk = targetMarkets.slice(i, i + chunkSize).map((m) => m.market);
        const part = await fetchTickersChunk(chunk);
        tickers.push(...part);
      }

      const tickerMap = new Map(tickers.map((t) => [t.market, t]));
      const coins = targetMarkets
        .map((m) => {
          const ticker = tickerMap.get(m.market);
          if (!ticker) return null;
          return toExchangeCoin(m, ticker);
        })
        .filter(Boolean) as ExchangeCoin[];

      bithumbCoinsCache = coins.sort((a, b) => b.accTradePrice24h - a.accTradePrice24h);
      return bithumbCoinsCache;
    } catch {
      return EXCHANGE_COINS;
    } finally {
      bithumbCoinsPromise = null;
    }
  })();

  return bithumbCoinsPromise;
}

export const EXCHANGE_COINS: ExchangeCoin[] = [
  {
    id: "krw-btc",
    market: "KRW-BTC",
    quoteCurrency: "KRW",
    name: "비트코인",
    symbol: "BTC",
    price: 105_751_000,
    priceFormatted: "105,751,000",
    changePercent: 1.31,
    volume: "1,890억",
    accTradePrice24h: 189_061_523_542,
    category: ["all", "major", "rising"],
  },
  {
    id: "krw-eth",
    market: "KRW-ETH",
    quoteCurrency: "KRW",
    name: "이더리움",
    symbol: "ETH",
    price: 4_120_000,
    priceFormatted: "4,120,000",
    changePercent: 0.88,
    volume: "820억",
    accTradePrice24h: 82_000_000_000,
    category: ["all", "major", "rising"],
  },
  {
    id: "krw-sol",
    market: "KRW-SOL",
    quoteCurrency: "KRW",
    name: "솔라나",
    symbol: "SOL",
    price: 120_700,
    priceFormatted: "120,700",
    changePercent: 0.42,
    volume: "264억",
    accTradePrice24h: 26_460_000_000,
    category: ["all", "major", "rising"],
  },
  {
    id: "btc-eth",
    market: "BTC-ETH",
    quoteCurrency: "BTC",
    name: "이더리움",
    symbol: "ETH",
    price: 0.03923841,
    priceFormatted: "0.03923841",
    changePercent: -0.18,
    volume: "187 BTC",
    accTradePrice24h: 187,
    category: ["all", "major"],
  },
];

export type ExchangeSubTab = "krw" | "btc" | "owned" | "favorites";
export type ExchangeFilter = "all" | "rising" | "major" | "minus_fee" | "sell_fee";

export const EXCHANGE_SUB_TABS: { key: ExchangeSubTab; label: string }[] = [
  { key: "krw", label: "원화" },
  { key: "btc", label: "BTC" },
  { key: "owned", label: "보유" },
  { key: "favorites", label: "관심" },
];

export const EXCHANGE_FILTERS: { key: ExchangeFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "rising", label: "상승신호" },
  { key: "major", label: "메이저" },
  { key: "minus_fee", label: "마이너스 수수료" },
  { key: "sell_fee", label: "매도수수료" },
];
