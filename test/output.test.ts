import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { KetchProcessResult } from "../src/ketch.js";
import { formatKetchOutput, parseJson } from "../src/output.js";

const processResult: KetchProcessResult = {
  command: "ketch search x --json",
  bin: "ketch",
  args: ["search", "x", "--json"],
  cwd: process.cwd(),
  stdout: "[]",
  stderr: "",
  code: 0,
  status: "ok",
  durationMs: 1,
};

test("parses valid JSON and rejects invalid JSON", () => {
  assert.deepEqual(parseJson<unknown[]>(processResult), []);
  assert.throws(() => parseJson({ ...processResult, stdout: "not json" }), /invalid JSON/);
});

test("truncates visible output and saves the full result", async () => {
  const text = Array.from({ length: 20 }, (_, i) => `line ${i}`).join("\n");
  const result = await formatKetchOutput({ process: processResult, text, maxLines: 5, maxBytes: 1000 });
  assert.equal(result.details.truncated, true);
  assert.ok(result.details.fullOutputPath);
  assert.equal(await readFile(result.details.fullOutputPath, "utf8"), text);
  assert.match(result.content[0].text, /Output truncated/);
});

test("normalizes empty not-found output", async () => {
  const result = await formatKetchOutput({ process: { ...processResult, status: "not_found", code: 3 }, text: "" });
  assert.equal(result.content[0].text, "No results found.");
});
