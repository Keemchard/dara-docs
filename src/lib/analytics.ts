import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

export interface PageView {
  path: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  referer: string;
  country: string;
  city: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  uniqueVisitors: number;
  topPages: { path: string; count: number }[];
  recentVisitors: PageView[];
  viewsByDay: { date: string; count: number }[];
  topReferrers: { referer: string; count: number }[];
  topCountries: { country: string; count: number }[];
}

const VIEWS_KEY = "dara:pageviews";
const MAX_STORED = 5000;

export async function trackPageView(view: PageView): Promise<void> {
  const r = getRedis();
  if (!r) return;

  await r.lpush(VIEWS_KEY, JSON.stringify(view));
  await r.ltrim(VIEWS_KEY, 0, MAX_STORED - 1);
}

export async function getAnalytics(days = 30): Promise<AnalyticsSummary> {
  const r = getRedis();
  if (!r) {
    return {
      totalViews: 0,
      uniqueVisitors: 0,
      topPages: [],
      recentVisitors: [],
      viewsByDay: [],
      topReferrers: [],
      topCountries: [],
    };
  }

  const raw = await r.lrange(VIEWS_KEY, 0, MAX_STORED - 1);
  const views: PageView[] = raw.map((item) =>
    typeof item === "string" ? JSON.parse(item) : item as PageView
  );

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const filtered = views.filter((v) => new Date(v.timestamp) >= cutoff);

  const uniqueIps = new Set(filtered.map((v) => v.ip));

  const pageCounts = new Map<string, number>();
  for (const v of filtered) {
    pageCounts.set(v.path, (pageCounts.get(v.path) || 0) + 1);
  }
  const topPages = Array.from(pageCounts.entries())
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const dayCounts = new Map<string, number>();
  for (const v of filtered) {
    const day = v.timestamp.slice(0, 10);
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
  }
  const viewsByDay = Array.from(dayCounts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const refCounts = new Map<string, number>();
  for (const v of filtered) {
    if (v.referer && v.referer !== "direct") {
      try {
        const host = new URL(v.referer).hostname;
        refCounts.set(host, (refCounts.get(host) || 0) + 1);
      } catch {
        refCounts.set(v.referer, (refCounts.get(v.referer) || 0) + 1);
      }
    }
  }
  const topReferrers = Array.from(refCounts.entries())
    .map(([referer, count]) => ({ referer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const countryCounts = new Map<string, number>();
  for (const v of filtered) {
    const c = v.country || "Unknown";
    countryCounts.set(c, (countryCounts.get(c) || 0) + 1);
  }
  const topCountries = Array.from(countryCounts.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalViews: filtered.length,
    uniqueVisitors: uniqueIps.size,
    topPages,
    recentVisitors: filtered.slice(0, 50),
    viewsByDay,
    topReferrers,
    topCountries,
  };
}
