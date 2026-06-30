import {
  serializeCategoryRecord,
  serializeLineItemLearningObjectiveIdRecord,
  serializeLineItemRecord,
  serializeLineItemScoreScaleRecord,
  serializeResultLearningObjectiveIdRecord,
  serializeResultRecord,
  serializeResultScoreScaleRecord,
  serializeScoreScaleRecord,
} from "./one-roster-csv-gradebook-record-engine.js";
import type {
  OneRosterCategoryRecord,
  OneRosterLineItemLearningObjectiveIdRecord,
  OneRosterLineItemRecord,
  OneRosterLineItemScoreScaleRecord,
  OneRosterResultLearningObjectiveIdRecord,
  OneRosterResultRecord,
  OneRosterResultScoreScaleRecord,
  OneRosterScoreScaleRecord,
} from "./one-roster-csv-gradebook-types.js";
import {
  serializeClassResourceRecord,
  serializeCourseResourceRecord,
  serializeResourceRecord,
  serializeUserResourceRecord,
} from "./one-roster-csv-resources-record-engine.js";
import type {
  OneRosterClassResourceRecord,
  OneRosterCourseResourceRecord,
  OneRosterResourceRecord,
  OneRosterUserResourceRecord,
} from "./one-roster-csv-resources-types.js";
import {
  serializeAcademicSessionRecord,
  serializeClassRecord,
  serializeCourseRecord,
  serializeDemographicsRecord,
  serializeEnrollmentRecord,
  serializeOrgRecord,
  serializeRoleRecord,
  serializeUserProfileRecord,
  serializeUserRecord,
} from "./one-roster-csv-rostering-record-engine.js";
import type {
  OneRosterAcademicSessionRecord,
  OneRosterClassRecord,
  OneRosterCourseRecord,
  OneRosterDemographicsRecord,
  OneRosterEnrollmentRecord,
  OneRosterOrgRecord,
  OneRosterRoleRecord,
  OneRosterUserProfileRecord,
  OneRosterUserRecord,
} from "./one-roster-csv-rostering-types.js";
import { isOneRosterMetadataHeader } from "./one-roster-csv-metadata.js";
import { oneRosterCsvTableHeaders } from "./one-roster-csv-schema.js";

/** Typed OneRoster CSV record mapped by its canonical data file name. */
export type OneRosterCsvRecordByFileName = {
  readonly "academicSessions.csv": OneRosterAcademicSessionRecord;
  readonly "categories.csv": OneRosterCategoryRecord;
  readonly "classes.csv": OneRosterClassRecord;
  readonly "classResources.csv": OneRosterClassResourceRecord;
  readonly "courseResources.csv": OneRosterCourseResourceRecord;
  readonly "courses.csv": OneRosterCourseRecord;
  readonly "demographics.csv": OneRosterDemographicsRecord;
  readonly "enrollments.csv": OneRosterEnrollmentRecord;
  readonly "lineItemLearningObjectiveIds.csv": OneRosterLineItemLearningObjectiveIdRecord;
  readonly "lineItems.csv": OneRosterLineItemRecord;
  readonly "lineItemScoreScales.csv": OneRosterLineItemScoreScaleRecord;
  readonly "orgs.csv": OneRosterOrgRecord;
  readonly "resources.csv": OneRosterResourceRecord;
  readonly "resultLearningObjectiveIds.csv": OneRosterResultLearningObjectiveIdRecord;
  readonly "results.csv": OneRosterResultRecord;
  readonly "resultScoreScales.csv": OneRosterResultScoreScaleRecord;
  readonly "roles.csv": OneRosterRoleRecord;
  readonly "scoreScales.csv": OneRosterScoreScaleRecord;
  readonly "userProfiles.csv": OneRosterUserProfileRecord;
  readonly "userResources.csv": OneRosterUserResourceRecord;
  readonly "users.csv": OneRosterUserRecord;
};

/** Canonical data file names that have typed CSV record serializers. */
export type OneRosterCsvSerializableFileName = keyof OneRosterCsvRecordByFileName;

/** CSV-header-keyed object projection of one typed OneRoster CSV record. */
export type OneRosterCsvRecordObject = Readonly<Record<string, string>>;

type OneRosterCsvRecordSerializerMap = {
  readonly [TFileName in OneRosterCsvSerializableFileName]: (
    record: OneRosterCsvRecordByFileName[TFileName],
  ) => readonly string[];
};

const oneRosterRecordSerializers = {
  "academicSessions.csv": serializeAcademicSessionRecord,
  "categories.csv": serializeCategoryRecord,
  "classes.csv": serializeClassRecord,
  "classResources.csv": serializeClassResourceRecord,
  "courseResources.csv": serializeCourseResourceRecord,
  "courses.csv": serializeCourseRecord,
  "demographics.csv": serializeDemographicsRecord,
  "enrollments.csv": serializeEnrollmentRecord,
  "lineItemLearningObjectiveIds.csv": serializeLineItemLearningObjectiveIdRecord,
  "lineItems.csv": serializeLineItemRecord,
  "lineItemScoreScales.csv": serializeLineItemScoreScaleRecord,
  "orgs.csv": serializeOrgRecord,
  "resources.csv": serializeResourceRecord,
  "resultLearningObjectiveIds.csv": serializeResultLearningObjectiveIdRecord,
  "results.csv": serializeResultRecord,
  "resultScoreScales.csv": serializeResultScoreScaleRecord,
  "roles.csv": serializeRoleRecord,
  "scoreScales.csv": serializeScoreScaleRecord,
  "userProfiles.csv": serializeUserProfileRecord,
  "userResources.csv": serializeUserResourceRecord,
  "users.csv": serializeUserRecord,
} as const satisfies OneRosterCsvRecordSerializerMap;

/** Serialize one typed record into spec-defined CSV cells without metadata extension cells. */
export function oneRosterRecordToCsvCells<TFileName extends OneRosterCsvSerializableFileName>(
  fileName: TFileName,
  record: OneRosterCsvRecordByFileName[TFileName],
): readonly string[] {
  const serialize = oneRosterRecordSerializers[fileName];

  // SAFETY: `serialize` is selected by the same file-name key that constrains `record`.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return (serialize as (value: OneRosterCsvRecordByFileName[TFileName]) => readonly string[])(
    record,
  );
}

/**
 * Project one typed record into canonical CSV header/value pairs, with sorted metadata fields.
 * Throws when caller-constructed metadata keys violate the OneRoster `metadata.*` invariant.
 */
export function oneRosterRecordToCsvObject<TFileName extends OneRosterCsvSerializableFileName>(
  fileName: TFileName,
  record: OneRosterCsvRecordByFileName[TFileName],
): OneRosterCsvRecordObject {
  const headers = oneRosterCsvTableHeaders[fileName];
  const cells = oneRosterRecordToCsvCells(fileName, record);
  const output: Record<string, string> = {};

  for (let index = 0; index < headers.length; index += 1) {
    const header = headers[index];
    const cell = cells[index];

    if (header === undefined || cell === undefined) {
      throw new Error("OneRoster CSV record serializer/header invariant violated.");
    }

    output[header] = cell;
  }

  for (const header of Object.keys(record.metadata).toSorted()) {
    if (!isOneRosterMetadataHeader(header)) {
      throw new Error("OneRoster CSV metadata keys must be non-empty metadata.* headers.");
    }

    const value = record.metadata[header];

    if (value !== undefined) {
      output[header] = value;
    }
  }

  return output;
}
