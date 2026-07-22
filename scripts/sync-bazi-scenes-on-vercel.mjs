import { spawnSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
  console.log("[bazi-scenes] skipping Neon sync outside the Vercel production build");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error("[bazi-scenes] production build is missing DATABASE_URL");
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ["--require", "tsx/cjs", "prisma/seed-bazi-scenes.ts"],
  { cwd: process.cwd(), env: process.env, stdio: "inherit" }
);

if (result.error) {
  console.error(`[bazi-scenes] Neon sync could not start: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
