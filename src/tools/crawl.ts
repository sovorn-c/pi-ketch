import { defineTool, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { formatScrapePages } from "../format.js";
import { runKetchCrawl } from "../ketch.js";
import { formatKetchOutput } from "../output.js";
import { ketchRenderers } from "../render.js";
import { CrawlParams, type CrawlArgs } from "../schemas.js";
import { addFlag, addListFlag, validateHttpUrl, warningCount } from "./common.js";

export function buildCrawlArgs(params: CrawlArgs): string[] {
  validateHttpUrl(params.url);
  const args = ["crawl", params.url];
  addFlag(args, "--depth", params.depth ?? 3);
  addFlag(args, "--concurrency", params.concurrency ?? 8);
  addListFlag(args, "--allow", params.allow);
  addListFlag(args, "--deny", params.deny);
  addFlag(args, "--sitemap", params.sitemap);
  addFlag(args, "--no-cache", params.noCache);
  args.push("--json");
  return args;
}

export function registerCrawlTool(pi: ExtensionAPI): void {
  pi.registerTool(
    defineTool({
      name: "ketch_crawl",
      label: "Ketch Site Crawl",
      description: "Breadth-first crawl one host through Ketch with Pi-enforced page, depth, per-page character, concurrency, and time bounds. Returns partial pages when a bound is reached.",
      parameters: CrawlParams,
      promptSnippet: "ketch_crawl: Read a bounded set of pages from one site; prefer scrape when one known page is enough.",
      promptGuidelines: [
        "Use ketch_crawl only when multiple pages from one host are required; prefer ketch_scrape for one known page.",
        "Keep ketch_crawl bounded with maxPages and maxChars, and cite the page URLs used in conclusions.",
      ],
      ...ketchRenderers("ketch_crawl"),
      async execute(_id, params: CrawlArgs, signal, _update, ctx) {
        const maxPages = params.maxPages ?? 30;
        const maxChars = params.maxChars ?? 6000;
        const process = await runKetchCrawl({
          cwd: ctx.cwd,
          args: buildCrawlArgs(params),
          signal,
          timeoutMs: 180_000,
          maxPages,
          maxChars,
        });
        const errors = warningCount(process.stderr) + process.parseErrors.length;
        let text = formatScrapePages(process.pages.map((page) => ({ url: page.url, title: page.title, markdown: page.body, source: page.source })));
        const notices = [
          process.stopped ? `Crawl stopped at the ${process.stopped.replace("_", " ")} bound; results are partial.` : undefined,
          ...process.parseErrors,
          process.stderr.trim() || undefined,
        ].filter(Boolean);
        if (notices.length) text += `\n\n## Crawl notices\n\n${notices.join("\n")}`;
        return await formatKetchOutput({
          process,
          text,
          parsed: process.pages.map(({ url, title, words, status, source }) => ({ url, title, words, status, source })),
          resultCount: process.pages.length,
          errorCount: errors,
          stopped: process.stopped,
        });
      },
    }),
  );
}
