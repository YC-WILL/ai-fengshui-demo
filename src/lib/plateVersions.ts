export const PLATE_PROTOCOL_VERSION = "plate-snapshot-v1";

export const PLATE_ENGINE_VERSIONS = {
  BAZI: "bazi-deterministic-v1",
  RELATION: "relation-deterministic-v1",
  HOME: "home-deterministic-v1",
  TIMING: "timing-deterministic-v1"
} as const;

export type PlateType = keyof typeof PLATE_ENGINE_VERSIONS;
