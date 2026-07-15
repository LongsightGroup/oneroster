import { ok, type Result } from "../../result.js";
import type { OneRosterV1p2PayloadDiagnostic } from "./json-value.js";
import {
  optionalOneRosterV1p2Property,
  parseOneRosterV1p2EntityBaseRecordAt,
  parseOneRosterV1p2RecordAt,
  rejectUnknownOneRosterV1p2Properties,
  requireOneRosterV1p2Property,
} from "./entity.js";
import type { OneRosterV1p2EntityBase } from "./entity.js";
import {
  parseOneRosterV1p2ArrayAt,
  parseOneRosterV1p2FixedTokenAt,
  parseOneRosterV1p2KnownOrExtensionTokenAt,
  parseOneRosterV1p2StringAt,
  type OneRosterV1p2ExtensionToken,
} from "./primitive.js";

type Diagnostics = ReadonlyArray<OneRosterV1p2PayloadDiagnostic>;
type RootParser<TValue> = (input: unknown) => Result<TValue, Diagnostics>;

/** A role vocabulary token on a Resources service resource. */
export type OneRosterV1p2ResourceRole =
  | "administrator"
  | "aide"
  | "guardian"
  | "parent"
  | "proctor"
  | "relative"
  | "student"
  | "teacher"
  | OneRosterV1p2ExtensionToken;

/** The resource importance vocabulary. */
export type OneRosterV1p2ResourceImportance = "primary" | "secondary";

/** A Resources service resource entity. */
export interface OneRosterV1p2Resource extends OneRosterV1p2EntityBase {
  readonly vendorResourceId: string;
  readonly title?: string;
  readonly roles?: ReadonlyArray<OneRosterV1p2ResourceRole>;
  readonly importance?: OneRosterV1p2ResourceImportance;
  readonly vendorId?: string;
  readonly applicationId?: string;
}

function parseResourceAt(input: unknown, path: string): Result<OneRosterV1p2Resource, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const unknown = rejectUnknownOneRosterV1p2Properties(
    record.value,
    new Set([
      "sourcedId",
      "status",
      "dateLastModified",
      "metadata",
      "title",
      "roles",
      "importance",
      "vendorResourceId",
      "vendorId",
      "applicationId",
    ]),
    path,
  );
  if (unknown._tag === "err") return unknown;
  const base = parseOneRosterV1p2EntityBaseRecordAt(record.value, path);
  if (base._tag === "err") return base;
  const vendorResourceId = requireOneRosterV1p2Property(
    record.value,
    "vendorResourceId",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (vendorResourceId._tag === "err") return vendorResourceId;
  const title = optionalOneRosterV1p2Property(
    record.value,
    "title",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (title._tag === "err") return title;
  const roles = optionalOneRosterV1p2Property(record.value, "roles", path, (value, nestedPath) =>
    parseOneRosterV1p2ArrayAt(value, nestedPath, (role, rolePath) =>
      parseOneRosterV1p2KnownOrExtensionTokenAt(role, rolePath, [
        "administrator",
        "aide",
        "guardian",
        "parent",
        "proctor",
        "relative",
        "student",
        "teacher",
      ] as const),
    ),
  );
  if (roles._tag === "err") return roles;
  const importance = optionalOneRosterV1p2Property(
    record.value,
    "importance",
    path,
    (value, nestedPath) =>
      parseOneRosterV1p2FixedTokenAt(value, nestedPath, ["primary", "secondary"] as const),
  );
  if (importance._tag === "err") return importance;
  const vendorId = optionalOneRosterV1p2Property(
    record.value,
    "vendorId",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (vendorId._tag === "err") return vendorId;
  const applicationId = optionalOneRosterV1p2Property(
    record.value,
    "applicationId",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (applicationId._tag === "err") return applicationId;
  return ok({
    ...base.value,
    vendorResourceId: vendorResourceId.value,
    ...(title.value === undefined ? {} : { title: title.value }),
    ...(roles.value === undefined ? {} : { roles: roles.value }),
    ...(importance.value === undefined ? {} : { importance: importance.value }),
    ...(vendorId.value === undefined ? {} : { vendorId: vendorId.value }),
    ...(applicationId.value === undefined ? {} : { applicationId: applicationId.value }),
  });
}

function parser<TValue>(
  parseAt: (input: unknown, path: string) => Result<TValue, Diagnostics>,
): (input: unknown) => Result<TValue, Diagnostics> {
  return (input) => parseAt(input, "$");
}

/** Parse a resource entity. */
export const parseOneRosterV1p2Resource: RootParser<OneRosterV1p2Resource> =
  parser(parseResourceAt);
