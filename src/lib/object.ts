/** `Object.entries` that keeps the key type of a record whose keys are known. */
export const entriesOf = <K extends string, V>(record: Partial<Record<K, V>>): [K, V][] =>
  // SAFETY: the record is typed with keys K, so every own key Object.entries returns is a K.
  Object.entries(record) as [K, V][];

/** A record with the same keys, each value passed through `f`. */
export const mapValues = <K extends string, V, W>(record: Record<K, V>, f: (value: V) => W): Record<K, W> =>
  // SAFETY: built from every entry of a Record<K, V>, so it has exactly the keys K.
  Object.fromEntries(Object.entries<V>(record).map(([k, v]) => [k, f(v)])) as Record<K, W>;
