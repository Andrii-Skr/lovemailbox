import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { patchProjectSchema } from "@/lib/project-schema";
import { prisma } from "@/server/db";
import { toEditableProject } from "@/server/project-dto";
import { isValidEditToken, readBearerToken } from "@/server/security";

type Context = { params: Promise<{ id: string }> };

async function findAuthorized(request: NextRequest, id: string) {
  const project = await prisma.loveProject.findUnique({ where: { id }, include: { letters: true } });
  if (!project || project.expiresAt <= new Date()) return { status: 404 as const, project: null };
  if (!isValidEditToken(readBearerToken(request), project.editTokenHash)) return { status: 403 as const, project: null };
  return { status: 200 as const, project };
}

export async function GET(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const result = await findAuthorized(request, id);
  if (!result.project) return NextResponse.json({ message: result.status === 403 ? "Forbidden" : "Not found" }, { status: result.status });
  return NextResponse.json({ project: toEditableProject(result.project) });
}

export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const authorized = await findAuthorized(request, id);
  if (!authorized.project) return NextResponse.json({ message: authorized.status === 403 ? "Forbidden" : "Not found" }, { status: authorized.status });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Invalid JSON" }, { status: 400 }); }
  const parsed = patchProjectSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });

  try {
    const project = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.loveProject.updateMany({
        where: { id, updatedAt: new Date(parsed.data.updatedAt) },
        data: {
          locale: parsed.data.locale,
          title: parsed.data.title,
          senderName: parsed.data.senderName,
          recipientName: parsed.data.recipientName,
          introText: parsed.data.introText,
          buttonText: parsed.data.buttonText,
          shakeHint: parsed.data.shakeHint,
          finalMessage: parsed.data.finalMessage,
        },
      });
      if (updated.count !== 1) throw new Error("EDIT_CONFLICT");
      await transaction.loveLetter.deleteMany({ where: { projectId: id } });
      await transaction.loveLetter.createMany({
        data: parsed.data.letters.toSorted((a, b) => a.order - b.order).map((letter, order) => ({
          id: letter.id,
          projectId: id,
          title: letter.title || null,
          message: letter.message,
          enabled: letter.enabled,
          order,
        })),
      });
      return transaction.loveProject.findUniqueOrThrow({ where: { id }, include: { letters: true } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ project: toEditableProject(project) });
  } catch (error) {
    if (error instanceof Error && error.message === "EDIT_CONFLICT") return NextResponse.json({ message: "Edit conflict" }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return NextResponse.json({ message: "Edit conflict" }, { status: 409 });
    console.error("Failed to update project", error);
    return NextResponse.json({ message: "Could not save project" }, { status: 500 });
  }
}
