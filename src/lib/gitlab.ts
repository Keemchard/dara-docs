const GITLAB_BASE = process.env.GITLAB_BASE_URL || "https://gitlab.com";
const GROUP_PATH = process.env.GITLAB_GROUP_PATH || "";

function apiUrl(path: string) {
  return `${GITLAB_BASE}/api/v4${path}`;
}

function headers(pat?: string) {
  const token = pat || process.env.GITLAB_PAT || "";
  return {
    "PRIVATE-TOKEN": token,
    "Content-Type": "application/json",
  } as Record<string, string>;
}

export interface GitLabProject {
  id: number;
  name: string;
  path: string;
  path_with_namespace: string;
  description: string | null;
  web_url: string;
  default_branch: string;
  last_activity_at: string;
  topics: string[];
  visibility: string;
  star_count: number;
  forks_count: number;
  avatar_url: string | null;
}

export interface GitLabCommit {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  committed_date: string;
  web_url: string;
}

export interface GitLabBranch {
  name: string;
  merged: boolean;
  protected: boolean;
  default: boolean;
  commit: {
    id: string;
    short_id: string;
    title: string;
    authored_date: string;
    author_name: string;
  };
}

export interface GitLabLanguages {
  [language: string]: number;
}

export interface GitLabMember {
  id: number;
  username: string;
  name: string;
  avatar_url: string;
  web_url: string;
  access_level: number;
}

export async function fetchProjects(pat?: string): Promise<GitLabProject[]> {
  const encodedGroup = encodeURIComponent(GROUP_PATH);
  const res = await fetch(
    apiUrl(
      `/groups/${encodedGroup}/projects?per_page=100&include_subgroups=true&order_by=last_activity_at`
    ),
    { headers: headers(pat), next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error(`GitLab API error: ${res.status}`);
  return res.json();
}

export async function fetchProject(
  projectId: number,
  pat?: string
): Promise<GitLabProject> {
  const res = await fetch(apiUrl(`/projects/${projectId}`), {
    headers: headers(pat),
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`GitLab API error: ${res.status}`);
  return res.json();
}

export async function fetchReadme(
  projectId: number,
  pat?: string
): Promise<string> {
  const res = await fetch(
    apiUrl(
      `/projects/${projectId}/repository/files/README.md/raw?ref=main`
    ),
    { headers: headers(pat), next: { revalidate: 300 } }
  );
  if (!res.ok) return "";
  return res.text();
}

export async function fetchCommits(
  projectId: number,
  pat?: string,
  perPage = 20
): Promise<GitLabCommit[]> {
  const res = await fetch(
    apiUrl(`/projects/${projectId}/repository/commits?per_page=${perPage}`),
    { headers: headers(pat), next: { revalidate: 120 } }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function fetchBranches(
  projectId: number,
  pat?: string
): Promise<GitLabBranch[]> {
  const res = await fetch(
    apiUrl(`/projects/${projectId}/repository/branches?per_page=100`),
    { headers: headers(pat), next: { revalidate: 300 } }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function fetchLanguages(
  projectId: number,
  pat?: string
): Promise<GitLabLanguages> {
  const res = await fetch(apiUrl(`/projects/${projectId}/languages`), {
    headers: headers(pat),
    next: { revalidate: 3600 },
  });
  if (!res.ok) return {};
  return res.json();
}

export async function fetchMembers(
  projectId: number,
  pat?: string
): Promise<GitLabMember[]> {
  const res = await fetch(
    apiUrl(`/projects/${projectId}/members/all?per_page=100`),
    { headers: headers(pat), next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  return res.json();
}

export interface GitLabContributor {
  name: string;
  email: string;
  commits: number;
  additions: number;
  deletions: number;
}

export async function fetchContributors(
  projectId: number,
  pat?: string
): Promise<GitLabContributor[]> {
  const res = await fetch(
    apiUrl(`/projects/${projectId}/repository/contributors?per_page=100&order_by=commits&sort=desc`),
    { headers: headers(pat), next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  return res.json();
}

export interface EnrichedProject {
  project: GitLabProject;
  languages: GitLabLanguages;
  owners: GitLabMember[];
  contributors: GitLabContributor[];
  type: "Frontend" | "Backend" | "Fullstack" | "Mobile" | "Other";
}

const ACCESS_LEVEL_OWNER = 50;
const ACCESS_LEVEL_MAINTAINER = 40;

export async function fetchEnrichedProjects(pat?: string): Promise<EnrichedProject[]> {
  const projects = await fetchProjects(pat);

  const enriched = await Promise.all(
    projects.map(async (project) => {
      const [languages, members, contributors] = await Promise.all([
        fetchLanguages(project.id, pat),
        fetchMembers(project.id, pat),
        fetchContributors(project.id, pat),
      ]);

      const owners = members.filter(
        (m) => m.access_level >= ACCESS_LEVEL_MAINTAINER
      );

      const type = classifyProject(project.path, languages);

      return { project, languages, owners, contributors, type };
    })
  );

  return enriched;
}

function classifyProject(
  path: string,
  languages: GitLabLanguages
): EnrichedProject["type"] {
  const lower = path.toLowerCase();
  const langKeys = Object.keys(languages).map((l) => l.toLowerCase());

  const isFrontendName =
    lower.includes("-fe") ||
    lower.endsWith("-fe") ||
    lower.includes("frontend") ||
    lower.includes("react") ||
    lower.includes("web");
  const isBackendName =
    lower.includes("backend") || lower.includes("-be") || lower.endsWith("-be");
  const isMobileName =
    lower.includes("flutter") ||
    lower.includes("mobile") ||
    lower.includes("-app");

  if (isMobileName || langKeys.includes("dart")) return "Mobile";
  if (isFrontendName && isBackendName) return "Fullstack";
  if (isFrontendName) return "Frontend";
  if (isBackendName) return "Backend";
  if (lower.includes("php") || langKeys.includes("php")) return "Backend";

  const frontendLangs = ["typescript", "javascript", "css", "html", "scss", "vue"];
  const backendLangs = ["python", "go", "java", "ruby", "php", "c#"];
  const hasFrontend = langKeys.some((l) => frontendLangs.includes(l));
  const hasBackend = langKeys.some((l) => backendLangs.includes(l));

  if (hasFrontend && hasBackend) return "Fullstack";
  if (hasFrontend) return "Frontend";
  if (hasBackend) return "Backend";
  return "Other";
}
