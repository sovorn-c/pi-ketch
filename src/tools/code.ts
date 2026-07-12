import { defineTool, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { formatCodeResults, type CodeResult } from "../format.js";
import { runKetch } from "../ketch.js";
import { formatKetchOutput, parseJson } from "../output.js";
import { ketchRenderers } from "../render.js";
import { CodeParams, type CodeArgs } from "../schemas.js";
import { addFlag } from "./common.js";

export function buildCodeArgs(params: CodeArgs): string[] {
  if (params.regex && params.backend === "github") throw new Error("ketch_code: regex is unsupported by the GitHub backend; use grepapp or sourcegraph.");
  const args = ["code"];
  addFlag(args, "--backend", params.backend);
  addFlag(args, "--lang", params.lang);
  addFlag(args, "--limit", params.limit);
  addFlag(args, "--regex", params.regex);
  args.push("--json", "--", params.query);
  return args;
}

export function registerCodeTool(pi: ExtensionAPI): void {
  pi.registerTool(
    defineTool({
      name: "ketch_code",
      label: "Ketch Public Code Search",
      description: "Search public open-source repositories through Ketch's grep.app, Sourcegraph, or GitHub backends. This is not local repository search.",
      parameters: CodeParams,
      promptSnippet: "ketch_code: Find real-world API usage in public OSS repositories; use local code tools for the current project.",
      promptGuidelines: [
        "Use ketch_code for public OSS examples and real-world API usage, not for searching the current local repository.",
        "Cite the repository URLs returned by ketch_code when drawing conclusions from examples.",
      ],
      ...ketchRenderers("ketch_code"),
      async execute(_id, params: CodeArgs, signal, _update, ctx) {
        const process = await runKetch({ cwd: ctx.cwd, args: buildCodeArgs(params), signal, timeoutMs: 60_000 });
        const results = process.stdout.trim() ? parseJson<CodeResult[]>(process) : [];
        if (!results.length) process.status = "not_found";
        return await formatKetchOutput({
          process,
          text: formatCodeResults(results),
          parsed: results.map(({ repo, path, line, language, stars, url, source }) => ({ repo, path, line, language, stars, url, source })),
          resultCount: results.length,
        });
      },
    }),
  );
}
