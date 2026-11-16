// The files prepared for the submissions (PUBLISHING.md, "Submissions"): the ChatGPT and Codex plugin folder, the script that builds its ZIP, the draft `server.json`
// for the MCP Registry, and the section of PUBLISHING.md that tells the owner what to do. None of it needs the network, a sign-in or the hosted server.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import zlib from "node:zlib";
import { DEFAULT_OUT, DEFAULT_SOURCE, KNOWN_TOOLS, LIMITS, buildPluginZip, collect, crc32, readZip, validatePlugin } from "../scripts/chatgpt-plugin-zip.mjs";
import { ROOT, tempDir } from "./helpers.mjs";

const SCRIPT = path.join(ROOT, "scripts", "chatgpt-plugin-zip.mjs");
const OTHER_PRODUCT = ["Post", "iz"].join(""); // the public repository never names the other product; spelled in two pieces so this file does not either
const HOSTED = "https://app.ihateposting.com/api/mcp/oauth";
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const json = (file) => JSON.parse(read(file));
const walkFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walkFiles(path.join(dir, e.name)) : [path.join(dir, e.name)]));

/** A copy of the plugin folder to break. */
const copyPlugin = () => {
  const dest = path.join(tempDir(), "plugin");
  fs.cpSync(DEFAULT_SOURCE, dest, { recursive: true });
  return dest;
};
const editJson = (dest, file, change) => {
  const full = path.join(dest, file);
  const value = JSON.parse(fs.readFileSync(full, "utf8"));
  change(value);
  fs.writeFileSync(full, JSON.stringify(value, null, 2));
};
const openai = (value) => value.extensions["com.openai"];
const runScript = (args) => {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8", timeout: 60_000 });
  return { code: r.status, out: r.stdout, err: r.stderr };
};
const pngOf = (width, height) => {
  const png = Buffer.alloc(40);
  png.writeUInt32BE(0x89504e47, 0);
  png.writeUInt32BE(0x0d0a1a0a, 4);
  png.writeUInt32BE(13, 8);
  png.write("IHDR", 12);
  png.writeUInt32BE(width, 16);
  png.writeUInt32BE(height, 20);
  return png;
};

describe("the ChatGPT and Codex plugin folder", () => {
  const plugin = json("plugins/chatgpt-ihateposting/plugin.json");
  const ui = openai(plugin).interface;

  it("passes every check the ZIP script makes (OpenAI's published package rules)", () => {
    assert.deepEqual(validatePlugin(DEFAULT_SOURCE), []);
  });

  it("is a new plugin of its own: portable manifest, name `ihateposting`, version 1.0.0, MIT, no hooks and no app files", () => {
    assert.equal(plugin.$schema, "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json");
    assert.equal(plugin.name, "ihateposting");
    assert.equal(plugin.version, "1.0.0");
    assert.equal(plugin.license, "MIT");
    assert.equal(plugin.repository, "https://github.com/iHatePostingOrg/iHatePosting-Agent");
    assert.equal(openai(plugin).hooks, undefined);
    assert.equal(openai(plugin).apps, undefined);
    assert.ok(!fs.existsSync(path.join(DEFAULT_SOURCE, ".app.json")) && !fs.existsSync(path.join(DEFAULT_SOURCE, "hooks")));
  });

  it("gives the listing the limits the portal checks, with the four company addresses that answered 200 and no demo link it cannot have", () => {
    assert.ok(ui.displayName.length <= 30 && ui.shortDescription.length <= 30 && ui.longDescription.length <= 2000, "a listing text is too long for the Claude connector form either");
    assert.equal(ui.displayName, "iHatePosting");
    assert.deepEqual([ui.websiteURL, ui.supportURL, ui.privacyPolicyURL, ui.termsOfServiceURL], ["https://ihateposting.com", "https://ihateposting.com/contact", "https://ihateposting.com/privacy", "https://ihateposting.com/terms"]);
    assert.equal(openai(plugin).review.demo_recording_url, undefined, "a demo link is the owner's to make");
    assert.equal(openai(plugin).publication.countries, undefined);
    assert.equal(openai(plugin).review.commerce, false);
    assert.equal(openai(plugin).review.test_cases.positive.length, 5);
    assert.equal(openai(plugin).review.test_cases.negative.length, 3);
    assert.ok(ui.longDescription.includes("15 platforms"));
  });

  it("names, in its review cases, only tools the hosted server has, and the cases make a draft, never a published post", () => {
    for (const c of openai(plugin).review.test_cases.positive) for (const tool of c.tools_triggered.split(",").map((t) => t.trim())) assert.ok(KNOWN_TOOLS.includes(tool), `${tool} is not a tool of the server`);
    const draft = openai(plugin).review.test_cases.positive.find((c) => c.tools_triggered.includes("integrationSchedulePostTool"));
    assert.match(draft.prompt, /draft/i);
    assert.match(draft.prompt, /do not schedule or publish/i);
    assert.match(draft.expected_behavior, /type "draft"/);
  });

  it("points at the same hosted address as the root mcp.json, the Registry draft and the README, and signs in with OAuth and dynamic registration", () => {
    const mcp = json("plugins/chatgpt-ihateposting/mcp.json");
    const servers = Object.entries(mcp.mcpServers);
    assert.equal(servers.length, 1);
    const [name, server] = servers[0];
    assert.equal(name, "ihateposting");
    assert.equal(server.type, "streamable-http");
    assert.equal(server.url, HOSTED);
    assert.equal(json("mcp.json").ihateposting.url, server.url);
    assert.equal(json("server.json").remotes[0].url, server.url);
    assert.ok(read("README.md").includes(server.url));
    assert.deepEqual(server.extensions["com.openai"].auth, { type: "oauth", client: { mode: "dcr" } });
    assert.equal(server.headers, undefined, "a public submission rejects server headers");
    assert.ok(!/secret|token|apikey|password/i.test(JSON.stringify(mcp)), "mcp.json holds a secret");
  });

  it("has four skills named like their folders, whose tool names all exist, that never tell the model to use the command line or name another product", () => {
    const folders = fs.readdirSync(path.join(DEFAULT_SOURCE, "skills")).sort();
    assert.deepEqual(folders, ["create-post-media", "get-started", "manage-scheduled-posts", "schedule-posts"]);
    assert.equal(openai(plugin).onboardingSkill, "./skills/get-started/SKILL.md");
    for (const folder of folders) {
      const text = fs.readFileSync(path.join(DEFAULT_SOURCE, "skills", folder, "SKILL.md"), "utf8");
      assert.match(text, new RegExp(`^---\\nname: ${folder}\\ndescription: .+\\n---\\n`), folder);
      assert.ok(!text.includes("ihateposting-agent") && !text.includes(OTHER_PRODUCT) && !/\bBash\b/.test(text), `${folder} names the command line or another product`);
      for (const [, word] of text.matchAll(/`([A-Za-z]+)`/g)) if (/Tool$/.test(word) || ["integrationList", "groupList", "integrationSchema"].includes(word)) assert.ok(KNOWN_TOOLS.includes(word), `${folder} names the tool ${word}, which the server does not have`);
    }
    const all = folders.map((f) => fs.readFileSync(path.join(DEFAULT_SOURCE, "skills", f, "SKILL.md"), "utf8")).join("\n");
    for (const tool of ["integrationList", "integrationSchema", "integrationSchedulePostTool", "postsListTool", "postSettingsTool", "deletePostTool", "uploadFromUrlTool", "mediaListTool", "mediaStatusTool", "uploadWidgetTool", "uploadWidgetStatusTool", "triggerTool", "groupList"]) assert.ok(all.includes(tool), `no skill uses ${tool}`);
  });

  it("makes the person confirm before a delete and a draft of anything not clearly meant to go out", () => {
    const manage = fs.readFileSync(path.join(DEFAULT_SOURCE, "skills", "manage-scheduled-posts", "SKILL.md"), "utf8");
    assert.match(manage, /cannot be undone/i);
    assert.match(manage, /Ask them to confirm/);
    const schedule = fs.readFileSync(path.join(DEFAULT_SOURCE, "skills", "schedule-posts", "SKILL.md"), "utf8");
    assert.match(schedule, /Use this whenever the person did not clearly ask to publish/);
    assert.match(schedule, /Only when the person clearly asked for it/);
  });

  it("uses two copies of the repository's own logo: square, in the size range the portal accepts", () => {
    for (const file of ["logo.png", "icon.png"]) {
      const bytes = fs.readFileSync(path.join(DEFAULT_SOURCE, "assets", file));
      assert.ok(bytes.equals(fs.readFileSync(path.join(ROOT, "assets", "logo.png"))), `${file} is not the repository's logo`);
      assert.equal(bytes.readUInt32BE(16), bytes.readUInt32BE(20));
      assert.ok(bytes.readUInt32BE(16) >= 48 && bytes.readUInt32BE(16) <= 4096);
    }
  });

  it("holds no key, personal detail or other product's name in any of its files", () => {
    for (const file of walkFiles(DEFAULT_SOURCE)) {
      if (/\.png$/.test(file)) continue;
      const text = fs.readFileSync(file, "utf8");
      assert.ok(!text.includes(OTHER_PRODUCT) && !text.includes("@ihateposting.com") && !/pk_live_|sk-[A-Za-z0-9]{10,}|Bearer [A-Za-z0-9]{20,}/.test(text), file);
    }
  });
});

describe("the ZIP script", () => {
  it("collects exactly plugin.json, mcp.json, the skills and the assets; the folder's README stays out", () => {
    const names = collect(DEFAULT_SOURCE).map((e) => e.name);
    assert.deepEqual(names, ["assets/icon.png", "assets/logo.png", "mcp.json", "plugin.json", "skills/create-post-media/SKILL.md", "skills/get-started/SKILL.md", "skills/manage-scheduled-posts/SKILL.md", "skills/schedule-posts/SKILL.md"]);
    assert.ok(fs.existsSync(path.join(DEFAULT_SOURCE, "README.md")) && !names.includes("README.md"));
  });

  it("builds a ZIP that reads back to the same bytes, with plain names, no folders and the same bytes every time", () => {
    const zip = buildPluginZip(DEFAULT_SOURCE);
    const back = readZip(zip);
    assert.deepEqual(back.map((e) => e.name), collect(DEFAULT_SOURCE).map((e) => e.name));
    for (const e of back) {
      assert.ok(e.data.equals(fs.readFileSync(path.join(DEFAULT_SOURCE, ...e.name.split("/")))), e.name);
      assert.ok(!e.name.includes("\\") && !e.name.startsWith("/") && !e.name.split("/").includes("..") && !e.name.endsWith("/"));
    }
    assert.ok(zip.equals(buildPluginZip(DEFAULT_SOURCE)), "two builds gave different bytes");
    assert.ok(zip.length < LIMITS.zipBytes);
  });

  it("computes the CRC-32 the way the format says (the standard check value) and the way zlib does", () => {
    assert.equal(crc32(Buffer.from("123456789")), 0xcbf43926);
    assert.equal(crc32(Buffer.alloc(0)), 0);
    if (typeof zlib.crc32 === "function") {
      for (const size of [1, 7, 1000, 65536]) {
        const bytes = crypto.randomBytes(size);
        assert.equal(crc32(bytes), zlib.crc32(bytes), `${size} random bytes`);
      }
    }
  });

  it("reads back with the computer's own unzipper (PowerShell's Expand-Archive on Windows, unzip elsewhere): the files match the source", (t) => {
    const out = path.join(tempDir(), "own.zip");
    fs.writeFileSync(out, buildPluginZip(DEFAULT_SOURCE));
    if (process.platform === "win32") {
      const dest = path.join(tempDir(), "expanded");
      const r = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", `Expand-Archive -LiteralPath '${out}' -DestinationPath '${dest}'`], { encoding: "utf8", timeout: 60_000 });
      if (r.error) return t.skip("PowerShell is not available");
      assert.equal(r.status, 0, r.stderr);
      for (const { name } of collect(DEFAULT_SOURCE)) assert.ok(fs.readFileSync(path.join(dest, ...name.split("/"))).equals(fs.readFileSync(path.join(DEFAULT_SOURCE, ...name.split("/")))), name);
    } else {
      const r = spawnSync("unzip", ["-tq", out], { encoding: "utf8" });
      if (r.error) return t.skip("unzip is not available");
      assert.equal(r.status, 0, r.stdout + r.stderr);
    }
  });

  it("--check says how many files would go in and writes nothing; no option at all builds dist/ihateposting-chatgpt-plugin.zip's name", () => {
    const r = runScript(["--check"]);
    assert.equal(r.code, 0, r.err);
    assert.match(r.out, /ready: 8 files/);
    assert.equal(path.basename(DEFAULT_OUT), "ihateposting-chatgpt-plugin.zip");
    assert.equal(path.basename(path.dirname(DEFAULT_OUT)), "dist");
    assert.ok(/chatgpt-plugin:zip/.test(JSON.stringify(json("package.json").scripts)));
    assert.equal(json("package.json").scripts["chatgpt-plugin:zip"], "node scripts/chatgpt-plugin-zip.mjs");
  });

  it("--out writes the ZIP, creates the folder, prints the file's own SHA-256 and says nothing was uploaded; no temporary file is left", () => {
    const dir = tempDir();
    const out = path.join(dir, "made", "later", "plugin.zip");
    const r = runScript(["--out", out]);
    assert.equal(r.code, 0, r.err);
    const sha = crypto.createHash("sha256").update(fs.readFileSync(out)).digest("hex");
    assert.ok(r.out.includes(`sha256 ${sha}`));
    assert.match(r.out, /Nothing was uploaded/);
    assert.deepEqual(fs.readdirSync(path.dirname(out)), ["plugin.zip"]);
  });

  it("refuses an unknown or unfinished option (exit 2) and a folder that is missing or not ready (exit 1), naming the problem", () => {
    for (const args of [["--bogus"], ["--out"], ["--source"], ["extra"]]) {
      const r = runScript(args);
      assert.equal(r.code, 2, args.join(" "));
      assert.match(r.err, /Usage: node scripts\/chatgpt-plugin-zip\.mjs/);
    }
    const missing = runScript(["--check", "--source", path.join(tempDir(), "nope")]);
    assert.equal(missing.code, 1);
    assert.match(missing.err, /not ready/);
    assert.match(missing.err, /plugin\.json is missing/);
  });
});

describe("break it: the checks refuse what the portal would reject", () => {
  const long = (n) => "x".repeat(n);
  const cases = [
    ["plugin.json is gone", (d) => fs.rmSync(path.join(d, "plugin.json")), "plugin.json is missing"],
    ["plugin.json is not JSON", (d) => fs.writeFileSync(path.join(d, "plugin.json"), "{ not json"), "not valid UTF-8 JSON"],
    ["plugin.json is not UTF-8", (d) => fs.writeFileSync(path.join(d, "plugin.json"), Buffer.from([0x7b, 0xff, 0xfe, 0x7d])), "not valid UTF-8 JSON"],
    ["a wrong $schema", (d) => editJson(d, "plugin.json", (p) => (p.$schema = "https://example.com/x.json")), '"$schema"'],
    ["a key the portable format does not allow", (d) => editJson(d, "plugin.json", (p) => (p.skills = ["./skills"])), 'the key "skills"'],
    ["an upper-case name", (d) => editJson(d, "plugin.json", (p) => (p.name = "IHatePosting")), "plugin.json name"],
    ["a name of 65 characters", (d) => editJson(d, "plugin.json", (p) => (p.name = long(65))), "plugin.json name"],
    ["a version without a patch number", (d) => editJson(d, "plugin.json", (p) => (p.version = "1.0")), "semantic version"],
    ["a description of 4001 characters", (d) => editJson(d, "plugin.json", (p) => (p.description = long(4001))), "plugin.json description"],
    ["a display name of 31 characters", (d) => editJson(d, "plugin.json", (p) => (openai(p).interface.displayName = long(31))), "displayName must be 1 to 30"],
    ['"Plugin" in the display name', (d) => editJson(d, "plugin.json", (p) => (openai(p).interface.displayName = "iHatePosting Plugin")), 'must not contain "MCP" or "Plugin"'],
    ['"MCP" in the display name', (d) => editJson(d, "plugin.json", (p) => (openai(p).interface.displayName = "iHatePosting MCP")), 'must not contain "MCP" or "Plugin"'],
    ["a short description of 31 characters", (d) => editJson(d, "plugin.json", (p) => (openai(p).interface.shortDescription = long(31))), "shortDescription"],
    ["a long description of 4001 characters", (d) => editJson(d, "plugin.json", (p) => (openai(p).interface.longDescription = long(4001))), "longDescription"],
    ["a privacy address over plain http", (d) => editJson(d, "plugin.json", (p) => (openai(p).interface.privacyPolicyURL = "http://ihateposting.com/privacy")), "privacyPolicyURL must be an https"],
    ["an address with a password inside", (d) => editJson(d, "plugin.json", (p) => (openai(p).interface.termsOfServiceURL = "https://user:secret@ihateposting.com/terms")), "termsOfServiceURL"],
    ["no support address", (d) => editJson(d, "plugin.json", (p) => delete openai(p).interface.supportURL), "supportURL"],
    ["four default prompts", (d) => editJson(d, "plugin.json", (p) => (openai(p).interface.defaultPrompt = ["a", "b", "c", "d"])), "defaultPrompt"],
    ["a brand colour that is not #RRGGBB", (d) => editJson(d, "plugin.json", (p) => (openai(p).interface.brandColor = "blue")), "brandColor"],
    ["a logo that climbs out of the folder", (d) => editJson(d, "plugin.json", (p) => (openai(p).interface.logo = "./../logo.png")), "interface.logo must be a relative path"],
    ["a logo with a Windows path", (d) => editJson(d, "plugin.json", (p) => (openai(p).interface.logo = ".\\assets\\logo.png")), "interface.logo must be a relative path"],
    ["a logo that is not in the folder", (d) => editJson(d, "plugin.json", (p) => (openai(p).interface.logo = "./assets/none.png")), "not in the folder"],
    ["a logo that is not square", (d) => fs.writeFileSync(path.join(d, "assets", "logo.png"), pngOf(100, 50)), "must be square"],
    ["a logo of 47 pixels", (d) => fs.writeFileSync(path.join(d, "assets", "logo.png"), pngOf(47, 47)), "must be square, from 48 to 4096"],
    ["a logo of 5000 pixels", (d) => fs.writeFileSync(path.join(d, "assets", "logo.png"), pngOf(5000, 5000)), "from 48 to 4096"],
    ["a .png that is not a PNG", (d) => fs.writeFileSync(path.join(d, "assets", "logo.png"), "not an image at all, just text........"), "is not a PNG file"],
    ["a logo over 5 MiB", (d) => fs.writeFileSync(path.join(d, "assets", "logo.png"), Buffer.concat([pngOf(100, 100), Buffer.alloc(5 * 1024 * 1024)])), "over 5 MiB"],
    ["a logo of another type", (d) => editJson(d, "plugin.json", (p) => (openai(p).interface.logo = "./plugin.json")), "must be a .png"],
    ["four positive cases", (d) => editJson(d, "plugin.json", (p) => openai(p).review.test_cases.positive.pop()), "exactly five cases"],
    ["six positive cases", (d) => editJson(d, "plugin.json", (p) => openai(p).review.test_cases.positive.push(openai(p).review.test_cases.positive[0])), "exactly five cases"],
    ["two negative cases", (d) => editJson(d, "plugin.json", (p) => openai(p).review.test_cases.negative.pop()), "exactly three cases"],
    ["a positive case without the tools", (d) => editJson(d, "plugin.json", (p) => delete openai(p).review.test_cases.positive[2].tools_triggered), "lacks tools_triggered"],
    ["a case that names a tool the server lacks", (d) => editJson(d, "plugin.json", (p) => (openai(p).review.test_cases.positive[0].tools_triggered = "integrationLst")), "not a tool of the hosted server"],
    ["a negative case without a prompt", (d) => editJson(d, "plugin.json", (p) => delete openai(p).review.test_cases.negative[0].prompt), "negative case 1 lacks prompt"],
    ["commerce declared", (d) => editJson(d, "plugin.json", (p) => (openai(p).review.commerce = true)), "review.commerce must be false"],
    ["a demo link over http", (d) => editJson(d, "plugin.json", (p) => (openai(p).review.demo_recording_url = "http://example.com/demo")), "demo_recording_url"],
    ["no release notes", (d) => editJson(d, "plugin.json", (p) => delete openai(p).publication.release_notes), "release_notes"],
    ["a reviewer login inside the package", (d) => editJson(d, "plugin.json", (p) => (openai(p).review.test_credentials = { user: "a", password: "b" })), "test_credentials"],
    ["reviewer instructions inside the package", (d) => editJson(d, "plugin.json", (p) => (openai(p).review.reviewer_instructions = "sign in as ...")), "reviewer_instructions"],
    ["lifecycle hooks declared", (d) => editJson(d, "plugin.json", (p) => (openai(p).hooks = "./hooks/hooks.json")), "hooks or apps"],
    ["an app file declared", (d) => editJson(d, "plugin.json", (p) => (openai(p).apps = "./.app.json")), "hooks or apps"],
    ["an onboarding skill that is not there", (d) => editJson(d, "plugin.json", (p) => (openai(p).onboardingSkill = "./skills/none/SKILL.md")), "onboardingSkill"],
    ["mcp.json is gone", (d) => fs.rmSync(path.join(d, "mcp.json")), "mcp.json is missing"],
    ["two MCP servers", (d) => editJson(d, "mcp.json", (m) => (m.mcpServers.second = m.mcpServers.ihateposting)), "exactly one MCP server"],
    ["no MCP server", (d) => editJson(d, "mcp.json", (m) => (m.mcpServers = {})), "exactly one MCP server"],
    ["the old SSE transport", (d) => editJson(d, "mcp.json", (m) => (m.mcpServers.ihateposting.type = "sse")), '"streamable-http"'],
    ["a server over plain http", (d) => editJson(d, "mcp.json", (m) => (m.mcpServers.ihateposting.url = "http://app.ihateposting.com/api/mcp/oauth")), "public https address"],
    ["a server on localhost", (d) => editJson(d, "mcp.json", (m) => (m.mcpServers.ihateposting.url = "https://localhost/mcp")), "public https address"],
    ["a server address with a key in the query", (d) => editJson(d, "mcp.json", (m) => (m.mcpServers.ihateposting.url = `${HOSTED}?key=abc`)), "without a query"],
    ["a header holding a token", (d) => editJson(d, "mcp.json", (m) => (m.mcpServers.ihateposting.headers = { Authorization: "Bearer abc" })), "no headers"],
    ["API-key sign-in, which the portal cannot do", (d) => editJson(d, "mcp.json", (m) => (m.mcpServers.ihateposting.extensions["com.openai"].auth = { type: "api_key", headerScheme: "bearer" })), "oauth, none or mixed"],
    ["no sign-in declared", (d) => editJson(d, "mcp.json", (m) => delete m.mcpServers.ihateposting.extensions), "oauth, none or mixed"],
    ["a client secret in mcp.json", (d) => editJson(d, "mcp.json", (m) => (m.mcpServers.ihateposting.extensions["com.openai"].auth.client.clientSecret = "s")), "no secret"],
    ["the skills folder is gone", (d) => fs.rmSync(path.join(d, "skills"), { recursive: true }), "at least one skill"],
    ["a skill without front matter", (d) => fs.writeFileSync(path.join(d, "skills", "get-started", "SKILL.md"), "# no front matter\n\ntext\n"), "front matter"],
    ["a skill named otherwise than its folder", (d) => fs.writeFileSync(path.join(d, "skills", "get-started", "SKILL.md"), "---\nname: other\ndescription: x\n---\n\nbody\n"), "is not the folder's name"],
    ["a skill without a description", (d) => fs.writeFileSync(path.join(d, "skills", "get-started", "SKILL.md"), "---\nname: get-started\n---\n\nbody\n"), "lacks a description"],
    ["a skill description of 1025 characters", (d) => fs.writeFileSync(path.join(d, "skills", "get-started", "SKILL.md"), `---\nname: get-started\ndescription: ${long(1025)}\n---\n\nbody\n`), "over 1,024"],
    ["a skill with no instructions", (d) => fs.writeFileSync(path.join(d, "skills", "get-started", "SKILL.md"), "---\nname: get-started\ndescription: x\n---\n\n"), "no instructions"],
    ["a skill that is not UTF-8", (d) => fs.writeFileSync(path.join(d, "skills", "get-started", "SKILL.md"), Buffer.from([0x2d, 0x2d, 0x2d, 0xff, 0xfe])), "not valid UTF-8"],
    ["a skill folder with no SKILL.md", (d) => fs.mkdirSync(path.join(d, "skills", "empty")), "has no SKILL.md"],
    ["a hidden skill folder", (d) => fs.cpSync(path.join(d, "skills", "get-started"), path.join(d, "skills", ".get-started"), { recursive: true }), "must not start with a dot"],
    ["a loose file in skills/", (d) => fs.writeFileSync(path.join(d, "skills", "notes.txt"), "x"), "is not a folder"],
  ];
  for (const [what, mutate, expected] of cases) {
    it(`${what}: the problem is named and no ZIP is built`, () => {
      const dir = copyPlugin();
      mutate(dir);
      const problems = validatePlugin(dir);
      assert.ok(problems.some((p) => p.includes(expected)), `expected a problem with "${expected}", got:\n${problems.join("\n")}`);
      assert.throws(() => buildPluginZip(dir), /The plugin folder is not ready/);
    });
  }

  it("leaves a README, an .env, a .DS_Store and other loose files of the folder out of the ZIP", () => {
    const dir = copyPlugin();
    fs.writeFileSync(path.join(dir, ".env"), "SECRET=1\n");
    fs.writeFileSync(path.join(dir, "notes.txt"), "x");
    fs.mkdirSync(path.join(dir, "node_modules"));
    fs.writeFileSync(path.join(dir, "node_modules", "x.js"), "x");
    fs.writeFileSync(path.join(dir, "assets", ".DS_Store"), "x");
    fs.writeFileSync(path.join(dir, "skills", "get-started", "Thumbs.db"), "x");
    assert.deepEqual(readZip(buildPluginZip(dir)).map((e) => e.name), collect(DEFAULT_SOURCE).map((e) => e.name));
  });

  it("refuses a symbolic link (where the computer lets a test make one)", (t) => {
    const dir = copyPlugin();
    try {
      fs.symlinkSync(path.join(dir, "plugin.json"), path.join(dir, "assets", "link.json"));
    } catch {
      return t.skip("this computer does not let a test make a symbolic link");
    }
    assert.throws(() => buildPluginZip(dir), /symbolic link/);
  });

  it("holds the limits OpenAI publishes (100 MB zipped, 5,000 files, 512 MiB unzipped, 100 MiB a file, 20 path segments)", () => {
    assert.deepEqual(LIMITS, { zipBytes: 100 * 1000 * 1000, entries: 5000, unzippedBytes: 512 * 1024 * 1024, memberBytes: 100 * 1024 * 1024, segments: 20 });
  });

  it("refuses more files than a ZIP may hold, a path that is too deep and a file over 100 MiB, without reading it", () => {
    let dir = copyPlugin();
    fs.mkdirSync(path.join(dir, "assets", "many"));
    for (let i = 0; i <= 5000; i++) fs.writeFileSync(path.join(dir, "assets", "many", `f${i}.txt`), "x");
    assert.throws(() => buildPluginZip(dir), /at most 5000$/m); // not 50000: the limit is OpenAI's, written out here
    dir = copyPlugin();
    const deep = path.join(dir, "assets", ...Array.from({ length: 20 }, (_, i) => `d${i}`));
    fs.mkdirSync(deep, { recursive: true });
    fs.writeFileSync(path.join(deep, "x.txt"), "x");
    assert.throws(() => buildPluginZip(dir), /not a safe archive path/);
    dir = copyPlugin();
    const fd = fs.openSync(path.join(dir, "assets", "big.bin"), "w");
    fs.ftruncateSync(fd, LIMITS.memberBytes + 1);
    fs.closeSync(fd);
    assert.throws(() => buildPluginZip(dir), /over 100 MiB/);
  });

  it("two builds to the same file at once: each ends cleanly, the file is a valid ZIP, and no temporary file is left", async () => {
    const dir = tempDir();
    const out = path.join(dir, "same.zip");
    const codes = await Promise.all(
      [0, 1, 2].map(
        () =>
          new Promise((resolve) => {
            const child = spawn(process.execPath, [SCRIPT, "--out", out], { stdio: "ignore" });
            child.on("close", resolve);
          }),
      ),
    );
    assert.ok(codes.every((c) => c === 0 || c === 1), `unexpected exit codes ${codes}`);
    assert.ok(codes.some((c) => c === 0), "no build succeeded");
    assert.equal(readZip(fs.readFileSync(out)).length, 8);
    assert.deepEqual(fs.readdirSync(dir), ["same.zip"]);
  });

  it("a destination that is a folder, not a file: exit 1, a sentence, no temporary file", () => {
    const dir = tempDir();
    const out = path.join(dir, "taken");
    fs.mkdirSync(out);
    const r = runScript(["--out", out]);
    assert.equal(r.code, 1);
    assert.match(r.err, /Could not write/);
    assert.deepEqual(fs.readdirSync(dir), ["taken"]);
  });

  it("reading a damaged ZIP says so: a flipped byte, a cut-off file and a file that is not a ZIP", () => {
    const zip = buildPluginZip(DEFAULT_SOURCE);
    const flipped = Buffer.from(zip);
    flipped[100] ^= 0xff;
    assert.throws(() => readZip(flipped));
    assert.throws(() => readZip(zip.subarray(0, zip.length - 30)), /not a ZIP|broken|end-of-directory/);
    assert.throws(() => readZip(Buffer.from("this is not a zip file at all, it is some text")), /not a ZIP/);
    assert.throws(() => readZip(Buffer.alloc(5)), /too short/);
  });
});

describe("server.json (a draft for the official MCP Registry)", () => {
  const server = json("server.json");

  it("follows the registry's schema fields: name in reverse-DNS form, a description of at most 100 characters, a plain version", () => {
    assert.equal(server.$schema, "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json");
    assert.match(server.name, /^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._-]+$/);
    assert.equal(server.name, "com.ihateposting/mcp");
    assert.equal(server.title, "iHatePosting");
    assert.ok(server.name.length >= 3 && server.name.length <= 200);
    assert.ok(server.description.length >= 1 && server.description.length <= 100, `the description is ${server.description.length} characters`);
    assert.ok(server.title.length >= 1 && server.title.length <= 100);
    assert.match(server.version, /^\d+\.\d+\.\d+$/, "a range or a word is rejected by the registry");
    assert.ok(!/[\^~><*x]/.test(server.version));
    assert.ok(server.description.includes("15 platforms"));
    assert.equal(server.websiteUrl, "https://ihateposting.com");
  });

  it("names this repository as its source and the hosted addresses as its only remotes, without a package", () => {
    assert.equal(server.repository.source, "github");
    assert.equal(server.repository.url, json("package.json").repository.url.replace(/^git\+/, "").replace(/\.git$/, ""));
    assert.equal(server.packages, undefined, "this repository has no local MCP package");
    assert.deepEqual(server.remotes.map((r) => r.url), [HOSTED, "https://app.ihateposting.com/api/mcp"]);
    for (const remote of server.remotes) {
      assert.equal(remote.type, "streamable-http");
      assert.equal(new URL(remote.url).protocol, "https:");
      assert.ok(!new URL(remote.url).search && !/localhost|127\.0\.0\.1/.test(remote.url));
    }
  });

  it("asks for the key in a header that is marked secret, and holds no key itself", () => {
    assert.equal(server.remotes[0].headers, undefined);
    const [header] = server.remotes[1].headers;
    assert.equal(header.name, "Authorization");
    assert.equal(header.isSecret, true);
    assert.equal(header.isRequired, true);
    assert.ok(!/Bearer [A-Za-z0-9]{10,}|pk_live_/.test(JSON.stringify(server)));
  });

  it("is not part of the npm package and is not named by any manifest as a package file", () => {
    assert.ok(!json("package.json").files.includes("server.json"));
    assert.ok(!json("package.json").files.includes("scripts"));
  });
});

describe("PUBLISHING.md's section on submissions", () => {
  const doc = read("PUBLISHING.md");
  const section = doc.slice(doc.indexOf("## Submissions: getting listed in each place"), doc.indexOf("## Common issues"));

  it("is there, between the testing section and the common issues, and says nothing is submitted by this repository", () => {
    assert.ok(doc.includes("## Submissions: getting listed in each place"));
    assert.ok(doc.indexOf("## Testing before you publish") < doc.indexOf("## Submissions: getting listed in each place"));
    assert.ok(section.length > 8000);
    assert.match(section, /Nothing in this repository submits anything, signs in anywhere or changes a setting/);
    assert.match(section, /2026-11-15/);
  });

  it("says what the new app's paths answered, before and after it was deployed (404 earlier, 401 and 200 at 08:17 UTC), what is still missing, and how to check again", () => {
    assert.match(section, /### What must be live first/);
    assert.match(section, /\*\*Earlier that day\*\* the paths .* all answered 404/);
    assert.match(section, /\*\*At 08:17 UTC\*\* it was:/);
    for (const p of ["/api/mcp", "/api/mcp/oauth", "/device", "/oauth/authorize", "/.well-known/openai-apps-challenge", "/privacy", "/terms", "/api/device/code", "/api/device/token", "/.well-known/oauth-protected-resource/api/mcp/oauth", "/.well-known/oauth-authorization-server/api/mcp/oauth"]) assert.ok(section.includes(`\`${p}\``), p);
    assert.match(section, /\| `\/privacy` and `\/terms` \| \*\*404\*\*/);
    assert.match(section, /What was \*\*not\*\* tried: a real sign-in, a real MCP session/);
    assert.match(section, /curl -s -o \/dev\/null -w "%\{http_code\}\\n" https:\/\/app\.ihateposting\.com\/api\/mcp\/oauth/);
    assert.match(section, /UserInfo endpoint that returns the `email` claim with `email_verified: true`/);
    assert.ok(!/were \*\*not deployed\*\*/.test(section), "the old statement is still there");
  });

  it("has a row for every place that was researched, and marks what was not read first-hand", () => {
    for (const place of ["Claude Code, from this repository", "Anthropic's plugin directory", "Claude connector (hosted MCP)", "ChatGPT and Codex plugin", "Cursor Marketplace", "cursor.directory", "Grok Build (xAI marketplace)", "Gemini CLI extensions gallery", "Qwen Code", "DeepSeek Harness", "OpenClaw (ClawHub)", "Hermes Agent", "skills.sh", "Official MCP Registry", "Glama, PulseMCP"]) assert.ok(section.includes(`| ${place} |`), place);
    assert.match(section, /"Unverified" means it could not be confirmed; "second-hand" means/);
    assert.ok((section.match(/second-hand/g) ?? []).length >= 6);
    assert.ok((section.match(/unverified/gi) ?? []).length >= 5);
  });

  it("tells the owner the facts that decide a submission: the host change, the bin/ folder, the 40-character SHA, the Gemini topic", () => {
    assert.match(section, /a different host means a \*\*new plugin\*\*/);
    assert.match(section, /top-level `bin\/` folder "can't be installed" in Claude chat or Cowork/);
    assert.match(section, /full 40-character commit SHA/);
    assert.match(section, /topic `gemini-cli-extension`/);
    assert.match(section, /not the form xAI wants/);
    assert.match(section, /do not replace it \(OpenAI: use a parent origin or a distinct host instead\)/);
    assert.match(section, /`requires\.env` as `IHATEPOSTING_API_URL` only/);
    assert.match(section, /a \*\*draft\*\* for a new version, `0\.13\.0`, of the existing registry entry `com\.ihateposting\/mcp`.{0,160}the entry's versions went up to 0\.12\.9 on 2026-11-15/);
    assert.match(section, /`0\.13\.0` is above `0\.12\.9`: the registry's versioning page \(read on 2026-11-16\) says a published version is immutable and that the latest version is chosen by semantic-version order/);
    assert.equal(json("server.json").version, "0.13.0");
    assert.match(section, /Whether the registry accepts a new version of an existing name with another repository is \*\*unverified\*\*/);
  });

  it("gives the npm token and two-factor facts with their sources: the January 2027 target, Node 22.14.0, the 48 hours, and what that means for publish-npm.yml", () => {
    for (const fact of ["targeting January 2027", "Node 22.14.0", "npm CLI 11.5.1", "`id-token: write`", "48 hours", "uses Node 20", "stage only", "provenance"]) assert.ok(section.includes(fact), fact);
    for (const url of ["https://docs.npmjs.com/about-access-tokens", "https://docs.npmjs.com/trusted-publishers", "https://github.blog/changelog/2026-07-31-restricting-npm-bypass-2fa-granular-access-tokens", "https://github.blog/changelog/2026-09-18-stage-only-npm-tokens-for-safer-automation", "https://github.blog/changelog/2026-10-02-unvalidated-npm-trusted-publishing-configurations-now-expire"]) assert.ok(section.includes(url), url);
    const workflow = read(".github/workflows/publish-npm.yml");
    assert.match(workflow, /node-version: 20/, "the section says the workflow uses Node 20");
    assert.match(workflow, /secrets\.NPM_TOKEN/);
  });

  it("names the command and file the ChatGPT steps use, the same as the package and the script", () => {
    assert.ok(section.includes("npm run chatgpt-plugin:zip"));
    assert.ok(section.includes(`dist/${path.basename(DEFAULT_OUT)}`));
    assert.ok(section.includes("plugins/chatgpt-ihateposting/"));
    assert.ok(section.includes("`server.json`"));
    assert.match(section, /never in the ZIP, which rejects `test_credentials` and `reviewer_instructions`/);
  });

  it("holds no secret, no personal detail and no other product's name, and every web address in it is https", () => {
    assert.ok(!section.includes(OTHER_PRODUCT) && !section.includes("@ihateposting.com") && !/pk_live_|Bearer [A-Za-z0-9]{12,}/.test(section));
    for (const [url] of section.matchAll(/https?:\/\/[^\s)`|]+/g)) assert.ok(url.startsWith("https://"), url);
  });
});
