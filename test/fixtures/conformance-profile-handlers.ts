import {
  parseAndValidateOneRosterCsvFullZip,
  parseAndValidateOneRosterCsvGradebookZip,
  parseAndValidateOneRosterCsvResourcesZip,
  parseAndValidateOneRosterCsvRosteringZip,
  parseOneRosterCsvFullZip,
  parseOneRosterCsvZip,
  writeOneRosterCsvFullZip,
  writeOneRosterCsvGradebookZip,
  writeOneRosterCsvPackageZip,
  writeOneRosterCsvResourcesZip,
  writeOneRosterCsvRosteringZip,
  type OneRosterCsvFullPackage,
  type OneRosterCsvGradebookPackage,
  type OneRosterCsvPackage,
  type OneRosterCsvPackageDiagnostic,
  type OneRosterCsvPackageWriteDiagnostic,
  type OneRosterCsvResourcesPackage,
  type OneRosterCsvRosteringPackage,
  type OneRosterCsvValidatedFullPackage,
  type OneRosterCsvValidatedGradebookPackage,
  type OneRosterCsvValidatedResourcesPackage,
  type OneRosterCsvValidatedRosteringPackage,
  type Result,
} from "../../src/index.js";
import type {
  OneRosterCsvConformanceNegativeScenario,
  OneRosterCsvConformanceProfile,
} from "./conformance-scenarios-valid.js";

const referenceMode = { referenceMode: "allRows" as const };

type ConformanceProfileHandler<TValidated, TPackage> = {
  readonly parseValidate: (
    bytes: Uint8Array,
  ) => Result<TValidated, readonly OneRosterCsvPackageDiagnostic[]>;
  readonly write: (
    packageValue: TPackage,
  ) => Result<Uint8Array, readonly OneRosterCsvPackageWriteDiagnostic[]>;
  readonly extract: (validated: TValidated) => TPackage;
};

type ConformanceProfileHandlers = {
  readonly package: ConformanceProfileHandler<OneRosterCsvPackage, OneRosterCsvPackage>;
  readonly rostering: ConformanceProfileHandler<
    OneRosterCsvValidatedRosteringPackage,
    OneRosterCsvRosteringPackage
  >;
  readonly gradebook: ConformanceProfileHandler<
    OneRosterCsvValidatedGradebookPackage,
    OneRosterCsvGradebookPackage
  >;
  readonly resources: ConformanceProfileHandler<
    OneRosterCsvValidatedResourcesPackage,
    OneRosterCsvResourcesPackage
  >;
  readonly full: ConformanceProfileHandler<
    OneRosterCsvValidatedFullPackage,
    OneRosterCsvFullPackage
  >;
};

export const conformanceProfileHandlers: ConformanceProfileHandlers = {
  package: {
    parseValidate: parseOneRosterCsvZip,
    write: writeOneRosterCsvPackageZip,
    extract: (packageValue) => packageValue,
  },
  rostering: {
    parseValidate: (bytes) => parseAndValidateOneRosterCsvRosteringZip(bytes, referenceMode),
    write: writeOneRosterCsvRosteringZip,
    extract: (validated) => validated.rosteringPackage,
  },
  gradebook: {
    parseValidate: (bytes) => parseAndValidateOneRosterCsvGradebookZip(bytes, referenceMode),
    write: writeOneRosterCsvGradebookZip,
    extract: (validated) => validated.gradebookPackage,
  },
  resources: {
    parseValidate: (bytes) => parseAndValidateOneRosterCsvResourcesZip(bytes, referenceMode),
    write: writeOneRosterCsvResourcesZip,
    extract: (validated) => validated.resourcesPackage,
  },
  full: {
    parseValidate: (bytes) => parseAndValidateOneRosterCsvFullZip(bytes, referenceMode),
    write: writeOneRosterCsvFullZip,
    extract: (validated) => validated.fullPackage,
  },
};

/** Negative conformance operations intentionally cover package and full-profile parse/validate paths only. */
export const conformanceNegativeOperationHandlers = {
  parsePackage: (bytes: Uint8Array) => parseOneRosterCsvZip(bytes),
  parseFull: (bytes: Uint8Array) => parseOneRosterCsvFullZip(bytes),
  validateFull: (bytes: Uint8Array) => parseAndValidateOneRosterCsvFullZip(bytes, referenceMode),
} as const;

function runConformanceRoundTrip<TValidated, TPackage>(
  handler: ConformanceProfileHandler<TValidated, TPackage>,
  bytes: Uint8Array,
): { readonly original: TPackage; readonly roundTrip: TPackage } {
  const validated = handler.parseValidate(bytes);

  if (validated._tag === "err") {
    throw new Error("Expected conformance profile parse/validate to succeed.");
  }

  const written = handler.write(handler.extract(validated.value));

  if (written._tag === "err") {
    throw new Error("Expected conformance profile write to succeed.");
  }

  const roundTrip = handler.parseValidate(written.value);

  if (roundTrip._tag === "err") {
    throw new Error("Expected conformance profile round-trip parse/validate to succeed.");
  }

  return {
    original: handler.extract(validated.value),
    roundTrip: handler.extract(roundTrip.value),
  };
}

export function roundTripConformanceProfile(
  profile: OneRosterCsvConformanceProfile,
  bytes: Uint8Array,
): { readonly original: unknown; readonly roundTrip: unknown } {
  switch (profile) {
    case "package":
      return runConformanceRoundTrip(conformanceProfileHandlers.package, bytes);
    case "rostering":
      return runConformanceRoundTrip(conformanceProfileHandlers.rostering, bytes);
    case "gradebook":
      return runConformanceRoundTrip(conformanceProfileHandlers.gradebook, bytes);
    case "resources":
      return runConformanceRoundTrip(conformanceProfileHandlers.resources, bytes);
    case "full":
      return runConformanceRoundTrip(conformanceProfileHandlers.full, bytes);
    default:
      return assertNeverConformanceProfile(profile);
  }
}

function assertNeverConformanceProfile(profile: never): never {
  throw new Error(`Unsupported conformance profile: ${String(profile)}`);
}

export function expectConformanceProfileValid(
  profile: OneRosterCsvConformanceProfile,
  bytes: Uint8Array,
): void {
  const result = conformanceProfileHandlers[profile].parseValidate(bytes);

  if (result._tag === "err") {
    throw new Error("Expected conformance profile parse/validate to succeed.");
  }
}

export function expectConformanceScenarioDiagnostics(
  scenario: OneRosterCsvConformanceNegativeScenario,
): readonly OneRosterCsvPackageDiagnostic[] {
  const result = conformanceNegativeOperationHandlers[scenario.operation](scenario.bytes());

  if (result._tag === "ok") {
    throw new Error("Expected conformance scenario to fail.");
  }

  return result.error;
}
