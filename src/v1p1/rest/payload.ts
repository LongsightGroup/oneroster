import { ok, type Result } from "../../result.js";
import type {
  OneRosterV1p1PayloadDiagnostic,
  OneRosterV1p1PayloadParser,
} from "../model/primitive.js";
import { parseOneRosterV1p1RecordAt, requireOneRosterV1p1Property } from "../model/entity.js";

type Diagnostics = ReadonlyArray<OneRosterV1p1PayloadDiagnostic>;

/** Parse the exact v1.1 collection envelope and return its items. */
export function createOneRosterV1p1CollectionParser<TEntity>(
  property: string,
  parser: OneRosterV1p1PayloadParser<TEntity>,
): OneRosterV1p1PayloadParser<ReadonlyArray<TEntity>> {
  return (input, path) => {
    const record = parseOneRosterV1p1RecordAt(input, path);
    if (record._tag === "err") return record;
    const collection = requireOneRosterV1p1Property(
      record.value,
      property,
      path,
      (value, nestedPath) => {
        if (!Array.isArray(value)) return invalid(nestedPath, "Expected a collection array.");
        const items: Array<TEntity> = [];
        for (const [index, item] of value.entries()) {
          const parsed = parser(item, `${nestedPath}[${index}]`);
          if (parsed._tag === "err") return parsed;
          items.push(parsed.value);
        }
        return ok(items);
      },
    );
    return collection;
  };
}

/** Parse the exact v1.1 singleton envelope and return its entity. */
export function createOneRosterV1p1SingletonParser<TEntity>(
  property: string,
  parser: OneRosterV1p1PayloadParser<TEntity>,
): OneRosterV1p1PayloadParser<TEntity> {
  return (input, path) => {
    const record = parseOneRosterV1p1RecordAt(input, path);
    if (record._tag === "err") return record;
    return requireOneRosterV1p1Property(record.value, property, path, parser);
  };
}

function invalid<TValue = never>(path: string, message: string): Result<TValue, Diagnostics> {
  return {
    _tag: "err",
    error: [
      { _tag: "OneRosterV1p1PayloadDiagnostic", code: "payload.invalid_value", path, message },
    ],
  };
}
