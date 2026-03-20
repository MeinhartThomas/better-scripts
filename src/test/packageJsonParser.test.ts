import { describe, it, expect } from "vitest";
import { getPackageLabel } from "../packageJsonParser";

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
