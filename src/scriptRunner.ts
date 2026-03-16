import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import * as cp from "child_process";
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

export function openInExternalTerminalEntry(entry: ScriptEntry): void {
  const cwd = path.dirname(entry.packageJsonUri.fsPath);
  const cmd = `${entry.packageManager} run ${entry.name}`;

  if (process.platform === "darwin") {
    const osxExec = vscode.workspace
      .getConfiguration("terminal.external")
      .get<string>("osxExec", "Terminal.app");
    const osxExecLower = osxExec.toLowerCase();

    if (osxExecLower.includes("iterm")) {
      const osaScript = [
        'tell application "iTerm2"',
        "  activate",
        "  if (count windows) = 0 then",
        "    create window with default profile",
        "  end if",
        "  tell current window",
        "    create tab with default profile",
        "    tell current session",
        `      write text "cd ${applescriptShellEscape(cwd)} && ${applescriptEscape(cmd)}"`,
        "    end tell",
        "  end tell",
        "end tell",
      ].join("\n");
      cp.spawn("osascript", ["-e", osaScript], { detached: true });
    } else if (osxExecLower.includes("warp")) {
      // Warp doesn't support AppleScript or command args via its URL scheme,
      // but it can execute .command files opened with `open -a`
      const tmpFile = path.join(
        os.tmpdir(),
        `better-scripts-${Date.now()}.command`,
      );
      const script = [
        "#!/bin/bash",
        `cd ${shellQuote(cwd)}`,
        "clear",
        cmd,
        `rm -f ${shellQuote(tmpFile)}`,
        "exec $SHELL",
      ].join("\n");
      fs.writeFileSync(tmpFile, script, { mode: 0o755 });
      cp.spawn("open", ["-a", osxExec, tmpFile], { detached: true });
    } else {
      // Terminal.app and other AppleScript-compatible terminals
      const appName = path.basename(osxExec, ".app");
      const shellCmd = `cd ${shellQuote(cwd)} && ${cmd}`;
      const osaScript = [
        `tell application "${applescriptEscape(appName)}"`,
        `  do script "${applescriptEscape(shellCmd)}"`,
        "  activate",
        "end tell",
      ].join("\n");
      cp.spawn("osascript", ["-e", osaScript], { detached: true });
    }
  } else if (process.platform === "win32") {
    const winExec = vscode.workspace
      .getConfiguration("terminal.external")
      .get<string>("windowsExec", "cmd");
    cp.spawn(winExec, ["/k", `cd /d "${cwd}" && ${cmd}`], {
      detached: true,
      shell: true,
    });
  } else {
    const linuxExec = vscode.workspace
      .getConfiguration("terminal.external")
      .get<string>("linuxExec", "xterm");
    cp.spawn(
      linuxExec,
      ["-e", `bash -c "cd ${shellQuote(cwd)} && ${cmd}; exec bash"`],
      {
        detached: true,
      },
    );
  }
}

function shellQuote(str: string): string {
  return `'${str.replace(/'/g, "'\\''")}'`;
}

function applescriptEscape(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function applescriptShellEscape(str: string): string {
  return applescriptEscape(shellQuote(str));
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

export function openInExternalTerminal(item: ScriptTreeItem): void {
  openInExternalTerminalEntry(item.script);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
