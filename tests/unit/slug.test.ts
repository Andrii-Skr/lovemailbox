import { describe, expect, it } from "vitest";
import { createSlug, transliterateName } from "@/lib/slug";

describe("slug", () => {
  it("transliterates Russian and Ukrainian names", () => {
    expect(transliterateName("Юлія Коваль")).toBe("yuliya-koval");
    expect(transliterateName("Саша")).toBe("sasha");
  });

  it("creates an opaque non-sequential suffix", () => {
    expect(createSlug("Юля")).toMatch(/^for-yulya-[a-z0-9]{6}$/);
  });
});
