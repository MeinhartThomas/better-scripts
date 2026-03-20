import { describe, it, expect } from "vitest";
import { getPackageLabel, buildPackageLabelMap } from "../packageJsonParser";

describe("getPackageLabel", () => {
  it('returns "root" for root package.json', () => {
    expect(getPackageLabel("package.json")).toBe("root");
  });

  it("returns workspace folder name for multi-root root package.json", () => {
    expect(getPackageLabel("my-app/package.json")).toBe("my-app");
  });

  it("returns nested path without package.json suffix", () => {
    expect(getPackageLabel("packages/ui/package.json")).toBe("packages/ui");
  });

  it("returns full nested path for multi-root nested package.json", () => {
    expect(getPackageLabel("my-app/packages/ui/package.json")).toBe(
      "my-app/packages/ui",
    );
  });
});

describe("buildPackageLabelMap", () => {
  it('maps root package.json to "root"', () => {
    const result = buildPackageLabelMap(["package.json"]);
    expect(result.get("package.json")).toBe("root");
  });

  it("uses last segment when all are unique", () => {
    const result = buildPackageLabelMap([
      "packages/ui/package.json",
      "packages/api/package.json",
      "packages/web/package.json",
    ]);
    expect(result.get("packages/ui/package.json")).toBe("ui");
    expect(result.get("packages/api/package.json")).toBe("api");
    expect(result.get("packages/web/package.json")).toBe("web");
  });

  it("extends depth on last-segment collision", () => {
    const result = buildPackageLabelMap([
      "packages/ui/package.json",
      "apps/ui/package.json",
    ]);
    expect(result.get("packages/ui/package.json")).toBe("packages/ui");
    expect(result.get("apps/ui/package.json")).toBe("apps/ui");
  });

  it("uses full path for deeper collisions", () => {
    const result = buildPackageLabelMap([
      "a/shared/ui/package.json",
      "b/shared/ui/package.json",
    ]);
    expect(result.get("a/shared/ui/package.json")).toBe("a/shared/ui");
    expect(result.get("b/shared/ui/package.json")).toBe("b/shared/ui");
  });

  it("handles mixed colliding and non-colliding paths", () => {
    const result = buildPackageLabelMap([
      "package.json",
      "packages/ui/package.json",
      "apps/ui/package.json",
      "packages/api/package.json",
    ]);
    expect(result.get("package.json")).toBe("root");
    expect(result.get("packages/ui/package.json")).toBe("packages/ui");
    expect(result.get("apps/ui/package.json")).toBe("apps/ui");
    expect(result.get("packages/api/package.json")).toBe("api");
  });

  it("returns short name for a single non-root package", () => {
    const result = buildPackageLabelMap(["packages/my-lib/package.json"]);
    expect(result.get("packages/my-lib/package.json")).toBe("my-lib");
  });

  it("returns empty map for empty input", () => {
    const result = buildPackageLabelMap([]);
    expect(result.size).toBe(0);
  });
});
