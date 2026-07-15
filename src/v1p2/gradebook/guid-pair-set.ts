import { err, type Result } from "../../result.js";
import type {
  OneRosterV1p2PayloadDiagnostic,
  OneRosterV1p2PayloadParser,
} from "../model/json-value.js";

type Diagnostics = ReadonlyArray<OneRosterV1p2PayloadDiagnostic>;

/** Parse the optional GUID-pair response metadata returned by Gradebook writes. */
export const parseOneRosterV1p2GuidPairSet: OneRosterV1p2PayloadParser<void> = (
  input,
  path,
): Result<void, Diagnostics> => {
  if (!isRecord(input)) {
    return err([diagnostic("payload.invalid_type", path, "Expected a GUID pair set object.")]);
  }

  for (const key of Object.keys(input)) {
    if (key !== "sourcedIdPairs") {
      return err([
        diagnostic(
          "payload.unknown_property",
          `${path}.${key}`,
          "The property is not part of a GUID pair set.",
        ),
      ]);
    }
  }

  const pairs = input["sourcedIdPairs"];
  if (pairs === undefined) return { _tag: "ok", value: undefined };
  if (!Array.isArray(pairs)) {
    return err([
      diagnostic("payload.invalid_type", `${path}.sourcedIdPairs`, "Expected a GUID pair array."),
    ]);
  }

  for (const [index, pair] of pairs.entries()) {
    if (
      !isRecord(pair) ||
      typeof pair["suppliedSourcedId"] !== "string" ||
      typeof pair["allocatedSourcedId"] !== "string"
    ) {
      return err([
        diagnostic(
          "payload.missing_property",
          `${path}.sourcedIdPairs[${index}]`,
          "A GUID pair must contain supplied and allocated sourced IDs.",
        ),
      ]);
    }
  }

  return { _tag: "ok", value: undefined };
};

function diagnostic(
  code: OneRosterV1p2PayloadDiagnostic["code"],
  path: string,
  message: string,
): OneRosterV1p2PayloadDiagnostic {
  return { _tag: "OneRosterV1p2PayloadDiagnostic", code, path, message };
}

function isRecord(input: unknown): input is Readonly<Record<string, unknown>> {
  return input !== null && typeof input === "object" && !Array.isArray(input);
}
