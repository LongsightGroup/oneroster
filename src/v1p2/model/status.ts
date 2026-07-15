import { ok, type Result } from "../../result.js";
import type { OneRosterV1p2PayloadDiagnostic } from "./json-value.js";
import {
  optionalOneRosterV1p2Property,
  parseOneRosterV1p2RecordAt,
  rejectUnknownOneRosterV1p2Properties,
  requireOneRosterV1p2Property,
} from "./entity.js";
import {
  parseOneRosterV1p2ArrayAt,
  parseOneRosterV1p2FixedTokenAt,
  parseOneRosterV1p2LifecycleStatusAt,
  parseOneRosterV1p2StringAt,
} from "./primitive.js";

import type { OneRosterV1p2LifecycleStatus } from "./primitive.js";
export type { OneRosterV1p2LifecycleStatus } from "./primitive.js";

/** The status major code vocabulary. */
export type OneRosterV1p2StatusCodeMajor = "success" | "processing" | "failure" | "unsupported";

/** The status severity vocabulary. */
export type OneRosterV1p2StatusSeverity = "status" | "warning" | "error";

/** Code-minor values used by the published v1.2 service bindings. */
export type OneRosterV1p2StatusCodeMinorValue =
  | "fullsuccess"
  | "invalid_filter_field"
  | "invalid_selection_field"
  | "invaliddata"
  | "unauthorisedrequest"
  | "forbidden"
  | "server_busy"
  | "unknownobject"
  | "internal_server_error"
  | "deletefailure"
  | "invalid_sort_field"
  | "unsupported";

/** One minor status field in an `imsx_CodeMinor` object. */
export interface OneRosterV1p2StatusCodeMinorField {
  readonly imsx_codeMinorFieldName: string;
  readonly imsx_codeMinorFieldValue: OneRosterV1p2StatusCodeMinorValue;
}

/** The `imsx_CodeMinor` status container. */
export interface OneRosterV1p2StatusCodeMinor {
  readonly imsx_codeMinorField: ReadonlyArray<OneRosterV1p2StatusCodeMinorField>;
}

/** A OneRoster `imsx_StatusInfo` value. */
export interface OneRosterV1p2StatusInfo {
  readonly imsx_codeMajor: OneRosterV1p2StatusCodeMajor;
  readonly imsx_severity: OneRosterV1p2StatusSeverity;
  readonly imsx_description?: string;
  readonly imsx_CodeMinor?: OneRosterV1p2StatusCodeMinor;
}

type Diagnostics = ReadonlyArray<OneRosterV1p2PayloadDiagnostic>;

/** Parse the entity lifecycle status. */
export function parseOneRosterV1p2LifecycleStatus(
  input: unknown,
  path = "$",
): Result<OneRosterV1p2LifecycleStatus, Diagnostics> {
  return parseOneRosterV1p2LifecycleStatusAt(input, path);
}

function parseCodeMinorFieldAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2StatusCodeMinorField, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") {
    return record;
  }
  const unknown = rejectUnknownOneRosterV1p2Properties(
    record.value,
    new Set(["imsx_codeMinorFieldName", "imsx_codeMinorFieldValue"]),
    path,
  );
  if (unknown._tag === "err") {
    return unknown;
  }
  const name = requireOneRosterV1p2Property(
    record.value,
    "imsx_codeMinorFieldName",
    path,
    (value, nestedPath) => parseOneRosterV1p2StringAt(value, nestedPath),
  );
  if (name._tag === "err") {
    return name;
  }
  const value = requireOneRosterV1p2Property(
    record.value,
    "imsx_codeMinorFieldValue",
    path,
    (raw, nestedPath) =>
      parseOneRosterV1p2FixedTokenAt(raw, nestedPath, [
        "fullsuccess",
        "invalid_filter_field",
        "invalid_selection_field",
        "invaliddata",
        "unauthorisedrequest",
        "forbidden",
        "server_busy",
        "unknownobject",
        "internal_server_error",
        "deletefailure",
        "invalid_sort_field",
        "unsupported",
      ] as const),
  );
  if (value._tag === "err") {
    return value;
  }
  return ok({ imsx_codeMinorFieldName: name.value, imsx_codeMinorFieldValue: value.value });
}

function parseCodeMinorAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2StatusCodeMinor, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") {
    return record;
  }
  const unknown = rejectUnknownOneRosterV1p2Properties(
    record.value,
    new Set(["imsx_codeMinorField"]),
    path,
  );
  if (unknown._tag === "err") {
    return unknown;
  }
  const fields = requireOneRosterV1p2Property(
    record.value,
    "imsx_codeMinorField",
    path,
    (raw, nestedPath) => parseOneRosterV1p2ArrayAt(raw, nestedPath, parseCodeMinorFieldAt, 1),
  );
  if (fields._tag === "err") {
    return fields;
  }
  return ok({ imsx_codeMinorField: fields.value });
}

/** Parse an `imsx_StatusInfo` payload from an unknown JSON value. */
export function parseOneRosterV1p2StatusInfo(
  input: unknown,
): Result<OneRosterV1p2StatusInfo, Diagnostics> {
  const path = "$.imsx_StatusInfo";
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") {
    return record;
  }
  const unknown = rejectUnknownOneRosterV1p2Properties(
    record.value,
    new Set(["imsx_codeMajor", "imsx_severity", "imsx_description", "imsx_CodeMinor"]),
    path,
  );
  if (unknown._tag === "err") {
    return unknown;
  }
  const major = requireOneRosterV1p2Property(
    record.value,
    "imsx_codeMajor",
    path,
    (raw, nestedPath) =>
      parseOneRosterV1p2FixedTokenAt(raw, nestedPath, [
        "success",
        "processing",
        "failure",
        "unsupported",
      ] as const),
  );
  if (major._tag === "err") {
    return major;
  }
  const severity = requireOneRosterV1p2Property(
    record.value,
    "imsx_severity",
    path,
    (raw, nestedPath) =>
      parseOneRosterV1p2FixedTokenAt(raw, nestedPath, ["status", "warning", "error"] as const),
  );
  if (severity._tag === "err") {
    return severity;
  }
  const description = optionalOneRosterV1p2Property(
    record.value,
    "imsx_description",
    path,
    (raw, nestedPath) => parseOneRosterV1p2StringAt(raw, nestedPath),
  );
  if (description._tag === "err") {
    return description;
  }
  const minor = optionalOneRosterV1p2Property(
    record.value,
    "imsx_CodeMinor",
    path,
    (raw, nestedPath) => parseCodeMinorAt(raw, nestedPath),
  );
  if (minor._tag === "err") {
    return minor;
  }
  return ok({
    imsx_codeMajor: major.value,
    imsx_severity: severity.value,
    ...(description.value === undefined ? {} : { imsx_description: description.value }),
    ...(minor.value === undefined ? {} : { imsx_CodeMinor: minor.value }),
  });
}
