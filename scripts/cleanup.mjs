import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const hour = 60 * 60 * 1000;
const publishEventRetention = 2 * 24 * hour;

async function cleanup() {
  const now = new Date();
  const [projects, publishEvents] = await Promise.all([
    prisma.loveProject.deleteMany({ where: { expiresAt: { lte: now } } }),
    prisma.publishEvent.deleteMany({ where: { createdAt: { lte: new Date(now.getTime() - publishEventRetention) } } }),
  ]);
  console.log(`[cleanup] removed ${projects.count} expired project(s) and ${publishEvents.count} old publish event(s)`);
}

async function run() {
  while (true) {
    try {
      await cleanup();
    } catch (error) {
      console.error("[cleanup] failed", error);
    }
    await new Promise((resolve) => setTimeout(resolve, hour));
  }
}

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

await run();
