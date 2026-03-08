import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CMC_LOGO_BY_SYMBOL as GENERATED_CMC_LOGO_BY_SYMBOL } from "@/lib/cmc-logo-static";

const STATIC_CMC_LOGO_BY_SYMBOL: Record<string, string> = {
  ...GENERATED_CMC_LOGO_BY_SYMBOL,
  // CMC v2 symbol is RENDER, while app data currently uses RNDR.
  RNDR: "https://s2.coinmarketcap.com/static/img/coins/64x64/5690.png",
};

const LOGO_CACHE_KEY = "cmc_logo_cache_v1";
const CMC_INFO_ENDPOINT = "https://pro-api.coinmarketcap.com/v2/cryptocurrency/info";
const CMC_CHUNK_SIZE = 80;
const logoBySymbol: Record<string, string> = { ...STATIC_CMC_LOGO_BY_SYMBOL };
const unresolvedSymbols = new Set<string>();
const listeners = new Set<() => void>();
const pendingSymbols = new Set<string>();
let cacheHydrated = false;
let cacheHydratingPromise: Promise<void> | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let isFetching = false;

function normalizeSymbol(symbol?: string | null): string | null {
  if (!symbol) return null;
  const upper = symbol.trim().toUpperCase();
  return upper.length > 0 ? upper : null;
}

function emitLogoUpdate() {
  listeners.forEach((listener) => listener());
}

async function hydrateCache() {
  if (cacheHydrated) return;
  if (cacheHydratingPromise) return cacheHydratingPromise;

  cacheHydratingPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(LOGO_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        logos?: Record<string, string>;
        unresolved?: string[];
      };
      if (parsed?.logos) {
        Object.entries(parsed.logos).forEach(([symbol, logo]) => {
          if (!symbol || !logo) return;
          logoBySymbol[symbol.toUpperCase()] = logo;
        });
      }
      if (Array.isArray(parsed?.unresolved)) {
        parsed.unresolved.forEach((symbol) => {
          const normalized = normalizeSymbol(symbol);
          if (normalized) unresolvedSymbols.add(normalized);
        });
      }
    } catch {
      // Ignore cache parsing/storage errors.
    } finally {
      cacheHydrated = true;
      cacheHydratingPromise = null;
      emitLogoUpdate();
    }
  })();

  return cacheHydratingPromise;
}

async function persistCache() {
  try {
    const dynamicEntries = Object.fromEntries(
      Object.entries(logoBySymbol).filter(([symbol, logo]) => {
        return !STATIC_CMC_LOGO_BY_SYMBOL[symbol] && !!logo;
      }),
    );
    await AsyncStorage.setItem(
      LOGO_CACHE_KEY,
      JSON.stringify({
        logos: dynamicEntries,
        unresolved: Array.from(unresolvedSymbols),
      }),
    );
  } catch {
    // Ignore cache write errors.
  }
}

async function fetchLogoChunk(symbols: string[]) {
  const apiKey = process.env.EXPO_PUBLIC_CMC_PRO_API_KEY;
  if (!apiKey || symbols.length === 0) return;

  const params = new URLSearchParams({
    symbol: symbols.join(","),
    skip_invalid: "true",
    aux: "logo",
  });
  const url = `${CMC_INFO_ENDPOINT}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-CMC_PRO_API_KEY": apiKey,
    },
  });
  if (!response.ok) return;

  const payload = await response.json();
  const data = payload?.data ?? {};
  const resolved = new Set<string>();

  Object.entries(data).forEach(([symbolKey, value]) => {
    const normalized = normalizeSymbol(symbolKey);
    if (!normalized) return;

    const candidates = Array.isArray(value) ? value : [value];
    const match = candidates.find((item) => typeof item?.logo === "string" && item.logo.length > 0);
    if (!match?.logo) return;

    logoBySymbol[normalized] = match.logo;
    unresolvedSymbols.delete(normalized);
    resolved.add(normalized);
  });

  symbols.forEach((symbol) => {
    if (!resolved.has(symbol) && !logoBySymbol[symbol]) {
      unresolvedSymbols.add(symbol);
    }
  });
}

async function flushPendingSymbols() {
  if (isFetching || pendingSymbols.size === 0) return;
  const apiKey = process.env.EXPO_PUBLIC_CMC_PRO_API_KEY;
  if (!apiKey) return;

  isFetching = true;
  const symbols = Array.from(pendingSymbols);
  pendingSymbols.clear();

  try {
    for (let i = 0; i < symbols.length; i += CMC_CHUNK_SIZE) {
      const chunk = symbols.slice(i, i + CMC_CHUNK_SIZE);
      await fetchLogoChunk(chunk);
    }
    await persistCache();
    emitLogoUpdate();
  } catch {
    // Keep fallbacks if network/API fails.
  } finally {
    isFetching = false;
    if (pendingSymbols.size > 0) {
      scheduleFetch();
    }
  }
}

function scheduleFetch() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushPendingSymbols();
  }, 120);
}

export function getCoinLogoUrl(symbol?: string | null): string | null {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return null;
  return logoBySymbol[normalized] ?? null;
}

export function ensureCoinLogos(symbols: Array<string | null | undefined>) {
  void hydrateCache();
  const apiKey = process.env.EXPO_PUBLIC_CMC_PRO_API_KEY;
  if (!apiKey) return;

  symbols.forEach((symbol) => {
    const normalized = normalizeSymbol(symbol);
    if (!normalized) return;
    if (logoBySymbol[normalized]) return;
    if (unresolvedSymbols.has(normalized)) return;
    pendingSymbols.add(normalized);
  });

  if (pendingSymbols.size > 0) {
    scheduleFetch();
  }
}

function subscribeLogoUpdates(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useCoinLogo(symbol?: string | null): string | null {
  const normalized = normalizeSymbol(symbol);
  const [logoUrl, setLogoUrl] = useState<string | null>(() => getCoinLogoUrl(normalized));

  useEffect(() => {
    setLogoUrl(getCoinLogoUrl(normalized));
    if (normalized) {
      ensureCoinLogos([normalized]);
    }
    const unsubscribe = subscribeLogoUpdates(() => {
      setLogoUrl(getCoinLogoUrl(normalized));
    });
    return unsubscribe;
  }, [normalized]);

  return logoUrl;
}

