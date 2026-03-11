import * as path from "path";

export class Uri {
  readonly fsPath: string;
  readonly scheme: string;
  readonly path: string;

  private constructor(fsPath: string) {
    this.fsPath = fsPath;
    this.scheme = "file";
    this.path = fsPath;
  }

  static file(p: string): Uri {
    return new Uri(path.resolve(p));
  }

  static parse(value: string): Uri {
    return new Uri(value);
  }
}

export const workspace = {
  fs: {
    readFile: async () => Buffer.from("{}"),
    stat: async () => {
      throw new Error("not found");
    },
  },
  getWorkspaceFolder: () => undefined,
  asRelativePath: (uri: any) => uri.fsPath,
  findFiles: async () => [],
  createFileSystemWatcher: () => ({
    onDidChange: () => ({ dispose: () => {} }),
    onDidCreate: () => ({ dispose: () => {} }),
    onDidDelete: () => ({ dispose: () => {} }),
    dispose: () => {},
  }),
  getConfiguration: () => ({
    get: () => "reuse",
  }),
  workspaceFolders: [],
};

export const window = {
  createTerminal: () => ({
    show: () => {},
    sendText: () => {},
    dispose: () => {},
  }),
  onDidCloseTerminal: () => ({ dispose: () => {} }),
  showTextDocument: async () => ({
    selection: null,
    revealRange: () => {},
  }),
  createTreeView: () => ({ dispose: () => {} }),
};

export const commands = {
  registerCommand: () => ({ dispose: () => {} }),
};

export const debug = {
  startDebugging: async () => true,
};

export class EventEmitter {
  event = () => ({ dispose: () => {} });
  fire() {}
  dispose() {}
}

export enum TreeItemCollapsibleState {
  None = 0,
  Collapsed = 1,
  Expanded = 2,
}

export class TreeItem {
  label?: string;
  collapsibleState?: TreeItemCollapsibleState;
  iconPath?: any;
  command?: any;
  tooltip?: string;
  description?: string;
  contextValue?: string;

  constructor(label: string, collapsibleState?: TreeItemCollapsibleState) {
    this.label = label;
    this.collapsibleState = collapsibleState;
  }
}

export class Selection {
  constructor(
    public start: any,
    public end: any,
  ) {}
}

export class Range {
  constructor(
    public startLine: number,
    public startChar: number,
    public endLine: number,
    public endChar: number,
  ) {}

  get start() {
    return { line: this.startLine, character: this.startChar };
  }
  get end() {
    return { line: this.endLine, character: this.endChar };
  }
}

export enum TextEditorRevealType {
  Default = 0,
  InCenter = 1,
  InCenterIfOutsideViewport = 2,
  AtTop = 3,
}
