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
  parseOneRosterV1p2BooleanTokenAt,
  parseOneRosterV1p2DateAt,
  parseOneRosterV1p2FixedTokenAt,
  parseOneRosterV1p2KnownOrExtensionTokenAt,
  parseOneRosterV1p2StringAt,
  parseOneRosterV1p2UriAt,
  type OneRosterV1p2Date,
  type OneRosterV1p2ExtensionToken,
  type OneRosterV1p2Uri,
} from "./primitive.js";
import { parseOneRosterV1p2ReferenceAt, type OneRosterV1p2Reference } from "./reference.js";
import type {
  OneRosterV1p2OrgReference,
  OneRosterV1p2ResourceReference,
  OneRosterV1p2UserReference,
} from "./references.js";
type Diagnostics = ReadonlyArray<OneRosterV1p2PayloadDiagnostic>;
type RootParser<TValue> = (input: unknown) => Result<TValue, Diagnostics>;

export type OneRosterV1p2RoleType =
  | "aide"
  | "counselor"
  | "districtAdministrator"
  | "guardian"
  | "parent"
  | "principal"
  | "proctor"
  | "relative"
  | "siteAdministrator"
  | "student"
  | "systemAdministrator"
  | "teacher"
  | OneRosterV1p2ExtensionToken;
/** A profile credential associated with a user profile. */
export interface OneRosterV1p2Credential {
  readonly type: string;
  readonly username: string;
  readonly password?: string;
}

/** A user identifier from an external identity system. */
export interface OneRosterV1p2UserId {
  readonly type: string;
  readonly identifier: string;
}

/** A system/application profile associated with a user. */
export interface OneRosterV1p2UserProfile {
  readonly profileId: OneRosterV1p2Uri;
  readonly profileType: string;
  readonly vendorId: string;
  readonly applicationId?: string;
  readonly description?: string;
  readonly credentials?: ReadonlyArray<OneRosterV1p2Credential>;
}

/** A role/org tuple associated with a user. */
export interface OneRosterV1p2Role {
  readonly roleType: "primary" | "secondary";
  readonly role: OneRosterV1p2RoleType;
  readonly org: OneRosterV1p2OrgReference;
  readonly userProfile?: OneRosterV1p2Uri;
  readonly beginDate?: OneRosterV1p2Date;
  readonly endDate?: OneRosterV1p2Date;
}
/** A user entity. */
export interface OneRosterV1p2User extends OneRosterV1p2EntityBase {
  readonly enabledUser: "true" | "false";
  readonly givenName: string;
  readonly familyName: string;
  readonly roles: ReadonlyArray<OneRosterV1p2Role>;
  readonly userMasterIdentifier?: string;
  readonly username?: string;
  readonly userIds?: ReadonlyArray<OneRosterV1p2UserId>;
  readonly middleName?: string;
  readonly preferredFirstName?: string;
  readonly preferredMiddleName?: string;
  readonly preferredLastName?: string;
  readonly pronouns?: string;
  readonly userProfiles?: ReadonlyArray<OneRosterV1p2UserProfile>;
  readonly primaryOrg?: OneRosterV1p2OrgReference;
  readonly identifier?: string;
  readonly email?: string;
  readonly sms?: string;
  readonly phone?: string;
  readonly agents?: ReadonlyArray<OneRosterV1p2UserReference>;
  readonly grades?: ReadonlyArray<string>;
  readonly password?: string;
  readonly resources?: ReadonlyArray<OneRosterV1p2ResourceReference>;
}
const ref =
  <TType extends Parameters<typeof parseOneRosterV1p2ReferenceAt>[1]>(
    type: TType,
  ): OneRosterV1p2PayloadParser<OneRosterV1p2Reference<TType>> =>
  (input, path) =>
    parseOneRosterV1p2ReferenceAt(input, type, path);

const stringArray: OneRosterV1p2PayloadParser<ReadonlyArray<string>> = (input, path) =>
  parseOneRosterV1p2ArrayAt(input, path, parseOneRosterV1p2StringAt);

const roleParser: OneRosterV1p2PayloadParser<OneRosterV1p2Role> = parseRoleAt;
const credentialParser: OneRosterV1p2PayloadParser<OneRosterV1p2Credential> = parseCredentialAt;
const userIdParser: OneRosterV1p2PayloadParser<OneRosterV1p2UserId> = parseUserIdAt;
const userProfileParser: OneRosterV1p2PayloadParser<OneRosterV1p2UserProfile> = parseUserProfileAt;

function parseCredentialAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2Credential, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const unknown = rejectUnknownOneRosterV1p2Properties(
    record.value,
    new Set(["type", "username", "password"]),
    path,
  );
  if (unknown._tag === "err") return unknown;
  const type = requireOneRosterV1p2Property(record.value, "type", path, parseOneRosterV1p2StringAt);
  if (type._tag === "err") return type;
  const username = requireOneRosterV1p2Property(
    record.value,
    "username",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (username._tag === "err") return username;
  const password = optionalOneRosterV1p2Property(
    record.value,
    "password",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (password._tag === "err") return password;
  return ok({
    type: type.value,
    username: username.value,
    ...(password.value === undefined ? {} : { password: password.value }),
  });
}

function parseUserIdAt(input: unknown, path: string): Result<OneRosterV1p2UserId, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const unknown = rejectUnknownOneRosterV1p2Properties(
    record.value,
    new Set(["type", "identifier"]),
    path,
  );
  if (unknown._tag === "err") return unknown;
  const type = requireOneRosterV1p2Property(record.value, "type", path, parseOneRosterV1p2StringAt);
  if (type._tag === "err") return type;
  const identifier = requireOneRosterV1p2Property(
    record.value,
    "identifier",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (identifier._tag === "err") return identifier;
  return ok({ type: type.value, identifier: identifier.value });
}

function parseUserProfileAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2UserProfile, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const unknown = rejectUnknownOneRosterV1p2Properties(
    record.value,
    new Set([
      "profileId",
      "profileType",
      "vendorId",
      "applicationId",
      "description",
      "credentials",
    ]),
    path,
  );
  if (unknown._tag === "err") return unknown;
  const profileId = requireOneRosterV1p2Property(
    record.value,
    "profileId",
    path,
    parseOneRosterV1p2UriAt,
  );
  if (profileId._tag === "err") return profileId;
  const profileType = requireOneRosterV1p2Property(
    record.value,
    "profileType",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (profileType._tag === "err") return profileType;
  const vendorId = requireOneRosterV1p2Property(
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
  const description = optionalOneRosterV1p2Property(
    record.value,
    "description",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (description._tag === "err") return description;
  const credentials = optionalOneRosterV1p2Property(
    record.value,
    "credentials",
    path,
    (value, nestedPath) => parseOneRosterV1p2ArrayAt(value, nestedPath, credentialParser),
  );
  if (credentials._tag === "err") return credentials;
  return ok({
    profileId: profileId.value,
    profileType: profileType.value,
    vendorId: vendorId.value,
    ...(applicationId.value === undefined ? {} : { applicationId: applicationId.value }),
    ...(description.value === undefined ? {} : { description: description.value }),
    ...(credentials.value === undefined ? {} : { credentials: credentials.value }),
  });
}

function parseRoleAt(input: unknown, path: string): Result<OneRosterV1p2Role, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const unknown = rejectUnknownOneRosterV1p2Properties(
    record.value,
    new Set(["roleType", "role", "org", "userProfile", "beginDate", "endDate"]),
    path,
  );
  if (unknown._tag === "err") return unknown;
  const roleType = requireOneRosterV1p2Property(
    record.value,
    "roleType",
    path,
    (value, nestedPath) =>
      parseOneRosterV1p2FixedTokenAt(value, nestedPath, ["primary", "secondary"] as const),
  );
  if (roleType._tag === "err") return roleType;
  const role = requireOneRosterV1p2Property(record.value, "role", path, (value, nestedPath) =>
    parseOneRosterV1p2KnownOrExtensionTokenAt(value, nestedPath, [
      "aide",
      "counselor",
      "districtAdministrator",
      "guardian",
      "parent",
      "principal",
      "proctor",
      "relative",
      "siteAdministrator",
      "student",
      "systemAdministrator",
      "teacher",
    ] as const),
  );
  if (role._tag === "err") return role;
  const org = requireOneRosterV1p2Property(record.value, "org", path, ref("org"));
  if (org._tag === "err") return org;
  const userProfile = optionalOneRosterV1p2Property(
    record.value,
    "userProfile",
    path,
    parseOneRosterV1p2UriAt,
  );
  if (userProfile._tag === "err") return userProfile;
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
    roleType: roleType.value,
    role: role.value,
    org: org.value,
    ...(userProfile.value === undefined ? {} : { userProfile: userProfile.value }),
    ...(beginDate.value === undefined ? {} : { beginDate: beginDate.value }),
    ...(endDate.value === undefined ? {} : { endDate: endDate.value }),
  });
}
function parseUserAt(input: unknown, path: string): Result<OneRosterV1p2User, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const allowed = new Set([
    "sourcedId",
    "status",
    "dateLastModified",
    "metadata",
    "userMasterIdentifier",
    "username",
    "userIds",
    "enabledUser",
    "givenName",
    "familyName",
    "middleName",
    "preferredFirstName",
    "preferredMiddleName",
    "preferredLastName",
    "pronouns",
    "roles",
    "userProfiles",
    "primaryOrg",
    "identifier",
    "email",
    "sms",
    "phone",
    "agents",
    "grades",
    "password",
    "resources",
  ]);
  const unknown = rejectUnknownOneRosterV1p2Properties(record.value, allowed, path);
  if (unknown._tag === "err") return unknown;
  const base = parseOneRosterV1p2EntityBaseRecordAt(record.value, path);
  if (base._tag === "err") return base;
  const enabledUser = requireOneRosterV1p2Property(
    record.value,
    "enabledUser",
    path,
    parseOneRosterV1p2BooleanTokenAt,
  );
  if (enabledUser._tag === "err") return enabledUser;
  const givenName = requireOneRosterV1p2Property(
    record.value,
    "givenName",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (givenName._tag === "err") return givenName;
  const familyName = requireOneRosterV1p2Property(
    record.value,
    "familyName",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (familyName._tag === "err") return familyName;
  const roles = requireOneRosterV1p2Property(record.value, "roles", path, (value, nestedPath) =>
    parseOneRosterV1p2ArrayAt(value, nestedPath, roleParser, 1),
  );
  if (roles._tag === "err") return roles;
  const stringOption = (property: string): Result<string | undefined, Diagnostics> =>
    optionalOneRosterV1p2Property(record.value, property, path, parseOneRosterV1p2StringAt);
  const userMasterIdentifier = stringOption("userMasterIdentifier");
  if (userMasterIdentifier._tag === "err") return userMasterIdentifier;
  const username = stringOption("username");
  if (username._tag === "err") return username;
  const middleName = stringOption("middleName");
  if (middleName._tag === "err") return middleName;
  const preferredFirstName = stringOption("preferredFirstName");
  if (preferredFirstName._tag === "err") return preferredFirstName;
  const preferredMiddleName = stringOption("preferredMiddleName");
  if (preferredMiddleName._tag === "err") return preferredMiddleName;
  const preferredLastName = stringOption("preferredLastName");
  if (preferredLastName._tag === "err") return preferredLastName;
  const pronouns = stringOption("pronouns");
  if (pronouns._tag === "err") return pronouns;
  const identifier = stringOption("identifier");
  if (identifier._tag === "err") return identifier;
  const email = stringOption("email");
  if (email._tag === "err") return email;
  const sms = stringOption("sms");
  if (sms._tag === "err") return sms;
  const phone = stringOption("phone");
  if (phone._tag === "err") return phone;
  const password = stringOption("password");
  if (password._tag === "err") return password;
  const userIds = optionalOneRosterV1p2Property(
    record.value,
    "userIds",
    path,
    (value, nestedPath) => parseOneRosterV1p2ArrayAt(value, nestedPath, userIdParser),
  );
  if (userIds._tag === "err") return userIds;
  const userProfiles = optionalOneRosterV1p2Property(
    record.value,
    "userProfiles",
    path,
    (value, nestedPath) => parseOneRosterV1p2ArrayAt(value, nestedPath, userProfileParser),
  );
  if (userProfiles._tag === "err") return userProfiles;
  const primaryOrg = optionalOneRosterV1p2Property(record.value, "primaryOrg", path, ref("org"));
  if (primaryOrg._tag === "err") return primaryOrg;
  const agents = optionalOneRosterV1p2Property(record.value, "agents", path, (value, nestedPath) =>
    parseOneRosterV1p2ArrayAt(value, nestedPath, ref("user")),
  );
  if (agents._tag === "err") return agents;
  const grades = optionalOneRosterV1p2Property(record.value, "grades", path, stringArray);
  if (grades._tag === "err") return grades;
  const resources = optionalOneRosterV1p2Property(
    record.value,
    "resources",
    path,
    (value, nestedPath) => parseOneRosterV1p2ArrayAt(value, nestedPath, ref("resource")),
  );
  if (resources._tag === "err") return resources;
  return ok({
    ...base.value,
    enabledUser: enabledUser.value,
    givenName: givenName.value,
    familyName: familyName.value,
    roles: roles.value,
    ...(userMasterIdentifier.value === undefined
      ? {}
      : { userMasterIdentifier: userMasterIdentifier.value }),
    ...(username.value === undefined ? {} : { username: username.value }),
    ...(userIds.value === undefined ? {} : { userIds: userIds.value }),
    ...(middleName.value === undefined ? {} : { middleName: middleName.value }),
    ...(preferredFirstName.value === undefined
      ? {}
      : { preferredFirstName: preferredFirstName.value }),
    ...(preferredMiddleName.value === undefined
      ? {}
      : { preferredMiddleName: preferredMiddleName.value }),
    ...(preferredLastName.value === undefined
      ? {}
      : { preferredLastName: preferredLastName.value }),
    ...(pronouns.value === undefined ? {} : { pronouns: pronouns.value }),
    ...(userProfiles.value === undefined ? {} : { userProfiles: userProfiles.value }),
    ...(primaryOrg.value === undefined ? {} : { primaryOrg: primaryOrg.value }),
    ...(identifier.value === undefined ? {} : { identifier: identifier.value }),
    ...(email.value === undefined ? {} : { email: email.value }),
    ...(sms.value === undefined ? {} : { sms: sms.value }),
    ...(phone.value === undefined ? {} : { phone: phone.value }),
    ...(agents.value === undefined ? {} : { agents: agents.value }),
    ...(grades.value === undefined ? {} : { grades: grades.value }),
    ...(password.value === undefined ? {} : { password: password.value }),
    ...(resources.value === undefined ? {} : { resources: resources.value }),
  });
}

function parser<TValue>(
  parseAt: (input: unknown, path: string) => Result<TValue, Diagnostics>,
): (input: unknown) => Result<TValue, Diagnostics> {
  return (input) => parseAt(input, "$");
}

/** Parse a user entity. */
export const parseOneRosterV1p2User: RootParser<OneRosterV1p2User> = parser(parseUserAt);
