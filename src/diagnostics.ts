import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { KetchError, runKetch } from "./ketch.js";

const MAX_NOTICE_CHARS = 12_000;

function bounded(value: string): string {
  return value.length <= MAX_NOTICE_CHARS ? value : `${value.slice(0, MAX_NOTICE_CHARS)}\n… output truncated`;
}

function runDiagnostic(pi: ExtensionAPI, name: string, args: string[]): void {
  pi.registerCommand(name, {
    description: `Run read-only \`ketch ${args[0]}\` diagnostics`,
    handler: async (_input, ctx) => {
      try {
        const result = await runKetch({ cwd: ctx.cwd, args: [...args, "--json"], timeoutMs: args[0] === "doctor" ? 90_000 : 15_000 });
        const output = result.stdout.trim() || result.stderr.trim() || "No output.";
        ctx.ui.notify(bounded(output), "info");
      } catch (error) {
        if (error instanceof KetchError) {
          const output = [error.result.stdout.trim(), error.result.stderr.trim()].filter(Boolean).join("\n\n");
          ctx.ui.notify(bounded(output || error.message), error.result.status === "precondition" ? "warning" : "error");
          return;
        }
        ctx.ui.notify((error as Error).message, "error");
      }
    },
  });
}

export function registerDiagnostics(pi: ExtensionAPI): void {
  runDiagnostic(pi, "ketch-version", ["version"]);
  runDiagnostic(pi, "ketch-config", ["config"]);
  runDiagnostic(pi, "ketch-doctor", ["doctor"]);
}
