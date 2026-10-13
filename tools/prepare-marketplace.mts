import { readFileSync, writeFileSync } from "node:fs";

// The account-owned publisher is supplied by a trusted repository variable.
const publisher = process.env.MARKETPLACE_PUBLISHER;
if (
  !publisher ||
  !/^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(publisher) ||
  publisher.toLowerCase() === "redhat"
) {
  throw new Error(
    "Set MARKETPLACE_PUBLISHER to your own Marketplace publisher ID.",
  );
}
interface MarketplaceManifest {
  [key: string]: unknown;
  vsce?: Record<string, unknown>;
}
const manifest = JSON.parse(
  readFileSync("package.json", "utf8"),
) as MarketplaceManifest;
manifest.publisher = publisher;
manifest.name = "ansible-runner";
manifest.displayName = "Ansible Runner (Community Fork)";
manifest.description =
  "Community fork of vscode-ansible with portable runner cwd and Run Playbook CodeLens, including imported playbooks.";
manifest.repository = {
  type: "git",
  url: "git+https://github.com/NNN706/vscode-ansible.git",
};
manifest.bugs = { url: "https://github.com/NNN706/vscode-ansible/issues" };
manifest.vsce = { ...manifest.vsce, readmePath: "docs/marketplace-readme.md" };
writeFileSync("package.json", `${JSON.stringify(manifest, null, 2)}\n`);
