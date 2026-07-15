import { ok, type Result } from "../../result.js";
import type { OneRosterV1p2PayloadDiagnostic } from "./json-value.js";
import {
  optionalOneRosterV1p2Property,
  parseOneRosterV1p2EntityBaseRecordAt,
  parseOneRosterV1p2RecordAt,
  rejectUnknownOneRosterV1p2Properties,
} from "./entity.js";
import type { OneRosterV1p2EntityBase } from "./entity.js";
import {
  parseOneRosterV1p2BooleanTokenAt,
  parseOneRosterV1p2DateAt,
  parseOneRosterV1p2KnownOrExtensionTokenAt,
  parseOneRosterV1p2StringAt,
  type OneRosterV1p2Date,
  type OneRosterV1p2ExtensionToken,
} from "./primitive.js";
type Diagnostics = ReadonlyArray<OneRosterV1p2PayloadDiagnostic>;
type RootParser<TValue> = (input: unknown) => Result<TValue, Diagnostics>;

/** The demographics sex vocabulary. */
export type OneRosterV1p2DemographicsSex =
  | "male"
  | "female"
  | "unspecified"
  | "other"
  | OneRosterV1p2ExtensionToken;
/** A demographics entity. */
export interface OneRosterV1p2Demographics extends OneRosterV1p2EntityBase {
  readonly birthDate?: OneRosterV1p2Date;
  readonly sex?: OneRosterV1p2DemographicsSex;
  readonly americanIndianOrAlaskaNative?: "true" | "false";
  readonly asian?: "true" | "false";
  readonly blackOrAfricanAmerican?: "true" | "false";
  readonly nativeHawaiianOrOtherPacificIslander?: "true" | "false";
  readonly white?: "true" | "false";
  readonly demographicRaceTwoOrMoreRaces?: "true" | "false";
  readonly hispanicOrLatinoEthnicity?: "true" | "false";
  readonly countryOfBirthCode?: string;
  readonly stateOfBirthAbbreviation?: string;
  readonly cityOfBirth?: string;
  readonly publicSchoolResidenceStatus?: string;
}
function parseDemographicsAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2Demographics, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const allowed = new Set([
    "sourcedId",
    "status",
    "dateLastModified",
    "metadata",
    "birthDate",
    "sex",
    "americanIndianOrAlaskaNative",
    "asian",
    "blackOrAfricanAmerican",
    "nativeHawaiianOrOtherPacificIslander",
    "white",
    "demographicRaceTwoOrMoreRaces",
    "hispanicOrLatinoEthnicity",
    "countryOfBirthCode",
    "stateOfBirthAbbreviation",
    "cityOfBirth",
    "publicSchoolResidenceStatus",
  ]);
  const unknown = rejectUnknownOneRosterV1p2Properties(record.value, allowed, path);
  if (unknown._tag === "err") return unknown;
  const base = parseOneRosterV1p2EntityBaseRecordAt(record.value, path);
  if (base._tag === "err") return base;
  const birthDate = optionalOneRosterV1p2Property(
    record.value,
    "birthDate",
    path,
    parseOneRosterV1p2DateAt,
  );
  if (birthDate._tag === "err") return birthDate;
  const sex = optionalOneRosterV1p2Property(record.value, "sex", path, (value, nestedPath) =>
    parseOneRosterV1p2KnownOrExtensionTokenAt(value, nestedPath, [
      "male",
      "female",
      "unspecified",
      "other",
    ] as const),
  );
  if (sex._tag === "err") return sex;
  const bool = (property: string): Result<"true" | "false" | undefined, Diagnostics> =>
    optionalOneRosterV1p2Property(record.value, property, path, parseOneRosterV1p2BooleanTokenAt);
  const americanIndianOrAlaskaNative = bool("americanIndianOrAlaskaNative");
  if (americanIndianOrAlaskaNative._tag === "err") return americanIndianOrAlaskaNative;
  const asian = bool("asian");
  if (asian._tag === "err") return asian;
  const blackOrAfricanAmerican = bool("blackOrAfricanAmerican");
  if (blackOrAfricanAmerican._tag === "err") return blackOrAfricanAmerican;
  const nativeHawaiianOrOtherPacificIslander = bool("nativeHawaiianOrOtherPacificIslander");
  if (nativeHawaiianOrOtherPacificIslander._tag === "err")
    return nativeHawaiianOrOtherPacificIslander;
  const white = bool("white");
  if (white._tag === "err") return white;
  const demographicRaceTwoOrMoreRaces = bool("demographicRaceTwoOrMoreRaces");
  if (demographicRaceTwoOrMoreRaces._tag === "err") return demographicRaceTwoOrMoreRaces;
  const hispanicOrLatinoEthnicity = bool("hispanicOrLatinoEthnicity");
  if (hispanicOrLatinoEthnicity._tag === "err") return hispanicOrLatinoEthnicity;
  const countryOfBirthCode = optionalOneRosterV1p2Property(
    record.value,
    "countryOfBirthCode",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (countryOfBirthCode._tag === "err") return countryOfBirthCode;
  const stateOfBirthAbbreviation = optionalOneRosterV1p2Property(
    record.value,
    "stateOfBirthAbbreviation",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (stateOfBirthAbbreviation._tag === "err") return stateOfBirthAbbreviation;
  const cityOfBirth = optionalOneRosterV1p2Property(
    record.value,
    "cityOfBirth",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (cityOfBirth._tag === "err") return cityOfBirth;
  const publicSchoolResidenceStatus = optionalOneRosterV1p2Property(
    record.value,
    "publicSchoolResidenceStatus",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (publicSchoolResidenceStatus._tag === "err") return publicSchoolResidenceStatus;
  return ok({
    ...base.value,
    ...(birthDate.value === undefined ? {} : { birthDate: birthDate.value }),
    ...(sex.value === undefined ? {} : { sex: sex.value }),
    ...(americanIndianOrAlaskaNative.value === undefined
      ? {}
      : { americanIndianOrAlaskaNative: americanIndianOrAlaskaNative.value }),
    ...(asian.value === undefined ? {} : { asian: asian.value }),
    ...(blackOrAfricanAmerican.value === undefined
      ? {}
      : { blackOrAfricanAmerican: blackOrAfricanAmerican.value }),
    ...(nativeHawaiianOrOtherPacificIslander.value === undefined
      ? {}
      : { nativeHawaiianOrOtherPacificIslander: nativeHawaiianOrOtherPacificIslander.value }),
    ...(white.value === undefined ? {} : { white: white.value }),
    ...(demographicRaceTwoOrMoreRaces.value === undefined
      ? {}
      : { demographicRaceTwoOrMoreRaces: demographicRaceTwoOrMoreRaces.value }),
    ...(hispanicOrLatinoEthnicity.value === undefined
      ? {}
      : { hispanicOrLatinoEthnicity: hispanicOrLatinoEthnicity.value }),
    ...(countryOfBirthCode.value === undefined
      ? {}
      : { countryOfBirthCode: countryOfBirthCode.value }),
    ...(stateOfBirthAbbreviation.value === undefined
      ? {}
      : { stateOfBirthAbbreviation: stateOfBirthAbbreviation.value }),
    ...(cityOfBirth.value === undefined ? {} : { cityOfBirth: cityOfBirth.value }),
    ...(publicSchoolResidenceStatus.value === undefined
      ? {}
      : { publicSchoolResidenceStatus: publicSchoolResidenceStatus.value }),
  });
}

function parser<TValue>(
  parseAt: (input: unknown, path: string) => Result<TValue, Diagnostics>,
): (input: unknown) => Result<TValue, Diagnostics> {
  return (input) => parseAt(input, "$");
}

/** Parse a demographics entity. */
export const parseOneRosterV1p2Demographics: RootParser<OneRosterV1p2Demographics> =
  parser(parseDemographicsAt);
