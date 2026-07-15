import { ok, type Result } from "../../result.js";
import type { OneRosterV1p2PayloadDiagnostic, OneRosterV1p2PayloadParser } from "./json-value.js";
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
  parseOneRosterV1p2KnownOrExtensionTokenAt,
  parseOneRosterV1p2StringAt,
  type OneRosterV1p2ExtensionToken,
} from "./primitive.js";
import { parseOneRosterV1p2ReferenceAt, type OneRosterV1p2Reference } from "./reference.js";
import type { OneRosterV1p2OrgReference } from "./references.js";
type Diagnostics = ReadonlyArray<OneRosterV1p2PayloadDiagnostic>;
type RootParser<TValue> = (input: unknown) => Result<TValue, Diagnostics>;

const ref =
  <TType extends Parameters<typeof parseOneRosterV1p2ReferenceAt>[1]>(
    type: TType,
  ): OneRosterV1p2PayloadParser<OneRosterV1p2Reference<TType>> =>
  (input, path) =>
    parseOneRosterV1p2ReferenceAt(input, type, path);

/** An organization or school entity. */
export interface OneRosterV1p2Org extends OneRosterV1p2EntityBase {
  readonly name: string;
  readonly type: OneRosterV1p2OrgType;
  readonly identifier: string;
  readonly parent?: OneRosterV1p2OrgReference;
  readonly children?: ReadonlyArray<OneRosterV1p2OrgReference>;
}

/** An extensible organization type. */
export type OneRosterV1p2OrgType =
  | "department"
  | "district"
  | "local"
  | "national"
  | "school"
  | "state"
  | OneRosterV1p2ExtensionToken;
function parseOrgAt(input: unknown, path: string): Result<OneRosterV1p2Org, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const unknown = rejectUnknownOneRosterV1p2Properties(
    record.value,
    new Set([
      "sourcedId",
      "status",
      "dateLastModified",
      "metadata",
      "name",
      "type",
      "identifier",
      "parent",
      "children",
    ]),
    path,
  );
  if (unknown._tag === "err") return unknown;
  const base = parseOneRosterV1p2EntityBaseRecordAt(record.value, path);
  if (base._tag === "err") return base;
  const name = requireOneRosterV1p2Property(record.value, "name", path, parseOneRosterV1p2StringAt);
  if (name._tag === "err") return name;
  const type = requireOneRosterV1p2Property(record.value, "type", path, (value, nestedPath) =>
    parseOneRosterV1p2KnownOrExtensionTokenAt(value, nestedPath, [
      "department",
      "district",
      "local",
      "national",
      "school",
      "state",
    ] as const),
  );
  if (type._tag === "err") return type;
  const identifier = requireOneRosterV1p2Property(
    record.value,
    "identifier",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (identifier._tag === "err") return identifier;
  const parent = optionalOneRosterV1p2Property(record.value, "parent", path, ref("org"));
  if (parent._tag === "err") return parent;
  const children = optionalOneRosterV1p2Property(
    record.value,
    "children",
    path,
    (value, nestedPath) => parseOneRosterV1p2ArrayAt(value, nestedPath, ref("org")),
  );
  if (children._tag === "err") return children;
  return ok({
    ...base.value,
    name: name.value,
    type: type.value,
    identifier: identifier.value,
    ...(parent.value === undefined ? {} : { parent: parent.value }),
    ...(children.value === undefined ? {} : { children: children.value }),
  });
}

function parser<TValue>(
  parseAt: (input: unknown, path: string) => Result<TValue, Diagnostics>,
): (input: unknown) => Result<TValue, Diagnostics> {
  return (input) => parseAt(input, "$");
}

/** Parse a organization entity. */
export const parseOneRosterV1p2Org: RootParser<OneRosterV1p2Org> = parser(parseOrgAt);
