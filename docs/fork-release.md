# Fork Releases

The `Fork VSIX` workflow builds the extension on branch pushes and tags in a
fork. It is independent of the upstream CI's Python/container setup and does
not publish to the VS Code Marketplace.

It installs the locked Node dependencies, compiles ALS/MCP and the extension,
runs the runner/CodeLens/terminal unit tests, builds the webview and packages
VSIX. Logs, an ALS tarball, and a ZIP containing VSIX are uploaded as Actions
artifacts. The release job only runs after a successful build and has
`contents: write`; build jobs have read-only repository access.

## Automatic Releases

Every successful build publishes a GitHub Release with the already built VSIX,
ZIP and ALS tarball. Branch pushes and manual runs automatically use
`build-<workflow run number>` as the release tag, pointing to the exact source
commit. No manually created tag is required. The release is marked **Latest**,
and its notes link to the source commit and workflow run.

Rerunning the same workflow run replaces its same-named assets instead of
skipping publication. Other releases are retained. A failed build does not
publish a release. Existing `fork-vMAJOR.MINOR.PATCH` tag runs remain supported
and use that tag and version.

After every successful build, a separate `deploy` job checks out the private
`NNN706/workspace` repository using the source repository secret
`WORKFLOW_REPO_TOKEN`. Use a fine-grained PAT with **Contents: Read and write**
only for that target repository. Its default branch must allow bot pushes.
The job copies the already built VSIX to `.vscode/vsix/`, replacing only
`ansible-runner-cwd-*.vsix`. Other extension archives and repository files remain
untouched. No commit is created when the files are unchanged.

Deployment jobs from this repository are serialized. Other repositories can still
push concurrently: a rejected push is retried at most three times, fetching
and rebasing between attempts. A rebase conflict fails without forcing a push.
Deployment is independent of the GitHub Release job and does not require a tag.
Rerunning a failed deployment downloads the same build artifact without rebuilding
or replacing GitHub Release assets.

Branch pushes build version `0.0.3`, publish it in GitHub Releases and deploy it
automatically. The run number distinguishes releases without changing the VSIX
version. `workflow_dispatch` builds, publishes and deploys an artifact with the
supplied version; the
workflow must be present on the default branch to be listed for manual runs.

The workflow tests the fork runner features. It does not replace the full
upstream lint/e2e/container test suite or generate Python Content Creator
resources. For complete upstream validation, use the existing CI toolchain.

## Install

Download the `.vsix` from the GitHub Release. In VS Code select **Extensions →
Install from VSIX**, then **Developer: Reload Window**. The fork uses the
`NNN706.vscode-ansible-runner` ID and displays as **Ansible Runner (NNN706)**.
Disable the old `redhat.ansible` extension before enabling the fork because their
commands overlap. Previous VSIX builds using the old ID do not migrate
automatically. Existing `ansible.*` settings remain applicable.

Enable `editor.codeLens` and use Ansible language mode. Playbooks with a top-level
list containing `hosts` or `import_playbook` (including the builtin/legacy fully
qualified forms) show **▶ Run Playbook** above their first line.
This action runs the whole file, using `ansible.runner.workingDirectory`.
The YAML schema link is provided by a different extension and can remain next
to this CodeLens; this fork does not remove or replace that link.
