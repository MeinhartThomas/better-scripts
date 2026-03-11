import * as vscode from "vscode";
import * as path from "path";
import type { ScriptTreeItem } from "./ScriptTreeItem";

const terminalCache = new Map<string, vscode.Terminal>();

vscode.window.onDidCloseTerminal((closed) => {
  for (const [key, terminal] of terminalCache) {
    if (terminal === closed) {
      terminalCache.delete(key);
      break;
    }
  }
});

function getTerminalKey(item: ScriptTreeItem): string {
  return `${item.script.packageJsonUri.fsPath}::${item.script.name}`;
}

export function runScript(item: ScriptTreeItem): void {
  const { packageManager } = item.script;
  const cwd = path.dirname(item.script.packageJsonUri.fsPath);
  const cmd = `${packageManager} run ${item.script.name}`;

  const behavior = vscode.workspace
    .getConfiguration("betterScripts")
    .get<string>("terminalBehavior", "reuse");

  if (behavior === "reuse") {
    const key = getTerminalKey(item);
    let terminal = terminalCache.get(key);

    if (!terminal || terminal.exitStatus !== undefined) {
      terminal = vscode.window.createTerminal({
        name: item.script.name,
        cwd,
      });
      terminalCache.set(key, terminal);
    }

    terminal.show();
    terminal.sendText(cmd);
  } else {
    const terminal = vscode.window.createTerminal({
      name: item.script.name,
      cwd,
    });
    terminal.show();
    terminal.sendText(cmd);
  }
}

export async function debugScript(item: ScriptTreeItem): Promise<void> {
  const { packageManager } = item.script;
  const cwd = path.dirname(item.script.packageJsonUri.fsPath);
  const folder = vscode.workspace.getWorkspaceFolder(
    item.script.packageJsonUri,
  );

  let runtimeArgs: string[];
  let runtimeExecutable: string;
  let env: Record<string, string> | undefined;

  switch (packageManager) {
    case "bun":
      runtimeExecutable = "bun";
      runtimeArgs = ["--inspect-brk", "run", item.script.name];
      break;
    case "pnpm":
      runtimeExecutable = "pnpm";
      runtimeArgs = ["run", item.script.name];
      env = { NODE_OPTIONS: "--inspect-brk" };
      break;
    case "yarn":
      runtimeExecutable = "yarn";
      runtimeArgs = ["run", item.script.name];
      env = { NODE_OPTIONS: "--inspect-brk" };
      break;
    default:
      runtimeExecutable = "npm";
      runtimeArgs = ["run", item.script.name];
      env = { NODE_OPTIONS: "--inspect-brk" };
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
    ...(env && { env }),
  };

  await vscode.debug.startDebugging(folder, debugConfig);
}

export async function openScriptInPackageJson(
  item: ScriptTreeItem,
): Promise<void> {
  const uri = item.script.packageJsonUri;
  const raw = await vscode.workspace.fs.readFile(uri);
  const content = Buffer.from(raw).toString("utf-8");

  const scriptPattern = new RegExp(`"${escapeRegex(item.script.name)}"\\s*:`);
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
  const range = new vscode.Range(
    lineIndex,
    0,
    lineIndex,
    lines[lineIndex].length,
  );
  editor.selection = new vscode.Selection(range.start, range.end);
  editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
