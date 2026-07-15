import { getOneRosterRecordStatus, getOneRosterUserStatus } from "./one-roster-csv-display.js";
import type { OneRosterEnrollmentRelationshipIndexes } from "./one-roster-csv-enrollment-indexes.js";
import type { OneRosterCsvFullPackage } from "./one-roster-csv-full.js";
import type {
  OneRosterCsvGradebookReferenceIndexes,
  OneRosterLineItemLearningObjectiveIdRecord,
  OneRosterLineItemRecord,
  OneRosterLineItemScoreScaleRecord,
  OneRosterResultLearningObjectiveIdRecord,
  OneRosterResultRecord,
  OneRosterResultScoreScaleRecord,
  OneRosterScoreScaleRecord,
} from "./one-roster-csv-gradebook-types.js";
import { buildIndexedMapByKey } from "./one-roster-csv-indexed-map.js";
import type { OneRosterGuid } from "./one-roster-csv-primitive.js";
import type { OneRosterCsvRecordBase } from "./one-roster-csv-record-types.js";
import type { OneRosterCsvResourcesReferenceIndexes } from "./one-roster-csv-resources-types.js";
import type {
  OneRosterAcademicSessionRecord,
  OneRosterClassRecord,
  OneRosterCourseRecord,
  OneRosterCsvRosteringReferenceIndexes,
  OneRosterEnrollmentRecord,
  OneRosterOrgRecord,
  OneRosterUserRecord,
} from "./one-roster-csv-rostering-types.js";

/** Options shared by resolved OneRoster relationship helpers. */
export type OneRosterResolvedRelationshipOptions = {
  readonly includeInactive?: boolean;
};

/** Lookup indexes and relationship maps for a validated full CSV package. */
export type OneRosterCsvFullResolvedIndexes = OneRosterCsvRosteringReferenceIndexes &
  OneRosterCsvGradebookReferenceIndexes &
  OneRosterCsvResourcesReferenceIndexes & {
    readonly enrollmentsByClassSourcedId: ReadonlyMap<
      OneRosterGuid,
      readonly OneRosterEnrollmentRecord[]
    >;
    readonly enrollmentsByUserSourcedId: ReadonlyMap<
      OneRosterGuid,
      readonly OneRosterEnrollmentRecord[]
    >;
    readonly lineItemLearningObjectiveLinksByLineItemSourcedId: ReadonlyMap<
      OneRosterGuid,
      readonly OneRosterLineItemLearningObjectiveIdRecord[]
    >;
    readonly lineItemScoreScalesByLineItemSourcedId: ReadonlyMap<
      OneRosterGuid,
      readonly OneRosterLineItemScoreScaleRecord[]
    >;
    readonly resultLearningObjectiveLinksByResultSourcedId: ReadonlyMap<
      OneRosterGuid,
      readonly OneRosterResultLearningObjectiveIdRecord[]
    >;
    readonly resultScoreScalesByResultSourcedId: ReadonlyMap<
      OneRosterGuid,
      readonly OneRosterResultScoreScaleRecord[]
    >;
  };

/** Minimal validated full-package shape required by resolved relationship helpers. */
export type OneRosterCsvResolvedFullPackage = {
  readonly fullPackage: OneRosterCsvFullPackage;
  readonly resolvedIndexes: OneRosterCsvFullResolvedIndexes;
};

/** Input for building resolved indexes from already-validated profile indexes. */
export type OneRosterCsvFullResolvedIndexInput = {
  readonly fullPackage: OneRosterCsvFullPackage;
  readonly rosteringIndexes: OneRosterCsvRosteringReferenceIndexes;
  readonly gradebookIndexes: OneRosterCsvGradebookReferenceIndexes;
  readonly resourcesIndexes: OneRosterCsvResourcesReferenceIndexes;
  readonly enrollmentIndexes: OneRosterEnrollmentRelationshipIndexes;
};

/** Resolved score-scale link for one results.csv record. */
export type OneRosterResolvedResultScoreScale = {
  readonly link: OneRosterResultScoreScaleRecord;
  readonly scoreScale: OneRosterScoreScaleRecord;
};

/** Resolved score-scale link for one lineItems.csv record. */
export type OneRosterResolvedLineItemScoreScale = {
  readonly link: OneRosterLineItemScoreScaleRecord;
  readonly scoreScale: OneRosterScoreScaleRecord;
};

/** Resolved student enrollment with common class, org, course, and term targets. */
export type OneRosterResolvedStudentEnrollment = {
  readonly enrollment: OneRosterEnrollmentRecord;
  readonly user: OneRosterUserRecord;
  readonly classRecord: OneRosterClassRecord;
  readonly schoolOrg: OneRosterOrgRecord;
  readonly course: OneRosterCourseRecord;
  readonly termSessions: readonly OneRosterAcademicSessionRecord[];
};

/** Build public resolved indexes for common validated full-package joins. */
export function buildOneRosterCsvFullResolvedIndexes(
  input: OneRosterCsvFullResolvedIndexInput,
): OneRosterCsvFullResolvedIndexes {
  const { gradebookPackage } = input.fullPackage;

  return {
    ...input.rosteringIndexes,
    ...input.gradebookIndexes,
    ...input.resourcesIndexes,
    enrollmentsByClassSourcedId: input.enrollmentIndexes.enrollmentsByClassSourcedId,
    enrollmentsByUserSourcedId: input.enrollmentIndexes.enrollmentsByUserSourcedId,
    lineItemLearningObjectiveLinksByLineItemSourcedId: buildIndexedMapByKey(
      gradebookPackage.lineItemLearningObjectiveIds,
      (link) => link.lineItemSourcedId,
    ),
    lineItemScoreScalesByLineItemSourcedId: buildIndexedMapByKey(
      gradebookPackage.lineItemScoreScales,
      (link) => link.lineItemSourcedId,
    ),
    resultLearningObjectiveLinksByResultSourcedId: buildIndexedMapByKey(
      gradebookPackage.resultLearningObjectiveIds,
      (link) => link.resultSourcedId,
    ),
    resultScoreScalesByResultSourcedId: buildIndexedMapByKey(
      gradebookPackage.resultScoreScales,
      (link) => link.resultSourcedId,
    ),
  };
}

/**
 * Iterate resolved student/class enrollment projections from a validated full package.
 * Rows are omitted when a referenced record is unavailable or inactive while
 * `includeInactive` is false.
 */
export function* iterateResolvedStudentEnrollments(
  validatedPackage: OneRosterCsvResolvedFullPackage,
  options: OneRosterResolvedRelationshipOptions = {},
): Iterable<OneRosterResolvedStudentEnrollment> {
  for (const enrollment of validatedPackage.fullPackage.rosteringPackage.enrollments) {
    if (enrollment.role !== "student" || !shouldIncludeRecord(enrollment, options)) {
      continue;
    }

    const resolved = resolveStudentEnrollment(validatedPackage, enrollment, options);

    if (resolved !== undefined) {
      yield resolved;
    }
  }
}

/** Return resolved score-scale links for a results.csv record. */
export function getOneRosterResultScoreScales(
  validatedPackage: OneRosterCsvResolvedFullPackage,
  result: OneRosterResultRecord,
  options: OneRosterResolvedRelationshipOptions = {},
): readonly OneRosterResolvedResultScoreScale[] {
  return resolveScoreScaleLinks(
    validatedPackage,
    result,
    validatedPackage.resolvedIndexes.resultScoreScalesByResultSourcedId.get(result.sourcedId) ?? [],
    options,
    (link, scoreScale) => ({ link, scoreScale }),
  );
}

/**
 * Return the first resolved score-scale link for a results.csv record, or null.
 * Inactive parent results, inactive link rows, and inactive scoreScales.csv targets are
 * included only when `includeInactive` is true.
 */
export function getFirstOneRosterResultScoreScale(
  validatedPackage: OneRosterCsvResolvedFullPackage,
  result: OneRosterResultRecord,
  options: OneRosterResolvedRelationshipOptions = {},
): OneRosterResolvedResultScoreScale | null {
  return resolveFirstResultScoreScale(validatedPackage, result, options);
}

/**
 * Return the first active resolved score-scale link for a results.csv record, or null.
 * Active always means active parent result, active link row, and active scoreScales.csv target.
 * This helper intentionally omits `includeInactive`; use `getFirstOneRosterResultScoreScale` when
 * callers need opt-in inactive resolution consistent with `getOneRosterResultScoreScales`.
 */
export function getFirstActiveOneRosterResultScoreScale(
  validatedPackage: OneRosterCsvResolvedFullPackage,
  result: OneRosterResultRecord,
): OneRosterResolvedResultScoreScale | null {
  return resolveFirstResultScoreScale(validatedPackage, result, {});
}

/**
 * Return the first resolved scoreScale sourcedId for each results.csv sourcedId.
 * Multiple links are resolved in package order; inactive records are omitted unless
 * `includeInactive` is true.
 */
export function getResultScoreScaleSourcedIdsByResultSourcedId(
  validatedPackage: OneRosterCsvResolvedFullPackage,
  options: OneRosterResolvedRelationshipOptions = {},
): ReadonlyMap<string, string> {
  const sourcedIdsByResultSourcedId = new Map<string, string>();

  for (const result of validatedPackage.fullPackage.gradebookPackage.results) {
    const scoreScale = resolveFirstResultScoreScale(validatedPackage, result, options);

    if (scoreScale !== null) {
      sourcedIdsByResultSourcedId.set(result.sourcedId, scoreScale.scoreScale.sourcedId);
    }
  }

  return sourcedIdsByResultSourcedId;
}

/** Return resolved score-scale links for a lineItems.csv record. */
export function getOneRosterLineItemScoreScales(
  validatedPackage: OneRosterCsvResolvedFullPackage,
  lineItem: OneRosterLineItemRecord,
  options: OneRosterResolvedRelationshipOptions = {},
): readonly OneRosterResolvedLineItemScoreScale[] {
  return resolveScoreScaleLinks(
    validatedPackage,
    lineItem,
    validatedPackage.resolvedIndexes.lineItemScoreScalesByLineItemSourcedId.get(
      lineItem.sourcedId,
    ) ?? [],
    options,
    (link, scoreScale) => ({ link, scoreScale }),
  );
}

/** Return learning-objective link rows for a results.csv record. */
export function getOneRosterResultLearningObjectiveLinks(
  validatedPackage: OneRosterCsvResolvedFullPackage,
  result: OneRosterResultRecord,
  options: OneRosterResolvedRelationshipOptions = {},
): readonly OneRosterResultLearningObjectiveIdRecord[] {
  return getFilteredRelationshipLinks(
    result,
    validatedPackage.resolvedIndexes.resultLearningObjectiveLinksByResultSourcedId.get(
      result.sourcedId,
    ) ?? [],
    options,
  );
}

/** Return learning-objective link rows for a lineItems.csv record. */
export function getOneRosterLineItemLearningObjectiveLinks(
  validatedPackage: OneRosterCsvResolvedFullPackage,
  lineItem: OneRosterLineItemRecord,
  options: OneRosterResolvedRelationshipOptions = {},
): readonly OneRosterLineItemLearningObjectiveIdRecord[] {
  return getFilteredRelationshipLinks(
    lineItem,
    validatedPackage.resolvedIndexes.lineItemLearningObjectiveLinksByLineItemSourcedId.get(
      lineItem.sourcedId,
    ) ?? [],
    options,
  );
}

function resolveFirstResultScoreScale(
  validatedPackage: OneRosterCsvResolvedFullPackage,
  result: OneRosterResultRecord,
  options: OneRosterResolvedRelationshipOptions,
): OneRosterResolvedResultScoreScale | null {
  const resolved = resolveScoreScaleLinks(
    validatedPackage,
    result,
    validatedPackage.resolvedIndexes.resultScoreScalesByResultSourcedId.get(result.sourcedId) ?? [],
    options,
    (link, scoreScale) => ({ link, scoreScale }),
  );

  return resolved[0] ?? null;
}

function resolveScoreScaleLinks<
  TLink extends OneRosterCsvRecordBase & { readonly scoreScaleSourcedId: OneRosterGuid },
  TResolved,
>(
  validatedPackage: OneRosterCsvResolvedFullPackage,
  parentRecord: OneRosterCsvRecordBase,
  links: readonly TLink[],
  options: OneRosterResolvedRelationshipOptions,
  toResolved: (link: TLink, scoreScale: OneRosterScoreScaleRecord) => TResolved,
): readonly TResolved[] {
  if (!shouldIncludeRecord(parentRecord, options)) {
    return [];
  }

  const resolved: TResolved[] = [];

  for (const link of links) {
    if (!shouldIncludeRecord(link, options)) {
      continue;
    }

    const scoreScale = validatedPackage.resolvedIndexes.scoreScalesBySourcedId.get(
      link.scoreScaleSourcedId,
    );

    if (scoreScale !== undefined && shouldIncludeRecord(scoreScale, options)) {
      resolved.push(toResolved(link, scoreScale));
    }
  }

  return resolved;
}

function getFilteredRelationshipLinks<TLink extends OneRosterCsvRecordBase>(
  parentRecord: OneRosterCsvRecordBase,
  links: readonly TLink[],
  options: OneRosterResolvedRelationshipOptions,
): readonly TLink[] {
  if (!shouldIncludeRecord(parentRecord, options)) {
    return [];
  }

  return links.filter((link) => shouldIncludeRecord(link, options));
}

function resolveStudentEnrollment(
  validatedPackage: OneRosterCsvResolvedFullPackage,
  enrollment: OneRosterEnrollmentRecord,
  options: OneRosterResolvedRelationshipOptions,
): OneRosterResolvedStudentEnrollment | undefined {
  const user = validatedPackage.resolvedIndexes.usersBySourcedId.get(enrollment.userSourcedId);
  const classRecord = validatedPackage.resolvedIndexes.classesBySourcedId.get(
    enrollment.classSourcedId,
  );
  const schoolOrg = validatedPackage.resolvedIndexes.orgsBySourcedId.get(
    enrollment.schoolSourcedId,
  );

  if (
    user === undefined ||
    classRecord === undefined ||
    schoolOrg === undefined ||
    !shouldIncludeUser(user, options) ||
    !shouldIncludeRecord(classRecord, options) ||
    !shouldIncludeRecord(schoolOrg, options)
  ) {
    return undefined;
  }

  const course = validatedPackage.resolvedIndexes.coursesBySourcedId.get(
    classRecord.courseSourcedId,
  );

  if (course === undefined || !shouldIncludeRecord(course, options)) {
    return undefined;
  }

  const termSessions = resolveTermSessions(validatedPackage, classRecord, options);

  if (termSessions === undefined) {
    return undefined;
  }

  return {
    enrollment,
    user,
    classRecord,
    schoolOrg,
    course,
    termSessions,
  };
}

function resolveTermSessions(
  validatedPackage: OneRosterCsvResolvedFullPackage,
  classRecord: OneRosterClassRecord,
  options: OneRosterResolvedRelationshipOptions,
): readonly OneRosterAcademicSessionRecord[] | undefined {
  const sessions: OneRosterAcademicSessionRecord[] = [];

  for (const termSourcedId of classRecord.termSourcedIds) {
    const session = validatedPackage.resolvedIndexes.academicSessionsBySourcedId.get(termSourcedId);

    if (session === undefined || !shouldIncludeRecord(session, options)) {
      return undefined;
    }

    sessions.push(session);
  }

  return sessions;
}

function shouldIncludeRecord(
  record: OneRosterCsvRecordBase,
  options: OneRosterResolvedRelationshipOptions,
): boolean {
  return options.includeInactive === true || getOneRosterRecordStatus(record) === "active";
}

function shouldIncludeUser(
  user: OneRosterUserRecord,
  options: OneRosterResolvedRelationshipOptions,
): boolean {
  return options.includeInactive === true || getOneRosterUserStatus(user) === "active";
}
