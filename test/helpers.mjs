import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("../", import.meta.url));
export const BIN = path.join(ROOT, "bin", "ihateposting-agent.mjs");
export const KEY = "a".repeat(64);
export const TOKEN = `pos_${"T".repeat(40)}`;

/** A stand-in for the API on this computer: every request is kept (method, path, query, headers, body) and answered by `handler`. */
export async function startFakeApi(handler) {
  const requests = [];
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks);
    const url = new URL(req.url, "http://x");
    const seen = { method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams), headers: req.headers, raw, text: raw.toString("utf8") };
    try {
      seen.json = seen.text && String(req.headers["content-type"]).includes("json") ? JSON.parse(seen.text) : undefined;
    } catch {
      seen.json = undefined;
    }
    requests.push(seen);
    const answer = (await handler(seen)) ?? { status: 200, body: {} };
    res.writeHead(answer.status ?? 200, { "Content-Type": "application/json", ...(answer.headers ?? {}) });
    res.end(typeof answer.body === "string" ? answer.body : JSON.stringify(answer.body ?? {}));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    requests,
    close: () => new Promise((resolve) => (server.closeAllConnections?.(), server.close(resolve))),
  };
}

// Every folder a test makes is removed when the test file's process ends (a full run used to leave tens of thousands of them, and some hold files of 50 MB: it filled a disk).
const madeFolders = [];
process.on("exit", () => {
  for (const folder of madeFolders) {
    try {
      fs.rmSync(folder, { recursive: true, force: true });
    } catch {
      // a folder that cannot be removed now is left, never an error of the test
    }
  }
});
export const tempDir = () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "ihp-agent-test-"));
  madeFolders.push(folder);
  return folder;
};

/** What a person's computer holds for the program: a home folder of its own (the sign-in is kept in `<home>/.ihateposting`). */
export const credentialsFile = (home) => path.join(home, ".ihateposting", "credentials.json");

/**
 * Runs the program the way a terminal would: a child process of its own, a home folder of its own, and none of the three variables unless given.
 * The browser is never opened: `ComSpec` (what Windows starts a command with) is Node itself, which cannot run `start "" "<address>"`.
 */
export function run(argv, { env = {}, home = tempDir(), timeout = 30_000 } = {}) {
  return new Promise((resolve) => {
    const childEnv = { ...process.env, HOME: home, USERPROFILE: home, ...env };
    for (const name of Object.keys(childEnv)) if (/^comspec$/i.test(name)) delete childEnv[name]; // whatever case the system spells it in
    childEnv.ComSpec = process.execPath;
    for (const name of ["IHATEPOSTING_API_KEY", "IHATEPOSTING_API_URL", "IHATEPOSTING_AUTH_SERVER"]) if (!(name in env)) delete childEnv[name];
    const child = spawn(process.execPath, [BIN, ...argv], { env: childEnv, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    const timer = setTimeout(() => child.kill(), timeout);
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, home });
    });
  });
}

/** The JSON that follows the header line (or the whole output, when there is no header). */
export function jsonOf(stdout) {
  const at = stdout.search(/^[\[{]/m);
  return at >= 0 ? JSON.parse(stdout.slice(at)) : undefined;
}
