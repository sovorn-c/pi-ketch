import { StringEnum } from "@earendil-works/pi-ai";
import { Type, type Static } from "typebox";

const SearchBackend = StringEnum(["brave", "ddg", "searxng", "exa", "firecrawl", "keenable"] as const);
const CodeBackend = StringEnum(["grepapp", "sourcegraph", "github"] as const);
const DocsBackend = StringEnum(["context7"] as const);

export const SearchParams = Type.Object({
  query: Type.String({ description: "Web search query." }),
  backend: Type.Optional(SearchBackend),
  multi: Type.Optional(Type.Array(SearchBackend, { description: "Query an explicit backend set only for deep research, corroboration, or a user-requested provider comparison. Never use for routine searches; omit it to use the configured default backend. Cannot be combined with backend or allBackends.", maxItems: 6 })),
  allBackends: Type.Optional(Type.Boolean({ description: "Query every search backend Ketch currently considers usable. Use only for contested or deep research; never for routine searches." })),
  limit: Type.Optional(Type.Integer({ description: "Maximum results. Defaults to Ketch config; capped at 20.", minimum: 1, maximum: 20 })),
  scrape: Type.Optional(Type.Boolean({ description: "Fetch result pages and include extracted content." })),
  trim: Type.Optional(Type.Boolean({ description: "Strip Markdown formatting from scraped content." })),
  maxChars: Type.Optional(Type.Integer({ description: "Maximum scraped characters per result. Defaults to 6000 when scrape is enabled.", minimum: 1, maximum: 20000 })),
  searxngUrl: Type.Optional(Type.String({ description: "Override the configured SearXNG endpoint." })),
});
export type SearchArgs = Static<typeof SearchParams>;

export const CodeParams = Type.Object({
  query: Type.String({ description: "Literal or regular-expression code query for public OSS repositories." }),
  backend: Type.Optional(CodeBackend),
  lang: Type.Optional(Type.String({ description: "Language filter, such as go, typescript, or python." })),
  limit: Type.Optional(Type.Integer({ description: "Maximum results. Capped at 20.", minimum: 1, maximum: 20 })),
  regex: Type.Optional(Type.Boolean({ description: "Interpret query as a regular expression. Supported by grepapp and sourcegraph, not GitHub." })),
});
export type CodeArgs = Static<typeof CodeParams>;

export const DocsParams = Type.Object({
  query: Type.String({ description: "Library name to resolve or documentation query." }),
  backend: Type.Optional(DocsBackend),
  library: Type.Optional(Type.String({ description: "Context7 library ID. Skips name resolution." })),
  resolve: Type.Optional(Type.Boolean({ description: "Resolve a library name instead of searching documentation." })),
  limit: Type.Optional(Type.Integer({ description: "Maximum matches for search or resolve. Capped at 20.", minimum: 1, maximum: 20 })),
  tokens: Type.Optional(Type.Integer({ description: "Context7 token budget. Defaults to 4000; capped at 12000.", minimum: 100, maximum: 12000 })),
});
export type DocsArgs = Static<typeof DocsParams>;

export const ScrapeParams = Type.Object({
  url: Type.Optional(Type.String({ description: "One HTTP(S) URL to scrape. Provide exactly one of url or urls." })),
  urls: Type.Optional(Type.Array(Type.String(), { description: "HTTP(S) URLs to scrape in one batch. Provide exactly one of url or urls.", minItems: 1, maxItems: 20 })),
  selector: Type.Optional(Type.String({ description: "CSS selector to extract. Incompatible with raw." })),
  trim: Type.Optional(Type.Boolean({ description: "Strip Markdown formatting. Incompatible with raw." })),
  maxChars: Type.Optional(Type.Integer({ description: "Maximum characters per page. Defaults to 6000.", minimum: 1, maximum: 20000 })),
  noCache: Type.Optional(Type.Boolean({ description: "Bypass Ketch's page cache." })),
  raw: Type.Optional(Type.Boolean({ description: "Return raw HTML instead of extracted Markdown." })),
  forceBrowser: Type.Optional(Type.Boolean({ description: "Force configured headless-browser rendering." })),
  noLlmsTxt: Type.Optional(Type.Boolean({ description: "Disable automatic /llms.txt detection for bare domains." })),
  concurrency: Type.Optional(Type.Integer({ description: "Batch concurrency. Defaults to 5; capped at 16.", minimum: 1, maximum: 16 })),
});
export type ScrapeArgs = Static<typeof ScrapeParams>;

export const CrawlParams = Type.Object({
  url: Type.String({ description: "HTTP(S) seed URL. Ketch crawls the same host breadth-first." }),
  depth: Type.Optional(Type.Integer({ description: "Maximum crawl depth. Defaults to 3; capped at 5.", minimum: 1, maximum: 5 })),
  sitemap: Type.Optional(Type.Boolean({ description: "Treat the seed as a sitemap." })),
  maxPages: Type.Optional(Type.Integer({ description: "Stop after this many successful pages. Defaults to 30; capped at 100.", minimum: 1, maximum: 100 })),
  allow: Type.Optional(Type.Array(Type.String(), { description: "Path substrings; a URL must match at least one." })),
  deny: Type.Optional(Type.Array(Type.String(), { description: "Regular expressions for URLs to skip." })),
  maxChars: Type.Optional(Type.Integer({ description: "Maximum Markdown characters per page. Defaults to 6000.", minimum: 1, maximum: 20000 })),
  noCache: Type.Optional(Type.Boolean({ description: "Bypass Ketch's page cache." })),
  concurrency: Type.Optional(Type.Integer({ description: "Worker count. Defaults to 8; capped at 16.", minimum: 1, maximum: 16 })),
});
export type CrawlArgs = Static<typeof CrawlParams>;
