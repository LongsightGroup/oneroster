import { err, ok, type Result } from "../../result.js";
import {
  parseOneRosterV1p2RecordAt,
  rejectUnknownOneRosterV1p2Properties,
  requireOneRosterV1p2Property,
} from "../model/entity.js";
import type {
  OneRosterV1p2PayloadDiagnostic,
  OneRosterV1p2PayloadParser,
} from "../model/json-value.js";

/** A singleton payload with an exact, standards-defined property name. */
export type OneRosterV1p2SingletonPayload<TEntity, TProperty extends string> = {
  readonly [Property in TProperty]: TEntity;
};

/** A collection payload with an exact, standards-defined property name. */
export type OneRosterV1p2CollectionPayload<TEntity, TProperty extends string> = {
  readonly [Property in TProperty]: ReadonlyArray<TEntity>;
};

/** A field-aware projection of a known OneRoster entity. */
export type OneRosterV1p2Projected<TEntity, TField extends keyof TEntity> = Pick<TEntity, TField>;

type Diagnostics = ReadonlyArray<OneRosterV1p2PayloadDiagnostic>;

/** Parse a collection envelope using its generated response property and entity parser. */
export function parseOneRosterV1p2CollectionAt<TEntity, TProperty extends string>(
  input: unknown,
  path: string,
  property: TProperty,
  parser: OneRosterV1p2PayloadParser<TEntity>,
): Result<OneRosterV1p2CollectionPayload<TEntity, TProperty>, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const unknown = rejectUnknownOneRosterV1p2Properties(record.value, new Set([property]), path);
  if (unknown._tag === "err") return unknown;
  const items = requireOneRosterV1p2Property(record.value, property, path, (value, nestedPath) => {
    if (!Array.isArray(value)) {
      return err([
        {
          _tag: "OneRosterV1p2PayloadDiagnostic",
          code: "payload.invalid_type",
          path: nestedPath,
          message: "Expected a collection array.",
        },
      ]);
    }
    const parsedItems: Array<TEntity> = [];
    for (const [index, item] of value.entries()) {
      const parsed = parser(item, `${nestedPath}[${index}]`);
      if (parsed._tag === "err") return parsed;
      parsedItems.push(parsed.value);
    }
    return ok(parsedItems);
  });
  if (items._tag === "err") return items;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: property is a validated literal key and every collection item was parsed.
  return ok({ [property]: items.value } as unknown as OneRosterV1p2CollectionPayload<
    TEntity,
    TProperty
  >);
}

/** Parse a singleton envelope using its generated response property and entity parser. */
export function parseOneRosterV1p2SingletonAt<TEntity, TProperty extends string>(
  input: unknown,
  path: string,
  property: TProperty,
  parser: OneRosterV1p2PayloadParser<TEntity>,
): Result<OneRosterV1p2SingletonPayload<TEntity, TProperty>, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const unknown = rejectUnknownOneRosterV1p2Properties(record.value, new Set([property]), path);
  if (unknown._tag === "err") return unknown;
  const item = requireOneRosterV1p2Property(record.value, property, path, parser);
  if (item._tag === "err") return item;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: property is a validated literal key and the singleton was parsed.
  return ok({ [property]: item.value } as unknown as OneRosterV1p2SingletonPayload<
    TEntity,
    TProperty
  >);
}
