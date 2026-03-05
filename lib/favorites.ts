import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITE_MARKETS_KEY = "favorite_exchange_markets";

export async function getFavoriteMarkets(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITE_MARKETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item === "string");
  } catch {
    return [];
  }
}

export async function saveFavoriteMarkets(markets: string[]): Promise<void> {
  await AsyncStorage.setItem(FAVORITE_MARKETS_KEY, JSON.stringify(markets));
}

export async function toggleFavoriteMarket(market: string): Promise<string[]> {
  const current = await getFavoriteMarkets();
  const next = current.includes(market)
    ? current.filter((item) => item !== market)
    : [...current, market];
  await saveFavoriteMarkets(next);
  return next;
}

