import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  SIGN_DIRECTIONS,
  SIGN_DOMAINS,
  SIGN_ENTRIES,
  SIGN_METHOD_RULES,
  SIGN_PERIOD_PROFILES,
  SIGN_SYSTEM,
  SIGN_THEORY_VERSION
} from "../src/lib/knowledge/signTheoryCatalog";

async function main() {
  const outputPath = resolve("prisma/data/sign-theory-catalog.json");
  const output = {
    version: SIGN_THEORY_VERSION,
    system: SIGN_SYSTEM,
    directions: SIGN_DIRECTIONS,
    domains: SIGN_DOMAINS,
    periods: SIGN_PERIOD_PROFILES,
    entries: SIGN_ENTRIES,
    methodRules: SIGN_METHOD_RULES
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(JSON.stringify({
    output: outputPath,
    directions: SIGN_DIRECTIONS.length,
    domains: SIGN_DOMAINS.length,
    periods: SIGN_PERIOD_PROFILES.length,
    entries: SIGN_ENTRIES.length,
    methodRules: SIGN_METHOD_RULES.length
  }));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
