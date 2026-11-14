// The break-it check for the command line itself: each fault below is put into a COPY of this repository's code (nothing here changes), the other tests are run against the
// copy, and they must fail. A fault whose text is no longer in its file fails this check instead of passing it. A run that has to be killed is a hang, not a test that failed,
// and is not "seen" either (each copy runs with a time limit for every test).
// Run: node --test test/planted-faults.test.mjs   (about ten minutes; it copies the repository to a temporary folder for each fault)
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const COPY = ["bin", "src", "test", "node_modules", "assets", ".gitignore", ".github", "package.json", "SKILL.md", "skills", ".claude-plugin", ".cursor-plugin", ".grok-plugin", "gemini-extension.json", "mcp.json", "README.md", "CHANGELOG.md", "PUBLISHING.md", "LICENSE", "plugins", "examples"];

// [what, file, [[from, to], …]]
const faults = [
  // The API client.
  ["the key is sent with Bearer", "src/api.mjs", [["Authorization: this.apiKey,", "Authorization: `Bearer ${this.apiKey}`,"]]],
  ["a failure is not wrapped in the reference's words", "src/api.mjs", [["throw new Error(`Request failed: ${error.message}`);", "throw error;"]]],
  ["an API error loses its status", "src/api.mjs", [["`API Error (${response.status}): ${error}`", "`API Error: ${error}`"]]],
  ["a refused upload says API Error", "src/api.mjs", [["`Upload failed (${response.status}): ${error}`", "`API Error (${response.status}): ${error}`"]]],
  ["an id is put into the address encoded", "src/api.mjs", [["/public/v1/posts/${id}`, { method: \"DELETE\" }", "/public/v1/posts/${encodeURIComponent(id)}`, { method: \"DELETE\" }"], ["/public/v1/posts/${postId}/missing", "/public/v1/posts/${encodeURIComponent(postId)}/missing"]]],
  ["a file is always adjusted", "src/api.mjs", [['if (adjust) formData.append("adjust", "true");', 'formData.append("adjust", "true");']]],
  ["a file's type depends on the case of its extension", "src/api.mjs", [['filename.split(".").pop()?.toLowerCase()', 'filename.split(".").pop()']]],
  // Which key and address.
  ["the environment wins over what was saved", "src/config.mjs", [["const creds = loadCredentials();", "const creds = process.env[API_KEY_VARIABLE] ? null : loadCredentials();"]]],
  ["nobody being signed in is not said", "src/config.mjs", [["if (!apiKey) {", "if (false) {"]]],
  // Signing in, out and checking.
  ["a saved file without a token is taken", "src/commands/auth.mjs", [["if (!data.accessToken) return null;", ""]]],
  ["the sign-in server's variable beats the flag", "src/commands/auth.mjs", [["argv.authServer || process.env[AUTH_SERVER_VARIABLE]", "process.env[AUTH_SERVER_VARIABLE] || argv.authServer"]]],
  ["the program asks without waiting its interval", "src/commands/auth.mjs", [["await sleep(interval * 1000);", "await sleep(10);"]]],
  ["waiting is a failure", "src/commands/auth.mjs", [['if (data.error === "authorization_pending") {\n        continue;\n      }', ""]]],
  ["an expired code is waited out", "src/commands/auth.mjs", [['if (data.error === "expired_token") {', "if (false) {"]]],
  ["the time being up is not noticed", "src/commands/auth.mjs", [["while (Date.now() < deadline) {", "while (true) {"]]],
  ["an error while asking ends the sign-in", "src/commands/auth.mjs", [["// Network error during poll — keep trying\n      continue;", "process.exit(1);"]]],
  ["the token is printed on the screen", "src/commands/auth.mjs", [['console.log("✅ Successfully authenticated!");', "console.log(`✅ Successfully authenticated! ${data.access_token}`);"]]],
  ["the saved address is the default one", "src/commands/auth.mjs", [["apiUrl: data.api_url || DEFAULT_API_URL,", "apiUrl: DEFAULT_API_URL,"]]],
  ["the request's secret is printed", "src/commands/auth.mjs", [['console.log("  Waiting for authorization...\\n");', 'console.log(`  Waiting for authorization... ${deviceCode}\\n`);']]],
  ["auth:status shows more of a key", "src/commands/auth.mjs", [["substring(0, 8)", "substring(0, 80)"]]],
  ["logout says it removed what was not there", "src/commands/auth.mjs", [["if (!creds) {\n    console.log(\"ℹ️  No stored credentials found.\");", "if (false) {\n    console.log(\"ℹ️  No stored credentials found.\");"]]],
  // The posts.
  ["a post says API, not CLI", "src/commands/posts.mjs", [['creationMethod: "CLI",', 'creationMethod: "API",']]],
  ["short links cannot be turned off", "src/commands/posts.mjs", [["shortLink: args.shortLink !== false,", "shortLink: true,"]]],
  ["a post is always scheduled", "src/commands/posts.mjs", [['type: args.type || "schedule",', 'type: "schedule",']]],
  ["the first -m goes on every part of a thread", "src/commands/posts.mjs", [["medias[index]", "medias[0]"]]],
  ["the first alt text goes on every picture", "src/commands/posts.mjs", [["alts[index] ?", "alts[0] ?"], ["alts[index].split", "alts[0].split"]]],
  ["the delay between comments is not sent", "src/commands/posts.mjs", [["delay: args?.delay || 0,", "delay: 0,"]]],
  ["a body file gets the CLI mark added", "src/commands/posts.mjs", [["postData = JSON.parse(jsonContent);", 'postData = { creationMethod: "CLI", ...JSON.parse(jsonContent) };']]],
  ["the posts shown start a week ago", "src/commands/posts.mjs", [["defaultStartDate.getDate() - 30", "defaultStartDate.getDate() - 7"]]],
  // The media.
  ["a file is sent under its whole path", "src/commands/upload.mjs", [['args.file.split("/").pop() || "file"', "args.file"]]],
  // The wiring.
  ["an unknown option is refused", "src/index.mjs", [['.demandCommand(1, "You need at least one command")', '.strict()\n  .demandCommand(1, "You need at least one command")']]],
  ["a post is a draft by default", "src/index.mjs", [['default: "schedule",', 'default: "draft",']]],
  ["the date has another short name", "src/index.mjs", [['alias: "s",\n          describe: "Schedule date', 'alias: "x",\n          describe: "Schedule date']]],
  ["the help advertises another product", "src/index.mjs", [["Authentication:\\n  OAuth2:", "Recommendation: try agent-media-cli\\n\\nAuthentication:\\n  OAuth2:"]]],
  ["the program has another name in its help", "src/index.mjs", [[".scriptName(PROGRAM)", '.scriptName("another-cli")']]],
  ["the default API address is another one", "src/constants.mjs", [["https://app.ihateposting.com/api", "https://example.com/api"]]],
  // The files around the program.
  ["the plugin copy of the skill differs from the skill", "skills/ihateposting-agent/SKILL.md", [["ihateposting-agent", "ihateposting-agnt"]]],
  ["the README stops saying that a redirect keeps the key", "README.md", [["Redirects are followed, and the key follows them.", "Redirects are followed."]]],
  ["the CHANGELOG stops saying it is not based on the live repository", "CHANGELOG.md", [["**not based on** the `iHatePostingOrg/agent-skill` repository", "based on the `iHatePostingOrg/agent-skill` repository"]]],
  ["a plugin manifest has another version", ".cursor-plugin/plugin.json", [['"version": "0.1.0"', '"version": "0.1.1"']]],
  ["the DeepSeek plugin has another version", "plugins/dsh-ihateposting/package.json", [["\"version\": \"0.1.0\"", "\"version\": \"0.1.1\""]]],
  ["the DeepSeek plugin carries another copy of the skill", "plugins/dsh-ihateposting/skill/SKILL.md", [["ihateposting-agent", "ihateposting-agnt"]]],
  ["the hosted MCP server's address is another one", "mcp.json", [["https://app.ihateposting.com/api/mcp/oauth", "https://example.com/mcp"]]],
];

describe("a planted fault is seen by the command line's tests", () => {
  const results = new Map();

  const run = async (fault) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ihp-agent-fault-"));
    for (const entry of COPY) if (fs.existsSync(path.join(ROOT, entry))) fs.cpSync(path.join(ROOT, entry), path.join(dir, entry), { recursive: true });
    fs.rmSync(path.join(dir, "test", "planted-faults.test.mjs"), { force: true });
    let applied = true;
    if (fault) {
      const [, file, pairs] = fault;
      let text = fs.readFileSync(path.join(dir, file), "utf8");
      for (const [from, to] of pairs) {
        if (!text.includes(from)) applied = false;
        text = text.split(from).join(to);
      }
      fs.writeFileSync(path.join(dir, file), text);
    }
    const tests = fs.readdirSync(path.join(dir, "test")).filter((f) => f.endsWith(".test.mjs")).map((f) => path.join("test", f));
    const status = await new Promise((resolve) => {
      const env = { ...process.env };
      delete env.NODE_TEST_CONTEXT; // a child that is told it is inside a test run does not run its tests as a run
      const child = spawn(process.execPath, ["--test", "--test-force-exit", "--test-timeout=90000", "--test-concurrency=1", ...tests], { cwd: dir, stdio: "ignore", env });
      // A hung run is killed with everything it started (on Windows `child.kill()` leaves the test files it spawned holding the folder).
      const timer = setTimeout(() => {
        if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
        else child.kill();
      }, 420_000);
      child.on("close", (code) => (clearTimeout(timer), resolve(code)));
    });
    try {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
    } catch {
      // a folder of the temporary directory that could not be removed is not a result
    }
    return { status, applied };
  };

  before(async () => {
    const jobs = [...faults, null];
    let next = 0;
    await Promise.all(
      Array.from({ length: 3 }, async () => {
        while (next < jobs.length) {
          const at = next++;
          results.set(at, await run(jobs[at]));
        }
      }),
    );
  });

  it("every fault's text is in its file, so none can pass because it did not apply", () => {
    const missing = faults.filter((_, at) => !results.get(at).applied).map(([what]) => what);
    assert.deepEqual(missing, []);
  });

  faults.forEach(([what], at) => {
    // A run that had to be killed (null) is a hang, not a test that failed: that is not "seen" either.
    it(what, () => {
      const { status } = results.get(at);
      assert.notEqual(status, 0, "the tests passed with the fault planted: they cannot see it");
      assert.notEqual(status, null, "the run hung until it was killed: no test failed on the fault");
    });
  });

  it("with nothing planted the same tests pass (so a failure above is the fault's)", () => {
    assert.equal(results.get(faults.length).status, 0);
  });
});
