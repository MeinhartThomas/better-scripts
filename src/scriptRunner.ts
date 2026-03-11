import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import type { PackageManager } from "./packageManagerDetector";
import type { ScriptTreeItem } from "./ScriptTreeItem";

export function runScript(
  item: ScriptTreeItem,
  packageManager: PackageManager
): void {
  const cwd = path.dirname(item.script.packageJsonUri.fsPath);
  const cmd = `${packageManager} run ${item.script.name}`;

  const terminal = vscode.window.createTerminal({
    name: `${item.script.name}`,
    cwd,
  });
  terminal.show();
  terminal.sendText(cmd);
}

export async function debugScript(
  item: ScriptTreeItem,
  packageManager: PackageManager
): Promise<void> {
  const cwd = path.dirname(item.script.packageJsonUri.fsPath);
  const folder = vscode.workspace.getWorkspaceFolder(
    item.script.packageJsonUri
  );

  let runtimeArgs: string[];
  let runtimeExecutable: string;

  switch (packageManager) {
    case "bun":
      runtimeExecutable = "bun";
      runtimeArgs = ["--inspect-brk", "run", item.script.name];
      break;
    case "pnpm":
      runtimeExecutable = "pnpm";
      runtimeArgs = ["run", item.script.name];
      break;
    case "yarn":
      runtimeExecutable = "yarn";
      runtimeArgs = ["run", item.script.name];
      break;
    default:
      runtimeExecutable = "npm";
      runtimeArgs = ["run", item.script.name];
      break;
  }

  const debugConfig: vscode.DebugConfiguration = {
    type: "node",
    request: "launch",
    name: `Debug: ${item.script.name}`,
    runtimeExecutable,
    runtimeArgs,
    cwd,
    console: "integratedTerminal",
    skipFiles: ["<node_internals>/**"],
  };

  await vscode.debug.startDebugging(folder, debugConfig);
}

export async function openScriptInPackageJson(
  item: ScriptTreeItem
): Promise<void> {
  const uri = item.script.packageJsonUri;
  const content = fs.readFileSync(uri.fsPath, "utf-8");

  const scriptPattern = new RegExp(
    `"${escapeRegex(item.script.name)}"\\s*:`
  );
  const lines = content.split("\n");
  let lineIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    if (scriptPattern.test(lines[i])) {
      lineIndex = i;
      break;
    }
  }

  const doc = await vscode.workspace.openTextDocument(uri);
  const editor = await vscode.window.showTextDocument(doc);
  const range = new vscode.Range(lineIndex, 0, lineIndex, lines[lineIndex].length);
  editor.selection = new vscode.Selection(range.start, range.end);
  editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
