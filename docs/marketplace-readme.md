# Ansible Runner (Community Fork)

Community fork of [ansible/vscode-ansible](https://github.com/ansible/vscode-ansible).
Maintained in [NNN706/vscode-ansible](https://github.com/NNN706/vscode-ansible).
This package is independently maintained and is not an official Red Hat release.

## Run Playbooks

Use **▶ Run Playbook** above the first line of an Ansible playbook. It supports
plays with `hosts` and entry points using `import_playbook`, including fully
qualified builtin/legacy names. Task and vars files do not show this action.
Enable `editor.codeLens` and select Ansible language mode if the link is hidden.

The existing context menu also offers execution via `ansible-navigator`.

## Portable Working Directory

For a multi-root `Lotrepair.code-workspace`:

```json
{
  "folders": [
    { "name": ".", "path": "." },
    { "name": "Ansible", "path": "infra" }
  ],
  "settings": {
    "ansible.runner.workingDirectory": "${workspaceFolder:Ansible}",
    "ansible.ansible.path": ".venv/bin/ansible",
    "ansible.ansibleNavigator.path": ".venv/bin/ansible-navigator",
    "ansible.ansible.reuseTerminal": true
  }
}
```

Relative cwd paths are resolved from the workspace folder of the selected
playbook. `${workspaceFolder}` and `${workspaceFolder:name}` are supported.
An empty setting preserves the upstream terminal default. Invalid directories
are reported before execution. Reuse only selects a terminal created in the
configured directory; close the terminal if you manually change its directory.

## Installation

Disable or uninstall the official `redhat.ansible` extension before enabling
this fork, because their commands and language features overlap. The fork uses
a separate Marketplace ID; previous VSIX builds installed as `redhat.ansible`
will not automatically migrate to it.

Python, Ansible and optional ansible-navigator must be installed in your
workspace/environment. The VSIX includes the extension and language servers,
not Python executables. Upstream cloud integrations are inherited and have not
been certified for this fork's independent publisher identity.

## License and Attribution

The original extension is maintained by Red Hat and the Ansible community.
This fork preserves its MIT license and original copyright notices.
See [LICENSE](https://github.com/NNN706/vscode-ansible/blob/feat/runner-working-directory/LICENSE).
