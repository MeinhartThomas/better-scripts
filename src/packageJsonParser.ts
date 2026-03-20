import * as vscode from "vscode";
import type { PackageManager } from "./packageManagerDetector";
import { detectPackageManagerForPath } from "./packageManagerDetector";

export interface ScriptEntry {
  name: string;
  command: string;
  packageJsonUri: vscode.Uri;
  relativePath: string;
  packageManager: PackageManager;
}

export interface PackageJsonEntry {
  uri: vscode.Uri;
  relativePath: string;
  scripts: ScriptEntry[];
  packageManager: PackageManager;
}

export async function findAllPackageJsons(): Promise<PackageJsonEntry[]> {
  const files = await vscode.workspace.findFiles(
    "**/package.json",
    "**/node_modules/**",
  );

  const entries: PackageJsonEntry[] = [];

  for (const uri of files) {
    const parsed = await parsePackageJson(uri);
    if (parsed && parsed.scripts.length > 0) {
      entries.push(parsed);
    }
  }

  entries.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return entries;
}

export async function parsePackageJson(
  uri: vscode.Uri,
): Promise<PackageJsonEntry | undefined> {
  try {
    const raw = await vscode.workspace.fs.readFile(uri);
    const content = Buffer.from(raw).toString("utf-8");
    const pkg = JSON.parse(content);
    const scripts = pkg.scripts;
    const relativePath = getRelativePath(uri);
    const packageManager = await detectPackageManagerForPath(uri);

    if (!scripts || typeof scripts !== "object") {
      return { uri, relativePath, scripts: [], packageManager };
    }

    const scriptEntries: ScriptEntry[] = Object.entries(scripts).map(
      ([name, command]) => ({
        name,
        command: command as string,
        packageJsonUri: uri,
        relativePath,
        packageManager,
      }),
    );

    return { uri, relativePath, scripts: scriptEntries, packageManager };
  } catch {
    return undefined;
  }
}

function getRelativePath(uri: vscode.Uri): string {
  const folder = vscode.workspace.getWorkspaceFolder(uri);
  if (folder) {
    return vscode.workspace.asRelativePath(uri, true);
  }
  return uri.fsPath;
}

export function getPackageLabel(relativePath: string): string {
  return relativePath === "package.json"
    ? "root"
    : relativePath.replace(/\/package\.json$/, "");
}

export function createPackageJsonWatcher(
  onChanged: (uri: vscode.Uri) => void,
): vscode.FileSystemWatcher {
  const watcher = vscode.workspace.createFileSystemWatcher(
    "**/package.json",
    false,
    false,
    false,
  );

  const guard = (uri: vscode.Uri) => {
    if (!uri.fsPath.includes("node_modules")) {
      onChanged(uri);
    }
  };

  watcher.onDidChange(guard);
  watcher.onDidCreate(guard);
  watcher.onDidDelete(guard);

  return watcher;
}
