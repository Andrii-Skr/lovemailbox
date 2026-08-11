export type LoveProgress = { openedLetterIds: string[]; completed: boolean };
const version = "v1";

function key(projectId: string) {
  return `love-progress:${version}:${projectId}`;
}

export function loadProgress(projectId: string, validLetterIds: string[]): LoveProgress {
  try {
    const raw = localStorage.getItem(key(projectId));
    if (!raw) return { openedLetterIds: [], completed: false };
    const parsed = JSON.parse(raw) as Partial<LoveProgress>;
    const valid = new Set(validLetterIds);
    const openedLetterIds = Array.isArray(parsed.openedLetterIds)
      ? parsed.openedLetterIds.filter((id): id is string => typeof id === "string" && valid.has(id))
      : [];
    return { openedLetterIds, completed: openedLetterIds.length === validLetterIds.length && validLetterIds.length > 0 };
  } catch {
    return { openedLetterIds: [], completed: false };
  }
}

export function saveProgress(projectId: string, progress: LoveProgress) {
  try {
    localStorage.setItem(key(projectId), JSON.stringify(progress));
  } catch {}
}

export function clearProgress(projectId: string) {
  try {
    localStorage.removeItem(key(projectId));
  } catch {}
}
