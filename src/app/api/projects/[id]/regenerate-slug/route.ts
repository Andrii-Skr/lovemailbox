import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { createSlug } from "@/lib/slug";
import { prisma } from "@/server/db";
import { isValidEditToken, readBearerToken } from "@/server/security";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const project = await prisma.loveProject.findUnique({ where: { id } });
  if (!project || project.expiresAt <= new Date()) return NextResponse.json({ message: "Not found" }, { status: 404 });
  if (!isValidEditToken(readBearerToken(request), project.editTokenHash)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const slug = createSlug(project.recipientName);
      const updated = await prisma.loveProject.update({ where: { id }, data: { slug } });
      return NextResponse.json({ slug: updated.slug, updatedAt: updated.updatedAt.toISOString() });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && attempt < 3) continue;
      console.error("Failed to regenerate slug", error);
      return NextResponse.json({ message: "Could not regenerate slug" }, { status: 500 });
    }
  }
  return NextResponse.json({ message: "Could not regenerate slug" }, { status: 500 });
}
