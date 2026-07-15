import { ok, type Result } from "../../result.js";
import {
  optionalOneRosterV1p1Property,
  parseOneRosterV1p1RecordAt,
  parseOneRosterV1p1EntityBaseRecordAt,
  requireOneRosterV1p1Property,
  type OneRosterV1p1EntityBase,
  type OneRosterV1p1Record,
} from "./entity.js";
import {
  parseOneRosterV1p1BooleanAt,
  parseOneRosterV1p1DateAt,
  parseOneRosterV1p1StringArrayAt,
  parseOneRosterV1p1StringAt,
  parseOneRosterV1p1TokenAt,
  type OneRosterV1p1Date,
  type OneRosterV1p1PayloadDiagnostic,
  type OneRosterV1p1PayloadParser,
} from "./primitive.js";
import type { OneRosterV1p1Reference } from "./references.js";
import type { OneRosterV1p1RoleType, OneRosterV1p1UserId, OneRosterV1p1UserRole } from "./user.js";

export type Diagnostics = ReadonlyArray<OneRosterV1p1PayloadDiagnostic>;

export function referenceParser<TType extends string>(
  type: TType,
): OneRosterV1p1PayloadParser<OneRosterV1p1Reference<TType>> {
  return (input, path) => parseReferenceAt(input, type, path);
}

function parseReferenceAt<TType extends string>(
  input: unknown,
  type: TType,
  path: string,
): Result<OneRosterV1p1Reference<TType>, Diagnostics> {
  const record = parseOneRosterV1p1RecordAt(input, path);
  if (record._tag === "err") return record;
  const href = requireOneRosterV1p1Property(record.value, "href", path, parseOneRosterV1p1StringAt);
  if (href._tag === "err") return href;
  const sourcedId = requireOneRosterV1p1Property(
    record.value,
    "sourcedId",
    path,
    parseOneRosterV1p1StringAt,
  );
  if (sourcedId._tag === "err") return sourcedId;
  const actualType = requireOneRosterV1p1Property(
    record.value,
    "type",
    path,
    parseOneRosterV1p1StringAt,
  );
  if (actualType._tag === "err") return actualType;
  return actualType.value === type
    ? ok({ href: href.value, sourcedId: sourcedId.value, type })
    : invalid(path, "The reference type does not match the expected entity.");
}

export function parseEntityContext(
  input: unknown,
  path: string,
): Result<
  { readonly record: OneRosterV1p1Record; readonly base: OneRosterV1p1EntityBase },
  Diagnostics
> {
  const record = parseOneRosterV1p1RecordAt(input, path);
  if (record._tag === "err") return record;
  const base = parseOneRosterV1p1EntityBaseRecordAt(record.value, path);
  if (base._tag === "err") return base;
  return ok({ record: record.value, base: base.value });
}

export function requiredString(
  record: OneRosterV1p1Record,
  property: string,
  path: string,
): Result<string, Diagnostics> {
  return requireOneRosterV1p1Property(record, property, path, parseOneRosterV1p1StringAt);
}

export function optionalString(
  record: OneRosterV1p1Record,
  property: string,
  path: string,
): Result<string | undefined, Diagnostics> {
  return optionalOneRosterV1p1Property(record, property, path, parseOneRosterV1p1StringAt);
}

export function requiredDate(
  record: OneRosterV1p1Record,
  property: string,
  path: string,
): Result<OneRosterV1p1Date, Diagnostics> {
  return requireOneRosterV1p1Property(record, property, path, (value, nestedPath) =>
    parseOneRosterV1p1DateAt(value, nestedPath),
  );
}

export function optionalDate(
  record: OneRosterV1p1Record,
  property: string,
  path: string,
): Result<OneRosterV1p1Date | undefined, Diagnostics> {
  return optionalOneRosterV1p1Property(record, property, path, (value, nestedPath) =>
    parseOneRosterV1p1DateAt(value, nestedPath),
  );
}

export function optionalBoolean(
  record: OneRosterV1p1Record,
  property: string,
  path: string,
): Result<"true" | "false" | undefined, Diagnostics> {
  return optionalOneRosterV1p1Property(record, property, path, (value, nestedPath) =>
    parseOneRosterV1p1BooleanAt(value, nestedPath),
  );
}

export function optionalStringArray(
  record: OneRosterV1p1Record,
  property: string,
  path: string,
): Result<ReadonlyArray<string> | undefined, Diagnostics> {
  return optionalOneRosterV1p1Property(record, property, path, (value, nestedPath) =>
    parseOneRosterV1p1StringArrayAt(value, nestedPath),
  );
}

export function requiredReference<TType extends string>(
  record: OneRosterV1p1Record,
  property: string,
  type: TType,
  path: string,
): Result<OneRosterV1p1Reference<TType>, Diagnostics> {
  return requireOneRosterV1p1Property(record, property, path, referenceParser(type));
}

export function optionalReference<TType extends string>(
  record: OneRosterV1p1Record,
  property: string,
  type: TType,
  path: string,
): Result<OneRosterV1p1Reference<TType> | undefined, Diagnostics> {
  return optionalOneRosterV1p1Property(record, property, path, referenceParser(type));
}

export function requiredReferenceArray<TType extends string>(
  record: OneRosterV1p1Record,
  property: string,
  type: TType,
  path: string,
): Result<ReadonlyArray<OneRosterV1p1Reference<TType>>, Diagnostics> {
  const value = requireOneRosterV1p1Property(record, property, path, (input, nestedPath) =>
    parseReferenceArrayAt(input, type, nestedPath),
  );
  return value;
}

export function optionalReferenceArray<TType extends string>(
  record: OneRosterV1p1Record,
  property: string,
  type: TType,
  path: string,
): Result<ReadonlyArray<OneRosterV1p1Reference<TType>> | undefined, Diagnostics> {
  return optionalOneRosterV1p1Property(record, property, path, (input, nestedPath) =>
    parseReferenceArrayAt(input, type, nestedPath),
  );
}

function parseReferenceArrayAt<TType extends string>(
  input: unknown,
  type: TType,
  path: string,
): Result<ReadonlyArray<OneRosterV1p1Reference<TType>>, Diagnostics> {
  if (!Array.isArray(input)) return invalid(path, "Expected a reference array.");
  const values: Array<OneRosterV1p1Reference<TType>> = [];
  for (const [index, value] of input.entries()) {
    const parsed = parseReferenceAt(value, type, `${path}[${index}]`);
    if (parsed._tag === "err") return parsed;
    values.push(parsed.value);
  }
  return ok(values);
}

export function requiredToken<TToken extends string>(
  record: OneRosterV1p1Record,
  property: string,
  tokens: ReadonlyArray<TToken>,
  path: string,
): Result<TToken, Diagnostics> {
  return requireOneRosterV1p1Property(record, property, path, (value, nestedPath) =>
    parseOneRosterV1p1TokenAt(value, nestedPath, tokens),
  );
}

export function optionalToken<TToken extends string>(
  record: OneRosterV1p1Record,
  property: string,
  tokens: ReadonlyArray<TToken>,
  path: string,
): Result<TToken | undefined, Diagnostics> {
  return optionalOneRosterV1p1Property(record, property, path, (value, nestedPath) =>
    parseOneRosterV1p1TokenAt(value, nestedPath, tokens),
  );
}

export function parseUserRole(
  record: OneRosterV1p1Record,
  path: string,
): Result<OneRosterV1p1UserRole, Diagnostics> {
  const role = requiredToken<OneRosterV1p1RoleType>(
    record,
    "role",
    ["aide", "administrator", "guardian", "parent", "proctor", "relative", "student", "teacher"],
    path,
  );
  if (role._tag === "err") return role;
  const orgs = requiredReferenceArray(record, "orgs", "org", path);
  if (orgs._tag === "err") return orgs;
  return ok({ role: role.value, orgs: orgs.value });
}

export function optionalUserIds(
  record: OneRosterV1p1Record,
  path: string,
): Result<ReadonlyArray<OneRosterV1p1UserId> | undefined, Diagnostics> {
  return optionalOneRosterV1p1Property(record, "userIds", path, parseUserIdsAt);
}

function parseUserIdsAt(
  input: unknown,
  path: string,
): Result<ReadonlyArray<OneRosterV1p1UserId>, Diagnostics> {
  if (!Array.isArray(input)) return invalid(path, "Expected a userIds array.");
  const values: Array<OneRosterV1p1UserId> = [];
  for (const [index, item] of input.entries()) {
    const record = parseOneRosterV1p1RecordAt(item, `${path}[${index}]`);
    if (record._tag === "err") return record;
    const type = requiredString(record.value, "type", `${path}[${index}]`);
    if (type._tag === "err") return type;
    const identifier = requiredString(record.value, "identifier", `${path}[${index}]`);
    if (identifier._tag === "err") return identifier;
    values.push({ type: type.value, identifier: identifier.value });
  }
  return ok(values);
}

function invalid<TValue = never>(path: string, message: string): Result<TValue, Diagnostics> {
  return {
    _tag: "err",
    error: [
      { _tag: "OneRosterV1p1PayloadDiagnostic", code: "payload.invalid_value", path, message },
    ],
  };
}
