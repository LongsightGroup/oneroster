import {
  getOneRosterRecordStatus,
  getOneRosterUserStatus,
  type OneRosterRecordStatus,
} from "./one-roster-csv-display.js";
import type { OneRosterCsvValidatedFullPackage } from "./one-roster-csv-full-validation.js";
import type { GradebookPackageRecords } from "./one-roster-csv-gradebook-tables.js";
import { iterateGradebookPackageTables } from "./one-roster-csv-gradebook-tables.js";
import type { OneRosterCsvRecordBase } from "./one-roster-csv-record-types.js";
import type { ResourcesPackageRecords } from "./one-roster-csv-resources-tables.js";
import { iterateResourcesPackageTables } from "./one-roster-csv-resources-tables.js";
import type { RosteringPackageRecords } from "./one-roster-csv-rostering-tables.js";
import { iterateRosteringPackageTables } from "./one-roster-csv-rostering-tables.js";

/** Counts for active and inactive typed OneRoster CSV records. */
export type OneRosterCsvFullPackageStatusSummary = {
  readonly active: number;
  readonly inactive: number;
};

/** Per-table row counts for a validated full OneRoster CSV package. */
export type OneRosterCsvFullPackageTableSummary = {
  readonly [K in
    | keyof RosteringPackageRecords
    | keyof GradebookPackageRecords
    | keyof ResourcesPackageRecords]: number;
};

/** Grouped row counts for a validated full OneRoster CSV package. */
export type OneRosterCsvFullPackageLayerSummary = {
  readonly rostering: number;
  readonly gradebook: number;
  readonly resources: number;
  readonly total: number;
};

/** Summary counts for a validated full OneRoster CSV package. */
export type OneRosterCsvFullPackageSummary = {
  readonly tables: OneRosterCsvFullPackageTableSummary;
  readonly layers: OneRosterCsvFullPackageLayerSummary;
  readonly rows: OneRosterCsvFullPackageStatusSummary & {
    readonly total: number;
  };
  readonly users: OneRosterCsvFullPackageStatusSummary & {
    readonly total: number;
  };
};

type OneRosterCsvFullPackageLayer = keyof Pick<
  OneRosterCsvFullPackageLayerSummary,
  "rostering" | "gradebook" | "resources"
>;

/** Summarize row, layer, and active/inactive counts for a validated full CSV package. */
export function summarizeOneRosterCsvFullPackage(
  validatedPackage: OneRosterCsvValidatedFullPackage,
): OneRosterCsvFullPackageSummary {
  const { rosteringPackage, gradebookPackage, resourcesPackage } = validatedPackage.fullPackage;
  const layerTableGroups: ReadonlyArray<{
    readonly layer: OneRosterCsvFullPackageLayer;
    readonly tables: ReadonlyArray<{
      readonly key: keyof OneRosterCsvFullPackageTableSummary;
      readonly records: ReadonlyArray<OneRosterCsvRecordBase>;
    }>;
  }> = [
    { layer: "rostering", tables: iterateRosteringPackageTables(rosteringPackage) },
    { layer: "gradebook", tables: iterateGradebookPackageTables(gradebookPackage) },
    { layer: "resources", tables: iterateResourcesPackageTables(resourcesPackage) },
  ];
  const tableCounts: Partial<Record<keyof OneRosterCsvFullPackageTableSummary, number>> = {};
  const layerTotals: Record<OneRosterCsvFullPackageLayer, number> = {
    rostering: 0,
    gradebook: 0,
    resources: 0,
  };
  const rows: OneRosterCsvFullPackageStatusSummary = { active: 0, inactive: 0 };

  for (const { layer, tables } of layerTableGroups) {
    for (const { key, records } of tables) {
      tableCounts[key] = records.length;
      layerTotals[layer] += records.length;
      accumulateStatusCounts(rows, records, getOneRosterRecordStatus);
    }
  }

  const users = countByStatus(rosteringPackage.users, getOneRosterUserStatus);

  return {
    // SAFETY: `tableCounts` is populated from the three profile registries whose keys define
    // `OneRosterCsvFullPackageTableSummary`.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    tables: tableCounts as OneRosterCsvFullPackageTableSummary,
    layers: {
      rostering: layerTotals.rostering,
      gradebook: layerTotals.gradebook,
      resources: layerTotals.resources,
      total: layerTotals.rostering + layerTotals.gradebook + layerTotals.resources,
    },
    rows: {
      ...rows,
      total: rows.active + rows.inactive,
    },
    users: {
      ...users,
      total: users.active + users.inactive,
    },
  };
}

function countByStatus<TRecord>(
  records: readonly TRecord[],
  getStatus: (record: TRecord) => OneRosterRecordStatus,
): OneRosterCsvFullPackageStatusSummary {
  const summary = { active: 0, inactive: 0 };

  accumulateStatusCounts(summary, records, getStatus);

  return summary;
}

function accumulateStatusCounts<TRecord>(
  summary: { active: number; inactive: number },
  records: readonly TRecord[],
  getStatus: (record: TRecord) => OneRosterRecordStatus,
): void {
  for (const record of records) {
    if (getStatus(record) === "active") {
      summary.active += 1;
    } else {
      summary.inactive += 1;
    }
  }
}
