"use client";

import Link from "next/link";
import { useState } from "react";
import type { AnalyticsSummary, PageView } from "@/lib/analytics";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>
      )}
    </div>
  );
}

function BarChart({
  data,
  labelKey,
  valueKey,
  maxBars = 10,
}: {
  data: Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
  maxBars?: number;
}) {
  const items = data.slice(0, maxBars);
  const max = Math.max(...items.map((d) => d[valueKey] as number), 1);

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const val = item[valueKey] as number;
        const pct = (val / max) * 100;
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate text-xs text-zinc-600 dark:text-zinc-400">
              {item[labelKey] as string}
            </span>
            <div className="flex-1">
              <div className="h-5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <span className="w-10 shrink-0 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {val}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MiniChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex h-24 items-end gap-0.5">
      {data.map((d) => (
        <div
          key={d.date}
          className="group relative flex-1"
          title={`${d.date}: ${d.count} views`}
        >
          <div
            className="w-full rounded-t bg-indigo-500 transition-colors group-hover:bg-indigo-400"
            style={{
              height: `${Math.max((d.count / max) * 100, 2)}%`,
              minHeight: 2,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function parseUA(ua: string): string {
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("curl")) return "curl";
  if (ua.includes("bot") || ua.includes("Bot")) return "Bot";
  return "Other";
}

function VisitorRow({ view }: { view: PageView }) {
  const time = new Date(view.timestamp).toLocaleString();
  const browser = parseUA(view.userAgent);
  const location = [view.city, view.country].filter(Boolean).join(", ") || "Unknown";

  return (
    <tr className="border-t border-zinc-100 dark:border-zinc-800">
      <td className="py-2.5 pr-3 text-xs text-zinc-600 dark:text-zinc-400">
        {time}
      </td>
      <td className="py-2.5 pr-3">
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {view.path}
        </code>
      </td>
      <td className="py-2.5 pr-3 text-xs text-zinc-500 dark:text-zinc-400">
        {view.ip}
      </td>
      <td className="py-2.5 pr-3 text-xs text-zinc-500 dark:text-zinc-400">
        {location}
      </td>
      <td className="py-2.5 text-xs text-zinc-500 dark:text-zinc-400">
        {browser}
      </td>
    </tr>
  );
}

export function AnalyticsDashboard({ data }: { data: AnalyticsSummary }) {
  const [visitorLimit, setVisitorLimit] = useState(20);
  const isEmpty = data.totalViews === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Last 30 days
          </p>
        </div>
      </div>

      {isEmpty ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-lg font-medium text-zinc-600 dark:text-zinc-400">
            No analytics data yet
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            Data will appear here once visitors start browsing the site.
            Make sure <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">UPSTASH_REDIS_REST_URL</code> and{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">UPSTASH_REDIS_REST_TOKEN</code> are set.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Total Page Views"
              value={data.totalViews.toLocaleString()}
              sub="Last 30 days"
            />
            <StatCard
              label="Unique Visitors"
              value={data.uniqueVisitors.toLocaleString()}
              sub="By IP address"
            />
            <StatCard
              label="Avg Views / Day"
              value={
                data.viewsByDay.length > 0
                  ? Math.round(data.totalViews / data.viewsByDay.length)
                  : 0
              }
            />
          </div>

          <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Views Over Time
            </h3>
            <MiniChart data={data.viewsByDay} />
            <div className="mt-2 flex justify-between text-[10px] text-zinc-400">
              <span>{data.viewsByDay[0]?.date}</span>
              <span>{data.viewsByDay[data.viewsByDay.length - 1]?.date}</span>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Top Pages
              </h3>
              <BarChart data={data.topPages} labelKey="path" valueKey="count" />
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Top Countries
              </h3>
              {data.topCountries.length > 0 ? (
                <BarChart
                  data={data.topCountries}
                  labelKey="country"
                  valueKey="count"
                />
              ) : (
                <p className="py-4 text-center text-xs text-zinc-400">
                  Country data available on Vercel
                </p>
              )}
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Top Referrers
              </h3>
              {data.topReferrers.length > 0 ? (
                <BarChart
                  data={data.topReferrers}
                  labelKey="referer"
                  valueKey="count"
                />
              ) : (
                <p className="py-4 text-center text-xs text-zinc-400">
                  No external referrers yet
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Recent Visitors
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    <th className="pb-2 pr-3">Time</th>
                    <th className="pb-2 pr-3">Page</th>
                    <th className="pb-2 pr-3">IP</th>
                    <th className="pb-2 pr-3">Location</th>
                    <th className="pb-2">Browser</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentVisitors
                    .slice(0, visitorLimit)
                    .map((view, i) => (
                      <VisitorRow key={i} view={view} />
                    ))}
                </tbody>
              </table>
            </div>
            {data.recentVisitors.length > visitorLimit && (
              <button
                onClick={() => setVisitorLimit((l) => l + 20)}
                className="mt-3 w-full rounded-lg border border-zinc-200 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Show more
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
