import { describe, expect, it } from "vitest";

import { parseOneRosterCsvResourcesZip } from "../src/index.js";
import {
  csvDocument,
  manifestCsv,
  zipPackage,
} from "./fixtures/one-roster-csv-package-fixtures.js";
import {
  expectResourcesErr,
  expectResourcesOk,
} from "./fixtures/one-roster-csv-resources-assertions.js";
import { resourceHeader } from "./fixtures/one-roster-csv-resources-headers.js";
import {
  resourcesAndRosteringModes,
  resourcesModes,
  validBulkResourcesFiles,
  validBulkResourcesGraphZip,
} from "./fixtures/one-roster-csv-resources-packages.js";
import {
  classResourceRow,
  classResourcesCsv,
  courseResourceRow,
  courseResourcesCsv,
  resourceRow,
  resourcesCsv,
  userResourceRow,
  userResourcesCsv,
} from "./fixtures/one-roster-csv-resources-rows.js";
import { validBulkGraphFiles } from "./fixtures/one-roster-csv-rostering-packages.js";
import { usersCsv, userRow } from "./fixtures/one-roster-csv-rostering-rows.js";

describe("parseOneRosterCsvResourcesZip", () => {
  it("parses valid bulk records for typed resources files", () => {
    const result = parseOneRosterCsvResourcesZip(validBulkResourcesGraphZip());

    const packageValue = expectResourcesOk(result);

    expect(packageValue.rosteringPackage.users).toHaveLength(2);
    expect(packageValue.resources).toHaveLength(1);
    expect(packageValue.classResources).toHaveLength(1);
    expect(packageValue.courseResources).toHaveLength(1);
    expect(packageValue.userResources).toHaveLength(1);
    expect(packageValue.resources[0]?.vendorResourceId).toBe("vendor-resource-1");
    expect(packageValue.resources[0]?.roles).toEqual(["student", "teacher"]);
    expect(packageValue.resources[0]?.importance).toBe("primary");
    expect(packageValue.classResources[0]?.title).toBe("Class Algebra Resource");
    expect(packageValue.userResources[0]?.rowNumber).toBe(2);
  });

  it("parses valid delta lifecycle fields", () => {
    const dateLastModified = "2025-01-02T03:04:05.006Z";
    const result = parseOneRosterCsvResourcesZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: resourcesModes("delta") }),
        "resources.csv": resourcesCsv([resourceRow({ status: "active", dateLastModified })]),
        "classResources.csv": classResourcesCsv([
          classResourceRow({ status: "active", dateLastModified }),
        ]),
        "courseResources.csv": courseResourcesCsv([
          courseResourceRow({ status: "active", dateLastModified }),
        ]),
        "userResources.csv": userResourcesCsv([
          userResourceRow({ status: "active", dateLastModified }),
        ]),
      }),
    );

    const packageValue = expectResourcesOk(result);

    expect(packageValue.resources[0]?.lifecycle).toEqual({
      mode: "delta",
      status: "active",
      dateLastModified,
    });
    expect(packageValue.userResources[0]?.lifecycle).toEqual({
      mode: "delta",
      status: "active",
      dateLastModified,
    });
  });

  it("rejects lifecycle values that violate bulk and delta mode rules", () => {
    const bulkResult = parseOneRosterCsvResourcesZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["resources.csv", "bulk"]]) }),
        "resources.csv": resourcesCsv([
          resourceRow({ status: "active", dateLastModified: "2025-01-02T03:04:05.006Z" }),
        ]),
      }),
    );
    const deltaResult = parseOneRosterCsvResourcesZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["resources.csv", "delta"]]) }),
        "resources.csv": resourcesCsv([resourceRow()]),
      }),
    );

    expect(expectResourcesErr(bulkResult)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "row.field_forbidden_in_bulk",
          fileName: "resources.csv",
          field: "status",
        }),
        expect.objectContaining({
          code: "row.field_forbidden_in_bulk",
          fileName: "resources.csv",
          field: "dateLastModified",
        }),
      ]),
    );
    expect(expectResourcesErr(deltaResult)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "row.field_required_in_delta",
          fileName: "resources.csv",
          field: "status",
        }),
        expect.objectContaining({
          code: "row.field_required_in_delta",
          fileName: "resources.csv",
          field: "dateLastModified",
        }),
      ]),
    );
  });

  it("validates exact headers and metadata placement", () => {
    const metadataResult = parseOneRosterCsvResourcesZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["resources.csv", "bulk"]]) }),
        "resources.csv": csvDocument(
          [...resourceHeader, "metadata.localCode"],
          [[...resourceRow(), "local-resource"]],
        ),
      }),
    );
    const wrongCaseResult = parseOneRosterCsvResourcesZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["resources.csv", "bulk"]]) }),
        "resources.csv": csvDocument(["SourcedId", ...resourceHeader.slice(1)], [resourceRow()]),
      }),
    );
    const metadataInWrongPositionResult = parseOneRosterCsvResourcesZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["resources.csv", "bulk"]]) }),
        "resources.csv": csvDocument(
          ["sourcedId", "status", "metadata.localCode", ...resourceHeader.slice(2)],
          [["resource-2", "", "local-resource", "", "vendor-resource-2", "", "", "", "", ""]],
        ),
      }),
    );

    expect(expectResourcesOk(metadataResult).resources[0]?.metadata).toEqual({
      "metadata.localCode": "local-resource",
    });
    expect(expectResourcesErr(wrongCaseResult)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "schema.header_order_mismatch",
          fileName: "resources.csv",
          field: "sourcedId",
        }),
        expect.objectContaining({
          code: "schema.missing_header",
          fileName: "resources.csv",
          field: "sourcedId",
        }),
      ]),
    );
    expect(expectResourcesErr(metadataInWrongPositionResult)).toContainEqual(
      expect.objectContaining({
        code: "schema.metadata_column_position",
        fileName: "resources.csv",
        field: "dateLastModified",
      }),
    );
  });

  it("parses ext role vocabularies and normalizes blank optional values", () => {
    const result = parseOneRosterCsvResourcesZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: resourcesAndRosteringModes("bulk") }),
        ...validBulkGraphFiles(),
        ...validBulkResourcesFiles(),
        "resources.csv": resourcesCsv([
          resourceRow({
            title: "",
            roles: "student,ext:vendor-role",
            importance: "",
            vendorId: "",
            applicationId: "",
          }),
        ]),
        "classResources.csv": classResourcesCsv([classResourceRow({ title: "" })]),
        "courseResources.csv": courseResourcesCsv([courseResourceRow({ title: "" })]),
        "userResources.csv": userResourcesCsv([
          userResourceRow({ orgSourcedId: "", classSourcedId: "" }),
        ]),
      }),
    );

    const packageValue = expectResourcesOk(result);

    expect(packageValue.resources[0]?.title).toBeUndefined();
    expect(packageValue.resources[0]?.roles).toEqual(["student", "ext:vendor-role"]);
    expect(packageValue.resources[0]?.importance).toBeUndefined();
    expect(packageValue.resources[0]?.vendorId).toBeUndefined();
    expect(packageValue.classResources[0]?.title).toBeUndefined();
    expect(packageValue.userResources[0]?.orgSourcedId).toBeUndefined();
    expect(packageValue.userResources[0]?.classSourcedId).toBeUndefined();
  });

  it("rejects invalid resources field values with typed diagnostics", () => {
    const result = parseOneRosterCsvResourcesZip(
      zipPackage({
        "manifest.csv": manifestCsv({
          modes: new Map([
            ["resources.csv", "bulk"],
            ["classResources.csv", "bulk"],
            ["courseResources.csv", "bulk"],
            ["userResources.csv", "bulk"],
          ]),
        }),
        "resources.csv": resourcesCsv([
          resourceRow({ vendorResourceId: "", roles: "student,,teacher", importance: "tertiary" }),
          resourceRow({ sourcedId: "resource-2", roles: "student,bad-role" }),
        ]),
        "classResources.csv": classResourcesCsv([
          classResourceRow({ classSourcedId: "bad space", resourceSourcedId: "" }),
        ]),
        "courseResources.csv": courseResourcesCsv([
          courseResourceRow({ courseSourcedId: "", resourceSourcedId: "bad space" }),
        ]),
        "userResources.csv": userResourcesCsv([
          userResourceRow({ userSourcedId: "", orgSourcedId: "bad space" }),
        ]),
      }),
    );

    expect(expectResourcesErr(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "row.missing_required_value", field: "vendorResourceId" }),
        expect.objectContaining({ code: "row.invalid_list", field: "roles" }),
        expect.objectContaining({ code: "row.invalid_enum", field: "importance" }),
        expect.objectContaining({ code: "row.invalid_enum", field: "roles" }),
        expect.objectContaining({ code: "row.invalid_guid", field: "classSourcedId" }),
        expect.objectContaining({
          code: "row.missing_required_value",
          field: "resourceSourcedId",
        }),
        expect.objectContaining({ code: "row.missing_required_value", field: "courseSourcedId" }),
        expect.objectContaining({ code: "row.invalid_guid", field: "resourceSourcedId" }),
        expect.objectContaining({ code: "row.missing_required_value", field: "userSourcedId" }),
        expect.objectContaining({ code: "row.invalid_guid", field: "orgSourcedId" }),
      ]),
    );
  });

  it("accumulates rostering and resources parse diagnostics", () => {
    const result = parseOneRosterCsvResourcesZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: resourcesAndRosteringModes("bulk") }),
        ...validBulkGraphFiles(),
        ...validBulkResourcesFiles(),
        "users.csv": usersCsv([userRow({ enabledUser: "not-boolean" })]),
        "resources.csv": resourcesCsv([resourceRow({ importance: "required" })]),
      }),
    );

    expect(expectResourcesErr(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "row.invalid_boolean",
          fileName: "users.csv",
          field: "enabledUser",
        }),
        expect.objectContaining({
          code: "row.invalid_enum",
          fileName: "resources.csv",
          field: "importance",
        }),
      ]),
    );
  });
});
