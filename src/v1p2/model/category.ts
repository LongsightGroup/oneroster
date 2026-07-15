import { ok, type Result } from "../../result.js";
import {
  parseOneRosterV1p2EntityBaseRecordAt,
  parseOneRosterV1p2RecordAt,
  rejectUnknownOneRosterV1p2Properties,
  requireOneRosterV1p2Property,
  optionalOneRosterV1p2Property,
  type OneRosterV1p2EntityBase,
} from "./entity.js";
import { parseOneRosterV1p2NumberAt, parseOneRosterV1p2StringAt } from "./primitive.js";
import { gradebookParser, type Diagnostics, type RootParser } from "./gradebook-parsing.js";

/** A Gradebook category entity. */
export interface OneRosterV1p2Category extends OneRosterV1p2EntityBase {
  readonly title: string;
  readonly weight?: number;
}

function parseCategoryAt(input: unknown, path: string): Result<OneRosterV1p2Category, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const unknown = rejectUnknownOneRosterV1p2Properties(
    record.value,
    new Set(["sourcedId", "status", "dateLastModified", "metadata", "title", "weight"]),
    path,
  );
  if (unknown._tag === "err") return unknown;
  const base = parseOneRosterV1p2EntityBaseRecordAt(record.value, path);
  if (base._tag === "err") return base;
  const title = requireOneRosterV1p2Property(
    record.value,
    "title",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (title._tag === "err") return title;
  const weight = optionalOneRosterV1p2Property(
    record.value,
    "weight",
    path,
    parseOneRosterV1p2NumberAt,
  );
  if (weight._tag === "err") return weight;
  return ok({
    ...base.value,
    title: title.value,
    ...(weight.value === undefined ? {} : { weight: weight.value }),
  });
}

/** Parse a Gradebook category entity. */
export const parseOneRosterV1p2Category: RootParser<OneRosterV1p2Category> =
  gradebookParser(parseCategoryAt);
