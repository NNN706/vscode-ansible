# Fork Releases

The `Fork VSIX` workflow builds the extension on branch pushes and tags in a
fork. It is independent of the upstream CI's Python/container setup and does
not publish to the VS Code Marketplace.

It installs the locked Node dependencies, compiles ALS/MCP and the extension,
runs the runner/CodeLens/terminal unit tests, builds the webview and packages
VSIX. Logs, an ALS tarball, and a ZIP containing VSIX are uploaded as Actions
artifacts. The release job only runs after a successful build and has
`contents: write`; build jobs have read-only repository access.

## Publish a Release

Push a version tag pointing at the tested fork commit:

```sh
git tag fork-v0.0.2
git push origin fork-v0.0.2
```

The tag must use `fork-vMAJOR.MINOR.PATCH`. The workflow validates the version,
uses it for the VSIX manifest and creates a GitHub Release with VSIX, ZIP and
ALS tarball attached. A failed build does not publish a release. Existing
releases are not overwritten. Use a new version/tag for the next release.

Branch pushes build version `0.0.2` as an artifact without publishing a release.
`workflow_dispatch` also builds an artifact with the supplied version; the
workflow must be present on the default branch to be listed for manual runs.

The workflow tests the fork runner features. It does not replace the full
upstream lint/e2e/container test suite or generate Python Content Creator
resources. For complete upstream validation, use the existing CI toolchain.

## Install

Download the `.vsix` from the GitHub Release. In VS Code select **Extensions →
Install from VSIX**, then **Developer: Reload Window**. The build retains the
`redhat.ansible` ID. Disable automatic updates for this extension to retain the
fork build.

Enable `editor.codeLens` and use Ansible language mode. Playbooks with a top-level
list of plays containing `hosts` show **▶ Run Playbook** above their first line.
This action runs the whole file, using `ansible.runner.workingDirectory`.
The YAML schema link is provided by a different extension and can remain next
to this CodeLens; this fork does not remove or replace that link.
