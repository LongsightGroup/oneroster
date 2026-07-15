import { ok, type Result } from "../../result.js";
import type { OneRosterV1p1EntityBase } from "./entity.js";
import type { Diagnostics } from "./rostering-parsing.js";
import {
  optionalString,
  optionalStringArray,
  parseEntityContext,
  requiredString,
} from "./rostering-parsing.js";

/** A resource associated with a Course or Class. */
export interface OneRosterV1p1Resource extends OneRosterV1p1EntityBase {
  readonly title?: string;
  readonly roles?: ReadonlyArray<string>;
  readonly importance?: string;
  readonly vendorResourceId: string;
  readonly vendorId?: string;
  readonly applicationId?: string;
}

/** Parse a Resource. */
export function parseOneRosterV1p1Resource(
  input: unknown,
  path = "$",
): Result<OneRosterV1p1Resource, Diagnostics> {
  const context = parseEntityContext(input, path);
  if (context._tag === "err") return context;
  const vendorResourceId = requiredString(context.value.record, "vendorResourceId", path);
  if (vendorResourceId._tag === "err") return vendorResourceId;
  const title = optionalString(context.value.record, "title", path);
  if (title._tag === "err") return title;
  const roles = optionalStringArray(context.value.record, "roles", path);
  if (roles._tag === "err") return roles;
  const importance = optionalString(context.value.record, "importance", path);
  if (importance._tag === "err") return importance;
  const vendorId = optionalString(context.value.record, "vendorId", path);
  if (vendorId._tag === "err") return vendorId;
  const applicationId = optionalString(context.value.record, "applicationId", path);
  if (applicationId._tag === "err") return applicationId;
  return ok({
    ...context.value.base,
    vendorResourceId: vendorResourceId.value,
    ...(title.value === undefined ? {} : { title: title.value }),
    ...(roles.value === undefined ? {} : { roles: roles.value }),
    ...(importance.value === undefined ? {} : { importance: importance.value }),
    ...(vendorId.value === undefined ? {} : { vendorId: vendorId.value }),
    ...(applicationId.value === undefined ? {} : { applicationId: applicationId.value }),
  });
}
