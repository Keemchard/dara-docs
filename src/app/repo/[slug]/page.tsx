import { Suspense } from "react";
import {
  fetchProject,
  fetchReadme,
  fetchCommits,
  fetchBranches,
  fetchLanguages,
  fetchTree,
  analyzeTree,
} from "@/lib/gitlab";
import { RepoDetail } from "@/components/repo-detail";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string }>;
}

async function RepoContent({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const projectId = Number(id);

  if (!projectId) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-zinc-500">Invalid project ID.</p>
      </div>
    );
  }

  const [project, readme, commits, branches, languages, tree] = await Promise.all([
    fetchProject(projectId),
    fetchReadme(projectId),
    fetchCommits(projectId),
    fetchBranches(projectId),
    fetchLanguages(projectId),
    fetchTree(projectId),
  ]);

  const structure = analyzeTree(tree);

  return (
    <RepoDetail
      project={project}
      readme={readme}
      commits={commits}
      branches={branches}
      languages={languages}
      structure={structure}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-10 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-64 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="space-y-4">
          <div className="h-32 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-40 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}

export default async function RepoPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <RepoContent searchParams={searchParams} />
    </Suspense>
  );
}
