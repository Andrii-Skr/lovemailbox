import { describe, expect, it } from "vitest";
import { getDemoProject } from "@/lib/demo-project";
import { localeFromParam } from "@/lib/locale-param";

describe("Love Mailbox demo contract", () => {
  it("accepts only the shared locale values", () => {
    expect(localeFromParam("uk")).toBe("uk");
    expect(localeFromParam("ru")).toBe("ru");
    expect(localeFromParam("en")).toBe("en");
    expect(localeFromParam("ua", "en")).toBe("en");
  });

  it("builds a stable read-only fixture without user data", () => {
    const project = getDemoProject("uk");
    expect(project.id).toBe("love-mailbox-demo");
    expect(project.locale).toBe("uk");
    expect(project.letters).toHaveLength(3);
    expect(project.letters.every((letter) => letter.id.startsWith("demo-uk-"))).toBe(true);
  });
});
