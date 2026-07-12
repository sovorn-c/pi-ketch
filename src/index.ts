import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerDiagnostics } from "./diagnostics.js";
import { registerCodeTool } from "./tools/code.js";
import { registerCrawlTool } from "./tools/crawl.js";
import { registerDocsTool } from "./tools/docs.js";
import { registerScrapeTool } from "./tools/scrape.js";
import { registerSearchTool } from "./tools/search.js";

export default function ketchExtension(pi: ExtensionAPI): void {
  registerSearchTool(pi);
  registerScrapeTool(pi);
  registerCodeTool(pi);
  registerDocsTool(pi);
  registerCrawlTool(pi);
  registerDiagnostics(pi);
}
