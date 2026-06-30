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

/** Fallback fields accepted by OneRoster user display-name formatting. */
export type OneRosterUserDisplayNameFallbackField = "username" | "email" | "sourcedId";

/** Options for OneRoster user display-name formatting. */
export type OneRosterUserDisplayNameOptions = {
  readonly fallbackOrder?: readonly OneRosterUserDisplayNameFallbackField[];
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

/** Format a stable display name for a OneRoster users.csv record. */
export function formatOneRosterUserDisplayName(
  user: OneRosterUserRecord,
  options: OneRosterUserDisplayNameOptions = {},
): string {
  const givenName = user.givenName.trim();
  const familyName = user.familyName.trim();
  const fullName = [givenName, familyName].filter((part) => part !== "").join(" ");

  if (fullName !== "") {
    return fullName;
  }

  for (const field of options.fallbackOrder ?? ["username", "email"]) {
    const value = displayNameFallbackValue(user, field);

    if (value !== "") {
      return value;
    }
  }

  return user.sourcedId;
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

function displayNameFallbackValue(
  user: OneRosterUserRecord,
  field: OneRosterUserDisplayNameFallbackField,
): string {
  if (field === "email") {
    return user.email?.trim() ?? "";
  }

  return user[field].trim();
}
