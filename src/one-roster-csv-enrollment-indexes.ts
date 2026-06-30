import { appendIndexedMapValue } from "./one-roster-csv-indexed-map.js";
import type { OneRosterGuid } from "./one-roster-csv-primitive.js";
import type { OneRosterEnrollmentRecord } from "./one-roster-csv-rostering-types.js";

/** Enrollment relationship indexes built in one pass for semantic and resolved lookups. */
export type OneRosterEnrollmentRelationshipIndexes = {
  readonly enrollmentsByClassAndUser: ReadonlyMap<string, readonly OneRosterEnrollmentRecord[]>;
  readonly enrollmentsByClassSourcedId: ReadonlyMap<
    OneRosterGuid,
    readonly OneRosterEnrollmentRecord[]
  >;
  readonly enrollmentsByUserSourcedId: ReadonlyMap<
    OneRosterGuid,
    readonly OneRosterEnrollmentRecord[]
  >;
};

/** Build a stable key for class/user membership lookups. */
export function classUserKey(classSourcedId: OneRosterGuid, userSourcedId: OneRosterGuid): string {
  return `${classSourcedId}|${userSourcedId}`;
}

/** Build enrollment relationship indexes in a single package scan. */
export function buildEnrollmentRelationshipIndexes(
  enrollments: readonly OneRosterEnrollmentRecord[],
): OneRosterEnrollmentRelationshipIndexes {
  const enrollmentsByClassAndUser = new Map<string, OneRosterEnrollmentRecord[]>();
  const enrollmentsByClassSourcedId = new Map<OneRosterGuid, OneRosterEnrollmentRecord[]>();
  const enrollmentsByUserSourcedId = new Map<OneRosterGuid, OneRosterEnrollmentRecord[]>();

  for (const enrollment of enrollments) {
    appendIndexedMapValue(
      enrollmentsByClassAndUser,
      classUserKey(enrollment.classSourcedId, enrollment.userSourcedId),
      enrollment,
    );
    appendIndexedMapValue(enrollmentsByClassSourcedId, enrollment.classSourcedId, enrollment);
    appendIndexedMapValue(enrollmentsByUserSourcedId, enrollment.userSourcedId, enrollment);
  }

  return {
    enrollmentsByClassAndUser,
    enrollmentsByClassSourcedId,
    enrollmentsByUserSourcedId,
  };
}
