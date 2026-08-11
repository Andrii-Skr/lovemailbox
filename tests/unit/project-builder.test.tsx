import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectBuilder } from "@/components/builder/project-builder";
import { createDefaultProject } from "@/lib/project-schema";
import type { EditableLoveProject } from "@/lib/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/experience/love-experience", () => ({ LoveExperience: () => <div data-testid="experience" /> }));
vi.mock("@/components/builder/turnstile-widget", () => ({ TurnstileWidget: () => <div data-testid="turnstile" /> }));
vi.mock("@/components/builder/share-modal", () => ({
  ShareModal: ({ onClose, open }: { onClose: () => void; open: boolean }) => open ? <div role="dialog">Share<button type="button" onClick={onClose}>Close share</button></div> : null,
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ProjectBuilder", () => {
  it("shows and associates validation errors with required fields", async () => {
    render(<ProjectBuilder defaultProject={createDefaultProject("ru")} />);

    const title = screen.getByLabelText("Название проекта");
    fireEvent.change(title, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    const error = await screen.findByText("Название: минимум 1");
    expect(title).toHaveAttribute("aria-invalid", "true");
    expect(title).toHaveAttribute("aria-describedby", error.id);
  });

  it("replaces the saved indicator when the form becomes dirty again", async () => {
    const values = createDefaultProject("ru");
    const initialProject: EditableLoveProject = {
      ...values,
      id: "11111111-1111-4111-8111-111111111111",
      slug: "for-yulya-abc234",
      expiresAt: "2026-08-18T12:00:00.000Z",
      updatedAt: "2026-08-11T12:00:00.000Z",
    };
    const savedProject = { ...initialProject, title: "Обновлённое название", updatedAt: "2026-08-11T12:01:00.000Z" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ project: savedProject }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })));

    render(<ProjectBuilder initialProject={initialProject} editToken="edit-token" />);
    const title = screen.getByLabelText("Название проекта");
    fireEvent.change(title, { target: { value: savedProject.title } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => expect(screen.getByText("Сохранено")).toBeInTheDocument());
    fireEvent.change(title, { target: { value: "Ещё одно изменение" } });
    await waitFor(() => expect(screen.queryByText("Сохранено")).not.toBeInTheDocument());
    expect(screen.getByText("Есть несохранённые изменения.")).toBeInTheDocument();
  });

  it("keeps sharing available after the modal is closed", () => {
    const values = createDefaultProject("ru");
    const initialProject: EditableLoveProject = {
      ...values,
      id: "11111111-1111-4111-8111-111111111111",
      slug: "for-yulya-abc234",
      expiresAt: "2026-08-18T12:00:00.000Z",
      updatedAt: "2026-08-11T12:00:00.000Z",
    };

    render(<ProjectBuilder initialProject={initialProject} editToken="edit-token" />);
    const share = screen.getByRole("button", { name: "Поделиться" });
    fireEvent.click(share);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close share" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(share);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
