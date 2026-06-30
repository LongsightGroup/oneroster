import type {
  OneRosterDate,
  OneRosterDateTime,
  OneRosterGuid,
} from "./one-roster-csv-primitive.js";
import type {
  OneRosterCsvBulkLifecycle,
  OneRosterCsvDeltaLifecycle,
  OneRosterCsvRecordMetadata,
  OneRosterCsvRowLifecycle,
} from "./one-roster-csv-record-types.js";
import type {
  OneRosterEnrollmentRecord,
  OneRosterEnrollmentRole,
  OneRosterUserRecord,
} from "./one-roster-csv-rostering-types.js";

/**
 * Authoring helpers for the highest-frequency rostering CSV records (`users.csv` and
 * `enrollments.csv`). Other record types should be constructed as plain typed objects that match
 * the exported `OneRoster*Record` interfaces.
 */

/** Common builder fields for typed OneRoster CSV records. */
export type OneRosterRecordBuilderBaseInput = {
  readonly rowNumber?: number;
  readonly lifecycle?: OneRosterCsvRowLifecycle;
  readonly metadata?: OneRosterCsvRecordMetadata;
};

/** Builder input for a valid users.csv record. */
export type OneRosterUserRecordBuilderInput = OneRosterRecordBuilderBaseInput & {
  readonly sourcedId: OneRosterGuid;
  readonly username: string;
  readonly givenName: string;
  readonly familyName: string;
  readonly enabledUser?: boolean;
  readonly userIds?: readonly string[];
  readonly middleName?: string;
  readonly identifier?: string;
  readonly email?: string;
  readonly sms?: string;
  readonly phone?: string;
  readonly agentSourcedIds?: readonly OneRosterGuid[];
  readonly grades?: readonly string[];
  readonly password?: string;
  readonly userMasterIdentifier?: string;
  readonly preferredGivenName?: string;
  readonly preferredMiddleName?: string;
  readonly preferredFamilyName?: string;
  readonly primaryOrgSourcedId?: OneRosterGuid;
  readonly pronouns?: string;
};

/** Builder input for a valid enrollments.csv record. */
export type OneRosterEnrollmentRecordBuilderInput = OneRosterRecordBuilderBaseInput & {
  readonly sourcedId: OneRosterGuid;
  readonly classSourcedId: OneRosterGuid;
  readonly schoolSourcedId: OneRosterGuid;
  readonly userSourcedId: OneRosterGuid;
  readonly role: OneRosterEnrollmentRole;
  readonly primary?: boolean;
  readonly beginDate?: OneRosterDate;
  readonly endDate?: OneRosterDate;
};

/** Return the lifecycle value for rows in a OneRoster bulk CSV table. */
export function oneRosterBulkLifecycle(): OneRosterCsvBulkLifecycle {
  return { mode: "bulk" };
}

/** Return the lifecycle value for a OneRoster delta delete row. */
export function oneRosterDeltaDeleteLifecycle(
  dateLastModified: OneRosterDateTime,
): OneRosterCsvDeltaLifecycle {
  return {
    mode: "delta",
    status: "tobedeleted",
    dateLastModified,
  };
}

/** Construct a typed users.csv record with spec-shaped defaults for optional fields. */
export function makeOneRosterUserRecord(
  input: OneRosterUserRecordBuilderInput,
): OneRosterUserRecord {
  return {
    rowNumber: input.rowNumber ?? 2,
    sourcedId: input.sourcedId,
    lifecycle: input.lifecycle ?? oneRosterBulkLifecycle(),
    metadata: input.metadata ?? {},
    enabledUser: input.enabledUser ?? true,
    username: input.username,
    userIds: input.userIds ?? [],
    givenName: input.givenName,
    familyName: input.familyName,
    middleName: input.middleName,
    identifier: input.identifier,
    email: input.email,
    sms: input.sms,
    phone: input.phone,
    agentSourcedIds: input.agentSourcedIds ?? [],
    grades: input.grades ?? [],
    password: input.password,
    userMasterIdentifier: input.userMasterIdentifier,
    preferredGivenName: input.preferredGivenName,
    preferredMiddleName: input.preferredMiddleName,
    preferredFamilyName: input.preferredFamilyName,
    primaryOrgSourcedId: input.primaryOrgSourcedId,
    pronouns: input.pronouns,
  };
}

/** Construct a typed enrollments.csv record with spec-shaped defaults for optional fields. */
export function makeOneRosterEnrollmentRecord(
  input: OneRosterEnrollmentRecordBuilderInput,
): OneRosterEnrollmentRecord {
  return {
    rowNumber: input.rowNumber ?? 2,
    sourcedId: input.sourcedId,
    lifecycle: input.lifecycle ?? oneRosterBulkLifecycle(),
    metadata: input.metadata ?? {},
    classSourcedId: input.classSourcedId,
    schoolSourcedId: input.schoolSourcedId,
    userSourcedId: input.userSourcedId,
    role: input.role,
    primary: input.primary,
    beginDate: input.beginDate,
    endDate: input.endDate,
  };
}
