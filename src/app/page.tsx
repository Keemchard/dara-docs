import { fetchEnrichedProjects } from "@/lib/gitlab";
import { Dashboard } from "@/components/dashboard";

export default async function Home() {
  const enrichedProjects = await fetchEnrichedProjects();

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
