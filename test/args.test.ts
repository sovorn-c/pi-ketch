import assert from "node:assert/strict";
import test from "node:test";
import { buildCodeArgs } from "../src/tools/code.js";
import { buildCrawlArgs } from "../src/tools/crawl.js";
import { buildDocsArgs } from "../src/tools/docs.js";
import { buildScrapeArgs } from "../src/tools/scrape.js";
import { buildSearchArgs } from "../src/tools/search.js";

test("builds bounded search arguments", () => {
  assert.deepEqual(buildSearchArgs({ query: "hello", scrape: true }), ["search", "--scrape", "--max-chars", "6000", "--json", "--", "hello"]);
  assert.deepEqual(buildSearchArgs({ query: "--help" }), ["search", "--json", "--", "--help"]);
  assert.deepEqual(buildSearchArgs({ query: "deep research", allBackends: true }), ["search", "--multi=all", "--json", "--", "deep research"]);
  assert.throws(() => buildSearchArgs({ query: "x", backend: "brave", multi: ["ddg"] }), /mutually exclusive/);
  assert.throws(() => buildSearchArgs({ query: "x", multi: ["brave", "ddg"], allBackends: true }), /mutually exclusive/);
});

test("validates code backend regex support", () => {
  assert.throws(() => buildCodeArgs({ query: "x", backend: "github", regex: true }), /unsupported/);
  assert.deepEqual(buildCodeArgs({ query: "x", lang: "go", limit: 2 }), ["code", "--lang", "go", "--limit", "2", "--json", "--", "x"]);
});

test("validates docs modes", () => {
  assert.throws(() => buildDocsArgs({ query: "react", resolve: true, library: "/facebook/react" }), /mutually exclusive/);
});

test("validates scrape unions, schemes, and incompatible flags", () => {
  assert.throws(() => buildScrapeArgs({}), /exactly one/);
  assert.throws(() => buildScrapeArgs({ url: "https://example.com", urls: ["https://example.org"] }), /exactly one/);
  assert.throws(() => buildScrapeArgs({ url: "file:///etc/passwd" }), /http or https/);
  assert.throws(() => buildScrapeArgs({ url: "https://example.com", raw: true, trim: true }), /cannot be combined/);
  assert.deepEqual(buildScrapeArgs({ url: "https://example.com" }), ["scrape", "https://example.com", "--max-chars", "6000", "--json"]);
});

test("builds bounded crawl arguments and validates URL schemes", () => {
  assert.throws(() => buildCrawlArgs({ url: "ftp://example.com" }), /http or https/);
  assert.deepEqual(buildCrawlArgs({ url: "https://example.com", allow: ["/docs", "/api"] }), [
    "crawl",
    "https://example.com",
    "--depth",
    "3",
    "--concurrency",
    "8",
    "--allow",
    "/docs,/api",
    "--json",
  ]);
});
