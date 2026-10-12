import { describe, it, expect, vi } from "vitest";
import * as vscode from "vscode";
import { PlaybookCodeLensProvider } from "@src/features/playbookCodeLens";
import { AnsibleCommands } from "@src/definitions/constants";

vi.mock("vscode", () => ({
  Range: class {
    constructor(
      public startLine: number,
      public startChar: number,
      public endLine: number,
      public endChar: number,
    ) {}
  },
  CodeLens: class {
    constructor(
      public range: unknown,
      public command: unknown,
    ) {}
  },
  Uri: { file: (fsPath: string) => ({ fsPath }) },
}));

const provider = new PlaybookCodeLensProvider();
function document(text: string) {
  return {
    uri: vscode.Uri.file("/workspace/infra/site.yml"),
    getText: () => text,
  } as vscode.TextDocument;
}

describe("PlaybookCodeLensProvider", () => {
  it.each([
    "---\n- name: Check DNS\n  hosts: all\n  tasks: []",
    "- hosts: all\n  tasks: []\n- hosts: web\n  tasks: []",
    "- hosts: all\n  vars: { secret: !vault encrypted }",
  ])("offers one whole-playbook action for %s", (text) => {
    const doc = document(text);
    const lenses = provider.provideCodeLenses(doc);
    expect(lenses).toHaveLength(1);
    expect(lenses[0].command).toEqual({
      title: "▶ Run Playbook",
      command: AnsibleCommands.ANSIBLE_PLAYBOOK_RUN,
      arguments: [doc.uri],
    });
    expect(lenses[0].range).toEqual(new vscode.Range(0, 0, 0, 0));
  });

  it.each([
    "",
    "---",
    "a: b",
    "- name: Task\n  ansible.builtin.debug: { msg: hi }",
    "- hosts: [broken",
    "- name: Service\n  hosts_file: /etc/hosts",
  ])("does not offer a runner for vars, tasks or invalid YAML: %s", (text) => {
    expect(provider.provideCodeLenses(document(text))).toEqual([]);
  });
});
