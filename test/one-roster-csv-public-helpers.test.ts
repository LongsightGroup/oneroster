import { describe, expect, it } from "vitest";

import * as oneRoster from "../src/index.js";
import { conformanceDateLastModified } from "./fixtures/conformance-lifecycle.js";
import { fullCsvModes, validBulkFullGraphFiles } from "./fixtures/one-roster-csv-full-packages.js";
import {
  lineItemScoreScaleRow,
  lineItemScoreScalesCsv,
  resultScoreScaleRow,
  resultScoreScalesCsv,
} from "./fixtures/one-roster-csv-gradebook-rows.js";
import { expectValidatedFullOk } from "./fixtures/one-roster-csv-full-assertions.js";
import { manifestCsv, zipPackage } from "./fixtures/one-roster-csv-package-fixtures.js";
import {
  enrollmentRow,
  enrollmentsCsv,
  roleRow,
  rolesCsv,
  userRow,
  usersCsv,
} from "./fixtures/one-roster-csv-rostering-rows.js";
import {
  expectErr,
  expectOk,
  expectPackageWriteErr,
  expectPackageWriteOk,
  onlyRecord,
} from "./fixtures/result-assertions.js";

const textEncoder = new TextEncoder();

describe("OneRoster CSV public helper APIs", () => {
  it("validates full package file maps without caller-created ZIP entries", () => {
    const validated = expectValidatedFullOk(
      oneRoster.parseAndValidateOneRosterCsvFullFiles(
        {
          "manifest.csv": manifestCsv({ modes: fullCsvModes("bulk") }),
          ...validBulkFullGraphFiles("bulk"),
        },
        { referenceMode: "allRows" },
      ),
    );

    expect(validated.fullPackage.rosteringPackage.users).toHaveLength(2);
    expect(validated.resolvedIndexes.resultScoreScalesByResultSourcedId.size).toBe(1);
  });

  it("validates already-extracted full package entries", () => {
    const entries = expectOk(oneRoster.readZipEntries(fullPackageZip("bulk")));
    const validated = expectValidatedFullOk(
      oneRoster.parseAndValidateOneRosterCsvFullEntries(entries, { referenceMode: "allRows" }),
    );

    expect(validated.resolvedIndexes.usersBySourcedId.size).toBeGreaterThan(0);
    expect(validated.resolvedIndexes.lineItemScoreScalesByLineItemSourcedId.size).toBe(1);
  });

  it("propagates package and row diagnostics from full package entries", () => {
    const missingFileDiagnostics = expectErr(
      oneRoster.parseAndValidateOneRosterCsvFullEntries([
        {
          path: "manifest.csv",
          bytes: textEncoder.encode(manifestCsv({ modes: new Map([["users.csv", "bulk"]]) })),
        },
      ]),
    );
    const invalidRowDiagnostics = expectErr(
      oneRoster.parseAndValidateOneRosterCsvFullEntries(
        expectOk(
          oneRoster.readZipEntries(
            zipPackage({
              "manifest.csv": manifestCsv({ modes: new Map([["users.csv", "bulk"]]) }),
              "users.csv": usersCsv([userRow({ enabledUser: "not-boolean" })]),
            }),
          ),
        ),
      ),
    );

    expect(missingFileDiagnostics.map((diagnostic) => diagnostic.code)).toContain(
      "manifest.file_missing",
    );
    expect(invalidRowDiagnostics.map((diagnostic) => diagnostic.code)).toContain(
      "row.invalid_boolean",
    );
  });

  it("exposes canonical table headers and manifest rows", () => {
    const packageValue = expectOk(
      oneRoster.parseOneRosterCsvZip(zipPackage({ "manifest.csv": manifestCsv() })),
    );
    const rows = oneRoster.oneRosterManifestRows(packageValue.manifest.fileModes, {
      systemName: "Test SIS",
      systemCode: "SIS-1",
    });

    expect(oneRoster.oneRosterCsvTableHeaders["users.csv"]).toEqual([
      "sourcedId",
      "status",
      "dateLastModified",
      "enabledUser",
      "username",
      "userIds",
      "givenName",
      "familyName",
      "middleName",
      "identifier",
      "email",
      "sms",
      "phone",
      "agentSourcedIds",
      "grades",
      "password",
      "userMasterIdentifier",
      "preferredGivenName",
      "preferredMiddleName",
      "preferredFamilyName",
      "primaryOrgSourcedId",
      "pronouns",
    ]);
    expect(oneRoster.gradebookTableHeaders["lineItems.csv"]).toEqual(
      oneRoster.oneRosterCsvTableHeaders["lineItems.csv"],
    );
    expect(rows.slice(0, 4)).toEqual([
      ["propertyName", "value"],
      ["manifest.version", "1.0"],
      ["oneroster.version", "1.2"],
      ["file.academicSessions", "absent"],
    ]);
    expect(rows.slice(-3)).toEqual([
      ["file.users", "absent"],
      ["source.systemName", "Test SIS"],
      ["source.systemCode", "SIS-1"],
    ]);
  });

  it("serializes typed records into cells and CSV objects", () => {
    const validated = validFullPackage("bulk");
    const user = recordBySourcedId(validated.fullPackage.rosteringPackage.users, "user-1");
    const userWithMetadata = {
      ...user,
      metadata: {
        "metadata.zeta": "z-user",
        "metadata.alpha": "a-user",
      },
    };
    const userWithInvalidMetadata = {
      ...user,
      metadata: {
        localCode: "unsafe",
      },
    };
    const lineItem = onlyRecord(validated.fullPackage.gradebookPackage.lineItems);
    const resource = onlyRecord(validated.fullPackage.resourcesPackage.resources);

    expect(oneRoster.oneRosterRecordToCsvCells("users.csv", userWithMetadata)).toEqual([
      "user-1",
      "",
      "",
      "true",
      "user-1",
      "",
      "Given",
      "Family",
      "",
      "",
      "",
      "",
      "",
      "user-agent",
      "9",
      "",
      "",
      "",
      "",
      "",
      "org-1",
      "",
    ]);
    expect(
      Object.keys(oneRoster.oneRosterRecordToCsvObject("users.csv", userWithMetadata)),
    ).toEqual([
      ...oneRoster.oneRosterCsvTableHeaders["users.csv"],
      "metadata.alpha",
      "metadata.zeta",
    ]);
    expect(oneRoster.oneRosterRecordToCsvObject("lineItems.csv", lineItem)).toMatchObject({
      resultValueMin: "0",
      resultValueMax: "100",
    });
    expect(oneRoster.oneRosterRecordToCsvObject("resources.csv", resource)).toMatchObject({
      roles: "student,teacher",
      applicationId: "application-1",
    });
    expect(() =>
      oneRoster.oneRosterRecordToCsvObject("users.csv", userWithInvalidMetadata),
    ).toThrow("metadata.*");
  });

  it("writes a full package directly from typed record collections", () => {
    const validated = validFullPackage("bulk");
    const recordCollections = recordCollectionsFromValidated(validated);
    const entries = expectPackageWriteOk(
      oneRoster.writeOneRosterCsvFullPackageEntriesFromRecords(recordCollections, {
        source: {
          systemName: "Record Writer",
          systemCode: "RW-1",
        },
      }),
    );
    const zipBytes = expectPackageWriteOk(
      oneRoster.writeOneRosterCsvFullPackageZipFromRecords(recordCollections),
    );
    const roundTrip = expectValidatedFullOk(
      oneRoster.parseAndValidateOneRosterCsvFullZip(zipBytes, { referenceMode: "allRows" }),
    );

    expect(entries.map((entry) => entry.path).slice(0, 3)).toEqual([
      "manifest.csv",
      "academicSessions.csv",
      "categories.csv",
    ]);
    expect(roundTrip.fullPackage.rosteringPackage.users).toHaveLength(
      validated.fullPackage.rosteringPackage.users.length,
    );
    expect(expectOk(oneRoster.parseOneRosterCsvPackageEntries(entries)).manifest.source).toEqual({
      systemName: "Record Writer",
      systemCode: "RW-1",
    });
  });

  it("returns writer diagnostics for invalid record collections", () => {
    const validated = validFullPackage("bulk");
    const user = recordBySourcedId(validated.fullPackage.rosteringPackage.users, "user-1");
    const userWithInvalidMetadata = {
      ...user,
      metadata: {
        localCode: "unsafe",
      },
    };
    const deltaDate = oneRoster.parseOneRosterDateTime(conformanceDateLastModified);

    if (deltaDate === undefined) {
      throw new Error("Expected fixture dateLastModified to parse.");
    }

    const deltaUser = {
      ...user,
      lifecycle: {
        mode: "delta",
        status: "active",
        dateLastModified: deltaDate,
      },
    } as const;

    expect(
      expectPackageWriteErr(
        oneRoster.writeOneRosterCsvFullPackageZipFromRecords({
          users: [userWithInvalidMetadata],
        }),
      ),
    ).toContainEqual(
      expect.objectContaining({
        code: "write.invalid_metadata_header",
        fileName: "users.csv",
      }),
    );
    expect(
      expectPackageWriteErr(
        oneRoster.writeOneRosterCsvFullPackageZipFromRecords({
          users: [user, deltaUser],
        }),
      ),
    ).toContainEqual(expect.objectContaining({ code: "write.mixed_lifecycle_modes" }));
    expect(
      expectPackageWriteErr(
        oneRoster.writeOneRosterCsvFullPackageZipFromRecords(
          { users: [user] },
          { fileModes: { "users.csv": "delta" } },
        ),
      ),
    ).toContainEqual(
      expect.objectContaining({
        code: "write.table_mode_mismatch",
        fileName: "users.csv",
        expected: "delta",
        actual: "bulk",
      }),
    );
  });

  it("normalizes record and user status", () => {
    const validated = validFullPackage("delta");
    const user = recordBySourcedId(validated.fullPackage.rosteringPackage.users, "user-1");
    const dateLastModified = oneRoster.parseOneRosterDateTime(conformanceDateLastModified);

    if (dateLastModified === undefined) {
      throw new Error("Expected fixture dateLastModified to parse.");
    }

    const deletedUser = {
      ...user,
      lifecycle: {
        mode: "delta",
        status: "tobedeleted",
        dateLastModified,
      },
    } as const;
    const disabledUser = { ...user, enabledUser: false };

    expect(oneRoster.getOneRosterRecordStatus(user)).toBe("active");
    expect(oneRoster.getOneRosterRecordStatus(deletedUser)).toBe("inactive");
    expect(oneRoster.getOneRosterUserStatus(user)).toBe("active");
    expect(oneRoster.getOneRosterUserStatus(disabledUser)).toBe("inactive");
    expect(oneRoster.getOneRosterUserStatus(deletedUser)).toBe("inactive");
  });

  it("formats stable user display names", () => {
    const validated = validFullPackage("bulk");
    const user = recordBySourcedId(validated.fullPackage.rosteringPackage.users, "user-1");

    expect(oneRoster.formatOneRosterUserDisplayName(user)).toBe("Given Family");
    expect(
      oneRoster.formatOneRosterUserDisplayName({
        ...user,
        givenName: " Given ",
        familyName: "",
      }),
    ).toBe("Given");
    expect(
      oneRoster.formatOneRosterUserDisplayName({
        ...user,
        givenName: "",
        familyName: "",
        username: " ",
        email: " learner@example.edu ",
      }),
    ).toBe("learner@example.edu");
    expect(
      oneRoster.formatOneRosterUserDisplayName(
        {
          ...user,
          givenName: "",
          familyName: "",
          username: "user-name",
          email: "learner@example.edu",
        },
        { fallbackOrder: ["email", "username", "sourcedId"] },
      ),
    ).toBe("learner@example.edu");
    expect(
      oneRoster.formatOneRosterUserDisplayName({
        ...user,
        givenName: "",
        familyName: "",
        username: "",
        email: undefined,
      }),
    ).toBe("user-1");
  });

  it("formats safe diagnostic locations", () => {
    expect(
      oneRoster.formatOneRosterDiagnosticLocation({
        fileName: "users.csv",
        rowNumber: 2,
        columnNumber: 4,
        field: "enabledUser",
        propertyName: "file.users",
      }),
    ).toBe("users.csv: row 2: column 4: field enabledUser: property file.users");
    expect(oneRoster.formatOneRosterDiagnosticLocation({ entryName: "extra.csv" })).toBe(
      "entry extra.csv",
    );
    expect(oneRoster.formatOneRosterDiagnosticLocation({})).toBeNull();
  });

  it("resolves student enrollments and gradebook relationship links", () => {
    const validated = validFullPackageWithStudentEnrollment();
    const lineItem = onlyRecord(validated.fullPackage.gradebookPackage.lineItems);
    const result = onlyRecord(validated.fullPackage.gradebookPackage.results);
    const resolvedEnrollments = [...oneRoster.iterateResolvedStudentEnrollments(validated)];

    expect(resolvedEnrollments).toHaveLength(1);
    expect(resolvedEnrollments[0]?.user.sourcedId).toBe("user-1");
    expect(resolvedEnrollments[0]?.classRecord.sourcedId).toBe("class-1");
    expect(resolvedEnrollments[0]?.schoolOrg.sourcedId).toBe("org-1");
    expect(resolvedEnrollments[0]?.course.sourcedId).toBe("course-1");
    expect(resolvedEnrollments[0]?.termSessions.map((session) => session.sourcedId)).toEqual([
      "as-1",
    ]);
    expect(oneRoster.getOneRosterLineItemScoreScales(validated, lineItem)).toHaveLength(1);
    expect(oneRoster.getOneRosterResultScoreScales(validated, result)).toHaveLength(1);
    expect(
      oneRoster.getFirstActiveOneRosterResultScoreScale(validated, result)?.scoreScale.sourcedId,
    ).toBe("score-scale-1");
    expect(
      oneRoster.getResultScoreScaleSourcedIdsByResultSourcedId(validated).get("result-1"),
    ).toBe("score-scale-1");
    expect(oneRoster.getOneRosterLineItemLearningObjectiveLinks(validated, lineItem)).toHaveLength(
      1,
    );
    expect(oneRoster.getOneRosterResultLearningObjectiveLinks(validated, result)).toHaveLength(1);
  });

  it("filters inactive relationship links by default", () => {
    const validated = validFullPackageWithInactiveLineItemScoreScale();
    const lineItem = onlyRecord(validated.fullPackage.gradebookPackage.lineItems);
    const validatedResultScoreScale = validFullPackageWithInactiveResultScoreScale();
    const result = onlyRecord(validatedResultScoreScale.fullPackage.gradebookPackage.results);

    expect(oneRoster.getOneRosterLineItemScoreScales(validated, lineItem)).toEqual([]);
    expect(
      oneRoster.getOneRosterLineItemScoreScales(validated, lineItem, { includeInactive: true }),
    ).toHaveLength(1);
    expect(
      oneRoster.getFirstOneRosterResultScoreScale(validatedResultScoreScale, result),
    ).toBeNull();
    expect(
      oneRoster.getFirstOneRosterResultScoreScale(validatedResultScoreScale, result, {
        includeInactive: true,
      })?.scoreScale.sourcedId,
    ).toBe("score-scale-1");
    expect(
      oneRoster.getFirstActiveOneRosterResultScoreScale(validatedResultScoreScale, result),
    ).toBeNull();
    expect(
      oneRoster
        .getResultScoreScaleSourcedIdsByResultSourcedId(validatedResultScoreScale)
        .has("result-1"),
    ).toBe(false);
    expect(
      oneRoster
        .getResultScoreScaleSourcedIdsByResultSourcedId(validatedResultScoreScale, {
          includeInactive: true,
        })
        .get("result-1"),
    ).toBe("score-scale-1");
  });

  it("builds common typed records and lifecycles", () => {
    const sourcedId = requiredGuid("user-builder");
    const orgSourcedId = requiredGuid("org-builder");
    const classSourcedId = requiredGuid("class-builder");
    const enrollmentSourcedId = requiredGuid("enrollment-builder");
    const dateLastModified = oneRoster.parseOneRosterDateTime(conformanceDateLastModified);

    if (dateLastModified === undefined) {
      throw new Error("Expected fixture dateLastModified to parse.");
    }

    const user = oneRoster.makeOneRosterUserRecord({
      sourcedId,
      username: "learner",
      givenName: "Learner",
      familyName: "Example",
      primaryOrgSourcedId: orgSourcedId,
      lifecycle: oneRoster.oneRosterDeltaDeleteLifecycle(dateLastModified),
    });
    const enrollment = oneRoster.makeOneRosterEnrollmentRecord({
      sourcedId: enrollmentSourcedId,
      classSourcedId,
      schoolSourcedId: orgSourcedId,
      userSourcedId: sourcedId,
      role: "student",
    });

    expect(oneRoster.oneRosterBulkLifecycle()).toEqual({ mode: "bulk" });
    expect(oneRoster.getOneRosterUserStatus(user)).toBe("inactive");
    expect(enrollment.lifecycle).toEqual({ mode: "bulk" });
    expect(enrollment.primary).toBeUndefined();
  });

  it("summarizes validated full package counts", () => {
    const validated = validFullPackageWithInactiveResultScoreScale();
    const summary = oneRoster.summarizeOneRosterCsvFullPackage(validated);

    expect(summary.tables.users).toBe(2);
    expect(summary.tables.orgs).toBe(2);
    expect(summary.tables.enrollments).toBe(1);
    expect(summary.tables.classes).toBe(1);
    expect(summary.tables.resources).toBe(1);
    expect(summary.tables.results).toBe(1);
    expect(summary.layers.total).toBe(summary.rows.total);
    expect(summary.rows.inactive).toBe(1);
    expect(summary.users.active).toBe(2);
  });
});

function validFullPackage(mode: "bulk" | "delta"): oneRoster.OneRosterCsvValidatedFullPackage {
  return expectValidatedFullOk(
    oneRoster.parseAndValidateOneRosterCsvFullZip(fullPackageZip(mode), {
      referenceMode: "allRows",
    }),
  );
}

function validFullPackageWithStudentEnrollment(): oneRoster.OneRosterCsvValidatedFullPackage {
  return expectValidatedFullOk(
    oneRoster.parseAndValidateOneRosterCsvFullZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: fullCsvModes("bulk") }),
        ...validBulkFullGraphFiles("bulk"),
        "roles.csv": rolesCsv([
          roleRow({
            sourcedId: "role-agent",
            userSourcedId: "user-agent",
            orgSourcedId: "org-1",
          }),
          roleRow({
            sourcedId: "role-1",
            userSourcedId: "user-1",
            role: "student",
            orgSourcedId: "org-1",
            userProfileSourcedId: "profile-1",
          }),
        ]),
        "enrollments.csv": enrollmentsCsv([enrollmentRow({ role: "student" })]),
      }),
      { referenceMode: "allRows" },
    ),
  );
}

function validFullPackageWithInactiveLineItemScoreScale(): oneRoster.OneRosterCsvValidatedFullPackage {
  return expectValidatedFullOk(
    oneRoster.parseAndValidateOneRosterCsvFullZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: fullCsvModes("delta") }),
        ...validBulkFullGraphFiles("delta"),
        "lineItemScoreScales.csv": lineItemScoreScalesCsv([
          lineItemScoreScaleRow({
            status: "tobedeleted",
            dateLastModified: conformanceDateLastModified,
          }),
        ]),
      }),
    ),
  );
}

function validFullPackageWithInactiveResultScoreScale(): oneRoster.OneRosterCsvValidatedFullPackage {
  return expectValidatedFullOk(
    oneRoster.parseAndValidateOneRosterCsvFullZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: fullCsvModes("delta") }),
        ...validBulkFullGraphFiles("delta"),
        "resultScoreScales.csv": resultScoreScalesCsv([
          resultScoreScaleRow({
            status: "tobedeleted",
            dateLastModified: conformanceDateLastModified,
          }),
        ]),
      }),
    ),
  );
}

function fullPackageZip(mode: "bulk" | "delta"): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: fullCsvModes(mode) }),
    ...validBulkFullGraphFiles(mode),
  });
}

function recordCollectionsFromValidated(
  validated: oneRoster.OneRosterCsvValidatedFullPackage,
): oneRoster.OneRosterCsvFullPackageRecordCollections {
  const { rosteringPackage, gradebookPackage, resourcesPackage } = validated.fullPackage;

  return {
    academicSessions: rosteringPackage.academicSessions,
    orgs: rosteringPackage.orgs,
    courses: rosteringPackage.courses,
    classes: rosteringPackage.classes,
    users: rosteringPackage.users,
    roles: rosteringPackage.roles,
    enrollments: rosteringPackage.enrollments,
    demographics: rosteringPackage.demographics,
    userProfiles: rosteringPackage.userProfiles,
    categories: gradebookPackage.categories,
    lineItems: gradebookPackage.lineItems,
    results: gradebookPackage.results,
    scoreScales: gradebookPackage.scoreScales,
    lineItemLearningObjectiveIds: gradebookPackage.lineItemLearningObjectiveIds,
    lineItemScoreScales: gradebookPackage.lineItemScoreScales,
    resultLearningObjectiveIds: gradebookPackage.resultLearningObjectiveIds,
    resultScoreScales: gradebookPackage.resultScoreScales,
    resources: resourcesPackage.resources,
    classResources: resourcesPackage.classResources,
    courseResources: resourcesPackage.courseResources,
    userResources: resourcesPackage.userResources,
  };
}

function recordBySourcedId<TRecord extends { readonly sourcedId: string }>(
  records: readonly TRecord[],
  sourcedId: string,
): TRecord {
  const record = records.find((candidate) => candidate.sourcedId === sourcedId);

  if (record === undefined) {
    throw new Error(`Expected record ${sourcedId}.`);
  }

  return record;
}

function requiredGuid(value: string): oneRoster.OneRosterGuid {
  const guid = oneRoster.parseOneRosterGuid(value);

  if (guid === undefined) {
    throw new Error(`Expected ${value} to parse as a OneRoster GUID.`);
  }

  return guid;
}
