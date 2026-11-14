// The one place that knows which environment variable holds the key, and what to
// say when it is missing. Nothing here ever reads the key's value into a string
// that could be printed: it only asks whether the value is there.

export const KEY_VARIABLE = 'IHATEPOSTING_API_KEY'

export const MISSING_KEY_MESSAGE =
  `dsh-ihateposting is not loading because the environment variable ${KEY_VARIABLE} is empty or not set, ` +
  'so create a workspace key under Settings > Agents / Dev in iHatePosting and set it before starting dsh.'

/** Throws one sentence, never the value, when the key is missing or only spaces. */
export function requireKey(env = process.env) {
  const value = env[KEY_VARIABLE]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(MISSING_KEY_MESSAGE)
  }
}
