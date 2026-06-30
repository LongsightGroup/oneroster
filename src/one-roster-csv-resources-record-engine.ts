import type { OneRosterCsvRecordRowContext } from "./one-roster-csv-record-context.js";
import {
  parseCommonRecordFields,
  parseGuidField,
  parseOptionalStringField,
  parseRequiredStringField,
  parseVocabularyField,
  parseVocabularyListField,
} from "./one-roster-csv-record-fields.js";
import { hasNewRowDiagnostics } from "./one-roster-csv-record-row.js";
import { resourceImportanceValues, resourceRoleValues } from "./one-roster-csv-resources-schema.js";
import type {
  OneRosterClassResourceRecord,
  OneRosterCourseResourceRecord,
  OneRosterResourceRecord,
  OneRosterUserResourceRecord,
} from "./one-roster-csv-resources-types.js";

/** Parse one resources.csv row into a typed OneRoster record. */
export function parseResourceRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterResourceRecord | undefined {
  const diagnosticStart = context.diagnostics.length;
  const commonFields = parseCommonRecordFields(context);
  const vendorResourceId = parseRequiredStringField(context, "vendorResourceId");
  const title = parseOptionalStringField(context, "title");
  const roles = parseVocabularyListField(context, "roles", "optional", resourceRoleValues, true);
  const importance = parseVocabularyField(
    context,
    "importance",
    "optional",
    resourceImportanceValues,
    false,
  );
  const vendorId = parseOptionalStringField(context, "vendorId");
  const applicationId = parseOptionalStringField(context, "applicationId");

  if (
    hasNewRowDiagnostics(context, diagnosticStart) ||
    commonFields === undefined ||
    vendorResourceId === undefined ||
    roles === undefined
  ) {
    return undefined;
  }

  return {
    ...commonFields,
    vendorResourceId,
    title,
    roles,
    importance,
    vendorId,
    applicationId,
  };
}

/** Parse one classResources.csv row into a typed OneRoster record. */
export function parseClassResourceRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterClassResourceRecord | undefined {
  const diagnosticStart = context.diagnostics.length;
  const commonFields = parseCommonRecordFields(context);
  const title = parseOptionalStringField(context, "title");
  const classSourcedId = parseGuidField(context, "classSourcedId", "required");
  const resourceSourcedId = parseGuidField(context, "resourceSourcedId", "required");

  if (
    hasNewRowDiagnostics(context, diagnosticStart) ||
    commonFields === undefined ||
    classSourcedId === undefined ||
    resourceSourcedId === undefined
  ) {
    return undefined;
  }

  return {
    ...commonFields,
    title,
    classSourcedId,
    resourceSourcedId,
  };
}

/** Parse one courseResources.csv row into a typed OneRoster record. */
export function parseCourseResourceRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterCourseResourceRecord | undefined {
  const diagnosticStart = context.diagnostics.length;
  const commonFields = parseCommonRecordFields(context);
  const title = parseOptionalStringField(context, "title");
  const courseSourcedId = parseGuidField(context, "courseSourcedId", "required");
  const resourceSourcedId = parseGuidField(context, "resourceSourcedId", "required");

  if (
    hasNewRowDiagnostics(context, diagnosticStart) ||
    commonFields === undefined ||
    courseSourcedId === undefined ||
    resourceSourcedId === undefined
  ) {
    return undefined;
  }

  return {
    ...commonFields,
    title,
    courseSourcedId,
    resourceSourcedId,
  };
}

/** Parse one userResources.csv row into a typed OneRoster record. */
export function parseUserResourceRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterUserResourceRecord | undefined {
  const diagnosticStart = context.diagnostics.length;
  const commonFields = parseCommonRecordFields(context);
  const userSourcedId = parseGuidField(context, "userSourcedId", "required");
  const orgSourcedId = parseGuidField(context, "orgSourcedId", "optional");
  const classSourcedId = parseGuidField(context, "classSourcedId", "optional");
  const resourceSourcedId = parseGuidField(context, "resourceSourcedId", "required");

  if (
    hasNewRowDiagnostics(context, diagnosticStart) ||
    commonFields === undefined ||
    userSourcedId === undefined ||
    resourceSourcedId === undefined
  ) {
    return undefined;
  }

  return {
    ...commonFields,
    userSourcedId,
    orgSourcedId,
    classSourcedId,
    resourceSourcedId,
  };
}
