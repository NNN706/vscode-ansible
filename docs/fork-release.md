# Fork Releases

The `Fork VSIX` workflow builds the extension on branch pushes and tags in a
fork. It is independent of the upstream CI's Python/container setup. Separate
tag prefixes select GitHub Releases or VS Code Marketplace publication.

It installs the locked Node dependencies, compiles ALS/MCP and the extension,
runs the runner/CodeLens/terminal unit tests, builds the webview and packages
VSIX. Logs, an ALS tarball, and a ZIP containing VSIX are uploaded as Actions
artifacts. The release job only runs after a successful build and has
`contents: write`; build jobs have read-only repository access.

## Publish a Release

Push a version tag pointing at the tested fork commit:

```sh
git tag fork-v0.0.3
git push origin fork-v0.0.3
```

The tag must use `fork-vMAJOR.MINOR.PATCH`. The workflow validates the version,
uses it for the VSIX manifest and creates a GitHub Release with VSIX, ZIP and
ALS tarball attached. A failed build does not publish a release. Existing
releases are not overwritten. Use a new version/tag for the next release.

Branch pushes build version `0.0.5` as an artifact without publishing a release.
`workflow_dispatch` also builds an artifact with the supplied version; the
workflow must be present on the default branch to be listed for manual runs.

The workflow tests the fork runner features. It does not replace the full
upstream lint/e2e/container test suite or generate Python Content Creator
resources. For complete upstream validation, use the existing CI toolchain.

## Install

Download the `.vsix` from the GitHub Release. In VS Code select **Extensions →
Install from VSIX**, then **Developer: Reload Window**. Without `VSCE_PUBLISHER`,
the build retains the `redhat.ansible` ID. Disable automatic updates for those
legacy VSIX builds to retain the fork build.

Enable `editor.codeLens` and use Ansible language mode. Playbooks with a top-level
list containing `hosts` or `import_playbook` (including the builtin/legacy fully
qualified forms) show **▶ Run Playbook** above their first line.
This action runs the whole file, using `ansible.runner.workingDirectory`.
The YAML schema link is provided by a different extension and can remain next
to this CodeLens; this fork does not remove or replace that link.

## Marketplace

The independent listing is [Ansible Runner (Community Fork)](https://marketplace.visualstudio.com/items?itemName=nnn706.ansible-runner).
Disable or uninstall `redhat.ansible` before enabling `nnn706.ansible-runner`;
the two extensions register overlapping commands. The new ID receives updates
from its own Marketplace listing. Existing workspace settings remain applicable.

Set repository variable `VSCE_PUBLISHER` to your own publisher ID (`nnn706`
for this fork). The build prepares the package identity and community README
before compilation; the source manifest and upstream lockfile stay unchanged.
The publisher must not be `redhat`. The publishing job validates the downloaded
VSIX publisher, name and version before uploading exactly that tested artifact.

Choose one authentication method for the `marketplace` GitHub environment:

- PAT: set variable `MARKETPLACE_AUTH_MODE=pat` and secret `VSCE_PAT`. Create
  the token in Azure DevOps with only Marketplace **Manage** scope and the
  organization selection required by Microsoft's publishing guide. The token
  owner must be a member of the publisher. Never commit or print the token.
- Microsoft Entra federation: set `MARKETPLACE_AUTH_MODE=entra`, secrets
  `AZURE_CLIENT_ID` and `AZURE_TENANT_ID`, and a federated credential with issuer
  `https://token.actions.githubusercontent.com`, audience `api://AzureADTokenExchange`,
  and subject `repo:NNN706/vscode-ansible:environment:marketplace`. Add that
  application's service principal as a publisher member with publication
  permission. No Azure subscription is required by the login action.

Microsoft is retiring global Azure DevOps PATs on December 1, 2026. Prefer
Entra federation for long-term publishing; see the
[official publishing guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
for current credential requirements. Creating an Azure DevOps organization can
require a linked Azure subscription; this workflow does not create or bill one.

Once authentication is configured, push a new version:

```sh
git tag marketplace-v0.0.5
git push origin marketplace-v0.0.5
```

Only `marketplace-vMAJOR.MINOR.PATCH` tags publish to Marketplace. Branch pushes
and manual runs build artifacts; `fork-v*` tags create GitHub Releases. Builds
must pass before publication. Do not reuse versions; `--skip-duplicate` makes
rerunning an already published version safe. Configure environment reviewers
or tag restrictions in GitHub if publication needs an approval gate.
