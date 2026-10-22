import { fetchEnrichedProjects } from "@/lib/gitlab";
import { Dashboard } from "@/components/dashboard";

export default async function Home() {
  let enrichedProjects;
  try {
    enrichedProjects = await fetchEnrichedProjects();
  } catch {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">
            Failed to load repositories
          </h2>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            Could not connect to the GitLab API. Make sure the environment
            variables <code className="rounded bg-red-100 px-1 dark:bg-red-900/50">GITLAB_PAT</code> and{" "}
            <code className="rounded bg-red-100 px-1 dark:bg-red-900/50">GITLAB_GROUP_PATH</code> are
            configured.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          DARA Repositories
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {enrichedProjects.length} repositories in the DARA group
        </p>
      </div>

      <Dashboard enrichedProjects={enrichedProjects} />
    </div>
  );
}
