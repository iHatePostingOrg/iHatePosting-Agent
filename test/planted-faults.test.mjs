// The break-it check for the command line itself: each fault below is put into a COPY of this repository's code (nothing here changes), the other tests are run against the
// copy, and they must fail. A fault whose text is no longer in its file fails this check instead of passing it. A run that has to be killed is a hang, not a test that failed,
// and is not "seen" either (each copy runs with a time limit for every test).
// Run: node --test test/planted-faults.test.mjs   (about an hour and a half on the owner's PC, measured 2026-11-16 for 220 runs; it copies the repository to a temporary folder for each fault)
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { pluginFaults } from "./plugin-faults.mjs";
import { submissionFaults } from "./submission-faults.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
// Everything the repository holds except its git history (the documents and the plugin folders are read by the tests too).
const COPY = fs.readdirSync(ROOT).filter((entry) => entry !== ".git");

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
  ["the missing-sign-in message names options that auth:login does not have", "src/config.mjs", [["auth:login`);", "auth:login --client-id <id> --client-secret <secret>`);"]]],
  ["a guide shows the missing-sign-in message with options that auth:login does not have", "HOW_TO_RUN.md", [["OAuth2: ihateposting-agent auth:login", "OAuth2: ihateposting-agent auth:login --client-id <id> --client-secret <secret>"]]],
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
  ["the plugin copy of the skill differs from the skill", "skills/ihateposting/SKILL.md", [["ihateposting-agent", "ihateposting-agnt"]]],
  ["the page that says what following the other command line costs stops saying that a redirect keeps the key", "HOW_TO_RUN.md", [["Redirects are followed, and the key follows them.", "Redirects are followed."]]],
  ["the CHANGELOG stops saying it is not based on the live repository", "CHANGELOG.md", [["**not based on** the `iHatePostingOrg/agent-skill` repository", "based on the `iHatePostingOrg/agent-skill` repository"]]],
  ["a plugin manifest has another version", ".cursor-plugin/plugin.json", [['"version": "0.1.1"', '"version": "0.1.2"']]],
  ["the DeepSeek plugin has another version", "plugins/dsh-ihateposting/package.json", [["\"version\": \"0.1.1\"", "\"version\": \"0.1.2\""]]],
  ["a document links to a file that is not there", "README.md", [["(./PUBLISHING.md)", "(./PUBLISHING_GONE.md)"]]],
  ["the README shows another logo file", "README.md", [["<img src=\"assets/logo.png\"", "<img src=\"assets/logo.svg\""]]],
  ["a document names the command line it was shaped on", "SUMMARY.md", [["# iHatePosting CLI - Creation Summary", "# iHatePosting CLI - Creation Summary, after pos" + "tiz"]]],
  ["a document holds a key-looking text", "SUMMARY.md", [["# iHatePosting CLI - Creation Summary", "# iHatePosting CLI - Creation Summary " + "0123456789abcdef".repeat(4)]]],
  ["a document names an example file that is not there", "PROVIDER_SETTINGS.md", [["A body file for it is in [examples/tiktok-video.json](examples/tiktok-video.json).", "A body file for it is in examples/gone-video.json (see the examples folder)."]]],
  ["a manifest loses the author's address", "plugins/claude-ihateposting/.claude-plugin/plugin.json", [['    "email": "support@ihateposting.com",\n    "url"', '    "url"']]],
  ["a platform keyword is dropped from the npm package", "package.json", [['    "tumblr",\n', ""]]],
  ["a manifest counts another number of platforms", "gemini-extension.json", [["across 15 platforms", "across 28+ platforms"]]],
  ["the author's address is in a document", "SUMMARY.md", [["# iHatePosting CLI - Creation Summary", "# iHatePosting CLI - Creation Summary, by support@ihateposting.com"]]],
  ["the licence names the person", "LICENSE", [["Copyright (c) 2026 iHatePostingOrg", "Copyright (c) 2026 Parag Hasmukhbhai Gajera"]]],
  ["a platform the product does not have is a keyword", "plugins/dsh-ihateposting/package.json", [['    "slack",\n', '    "slack",\n    "reddit",\n']]],
  ["a plugin manifest still carries the old plugin name", "plugins/claude-ihateposting/.claude-plugin/plugin.json", [['"name": "ihateposting",', '"name": "ihateposting-agent",']]],
  ["the Gemini extension still carries the old plugin name", "gemini-extension.json", [['"name": "ihateposting",', '"name": "ihateposting-agent",']]],
  ["a marketplace loses its own name", ".grok-plugin/marketplace.json", [['{\n  "name": "ihateposting-agent",', '{\n  "name": "ihateposting",']]],
  ["a marketplace entry keeps the old plugin name", ".cursor-plugin/marketplace.json", [['"name": "ihateposting",\n      "source"', '"name": "ihateposting-agent",\n      "source"']]],
  ["the README install line names the old plugin", "README.md", [["/plugin install ihateposting@ihateposting-agent", "/plugin install ihateposting-agent@ihateposting-agent"]]],
  ["a manifest points at the old skill folder", ".cursor-plugin/plugin.json", [['"./skills/ihateposting"', '"./skills/ihateposting-agent"']]],
  ["the skill's name no longer matches its folder", "skills/ihateposting/SKILL.md", [["---\nname: ihateposting\n", "---\nname: ihateposting-agent\n"]]],
  ["the sync workflow copies to the old folder", ".github/workflows/sync-skill.yml", [["cp SKILL.md skills/ihateposting/SKILL.md", "cp SKILL.md skills/ihateposting-agent/SKILL.md"]]],
  ["the sync workflow writes the DeepSeek copy again", ".github/workflows/sync-skill.yml", [["cp SKILL.md skills/ihateposting/SKILL.md", "cp SKILL.md skills/ihateposting/SKILL.md\n          cp SKILL.md plugins/dsh-ihateposting/skill/SKILL.md"]]],
  ["the sync workflow starts on a release again", ".github/workflows/sync-skill.yml", [["on:\n  workflow_dispatch:", "on:\n  release:\n    types: [published]\n  workflow_dispatch:"]]],
  ["the publish workflow starts on a release again", ".github/workflows/publish-npm.yml", [["on:\n  workflow_dispatch:", "on:\n  release:\n    types: [published]\n  workflow_dispatch:"]]],
  ["the publish workflow no longer checks the version asked for", ".github/workflows/publish-npm.yml", [["WANTED_VERSION", "WANTED_VERSIN"]]],
  ["the DeepSeek skill copy is back", "plugins/dsh-ihateposting/package.json", [['"README.md",', '"README.md",\n    "skill/",']]],
  ["a guide says four copies of the skill again", "PUBLISHING.md", [["The three copies of the skill are the same text", "The four copies of the skill are the same text"]]],
  ["a guide says the workflows run on a release again", "PUBLISHING.md", [["run only when started by hand", "run when a release is published on GitHub"]]],
  ["a document names the old skill folder", "SUMMARY.md", [["`skills/ihateposting/SKILL.md` is what", "`skills/ihateposting-agent/SKILL.md` is what"]]],
  ["the Qwen Code install line is gone", "README.md", [["qwen extensions install iHatePostingOrg/iHatePosting-Agent:ihateposting\n", "\n"]]],
  ["the Qwen Code install line names the old plugin", "README.md", [["qwen extensions install iHatePostingOrg/iHatePosting-Agent:ihateposting\n", "qwen extensions install iHatePostingOrg/iHatePosting-Agent:ihateposting-agent\n"]]],
  ["the Qwen Code section is put in another place", "README.md", [["### Qwen Code\n", "### Qwen Code (moved)\n"]]],
  ["the npm package takes the name of the live app's own command line", "package.json", [['"name": "ihateposting-agent",', '"name": "ihateposting",']]],
  ["the command takes the name of the live app's own command line", "package.json", [['"ihateposting-agent": "bin/ihateposting-agent.mjs"', '"ihateposting": "bin/ihateposting-agent.mjs"']]],
  ["the program calls itself by the name of the live app's own command line", "src/constants.mjs", [['export const PROGRAM = "ihateposting-agent";', 'export const PROGRAM = "ihateposting";']]],
  ["a tool link in the README's header row points at another page", "README.md", [['https://ihateposting.com/ai-agents/claude-code"', 'https://ihateposting.com/ai-agents/claude-codes"']]],
  ["the README renames a heading", "README.md", [["## Install as a skill\n", "## Add it to your agent as a skill\n"]]],
  ["the README brings Reddit back", "README.md", [["### Pinterest\n", "### Reddit\n"]]],
  ["the README says --adjust re-encodes", "README.md", [["`--adjust` is accepted (it is off by default), but iHatePosting does no adjusting", "`--adjust` re-encodes the video to H.264"]]],
  ["a README example reads the upload answer without skipping the header line", "README.md", [["RESULT=$(ihateposting-agent upload video.mp4 | tail -n +2)", "RESULT=$(ihateposting-agent upload video.mp4)"]]],
  ["a manifest's homepage is not the website", ".cursor-plugin/plugin.json", [['"homepage": "https://ihateposting.com"', '"homepage": "https://example.com"']]],
  ["the README installs the live app's own package", "README.md", [["npm install -g ihateposting-agent\n", "npm install -g ihateposting\n"]]],
  ["the quick start installs the live app's own package", "QUICK_START.md", [["npm install -g ihateposting-agent", "npm install -g ihateposting"]]],
  ["a guide promises a local package for the MCP server", "HOW_TO_RUN.md", [["### The MCP server without a plugin\n", "### The MCP server without a plugin\n\nInstall it with `npm install -g ihateposting-mcp`.\n"]]],
  ["the publishing guide says the package is the live app's own", "PUBLISHING.md", [["| `name` | What people type after `npm install` | `ihateposting-agent` |", "| `name` | What people type after `npm install` | `ihateposting` |"]]],
  ["the publishing guide stops saying the live app's package is not replaced", "PUBLISHING.md", [["and this package does not replace it", "and this package replaces it"]]],
  ["the publishing guide offers a local MCP package", "PUBLISHING.md", [["This repository has no such package and does not publish one", "This repository publishes it too"]]],
  ["the hosted MCP server's address is another one", "mcp.json", [["https://app.ihateposting.com/api/mcp/oauth", "https://example.com/mcp"]]],
  // The files prepared for the submissions (their faults are listed in submission-faults.mjs).
  ...submissionFaults,
  ...pluginFaults,
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
      let text = fs.readFileSync(path.join(dir, file), "utf8").replace(/\r\n/g, "\n"); // the faults are written with \n: a CRLF working copy (Windows autocrlf) would never match their text
      for (const [from, to] of pairs) {
        if (!text.includes(from)) applied = false;
        text = text.split(from).join(to);
      }
      fs.writeFileSync(path.join(dir, file), text);
    }
    const tests = fs.readdirSync(path.join(dir, "test")).filter((f) => f.endsWith(".test.mjs")).map((f) => path.join("test", f));
    // the DeepSeek plugin has tests of its own, which see the faults planted in it
    tests.push(path.join("plugins", "dsh-ihateposting", "test", "index.test.mjs"));
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
