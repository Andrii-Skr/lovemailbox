import { beforeEach, describe, expect, it } from "vitest";
import { loadProgress, saveProgress } from "@/lib/progress";

describe("local progress", () => {
  beforeEach(() => localStorage.clear());

  it("filters removed or disabled letter ids", () => {
    saveProgress("p1", { openedLetterIds: ["a", "removed"], completed: true });
    expect(loadProgress("p1", ["a", "b"])).toEqual({ openedLetterIds: ["a"], completed: false });
  });

  it("marks completion against the current enabled letters", () => {
    saveProgress("p2", { openedLetterIds: ["a", "b"], completed: false });
    expect(loadProgress("p2", ["a", "b"]).completed).toBe(true);
  });
});
