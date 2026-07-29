import type { BaziChart } from "@/lib/domain/bazi";
import {
  buildProfessionalBaziFactsV1,
  type ProfessionalBaziFactsV1
} from "@/lib/domain/professionalBaziFacts";
import { buildBaziTimeLayers, type BaziTimeLayer } from "@/lib/domain/baziTimeComparison";
import { PLATE_ENGINE_VERSIONS, PLATE_PROTOCOL_VERSION } from "@/lib/plateVersions";
import { dateKeyInTimeZone } from "@/lib/time";

export interface ProfessionalBaziServerResult {
  timeLayers: BaziTimeLayer[];
  professionalFacts: ProfessionalBaziFactsV1;
}

export function buildProfessionalBaziFactsOnServer(
  chart: BaziChart,
  calculatedAt: Date
): ProfessionalBaziServerResult {
  const timeLayers = buildBaziTimeLayers(
    chart,
    dateKeyInTimeZone(calculatedAt, "Asia/Shanghai")
  );
  return {
    timeLayers,
    professionalFacts: buildProfessionalBaziFactsV1(chart, {
      protocolVersion: PLATE_PROTOCOL_VERSION,
      engineVersion: PLATE_ENGINE_VERSIONS.BAZI,
      calculatedAt: calculatedAt.toISOString(),
      timeLayers
    })
  };
}
