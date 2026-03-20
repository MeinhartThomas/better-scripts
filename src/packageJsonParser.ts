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

export function buildPackageLabelMap(
  relativePaths: string[],
): Map<string, string> {
  const result = new Map<string, string>();
  const remaining: { path: string; segments: string[] }[] = [];

  for (const rp of relativePaths) {
    if (rp === "package.json") {
      result.set(rp, "root");
    } else {
      const stripped = rp.replace(/\/package\.json$/, "");
      remaining.push({ path: rp, segments: stripped.split("/") });
    }
  }

  let depth = 1;
  let unresolved = remaining;

  while (unresolved.length > 0) {
    const groups = new Map<string, { path: string; segments: string[] }[]>();

    for (const entry of unresolved) {
      const suffix = entry.segments.slice(-depth).join("/");
      const group = groups.get(suffix);
      if (group) {
        group.push(entry);
      } else {
        groups.set(suffix, [entry]);
      }
    }

    const nextUnresolved: { path: string; segments: string[] }[] = [];

    for (const [suffix, entries] of groups) {
      if (entries.length === 1) {
        result.set(entries[0].path, suffix);
      } else {
        for (const entry of entries) {
          if (depth >= entry.segments.length) {
            result.set(entry.path, entry.segments.join("/"));
          } else {
            nextUnresolved.push(entry);
          }
        }
      }
    }

    unresolved = nextUnresolved;
    depth++;
  }

  return result;
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
