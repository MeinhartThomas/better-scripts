import * as vscode from "vscode";
import * as path from "path";

export type PackageManager = "bun" | "pnpm" | "yarn" | "npm";

const LOCKFILE_MAP: [string, PackageManager][] = [
  ["bun.lockb", "bun"],
  ["bun.lock", "bun"],
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["package-lock.json", "npm"],
];

const VALID_PMS = new Set<string>(["bun", "pnpm", "yarn", "npm"]);

async function parsePackageManagerField(
  packageJsonUri: vscode.Uri,
): Promise<PackageManager | undefined> {
  try {
    const raw = await vscode.workspace.fs.readFile(packageJsonUri);
    const pkg = JSON.parse(Buffer.from(raw).toString("utf-8"));
    if (typeof pkg.packageManager === "string") {
      const name = pkg.packageManager.split("@")[0];
      if (VALID_PMS.has(name)) {
        return name as PackageManager;
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

async function fileExists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect the package manager for a specific package.json by walking up from
 * its directory to the workspace root, checking for lockfiles and the
 * `packageManager` field at each level.
 */
export async function detectPackageManagerForPath(
  packageJsonUri: vscode.Uri,
): Promise<PackageManager> {
  const folder = vscode.workspace.getWorkspaceFolder(packageJsonUri);
  const rootPath = folder?.uri.fsPath;
  let dir = path.dirname(packageJsonUri.fsPath);

  while (true) {
    for (const [lockfile, pm] of LOCKFILE_MAP) {
      if (await fileExists(vscode.Uri.file(path.join(dir, lockfile)))) {
        return pm;
      }
    }

    const pkgJsonUri = vscode.Uri.file(path.join(dir, "package.json"));
    const fromField = await parsePackageManagerField(pkgJsonUri);
    if (fromField) {
      return fromField;
    }

    if (!rootPath || dir === rootPath || dir === path.dirname(dir)) {
      break;
    }
    dir = path.dirname(dir);
  }

  return "npm";
}
