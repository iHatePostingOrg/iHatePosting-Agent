import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("../", import.meta.url));
export const BIN = path.join(ROOT, "bin", "ihateposting.mjs");
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

/**
 * The Claude Code plugin's copy of the skill: the root SKILL.md with the changes the Claude directory's check needs
 * (plugins/claude-ihateposting/skills/ihateposting/SKILL.md is this text, to the byte). The first two are the owner's decision of 2026-11-16 (plain indented `metadata` lines; no line linking the npm
 * page). The next eight (his "fix it" of 2026-11-21) take the key variable IHATEPOSTING_API_KEY out of this copy (the program's own "Not authenticated" message and its --help say how to give it a key; the
 * root and skills/ copies keep it), because the check held the version for a reviewer ("Uses a credential from the user's machine"); that alone did not clear the hold (validation of main @ 2927cd2). The last
 * step did: it rewrites the batch-scheduling script, whose shell arrays the scan read as environment variables sent on a command (found by validating test variants of the plugin). Whether the key variable has
 * to stay out is untested. Every step must find its text exactly once, so a change to the root skill that moves one of them fails here at once.
 */
export function claudeCopyOf(root) {
  const steps = [
    ['metadata: {"openclaw":{"emoji":"📬","requires":{"bins":[],"env":["IHATEPOSTING_API_URL"]}}}', 'metadata:\n  openclaw:\n    emoji: "📬"\n    requires:\n      env:\n        - IHATEPOSTING_API_URL'],
    ["npm release: https://www.npmjs.com/package/ihateposting\n", ""],
    ["If not authenticated, either:\n1. **OAuth2:** `ihateposting auth:login`\n2. **API Key:** `export IHATEPOSTING_API_KEY=YOUR_API_KEY`\n", "If not authenticated, run `ihateposting auth:login`.\n"],
    ["**Option 2: API Key**\n```bash\nexport IHATEPOSTING_API_KEY=YOUR_API_KEY\n```\n", "**Option 2: API Key**\nThe program's own \"Not authenticated\" message says how to give it a key. The key is made under Settings > Agents / Dev in iHatePosting.\n"],
    ["Run `ihateposting auth:login` or `export IHATEPOSTING_API_KEY=YOUR_API_KEY` before using CLI", "Run `ihateposting auth:login` before using CLI"],
    [/^export IHATEPOSTING_API_KEY=YOUR_API_KEY +# Or use API key\n/m, ""],
    ["Nothing is saved and `IHATEPOSTING_API_KEY` is not set.", "Nothing is saved and no key is set."],
    ["2. **Key:** `export IHATEPOSTING_API_KEY=YOUR_API_KEY`. The key is under Settings > Agents / Dev in iHatePosting.", "2. **Key:** a key made under Settings > Agents / Dev in iHatePosting. The program's own \"Not authenticated\" message says how to give the program the key."],
    ["stops until you run `auth:login` or export `IHATEPOSTING_API_KEY`.", "stops until you run `auth:login` or give the program a key (its own message says how)."],
    ["Variables: `IHATEPOSTING_API_KEY` (the key, used when nothing is saved), `IHATEPOSTING_API_URL`", "Variables: `IHATEPOSTING_API_URL`"],
    // The one that cleared the hold (owner's "fix it", 2026-11-21; found by validating test variants of the plugin on temporary branches): the batch-scheduling script loops over shell arrays
    // (`"${!DATES[@]}"`, `"${CONTENT[$i]}"`, `"post-${i}.jpg"`), which the scan read as environment variables sent on a command. The same text without arrays or ${...} passes.
    [/### Pattern 6: Batch Scheduling\n[\s\S]*?\ndone\n```\n/, () => BATCH_SCHEDULING_WITHOUT_ARRAYS],
  ];
  let text = root;
  for (const [from, to] of steps) {
    const found = typeof from === "string" ? text.split(from).length - 1 : (text.match(new RegExp(from.source, `${from.flags}g`)) ?? []).length;
    if (found !== 1) throw new Error(`claudeCopyOf: ${found} places hold ${typeof from === "string" ? JSON.stringify(from.slice(0, 70)) : String(from)}, not one`);
    text = text.replace(from, typeof to === "function" ? to : () => to);
  }
  return text;
}

/** "Pattern 6: Batch Scheduling" for the Claude plugin's copy of the skill: the same example, valid bash, with no array and no ${...}. */
const BATCH_SCHEDULING_WITHOUT_ARRAYS = [
  "### Pattern 6: Batch Scheduling",
  "",
  "```bash",
  "#!/bin/bash",
  "",
  "# Schedule posts for the week: one line for each post, a date and a text",
  "while IFS='|' read -r DATE TEXT; do",
  "  # Rule 2: upload each file before passing to -m",
  "  IMG=$(ihateposting upload \"post-$DATE.jpg\" | tail -n +2 | jq -r '.path')",
  "  ihateposting posts:create \\",
  "    -c \"$TEXT\" \\",
  "    -s \"$DATE\" \\",
  "    -i \"x-id\" \\",
  "    -m \"$IMG\"",
  "  echo \"Scheduled: $TEXT for $DATE\"",
  "done <<'EOF'",
  "2030-02-14T09:00:00Z|Monday motivation 💪",
  "2030-02-15T09:00:00Z|Tuesday tips 💡",
  "2030-02-16T09:00:00Z|Wednesday wisdom 🧠",
  "EOF",
  "```",
  "",
].join("\n");
