import assert from "node:assert/strict";
import { chmod, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { KetchError, runKetch, runKetchCrawl, statusForExitCode } from "../src/ketch.js";

async function fakeKetch(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "pi-ketch-test-"));
  const path = join(dir, "ketch");
  await writeFile(
    path,
    `#!/usr/bin/env node
const mode = process.argv[2];
if (mode === "ok") { console.log(JSON.stringify([{title:"ok"}])); process.exit(0); }
if (mode === "not-found") { process.stderr.write("nothing matched\\n"); process.exit(3); }
if (mode === "precondition") { process.stderr.write("API key not set\\n"); process.exit(5); }
if (mode === "slow") { setTimeout(() => process.exit(0), 10000); }
if (mode === "crawl-fake") {
  let i = 0;
  const timer = setInterval(() => {
    i++;
    const line = JSON.stringify({url:"https://example.com/"+i,title:"Page "+i,words:10,status:"new",source:"http",body:"x".repeat(100)});
    const middle = Math.floor(line.length / 2);
    process.stdout.write(line.slice(0, middle));
    process.stdout.write(line.slice(middle) + "\\n");
    if (i === 10) { clearInterval(timer); process.exit(0); }
  }, 10);
}
`,
    "utf8",
  );
  await chmod(path, 0o755);
  return path;
}

test("maps Ketch exit codes", () => {
  assert.equal(statusForExitCode(0), "ok");
  assert.equal(statusForExitCode(2), "validation");
  assert.equal(statusForExitCode(3), "not_found");
  assert.equal(statusForExitCode(4), "upstream");
  assert.equal(statusForExitCode(5), "precondition");
  assert.equal(statusForExitCode(6), "cancelled");
  assert.equal(statusForExitCode(99), "error");
});

test("runs a configured binary without a shell", async () => {
  const bin = await fakeKetch();
  const result = await runKetch({ cwd: process.cwd(), args: ["ok"], env: { ...process.env, KETCH_BIN: bin } });
  assert.equal(result.code, 0);
  assert.deepEqual(JSON.parse(result.stdout), [{ title: "ok" }]);
  assert.match(result.command, /ketch ok$/);
});

test("returns exit 3 as a not-found result", async () => {
  const bin = await fakeKetch();
  const result = await runKetch({ cwd: process.cwd(), args: ["not-found"], env: { ...process.env, KETCH_BIN: bin } });
  assert.equal(result.status, "not_found");
});

test("throws classified precondition errors with diagnostics", async () => {
  const bin = await fakeKetch();
  await assert.rejects(
    runKetch({ cwd: process.cwd(), args: ["precondition"], env: { ...process.env, KETCH_BIN: bin } }),
    (error: unknown) => {
      assert.ok(error instanceof KetchError);
      assert.equal(error.result.status, "precondition");
      assert.match(error.message, /API key not set/);
      return true;
    },
  );
});

test("reports a missing Ketch executable clearly", async () => {
  await assert.rejects(
    runKetch({ cwd: process.cwd(), args: ["version"], env: { ...process.env, KETCH_BIN: "/definitely/missing/ketch" } }),
    /brew install 1broseidon\/tap\/ketch/,
  );
});

test("honors timeout", async () => {
  const bin = await fakeKetch();
  await assert.rejects(
    runKetch({ cwd: process.cwd(), args: ["slow"], timeoutMs: 25, env: { ...process.env, KETCH_BIN: bin } }),
    (error: unknown) => error instanceof KetchError && error.result.status === "cancelled",
  );
});

test("parses crawl NDJSON incrementally and returns bounded partial pages", async () => {
  const bin = await fakeKetch();
  const result = await runKetchCrawl({
    cwd: process.cwd(),
    args: ["crawl-fake"],
    env: { ...process.env, KETCH_BIN: bin },
    maxPages: 3,
    maxChars: 20,
    timeoutMs: 5_000,
  });
  assert.equal(result.status, "partial");
  assert.equal(result.stopped, "max_pages");
  assert.equal(result.pages.length, 3);
  assert.match(result.pages[0].body, /\[truncated\]/);
  assert.deepEqual(result.parseErrors, []);
});
