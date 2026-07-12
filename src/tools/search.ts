import { defineTool, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { formatSearchResults, type SearchResult } from "../format.js";
import { runKetch } from "../ketch.js";
import { formatKetchOutput, parseJson } from "../output.js";
import { ketchRenderers } from "../render.js";
import { SearchParams, type SearchArgs } from "../schemas.js";
import { addFlag } from "./common.js";

export function buildSearchArgs(params: SearchArgs): string[] {
  const modes = Number(Boolean(params.backend)) + Number(Boolean(params.multi?.length)) + Number(Boolean(params.allBackends));
  if (modes > 1) throw new Error("ketch_search: backend, multi, and allBackends are mutually exclusive.");
  const args = ["search"];
  addFlag(args, "--backend", params.backend);
  if (params.multi?.length) args.push(`--multi=${params.multi.join(",")}`);
  if (params.allBackends) args.push("--multi=all");
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
      description: "Search the live web through Ketch. Routine searches must omit backend, multi, and allBackends so Ketch uses one configured default backend. Federated modes are reserved for deeper research. Can optionally scrape bounded content from each result.",
      parameters: SearchParams,
      promptSnippet: "ketch_search: For routine web search, omit backend options and use only Ketch's configured default; cite returned URLs.",
      promptGuidelines: [
        "For every routine search, omit backend, multi, and allBackends. Do not automatically send multi: ['brave', 'ddg'] or any other provider list; Ketch must use the user's single configured default backend.",
        "Use multi only for deeper corroboration or an explicit request to compare particular providers. Prefer allBackends for contested, multi-part, or deep research that needs every currently usable backend.",
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
