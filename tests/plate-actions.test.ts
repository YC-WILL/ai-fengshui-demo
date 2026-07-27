import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PLATE_ENGINE_VERSIONS,
  PLATE_PROTOCOL_VERSION,
  type PlateSnapshotRecord
} from "@/lib/plateRecords";
import {
  createPlateActionForUser,
  createPlateActionRequestSchema,
  createPlateActionReviewForUser,
  createPlateActionReviewRequestSchema,
  extractActionData,
  getPlateActionForSnapshot,
  PLATE_ACTION_REVIEW_VERSION,
  PLATE_ACTION_VERSION,
  updatePlateActionRequestSchema,
  updatePlateActionStatusForUser,
  type PlateActionClient,
  type PlateActionRecord,
  type PlateActionReviewRecord
} from "@/lib/plateActions";

const UUID = {
  snapshotA: "20000000-0000-4000-8000-000000000001",
  snapshotB: "20000000-0000-4000-8000-000000000002",
  snapshotC: "20000000-0000-4000-8000-000000000003",
  snapshotD: "20000000-0000-4000-8000-000000000004",
  actionA: "30000000-0000-4000-8000-000000000001",
  actionB: "30000000-0000-4000-8000-000000000002",
  reviewA: "40000000-0000-4000-8000-000000000001",
  reviewB: "40000000-0000-4000-8000-000000000002",
  requestA: "50000000-0000-4000-8000-000000000001",
  requestB: "50000000-0000-4000-8000-000000000002"
} as const;

const NOW = new Date("2026-07-27T08:00:00.000Z");

function snapshot(
  id: string,
  userId: string,
  plateType: keyof typeof PLATE_ENGINE_VERSIONS,
  resultSnapshot: unknown
): PlateSnapshotRecord {
  return {
    id,
    requestId: crypto.randomUUID(),
    userId,
    plateType,
    protocolVersion: PLATE_PROTOCOL_VERSION,
    engineVersion: PLATE_ENGINE_VERSIONS[plateType],
    inputSnapshot: {},
    resultSnapshot,
    resultDate: "2026-07-27",
    profileUpdatedAt: null,
    calculatedAt: NOW,
    createdAt: NOW
  };
}

function resultFor(plateType: keyof typeof PLATE_ENGINE_VERSIONS): unknown {
  if (plateType === "BAZI") {
    return {
      chart: {},
      weeklyAction: {
        sourceCardId: "starting",
        sourceTitle: "启动方式",
        action: "先写下三条事实，再完成一个十分钟步骤。"
      }
    };
  }
  if (plateType === "RELATION") {
    return {
      jointAction: {
        sourceCardId: "collaboration",
        title: "一起确认一件事",
        action: "双方各说一个最需要确认的事实。",
        doneWhen: "两项事实都已经得到确认。",
        durationMinutes: 20
      }
    };
  }
  if (plateType === "HOME") {
    return {
      assessment: {
        action: {
          sourceFactId: "rest:rest_persistent_noise",
          sourceArea: "rest",
          sourceIssueId: "rest_persistent_noise",
          durationMinutes: 15,
          text: "记录噪声最明显的时段和位置。",
          doneWhen: "已经记录三个时段。",
          requiresProfessional: false
        }
      }
    };
  }
  return {
    selectedCandidate: {
      date: "2026-07-30",
      weekday: "星期四",
      action: {
        sourceEvent: "signing",
        sourceDate: "2026-07-30",
        durationMinutes: 20,
        text: "整理签约前仍待确认的条款。",
        doneWhen: "每类条款都标明已确认版本。"
      }
    }
  };
}

function createFakeClient() {
  const snapshots = new Map<string, PlateSnapshotRecord>();
  const actions = new Map<string, PlateActionRecord>();
  const reviews = new Map<string, PlateActionReviewRecord>();
  let sequence = 0;

  const client: PlateActionClient = {
    plateSnapshot: {
      findFirst: async ({ where }) => {
        const item = snapshots.get(where.id);
        return item?.userId === where.userId ? item : null;
      }
    },
    plateAction: {
      create: async ({ data }) => {
        if ([...actions.values()].some(item => item.snapshotId === data.snapshotId)) {
          throw { code: "P2002" };
        }
        sequence += 1;
        const item: PlateActionRecord = {
          id: `30000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`,
          snapshotId: data.snapshotId as string,
          actionVersion: data.actionVersion as string,
          actionData: data.actionData,
          status: data.status as string,
          completedAt: null,
          createdAt: new Date(NOW.getTime() + sequence),
          updatedAt: new Date(NOW.getTime() + sequence)
        };
        actions.set(item.id, item);
        return item;
      },
      findUnique: async ({ where, include }) => {
        const item = [...actions.values()].find(action => action.snapshotId === where.snapshotId);
        if (!item) return null;
        if (!include) return item;
        return {
          ...item,
          reviews: [...reviews.values()]
            .filter(review => review.actionId === item.id)
            .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
        };
      },
      findFirst: async ({ where }) => {
        const item = actions.get(where.id);
        if (!item) return null;
        const owner = snapshots.get(item.snapshotId)?.userId;
        return owner === where.snapshot.userId
          ? { ...item, snapshot: { userId: owner } }
          : null;
      },
      update: async ({ where, data }) => {
        const item = actions.get(where.id);
        if (!item) throw { code: "P2025" };
        const updated = {
          ...item,
          ...data,
          updatedAt: new Date(item.updatedAt.getTime() + 1)
        };
        actions.set(item.id, updated);
        return updated;
      }
    },
    plateActionReview: {
      create: async ({ data }) => {
        if (reviews.has(data.requestId as string)) throw { code: "P2002" };
        sequence += 1;
        const item: PlateActionReviewRecord = {
          id: `40000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`,
          requestId: data.requestId as string,
          actionId: data.actionId as string,
          reviewVersion: data.reviewVersion as string,
          reviewData: data.reviewData,
          createdAt: new Date(NOW.getTime() + sequence)
        };
        reviews.set(item.requestId, item);
        return item;
      },
      findUnique: async ({ where }) => {
        const item = reviews.get(where.requestId);
        if (!item) return null;
        const action = actions.get(item.actionId);
        const userId = action ? snapshots.get(action.snapshotId)?.userId : undefined;
        if (!action || !userId) return null;
        return { ...item, action: { snapshot: { userId } } };
      }
    }
  };

  function addSnapshot(item: PlateSnapshotRecord) {
    snapshots.set(item.id, item);
  }

  function addAction(item: PlateActionRecord) {
    actions.set(item.id, item);
  }

  function deleteSnapshot(id: string) {
    snapshots.delete(id);
    for (const action of [...actions.values()]) {
      if (action.snapshotId !== id) continue;
      actions.delete(action.id);
      for (const review of [...reviews.values()]) {
        if (review.actionId === action.id) reviews.delete(review.requestId);
      }
    }
  }

  function deleteAction(id: string) {
    actions.delete(id);
    for (const review of [...reviews.values()]) {
      if (review.actionId === id) reviews.delete(review.requestId);
    }
  }

  return {
    client,
    snapshots,
    actions,
    reviews,
    addSnapshot,
    addAction,
    deleteSnapshot,
    deleteAction
  };
}

const routeHarness = vi.hoisted(() => {
  const snapshots = new Map<string, Record<string, unknown>>();
  const actions = new Map<string, Record<string, unknown>>();
  const reviews = new Map<string, Record<string, unknown>>();
  const client = {
    plateSnapshot: {
      findFirst: vi.fn(async ({ where }: { where: { id: string; userId: string } }) => {
        const item = snapshots.get(where.id);
        return item?.userId === where.userId ? item : null;
      })
    },
    plateAction: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const existing = [...actions.values()].find(item => item.snapshotId === data.snapshotId);
        if (existing) throw { code: "P2002" };
        const item = {
          id: crypto.randomUUID(),
          ...data,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        actions.set(item.id, item);
        return item;
      }),
      findUnique: vi.fn(async ({ where, include }: {
        where: { snapshotId: string };
        include?: unknown;
      }) => {
        const item = [...actions.values()].find(action => action.snapshotId === where.snapshotId);
        if (!item) return null;
        return include
          ? { ...item, reviews: [...reviews.values()].filter(review => review.actionId === item.id) }
          : item;
      }),
      findFirst: vi.fn(async ({ where }: {
        where: { id: string; snapshot: { userId: string } };
      }) => {
        const item = actions.get(where.id);
        const owner = item ? snapshots.get(item.snapshotId as string)?.userId : undefined;
        return item && owner === where.snapshot.userId
          ? { ...item, snapshot: { userId: owner } }
          : null;
      }),
      update: vi.fn(async ({ where, data }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        const item = actions.get(where.id);
        if (!item) throw new Error("missing");
        const updated = { ...item, ...data, updatedAt: new Date() };
        actions.set(where.id, updated);
        return updated;
      })
    },
    plateActionReview: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        if (reviews.has(data.requestId as string)) throw { code: "P2002" };
        const item = { id: crypto.randomUUID(), ...data, createdAt: new Date() };
        reviews.set(data.requestId as string, item);
        return item;
      }),
      findUnique: vi.fn(async ({ where }: { where: { requestId: string } }) => {
        const item = reviews.get(where.requestId);
        if (!item) return null;
        const action = actions.get(item.actionId as string);
        const owner = action ? snapshots.get(action.snapshotId as string)?.userId : undefined;
        return action && owner ? { ...item, action: { snapshot: { userId: owner } } } : null;
      })
    }
  };
  return { snapshots, actions, reviews, client, userId: "route-user-a" };
});

vi.mock("@/lib/db", () => ({ prisma: routeHarness.client }));
vi.mock("@/lib/auth", () => ({
  getOrCreateUser: vi.fn(async () => ({ id: routeHarness.userId }))
}));

describe("action extraction", () => {
  it.each(["BAZI", "RELATION", "HOME", "TIMING"] as const)(
    "extracts and normalizes %s action",
    plateType => {
      const data = extractActionData(snapshot(
        UUID.snapshotA,
        "user-a",
        plateType,
        resultFor(plateType)
      ));
      expect(data.plateType).toBe(plateType);
      expect(data.text.length).toBeGreaterThan(0);
      expect(data.requiresProfessional).toBe(plateType === "HOME" ? false : false);
      expect(() => JSON.stringify(data)).not.toThrow();
    }
  );

  it.each([
    ["BAZI null", "BAZI", { weeklyAction: null }],
    ["HOME null", "HOME", { assessment: { action: null } }],
    ["TIMING no selection", "TIMING", { selectedCandidate: null }],
    ["damaged result", "RELATION", { jointAction: { action: 42 } }]
  ] as const)("rejects %s", (_name, plateType, result) => {
    expect(() => extractActionData(snapshot(
      UUID.snapshotA,
      "user-a",
      plateType,
      result
    ))).toThrow(expect.objectContaining({ status: 409 }));
  });

  it("rejects unsupported protocol and engine versions", () => {
    const protocol = snapshot(UUID.snapshotA, "user-a", "BAZI", resultFor("BAZI"));
    protocol.protocolVersion = "plate-snapshot-v0";
    expect(() => extractActionData(protocol)).toThrow(expect.objectContaining({ status: 409 }));

    const engine = snapshot(UUID.snapshotB, "user-a", "BAZI", resultFor("BAZI"));
    engine.engineVersion = "unknown";
    expect(() => extractActionData(engine)).toThrow(expect.objectContaining({ status: 409 }));
  });

  it("strictly rejects client-controlled action and status fields", () => {
    expect(createPlateActionRequestSchema.safeParse({ actionData: { text: "伪造" } }).success)
      .toBe(false);
    expect(updatePlateActionRequestSchema.safeParse({
      status: "completed",
      completedAt: NOW.toISOString()
    }).success).toBe(false);
    expect(updatePlateActionRequestSchema.safeParse({ status: "done" }).success).toBe(false);
    expect(createPlateActionReviewRequestSchema.safeParse({
      requestId: UUID.requestA,
      outcome: "helpful",
      reviewVersion: "forged"
    }).success).toBe(false);
  });
});

describe("action creation, ownership, and status", () => {
  it("creates once, replays, and handles concurrent requests", async () => {
    const fake = createFakeClient();
    fake.addSnapshot(snapshot(UUID.snapshotA, "user-a", "BAZI", resultFor("BAZI")));
    const [first, second] = await Promise.all([
      createPlateActionForUser("user-a", UUID.snapshotA, fake.client),
      createPlateActionForUser("user-a", UUID.snapshotA, fake.client)
    ]);
    expect(first.replayed || second.replayed).toBe(true);
    expect(first.action.id).toBe(second.action.id);
    expect(fake.actions.size).toBe(1);
    const third = await createPlateActionForUser("user-a", UUID.snapshotA, fake.client);
    expect(third.replayed).toBe(true);
  });

  it("returns 409 instead of overwriting inconsistent existing content", async () => {
    const fake = createFakeClient();
    fake.addSnapshot(snapshot(UUID.snapshotA, "user-a", "BAZI", resultFor("BAZI")));
    fake.addAction({
      id: UUID.actionA,
      snapshotId: UUID.snapshotA,
      actionVersion: PLATE_ACTION_VERSION,
      actionData: { text: "different" },
      status: "pending",
      completedAt: null,
      createdAt: NOW,
      updatedAt: NOW
    });
    await expect(createPlateActionForUser("user-a", UUID.snapshotA, fake.client))
      .rejects.toMatchObject({ status: 409 });
  });

  it("hides other users' snapshots/actions and returns null before action creation", async () => {
    const fake = createFakeClient();
    fake.addSnapshot(snapshot(UUID.snapshotA, "user-a", "HOME", resultFor("HOME")));
    expect(await getPlateActionForSnapshot("user-a", UUID.snapshotA, fake.client))
      .toEqual({ action: null });
    await expect(createPlateActionForUser("user-b", UUID.snapshotA, fake.client))
      .rejects.toMatchObject({ status: 404 });

    const created = await createPlateActionForUser("user-a", UUID.snapshotA, fake.client);
    await expect(updatePlateActionStatusForUser(
      "user-b",
      created.action.id,
      "completed",
      fake.client
    )).rejects.toMatchObject({ status: 404 });
  });

  it("supports pending, completed, reopened pending, and dismissed semantics", async () => {
    const fake = createFakeClient();
    fake.addSnapshot(snapshot(UUID.snapshotA, "user-a", "RELATION", resultFor("RELATION")));
    const created = await createPlateActionForUser("user-a", UUID.snapshotA, fake.client);

    const completed = await updatePlateActionStatusForUser(
      "user-a",
      created.action.id,
      "completed",
      fake.client,
      () => NOW
    );
    expect(completed.status).toBe("completed");
    expect(completed.completedAt).toEqual(NOW);

    const repeated = await updatePlateActionStatusForUser(
      "user-a",
      created.action.id,
      "completed",
      fake.client,
      () => new Date("2026-07-28T00:00:00Z")
    );
    expect(repeated.completedAt).toEqual(NOW);

    const reopened = await updatePlateActionStatusForUser(
      "user-a",
      created.action.id,
      "pending",
      fake.client
    );
    expect(reopened.completedAt).toBeNull();

    const dismissed = await updatePlateActionStatusForUser(
      "user-a",
      created.action.id,
      "dismissed",
      fake.client
    );
    expect(dismissed.status).toBe("dismissed");
    expect(dismissed.completedAt).toBeNull();
  });
});

describe("append-only reviews", () => {
  it("allows completed actions, normalizes notes, and replays identical requests", async () => {
    const fake = createFakeClient();
    fake.addSnapshot(snapshot(UUID.snapshotA, "user-a", "HOME", resultFor("HOME")));
    const action = await createPlateActionForUser("user-a", UUID.snapshotA, fake.client);
    await updatePlateActionStatusForUser(
      "user-a",
      action.action.id,
      "completed",
      fake.client,
      () => NOW
    );
    const request = createPlateActionReviewRequestSchema.parse({
      requestId: UUID.requestA,
      outcome: "helpful",
      note: "  确实更容易执行  "
    });
    const first = await createPlateActionReviewForUser(
      "user-a",
      action.action.id,
      request,
      fake.client
    );
    const replay = await createPlateActionReviewForUser(
      "user-a",
      action.action.id,
      request,
      fake.client
    );
    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.review.id).toBe(first.review.id);
    expect(first.review.reviewData).toEqual({
      outcome: "helpful",
      note: "确实更容易执行"
    });
  });

  it.each(["pending", "dismissed"] as const)("rejects reviews while %s", async status => {
    const fake = createFakeClient();
    fake.addSnapshot(snapshot(UUID.snapshotA, "user-a", "HOME", resultFor("HOME")));
    const action = await createPlateActionForUser("user-a", UUID.snapshotA, fake.client);
    if (status === "dismissed") {
      await updatePlateActionStatusForUser(
        "user-a",
        action.action.id,
        "dismissed",
        fake.client
      );
    }
    await expect(createPlateActionReviewForUser(
      "user-a",
      action.action.id,
      { requestId: UUID.requestA, outcome: "mixed" },
      fake.client
    )).rejects.toMatchObject({ status: 409 });
  });

  it("rejects requestId conflicts across content, actions, and users", async () => {
    const fake = createFakeClient();
    fake.addSnapshot(snapshot(UUID.snapshotA, "user-a", "BAZI", resultFor("BAZI")));
    fake.addSnapshot(snapshot(UUID.snapshotB, "user-a", "HOME", resultFor("HOME")));
    fake.addSnapshot(snapshot(UUID.snapshotC, "user-b", "RELATION", resultFor("RELATION")));
    const actions = await Promise.all([
      createPlateActionForUser("user-a", UUID.snapshotA, fake.client),
      createPlateActionForUser("user-a", UUID.snapshotB, fake.client),
      createPlateActionForUser("user-b", UUID.snapshotC, fake.client)
    ]);
    await Promise.all([
      updatePlateActionStatusForUser("user-a", actions[0].action.id, "completed", fake.client),
      updatePlateActionStatusForUser("user-a", actions[1].action.id, "completed", fake.client),
      updatePlateActionStatusForUser("user-b", actions[2].action.id, "completed", fake.client)
    ]);
    await createPlateActionReviewForUser(
      "user-a",
      actions[0].action.id,
      { requestId: UUID.requestA, outcome: "helpful" },
      fake.client
    );
    await expect(createPlateActionReviewForUser(
      "user-a",
      actions[0].action.id,
      { requestId: UUID.requestA, outcome: "mixed" },
      fake.client
    )).rejects.toMatchObject({ status: 409 });
    await expect(createPlateActionReviewForUser(
      "user-a",
      actions[1].action.id,
      { requestId: UUID.requestA, outcome: "helpful" },
      fake.client
    )).rejects.toMatchObject({ status: 409 });
    await expect(createPlateActionReviewForUser(
      "user-b",
      actions[2].action.id,
      { requestId: UUID.requestA, outcome: "helpful" },
      fake.client
    )).rejects.toMatchObject({ status: 409 });
  });

  it("returns reviews in ascending createdAt order", async () => {
    const fake = createFakeClient();
    fake.addSnapshot(snapshot(UUID.snapshotA, "user-a", "TIMING", resultFor("TIMING")));
    const action = await createPlateActionForUser("user-a", UUID.snapshotA, fake.client);
    await updatePlateActionStatusForUser(
      "user-a",
      action.action.id,
      "completed",
      fake.client
    );
    await createPlateActionReviewForUser(
      "user-a",
      action.action.id,
      { requestId: UUID.requestA, outcome: "mixed" },
      fake.client
    );
    await createPlateActionReviewForUser(
      "user-a",
      action.action.id,
      { requestId: UUID.requestB, outcome: "helpful" },
      fake.client
    );
    const result = await getPlateActionForSnapshot("user-a", UUID.snapshotA, fake.client);
    expect(result.action?.reviews.map(review => review.requestId))
      .toEqual([UUID.requestA, UUID.requestB]);
  });
});

describe("cascade behavior contract", () => {
  it("deleting snapshot removes action/reviews while profile ownership remains external", async () => {
    const fake = createFakeClient();
    fake.addSnapshot(snapshot(UUID.snapshotA, "user-a", "BAZI", resultFor("BAZI")));
    const action = await createPlateActionForUser("user-a", UUID.snapshotA, fake.client);
    await updatePlateActionStatusForUser("user-a", action.action.id, "completed", fake.client);
    await createPlateActionReviewForUser(
      "user-a",
      action.action.id,
      { requestId: UUID.requestA, outcome: "helpful" },
      fake.client
    );
    fake.deleteSnapshot(UUID.snapshotA);
    expect(fake.actions.size).toBe(0);
    expect(fake.reviews.size).toBe(0);
  });

  it("deleting action removes reviews but keeps snapshot", async () => {
    const fake = createFakeClient();
    fake.addSnapshot(snapshot(UUID.snapshotA, "user-a", "BAZI", resultFor("BAZI")));
    const action = await createPlateActionForUser("user-a", UUID.snapshotA, fake.client);
    await updatePlateActionStatusForUser("user-a", action.action.id, "completed", fake.client);
    await createPlateActionReviewForUser(
      "user-a",
      action.action.id,
      { requestId: UUID.requestA, outcome: "helpful" },
      fake.client
    );
    fake.deleteAction(action.action.id);
    expect(fake.reviews.size).toBe(0);
    expect(fake.snapshots.has(UUID.snapshotA)).toBe(true);
  });
});

describe("action API status and surface", () => {
  beforeEach(() => {
    routeHarness.snapshots.clear();
    routeHarness.actions.clear();
    routeHarness.reviews.clear();
    routeHarness.userId = "route-user-a";
  });

  it("returns 201 then 200, exposes null before creation, and rejects forged body", async () => {
    const route = await import("@/app/api/plate-records/[id]/action/route");
    routeHarness.snapshots.set(UUID.snapshotA, snapshot(
      UUID.snapshotA,
      "route-user-a",
      "BAZI",
      resultFor("BAZI")
    ) as unknown as Record<string, unknown>);
    const context = { params: { id: UUID.snapshotA } };
    const before = await route.GET(new Request("http://localhost"), context);
    expect(await before.json()).toMatchObject({ data: { action: null } });

    const makeRequest = (body: unknown) => new NextRequest("http://localhost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const first = await route.POST(makeRequest({}), context);
    const replay = await route.POST(makeRequest({}), context);
    const forged = await route.POST(makeRequest({ actionData: { text: "伪造" } }), context);
    expect(first.status).toBe(201);
    expect(replay.status).toBe(200);
    expect(forged.status).toBe(400);
  });

  it("returns 404 across users and supports PATCH/review status codes", async () => {
    const actionRoute = await import("@/app/api/plate-records/[id]/action/route");
    const statusRoute = await import("@/app/api/plate-actions/[id]/route");
    const reviewRoute = await import("@/app/api/plate-actions/[id]/reviews/route");
    routeHarness.snapshots.set(UUID.snapshotA, snapshot(
      UUID.snapshotA,
      "route-user-a",
      "HOME",
      resultFor("HOME")
    ) as unknown as Record<string, unknown>);
    const createdResponse = await actionRoute.POST(
      new NextRequest("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}"
      }),
      { params: { id: UUID.snapshotA } }
    );
    const created = await createdResponse.json() as { data: { id: string } };

    routeHarness.userId = "route-user-b";
    const foreignGet = await actionRoute.GET(
      new Request("http://localhost"),
      { params: { id: UUID.snapshotA } }
    );
    const foreignPatch = await statusRoute.PATCH(
      new NextRequest("http://localhost", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "completed" })
      }),
      { params: { id: created.data.id } }
    );
    const foreignReview = await reviewRoute.POST(
      new NextRequest("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestId: UUID.requestA,
          outcome: "helpful"
        })
      }),
      { params: { id: created.data.id } }
    );
    expect(foreignGet.status).toBe(404);
    expect(foreignPatch.status).toBe(404);
    expect(foreignReview.status).toBe(404);

    routeHarness.userId = "route-user-a";
    const completed = await statusRoute.PATCH(
      new NextRequest("http://localhost", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "completed" })
      }),
      { params: { id: created.data.id } }
    );
    expect(completed.status).toBe(200);
    const reviewBody = {
      requestId: UUID.requestA,
      outcome: "helpful"
    };
    const makeReview = () => new NextRequest("http://localhost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(reviewBody)
    });
    expect((await reviewRoute.POST(makeReview(), { params: { id: created.data.id } })).status)
      .toBe(201);
    expect((await reviewRoute.POST(makeReview(), { params: { id: created.data.id } })).status)
      .toBe(200);
  });

  it("returns 404 rather than 500 for malformed snapshot and action IDs", async () => {
    const actionRoute = await import("@/app/api/plate-records/[id]/action/route");
    const statusRoute = await import("@/app/api/plate-actions/[id]/route");
    const reviewRoute = await import("@/app/api/plate-actions/[id]/reviews/route");
    const invalidContext = { params: { id: "not-a-uuid" } };

    expect((await actionRoute.GET(new Request("http://localhost"), invalidContext)).status)
      .toBe(404);
    expect((await actionRoute.POST(
      new NextRequest("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}"
      }),
      invalidContext
    )).status).toBe(404);
    expect((await statusRoute.PATCH(
      new NextRequest("http://localhost", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "completed" })
      }),
      invalidContext
    )).status).toBe(404);
    expect((await reviewRoute.POST(
      new NextRequest("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestId: UUID.requestA,
          outcome: "helpful"
        })
      }),
      invalidContext
    )).status).toBe(404);
  });

  it("does not expose forbidden deletion or review mutation handlers", async () => {
    const actionRoute = await import("@/app/api/plate-actions/[id]/route");
    const reviewRoute = await import("@/app/api/plate-actions/[id]/reviews/route");
    expect(actionRoute).not.toHaveProperty("DELETE");
    expect(actionRoute).not.toHaveProperty("POST");
    expect(reviewRoute).not.toHaveProperty("GET");
    expect(reviewRoute).not.toHaveProperty("PATCH");
    expect(reviewRoute).not.toHaveProperty("DELETE");
  });
});

describe("review versions", () => {
  it("uses fixed versions", () => {
    expect(PLATE_ACTION_VERSION).toBe("plate-action-v1");
    expect(PLATE_ACTION_REVIEW_VERSION).toBe("plate-action-review-v1");
  });
});
