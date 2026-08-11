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
});
