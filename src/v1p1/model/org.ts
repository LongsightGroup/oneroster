import { ok, type Result } from "../../result.js";
import type { OneRosterV1p1EntityBase } from "./entity.js";
import type { OneRosterV1p1Reference } from "./references.js";
import type { Diagnostics } from "./rostering-parsing.js";
import {
  optionalReference,
  optionalReferenceArray,
  optionalString,
  parseEntityContext,
  requiredString,
  requiredToken,
} from "./rostering-parsing.js";
import type { OneRosterV1p1ExtensionToken } from "./primitive.js";

/** An organization or school. */
export interface OneRosterV1p1Org extends OneRosterV1p1EntityBase {
  readonly name: string;
  readonly type: OneRosterV1p1OrgType;
  readonly identifier?: string;
  readonly parent?: OneRosterV1p1Reference<"org">;
  readonly children?: ReadonlyArray<OneRosterV1p1Reference<"org">>;
}

/** Organization types defined by OneRoster 1.1. */
export type OneRosterV1p1OrgType =
  | "department"
  | "district"
  | "local"
  | "national"
  | "school"
  | "state"
  | OneRosterV1p1ExtensionToken;

/** Parse an organization. */
export function parseOneRosterV1p1Org(
  input: unknown,
  path = "$",
): Result<OneRosterV1p1Org, Diagnostics> {
  const context = parseEntityContext(input, path);
  if (context._tag === "err") return context;
  const name = requiredString(context.value.record, "name", path);
  if (name._tag === "err") return name;
  const type = requiredToken<OneRosterV1p1OrgType>(
    context.value.record,
    "type",
    ["department", "district", "local", "national", "school", "state"],
    path,
  );
  if (type._tag === "err") return type;
  const identifier = optionalString(context.value.record, "identifier", path);
  if (identifier._tag === "err") return identifier;
  const parent = optionalReference(context.value.record, "parent", "org", path);
  if (parent._tag === "err") return parent;
  const children = optionalReferenceArray(context.value.record, "children", "org", path);
  if (children._tag === "err") return children;
  return ok({
    ...context.value.base,
    name: name.value,
    type: type.value,
    ...(identifier.value === undefined ? {} : { identifier: identifier.value }),
    ...(parent.value === undefined ? {} : { parent: parent.value }),
    ...(children.value === undefined ? {} : { children: children.value }),
  });
}
