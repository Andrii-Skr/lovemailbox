import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const hour = 60 * 60 * 1000;

async function cleanup() {
  const result = await prisma.loveProject.deleteMany({ where: { expiresAt: { lte: new Date() } } });
  console.log(`[cleanup] removed ${result.count} expired project(s)`);
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
