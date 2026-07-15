import { ok, type Result } from "../../result.js";
import type { OneRosterV1p1EntityBase } from "./entity.js";
import type { Diagnostics } from "./rostering-parsing.js";
import type { OneRosterV1p1Date } from "./primitive.js";
import {
  optionalBoolean,
  optionalDate,
  optionalString,
  parseEntityContext,
} from "./rostering-parsing.js";

/** Demographic data. */
export interface OneRosterV1p1Demographics extends OneRosterV1p1EntityBase {
  readonly birthDate?: OneRosterV1p1Date;
  readonly sex?: string;
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

/** Parse demographics. */
export function parseOneRosterV1p1Demographics(
  input: unknown,
  path = "$",
): Result<OneRosterV1p1Demographics, Diagnostics> {
  const context = parseEntityContext(input, path);
  if (context._tag === "err") return context;
  const birthDate = optionalDate(context.value.record, "birthDate", path);
  if (birthDate._tag === "err") return birthDate;
  const sex = optionalString(context.value.record, "sex", path);
  if (sex._tag === "err") return sex;
  const americanIndianOrAlaskaNative = optionalBoolean(
    context.value.record,
    "americanIndianOrAlaskaNative",
    path,
  );
  if (americanIndianOrAlaskaNative._tag === "err") return americanIndianOrAlaskaNative;
  const asian = optionalBoolean(context.value.record, "asian", path);
  if (asian._tag === "err") return asian;
  const blackOrAfricanAmerican = optionalBoolean(
    context.value.record,
    "blackOrAfricanAmerican",
    path,
  );
  if (blackOrAfricanAmerican._tag === "err") return blackOrAfricanAmerican;
  const nativeHawaiianOrOtherPacificIslander = optionalBoolean(
    context.value.record,
    "nativeHawaiianOrOtherPacificIslander",
    path,
  );
  if (nativeHawaiianOrOtherPacificIslander._tag === "err")
    return nativeHawaiianOrOtherPacificIslander;
  const white = optionalBoolean(context.value.record, "white", path);
  if (white._tag === "err") return white;
  const demographicRaceTwoOrMoreRaces = optionalBoolean(
    context.value.record,
    "demographicRaceTwoOrMoreRaces",
    path,
  );
  if (demographicRaceTwoOrMoreRaces._tag === "err") return demographicRaceTwoOrMoreRaces;
  const hispanicOrLatinoEthnicity = optionalBoolean(
    context.value.record,
    "hispanicOrLatinoEthnicity",
    path,
  );
  if (hispanicOrLatinoEthnicity._tag === "err") return hispanicOrLatinoEthnicity;
  const countryOfBirthCode = optionalString(context.value.record, "countryOfBirthCode", path);
  if (countryOfBirthCode._tag === "err") return countryOfBirthCode;
  const stateOfBirthAbbreviation = optionalString(
    context.value.record,
    "stateOfBirthAbbreviation",
    path,
  );
  if (stateOfBirthAbbreviation._tag === "err") return stateOfBirthAbbreviation;
  const cityOfBirth = optionalString(context.value.record, "cityOfBirth", path);
  if (cityOfBirth._tag === "err") return cityOfBirth;
  const publicSchoolResidenceStatus = optionalString(
    context.value.record,
    "publicSchoolResidenceStatus",
    path,
  );
  if (publicSchoolResidenceStatus._tag === "err") return publicSchoolResidenceStatus;
  return ok({
    ...context.value.base,
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
