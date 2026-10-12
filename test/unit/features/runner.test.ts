import { describe, it, expect, vi, beforeEach } from "vitest";
import { existsSync, statSync } from "fs";
import * as vscode from "vscode";
import * as path from "path";

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  statSync: vi.fn(),
}));

vi.mock("vscode", () => ({
  workspace: {
    getConfiguration: vi.fn(),
    getWorkspaceFolder: vi.fn(),
    workspaceFolders: [] as unknown[],
  },
  window: {
    activeTextEditor: undefined,
    showErrorMessage: vi.fn(),
    createTerminal: vi.fn(),
  },
  commands: { registerCommand: vi.fn() },
  languages: { registerCodeLensProvider: vi.fn() },
  Uri: class {
    scheme = "file";
    constructor(public fsPath: string) {}
    static file(p: string) {
      return new this(p);
    }
  },
  EventEmitter: vi.fn(),
}));

vi.mock("@src/services/TerminalService", () => ({
  TerminalService: { getInstance: vi.fn() },
}));

import { TerminalService } from "@src/services/TerminalService";
import { AnsiblePlaybookRunProvider, shellQuote } from "@src/features/runner";

describe("shellQuote", () => {
  it("wraps a simple string in single quotes", () => {
    expect(shellQuote("hello")).toBe("'hello'");
  });

  it("wraps a path with spaces", () => {
    expect(shellQuote("/path/to/my playbook.yml")).toBe(
      "'/path/to/my playbook.yml'",
    );
  });

  it("escapes embedded single quotes", () => {
    expect(shellQuote("it's a test")).toBe("'it'\\''s a test'");
  });

  it("neutralizes dollar-sign command substitution", () => {
    expect(shellQuote("play$(whoami).yml")).toBe("'play$(whoami).yml'");
  });

  it("neutralizes backtick command substitution", () => {
    expect(shellQuote("play`id`.yml")).toBe("'play`id`.yml'");
  });

  it("neutralizes semicolons", () => {
    expect(shellQuote("play;rm -rf /.yml")).toBe("'play;rm -rf /.yml'");
  });

  it("neutralizes pipes", () => {
    expect(shellQuote("play|cat /etc/passwd.yml")).toBe(
      "'play|cat /etc/passwd.yml'",
    );
  });

  it("handles empty string", () => {
    expect(shellQuote("")).toBe("''");
  });

  it("handles paths with multiple spaces", () => {
    expect(shellQuote("/a b/c d/e f.yml")).toBe("'/a b/c d/e f.yml'");
  });
});

describe("validatePlaybookPath (via integration)", () => {
  const mockedExistsSync = vi.mocked(existsSync);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects paths with shell metacharacters", async () => {
    const dangerousPaths = [
      "/tmp/play$(whoami).yml",
      "/tmp/play`id`.yml",
      "/tmp/play;rm -rf /.yml",
      "/tmp/play|cat.yml",
      "/tmp/play&bg.yml",
      "/tmp/play(sub).yml",
      "/tmp/play<in.yml",
      "/tmp/play>out.yml",
      "/tmp/play!bad.yml",
    ];

    for (const p of dangerousPaths) {
      mockedExistsSync.mockReturnValue(true);

      const { SHELL_METACHARACTERS_PATTERN } =
        await import("@src/features/runner");
      expect(
        SHELL_METACHARACTERS_PATTERN.test(p),
        `Expected rejection for: ${p}`,
      ).toBe(true);
    }
  });

  it("accepts safe paths", async () => {
    const safePaths = [
      "/tmp/playbook.yml",
      "/home/user/my-playbook_v2.yml",
      "/path/with spaces/playbook.yml",
      "/path/with.dots/play.book.yml",
    ];

    for (const p of safePaths) {
      const { SHELL_METACHARACTERS_PATTERN } =
        await import("@src/features/runner");
      expect(
        SHELL_METACHARACTERS_PATTERN.test(p),
        `Expected acceptance for: ${p}`,
      ).toBe(false);
    }
  });
});

describe("AnsiblePlaybookRunProvider", () => {
  it("implements Disposable", async () => {
    const { AnsiblePlaybookRunProvider } = await import("@src/features/runner");
    const provider = new AnsiblePlaybookRunProvider(
      { subscriptions: [] } as never,
      {} as never,
      {} as never,
    );
    expect(provider.dispose).toBeDefined();
    provider.dispose();
  });
});

describe("runner working directory", () => {
  const root = path.resolve("workspace");
  const infra = path.join(root, "infra");
  const playbook = vscode.Uri.file(path.join(infra, "playbooks", "site.yml"));
  let configured: string;

  beforeEach(() => {
    vi.clearAllMocks();
    configured = "";
    const folders = [
      { name: ".", uri: vscode.Uri.file(root), index: 0 },
      { name: "Ansible", uri: vscode.Uri.file(infra), index: 1 },
    ];
    Object.defineProperty(vscode.workspace, "workspaceFolders", {
      value: folders,
      configurable: true,
    });
    vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue(folders[1]);
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn(() => configured),
    } as never);
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(statSync).mockReturnValue({ isDirectory: () => true } as never);
  });

  it("preserves default behavior without checking folders", async () => {
    const { resolveRunnerWorkingDirectory } =
      await import("@src/features/runner");
    expect(resolveRunnerWorkingDirectory(playbook)).toBeUndefined();
    expect(vscode.workspace.getWorkspaceFolder).not.toHaveBeenCalled();
  });

  it.each([
    [".", infra],
    ["../shared", path.join(root, "shared")],
    ["${workspaceFolder}", infra],
    ["${workspaceFolder:Ansible}/playbooks", path.join(infra, "playbooks")],
    ["${workspaceFolder:.}/infra", infra],
    [path.join(root, "with spaces"), path.join(root, "with spaces")],
  ])("resolves %s using the selected resource", async (value, expected) => {
    configured = value;
    const { resolveRunnerWorkingDirectory } =
      await import("@src/features/runner");
    expect(resolveRunnerWorkingDirectory(playbook)?.fsPath).toBe(expected);
    expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(
      "ansible.runner",
      playbook,
    );
  });

  it.each(["${workspaceFolder:Missing}", "${env:HOME}"])(
    "rejects unresolved variables: %s",
    async (value) => {
      configured = value;
      const { resolveRunnerWorkingDirectory } =
        await import("@src/features/runner");
      expect(() => resolveRunnerWorkingDirectory(playbook)).toThrow();
    },
  );

  it("rejects relative paths outside the workspace", async () => {
    configured = ".";
    vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue(undefined);
    const { resolveRunnerWorkingDirectory } =
      await import("@src/features/runner");
    expect(() => resolveRunnerWorkingDirectory(playbook)).toThrow(
      "requires a playbook",
    );
    configured = infra;
    expect(resolveRunnerWorkingDirectory(playbook)?.fsPath).toBe(infra);
  });

  it.each([true, false])(
    "rejects a missing directory or a file (%s)",
    async (exists) => {
      configured = infra;
      vi.mocked(existsSync).mockReturnValue(exists);
      vi.mocked(statSync).mockReturnValue({
        isDirectory: () => false,
      } as never);
      const { resolveRunnerWorkingDirectory } =
        await import("@src/features/runner");
      expect(() => resolveRunnerWorkingDirectory(playbook)).toThrow(
        "not an existing directory",
      );
    },
  );
});

describe("runner command cwd forwarding", () => {
  const cwd = path.resolve("infra");
  const playbook = vscode.Uri.file(path.join(cwd, "site.yml"));
  let createActivatedTerminal: ReturnType<typeof vi.fn>;
  let sendText: ReturnType<typeof vi.fn>;
  let configured: string;

  beforeEach(() => {
    vi.clearAllMocks();
    configured = cwd;
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(statSync).mockReturnValue({ isDirectory: () => true } as never);
    vi.mocked(vscode.workspace.getConfiguration).mockImplementation(
      (section) =>
        ({
          path:
            section === "ansible.ansibleNavigator"
              ? "ansible-navigator"
              : "ansible",
          get: (key: string) =>
            key === "workingDirectory" ? configured : true,
        }) as never,
    );
    sendText = vi.fn();
    createActivatedTerminal = vi.fn().mockResolvedValue({
      terminal: { show: vi.fn(), sendText, dispose: vi.fn() },
    });
    vi.mocked(TerminalService.getInstance).mockReturnValue({
      createActivatedTerminal,
    } as never);
  });

  it.each(["invokeViaAnsiblePlaybook", "invokeViaAnsibleNavigator"])(
    "passes cwd for %s and preserves default behavior",
    async (method) => {
      const provider = new AnsiblePlaybookRunProvider(
        { subscriptions: [] } as never,
        {
          settings: {
            playbook: { arguments: "--check" },
            executionEnvironment: { enabled: false },
          },
        } as never,
        {} as never,
      );
      const runner = provider as unknown as Record<
        string,
        (uri?: vscode.Uri) => Promise<void>
      >;
      await runner[method](playbook);
      expect(createActivatedTerminal).toHaveBeenLastCalledWith({
        name: "Ansible Terminal",
        cwd: expect.objectContaining({ fsPath: cwd }),
        matchCwdOnReuse: true,
        reuseExisting: true,
      });
      expect(sendText).toHaveBeenCalledWith(
        expect.stringContaining(shellQuote(playbook.fsPath)),
      );
      configured = "";
      await runner[method](playbook);
      expect(createActivatedTerminal).toHaveBeenLastCalledWith({
        name: "Ansible Terminal",
        cwd: undefined,
        matchCwdOnReuse: true,
        reuseExisting: true,
      });
      configured = "${workspaceFolder:Missing}";
      Object.defineProperty(vscode.workspace, "workspaceFolders", {
        value: [],
        configurable: true,
      });
      createActivatedTerminal.mockClear();
      sendText.mockClear();
      await runner[method](playbook);
      expect(vscode.window.showErrorMessage).toHaveBeenCalled();
      expect(createActivatedTerminal).not.toHaveBeenCalled();
      expect(sendText).not.toHaveBeenCalled();
    },
  );
});
