import { manifestCsv, zipPackage } from "./one-roster-csv-package-fixtures.js";
import type { OneRosterCsvConformanceNegativeScenario } from "./conformance-scenarios-valid.js";
import {
  duplicateSourcedIdZip,
  fieldFailureZip,
  forbiddenBulkLifecycleZip,
  invalidDeltaLifecycleZip,
  missingDeltaLifecycleZip,
  missingTargetFileZip,
  missingTargetRecordZip,
  schemaFailureZip,
  semanticFailureZip,
} from "./conformance-zip-builders.js";

export const negativeConformanceScenarios: readonly OneRosterCsvConformanceNegativeScenario[] = [
  {
    name: "missing manifest",
    operation: "parsePackage",
    bytes: () => zipPackage({}),
    expectedCodes: ["package.missing_manifest"],
  },
  {
    name: "invalid manifest header",
    operation: "parsePackage",
    bytes: () =>
      zipPackage({
        "manifest.csv": manifestCsv({ header: "PropertyName,value" }),
      }),
    expectedCodes: ["manifest.invalid_header"],
  },
  {
    name: "unknown ZIP entry",
    operation: "parsePackage",
    bytes: () =>
      zipPackage({
        "manifest.csv": manifestCsv(),
        "extra.csv": "sourcedId\nx1",
      }),
    expectedCodes: ["package.unknown_file"],
  },
  {
    name: "manifest marks supplied file missing",
    operation: "parsePackage",
    bytes: () =>
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["users.csv", "bulk"]]) }),
      }),
    expectedCodes: ["manifest.file_missing"],
  },
  {
    name: "manifest marks present file absent",
    operation: "parsePackage",
    bytes: () =>
      zipPackage({
        "manifest.csv": manifestCsv(),
        "users.csv": "sourcedId\nuser-1",
      }),
    expectedCodes: ["manifest.file_unexpected"],
  },
  {
    name: "CSV quote failure",
    operation: "parsePackage",
    bytes: () =>
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["users.csv", "bulk"]]) }),
        "users.csv": 'sourcedId,username\nuser-1,bad"quote',
      }),
    expectedCodes: ["csv.unescaped_quote"],
  },
  {
    name: "schema header and metadata failures",
    operation: "parseFull",
    bytes: schemaFailureZip,
    expectedCodes: [
      "schema.header_order_mismatch",
      "schema.metadata_column_position",
      "schema.invalid_metadata_header",
    ],
  },
  {
    name: "field parser failures",
    operation: "parseFull",
    bytes: fieldFailureZip,
    expectedCodes: [
      "row.invalid_year",
      "row.invalid_guid",
      "row.missing_required_value",
      "row.invalid_integer",
      "row.invalid_date",
      "row.invalid_float",
      "row.invalid_enum",
      "row.invalid_boolean",
      "row.invalid_list",
    ],
  },
  {
    name: "delta lifecycle datetime failure",
    operation: "parseFull",
    bytes: invalidDeltaLifecycleZip,
    expectedCodes: ["row.invalid_datetime"],
  },
  {
    name: "bulk lifecycle status failure",
    operation: "parseFull",
    bytes: forbiddenBulkLifecycleZip,
    expectedCodes: ["row.field_forbidden_in_bulk"],
  },
  {
    name: "delta lifecycle required failure",
    operation: "parseFull",
    bytes: missingDeltaLifecycleZip,
    expectedCodes: ["row.field_required_in_delta"],
  },
  {
    name: "duplicate sourcedId failure",
    operation: "validateFull",
    bytes: duplicateSourcedIdZip,
    expectedCodes: ["reference.duplicate_sourced_id"],
  },
  {
    name: "missing target file failure",
    operation: "validateFull",
    bytes: missingTargetFileZip,
    expectedCodes: ["reference.missing_target_file"],
  },
  {
    name: "missing target record failure",
    operation: "validateFull",
    bytes: missingTargetRecordZip,
    expectedCodes: ["reference.missing_target_record"],
  },
  {
    name: "semantic validation failure",
    operation: "validateFull",
    bytes: semanticFailureZip,
    expectedCodes: [
      "semantic.invalid_score_range",
      "semantic.invalid_score_scale_mapping",
      "semantic.invalid_case_learning_objective_id",
    ],
  },
];
