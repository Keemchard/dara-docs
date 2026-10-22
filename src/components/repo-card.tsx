"use client";

import Link from "next/link";
import type { EnrichedProject } from "@/lib/gitlab";
import { TimeAgo } from "./time-ago";

const TYPE_STYLES: Record<string, string> = {
  Frontend: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  Backend: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Fullstack: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  Mobile: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Other: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const LANG_DOT_COLORS: Record<string, string> = {
  TypeScript: "bg-[#3178c6]",
  JavaScript: "bg-[#f1e05a]",
  Python: "bg-[#3572A5]",
  PHP: "bg-[#4F5D95]",
  Dart: "bg-[#00B4AB]",
  Java: "bg-[#b07219]",
  Go: "bg-[#00ADD8]",
  Kotlin: "bg-[#A97BFF]",
  Swift: "bg-[#F05138]",
  CSS: "bg-[#563d7c]",
  HTML: "bg-[#e34c26]",
  Shell: "bg-[#89e051]",
  Dockerfile: "bg-[#384d54]",
  Vue: "bg-[#41b883]",
  SCSS: "bg-[#c6538c]",
  Ruby: "bg-[#701516]",
  Rust: "bg-[#dea584]",
};

export function RepoCard({ data }: { data: EnrichedProject }) {
  const { project, languages, contributors, type } = data;
  const slug = project.path;
  const displayName = project.name.replace(/-/g, " ");

  const topLangs = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const topContributors = contributors.slice(0, 3);

  return (
    <Link
      href={`/repo/${slug}?id=${project.id}`}
      className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-700"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold capitalize text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
          {displayName}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[type]}`}
        >
          {type}
        </span>
      </div>

      {project.description && (
        <p className="mb-3 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
          {project.description}
        </p>
      )}

      {topLangs.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Tech Stack
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topLangs.map(([lang, pct]) => (
              <span
                key={lang}
                className="inline-flex items-center gap-1 rounded-md bg-zinc-50 px-1.5 py-0.5 text-xs text-zinc-600 ring-1 ring-zinc-200/80 dark:bg-zinc-800/50 dark:text-zinc-400 dark:ring-zinc-700/80"
              >
                <span
                  className={`inline-block h-2 w-2 rounded-full ${LANG_DOT_COLORS[lang] || "bg-zinc-400"}`}
                />
                {lang}
                <span className="text-zinc-400 dark:text-zinc-500">
                  {pct.toFixed(0)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {topContributors.length > 0 && (
        <div className="mb-2">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Contributors
          </p>
          <div className="flex items-center gap-1.5">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {topContributors.map((c) => (
                <span
                  key={c.email}
                  className="text-xs text-zinc-600 dark:text-zinc-400"
                >
                  {c.name}
                  <span className="ml-1 text-zinc-400 dark:text-zinc-500">
                    ({c.commits})
                  </span>
                </span>
              ))}
            </div>
            {contributors.length > 3 && (
              <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                +{contributors.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
        <div className="flex items-center gap-1.5">
          {topLangs.length > 0 && (
            <div className="flex h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              {topLangs.map(([lang, pct]) => (
                <div
                  key={lang}
                  className={LANG_DOT_COLORS[lang] || "bg-zinc-400"}
                  style={{ width: `${pct}%` }}
                />
              ))}
            </div>
          )}
        </div>
        <TimeAgo
          date={project.last_activity_at}
          className="text-xs text-zinc-400 dark:text-zinc-500"
        />
      </div>
    </Link>
  );
}
