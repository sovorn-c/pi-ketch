import { defineTool, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { formatDocsResults, formatLibraryMatches, type DocsResult, type LibraryMatch } from "../format.js";
import { runKetch } from "../ketch.js";
import { formatKetchOutput, parseJson } from "../output.js";
import { ketchRenderers } from "../render.js";
import { DocsParams, type DocsArgs } from "../schemas.js";
import { addFlag } from "./common.js";

export function buildDocsArgs(params: DocsArgs): string[] {
  if (params.resolve && params.library) throw new Error("ketch_docs: resolve and library are mutually exclusive.");
  const args = ["docs"];
  addFlag(args, "--backend", params.backend);
  addFlag(args, "--library", params.library);
  addFlag(args, "--resolve", params.resolve);
  addFlag(args, "--limit", params.limit);
  addFlag(args, "--tokens", params.tokens);
  args.push("--json", "--", params.query);
  return args;
}

export function registerDocsTool(pi: ExtensionAPI): void {
  pi.registerTool(
    defineTool({
      name: "ketch_docs",
      label: "Ketch Library Docs",
      description: "Resolve library identities and search version-aware library/API documentation through Ketch's Context7 backend.",
      parameters: DocsParams,
      promptSnippet: "ketch_docs: Resolve libraries and fetch curated API documentation through Ketch.",
      promptGuidelines: [
        "Use ketch_docs for library and API documentation; resolve and verify the library identity before querying an ambiguous package name.",
        "If ketch_docs reports a precondition error, ask the user before changing Ketch configuration.",
      ],
      ...ketchRenderers("ketch_docs"),
      async execute(_id, params: DocsArgs, signal, _update, ctx) {
        const process = await runKetch({ cwd: ctx.cwd, args: buildDocsArgs(params), signal, timeoutMs: 60_000 });
        const results = process.stdout.trim()
          ? params.resolve
            ? parseJson<LibraryMatch[]>(process)
            : parseJson<DocsResult[]>(process)
          : [];
        if (!results.length) process.status = "not_found";
        const text = params.resolve
          ? formatLibraryMatches(results as LibraryMatch[])
          : formatDocsResults(results as DocsResult[]);
        const metadata = params.resolve
          ? (results as LibraryMatch[]).map(({ id, title, totalSnippets, trustScore, versions }) => ({ id, title, totalSnippets, trustScore, versions }))
          : (results as DocsResult[]).map(({ library, version, title, breadcrumb, url, source }) => ({ library, version, title, breadcrumb, url, source }));
        return await formatKetchOutput({ process, text, parsed: metadata, resultCount: results.length });
      },
    }),
  );
}
