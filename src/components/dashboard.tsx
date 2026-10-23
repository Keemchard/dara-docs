"use client";

import { useState, useMemo } from "react";
import type { EnrichedProject } from "@/lib/gitlab";
import { RepoCard } from "./repo-card";

const TYPE_FILTERS = ["All", "Frontend", "Backend", "Fullstack", "Mobile"] as const;

export function Dashboard({
  enrichedProjects,
}: {
  enrichedProjects: EnrichedProject[];
}) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeContributor, setActiveContributor] = useState("All");

  const allContributors = useMemo(() => {
    const map = new Map<string, number>();
    for (const ep of enrichedProjects) {
      for (const c of ep.contributors) {
        map.set(c.name, (map.get(c.name) || 0) + c.commits);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [enrichedProjects]);

  const filtered = useMemo(() => {
    return enrichedProjects.filter((ep) => {
      const matchesSearch =
        !search ||
        ep.project.name.toLowerCase().includes(search.toLowerCase()) ||
        (ep.project.description || "").toLowerCase().includes(search.toLowerCase()) ||
        Object.keys(ep.languages).some((l) =>
          l.toLowerCase().includes(search.toLowerCase())
        ) ||
        ep.contributors.some((c) =>
          c.name.toLowerCase().includes(search.toLowerCase())
        );
      const matchesType = activeFilter === "All" || ep.type === activeFilter;
      const matchesContributor =
        activeContributor === "All" ||
        ep.contributors.some((c) => c.name === activeContributor);
      return matchesSearch && matchesType && matchesContributor;
    });
  }, [enrichedProjects, search, activeFilter, activeContributor]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ep of enrichedProjects) {
      counts[ep.type] = (counts[ep.type] || 0) + 1;
    }
    return counts;
  }, [enrichedProjects]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Search repos, languages, people..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none sm:max-w-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
        <div className="flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeFilter === filter
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              {filter}
              {filter !== "All" && typeCounts[filter] ? (
                <span className="ml-1 opacity-70">{typeCounts[filter]}</span>
              ) : filter === "All" ? (
                <span className="ml-1 opacity-70">{enrichedProjects.length}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Contributors
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveContributor("All")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeContributor === "All"
                ? "bg-emerald-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            All
          </button>
          {allContributors.map((name) => (
            <button
              key={name}
              onClick={() =>
                setActiveContributor(activeContributor === name ? "All" : name)
              }
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeContributor === name
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No repositories match your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ep) => (
            <RepoCard key={ep.project.id} data={ep} />
          ))}
        </div>
      )}
    </div>
  );
}
