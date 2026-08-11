import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { projectSchema } from "@/lib/project-schema";
import { createSlug } from "@/lib/slug";
import { prisma } from "@/server/db";
import { toEditableProject } from "@/server/project-dto";
import { createEditToken, getClientIp, hashEditToken, hashIp } from "@/server/security";
import { verifyTurnstile } from "@/server/turnstile";

class PublishLimitError extends Error {}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ message: "Validation failed" }, { status: 422 });
  }
  const raw = body as { project?: unknown; turnstileToken?: unknown };
  const parsed = projectSchema.safeParse(raw.project);
  if (!parsed.success) return NextResponse.json({ message: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });

  const ip = getClientIp(request);
  const protectionDisabled = process.env.NODE_ENV !== "production" && process.env.DISABLE_PUBLISH_PROTECTION === "true";
  if (!protectionDisabled) {
    const captchaPassed = await verifyTurnstile(typeof raw.turnstileToken === "string" ? raw.turnstileToken : "", ip);
    if (!captchaPassed) return NextResponse.json({ message: "Human verification failed" }, { status: 403 });
  }

  const editToken = createEditToken();
  const editTokenHash = hashEditToken(editToken);
  const ipHash = protectionDisabled ? "" : hashIp(ip);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const slug = createSlug(parsed.data.recipientName);
      const project = await prisma.$transaction(async (transaction) => {
        if (!protectionDisabled) {
          await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ipHash}))`;
          const [limits] = await transaction.$queryRaw<Array<{ hour_count: bigint; day_count: bigint }>>`
            SELECT
              COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') AS hour_count,
              COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 day') AS day_count
            FROM publish_events
            WHERE ip_hash = ${ipHash} AND created_at > NOW() - INTERVAL '1 day'
          `;
          if (Number(limits?.hour_count ?? 0) >= 3 || Number(limits?.day_count ?? 0) >= 10) throw new PublishLimitError();
        }

        const created = await transaction.loveProject.create({
          data: {
            slug,
            editTokenHash,
            locale: parsed.data.locale,
            title: parsed.data.title,
            senderName: parsed.data.senderName,
            recipientName: parsed.data.recipientName,
            introText: parsed.data.introText,
            buttonText: parsed.data.buttonText,
            shakeHint: parsed.data.shakeHint,
            finalMessage: parsed.data.finalMessage,
            expiresAt,
            letters: {
              create: parsed.data.letters.toSorted((a, b) => a.order - b.order).map((letter, order) => ({
                id: letter.id,
                title: letter.title || null,
                message: letter.message,
                enabled: letter.enabled,
                order,
              })),
            },
          },
          include: { letters: true },
        });
        if (!protectionDisabled) await transaction.publishEvent.create({ data: { ipHash } });
        return created;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      return NextResponse.json({ project: toEditableProject(project), editToken }, { status: 201 });
    } catch (error) {
      if (error instanceof PublishLimitError) return NextResponse.json({ message: "Publish limit reached" }, { status: 429 });
      if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2034") && attempt < 3) continue;
      console.error("Failed to create project", error);
      return NextResponse.json({ message: "Could not create project" }, { status: 500 });
    }
  }
  return NextResponse.json({ message: "Could not create project" }, { status: 500 });
}
