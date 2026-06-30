/** Append one value to a map-of-arrays index, creating the bucket when needed. */
export function appendIndexedMapValue<TKey, TValue>(
  map: Map<TKey, TValue[]>,
  key: TKey,
  value: TValue,
): void {
  const values = map.get(key);

  if (values === undefined) {
    map.set(key, [value]);
    return;
  }

  values.push(value);
}

/** Build a map-of-arrays index keyed by a foreign-key selector. */
export function buildIndexedMapByKey<TRecord, TKey>(
  records: readonly TRecord[],
  getKey: (record: TRecord) => TKey,
): ReadonlyMap<TKey, readonly TRecord[]> {
  const map = new Map<TKey, TRecord[]>();

  for (const record of records) {
    appendIndexedMapValue(map, getKey(record), record);
  }

  return map;
}
