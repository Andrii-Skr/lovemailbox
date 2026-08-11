import { act } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditorLoader } from "@/components/builder/editor-loader";
import { saveEditToken } from "@/lib/edit-access";

vi.mock("@/components/builder/project-builder", () => ({
  ProjectBuilder: () => <div>Project editor</div>,
}));

describe("EditorLoader", () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("hydrates with the same loading state before reading the edit token", async () => {
    const projectId = "1fbb215d-f063-4df1-842b-abc123456789";
    saveEditToken(projectId, "saved-edit-token");
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));

    const container = document.createElement("div");
    container.innerHTML = renderToString(<EditorLoader projectId={projectId} />);
    const recoverableErrors: unknown[] = [];
    let root: Root | undefined;

    await act(async () => {
      root = hydrateRoot(container, <EditorLoader projectId={projectId} />, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
      await Promise.resolve();
    });

    expect(recoverableErrors).toEqual([]);
    expect(container).toHaveTextContent("Opening the mailbox…");

    await act(async () => root?.unmount());
  });
});
