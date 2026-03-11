import * as path from "path";
import * as vscode from "vscode";

type IconName =
  | "dev"
  | "build"
  | "test"
  | "lint"
  | "eslint"
  | "prettier"
  | "format"
  | "vitest"
  | "jest"
  | "docker"
  | "prisma"
  | "playwright"
  | "i18n"
  | "deploy"
  | "typescript"
  | "storybook"
  | "turborepo"
  | "graphql"
  | "tailwind"
  | "supabase"
  | "astro"
  | "expo"
  | "drizzle"
  | "sentry"
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
    icon: "turborepo",
    namePatterns: ["turbo"],
    commandPatterns: ["turbo run", "turbo "],
  },
  {
    icon: "graphql",
    namePatterns: ["graphql", "codegen", "gql"],
    commandPatterns: ["graphql-codegen", "graphql", "gql-gen"],
  },
  {
    icon: "tailwind",
    namePatterns: ["tailwind"],
    commandPatterns: ["tailwindcss", "tailwind"],
  },
  {
    icon: "supabase",
    namePatterns: ["supabase"],
    commandPatterns: ["supabase"],
  },
  {
    icon: "astro",
    namePatterns: ["astro"],
    commandPatterns: ["astro"],
  },
  {
    icon: "expo",
    namePatterns: ["expo"],
    commandPatterns: ["expo"],
  },
  {
    icon: "drizzle",
    namePatterns: ["drizzle"],
    commandPatterns: ["drizzle-kit", "drizzle"],
  },
  {
    icon: "sentry",
    namePatterns: ["sentry"],
    commandPatterns: ["sentry-cli", "sentry"],
  },
  {
    icon: "typescript",
    namePatterns: ["typecheck", "type-check", "tsc"],
    commandPatterns: ["tsc"],
  },
  {
    icon: "vitest",
    namePatterns: ["vitest"],
    commandPatterns: ["vitest"],
  },
  {
    icon: "jest",
    namePatterns: ["jest"],
    commandPatterns: ["jest"],
  },
  {
    icon: "test",
    namePatterns: ["test", "spec", "coverage"],
    commandPatterns: ["mocha", "ava", "tap", "nyc"],
  },
  {
    icon: "eslint",
    namePatterns: ["eslint"],
    commandPatterns: ["eslint"],
  },
  {
    icon: "lint",
    namePatterns: ["lint", "oxlint"],
    commandPatterns: ["oxlint", "biome check", "biome lint"],
  },
  {
    icon: "prettier",
    namePatterns: ["prettier"],
    commandPatterns: ["prettier"],
  },
  {
    icon: "format",
    namePatterns: ["format", "fmt"],
    commandPatterns: ["biome format", "dprint"],
  },
  {
    icon: "i18n",
    namePatterns: ["i18n", "intl", "translate", "translations", "locale"],
    commandPatterns: ["lingui", "i18next", "formatjs", "react-intl"],
  },
  {
    icon: "database",
    namePatterns: ["db", "migrate", "migration", "seed", "schema"],
    commandPatterns: ["knex", "typeorm", "sequelize", "migrate"],
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
    commandPatterns: ["--watch", "chokidar"],
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
  scriptCommand: string,
): IconName {
  const name = scriptName.toLowerCase();
  const cmd = scriptCommand.toLowerCase();

  for (const rule of RULES) {
    if (
      matchesAny(name, rule.namePatterns) ||
      matchesAny(cmd, rule.commandPatterns)
    ) {
      return rule.icon;
    }
  }

  return "default";
}

export function getIconPath(
  extensionPath: string,
  scriptName: string,
  scriptCommand: string,
): { light: vscode.Uri; dark: vscode.Uri } {
  const iconName = resolveIconName(scriptName, scriptCommand);

  if (iconName === "default") {
    return {
      light: vscode.Uri.file(
        path.join(extensionPath, "icons", "default-light.svg"),
      ),
      dark: vscode.Uri.file(
        path.join(extensionPath, "icons", "default-dark.svg"),
      ),
    };
  }

  const singleFileIcons: IconName[] = [
    "docker",
    "eslint",
    "playwright",
    "typescript",
    "prettier",
    "vitest",
    "jest",
    "turborepo",
    "graphql",
    "tailwind",
    "supabase",
    "astro",
    "drizzle",
    "storybook",
  ];
  if (singleFileIcons.includes(iconName)) {
    const icon = vscode.Uri.file(
      path.join(extensionPath, "icons", `${iconName}.svg`),
    );
    return { light: icon, dark: icon };
  }

  return {
    light: vscode.Uri.file(
      path.join(extensionPath, "icons", `${iconName}-light.svg`),
    ),
    dark: vscode.Uri.file(
      path.join(extensionPath, "icons", `${iconName}-dark.svg`),
    ),
  };
}
