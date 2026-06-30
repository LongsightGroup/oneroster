import { fullCsvModes, validBulkFullGraphFiles } from "./one-roster-csv-full-packages.js";
import {
  gradebookAndRosteringModes,
  validBulkGradebookFiles,
} from "./one-roster-csv-gradebook-packages.js";
import {
  categoriesCsv,
  categoryRow,
  lineItemLearningObjectiveIdRow,
  lineItemLearningObjectiveIdsCsv,
  lineItemRow,
  lineItemsCsv,
  resultRow,
  resultsCsv,
  scoreScaleRow,
  scoreScalesCsv,
} from "./one-roster-csv-gradebook-rows.js";
import { csvDocument, manifestCsv, zipPackage } from "./one-roster-csv-package-fixtures.js";
import {
  resourcesAndRosteringModes,
  validBulkResourcesFiles,
} from "./one-roster-csv-resources-packages.js";
import {
  resourceRow,
  resourcesCsv,
  userResourceRow,
  userResourcesCsv,
} from "./one-roster-csv-resources-rows.js";
import { resourceHeader } from "./one-roster-csv-resources-headers.js";
import { classHeader, userHeader } from "./one-roster-csv-rostering-headers.js";
import { rosteringModes, validBulkGraphFiles } from "./one-roster-csv-rostering-packages.js";
import {
  academicSessionRow,
  academicSessionsCsv,
  classRow,
  courseRow,
  coursesCsv,
  demographicsCsv,
  demographicsRow,
  userProfileRow,
  userProfilesCsv,
  userRow,
  usersCsv,
} from "./one-roster-csv-rostering-rows.js";
import { conformanceDateLastModified } from "./conformance-lifecycle.js";
import type { OneRosterCsvConformanceMode } from "./conformance-scenarios-valid.js";

export function manifestOnlyConformanceZip(): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv(),
  });
}

export function rosteringConformanceZip(mode: OneRosterCsvConformanceMode): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: rosteringModes(mode) }),
    ...validBulkGraphFiles(mode),
  });
}

export function gradebookConformanceZip(mode: OneRosterCsvConformanceMode): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: gradebookAndRosteringModes(mode) }),
    ...validBulkGraphFiles(mode),
    ...validBulkGradebookFiles(mode),
  });
}

export function resourcesConformanceZip(mode: OneRosterCsvConformanceMode): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: resourcesAndRosteringModes(mode) }),
    ...validBulkGraphFiles(mode),
    ...validBulkResourcesFiles(mode),
  });
}

export function fullConformanceZip(mode: OneRosterCsvConformanceMode): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: fullCsvModes(mode) }),
    ...validBulkFullGraphFiles(mode),
  });
}

export function metadataConformanceZip(): Uint8Array {
  const userRows = [
    [
      ...userRow({
        sourcedId: "user-agent",
        username: "user-agent",
        primaryOrgSourcedId: "org-1",
      }),
      "z-agent",
      "a-agent",
    ],
    [
      ...userRow({
        sourcedId: "user-1",
        username: "user-1",
        agentSourcedIds: "user-agent",
        primaryOrgSourcedId: "org-1",
      }),
      "z-user",
      "a-user",
    ],
  ];

  return zipPackage({
    "manifest.csv": manifestCsv({ modes: fullCsvModes("bulk") }),
    ...validBulkFullGraphFiles("bulk"),
    "users.csv": csvDocument([...userHeader, "metadata.zeta", "metadata.alpha"], userRows),
  });
}

export function diagnosticSafetyZip(): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: fullCsvModes("bulk") }),
    ...validBulkFullGraphFiles("bulk"),
    "users.csv": usersCsv([
      userRow({ sourcedId: "safety-sourced-id", username: "safety-username" }),
      userRow({ sourcedId: "safety-sourced-id", username: "safety-username-duplicate" }),
    ]),
    "demographics.csv": demographicsCsv([
      demographicsRow({
        sourcedId: "safety-demographic-user-id",
        cityOfBirth: "safety-demographic-value",
      }),
    ]),
    "userProfiles.csv": userProfilesCsv([
      userProfileRow({
        sourcedId: "profile-1",
        userSourcedId: "user-1",
        username: "safety-username",
        password: "safety-password",
      }),
    ]),
    "lineItems.csv": lineItemsCsv([lineItemRow({ resultValueMin: "0", resultValueMax: "100" })]),
    "results.csv": resultsCsv([
      resultRow({
        score: "999",
        comment: "safety-comment",
        textScore: "safety-text-score",
      }),
    ]),
    "lineItemLearningObjectiveIds.csv": lineItemLearningObjectiveIdsCsv([
      lineItemLearningObjectiveIdRow({ learningObjectiveId: "safety-learning-objective-id" }),
    ]),
    "resources.csv": resourcesCsv([
      resourceRow({
        vendorResourceId: "safety-vendor-resource-id",
        roles: "student",
      }),
    ]),
    "userResources.csv": userResourcesCsv([
      userResourceRow({ userSourcedId: "user-agent", classSourcedId: "class-1" }),
    ]),
  });
}

export function schemaFailureZip(): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({
      modes: new Map([
        ["users.csv", "bulk"],
        ["classes.csv", "bulk"],
        ["resources.csv", "bulk"],
      ]),
    }),
    "users.csv": csvDocument(
      ["status", "sourcedId", ...userHeader.slice(2)],
      [["", "user-1", ...userRow().slice(2)]],
    ),
    "classes.csv": csvDocument(
      ["sourcedId", "metadata.local", ...classHeader.slice(1)],
      [["class-1", "local", ...classRow().slice(1)]],
    ),
    "resources.csv": csvDocument([...resourceHeader, "localCode"], [[...resourceRow(), "local"]]),
  });
}

export function fieldFailureZip(): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: fullCsvModes("bulk") }),
    ...validBulkFullGraphFiles("bulk"),
    "academicSessions.csv": academicSessionsCsv([
      replaceCell(academicSessionRow({ sourcedId: "as-parent", title: "School Year" }), 8, "20X5"),
      academicSessionRow({
        sourcedId: "as-1",
        title: "Fall Term",
        type: "term",
        parentSourcedId: "as-parent",
      }),
    ]),
    "courses.csv": coursesCsv([courseRow({ orgSourcedId: "bad id" })]),
    "categories.csv": categoriesCsv([categoryRow({ title: "", weight: "not-integer" })]),
    "lineItems.csv": lineItemsCsv([
      lineItemRow({ assignDate: "not-date", resultValueMin: "not-float" }),
    ]),
    "results.csv": resultsCsv([
      resultRow({ scoreStatus: "not-status", inProgress: "not-boolean" }),
    ]),
    "scoreScales.csv": scoreScalesCsv([scoreScaleRow({ scoreScaleValue: "{A:94},," })]),
    "users.csv": usersCsv([userRow({ enabledUser: "not-boolean" })]),
  });
}

export function invalidDeltaLifecycleZip(): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: new Map([["users.csv", "delta"]]) }),
    "users.csv": usersCsv([userRow({ status: "active", dateLastModified: "not-a-date-time" })]),
  });
}

export function forbiddenBulkLifecycleZip(): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: new Map([["users.csv", "bulk"]]) }),
    "users.csv": usersCsv([
      userRow({ status: "active", dateLastModified: conformanceDateLastModified }),
    ]),
  });
}

export function missingDeltaLifecycleZip(): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: new Map([["users.csv", "delta"]]) }),
    "users.csv": usersCsv([userRow()]),
  });
}

export function duplicateSourcedIdZip(): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: fullCsvModes("bulk") }),
    ...validBulkFullGraphFiles("bulk"),
    "users.csv": usersCsv([
      userRow({ sourcedId: "user-1", username: "user-1" }),
      userRow({ sourcedId: "user-1", username: "user-duplicate" }),
    ]),
  });
}

export function missingTargetFileZip(): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: new Map([["lineItems.csv", "bulk"]]) }),
    "lineItems.csv": lineItemsCsv([lineItemRow()]),
  });
}

export function missingTargetRecordZip(): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: fullCsvModes("bulk") }),
    ...validBulkFullGraphFiles("bulk"),
    "lineItems.csv": lineItemsCsv([lineItemRow({ categorySourcedId: "category-missing" })]),
  });
}

export function semanticFailureZip(): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: fullCsvModes("bulk") }),
    ...validBulkFullGraphFiles("bulk"),
    "lineItems.csv": lineItemsCsv([lineItemRow({ resultValueMin: "100", resultValueMax: "0" })]),
    "scoreScales.csv": scoreScalesCsv([scoreScaleRow({ scoreScaleValue: "A:94" })]),
    "lineItemLearningObjectiveIds.csv": lineItemLearningObjectiveIdsCsv([
      lineItemLearningObjectiveIdRow({ learningObjectiveId: "not-a-uuid-urn" }),
    ]),
  });
}

function replaceCell(row: readonly string[], index: number, value: string): readonly string[] {
  return row.map((cell, cellIndex) => (cellIndex === index ? value : cell));
}
