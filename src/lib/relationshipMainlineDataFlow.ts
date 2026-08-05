import type { BaziChart } from "@/lib/domain/bazi";
import { buildBaziBirthXiuFacts } from "@/lib/domain/baziBirthXiuFacts";
import {
  buildProfessionalRelationshipFactsV1,
  type ProfessionalRelationshipFactsV1,
  type RelationshipTimezoneBasis
} from "@/lib/domain/professionalRelationshipFacts";
import {
  buildRelationshipMainlineReading,
  type RelationshipMainlineReading
} from "@/lib/domain/relationshipMainlineFoundation";
import type { RelationshipType } from "@/lib/domain/relationshipInteractions";
import { buildProfessionalBaziFactsOnServer } from "@/lib/professionalBaziServer";

export interface RelationshipMainlineDataFlowInput {
  personAChart: BaziChart;
  personBChart: BaziChart;
  personATimezoneBasis: RelationshipTimezoneBasis;
  personBTimezoneBasis: RelationshipTimezoneBasis;
  relationshipTypeId: RelationshipType;
  calculatedAt: Date;
}

export interface RelationshipMainlineDataFlowResult {
  professionalFacts: ProfessionalRelationshipFactsV1;
  reading: RelationshipMainlineReading;
}

/**
 * Isolated integration seam for the next relationship reading.
 *
 * It consumes the same calculated Bazi charts used by the relationship plate,
 * establishes both professional natal contracts, and projects them into the
 * ordinary nine-section reading. It deliberately has no page, persistence, or
 * history side effects.
 */
export function buildRelationshipMainlineDataFlow(
  input: RelationshipMainlineDataFlowInput
): RelationshipMainlineDataFlowResult {
  const personA = buildProfessionalBaziFactsOnServer(
    input.personAChart,
    input.calculatedAt
  ).professionalFacts;
  const personB = buildProfessionalBaziFactsOnServer(
    input.personBChart,
    input.calculatedAt
  ).professionalFacts;
  const professionalFacts = buildProfessionalRelationshipFactsV1(
    { facts: personA, timezoneBasis: input.personATimezoneBasis },
    { facts: personB, timezoneBasis: input.personBTimezoneBasis },
    { calculatedAt: input.calculatedAt.toISOString() }
  );
  const reading = buildRelationshipMainlineReading(
    professionalFacts,
    input.relationshipTypeId,
    {
      personA: buildBaziBirthXiuFacts(input.personAChart),
      personB: buildBaziBirthXiuFacts(input.personBChart)
    }
  );
  return { professionalFacts, reading };
}
