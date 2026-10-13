import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PROJECT_ROOT } from "@test/setup";

let directory: string;
const script = join(PROJECT_ROOT, "tools", "prepare-marketplace.mts");
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "marketplace-test-"));
  writeFileSync(
    join(directory, "package.json"),
    JSON.stringify({
      name: "ansible",
      publisher: "redhat",
      dependencies: { yaml: "1" },
      vsce: { dependencies: false },
    }),
  );
});
afterEach(() => rmSync(directory, { recursive: true, force: true }));
function prepare(publisher: string) {
  return execFileSync(process.execPath, [script], {
    cwd: directory,
    env: { ...process.env, MARKETPLACE_PUBLISHER: publisher },
    stdio: "pipe",
  });
}
describe("Marketplace identity preparation", () => {
  it("creates a distinct fork identity and preserves dependencies", () => {
    prepare("test-publisher");
    const manifest = JSON.parse(
      readFileSync(join(directory, "package.json"), "utf8"),
    );
    expect(manifest.publisher).toBe("test-publisher");
    expect(manifest.name).toBe("ansible-runner");
    expect(manifest.dependencies).toEqual({ yaml: "1" });
    expect(manifest.vsce).toEqual({
      dependencies: false,
      readmePath: "docs/marketplace-readme.md",
    });
    expect(manifest.repository.url).toContain("NNN706/vscode-ansible");
  });
  it.each(["", "redhat", "RedHat", "../../redhat", "bad.publisher"])(
    "rejects an absent, upstream or invalid publisher (%s)",
    (publisher) => {
      expect(() => prepare(publisher)).toThrow();
      expect(
        JSON.parse(readFileSync(join(directory, "package.json"), "utf8"))
          .publisher,
      ).toBe("redhat");
    },
  );
});
