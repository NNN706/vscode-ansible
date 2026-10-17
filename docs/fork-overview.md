# Ansible Runner (NNN706)

Community fork of [ansible/vscode-ansible](https://github.com/ansible/vscode-ansible),
maintained in [NNN706/vscode-ansible](https://github.com/NNN706/vscode-ansible).
This is an independently packaged fork, not an official Red Hat release.

- **Run Playbook** CodeLens above playbooks, including `import_playbook` entry points.
- Portable `ansible.runner.workingDirectory` for multi-root workspaces.
- Existing Ansible language support, validation and navigation.

```json
{
  "ansible.runner.workingDirectory": "${workspaceFolder:Ansible}",
  "ansible.ansible.path": ".venv/bin/ansible",
  "ansible.ansibleNavigator.path": ".venv/bin/ansible-navigator"
}
```

## Install

Install the fork VSIX using **Extensions: Install from VSIX**. Its ID is
`NNN706.ansible-runner`. Disable the old `redhat.ansible` extension, including
previous fork builds using that ID, before enabling this package: their commands
and language features overlap. Existing `ansible.*` workspace settings still apply.
For Remote SSH, install the VSIX on the SSH host.

The package's publisher label comes from its manifest; it is not a verified
Marketplace badge. Builds are delivered through GitHub Actions to
`NNN706/workspace/.vscode/vsix/`.

See [fork release instructions](https://github.com/NNN706/vscode-ansible/blob/feat/fork-identity/docs/fork-release.md)
for the build and deployment workflow. Original MIT license and copyright notices
are preserved. Upstream cloud integrations have not been validated for this
independent extension ID.
