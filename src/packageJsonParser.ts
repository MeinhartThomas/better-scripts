import * as vscode from "vscode";
import * as fs from "fs";

export interface ScriptEntry {
  name: string;
  command: string;
  packageJsonUri: vscode.Uri;
  /** Relative path from workspace root to the package.json */
  relativePath: string;
}

export interface PackageJsonEntry {
  uri: vscode.Uri;
  relativePath: string;
  scripts: ScriptEntry[];
}

export async function findAllPackageJsons(): Promise<PackageJsonEntry[]> {
  const files = await vscode.workspace.findFiles(
    "**/package.json",
    "**/node_modules/**"
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
  uri: vscode.Uri
): Promise<PackageJsonEntry | undefined> {
  try {
    const content = fs.readFileSync(uri.fsPath, "utf-8");
    const pkg = JSON.parse(content);
    const scripts = pkg.scripts;
    if (!scripts || typeof scripts !== "object") {
      return { uri, relativePath: getRelativePath(uri), scripts: [] };
    }

    const relativePath = getRelativePath(uri);
    const scriptEntries: ScriptEntry[] = Object.entries(scripts).map(
      ([name, command]) => ({
        name,
        command: command as string,
        packageJsonUri: uri,
        relativePath,
      })
    );

    return { uri, relativePath, scripts: scriptEntries };
  } catch {
    return undefined;
  }
}

function getRelativePath(uri: vscode.Uri): string {
  const folder = vscode.workspace.getWorkspaceFolder(uri);
  if (folder) {
    const rel = vscode.workspace.asRelativePath(uri, false);
    return rel;
  }
  return uri.fsPath;
}

export function createPackageJsonWatcher(
  onChanged: () => void
): vscode.FileSystemWatcher {
  const watcher = vscode.workspace.createFileSystemWatcher(
    "**/package.json",
    false,
    false,
    false
  );

  watcher.onDidChange(onChanged);
  watcher.onDidCreate(onChanged);
  watcher.onDidDelete(onChanged);

  return watcher;
}
