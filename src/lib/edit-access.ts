const prefix = "love-mailbox:edit:v1:";

export function saveEditToken(projectId: string, token: string) {
  try {
    localStorage.setItem(`${prefix}${projectId}`, token);
  } catch {}
}

export function loadEditToken(projectId: string) {
  try {
    return localStorage.getItem(`${prefix}${projectId}`);
  } catch {
    return null;
  }
}
