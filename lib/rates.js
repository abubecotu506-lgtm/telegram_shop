// ============================================================
//  نرخ لحظه‌ای دلار بازار آزاد، فقط برای نمایش کمکی در پنل.
//  قیمت هیچ محصولی با این نرخ تغییر نمی‌کند؛ قیمت محصولات دستی است.
// ============================================================
import { getSetting, setSetting } from './db.js';

export const RATE_SOURCE_NAME = 'نرخ‌سنج';
export const RATE_SOURCE_URL = 'https://nerkh.jahankhahan.shop/data/live.json';
export const RATE_REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const MIN_SOURCE_INTERVAL_MS = 60 * 1000;
const RATE_CACHE_SETTING = 'exchange_rate_cache';

export async function getCachedDollarRate(db) {
  const raw = await getSetting(db, RATE_CACHE_SETTING, '');
  if (!raw) return null;
  try {
    const cached = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const rate = Number(cached && cached.rate_toman);
    if (!Number.isSafeInteger(rate) || rate <= 0) return null;
    return {
      rate_toman: rate,
      fetched_at: String(cached.fetched_at || ''),
      market_date: String(cached.market_date || ''),
      market_time: String(cached.market_time || ''),
      source: String(cached.source || RATE_SOURCE_NAME),
      source_url: String(cached.source_url || RATE_SOURCE_URL),
    };
  } catch (e) {
    return null;
  }
}

function rateAgeMs(rate) {
  const fetchedAt = rate && Date.parse(rate.fetched_at);
  return Number.isFinite(fetchedAt) ? Math.max(0, Date.now() - fetchedAt) : Infinity;
}

// Prevent a manual refresh and a scheduled run in the same Worker isolate from
// making duplicate requests to the upstream source at the same time.
const RATE_REFRESH_IN_FLIGHT = new WeakMap();

export async function refreshDollarRate(env, db) {
  if (!db || (typeof db !== 'object' && typeof db !== 'function')) return refreshDollarRateImpl(env, db);
  const current = RATE_REFRESH_IN_FLIGHT.get(db);
  if (current) return current;
  const pending = refreshDollarRateImpl(env, db);
  RATE_REFRESH_IN_FLIGHT.set(db, pending);
  try {
    return await pending;
  } finally {
    if (RATE_REFRESH_IN_FLIGHT.get(db) === pending) RATE_REFRESH_IN_FLIGHT.delete(db);
  }
}

async function refreshDollarRateImpl(env, db) {
  const cached = await getCachedDollarRate(db);
  if (cached && rateAgeMs(cached) < MIN_SOURCE_INTERVAL_MS) {
    return { ok: true, rate: cached, cached: true };
  }
  let payload;
  try {
    const response = await fetch(RATE_SOURCE_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4500),
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    payload = await response.json();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('[Dollar rate] Source request failed:', detail.slice(0, 300));
    return { ok: false, error: 'دریافت نرخ از منبع بازار آزاد انجام نشد.' };
  }

  const rate = Number(payload && payload.rates && payload.rates.dollar);
  if (!Number.isFinite(rate) || !Number.isSafeInteger(Math.round(rate)) || rate < 1000 || rate > 100000000) {
    return { ok: false, error: 'ساختار یا مقدار نرخ دلار از منبع معتبر نبود.' };
  }

  const rateInfo = {
    rate_toman: Math.round(rate),
    fetched_at: new Date().toISOString(),
    market_date: String(payload.date || ''),
    market_time: String(payload.time || ''),
    source: RATE_SOURCE_NAME,
    source_url: RATE_SOURCE_URL,
  };
  try {
    await setSetting(db, RATE_CACHE_SETTING, JSON.stringify(rateInfo));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('[Dollar rate] D1 cache update failed:', detail.slice(0, 300));
    return { ok: false, error: 'ذخیرهٔ نرخ تازه در پایگاه داده انجام نشد.' };
  }
  return { ok: true, rate: rateInfo };
}

export async function ensureDollarRateFresh(env, db, force = false) {
  const cached = await getCachedDollarRate(db);
  if (!force && cached && rateAgeMs(cached) < RATE_REFRESH_INTERVAL_MS) {
    return { ok: true, rate: cached, cached: true };
  }
  const refreshed = await refreshDollarRate(env, db);
  if (refreshed.ok) return { ...refreshed, cached: false };
  // منبع ناموجود است: آخرین نرخ ثبت‌شده فقط برای نمایش نگه داشته می‌شود.
  return { ...refreshed, rate: cached, cached: !!cached };
}
