import { describe, expect, it } from "vitest";
import {
  drawSignForUser,
  getSignByIdForUser,
  SignAccessDeniedError,
  SignKnowledgeUnavailableError
} from "@/lib/signs/service";

function createFakeClient(options: { noKnowledge?: boolean } = {}) {
  const records = new Map<string, Record<string, unknown>>();
  const entry = {
    id: "entry-1",
    systemId: "system-1",
    number: 4,
    title: "蒙签",
    stage: "prepare",
    primaryDirectionCode: "clarify",
    secondaryDirectionCode: "wait",
    contentStatus: "foundation",
    sourceNote: "结构化整理，待逐签审校。",
    version: "v1",
    system: { id: "system-1" },
    hexagram: { name: "蒙", symbol: "䷃", judgment: "亨。匪我求童蒙，童蒙求我。" }
  };
  const keyOf = (input: { userId: string; signDate: string; period: string }) =>
    `${input.userId}:${input.signDate}:${input.period}`;
  return {
    records,
    client: {
      signDraw: {
        findUnique: async ({ where }: { where: Record<string, unknown> }) => {
          if ("id" in where) {
            return [...records.values()].find(item => item.id === where.id) ?? null;
          }
          return records.get(keyOf(where.userId_signDate_period as never)) ?? null;
        },
        create: async ({ data }: { data: Record<string, unknown> }) => {
          const key = keyOf(data as never);
          if (records.has(key)) throw { code: "P2002" };
          const record = {
            id: `draw-${records.size + 1}`,
            ...data,
            createdAt: new Date()
          };
          records.set(key, record);
          return record;
        }
      },
      signEntry: {
        findMany: async () => options.noKnowledge ? [] : [entry]
      },
      signDirection: {
        findFirst: async ({ where }: { where: { code: string } }) => ({
          code: where.code,
          name: where.code === "clarify" ? "明辨" : "等待",
          meaning: where.code === "clarify" ? "先核对事实。" : "等待关键条件。",
          actionPrinciple: "用10分钟补齐一个关键事实。",
          caution: "不要把猜测当成事实。"
        })
      },
      signPeriodProfile: {
        findFirst: async () => ({
          name: "早签",
          focus: "起势、定意与今天的第一步",
          guidingQuestion: "今天最值得先开始的是什么？"
        })
      }
    }
  };
}

describe("formal sign draw service", () => {
  const morning = new Date("2026-07-22T22:30:00.000Z");

  it("returns the same original sign for repeated and concurrent requests", async () => {
    const fake = createFakeClient();
    const [first, second] = await Promise.all([
      drawSignForUser("user-a", morning, fake.client as never, () => 0),
      drawSignForUser("user-a", morning, fake.client as never, () => 0)
    ]);
    expect(first.id).toBe(second.id);
    expect(fake.records.size).toBe(1);
    const repeated = await drawSignForUser("user-a", morning, fake.client as never, () => 0);
    expect(repeated.id).toBe(first.id);
    expect(repeated.repeated).toBe(true);
  });

  it("isolates different users and rejects cross-user access", async () => {
    const fake = createFakeClient();
    const first = await drawSignForUser("user-a", morning, fake.client as never, () => 0);
    const second = await drawSignForUser("user-b", morning, fake.client as never, () => 0);
    expect(first.id).not.toBe(second.id);
    await expect(getSignByIdForUser("user-b", first.id, fake.client as never))
      .rejects.toBeInstanceOf(SignAccessDeniedError);
  });

  it("stops instead of inventing a sign when structured knowledge is unavailable", async () => {
    const fake = createFakeClient({ noKnowledge: true });
    await expect(drawSignForUser("user-a", morning, fake.client as never, () => 0))
      .rejects.toBeInstanceOf(SignKnowledgeUnavailableError);
  });
});
