import { describe, it, expect } from "vitest";
import { resolveIconName } from "../iconResolver";

describe("resolveIconName", () => {
  describe("tool-specific icons", () => {
    it.each([
      ["docker", "docker compose up", "docker"],
      ["compose", "docker-compose up", "docker"],
      ["prisma", "prisma migrate dev", "prisma"],
      ["playwright", "playwright test", "playwright"],
      ["e2e", "cypress run", "playwright"],
      ["storybook", "storybook dev", "storybook"],
      ["turbo", "turbo run build", "turborepo"],
      ["graphql", "graphql-codegen", "graphql"],
      ["codegen", "gql-gen", "graphql"],
      ["tailwind", "tailwindcss -i input.css", "tailwind"],
      ["stripe", "stripe listen", "stripe"],
      ["supabase", "supabase start", "supabase"],
      ["astro", "astro dev", "astro"],
      ["expo", "expo start", "expo"],
      ["drizzle", "drizzle-kit push", "drizzle"],
      ["sentry", "sentry-cli releases new", "sentry"],
    ])('"%s" / "%s" -> %s', (name, cmd, expected) => {
      expect(resolveIconName(name, cmd)).toBe(expected);
    });
  });

  describe("language and quality tool icons", () => {
    it.each([
      ["typecheck", "tsc --noEmit", "typescript"],
      ["tsc", "tsc -b", "typescript"],
      ["vitest", "vitest", "vitest"],
      ["jest", "jest --coverage", "jest"],
      ["eslint", "eslint src", "eslint"],
      ["prettier", "prettier --check .", "prettier"],
    ])('"%s" / "%s" -> %s', (name, cmd, expected) => {
      expect(resolveIconName(name, cmd)).toBe(expected);
    });
  });

  describe("general category icons", () => {
    it.each([
      ["test", "mocha", "test"],
      ["spec", "ava", "test"],
      ["lint", "oxlint src", "lint"],
      ["format", "biome format", "format"],
      ["fmt", "dprint fmt", "format"],
      ["i18n", "lingui extract", "i18n"],
      ["db:migrate", "knex migrate:latest", "database"],
      ["seed", "sequelize db:seed", "database"],
      ["deploy", "serverless deploy", "deploy"],
      ["release", "np", "deploy"],
      ["clean", "rimraf dist", "clean"],
      ["watch", "vite build --watch", "watch"],
      ["preview", "vite preview", "preview"],
      ["build", "vite build", "build"],
      ["compile", "webpack", "build"],
      ["dev", "vite", "dev"],
      ["start", "node server.js", "dev"],
    ])('"%s" / "%s" -> %s', (name, cmd, expected) => {
      expect(resolveIconName(name, cmd)).toBe(expected);
    });
  });

  describe("command-based matching (name doesn't match, command does)", () => {
    it("matches docker by command even with unrelated name", () => {
      expect(resolveIconName("up", "docker compose up")).toBe("docker");
    });

    it("matches eslint by command", () => {
      expect(resolveIconName("check", "eslint .")).toBe("eslint");
    });

    it("matches vite build by command", () => {
      expect(resolveIconName("bundle", "vite build")).toBe("build");
    });
  });

  describe("fallback to default", () => {
    it("returns default for unrecognized scripts", () => {
      expect(resolveIconName("custom", "my-tool run")).toBe("default");
    });

    it("returns default for empty strings", () => {
      expect(resolveIconName("", "")).toBe("default");
    });
  });

  describe("rule ordering", () => {
    it("specific tool rules take priority over generic categories", () => {
      // "vitest" should match vitest, not generic "test"
      expect(resolveIconName("vitest", "vitest run")).toBe("vitest");
    });

    it("docker takes priority over deploy for docker-based deploy", () => {
      expect(resolveIconName("deploy", "docker push")).toBe("docker");
    });

    it("prisma takes priority over database", () => {
      expect(resolveIconName("db:migrate", "prisma migrate dev")).toBe(
        "prisma",
      );
    });
  });

  describe("case insensitivity", () => {
    it("matches regardless of case in script name", () => {
      expect(resolveIconName("Docker", "something")).toBe("docker");
    });

    it("matches regardless of case in command", () => {
      expect(resolveIconName("run", "Docker compose up")).toBe("docker");
    });
  });

  describe("nodemon resolves to dev (not watch)", () => {
    it("dev script using nodemon gets dev icon", () => {
      expect(resolveIconName("dev", "nodemon server.js")).toBe("dev");
    });

    it("start script using nodemon gets dev icon", () => {
      expect(resolveIconName("start", "nodemon index.js")).toBe("dev");
    });
  });
});
