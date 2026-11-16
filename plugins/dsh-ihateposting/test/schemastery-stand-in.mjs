// A small stand-in for `@deepseek-ai/schemastery`, used by the tests only when the real package is not installed (the repository's own `npm install`
// does not install it: DeepSeek Harness brings it). It does just what lib/index.js asks of the library: string and boolean fields with defaults,
// `.role()`, an object schema that is called with a value and answers the checked value with its defaults (a missing or null value counts as not given, an unknown field is kept) and a refusal (a TypeError) of a wrong type. Behaviour checked against @deepseek-ai/schemastery 3.19.0.
// With the real package installed none of this runs, and the same tests run against the real one.
const make = (spec) => {
  const schema = (value) => check(spec, value, "config");
  schema.spec = spec;
  schema.default = (value) => make({ ...spec, default: value });
  schema.role = (role) => make({ ...spec, role });
  return schema;
};

const check = (spec, value, where) => {
  if (spec.kind === "object") {
    const input = value === undefined || value === null ? {} : value;
    if (typeof input !== "object" || Array.isArray(input)) throw new TypeError(`${where} must be an object`);
    // as the real library does: a field that is given but unknown is kept
    return { ...input, ...Object.fromEntries(Object.entries(spec.shape).map(([key, field]) => [key, check(field.spec, input[key], `${where}.${key}`)])) };
  }
  const given = value === undefined || value === null ? spec.default : value;
  if (spec.kind === "string" && typeof given !== "string") throw new TypeError(`${where} must be a string`);
  if (spec.kind === "boolean" && typeof given !== "boolean") throw new TypeError(`${where} must be a boolean`);
  return given;
};

export const isStandIn = true;

export default {
  object: (shape) => make({ kind: "object", shape }),
  string: () => make({ kind: "string" }),
  boolean: () => make({ kind: "boolean" }),
};
