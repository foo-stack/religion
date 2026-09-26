/**
 * Comparing the public surface with its record.
 *
 * The record is what a stable release promises. Any difference fails, in one of two ways: an
 * entry the record has and the code lost is breaking, and an entry the code has and the
 * record lacks is unrecorded. Failing on additions too is what keeps the record complete, so
 * every change to the surface arrives as a reviewable edit to it.
 */

/** `"string"`, `"number"`, `"boolean"`, `"null"` or a `|` union of them; `[shape]`; `{ key: shape }`; `{ "*": shape }`. */
export type Shape = string | Shape[] | { [key: string]: Shape };

export type Surface = string | number | boolean | null | Surface[] | { [key: string]: Surface };

/** Every difference between a record and the current surface, as `breaking:` or `unrecorded:` lines. */
export function compareSurface(record: Surface, current: Surface, at = ""): string[] {
  if (Array.isArray(record) && Array.isArray(current)) {
    const had = new Set(record.map(String));
    const has = new Set(current.map(String));
    return [
      ...[...had].filter((item) => !has.has(item)).map((item) => `breaking: ${at} no longer includes ${item}`),
      ...[...has].filter((item) => !had.has(item)).map((item) => `unrecorded: ${at} now includes ${item}`)
    ];
  }

  if (isObject(record) && isObject(current)) {
    return [
      ...Object.keys(record)
        .filter((key) => !Object.hasOwn(current, key))
        .map((key) => `breaking: ${join(at, key)} was removed`),
      ...Object.keys(current)
        .filter((key) => !Object.hasOwn(record, key))
        .map((key) => `unrecorded: ${join(at, key)} was added`),
      ...Object.keys(record)
        .filter((key) => Object.hasOwn(current, key))
        .flatMap((key) => compareSurface(record[key]!, current[key]!, join(at, key)))
    ];
  }

  return JSON.stringify(record) === JSON.stringify(current)
    ? []
    : [`breaking: ${at} changed from ${JSON.stringify(record)} to ${JSON.stringify(current)}`];
}

/** Every way a value departs from a recorded shape, as `breaking:` or `unrecorded:` lines. */
export function shapeProblems(value: unknown, shape: Shape, at = "$"): string[] {
  if (typeof shape === "string") {
    return shape.split("|").includes(kindOf(value)) ? [] : [`breaking: ${at} should be ${shape}, is ${kindOf(value)}`];
  }

  if (Array.isArray(shape)) {
    if (!Array.isArray(value)) return [`breaking: ${at} should be an array, is ${kindOf(value)}`];
    return value.flatMap((item, index) => shapeProblems(item, shape[0]!, `${at}[${index}]`));
  }

  if (!isObject(value)) return [`breaking: ${at} should be an object, is ${kindOf(value)}`];

  const keys = Object.keys(shape);
  if (keys.length === 1 && keys[0] === "*") {
    return Object.entries(value).flatMap(([key, item]) => shapeProblems(item, shape["*"]!, `${at}.${key}`));
  }

  return [
    ...keys.filter((key) => !Object.hasOwn(value, key)).map((key) => `breaking: ${at}.${key} is missing`),
    ...Object.keys(value)
      .filter((key) => !Object.hasOwn(shape, key))
      .map((key) => `unrecorded: ${at}.${key} is not in the record`),
    ...keys.filter((key) => Object.hasOwn(value, key)).flatMap((key) => shapeProblems(value[key], shape[key]!, `${at}.${key}`))
  ];
}

function kindOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function isObject(value: unknown): value is Record<string, never> {
  return kindOf(value) === "object";
}

function join(at: string, key: string): string {
  return at ? `${at}.${key}` : key;
}
