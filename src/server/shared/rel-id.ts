/**
 * Coerce a relationship id to the shape Payload expects. Our Postgres adapter
 * uses integer ids, but the admin client sends them as strings (select values,
 * MediaPicker returns `id` as string). All-digit strings become numbers;
 * anything else (e.g. Mongo ObjectIds) is passed through unchanged.
 * Empty/nullish → undefined (clears the relation).
 */
export function toRelId(
  value: string | number | null | undefined
): number | string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number") return value;
  return /^\d+$/.test(value) ? Number(value) : value;
}

export function toRelIds(
  values: Array<string | number> | undefined
): Array<number | string> | undefined {
  if (!values) return undefined;
  return values
    .map((v) => toRelId(v))
    .filter((v): v is number | string => v !== undefined);
}
