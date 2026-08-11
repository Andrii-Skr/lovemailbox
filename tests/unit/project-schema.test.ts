import { describe, expect, it } from "vitest";
import { createDefaultProject, projectSchema } from "@/lib/project-schema";

describe("projectSchema", () => {
  it("accepts a valid multilingual project", () => {
    expect(projectSchema.safeParse(createDefaultProject("uk")).success).toBe(true);
  });

  it("requires at least one enabled letter", () => {
    const project = createDefaultProject("en");
    project.letters = project.letters.map((letter) => ({ ...letter, enabled: false }));
    expect(projectSchema.safeParse(project).success).toBe(false);
  });

  it("rejects duplicate order values", () => {
    const project = createDefaultProject("ru");
    project.letters[1].order = 0;
    expect(projectSchema.safeParse(project).success).toBe(false);
  });

  it.each([
    ["uk" as const, "Назва: мінімум 1"],
    ["en" as const, "Title: minimum 1"],
  ])("localizes validation messages for %s projects", (locale, message) => {
    const project = createDefaultProject(locale);
    project.title = "";
    const result = projectSchema.safeParse(project);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe(message);
  });
});
