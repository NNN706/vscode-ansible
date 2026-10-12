import * as vscode from "vscode";
import { isMap, isSeq, parseDocument } from "yaml";
import { AnsibleCommands } from "@src/definitions/constants";

/** Offer a whole-playbook action, without treating roles or vars as playbooks. */
export class PlaybookCodeLensProvider implements vscode.CodeLensProvider {
  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const yaml = parseDocument(document.getText());
    if (
      yaml.errors.length > 0 ||
      !isSeq(yaml.contents) ||
      !yaml.contents.items.some(
        (play) =>
          isMap(play) &&
          (play.has("hosts") ||
            play.has("import_playbook") ||
            play.has("ansible.builtin.import_playbook") ||
            play.has("ansible.legacy.import_playbook")),
      )
    ) {
      return [];
    }
    return [
      new vscode.CodeLens(new vscode.Range(0, 0, 0, 0), {
        title: "▶ Run Playbook",
        command: AnsibleCommands.ANSIBLE_PLAYBOOK_RUN,
        arguments: [document.uri],
      }),
    ];
  }
}
