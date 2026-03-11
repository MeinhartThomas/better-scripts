import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export type PackageManager = "bun" | "pnpm" | "yarn" | "npm";

const LOCKFILE_MAP: [string, PackageManager][] = [
  ["bun.lockb", "bun"],
  ["bun.lock", "bun"],
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["package-lock.json", "npm"],
];

function parsePackageManagerField(
  packageJsonPath: string
): PackageManager | undefined {
  try {
    const content = fs.readFileSync(packageJsonPath, "utf-8");
    const pkg = JSON.parse(content);
    if (typeof pkg.packageManager === "string") {
      const name = pkg.packageManager.split("@")[0];
      if (["bun", "pnpm", "yarn", "npm"].includes(name)) {
        return name as PackageManager;
      }
    }
  } catch {
    // ignore parse errors
  }
  return undefined;
}

export async function detectPackageManager(
  workspaceFolder: vscode.WorkspaceFolder
): Promise<PackageManager> {
  const root = workspaceFolder.uri.fsPath;

  for (const [lockfile, pm] of LOCKFILE_MAP) {
    const lockPath = path.join(root, lockfile);
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(lockPath));
      return pm;
    } catch {
      // file doesn't exist, continue
    }
  }

  const rootPkgJson = path.join(root, "package.json");
  const fromField = parsePackageManagerField(rootPkgJson);
  if (fromField) {
    return fromField;
  }

  return "npm";
}
