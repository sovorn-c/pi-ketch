import { spawn } from "node:child_process";
import { resolveKetchBinary } from "../src/ketch.js";
import { buildCodeArgs } from "../src/tools/code.js";
import { buildCrawlArgs } from "../src/tools/crawl.js";
import { buildDocsArgs } from "../src/tools/docs.js";
import { buildScrapeArgs } from "../src/tools/scrape.js";
import { buildSearchArgs } from "../src/tools/search.js";

const PRECONDITION = "precondition: ketch binary was not found";

export type SpawnOutcome =
  | { kind: "missing" }
  | { kind: "exit"; code: number; stdout: string; stderr: string };

export type ProbeResult =
  | { kind: "pass"; exitCode: 0; message: string }
  | { kind: "fail"; exitCode: 1; message: string }
  | { kind: "precondition"; exitCode: 5; message: string };

type HelpCheck = { command: string; help: string; flags: readonly string[] };

type CompareResult = { kind: "pass" } | { kind: "fail"; detail: string };

export function flagsInArgv(args: readonly string[]): string[] {
  const flags: string[] = [];
  for (const arg of args) {
    if (arg === "--") break;
    if (!arg.startsWith("--")) continue;
    const eq = arg.indexOf("=");
    const flag = eq === -1 ? arg : arg.slice(0, eq);
    if (!flags.includes(flag)) flags.push(flag);
  }
  return flags;
}

/** Every long flag a max-surface builder call emits. Scrape and docs need two calls; one call throws. */
export function emittedSurfaces(): { command: string; flags: string[] }[] {
  const grouped: Record<string, string[][]> = {
    search: [
      buildSearchArgs({
        query: "q",
        backend: "brave",
        limit: 1,
        scrape: true,
        trim: true,
        maxChars: 1,
        searxngUrl: "https://searx.example",
      }),
      buildSearchArgs({ query: "q", allBackends: true }),
    ],
    scrape: [
      buildScrapeArgs({
        url: "https://example.com",
        selector: "main",
        trim: true,
        maxChars: 1,
        noCache: true,
        forceBrowser: true,
        noLlmsTxt: true,
        concurrency: 1,
      }),
      buildScrapeArgs({
        url: "https://example.com",
        raw: true,
        noCache: true,
        forceBrowser: true,
        noLlmsTxt: true,
        concurrency: 1,
      }),
    ],
    crawl: [
      buildCrawlArgs({
        url: "https://example.com",
        depth: 1,
        concurrency: 1,
        allow: ["/docs"],
        deny: ["logout"],
        sitemap: true,
        noCache: true,
      }),
    ],
    code: [buildCodeArgs({ query: "q", backend: "grepapp", lang: "go", limit: 1, regex: true })],
    docs: [
      buildDocsArgs({ query: "q", backend: "context7", library: "/org/lib", limit: 1, tokens: 100 }),
      buildDocsArgs({ query: "q", resolve: true, limit: 1 }),
    ],
  };
  return Object.entries(grouped).map(([command, argvs]) => ({
    command,
    flags: [...new Set(argvs.flatMap(flagsInArgv))],
  }));
}

export function compareSurface(input: { checks: readonly HelpCheck[]; validationCode: number }): CompareResult {
  const missing: string[] = [];
  for (const check of input.checks) {
    for (const flag of check.flags) {
      if (!check.help.includes(flag)) missing.push(`${check.command} ${flag}`);
    }
  }
  const problems: string[] = [];
  if (missing.length > 0) problems.push(`missing ${missing.join(", ")}`);
  if (input.validationCode !== 2) problems.push(`expected exit 2, got ${input.validationCode}`);
  if (problems.length === 0) return { kind: "pass" };
  return { kind: "fail", detail: problems.join("; ") };
}

export async function runSurfaceProbe(spawnKetch: (args: readonly string[]) => Promise<SpawnOutcome>): Promise<ProbeResult> {
  const checks: HelpCheck[] = [];
  for (const surface of emittedSurfaces()) {
    const help = await spawnKetch([surface.command, "--help"]);
    if (help.kind === "missing") return { kind: "precondition", exitCode: 5, message: PRECONDITION };
    if (help.code !== 0) return { kind: "fail", exitCode: 1, message: `${surface.command} --help exited ${help.code}` };
    checks.push({ command: surface.command, help: `${help.stdout}\n${help.stderr}`, flags: surface.flags });
  }
  const validation = await spawnKetch(["search", "--json"]);
  if (validation.kind === "missing") return { kind: "precondition", exitCode: 5, message: PRECONDITION };
  const compared = compareSurface({ checks, validationCode: validation.code });
  if (compared.kind === "pass") return { kind: "pass", exitCode: 0, message: "pass" };
  return { kind: "fail", exitCode: 1, message: compared.detail };
}

function spawnReal(args: readonly string[]): Promise<SpawnOutcome> {
  const bin = resolveKetchBinary();
  return new Promise((resolve) => {
    let settled = false;
    const finish = (outcome: SpawnOutcome): void => {
      if (settled) return;
      settled = true;
      resolve(outcome);
    };
    const child = spawn(bin, [...args], { stdio: ["ignore", "pipe", "pipe"], signal: AbortSignal.timeout(20_000) });
    let stdout = "";
    let stderr = "";
    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    child.stdout?.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr?.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", (err: NodeJS.ErrnoException) => {
      finish(err.code === "ENOENT" ? { kind: "missing" } : { kind: "exit", code: 1, stdout, stderr: err.message });
    });
    child.on("close", (code) => {
      finish({ kind: "exit", code: code ?? 1, stdout, stderr });
    });
  });
}

const entry = process.argv[1];
if (entry?.endsWith("ketch-surface.ts") === true || entry?.endsWith("ketch-surface.js") === true) {
  const result = await runSurfaceProbe(spawnReal);
  if (result.message) console.error(result.message);
  process.exit(result.exitCode);
}
