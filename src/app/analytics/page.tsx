import { Suspense } from "react";
import { getAnalytics } from "@/lib/analytics";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";

async function AnalyticsContent() {
  const data = await getAnalytics(30);
  return <AnalyticsDashboard data={data} />;
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AnalyticsContent />
    </Suspense>
  );
}
