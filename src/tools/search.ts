import { defineTool, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { formatSearchResults, type SearchResult } from "../format.js";
import { runKetch } from "../ketch.js";
import { formatKetchOutput, parseJson } from "../output.js";
import { ketchRenderers } from "../render.js";
import { SearchParams, type SearchArgs } from "../schemas.js";
import { addFlag } from "./common.js";

export function buildSearchArgs(params: SearchArgs): string[] {
  if (params.backend && params.multi?.length) throw new Error("ketch_search: backend and multi are mutually exclusive.");
  const args = ["search"];
  addFlag(args, "--backend", params.backend);
  if (params.multi?.length) args.push(`--multi=${params.multi.join(",")}`);
  addFlag(args, "--limit", params.limit);
  addFlag(args, "--scrape", params.scrape);
  addFlag(args, "--trim", params.trim);
  if (params.scrape) addFlag(args, "--max-chars", params.maxChars ?? 6000);
  addFlag(args, "--searxng-url", params.searxngUrl);
  args.push("--json", "--", params.query);
  return args;
}

export function registerSearchTool(pi: ExtensionAPI): void {
  pi.registerTool(
    defineTool({
      name: "ketch_search",
      label: "Ketch Web Search",
      description: "Search the live web through Ketch using configured Brave, DuckDuckGo, SearXNG, Exa, Firecrawl, or Keenable backends. Can optionally scrape bounded content from each result.",
      parameters: SearchParams,
      promptSnippet: "ketch_search: Search the current external web through Ketch; cite returned URLs.",
      promptGuidelines: [
        "Use ketch_search for current external information, comparisons, news, and opinions; cite returned URLs.",
        "When ketch_search uses scrape, bound each fetched result with maxChars.",
      ],
      ...ketchRenderers("ketch_search"),
      async execute(_id, params: SearchArgs, signal, _update, ctx) {
        const process = await runKetch({ cwd: ctx.cwd, args: buildSearchArgs(params), signal, timeoutMs: params.scrape ? 120_000 : 45_000 });
        const results = process.stdout.trim() ? parseJson<SearchResult[]>(process) : [];
        if (!results.length) process.status = "not_found";
        return await formatKetchOutput({
          process,
          text: formatSearchResults(results),
          parsed: results.map(({ title, url, fetched_url, description, backends }) => ({ title, url, fetched_url, description, backends })),
          resultCount: results.length,
        });
      },
    }),
  );
}
