import { loadCredentials } from "./commands/auth.mjs";
import { API_KEY_VARIABLE, API_URL_VARIABLE, PROGRAM } from "./constants.mjs";

// Which key and which address a command uses, the way the reference command line decides it (owner, 2026-11-13): what `auth:login`
// saved first, then the environment, else a message that says how to sign in and the program ends with 1.

export function getConfig() {
  // Check for stored OAuth credentials first
  const creds = loadCredentials();
  if (creds) {
    return {
      apiKey: creds.accessToken,
      apiUrl: creds.apiUrl,
    };
  }

  // Fall back to environment variable
  const apiKey = process.env[API_KEY_VARIABLE];
  const apiUrl = process.env[API_URL_VARIABLE];

  if (!apiKey) {
    console.error("❌ Error: No authentication found.");
    console.error("Options:");
    console.error(`  1. OAuth2: ${PROGRAM} auth:login --client-id <id> --client-secret <secret>`);
    console.error(`  2. API Key: export ${API_KEY_VARIABLE}=your_api_key`);
    process.exit(1);
  }

  return {
    apiKey,
    apiUrl,
  };
}
