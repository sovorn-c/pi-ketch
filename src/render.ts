import { keyHint } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import type { KetchToolResult } from "./output.js";

interface Theme {
  fg(slot: string, text: string): string;
  bold(text: string): string;
}
interface Context {
  lastComponent?: unknown;
  expanded: boolean;
  isError?: boolean;
}
interface ResultOptions {
  expanded: boolean;
  isPartial: boolean;
}

function component(previous: unknown): Text {
  return previous instanceof Text ? previous : new Text("", 0, 0);
}

function compactValue(value: unknown): string | undefined {
  if (value === undefined || value === null || value === false) return undefined;
  const text = typeof value === "string" ? JSON.stringify(value) : JSON.stringify(value);
  return text.length > 72 ? `${text.slice(0, 71)}…` : text;
}

function compactArgs(args: unknown): string {
  if (!args || typeof args !== "object") return "";
  return Object.entries(args)
    .map(([key, value]) => {
      const rendered = compactValue(value);
      return rendered === undefined ? undefined : `${key}=${rendered}`;
    })
    .filter(Boolean)
    .slice(0, 4)
    .join(" ");
}

function hint(): string {
  try {
    return keyHint("app.tools.expand", "to expand");
  } catch {
    return "expand for details";
  }
}

export function ketchRenderers(name: string) {
  return {
    renderCall(args: unknown, theme: Theme, context: Context): Text {
      const text = component(context.lastComponent);
      const title = theme.fg("toolTitle", theme.bold(name));
      if (context.expanded) {
        text.setText(`${title}\n${JSON.stringify(args, null, 2)}`);
      } else {
        const summary = compactArgs(args);
        text.setText(summary ? `${title} ${theme.fg("muted", summary)}` : title);
      }
      return text;
    },
    renderResult(result: unknown, options: ResultOptions, theme: Theme, context: Context): Text {
      const text = component(context.lastComponent);
      if (options.isPartial) {
        text.setText(theme.fg("muted", "Running Ketch…"));
        return text;
      }
      const value = result as KetchToolResult;
      const output = value.content.map((item) => item.text).join("\n");
      if (options.expanded) {
        text.setText(output || theme.fg("muted", "No output"));
        return text;
      }
      const status = context.isError ? "error" : value.details.status;
      const icon = status === "error" ? "✗" : status === "not_found" ? "!" : "✓";
      const color = status === "error" ? "error" : status === "not_found" || status === "partial" ? "warning" : "success";
      const count = value.details.resultCount;
      const failures = value.details.errorCount;
      const parts = [status.replace(/_/g, " ")];
      if (count !== undefined) parts.push(`${count} result${count === 1 ? "" : "s"}`);
      if (failures) parts.push(`${failures} failed`);
      if (value.details.truncated) parts.push("output truncated");
      text.setText(`${theme.fg(color, `${icon} ${parts.join(" · ")}`)} · ${hint()}`);
      return text;
    },
  };
}
