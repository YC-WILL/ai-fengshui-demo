import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPlateSnapshotForUser,
  deletePlateSnapshotForUser,
  getPlateSnapshotForUser,
  plateRecordRequestSchema,
  PlateRecordError,
  type PlateRecordClient,
  type PlateRecordRequest,
  type PlateSnapshotRecord
} from "@/lib/plateRecords";

const routeState = vi.hoisted(() => {
  const records = new Map<string, Record<string, unknown>>();
  return {
    records,
    userId: "route-user-a",
    prisma: {
      userProfile: {
        findUnique: vi.fn(async () => null)
      },
      plateSnapshot: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const requestId = data.requestId as string;
          if (records.has(requestId)) throw { code: "P2002" };
          const record = {
            id: crypto.randomUUID(),
            ...data,
            createdAt: new Date("2026-07-27T03:00:00.000Z")
          };
          records.set(requestId, record);
          return record;
        }),
        findUnique: vi.fn(async ({ where }: { where: { requestId: string } }) => {
          return records.get(where.requestId) ?? null;
        }),
        findFirst: vi.fn(async ({ where }: { where: { id: string; userId: string } }) => {
          return [...records.values()].find(
            record => record.id === where.id && record.userId === where.userId
          ) ?? null;
        }),
        deleteMany: vi.fn(async ({ where }: { where: { id: string; userId: string } }) => {
          const entry = [...records.entries()].find(
            ([, record]) => record.id === where.id && record.userId === where.userId
          );
          if (!entry) return { count: 0 };
          records.delete(entry[0]);
          return { count: 1 };
        })
      }
    }
  };
});

vi.mock("@/lib/auth", () => ({
  getOrCreateUser: vi.fn(async () => ({ id: routeState.userId }))
}));

vi.mock("@/lib/db", () => ({ prisma: routeState.prisma }));

const PROFILE_UPDATED_AT = new Date("2026-07-25T10:00:00.000Z");
const CALCULATED_AT = new Date("2026-07-27T03:00:00.000Z");
const UUIDS = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
  "00000000-0000-4000-8000-000000000003",
  "00000000-0000-4000-8000-000000000004",
  "00000000-0000-4000-8000-000000000005",
  "00000000-0000-4000-8000-000000000006",
  "00000000-0000-4000-8000-000000000007",
  "00000000-0000-4000-8000-000000000008"
] as const;

function createFakeClient(options: { withProfile?: boolean } = {}) {
  const records = new Map<string, PlateSnapshotRecord>();
  const profiles = new Map<string, {
    birthDate: string | null;
    birthTime: string | null;
    birthLocation: string | null;
    timezone: string | null;
    gender: string | null;
    updatedAt: Date;
  }>();
  const actions = new Set<string>();
  const reviews = new Set<string>();

  if (options.withProfile !== false) {
    for (const userId of ["user-a", "user-b"]) {
      profiles.set(userId, {
        birthDate: "1990-05-20",
        birthTime: "08:30",
        birthLocation: "上海",
        timezone: "Asia/Shanghai",
        gender: "female",
        updatedAt: PROFILE_UPDATED_AT
      });
    }
  }

  const client: PlateRecordClient = {
    userProfile: {
      findUnique: async ({ where }) => profiles.get(where.userId) ?? null
    },
    plateSnapshot: {
      create: async ({ data }) => {
        if (records.has(data.requestId as string)) throw { code: "P2002" };
        const record: PlateSnapshotRecord = {
          id: crypto.randomUUID(),
          requestId: data.requestId as string,
          userId: data.userId as string,
          plateType: data.plateType as string,
          protocolVersion: data.protocolVersion as string,
          engineVersion: data.engineVersion as string,
          inputSnapshot: data.inputSnapshot,
          resultSnapshot: data.resultSnapshot,
          resultDate: data.resultDate as string,
          profileUpdatedAt: data.profileUpdatedAt as Date | null,
          calculatedAt: data.calculatedAt as Date,
          createdAt: CALCULATED_AT
        };
        records.set(record.requestId, record);
        return record;
      },
      findUnique: async ({ where }) => records.get(where.requestId) ?? null,
      findFirst: async ({ where }) => {
        return [...records.values()].find(
          record => record.id === where.id && record.userId === where.userId
        ) ?? null;
      },
      deleteMany: async ({ where }) => {
        const record = [...records.values()].find(
          item => item.id === where.id && item.userId === where.userId
        );
        if (!record) return { count: 0 };
        records.delete(record.requestId);
        actions.delete(record.id);
        reviews.delete(record.id);
        return { count: 1 };
      }
    }
  };

  return { client, records, profiles, actions, reviews };
}

function parse(input: unknown): PlateRecordRequest {
  return plateRecordRequestSchema.parse(input);
}

describe("plate record request contract", () => {
  it("accepts and normalizes all four plate inputs", () => {
    expect(parse({
      requestId: UUIDS[0],
      plateType: "BAZI",
      input: {}
    }).plateType).toBe("BAZI");

    const relation = parse({
      requestId: UUIDS[1],
      plateType: "RELATION",
      input: {
        relationshipType: "partner",
        otherBirthDate: "1992-06-12",
        otherNickname: "  小林  "
      }
    });
    expect(relation.input).toMatchObject({ otherNickname: "小林" });

    const emptyNickname = parse({
      requestId: UUIDS[2],
      plateType: "RELATION",
      input: {
        relationshipType: "friend",
        otherBirthDate: "1992-06-12",
        otherNickname: "  "
      }
    });
    if (emptyNickname.plateType !== "RELATION") throw new Error("unexpected plate type");
    expect(emptyNickname.input.otherNickname).toBeUndefined();

    const home = parse({
      requestId: UUIDS[3],
      plateType: "HOME",
      input: {
        areas: {
          entry: { reviewed: true, issues: ["entry_dim", "entry_dim", "entry_clutter"] }
        }
      }
    });
    if (home.plateType !== "HOME") throw new Error("unexpected plate type");
    expect(home.input.areas.entry?.issues).toEqual(["entry_clutter", "entry_dim"]);

    expect(parse({
      requestId: UUIDS[4],
      plateType: "TIMING",
      input: {
        event: "signing",
        startDate: "2026-07-28",
        rangeDays: 7
      }
    }).plateType).toBe("TIMING");
  });

  it.each([
    {
      name: "unknown plate type",
      value: { requestId: UUIDS[0], plateType: "UNKNOWN", input: {} }
    },
    {
      name: "outer extra field",
      value: { requestId: UUIDS[0], plateType: "BAZI", input: {}, resultSnapshot: {} }
    },
    {
      name: "bazi extra field",
      value: { requestId: UUIDS[0], plateType: "BAZI", input: { birthDate: "1990-01-01" } }
    },
    {
      name: "impossible date",
      value: {
        requestId: UUIDS[0],
        plateType: "RELATION",
        input: { relationshipType: "friend", otherBirthDate: "2026-02-30" }
      }
    },
    {
      name: "wrong relationship type",
      value: {
        requestId: UUIDS[0],
        plateType: "RELATION",
        input: { relationshipType: "colleague", otherBirthDate: "1990-01-01" }
      }
    },
    {
      name: "home cross-area issue",
      value: {
        requestId: UUIDS[0],
        plateType: "HOME",
        input: { areas: { entry: { reviewed: true, issues: ["rest_persistent_noise"] } } }
      }
    },
    {
      name: "home without reviewed area",
      value: { requestId: UUIDS[0], plateType: "HOME", input: { areas: {} } }
    },
    {
      name: "invalid timing range",
      value: {
        requestId: UUIDS[0],
        plateType: "TIMING",
        input: { event: "travel", startDate: "2026-07-28", rangeDays: 14 }
      }
    }
  ])("rejects $name", ({ value }) => {
    expect(plateRecordRequestSchema.safeParse(value).success).toBe(false);
  });
});

describe("server-side plate calculation", () => {
  it("recalculates and stores JSON-safe results for all four plates", async () => {
    const fake = createFakeClient();
    const requests = [
      parse({ requestId: UUIDS[0], plateType: "BAZI", input: {} }),
      parse({
        requestId: UUIDS[1],
        plateType: "RELATION",
        input: {
          relationshipType: "cooperation",
          otherBirthDate: "1991-04-15",
          otherNickname: "伙伴"
        }
      }),
      parse({
        requestId: UUIDS[2],
        plateType: "HOME",
        input: {
          areas: {
            rest: { reviewed: true, issues: ["rest_persistent_noise"] }
          }
        }
      }),
      parse({
        requestId: UUIDS[3],
        plateType: "TIMING",
        input: {
          event: "travel",
          startDate: "2026-07-28",
          rangeDays: 7
        }
      })
    ];

    const results = [];
    for (const request of requests) {
      results.push(await createPlateSnapshotForUser(
        "user-a",
        request,
        fake.client,
        () => CALCULATED_AT
      ));
    }

    expect(results).toHaveLength(4);
    for (const result of results) {
      expect(() => JSON.stringify(result.snapshot.inputSnapshot)).not.toThrow();
      expect(() => JSON.stringify(result.snapshot.resultSnapshot)).not.toThrow();
      expect(result.snapshot.resultDate).toBe("2026-07-27");
    }

    const baziInput = results[0].snapshot.inputSnapshot as {
      input: Record<string, never>;
      profile: { birthDate: string };
    };
    expect(baziInput.input).toEqual({});
    expect(baziInput.profile.birthDate).toBe("1990-05-20");
    expect(results[0].snapshot.profileUpdatedAt).toEqual(PROFILE_UPDATED_AT);

    const baziResult = results[0].snapshot.resultSnapshot as {
      chart: { inputSnapshot: { birthDate: string } };
      observations: unknown[];
    };
    expect(baziResult.chart.inputSnapshot.birthDate).toBe("1990-05-20");
    expect(baziResult.observations.length).toBeGreaterThan(0);

    expect(results[2].snapshot.profileUpdatedAt).toBeNull();
    expect(results[2].snapshot.inputSnapshot).not.toHaveProperty("profile");
    const timingResult = results[3].snapshot.resultSnapshot as {
      selection: { candidates: unknown[] };
    };
    expect(Array.isArray(timingResult.selection.candidates)).toBe(true);
  });

  it("does not require a profile for HOME", async () => {
    const fake = createFakeClient({ withProfile: false });
    const result = await createPlateSnapshotForUser(
      "user-without-profile",
      parse({
        requestId: UUIDS[0],
        plateType: "HOME",
        input: { areas: { kitchen: { reviewed: true, issues: [] } } }
      }),
      fake.client,
      () => CALCULATED_AT
    );
    expect(result.snapshot.profileUpdatedAt).toBeNull();
  });

  it("returns 409 for missing profile and selectedDate outside candidates", async () => {
    const noProfile = createFakeClient({ withProfile: false });
    await expect(createPlateSnapshotForUser(
      "user-a",
      parse({ requestId: UUIDS[0], plateType: "BAZI", input: {} }),
      noProfile.client
    )).rejects.toMatchObject({ status: 409 });

    const fake = createFakeClient();
    await expect(createPlateSnapshotForUser(
      "user-a",
      parse({
        requestId: UUIDS[1],
        plateType: "TIMING",
        input: {
          event: "moving",
          startDate: "2026-07-28",
          rangeDays: 7,
          selectedDate: "2027-01-01"
        }
      }),
      fake.client
    )).rejects.toMatchObject({ status: 409 });
  });
});

describe("idempotency and ownership", () => {
  it("returns the original snapshot on identical retry", async () => {
    const fake = createFakeClient();
    const request = parse({ requestId: UUIDS[0], plateType: "BAZI", input: {} });
    const first = await createPlateSnapshotForUser(
      "user-a",
      request,
      fake.client,
      () => CALCULATED_AT
    );
    const second = await createPlateSnapshotForUser(
      "user-a",
      request,
      fake.client,
      () => new Date("2026-07-27T04:00:00.000Z")
    );
    expect(first.replayed).toBe(false);
    expect(second.replayed).toBe(true);
    expect(second.snapshot.id).toBe(first.snapshot.id);
    expect(fake.records.size).toBe(1);
  });

  it("rejects changed input, changed profile basis, and cross-user reuse", async () => {
    const fake = createFakeClient();
    await createPlateSnapshotForUser(
      "user-a",
      parse({
        requestId: UUIDS[0],
        plateType: "HOME",
        input: { areas: { entry: { reviewed: true, issues: [] } } }
      }),
      fake.client
    );
    await expect(createPlateSnapshotForUser(
      "user-a",
      parse({
        requestId: UUIDS[0],
        plateType: "HOME",
        input: { areas: { rest: { reviewed: true, issues: [] } } }
      }),
      fake.client
    )).rejects.toMatchObject({ status: 409 });

    await expect(createPlateSnapshotForUser(
      "user-b",
      parse({
        requestId: UUIDS[0],
        plateType: "HOME",
        input: { areas: { entry: { reviewed: true, issues: [] } } }
      }),
      fake.client
    )).rejects.toMatchObject({ status: 409 });

    const baziRequest = parse({ requestId: UUIDS[1], plateType: "BAZI", input: {} });
    await createPlateSnapshotForUser("user-a", baziRequest, fake.client);
    fake.profiles.get("user-a")!.updatedAt = new Date("2026-07-26T10:00:00.000Z");
    await expect(createPlateSnapshotForUser(
      "user-a",
      baziRequest,
      fake.client
    )).rejects.toMatchObject({ status: 409 });
  });

  it("handles concurrent duplicate writes with only one record", async () => {
    const fake = createFakeClient();
    const request = parse({
      requestId: UUIDS[0],
      plateType: "HOME",
      input: { areas: { kitchen: { reviewed: true, issues: ["kitchen_backtracking"] } } }
    });
    const results = await Promise.all([
      createPlateSnapshotForUser("user-a", request, fake.client),
      createPlateSnapshotForUser("user-a", request, fake.client)
    ]);
    expect(results.filter(result => result.replayed)).toHaveLength(1);
    expect(fake.records.size).toBe(1);
  });

  it("allows only the owner to read or delete and preserves the profile", async () => {
    const fake = createFakeClient();
    const created = await createPlateSnapshotForUser(
      "user-a",
      parse({
        requestId: UUIDS[0],
        plateType: "HOME",
        input: { areas: { entry: { reviewed: true, issues: [] } } }
      }),
      fake.client
    );

    await expect(getPlateSnapshotForUser(
      "user-b",
      created.snapshot.id,
      fake.client
    )).rejects.toMatchObject({ status: 404 });
    await expect(deletePlateSnapshotForUser(
      "user-b",
      created.snapshot.id,
      fake.client
    )).rejects.toMatchObject({ status: 404 });

    expect((await getPlateSnapshotForUser(
      "user-a",
      created.snapshot.id,
      fake.client
    )).id).toBe(created.snapshot.id);
    await deletePlateSnapshotForUser("user-a", created.snapshot.id, fake.client);
    expect(fake.profiles.has("user-a")).toBe(true);
    await expect(getPlateSnapshotForUser(
      "user-a",
      created.snapshot.id,
      fake.client
    )).rejects.toBeInstanceOf(PlateRecordError);
  });
});

describe("snapshot route surface", () => {
  beforeEach(() => {
    routeState.records.clear();
    routeState.userId = "route-user-a";
  });

  it("returns 201 for first save, 200 for replay, 409 for conflict, and 400 for forgery", async () => {
    const { POST } = await import("@/app/api/plate-records/route");
    const body = {
      requestId: UUIDS[0],
      plateType: "HOME",
      input: { areas: { entry: { reviewed: true, issues: [] } } }
    };
    const makeRequest = (value: unknown) => new NextRequest("http://localhost/api/plate-records", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(value)
    });

    const first = await POST(makeRequest(body));
    expect(first.status).toBe(201);
    expect(await first.json()).toMatchObject({ ok: true, replayed: false });

    const replay = await POST(makeRequest(body));
    expect(replay.status).toBe(200);
    expect(await replay.json()).toMatchObject({ ok: true, replayed: true });
    expect(routeState.records.size).toBe(1);

    const conflict = await POST(makeRequest({
      ...body,
      input: { areas: { rest: { reviewed: true, issues: [] } } }
    }));
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toEqual({
      ok: false,
      error: "这个保存请求已被使用，请重新发起保存。"
    });

    const forged = await POST(makeRequest({ ...body, resultSnapshot: { trusted: false } }));
    expect(forged.status).toBe(400);
  });

  it("returns 404 for another user's GET and DELETE, then lets the owner delete", async () => {
    const collectionRoute = await import("@/app/api/plate-records/route");
    const itemRoute = await import("@/app/api/plate-records/[id]/route");
    const request = new NextRequest("http://localhost/api/plate-records", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requestId: UUIDS[1],
        plateType: "HOME",
        input: { areas: { kitchen: { reviewed: true, issues: [] } } }
      })
    });
    const createdResponse = await collectionRoute.POST(request);
    const created = await createdResponse.json() as { data: { id: string } };

    routeState.userId = "route-user-b";
    const foreignGet = await itemRoute.GET(
      new Request("http://localhost"),
      { params: { id: created.data.id } }
    );
    const foreignDelete = await itemRoute.DELETE(
      new Request("http://localhost", { method: "DELETE" }),
      { params: { id: created.data.id } }
    );
    expect(foreignGet.status).toBe(404);
    expect(foreignDelete.status).toBe(404);

    routeState.userId = "route-user-a";
    const ownGet = await itemRoute.GET(
      new Request("http://localhost"),
      { params: { id: created.data.id } }
    );
    const ownDelete = await itemRoute.DELETE(
      new Request("http://localhost", { method: "DELETE" }),
      { params: { id: created.data.id } }
    );
    expect(ownGet.status).toBe(200);
    expect(ownDelete.status).toBe(200);
    expect(await ownDelete.json()).toEqual({ ok: true });
  });

  it("returns 404 rather than 500 for malformed record IDs", async () => {
    const itemRoute = await import("@/app/api/plate-records/[id]/route");
    const context = { params: { id: "not-a-uuid" } };
    expect((await itemRoute.GET(new Request("http://localhost"), context)).status).toBe(404);
    expect((await itemRoute.DELETE(
      new Request("http://localhost", { method: "DELETE" }),
      context
    )).status).toBe(404);
  });

  it("does not expose PUT or PATCH handlers", async () => {
    const collectionRoute = await import("@/app/api/plate-records/route");
    const itemRoute = await import("@/app/api/plate-records/[id]/route");
    expect(collectionRoute).not.toHaveProperty("PUT");
    expect(collectionRoute).not.toHaveProperty("PATCH");
    expect(itemRoute).not.toHaveProperty("PUT");
    expect(itemRoute).not.toHaveProperty("PATCH");
  });
});
