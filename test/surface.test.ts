import assert from "node:assert/strict";
import test from "node:test";
import { compareSurface, emittedSurfaces, runSurfaceProbe, type SpawnOutcome } from "../scripts/ketch-surface.js";

function helpFor(flags: readonly string[]): string {
  return flags.join("\n");
}

test("SC-e01s01-P0-01 help match passes", () => {
  const checks = emittedSurfaces().map((surface) => ({
    command: surface.command,
    help: helpFor(surface.flags),
    flags: surface.flags,
  }));
  assert.equal(compareSurface({ checks, validationCode: 2 }).kind, "pass");
});

test("SC-e01s01-P0-02 missing flag fails", () => {
  const search = emittedSurfaces().find((surface) => surface.command === "search");
  assert.ok(search);
  assert.ok(search.flags.includes("--trim"));
  const result = compareSurface({
    checks: [{ command: "search", help: helpFor(search.flags.filter((flag) => flag !== "--trim")), flags: search.flags }],
    validationCode: 2,
  });
  assert.equal(result.kind, "fail");
  if (result.kind === "fail") assert.match(result.detail, /--trim/);
});

test("SC-e01s01-P0-03 missing binary", async () => {
  const result = await runSurfaceProbe(async () => ({ kind: "missing" }));
  assert.equal(result.kind, "precondition");
  assert.equal(result.exitCode, 5);
  assert.match(result.message, /precondition/);
});

test("SC-e01s01-P0-04 validation exit", async () => {
  const surfaces = emittedSurfaces();
  const spawn = async (args: readonly string[]): Promise<SpawnOutcome> => {
    if (args[0] === "search" && args.includes("--json") && !args.includes("--help")) {
      return { kind: "exit", code: 0, stdout: "", stderr: "" };
    }
    const surface = surfaces.find((item) => item.command === args[0]);
    return { kind: "exit", code: 0, stdout: surface ? helpFor(surface.flags) : "", stderr: "" };
  };
  const result = await runSurfaceProbe(spawn);
  assert.equal(result.kind, "fail");
  assert.equal(result.exitCode, 1);
  if (result.kind === "fail") assert.match(result.message, /expected exit 2, got 0/);
});
