import type { OneRosterCsvReferenceTarget } from "./one-roster-csv-record-reference-validation.js";
import type { OneRosterCsvRosteringReferenceIndexes } from "./one-roster-csv-rostering-types.js";

/** Validation context that exposes typed rostering sourcedId indexes. */
export type OneRosterCsvRosteringIndexContext = {
  readonly rosteringIndexes: OneRosterCsvRosteringReferenceIndexes;
};

/** Canonical reference targets backed by rostering sourcedId indexes. */
export type OneRosterCsvRosteringIndexTargets<TContext extends OneRosterCsvRosteringIndexContext> =
  {
    readonly academicSessions: OneRosterCsvReferenceTarget<TContext>;
    readonly classes: OneRosterCsvReferenceTarget<TContext>;
    readonly courses: OneRosterCsvReferenceTarget<TContext>;
    readonly orgs: OneRosterCsvReferenceTarget<TContext>;
    readonly users: OneRosterCsvReferenceTarget<TContext>;
  };

/** Build rostering index reference targets for a profile validation context. */
export function rosteringIndexTargets<TContext extends OneRosterCsvRosteringIndexContext>(
  getIndexes: (context: TContext) => OneRosterCsvRosteringReferenceIndexes = (context) =>
    context.rosteringIndexes,
): OneRosterCsvRosteringIndexTargets<TContext> {
  return {
    academicSessions: {
      fileName: "academicSessions.csv",
      getIndex: (context) => getIndexes(context).academicSessionsBySourcedId,
    },
    classes: {
      fileName: "classes.csv",
      getIndex: (context) => getIndexes(context).classesBySourcedId,
    },
    courses: {
      fileName: "courses.csv",
      getIndex: (context) => getIndexes(context).coursesBySourcedId,
    },
    orgs: {
      fileName: "orgs.csv",
      getIndex: (context) => getIndexes(context).orgsBySourcedId,
    },
    users: {
      fileName: "users.csv",
      getIndex: (context) => getIndexes(context).usersBySourcedId,
    },
  };
}
