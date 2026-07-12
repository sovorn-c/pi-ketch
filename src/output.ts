import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  formatSize,
  truncateHead,
  withFileMutationQueue,
  type TruncationResult,
} from "@earendil-works/pi-coding-agent";
import type { KetchProcessResult, KetchStatus } from "./ketch.js";

export interface KetchOutputDetails {
  command: string;
  args: string[];
  cwd: string;
  exitCode: number;
  status: KetchStatus;
  durationMs: number;
  resultCount?: number;
  errorCount?: number;
  stopped?: string;
  parsed?: unknown;
  stderr?: string;
  truncated: boolean;
  truncation?: TruncationResult;
  fullOutputPath?: string;
}

export interface KetchToolResult {
  content: Array<{ type: "text"; text: string }>;
  details: KetchOutputDetails;
}

export interface FormatKetchOutputOptions {
  process: KetchProcessResult;
  text: string;
  parsed?: unknown;
  fullText?: string;
  resultCount?: number;
  errorCount?: number;
  stopped?: string;
  maxBytes?: number;
  maxLines?: number;
}

export async function formatKetchOutput(options: FormatKetchOutputOptions): Promise<KetchToolResult> {
  const details: KetchOutputDetails = {
    command: options.process.command,
    args: [...options.process.args],
    cwd: options.process.cwd,
    exitCode: options.process.code,
    status: options.process.status,
    durationMs: options.process.durationMs,
    resultCount: options.resultCount,
    errorCount: options.errorCount,
    stopped: options.stopped,
    parsed: options.parsed,
    stderr: options.process.stderr.trim() || undefined,
    truncated: false,
  };
  const fullText = options.fullText ?? options.text;
  const truncation = truncateHead(options.text, {
    maxBytes: options.maxBytes ?? DEFAULT_MAX_BYTES,
    maxLines: options.maxLines ?? DEFAULT_MAX_LINES,
  });
  let visible = truncation.content;

  if (truncation.truncated) {
    const dir = await mkdtemp(join(tmpdir(), "pi-ketch-"));
    const fullOutputPath = join(dir, "output.txt");
    await withFileMutationQueue(fullOutputPath, async () => writeFile(fullOutputPath, fullText, "utf8"));
    details.truncated = true;
    details.truncation = truncation;
    details.fullOutputPath = fullOutputPath;
    const omittedLines = truncation.totalLines - truncation.outputLines;
    const omittedBytes = truncation.totalBytes - truncation.outputBytes;
    visible += [
      "",
      `[Output truncated: showing ${truncation.outputLines} of ${truncation.totalLines} lines ` +
        `(${formatSize(truncation.outputBytes)} of ${formatSize(truncation.totalBytes)}). ` +
        `${omittedLines} lines (${formatSize(omittedBytes)}) omitted. Full output: ${fullOutputPath}]`,
    ].join("\n");
  }

  if (!visible.trim()) visible = options.process.status === "not_found" ? "No results found." : "No output.";
  return { content: [{ type: "text", text: visible }], details };
}

export function parseJson<T>(result: KetchProcessResult): T {
  try {
    return JSON.parse(result.stdout) as T;
  } catch (error) {
    throw new Error(`Ketch returned invalid JSON for ${result.command}: ${(error as Error).message}`);
  }
}
