import type { OneRosterCsvRecordRowContext } from "./one-roster-csv-record-context.js";
import {
  parseGuidField,
  parseOptionalStringField,
  parseRequiredStringField,
  parseVocabularyField,
  parseVocabularyListField,
} from "./one-roster-csv-record-field-parsers.js";
import { parseCommonRecordFields } from "./one-roster-csv-record-lifecycle.js";
import { parseOneRosterCsvRecordRow } from "./one-roster-csv-record-row.js";
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

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      vendorResourceId: parseRequiredStringField(context, "vendorResourceId"),
      title: parseOptionalStringField(context, "title"),
      roles: parseVocabularyListField(context, "roles", "optional", resourceRoleValues, true),
      importance: parseVocabularyField(
        context,
        "importance",
        "optional",
        resourceImportanceValues,
        false,
      ),
      vendorId: parseOptionalStringField(context, "vendorId"),
      applicationId: parseOptionalStringField(context, "applicationId"),
    },
    ["common", "vendorResourceId"],
    (fields) => ({
      ...fields.common,
      vendorResourceId: fields.vendorResourceId,
      title: fields.title,
      roles: fields.roles,
      importance: fields.importance,
      vendorId: fields.vendorId,
      applicationId: fields.applicationId,
    }),
  );
}

/** Parse one classResources.csv row into a typed OneRoster record. */
export function parseClassResourceRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterClassResourceRecord | undefined {
  const diagnosticStart = context.diagnostics.length;

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      title: parseOptionalStringField(context, "title"),
      classSourcedId: parseGuidField(context, "classSourcedId", "required"),
      resourceSourcedId: parseGuidField(context, "resourceSourcedId", "required"),
    },
    ["common", "classSourcedId", "resourceSourcedId"],
    (fields) => ({
      ...fields.common,
      title: fields.title,
      classSourcedId: fields.classSourcedId,
      resourceSourcedId: fields.resourceSourcedId,
    }),
  );
}

/** Parse one courseResources.csv row into a typed OneRoster record. */
export function parseCourseResourceRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterCourseResourceRecord | undefined {
  const diagnosticStart = context.diagnostics.length;

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      title: parseOptionalStringField(context, "title"),
      courseSourcedId: parseGuidField(context, "courseSourcedId", "required"),
      resourceSourcedId: parseGuidField(context, "resourceSourcedId", "required"),
    },
    ["common", "courseSourcedId", "resourceSourcedId"],
    (fields) => ({
      ...fields.common,
      title: fields.title,
      courseSourcedId: fields.courseSourcedId,
      resourceSourcedId: fields.resourceSourcedId,
    }),
  );
}

/** Parse one userResources.csv row into a typed OneRoster record. */
export function parseUserResourceRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterUserResourceRecord | undefined {
  const diagnosticStart = context.diagnostics.length;

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      userSourcedId: parseGuidField(context, "userSourcedId", "required"),
      orgSourcedId: parseGuidField(context, "orgSourcedId", "optional"),
      classSourcedId: parseGuidField(context, "classSourcedId", "optional"),
      resourceSourcedId: parseGuidField(context, "resourceSourcedId", "required"),
    },
    ["common", "userSourcedId", "resourceSourcedId"],
    (fields) => ({
      ...fields.common,
      userSourcedId: fields.userSourcedId,
      orgSourcedId: fields.orgSourcedId,
      classSourcedId: fields.classSourcedId,
      resourceSourcedId: fields.resourceSourcedId,
    }),
  );
}
