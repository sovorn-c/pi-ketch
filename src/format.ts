export interface SearchResult {
  title: string;
  url: string;
  fetched_url?: string;
  description?: string;
  content?: string;
  backends?: string[];
}

export interface CodeResult {
  repo: string;
  path: string;
  line?: number;
  snippet: string;
  language?: string;
  stars?: number;
  url: string;
  source?: string;
}

export interface DocsResult {
  library: string;
  version?: string;
  title: string;
  breadcrumb?: string;
  snippet: string;
  url: string;
  source?: string;
}

export interface LibraryMatch {
  id: string;
  title: string;
  description?: string;
  totalSnippets?: number;
  trustScore?: number;
  versions?: string[];
}

export interface ScrapePage {
  url: string;
  fetched_url?: string;
  title?: string;
  markdown?: string;
  source?: string;
  raw_html?: string;
}

function section(title: string, url?: string): string {
  return url ? `## [${title}](${url})` : `## ${title}`;
}

export function formatSearchResults(results: SearchResult[]): string {
  if (!results.length) return "No web results found.";
  return results
    .map((r, index) => {
      const lines = [section(`${index + 1}. ${r.title}`, r.url)];
      if (r.backends?.length) lines.push(`Backends: ${r.backends.join(", ")}`);
      if (r.fetched_url && r.fetched_url !== r.url) lines.push(`Fetched: ${r.fetched_url}`);
      if (r.description) lines.push("", r.description);
      if (r.content) lines.push("", r.content);
      return lines.join("\n");
    })
    .join("\n\n");
}

export function formatCodeResults(results: CodeResult[]): string {
  if (!results.length) return "No public code results found.";
  return results
    .map((r, index) => {
      const location = `${r.repo}/${r.path}${r.line ? `:${r.line}` : ""}`;
      const meta = [r.language, r.source, r.stars ? `★ ${r.stars}` : undefined].filter(Boolean).join(" · ");
      return [section(`${index + 1}. ${location}`, r.url), meta || undefined, "", "```", r.snippet, "```"]
        .filter((value) => value !== undefined)
        .join("\n");
    })
    .join("\n\n");
}

export function formatDocsResults(results: DocsResult[]): string {
  if (!results.length) return "No documentation results found.";
  return results
    .map((r, index) => {
      const title = r.breadcrumb || r.title;
      const metadata = [r.library, r.version, r.source].filter(Boolean).join(" · ");
      return [section(`${index + 1}. ${title}`, r.url), metadata || undefined, "", r.snippet]
        .filter((value) => value !== undefined)
        .join("\n");
    })
    .join("\n\n");
}

export function formatLibraryMatches(results: LibraryMatch[]): string {
  if (!results.length) return "No library matches found.";
  return results
    .map((r, index) => {
      const stats = [
        r.totalSnippets !== undefined ? `${r.totalSnippets} snippets` : undefined,
        r.trustScore !== undefined ? `trust ${r.trustScore.toFixed(1)}` : undefined,
      ]
        .filter(Boolean)
        .join(" · ");
      const versions = r.versions?.length ? `Versions: ${r.versions.slice(0, 8).join(", ")}` : undefined;
      return [`## ${index + 1}. ${r.title}`, `Library ID: \`${r.id}\``, stats || undefined, versions, r.description]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

export function formatScrapePages(results: ScrapePage[]): string {
  if (!results.length) return "No pages were scraped successfully.";
  return results
    .map((r, index) => {
      const url = r.fetched_url || r.url;
      const body = r.raw_html ?? r.markdown ?? "";
      const label = r.title || r.url;
      return [section(results.length > 1 ? `${index + 1}. ${label}` : label, url), r.source ? `Source: ${r.source}` : undefined, "", body]
        .filter((value) => value !== undefined)
        .join("\n");
    })
    .join("\n\n");
}
