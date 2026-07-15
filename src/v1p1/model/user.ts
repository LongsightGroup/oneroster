import { ok, type Result } from "../../result.js";
import type { OneRosterV1p1EntityBase } from "./entity.js";
import type { OneRosterV1p1Reference } from "./references.js";
import type { Diagnostics } from "./rostering-parsing.js";
import {
  optionalReferenceArray,
  optionalString,
  optionalStringArray,
  optionalUserIds,
  parseEntityContext,
  parseUserRole,
  requiredString,
} from "./rostering-parsing.js";
import { requireOneRosterV1p1Property } from "./entity.js";
import { parseOneRosterV1p1BooleanAt, type OneRosterV1p1ExtensionToken } from "./primitive.js";

/** User roles defined by OneRoster 1.1. */
export type OneRosterV1p1RoleType =
  | "aide"
  | "administrator"
  | "guardian"
  | "parent"
  | "proctor"
  | "relative"
  | "student"
  | "teacher"
  | OneRosterV1p1ExtensionToken;

/** A user identifier from an external identity system. */
export interface OneRosterV1p1UserId {
  readonly type: string;
  readonly identifier: string;
}

/** A role and organization assignment on a v1.1 User. */
export interface OneRosterV1p1UserRole {
  readonly role: OneRosterV1p1RoleType;
  readonly orgs: ReadonlyArray<OneRosterV1p1Reference<"org">>;
}

/** A User, including v1.1's singular role and plural orgs fields. */
export interface OneRosterV1p1User extends OneRosterV1p1EntityBase {
  readonly username: string;
  readonly userIds?: ReadonlyArray<OneRosterV1p1UserId>;
  readonly enabledUser: "true" | "false";
  readonly givenName: string;
  readonly familyName: string;
  readonly middleName?: string;
  readonly role: OneRosterV1p1UserRole;
  readonly identifier?: string;
  readonly email?: string;
  readonly sms?: string;
  readonly phone?: string;
  readonly agents?: ReadonlyArray<OneRosterV1p1Reference<"user">>;
  readonly grades?: ReadonlyArray<string>;
  readonly password?: string;
}

/** Parse a User. */
export function parseOneRosterV1p1User(
  input: unknown,
  path = "$",
): Result<OneRosterV1p1User, Diagnostics> {
  const context = parseEntityContext(input, path);
  if (context._tag === "err") return context;
  const username = requiredString(context.value.record, "username", path);
  if (username._tag === "err") return username;
  const enabledUser = requireOneRosterV1p1Property(
    context.value.record,
    "enabledUser",
    path,
    (value, nestedPath) => parseOneRosterV1p1BooleanAt(value, nestedPath),
  );
  if (enabledUser._tag === "err") return enabledUser;
  const givenName = requiredString(context.value.record, "givenName", path);
  if (givenName._tag === "err") return givenName;
  const familyName = requiredString(context.value.record, "familyName", path);
  if (familyName._tag === "err") return familyName;
  const role = parseUserRole(context.value.record, path);
  if (role._tag === "err") return role;
  const userIds = optionalUserIds(context.value.record, path);
  if (userIds._tag === "err") return userIds;
  const middleName = optionalString(context.value.record, "middleName", path);
  if (middleName._tag === "err") return middleName;
  const identifier = optionalString(context.value.record, "identifier", path);
  if (identifier._tag === "err") return identifier;
  const email = optionalString(context.value.record, "email", path);
  if (email._tag === "err") return email;
  const sms = optionalString(context.value.record, "sms", path);
  if (sms._tag === "err") return sms;
  const phone = optionalString(context.value.record, "phone", path);
  if (phone._tag === "err") return phone;
  const agents = optionalReferenceArray(context.value.record, "agents", "user", path);
  if (agents._tag === "err") return agents;
  const grades = optionalStringArray(context.value.record, "grades", path);
  if (grades._tag === "err") return grades;
  const password = optionalString(context.value.record, "password", path);
  if (password._tag === "err") return password;
  return ok({
    ...context.value.base,
    username: username.value,
    enabledUser: enabledUser.value,
    givenName: givenName.value,
    familyName: familyName.value,
    role: role.value,
    ...(userIds.value === undefined ? {} : { userIds: userIds.value }),
    ...(middleName.value === undefined ? {} : { middleName: middleName.value }),
    ...(identifier.value === undefined ? {} : { identifier: identifier.value }),
    ...(email.value === undefined ? {} : { email: email.value }),
    ...(sms.value === undefined ? {} : { sms: sms.value }),
    ...(phone.value === undefined ? {} : { phone: phone.value }),
    ...(agents.value === undefined ? {} : { agents: agents.value }),
    ...(grades.value === undefined ? {} : { grades: grades.value }),
    ...(password.value === undefined ? {} : { password: password.value }),
  });
}
