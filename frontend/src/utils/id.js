/** Normalize Mongo/ObjectId values to comparable strings. */
export function normalizeId(value) {
  if (value == null) return '';
  if (typeof value === 'object' && value._id != null) return String(value._id);
  return String(value);
}

export function idsEqual(a, b) {
  return normalizeId(a) === normalizeId(b);
}
