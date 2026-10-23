"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import type {
  GitLabProject,
  GitLabCommit,
  GitLabBranch,
  GitLabLanguages,
  ProjectStructure,
  FeatureModule,
  DependencyInfo,
} from "@/lib/gitlab";
import { TimeAgo } from "./time-ago";

type Tab = "readme" | "features" | "dependencies" | "commits" | "branches";

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  PHP: "#4F5D95",
  Dart: "#00B4AB",
  Java: "#b07219",
  Go: "#00ADD8",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Shell: "#89e051",
  Dockerfile: "#384d54",
  Ruby: "#701516",
  Rust: "#dea584",
  Vue: "#41b883",
  SCSS: "#c6538c",
};

function LanguageBar({ languages }: { languages: GitLabLanguages }) {
  const entries = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Languages
      </h3>
      <div className="mb-3 flex h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        {entries.map(([lang, pct]) => (
          <div
            key={lang}
            style={{
              width: `${pct}%`,
              backgroundColor: LANG_COLORS[lang] || "#6b7280",
            }}
            title={`${lang}: ${pct.toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {entries.map(([lang, pct]) => (
          <div key={lang} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: LANG_COLORS[lang] || "#6b7280" }}
            />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {lang}
            </span>
            <span className="text-zinc-400">{pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommitsList({ commits }: { commits: GitLabCommit[] }) {
  if (commits.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-500">No commits found.</p>;
  }

  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {commits.map((c) => (
        <div key={c.id} className="py-3.5 first:pt-0 last:pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {c.title}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {c.author_name}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {c.short_id}
              </code>
              <TimeAgo date={c.committed_date} className="text-xs text-zinc-400" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BranchesList({ branches }: { branches: GitLabBranch[] }) {
  if (branches.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-500">No branches found.</p>;
  }

  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {branches.map((b) => (
        <div key={b.name} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
          <div className="flex items-center gap-2 min-w-0">
            <code className="truncate rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {b.name}
            </code>
            {b.default && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                default
              </span>
            )}
            {b.protected && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                protected
              </span>
            )}
          </div>
          <TimeAgo date={b.commit.authored_date} className="shrink-0 text-xs text-zinc-400" />
        </div>
      ))}
    </div>
  );
}

function FileIcon() {
  return (
    <span
      className="inline-block text-zinc-400"
      style={{ width: 14, height: 14, lineHeight: "14px", fontSize: 11 }}
    >
      &#128196;
    </span>
  );
}

function FolderIcon() {
  return (
    <span
      className="inline-block text-zinc-400"
      style={{ width: 14, height: 14, lineHeight: "14px", fontSize: 11 }}
    >
      &#128193;
    </span>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <span
      className="inline-block text-zinc-400 transition-transform"
      style={{
        width: 16,
        height: 16,
        lineHeight: "16px",
        fontSize: 10,
        transform: open ? "rotate(90deg)" : "rotate(0deg)",
      }}
    >
      &#9654;
    </span>
  );
}

function FeatureCard({ feature, gitlabUrl }: { feature: FeatureModule; gitlabUrl: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700/60 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2.5 bg-zinc-50/80 px-4 py-3 text-left transition-colors hover:bg-zinc-100/80 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/70"
      >
        <ChevronIcon open={expanded} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold capitalize text-zinc-900 dark:text-zinc-100">
              {feature.name.replace(/[-_]/g, " ")}
            </span>
            <code className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {feature.path}/
            </code>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {feature.description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          {feature.mainFiles.length > 0 && (
            <span>{feature.mainFiles.length} files</span>
          )}
          {feature.subComponents.length > 0 && (
            <span className="rounded bg-zinc-200/70 px-1.5 py-0.5 dark:bg-zinc-700/70">
              {feature.subComponents.length} sub
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700/60 dark:bg-zinc-900/50">
          {feature.mainFiles.length > 0 && (
            <div className={feature.subComponents.length > 0 ? "mb-4" : ""}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Main Components
              </p>
              <ul className="space-y-0.5">
                {feature.mainFiles.map((file) => {
                  const fileName = file.split("/").pop()!;
                  return (
                    <li key={file}>
                      <a
                        href={`${gitlabUrl}/-/blob/main/${file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/file flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                      >
                        <FileIcon />
                        <span className="font-mono font-medium text-zinc-800 group-hover/file:text-indigo-600 dark:text-zinc-200 dark:group-hover/file:text-indigo-400">
                          {fileName}
                        </span>
                        <span className="hidden truncate text-zinc-400 sm:inline dark:text-zinc-600">
                          {feature.path}/
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {feature.subComponents.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Sub-Components
              </p>
              <div className="flex flex-wrap gap-1.5">
                {feature.subComponents.map((sub) => (
                  <a
                    key={sub}
                    href={`${gitlabUrl}/-/tree/main/${feature.path}/${sub}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
                  >
                    <FolderIcon />
                    {sub}/
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FeaturesTab({
  structure,
  gitlabUrl,
}: {
  structure: ProjectStructure;
  gitlabUrl: string;
}) {
  if (structure.features.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No feature modules detected in this repository.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">
            {structure.framework}
          </span>
          <span className="rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
            {structure.projectType}
          </span>
        </div>
        {structure.entryPoints.length > 0 && (
          <code className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {structure.entryPoints.map((e) => e.split("/").pop()).join(", ")}
          </code>
        )}
      </div>

      <div className="space-y-2">
        {structure.features.map((feature) => (
          <FeatureCard
            key={feature.path}
            feature={feature}
            gitlabUrl={gitlabUrl}
          />
        ))}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
    >
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy All
        </>
      )}
    </button>
  );
}

function DependenciesTab({ deps }: { deps: DependencyInfo }) {
  const runtime = deps.dependencies.filter((d) => !d.dev);
  const dev = deps.dependencies.filter((d) => d.dev);

  if (deps.dependencies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No dependency manifest found (package.json, pubspec.yaml, etc.).
        </p>
      </div>
    );
  }

  const allDepsText = deps.dependencies.map((d) => d.name).join(", ");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {deps.framework && (
            <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">
              {deps.framework}
            </span>
          )}
          {deps.runtime && (
            <span className="rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
              {deps.runtime}
            </span>
          )}
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {deps.dependencies.length} total packages
          </span>
        </div>
        <CopyButton text={allDepsText} />
      </div>

      {runtime.length > 0 && (
        <div>
          <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Dependencies ({runtime.length})
          </h4>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {runtime.map((d) => (
              <div
                key={d.name}
                className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-1.5 dark:border-zinc-800"
              >
                <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {d.name}
                </span>
                <code className="ml-2 shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                  {d.version}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {dev.length > 0 && (
        <div>
          <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Dev Dependencies ({dev.length})
          </h4>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {dev.map((d) => (
              <div
                key={d.name}
                className="flex items-center justify-between rounded-md border border-dashed border-zinc-100 px-3 py-1.5 dark:border-zinc-800"
              >
                <span className="truncate text-sm text-zinc-600 dark:text-zinc-400">
                  {d.name}
                </span>
                <code className="ml-2 shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                  {d.version}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RepoDetail({
  project,
  readme,
  commits,
  branches,
  languages,
  structure,
  deps,
}: {
  project: GitLabProject;
  readme: string;
  commits: GitLabCommit[];
  branches: GitLabBranch[];
  languages: GitLabLanguages;
  structure: ProjectStructure;
  deps: DependencyInfo;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("readme");
  const displayName = project.name.replace(/-/g, " ");

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "readme", label: "README" },
    { key: "features", label: "Features", count: structure.features.length },
    { key: "dependencies", label: "Dependencies", count: deps.dependencies.length },
    { key: "commits", label: "Commits", count: commits.length },
    { key: "branches", label: "Branches", count: branches.length },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to repositories
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold capitalize tracking-tight text-zinc-900 dark:text-zinc-100">
              {displayName}
            </h1>
            {project.description && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {project.description}
              </p>
            )}
          </div>
          <a
            href={project.web_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 01-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 014.82 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0118.6 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.51L23 13.45a.84.84 0 01-.35.94z" />
            </svg>
            View on GitLab
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1.5 text-xs text-zinc-400">
                    ({tab.count})
                  </span>
                )}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                )}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            {activeTab === "readme" && (
              readme ? (
                <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-indigo-600 dark:prose-a:text-indigo-400">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {readme}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-zinc-500">
                  No README.md found in this repository.
                </p>
              )
            )}
            {activeTab === "features" && (
              <FeaturesTab structure={structure} gitlabUrl={project.web_url} />
            )}
            {activeTab === "dependencies" && (
              <DependenciesTab deps={deps} />
            )}
            {activeTab === "commits" && <CommitsList commits={commits} />}
            {activeTab === "branches" && <BranchesList branches={branches} />}
          </div>
        </div>

        <div className="space-y-4">
          <LanguageBar languages={languages} />

          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Info
            </h3>
            <dl className="space-y-2.5 text-sm">
              {deps.framework && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500 dark:text-zinc-400">Framework</dt>
                  <dd className="font-medium text-zinc-700 dark:text-zinc-300">
                    {deps.framework}
                  </dd>
                </div>
              )}
              {deps.runtime && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500 dark:text-zinc-400">Runtime</dt>
                  <dd className="font-medium text-zinc-700 dark:text-zinc-300">
                    {deps.runtime}
                  </dd>
                </div>
              )}
              {deps.dependencies.length > 0 && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500 dark:text-zinc-400">Packages</dt>
                  <dd className="text-zinc-700 dark:text-zinc-300">
                    {deps.dependencies.filter((d) => !d.dev).length} deps
                    {deps.dependencies.filter((d) => d.dev).length > 0 && (
                      <span className="ml-1 text-zinc-400">
                        + {deps.dependencies.filter((d) => d.dev).length} dev
                      </span>
                    )}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Default branch</dt>
                <dd>
                  <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                    {project.default_branch}
                  </code>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Last activity</dt>
                <dd className="text-zinc-700 dark:text-zinc-300">
                  <TimeAgo date={project.last_activity_at} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Visibility</dt>
                <dd className="capitalize text-zinc-700 dark:text-zinc-300">
                  {project.visibility}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Branches</dt>
                <dd className="text-zinc-700 dark:text-zinc-300">
                  {branches.length}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Features</dt>
                <dd className="text-zinc-700 dark:text-zinc-300">
                  {structure.features.length} modules
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
