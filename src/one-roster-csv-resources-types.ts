import type { OneRosterGuid } from "./one-roster-csv-primitive.js";
import type {
  OneRosterCsvRecordBase,
  OneRosterExtensionVocabularyToken,
} from "./one-roster-csv-record-types.js";
import type { OneRosterCsvRosteringPackage } from "./one-roster-csv-rostering-types.js";

/** OneRoster 1.2 CSV resources files supported by the typed row parser. */
export type OneRosterCsvResourcesFileName =
  | "resources.csv"
  | "classResources.csv"
  | "courseResources.csv"
  | "userResources.csv";

/** Common fields shared by typed OneRoster CSV resources records. */
export type OneRosterCsvResourcesRecordBase = OneRosterCsvRecordBase;

/** OneRoster resources.csv roles vocabulary values. */
export type OneRosterResourceRole =
  | "administrator"
  | "aide"
  | "guardian"
  | "parent"
  | "proctor"
  | "relative"
  | "student"
  | "teacher"
  | OneRosterExtensionVocabularyToken;

/** OneRoster resources.csv importance vocabulary values. */
export type OneRosterResourceImportance = "primary" | "secondary";

/** Typed OneRoster resources.csv record. */
export type OneRosterResourceRecord = OneRosterCsvResourcesRecordBase & {
  readonly vendorResourceId: string;
  readonly title: string | undefined;
  readonly roles: ReadonlyArray<OneRosterResourceRole>;
  readonly importance: OneRosterResourceImportance | undefined;
  readonly vendorId: string | undefined;
  readonly applicationId: string | undefined;
};

/** Typed OneRoster classResources.csv record. */
export type OneRosterClassResourceRecord = OneRosterCsvResourcesRecordBase & {
  readonly title: string | undefined;
  readonly classSourcedId: OneRosterGuid;
  readonly resourceSourcedId: OneRosterGuid;
};

/** Typed OneRoster courseResources.csv record. */
export type OneRosterCourseResourceRecord = OneRosterCsvResourcesRecordBase & {
  readonly title: string | undefined;
  readonly courseSourcedId: OneRosterGuid;
  readonly resourceSourcedId: OneRosterGuid;
};

/** Typed OneRoster userResources.csv record. */
export type OneRosterUserResourceRecord = OneRosterCsvResourcesRecordBase & {
  readonly userSourcedId: OneRosterGuid;
  readonly orgSourcedId: OneRosterGuid | undefined;
  readonly classSourcedId: OneRosterGuid | undefined;
  readonly resourceSourcedId: OneRosterGuid;
};

/** Typed OneRoster CSV resources package over an already parsed rostering package. */
export type OneRosterCsvResourcesPackage = {
  readonly rosteringPackage: OneRosterCsvRosteringPackage;
  readonly resources: ReadonlyArray<OneRosterResourceRecord>;
  readonly classResources: ReadonlyArray<OneRosterClassResourceRecord>;
  readonly courseResources: ReadonlyArray<OneRosterCourseResourceRecord>;
  readonly userResources: ReadonlyArray<OneRosterUserResourceRecord>;
};

/** Lookup indexes for typed OneRoster CSV resources records keyed by sourcedId. */
export type OneRosterCsvResourcesReferenceIndexes = {
  readonly resourcesBySourcedId: ReadonlyMap<OneRosterGuid, OneRosterResourceRecord>;
  readonly classResourcesBySourcedId: ReadonlyMap<OneRosterGuid, OneRosterClassResourceRecord>;
  readonly courseResourcesBySourcedId: ReadonlyMap<OneRosterGuid, OneRosterCourseResourceRecord>;
  readonly userResourcesBySourcedId: ReadonlyMap<OneRosterGuid, OneRosterUserResourceRecord>;
};
