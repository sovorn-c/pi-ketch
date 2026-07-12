import { spawn } from "node:child_process";

export type KetchStatus =
  | "ok"
  | "not_found"
  | "validation"
  | "upstream"
  | "precondition"
  | "cancelled"
  | "partial"
  | "error";

export interface RunKetchOptions {
  cwd: string;
  args: string[];
  signal?: AbortSignal;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

export interface KetchProcessResult {
  command: string;
  bin: string;
  args: string[];
  cwd: string;
  stdout: string;
  stderr: string;
  code: number;
  status: KetchStatus;
  durationMs: number;
  termination?: "timeout" | "abort";
}

export interface CrawlRunOptions extends RunKetchOptions {
  maxPages: number;
  maxChars: number;
}

export interface CrawlPage {
  url: string;
  title?: string;
  words?: number;
  status?: string;
  source?: string;
  body: string;
}

export interface CrawlRunResult extends KetchProcessResult {
  pages: CrawlPage[];
  parseErrors: string[];
  stopped?: "max_pages" | "timeout";
}

export class KetchError extends Error {
  constructor(
    message: string,
    readonly result: KetchProcessResult,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "KetchError";
  }
}

export function resolveKetchBinary(env: NodeJS.ProcessEnv = process.env): string {
  return env.KETCH_BIN?.trim() || "ketch";
}

export function buildKetchEnv(base: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  return { ...base, NO_COLOR: "1", TERM: "dumb" };
}

function shellQuote(value: string): string {
  return /^[A-Za-z0-9_./:@=,+-]+$/.test(value) ? value : JSON.stringify(value);
}

export function formatCommand(bin: string, args: string[]): string {
  return [bin, ...args].map(shellQuote).join(" ");
}

export function statusForExitCode(code: number): KetchStatus {
  switch (code) {
    case 0:
      return "ok";
    case 2:
      return "validation";
    case 3:
      return "not_found";
    case 4:
      return "upstream";
    case 5:
      return "precondition";
    case 6:
      return "cancelled";
    default:
      return "error";
  }
}

function missingBinaryMessage(): string {
  return [
    "Ketch is unavailable because the `ketch` command was not found.",
    "Install it with `brew install 1broseidon/tap/ketch`, put it on PATH, or set KETCH_BIN.",
  ].join("\n");
}

function failureMessage(result: KetchProcessResult): string {
  const hint = result.stderr.trim() || result.stdout.trim();
  const lead: Record<KetchStatus, string> = {
    ok: "Ketch completed",
    not_found: "Ketch found no matching resource",
    validation: "Ketch rejected the request",
    upstream: "Ketch's upstream backend failed",
    precondition: "Ketch requires operator setup",
    cancelled: "Ketch was cancelled",
    partial: "Ketch stopped with partial results",
    error: "Ketch failed",
  };
  return `${lead[result.status]} (exit ${result.code}).${hint ? `\n${hint}` : ""}`;
}

export async function runKetch(options: RunKetchOptions): Promise<KetchProcessResult> {
  const bin = resolveKetchBinary(options.env);
  const result = await runChild({ ...options, bin });
  if (result.code === 0 || result.code === 3) return result;
  throw new KetchError(failureMessage(result), result);
}

interface ChildOptions extends RunKetchOptions {
  bin: string;
  onStdoutChunk?: (chunk: string, child: ReturnType<typeof spawn>) => void;
  captureStdout?: boolean;
}

async function runChild(options: ChildOptions): Promise<KetchProcessResult> {
  const command = formatCommand(options.bin, options.args);
  const started = Date.now();
  if (options.signal?.aborted) {
    const result: KetchProcessResult = {
      command,
      bin: options.bin,
      args: [...options.args],
      cwd: options.cwd,
      stdout: "",
      stderr: "",
      code: 6,
      status: "cancelled",
      durationMs: 0,
      termination: "abort",
    };
    throw new KetchError("Ketch was cancelled before it started.", result);
  }

  return await new Promise<KetchProcessResult>((resolve, reject) => {
    const child = spawn(options.bin, options.args, {
      cwd: options.cwd,
      env: buildKetchEnv(options.env),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;

    const snapshot = (code: number): KetchProcessResult => ({
      command,
      bin: options.bin,
      args: [...options.args],
      cwd: options.cwd,
      stdout,
      stderr,
      code,
      status: statusForExitCode(code),
      durationMs: Date.now() - started,
    });

    const cleanup = () => {
      options.signal?.removeEventListener("abort", onAbort);
      if (timer) clearTimeout(timer);
    };
    const finishReject = (error: unknown, code: number) => {
      if (settled) return;
      settled = true;
      cleanup();
      const cause = error as NodeJS.ErrnoException;
      const result = snapshot(code);
      const message = cause.code === "ENOENT" ? missingBinaryMessage() : cause.message || failureMessage(result);
      reject(new KetchError(message, result, error));
    };
    const terminate = () => {
      child.kill("SIGTERM");
      const killTimer = setTimeout(() => child.kill("SIGKILL"), 500);
      killTimer.unref();
    };
    const onAbort = () => {
      if (settled) return;
      terminate();
    };
    const timer = options.timeoutMs
      ? setTimeout(() => {
          if (settled) return;
          timedOut = true;
          terminate();
        }, options.timeoutMs)
      : undefined;

    options.signal?.addEventListener("abort", onAbort, { once: true });
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      if (options.captureStdout !== false) stdout += chunk;
      options.onStdoutChunk?.(chunk, child);
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", (error: NodeJS.ErrnoException) => finishReject(error, error.code === "ENOENT" ? 127 : 1));
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      cleanup();
      const aborted = options.signal?.aborted;
      const exitCode = aborted ? 6 : timedOut ? 6 : (code ?? 1);
      const result = snapshot(exitCode);
      if (aborted) result.termination = "abort";
      else if (timedOut) result.termination = "timeout";
      if (aborted) {
        reject(new KetchError("Ketch was cancelled.", result));
      } else {
        resolve(result);
      }
    });
  });
}

function truncateCharacters(value: string, maxChars: number): string {
  if (maxChars <= 0 || value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}\n\n[truncated]`;
}

export async function runKetchCrawl(options: CrawlRunOptions): Promise<CrawlRunResult> {
  const bin = resolveKetchBinary(options.env);
  const pages: CrawlPage[] = [];
  const parseErrors: string[] = [];
  let buffered = "";
  let stopped: CrawlRunResult["stopped"];

  const parseLine = (line: string, child?: ReturnType<typeof spawn>) => {
    const trimmed = line.trim();
    if (!trimmed || pages.length >= options.maxPages) return;
    try {
      const parsed = JSON.parse(trimmed) as Partial<CrawlPage> & { body?: unknown; url?: unknown };
      if (typeof parsed.url !== "string" || typeof parsed.body !== "string") {
        parseErrors.push(`Invalid crawl record: ${trimmed.slice(0, 240)}`);
        return;
      }
      pages.push({
        url: parsed.url,
        title: typeof parsed.title === "string" ? parsed.title : undefined,
        words: typeof parsed.words === "number" ? parsed.words : undefined,
        status: typeof parsed.status === "string" ? parsed.status : undefined,
        source: typeof parsed.source === "string" ? parsed.source : undefined,
        body: truncateCharacters(parsed.body, options.maxChars),
      });
      if (pages.length >= options.maxPages && child) {
        stopped = "max_pages";
        child.kill("SIGTERM");
      }
    } catch {
      parseErrors.push(`Could not parse crawl JSON: ${trimmed.slice(0, 240)}`);
    }
  };

  const result = await runChild({
    ...options,
    bin,
    captureStdout: false,
    onStdoutChunk(chunk, child) {
      buffered += chunk;
      const lines = buffered.split("\n");
      buffered = lines.pop() ?? "";
      for (const line of lines) parseLine(line, child);
    },
  });
  if (buffered.trim()) parseLine(buffered);
  if (!stopped && result.termination === "timeout") stopped = "timeout";
  const status: KetchStatus = stopped ? "partial" : result.status;
  const crawlResult: CrawlRunResult = { ...result, status, pages, parseErrors, stopped };
  if (result.code !== 0 && !stopped) throw new KetchError(failureMessage(crawlResult), crawlResult);
  return crawlResult;
}
