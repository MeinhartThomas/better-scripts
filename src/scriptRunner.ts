import * as vscode from "vscode";
import * as path from "path";
import type { ScriptTreeItem } from "./ScriptTreeItem";
import type { ScriptEntry } from "./packageJsonParser";

const terminalCache = new Map<string, vscode.Terminal>();

vscode.window.onDidCloseTerminal((closed) => {
  for (const [key, terminal] of terminalCache) {
    if (terminal === closed) {
      terminalCache.delete(key);
      break;
    }
  }
});

function getEntryKey(entry: ScriptEntry): string {
  return `${entry.packageJsonUri.fsPath}::${entry.name}`;
}

// --- Core functions operating on ScriptEntry ---

export function runScriptEntry(entry: ScriptEntry): void {
  const cwd = path.dirname(entry.packageJsonUri.fsPath);
  const cmd = `${entry.packageManager} run ${entry.name}`;

  const behavior = vscode.workspace
    .getConfiguration("betterScripts")
    .get<string>("terminalBehavior", "reuse");

  if (behavior === "reuse") {
    const key = getEntryKey(entry);
    let terminal = terminalCache.get(key);

    if (!terminal || terminal.exitStatus !== undefined) {
      terminal = vscode.window.createTerminal({
        name: entry.name,
        cwd,
      });
      terminalCache.set(key, terminal);
    }

    terminal.show();
    terminal.sendText(cmd);
  } else {
    const terminal = vscode.window.createTerminal({
      name: entry.name,
      cwd,
    });
    terminal.show();
    terminal.sendText(cmd);
  }
}

export async function debugScriptEntry(entry: ScriptEntry): Promise<void> {
  const cwd = path.dirname(entry.packageJsonUri.fsPath);
  const folder = vscode.workspace.getWorkspaceFolder(entry.packageJsonUri);

  let runtimeArgs: string[];
  let runtimeExecutable: string;
  let env: Record<string, string> | undefined;

  switch (entry.packageManager) {
    case "bun":
      runtimeExecutable = "bun";
      runtimeArgs = ["--inspect-brk", "run", entry.name];
      break;
    case "pnpm":
      runtimeExecutable = "pnpm";
      runtimeArgs = ["run", entry.name];
      env = { NODE_OPTIONS: "--inspect-brk" };
      break;
    case "yarn":
      runtimeExecutable = "yarn";
      runtimeArgs = ["run", entry.name];
      env = { NODE_OPTIONS: "--inspect-brk" };
      break;
    default:
      runtimeExecutable = "npm";
      runtimeArgs = ["run", entry.name];
      env = { NODE_OPTIONS: "--inspect-brk" };
      break;
  }

  const debugConfig: vscode.DebugConfiguration = {
    type: "node",
    request: "launch",
    name: `Debug: ${entry.name}`,
    runtimeExecutable,
    runtimeArgs,
    cwd,
    console: "integratedTerminal",
    skipFiles: ["<node_internals>/**"],
    ...(env && { env }),
  };

  await vscode.debug.startDebugging(folder, debugConfig);
}

export async function openScriptEntryInPackageJson(
  entry: ScriptEntry,
): Promise<void> {
  const uri = entry.packageJsonUri;
  const raw = await vscode.workspace.fs.readFile(uri);
  const content = Buffer.from(raw).toString("utf-8");

  const scriptPattern = new RegExp(`"${escapeRegex(entry.name)}"\\s*:`);
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

// --- Tree item wrappers ---

export function runScript(item: ScriptTreeItem): void {
  runScriptEntry(item.script);
}

export async function debugScript(item: ScriptTreeItem): Promise<void> {
  await debugScriptEntry(item.script);
}

export async function openScriptInPackageJson(
  item: ScriptTreeItem,
): Promise<void> {
  await openScriptEntryInPackageJson(item.script);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
