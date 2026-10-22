import type {
  GitLabProject,
  GitLabCommit,
  GitLabBranch,
  GitLabLanguages,
} from "./gitlab";

async function apiFetch(path: string, pat?: string) {
  const res = await fetch(`/api/gitlab?path=${encodeURIComponent(path)}`, {
    headers: pat ? { "x-gitlab-pat": pat } : {},
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res;
}

export async function clientFetchProjects(
  pat?: string
): Promise<GitLabProject[]> {
  const groupPath = encodeURIComponent(
    "globetelecom/platforms/ntg-nai/application/dara"
  );
  const res = await apiFetch(
    `/groups/${groupPath}/projects?per_page=100&include_subgroups=true&order_by=last_activity_at`,
    pat
  );
  return res.json();
}

export async function clientFetchReadme(
  projectId: number,
  pat?: string
): Promise<string> {
  const res = await apiFetch(
    `/projects/${projectId}/repository/files/README.md/raw?ref=main`,
    pat
  );
  return res.text();
}

export async function clientFetchCommits(
  projectId: number,
  pat?: string
): Promise<GitLabCommit[]> {
  const res = await apiFetch(
    `/projects/${projectId}/repository/commits?per_page=20`,
    pat
  );
  return res.json();
}

export async function clientFetchBranches(
  projectId: number,
  pat?: string
): Promise<GitLabBranch[]> {
  const res = await apiFetch(
    `/projects/${projectId}/repository/branches?per_page=100`,
    pat
  );
  return res.json();
}

export async function clientFetchLanguages(
  projectId: number,
  pat?: string
): Promise<GitLabLanguages> {
  const res = await apiFetch(`/projects/${projectId}/languages`, pat);
  return res.json();
}
