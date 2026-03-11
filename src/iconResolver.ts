import * as path from "path";
import * as vscode from "vscode";
import type { PackageManager } from "./packageManagerDetector";

type IconName =
  | "dev"
  | "build"
  | "test"
  | "lint"
  | "format"
  | "docker"
  | "prisma"
  | "playwright"
  | "i18n"
  | "deploy"
  | "typescript"
  | "storybook"
  | "clean"
  | "watch"
  | "preview"
  | "database"
  | "default";

interface IconRule {
  icon: IconName;
  /** Matched against the script name (lowercased) */
  namePatterns: string[];
  /** Matched against the script command body (lowercased) */
  commandPatterns: string[];
}

const RULES: IconRule[] = [
  {
    icon: "docker",
    namePatterns: ["docker", "compose"],
    commandPatterns: ["docker", "compose"],
  },
  {
    icon: "prisma",
    namePatterns: ["prisma"],
    commandPatterns: ["prisma"],
  },
  {
    icon: "playwright",
    namePatterns: ["playwright", "e2e", "cypress"],
    commandPatterns: ["playwright", "cypress"],
  },
  {
    icon: "storybook",
    namePatterns: ["storybook"],
    commandPatterns: ["storybook", "sb "],
  },
  {
    icon: "typescript",
    namePatterns: ["typecheck", "type-check", "tsc"],
    commandPatterns: ["tsc"],
  },
  {
    icon: "test",
    namePatterns: ["test", "spec", "coverage"],
    commandPatterns: ["vitest", "jest", "mocha", "ava", "tap", "nyc"],
  },
  {
    icon: "lint",
    namePatterns: ["lint", "eslint", "oxlint"],
    commandPatterns: ["eslint", "oxlint", "biome check", "biome lint"],
  },
  {
    icon: "format",
    namePatterns: ["format", "prettier", "fmt"],
    commandPatterns: ["prettier", "biome format", "dprint"],
  },
  {
    icon: "i18n",
    namePatterns: ["i18n", "intl", "translate", "translations", "locale"],
    commandPatterns: ["lingui", "i18next", "formatjs", "react-intl"],
  },
  {
    icon: "database",
    namePatterns: ["db", "migrate", "migration", "seed", "schema"],
    commandPatterns: ["knex", "typeorm", "drizzle", "sequelize", "migrate"],
  },
  {
    icon: "deploy",
    namePatterns: ["deploy", "release", "publish", "ship"],
    commandPatterns: ["deploy", "serverless", "cdk", "pulumi", "terraform"],
  },
  {
    icon: "clean",
    namePatterns: ["clean", "purge", "clear", "reset"],
    commandPatterns: ["rimraf", "rm -rf", "del-cli"],
  },
  {
    icon: "watch",
    namePatterns: ["watch"],
    commandPatterns: ["--watch", "nodemon", "chokidar"],
  },
  {
    icon: "preview",
    namePatterns: ["preview"],
    commandPatterns: ["preview"],
  },
  {
    icon: "build",
    namePatterns: ["build", "compile", "bundle", "generate"],
    commandPatterns: [
      "webpack",
      "rollup",
      "esbuild",
      "vite build",
      "next build",
      "nuxt build",
      "tsc -b",
      "tsup",
      "unbuild",
      "turbo build",
    ],
  },
  {
    icon: "dev",
    namePatterns: ["dev", "start", "serve", "develop"],
    commandPatterns: [
      "vite",
      "next dev",
      "next start",
      "nuxt dev",
      "nodemon",
      "ts-node",
      "tsx",
      "node ",
    ],
  },
];

function matchesAny(value: string, patterns: string[]): boolean {
  return patterns.some((p) => value.includes(p));
}

export function resolveIconName(
  scriptName: string,
  scriptCommand: string
): IconName {
  const name = scriptName.toLowerCase();
  const cmd = scriptCommand.toLowerCase();

  for (const rule of RULES) {
    if (matchesAny(name, rule.namePatterns)) {
      return rule.icon;
    }
  }

  for (const rule of RULES) {
    if (matchesAny(cmd, rule.commandPatterns)) {
      return rule.icon;
    }
  }

  return "default";
}

export function getIconPath(
  extensionPath: string,
  scriptName: string,
  scriptCommand: string,
  packageManager: PackageManager
): { light: vscode.Uri; dark: vscode.Uri } {
  const iconName = resolveIconName(scriptName, scriptCommand);

  if (iconName === "default") {
    const pmIcon = vscode.Uri.file(
      path.join(extensionPath, "icons", `${packageManager}.svg`)
    );
    return { light: pmIcon, dark: pmIcon };
  }

  return {
    light: vscode.Uri.file(
      path.join(extensionPath, "icons", `${iconName}-light.svg`)
    ),
    dark: vscode.Uri.file(
      path.join(extensionPath, "icons", `${iconName}-dark.svg`)
    ),
  };
}
