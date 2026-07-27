import { describe, expect, it, vi } from "vitest";
import {
  cloneHomeInput,
  loadPlateContinuation,
  resolveTimingCandidatePreference,
  resolveTimingContinuation,
  type PlateContinuationClient
} from "@/lib/plateContinuation";
import {
  PLATE_ENGINE_VERSIONS,
  PLATE_PROTOCOL_VERSION,
  type PlateType
} from "@/lib/plateRecords";

const SNAPSHOT_ID = "c0000000-0000-4000-8000-000000000001";
const USER_ID = "continuation-user";

function snapshot(
  plateType: PlateType,
  input: unknown,
  overrides: Partial<{
    id: string;
    plateType: string;
    protocolVersion: string;
    engineVersion: string;
  }> = {}
) {
  return {
    id: overrides.id ?? SNAPSHOT_ID,
    plateType: overrides.plateType ?? plateType,
    protocolVersion: overrides.protocolVersion ?? PLATE_PROTOCOL_VERSION,
    engineVersion: overrides.engineVersion ?? PLATE_ENGINE_VERSIONS[plateType],
    inputSnapshot: input
  };
}

function clientFor(value: ReturnType<typeof snapshot> | null) {
  const findFirst = vi.fn().mockResolvedValue(value);
  return {
    client: { plateSnapshot: { findFirst } } as PlateContinuationClient,
    findFirst
  };
}

describe("plate continuation input loader", () => {
  it("loads only an owned snapshot of the expected type and selects no result or identity fields", async () => {
    const { client, findFirst } = clientFor(snapshot("BAZI", {
      input: {},
      profile: { birthDate: "1980-01-01" }
    }));
    await expect(loadPlateContinuation(USER_ID, SNAPSHOT_ID, "BAZI", client)).resolves.toEqual({
      sourceId: SNAPSHOT_ID,
      plateType: "BAZI",
      input: {}
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: SNAPSHOT_ID, userId: USER_ID },
      select: {
        id: true,
        plateType: true,
        protocolVersion: true,
        engineVersion: true,
        inputSnapshot: true
      }
    });
    expect(findFirst.mock.calls[0][0].select).not.toHaveProperty("resultSnapshot");
    expect(findFirst.mock.calls[0][0].select).not.toHaveProperty("requestId");
    expect(findFirst.mock.calls[0][0].select).not.toHaveProperty("userId");
  });

  it("does not query an illegal UUID and treats missing/other-user records as unavailable", async () => {
    const missing = clientFor(null);
    await expect(loadPlateContinuation(USER_ID, "not-a-uuid", "BAZI", missing.client)).resolves.toBeNull();
    expect(missing.findFirst).not.toHaveBeenCalled();
    await expect(loadPlateContinuation(USER_ID, SNAPSHOT_ID, "BAZI", missing.client)).resolves.toBeNull();
  });

  it("rejects a wrong plate type, unknown protocol, and unknown engine", async () => {
    const wrongType = clientFor(snapshot("RELATION", {
      input: { relationshipType: "partner", otherBirthDate: "1990-01-01" }
    }));
    await expect(loadPlateContinuation(USER_ID, SNAPSHOT_ID, "BAZI", wrongType.client)).resolves.toBeNull();

    const oldProtocol = clientFor(snapshot("BAZI", { input: {} }, {
      protocolVersion: "plate-snapshot-v0"
    }));
    await expect(loadPlateContinuation(USER_ID, SNAPSHOT_ID, "BAZI", oldProtocol.client)).resolves.toBeNull();

    const oldEngine = clientFor(snapshot("HOME", {
      input: { areas: { entry: { reviewed: true, issues: [] } } }
    }, { engineVersion: "home-old" }));
    await expect(loadPlateContinuation(USER_ID, SNAPSHOT_ID, "HOME", oldEngine.client)).resolves.toBeNull();
  });

  it("restores and normalizes relation input without restoring the historical profile", async () => {
    const { client } = clientFor(snapshot("RELATION", {
      input: {
        relationshipType: "cooperation",
        otherBirthDate: "1992-06-12",
        otherNickname: "  小林  "
      },
      profile: { birthDate: "1980-01-01" }
    }));
    const result = await loadPlateContinuation(USER_ID, SNAPSHOT_ID, "RELATION", client);
    expect(result).toEqual({
      sourceId: SNAPSHOT_ID,
      plateType: "RELATION",
      input: {
        relationshipType: "cooperation",
        otherBirthDate: "1992-06-12",
        otherNickname: "小林"
      }
    });
    expect(result).not.toHaveProperty("profile");
  });

  it("restores HOME reviewed/issue state as a new object and rejects cross-area issues", async () => {
    const input = {
      areas: {
        entry: { reviewed: true as const, issues: [] },
        rest: { reviewed: true as const, issues: ["rest_persistent_noise"] }
      }
    };
    const { client } = clientFor(snapshot("HOME", { input }));
    const result = await loadPlateContinuation(USER_ID, SNAPSHOT_ID, "HOME", client);
    expect(result?.plateType).toBe("HOME");
    if (!result || result.plateType !== "HOME") throw new Error("unexpected continuation");
    expect(result.input.areas).toEqual(input.areas);
    expect(result.input.areas).not.toBe(input.areas);
    expect(result.input.areas.rest?.issues).not.toBe(input.areas.rest.issues);
    result.input.areas.rest?.issues.push("rest_damp_mold");
    expect(input.areas.rest.issues).toEqual(["rest_persistent_noise"]);

    const invalid = clientFor(snapshot("HOME", {
      input: {
        areas: {
          entry: { reviewed: true, issues: ["rest_persistent_noise"] }
        }
      }
    }));
    await expect(loadPlateContinuation(USER_ID, SNAPSHOT_ID, "HOME", invalid.client)).resolves.toBeNull();
  });

  it("rejects damaged inputs and impossible calendar dates", async () => {
    const damaged = clientFor(snapshot("RELATION", {
      input: { relationshipType: "partner", otherBirthDate: "2026-02-30" }
    }));
    await expect(loadPlateContinuation(USER_ID, SNAPSHOT_ID, "RELATION", damaged.client)).resolves.toBeNull();

    const extra = clientFor(snapshot("TIMING", {
      input: {
        event: "moving",
        startDate: "2026-07-27",
        rangeDays: 30,
        injectedResult: {}
      }
    }));
    await expect(loadPlateContinuation(USER_ID, SNAPSHOT_ID, "TIMING", extra.client)).resolves.toBeNull();
  });

  it("resolves TIMING original and today modes without retaining selection in today mode", async () => {
    const { client } = clientFor(snapshot("TIMING", {
      input: {
        event: "signing",
        startDate: "2026-06-01",
        rangeDays: 7,
        selectedDate: "2026-06-03"
      },
      profile: { birthDate: "1980-01-01" }
    }));
    const continuation = await loadPlateContinuation(USER_ID, SNAPSHOT_ID, "TIMING", client);
    if (!continuation || continuation.plateType !== "TIMING") throw new Error("unexpected continuation");

    expect(resolveTimingContinuation(continuation, "original", "2026-07-27")).toEqual({
      sourceId: SNAPSHOT_ID,
      event: "signing",
      startDate: "2026-06-01",
      rangeDays: 7,
      preferredSelectedDate: "2026-06-03",
      mode: "original"
    });
    expect(resolveTimingContinuation(continuation, "today", "2026-07-27")).toEqual({
      sourceId: SNAPSHOT_ID,
      event: "signing",
      startDate: "2026-07-27",
      rangeDays: 7,
      preferredSelectedDate: null,
      mode: "today"
    });
  });

  it("preserves a valid historical candidate and falls back with a warning when invalid", () => {
    expect(resolveTimingCandidatePreference(
      ["2026-07-28", "2026-07-30"],
      "2026-07-30"
    )).toEqual({ selectedDate: "2026-07-30", warning: null });
    expect(resolveTimingCandidatePreference(
      ["2026-07-28", "2026-07-30"],
      "2026-07-29"
    )).toEqual({
      selectedDate: "2026-07-28",
      warning: "原选中日期已不在当前候选中，已改为当前第一个候选。"
    });
    expect(resolveTimingCandidatePreference([], "2026-07-29")).toEqual({
      selectedDate: null,
      warning: "原选中日期已不在当前候选中，当前也没有可选日期。"
    });
  });

  it("clones reusable HOME input independently", () => {
    const source = {
      kitchen: { reviewed: true as const, issues: ["kitchen_heat_hazard" as const] }
    };
    const copy = cloneHomeInput(source);
    copy.kitchen?.issues.splice(0, 1);
    expect(source.kitchen.issues).toEqual(["kitchen_heat_hazard"]);
  });
});
