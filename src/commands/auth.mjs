import { exec } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import fetch from "node-fetch";
import { API_KEY_VARIABLE, API_URL_VARIABLE, AUTH_SERVER_VARIABLE, CREDENTIALS_FOLDER, DEFAULT_API_URL, DEFAULT_AUTH_SERVER, PROGRAM } from "../constants.mjs";

// Signing in, out and checking who is signed in, behaving as the reference command line does (owner, 2026-11-13; its device flow was read
// and run offline, this is our own code): `auth:login` asks the sign-in server for a code, shows it, opens the page where a person types it, and asks
// every few seconds until they have approved; what it is given is kept in a file only the person can read. Everything is printed to standard output,
// and every failure ends the program with 1.

const CREDENTIALS_DIR = join(homedir(), CREDENTIALS_FOLDER);
const CREDENTIALS_FILE = join(CREDENTIALS_DIR, "credentials.json");

export function loadCredentials() {
  try {
    if (!existsSync(CREDENTIALS_FILE)) return null;
    const data = JSON.parse(readFileSync(CREDENTIALS_FILE, "utf-8"));
    if (!data.accessToken) return null;
    return data;
  } catch {
    return null;
  }
}

function saveCredentials(credentials) {
  if (!existsSync(CREDENTIALS_DIR)) {
    mkdirSync(CREDENTIALS_DIR, { recursive: true, mode: 0o700 });
  }
  writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), { encoding: "utf-8", mode: 0o600 });
  // Ensure permissions even if file already existed
  chmodSync(CREDENTIALS_FILE, 0o600);
}

function deleteCredentials() {
  if (existsSync(CREDENTIALS_FILE)) {
    unlinkSync(CREDENTIALS_FILE);
  }
}

function openBrowser(url) {
  const platform = process.platform;

  if (platform === "darwin") {
    exec(`open "${url}"`);
  } else if (platform === "win32") {
    exec(`start "" "${url}"`);
  } else {
    exec(`xdg-open "${url}"`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function authLogin(argv) {
  const authServer = argv.authServer || process.env[AUTH_SERVER_VARIABLE] || DEFAULT_AUTH_SERVER;

  console.log("🔐 Starting device authorization flow...\n");

  // Step 1: Request a device code from the auth server
  let deviceCode;
  let userCode;
  let verificationUri;
  let expiresIn;
  let interval;

  try {
    const response = await fetch(`${authServer}/device/code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Failed to start authorization (${response.status}): ${error}`);
      process.exit(1);
    }

    const data = await response.json();
    deviceCode = data.device_code;
    userCode = data.user_code;
    verificationUri = data.verification_uri;
    expiresIn = data.expires_in;
    interval = data.interval || 5;
  } catch (error) {
    console.error(`❌ Could not reach auth server at ${authServer}: ${error.message}`);
    process.exit(1);
  }

  // Step 2: Show the user code and open browser
  console.log("  Your authorization code:\n");
  console.log("    ┌─────────────────┐");
  console.log(`    │    ${userCode}    │`);
  console.log("    └─────────────────┘\n");
  console.log("  Open this URL and enter the code above:");
  console.log(`  ${verificationUri}\n`);

  openBrowser(`${verificationUri}?code=${encodeURIComponent(userCode)}`);

  console.log("  Waiting for authorization...\n");

  // Step 3: Poll for the token
  const deadline = Date.now() + expiresIn * 1000;

  while (Date.now() < deadline) {
    await sleep(interval * 1000);

    try {
      const response = await fetch(`${authServer}/device/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_code: deviceCode }),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        saveCredentials({
          accessToken: data.access_token,
          apiUrl: data.api_url || DEFAULT_API_URL,
          organizationId: data.organization_id,
        });

        console.log("✅ Successfully authenticated!");
        console.log(`📁 Credentials saved to ${CREDENTIALS_FILE}`);
        if (data.organization_id) {
          console.log(`🏢 Organization ID: ${data.organization_id}`);
        }
        return;
      }

      if (data.error === "authorization_pending") {
        continue;
      }

      if (data.error === "expired_token") {
        console.error("❌ Authorization expired. Please try again.");
        process.exit(1);
      }

      // Unknown error
      console.error(`❌ Authorization failed: ${data.error}`);
      process.exit(1);
    } catch {
      // Network error during poll — keep trying
      continue;
    }
  }

  console.error("❌ Authorization timed out. Please try again.");
  process.exit(1);
}

export async function authLogout() {
  const creds = loadCredentials();
  if (!creds) {
    console.log("ℹ️  No stored credentials found.");
    return;
  }

  deleteCredentials();
  console.log("✅ Credentials removed.");
}

export async function authStatus() {
  const envKey = process.env[API_KEY_VARIABLE];
  const creds = loadCredentials();

  let apiKey;
  let apiUrl;

  if (creds) {
    console.log("🔐 Authentication method: OAuth2");
    console.log(`📡 API URL: ${creds.apiUrl}`);
    console.log(`🔑 Token: ${creds.accessToken.substring(0, 8)}...`);
    if (creds.organizationId) {
      console.log(`🏢 Organization: ${creds.organizationId}`);
    }
    console.log(`📁 Credentials file: ${CREDENTIALS_FILE}`);
    apiKey = creds.accessToken;
    apiUrl = creds.apiUrl;
  } else if (envKey) {
    console.log("🔑 Authentication method: API Key (environment variable)");
    console.log(`🔑 Key: ${envKey.substring(0, 8)}...`);
    apiKey = envKey;
    apiUrl = process.env[API_URL_VARIABLE] || DEFAULT_API_URL;
  } else {
    console.log("❌ Not authenticated.");
    console.log("\nOptions:");
    console.log(`  1. OAuth2: ${PROGRAM} auth:login`);
    console.log(`  2. API Key: export ${API_KEY_VARIABLE}=your_api_key`);
    return;
  }

  // Verify credentials by calling the integrations endpoint
  console.log("\n🔄 Verifying credentials...");
  try {
    const response = await fetch(`${apiUrl}/public/v1/integrations`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
    });

    if (response.ok) {
      const integrations = await response.json();
      console.log(`✅ Credentials are valid. ${integrations.length} integration(s) connected.`);
    } else if (response.status === 401 || response.status === 403) {
      console.log("❌ Credentials are expired or invalid. Please re-authenticate.");
      if (creds) {
        console.log(`   Run: ${PROGRAM} auth:login`);
      } else {
        console.log(`   Update your ${API_KEY_VARIABLE} environment variable.`);
      }
    } else {
      const error = await response.text();
      console.log(`⚠️  Could not verify credentials (HTTP ${response.status}): ${error}`);
    }
  } catch (error) {
    console.log(`⚠️  Could not reach API to verify credentials: ${error.message}`);
  }
}
