import { ok, type Result } from "../../result.js";
import type { OneRosterV1p2PayloadDiagnostic, OneRosterV1p2PayloadParser } from "./json-value.js";
import {
  optionalOneRosterV1p2Property,
  parseOneRosterV1p2EntityBaseRecordAt,
  parseOneRosterV1p2RecordAt,
  rejectUnknownOneRosterV1p2Properties,
  requireOneRosterV1p2Property,
} from "./entity.js";
import {
  parseOneRosterV1p2BooleanTokenAt,
  parseOneRosterV1p2DateAt,
  parseOneRosterV1p2KnownOrExtensionTokenAt,
  type OneRosterV1p2Date,
  type OneRosterV1p2ExtensionToken,
} from "./primitive.js";
import type { OneRosterV1p2EntityBase } from "./entity.js";
import { parseOneRosterV1p2ReferenceAt, type OneRosterV1p2Reference } from "./reference.js";
import type {
  OneRosterV1p2ClassReference,
  OneRosterV1p2OrgReference,
  OneRosterV1p2UserReference,
} from "./references.js";
type Diagnostics = ReadonlyArray<OneRosterV1p2PayloadDiagnostic>;
type RootParser<TValue> = (input: unknown) => Result<TValue, Diagnostics>;

/** An extensible enrollment role in the v1.2 Rostering service. */
export type OneRosterV1p2EnrollmentRole =
  | "administrator"
  | "proctor"
  | "student"
  | "teacher"
  | OneRosterV1p2ExtensionToken;
/** An enrollment entity. */
export interface OneRosterV1p2Enrollment extends OneRosterV1p2EntityBase {
  readonly user: OneRosterV1p2UserReference;
  readonly class: OneRosterV1p2ClassReference;
  readonly school: OneRosterV1p2OrgReference;
  readonly role: OneRosterV1p2EnrollmentRole;
  readonly primary: "true" | "false";
  readonly beginDate?: OneRosterV1p2Date;
  readonly endDate?: OneRosterV1p2Date;
}
const ref =
  <TType extends Parameters<typeof parseOneRosterV1p2ReferenceAt>[1]>(
    type: TType,
  ): OneRosterV1p2PayloadParser<OneRosterV1p2Reference<TType>> =>
  (input, path) =>
    parseOneRosterV1p2ReferenceAt(input, type, path);

function parseEnrollmentAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2Enrollment, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const unknown = rejectUnknownOneRosterV1p2Properties(
    record.value,
    new Set([
      "sourcedId",
      "status",
      "dateLastModified",
      "metadata",
      "user",
      "class",
      "school",
      "role",
      "primary",
      "beginDate",
      "endDate",
    ]),
    path,
  );
  if (unknown._tag === "err") return unknown;
  const base = parseOneRosterV1p2EntityBaseRecordAt(record.value, path);
  if (base._tag === "err") return base;
  const user = requireOneRosterV1p2Property(record.value, "user", path, ref("user"));
  if (user._tag === "err") return user;
  const classRef = requireOneRosterV1p2Property(record.value, "class", path, ref("class"));
  if (classRef._tag === "err") return classRef;
  const school = requireOneRosterV1p2Property(record.value, "school", path, ref("org"));
  if (school._tag === "err") return school;
  const role = requireOneRosterV1p2Property(record.value, "role", path, (value, nestedPath) =>
    parseOneRosterV1p2KnownOrExtensionTokenAt(value, nestedPath, [
      "administrator",
      "proctor",
      "student",
      "teacher",
    ] as const),
  );
  if (role._tag === "err") return role;
  const primary = requireOneRosterV1p2Property(
    record.value,
    "primary",
    path,
    parseOneRosterV1p2BooleanTokenAt,
  );
  if (primary._tag === "err") return primary;
  const beginDate = optionalOneRosterV1p2Property(
    record.value,
    "beginDate",
    path,
    parseOneRosterV1p2DateAt,
  );
  if (beginDate._tag === "err") return beginDate;
  const endDate = optionalOneRosterV1p2Property(
    record.value,
    "endDate",
    path,
    parseOneRosterV1p2DateAt,
  );
  if (endDate._tag === "err") return endDate;
  return ok({
    ...base.value,
    user: user.value,
    class: classRef.value,
    school: school.value,
    role: role.value,
    primary: primary.value,
    ...(beginDate.value === undefined ? {} : { beginDate: beginDate.value }),
    ...(endDate.value === undefined ? {} : { endDate: endDate.value }),
  });
}

function parser<TValue>(
  parseAt: (input: unknown, path: string) => Result<TValue, Diagnostics>,
): (input: unknown) => Result<TValue, Diagnostics> {
  return (input) => parseAt(input, "$");
}

/** Parse a enrollment entity. */
export const parseOneRosterV1p2Enrollment: RootParser<OneRosterV1p2Enrollment> =
  parser(parseEnrollmentAt);
