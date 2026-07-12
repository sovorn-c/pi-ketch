import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerDiagnostics } from "./diagnostics.js";
import { registerCodeTool } from "./tools/code.js";
import { registerCrawlTool } from "./tools/crawl.js";
import { registerDocsTool } from "./tools/docs.js";
import { registerScrapeTool } from "./tools/scrape.js";
import { registerSearchTool } from "./tools/search.js";

const STATUS_ID = "pi-ketch";

export default function ketchExtension(pi: ExtensionAPI): void {
  registerSearchTool(pi);
  registerScrapeTool(pi);
  registerCodeTool(pi);
  registerDocsTool(pi);
  registerCrawlTool(pi);
  registerDiagnostics(pi);

  pi.on("session_start", (_event, ctx) => {
    const theme = ctx.ui.theme;
    ctx.ui.setStatus(STATUS_ID, `${theme.fg("accent", "🌐 ketch:")} ${theme.fg("success", "active")}`);
  });

  pi.on("session_shutdown", (_event, ctx) => {
    ctx.ui.setStatus(STATUS_ID, undefined);
  });
}
