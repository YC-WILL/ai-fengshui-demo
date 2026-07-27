import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const migration = readFileSync(
  "prisma/migrations/20260727000000_add_plate_record_entities/migration.sql",
  "utf8",
);

function modelBlock(name: string) {
  const match = schema.match(new RegExp(`model ${name} \\{([\\s\\S]*?)\\n\\}`));
  expect(match, `${name} model should exist`).not.toBeNull();
  return match?.[1] ?? "";
}

describe("plate record data contract", () => {
  it("defines immutable snapshot inputs, results, versions and idempotency", () => {
    const snapshot = modelBlock("PlateSnapshot");

    expect(snapshot).toContain("id               String   @id @default(uuid()) @db.Uuid");
    expect(snapshot).toContain("requestId        String   @unique @db.Uuid");
    expect(snapshot).toContain("inputSnapshot    Json");
    expect(snapshot).toContain("resultSnapshot   Json");
    expect(snapshot).toContain("resultDate       String?");
    expect(snapshot).toContain("profileUpdatedAt DateTime?");
    expect(snapshot).toContain("calculatedAt     DateTime");
    expect(snapshot).not.toContain("updatedAt");
    expect(snapshot).toContain("@@index([userId, createdAt])");
    expect(snapshot).toContain("@@index([userId, plateType, createdAt])");
  });

  it("keeps one action per snapshot and append-only idempotent reviews", () => {
    const action = modelBlock("PlateAction");
    const review = modelBlock("PlateActionReview");

    expect(action).toContain("snapshotId    String    @unique @db.Uuid");
    expect(action).toContain("actionData    Json");
    expect(action).toContain('status        String    @default("pending")');
    expect(action).toContain("completedAt   DateTime?");
    expect(action).toContain("updatedAt     DateTime  @updatedAt");

    expect(review).toContain("requestId     String   @unique @db.Uuid");
    expect(review).toContain("reviewData    Json");
    expect(review).not.toContain("updatedAt");
    expect(review).toContain("@@index([actionId, createdAt])");
  });

  it("cascades only down the User-snapshot-action-review ownership chain", () => {
    const user = modelBlock("User");

    expect(user).toContain("plateSnapshots");
    expect(migration).toContain(
      'FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE',
    );
    expect(migration).toContain(
      'FOREIGN KEY ("snapshotId") REFERENCES "PlateSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE',
    );
    expect(migration).toContain(
      'FOREIGN KEY ("actionId") REFERENCES "PlateAction"("id") ON DELETE CASCADE ON UPDATE CASCADE',
    );
    expect(migration).not.toContain('"UserProfile"');
    expect(modelBlock("Report")).not.toContain("Plate");
  });

  it("encodes all database uniqueness guarantees required for retries", () => {
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "PlateSnapshot_requestId_key" ON "PlateSnapshot"("requestId")',
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "PlateAction_snapshotId_key" ON "PlateAction"("snapshotId")',
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "PlateActionReview_requestId_key" ON "PlateActionReview"("requestId")',
    );
  });
});
