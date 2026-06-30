import type { OneRosterCsvRecordBase } from "./one-roster-csv-record-types.js";
import type { OneRosterUserRecord } from "./one-roster-csv-rostering-types.js";

/** Normalized active/inactive status used by application consumers. */
export type OneRosterRecordStatus = "active" | "inactive";

/** Diagnostic shape accepted by OneRoster diagnostic location formatting. */
export type OneRosterDiagnosticLocationInput = {
  readonly fileName?: string;
  readonly entryName?: string;
  readonly rowNumber?: number;
  readonly columnNumber?: number;
  readonly field?: string;
  readonly propertyName?: string;
};

/** Return normalized active/inactive status for any typed OneRoster CSV record. */
export function getOneRosterRecordStatus(record: OneRosterCsvRecordBase): OneRosterRecordStatus {
  if (record.lifecycle.mode === "delta" && record.lifecycle.status === "tobedeleted") {
    return "inactive";
  }

  return "active";
}

/** Return normalized active/inactive status for a OneRoster users.csv record. */
export function getOneRosterUserStatus(user: OneRosterUserRecord): OneRosterRecordStatus {
  if (!user.enabledUser || getOneRosterRecordStatus(user) === "inactive") {
    return "inactive";
  }

  return "active";
}

/** Format safe diagnostic location fields for consistent display. */
export function formatOneRosterDiagnosticLocation(
  diagnostic: OneRosterDiagnosticLocationInput,
): string | null {
  const parts: string[] = [];

  if (diagnostic.fileName !== undefined) {
    parts.push(diagnostic.fileName);
  } else if (diagnostic.entryName !== undefined) {
    parts.push(`entry ${diagnostic.entryName}`);
  }

  if (diagnostic.rowNumber !== undefined) {
    parts.push(`row ${diagnostic.rowNumber}`);
  }

  if (diagnostic.columnNumber !== undefined) {
    parts.push(`column ${diagnostic.columnNumber}`);
  }

  if (diagnostic.field !== undefined) {
    parts.push(`field ${diagnostic.field}`);
  }

  if (diagnostic.propertyName !== undefined) {
    parts.push(`property ${diagnostic.propertyName}`);
  }

  return parts.length === 0 ? null : parts.join(": ");
}
