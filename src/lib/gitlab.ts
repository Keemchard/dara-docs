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

export interface GitLabTreeItem {
  id: string;
  name: string;
  type: "tree" | "blob";
  path: string;
  mode: string;
}

export async function fetchTree(
  projectId: number,
  pat?: string,
  ref?: string
): Promise<GitLabTreeItem[]> {
  const allItems: GitLabTreeItem[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const refParam = ref ? `&ref=${encodeURIComponent(ref)}` : "";
    const res = await fetch(
      apiUrl(
        `/projects/${projectId}/repository/tree?recursive=true&per_page=${perPage}&page=${page}${refParam}`
      ),
      { headers: headers(pat), next: { revalidate: 600 } }
    );
    if (!res.ok) break;
    const items: GitLabTreeItem[] = await res.json();
    if (items.length === 0) break;
    allItems.push(...items);
    if (items.length < perPage) break;
    page++;
  }

  return allItems;
}

export interface FeatureModule {
  name: string;
  description: string;
  path: string;
  mainFiles: string[];
  subComponents: string[];
}

export interface ProjectStructure {
  projectType: string;
  framework: string;
  features: FeatureModule[];
  entryPoints: string[];
}

const IGNORE_DIRS = new Set([
  "node_modules", ".git", ".next", ".dart_tool", ".idea", ".cursor",
  ".claude", "dist", "build", "coverage", ".vscode", "__pycache__",
  ".gradle", ".dart_tool", "android", "ios", "macos", "web", "windows",
  "linux", "test", "tests", ".github", ".gitlab", "public", "assets",
  "terraform", "scripts", "mcp",
]);

function shouldIgnore(path: string): boolean {
  const first = path.split("/")[0];
  return IGNORE_DIRS.has(first) || path.startsWith(".");
}

function detectFramework(tree: GitLabTreeItem[]): { projectType: string; framework: string } {
  const paths = new Set(tree.map((t) => t.path));
  const names = new Set(tree.filter((t) => t.type === "blob").map((t) => t.name));

  if (names.has("pubspec.yaml")) return { projectType: "Mobile", framework: "Flutter" };
  if (names.has("nest-cli.json") || paths.has("src/app.module.ts"))
    return { projectType: "Backend", framework: "NestJS" };
  if (names.has("next.config.ts") || names.has("next.config.js") || names.has("next.config.mjs"))
    return { projectType: "Frontend", framework: "Next.js" };
  if (names.has("nuxt.config.ts") || names.has("nuxt.config.js"))
    return { projectType: "Frontend", framework: "Nuxt.js" };
  if (names.has("vite.config.ts") || names.has("vite.config.js"))
    return { projectType: "Frontend", framework: "Vite + React" };
  if (names.has("composer.json"))
    return { projectType: "Backend", framework: "PHP / Laravel" };
  if (names.has("manage.py"))
    return { projectType: "Backend", framework: "Django" };
  if (names.has("requirements.txt") || names.has("pyproject.toml"))
    return { projectType: "Backend", framework: "Python" };
  if (names.has("go.mod"))
    return { projectType: "Backend", framework: "Go" };
  if (names.has("Gemfile"))
    return { projectType: "Backend", framework: "Ruby on Rails" };
  if (names.has("package.json"))
    return { projectType: "Frontend", framework: "Node.js" };
  return { projectType: "Unknown", framework: "Unknown" };
}

function describeFeature(dirName: string, files: string[]): string {
  const lower = dirName.toLowerCase();
  const fileNames = files.map((f) => f.toLowerCase());

  if (lower === "auth" || lower === "authentication" || lower === "login")
    return "User authentication, login/logout flows, and session management";
  if (lower === "users" || lower === "user")
    return "User profiles, management, and account operations";
  if (lower === "dashboard" || lower === "home")
    return "Main dashboard view and overview widgets";
  if (lower === "settings" || lower === "config" || lower === "configuration")
    return "Application settings and configuration";
  if (lower === "guards")
    return "Route/request guards for access control and authorization";
  if (lower === "interceptors")
    return "Request/response interceptors for logging, transformation, or caching";
  if (lower === "filters")
    return "Exception filters and error handlers";
  if (lower === "decorators")
    return "Custom decorators for route metadata and parameter extraction";
  if (lower === "dto" || lower === "dtos")
    return "Data Transfer Objects for request/response validation";
  if (lower === "constants")
    return "Application-wide constants and enumerations";
  if (lower === "enums")
    return "Enumeration types for typed value sets";
  if (lower === "prisma" || lower === "db" || lower === "database")
    return "Database client, schema, and migration management";
  if (lower === "redis")
    return "Redis cache client and session store";
  if (lower === "providers")
    return "State providers and dependency injection bindings";
  if (lower === "router" || lower === "routes" || lower === "routing")
    return "Application routing and navigation configuration";
  if (lower === "screens" || lower === "pages" || lower === "views")
    return "Top-level screen/page components";
  if (lower === "widgets" || lower === "components")
    return "Reusable UI components and widgets";
  if (lower === "theme" || lower === "styles")
    return "Theming, colors, typography, and design tokens";
  if (lower === "models" || lower === "entities")
    return "Data models and entity definitions";
  if (lower === "services")
    return "Business logic services and external API integrations";
  if (lower === "hooks" || lower === "composables")
    return "Custom hooks/composables for shared stateful logic";
  if (lower === "utils" || lower === "helpers" || lower === "lib")
    return "Utility functions and shared helpers";
  if (lower === "api")
    return "API route handlers and endpoint definitions";
  if (lower === "middleware")
    return "Request middleware for auth, logging, and transformation";
  if (lower === "store" || lower === "stores" || lower === "state")
    return "State management store (global app state)";
  if (lower === "layouts")
    return "Page layout wrappers and structural components";
  if (lower === "ui")
    return "Low-level UI primitives (buttons, inputs, modals, etc.)";
  if (lower === "common" || lower === "shared")
    return "Shared utilities, types, and cross-cutting concerns";
  if (lower === "modules")
    return "Feature modules organized by domain";

  if (fileNames.some((f) => f.includes("upload")))
    return "File upload and media handling";
  if (fileNames.some((f) => f.includes("email") || f.includes("mail")))
    return "Email/notification service";
  if (fileNames.some((f) => f.includes("payment") || f.includes("billing")))
    return "Payment processing and billing";

  return `${dirName} feature module`;
}

export function analyzeTree(tree: GitLabTreeItem[]): ProjectStructure {
  const { projectType, framework } = detectFramework(tree);
  const filtered = tree.filter((t) => !shouldIgnore(t.path));

  const entryPoints = filtered
    .filter((t) => t.type === "blob")
    .filter((t) => {
      const name = t.name.toLowerCase();
      return (
        name === "main.dart" ||
        name === "main.ts" ||
        name === "main.tsx" ||
        name === "app.module.ts" ||
        name === "index.ts" ||
        name === "index.tsx" ||
        name === "app.ts" ||
        name === "app.tsx" ||
        name === "server.ts"
      );
    })
    .map((t) => t.path);

  const featureDirs = extractFeatures(filtered, framework);

  return { projectType, framework, features: featureDirs, entryPoints };
}

function extractFeatures(
  tree: GitLabTreeItem[],
  framework: string
): FeatureModule[] {
  const rootPrefixes = findFeatureRoots(tree, framework);
  const features: FeatureModule[] = [];

  for (const root of rootPrefixes) {
    const children = tree.filter(
      (t) => t.path.startsWith(root.path + "/") && t.path !== root.path
    );

    const directDirs = new Set<string>();
    const directFiles: string[] = [];

    for (const child of children) {
      const relativePath = child.path.slice(root.path.length + 1);
      const parts = relativePath.split("/");

      if (parts.length === 1 && child.type === "blob") {
        directFiles.push(child.path);
      } else if (parts.length >= 1 && child.type === "tree") {
        directDirs.add(parts[0]);
      }
    }

    if (directDirs.size > 0) {
      for (const subDir of directDirs) {
        const subPath = `${root.path}/${subDir}`;
        const subChildren = children.filter(
          (c) => c.path.startsWith(subPath + "/") || c.path === subPath
        );
        const subFiles = subChildren
          .filter((c) => c.type === "blob")
          .map((c) => c.path);
        const subDirs = subChildren
          .filter((c) => c.type === "tree" && c.path !== subPath)
          .map((c) => {
            const rel = c.path.slice(subPath.length + 1);
            return rel;
          })
          .filter((p) => !p.includes("/"));

        features.push({
          name: subDir,
          description: describeFeature(subDir, subFiles),
          path: subPath,
          mainFiles: subFiles.filter((f) => {
            const rel = f.slice(subPath.length + 1);
            return !rel.includes("/");
          }),
          subComponents: subDirs,
        });
      }
    }

    if (directFiles.length > 0 && directDirs.size === 0) {
      features.push({
        name: root.name,
        description: describeFeature(root.name, directFiles),
        path: root.path,
        mainFiles: directFiles,
        subComponents: [],
      });
    }
  }

  return features;
}

interface FeatureRoot {
  name: string;
  path: string;
  priority: number;
}

function findFeatureRoots(tree: GitLabTreeItem[], framework: string): FeatureRoot[] {
  const dirs = tree.filter((t) => t.type === "tree");
  const roots: FeatureRoot[] = [];

  const highPriority = [
    "src/modules", "src/features", "src/domains",
    "app/api", "app",
    "components", "src/components",
    "lib/screens", "lib/widgets", "lib/providers", "lib/models",
    "lib/data", "lib/router", "lib/theme",
    "src/common", "src/config", "src/prisma", "src/redis",
    "lib", "src/services", "src/middleware", "src/utils",
    "src/hooks", "src/store", "src/layouts",
    "pages", "src/pages", "src/views",
  ];

  for (const candidate of highPriority) {
    const exists = dirs.some((d) => d.path === candidate);
    if (exists) {
      const name = candidate.split("/").pop()!;
      roots.push({ name, path: candidate, priority: highPriority.indexOf(candidate) });
    }
  }

  if (roots.length === 0) {
    const topLevelDirs = dirs.filter(
      (d) => !d.path.includes("/") && !IGNORE_DIRS.has(d.name)
    );
    for (const d of topLevelDirs) {
      roots.push({ name: d.name, path: d.path, priority: 100 });
    }
  }

  roots.sort((a, b) => a.priority - b.priority);
  return roots;
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
