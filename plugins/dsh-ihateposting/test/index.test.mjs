// Tests for the dsh-ihateposting plugin. They use no network, no key of a real account and nothing installed: a made-up key is put into the
// environment only to see that it never comes out again. Where `@deepseek-ai/schemastery` is not installed (the repository does not install it:
// DeepSeek Harness brings it) a resolution hook points the import at test/schemastery-stand-in.mjs; where it is installed the real package is used.
// Run from the repository root with
//   node --test "plugins/dsh-ihateposting/test/*.test.mjs"
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire, register } from "node:module";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const PLUGIN = fileURLToPath(new URL("../", import.meta.url));
const read = (file) => fs.readFileSync(path.join(PLUGIN, file), "utf8");
const pkg = JSON.parse(read("package.json"));

const FAKE_KEY = "test-key-0123456789-not-real";
const OTHER_KEY = "other-key-9876543210-not-real";
const DEFAULT_MCP = "https://app.ihateposting.com/mcp";
/** The tools the hosted server has (apps/backend/src/mcp/mcp-tools.ts of the app). */
const SERVER_TOOLS = ["integrationList", "groupList", "integrationSchema", "triggerTool", "integrationSchedulePostTool", "postsListTool", "postSettingsTool", "deletePostTool", "uploadFromUrlTool", "mediaListTool", "mediaStatusTool", "uploadWidgetTool", "uploadWidgetTicketTool", "uploadWidgetStatusTool"];

const canRegister = typeof register === "function";
if (canRegister) register("./stand-in-hooks.mjs", import.meta.url);
const realSchemastery = (() => {
  try {
    createRequire(import.meta.url).resolve("@deepseek-ai/schemastery");
    return true;
  } catch {
    return false;
  }
})();
const skipIfNoHook = canRegister || realSchemastery ? false : "this Node cannot register a resolution hook and the real @deepseek-ai/schemastery is not installed";

/** Every file of the plugin folder, as paths relative to it. */
function allFiles(dir = PLUGIN) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "node_modules") return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? allFiles(full) : [path.relative(PLUGIN, full).replaceAll("\\", "/")];
  });
}

/** Runs `fn` with the variable set to `value` (undefined: not set at all), then puts the old value back. */
function withEnv(name, value, fn) {
  const before = process.env[name];
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
  try {
    return fn();
  } finally {
    if (before === undefined) delete process.env[name];
    else process.env[name] = before;
  }
}

/** Everything written to the console or to stdout/stderr while `fn` runs. */
function captureOutput(fn) {
  const seen = [];
  const methods = ["log", "info", "warn", "error", "debug"];
  const saved = Object.fromEntries(methods.map((m) => [m, console[m]]));
  const savedOut = process.stdout.write;
  const savedErr = process.stderr.write;
  for (const m of methods) console[m] = (...args) => seen.push(args.map(String).join(" "));
  process.stdout.write = (chunk) => (seen.push(String(chunk)), true);
  process.stderr.write = (chunk) => (seen.push(String(chunk)), true);
  try {
    fn();
  } finally {
    for (const m of methods) console[m] = saved[m];
    process.stdout.write = savedOut;
    process.stderr.write = savedErr;
  }
  return seen.join("\n");
}

/** A stand-in for the context DeepSeek Harness hands to a plugin: `provide`, `inject` (the skills service, or none) and a logger that records. */
function fakeContext({ skills = true, logger = true } = {}) {
  const provided = {};
  const registered = [];
  const logs = [];
  const injected = [];
  const ctx = {
    provide(key, value) {
      provided[key] = value;
      return () => {};
    },
    inject(deps, callback) {
      injected.push(deps);
      callback({ skills: skills ? { register: (skill) => (registered.push(skill), () => {}) } : undefined });
    },
  };
  if (logger) ctx.logger = { info: (...a) => logs.push(["info", a.join(" ")]), warn: (...a) => logs.push(["warn", a.join(" ")]) };
  return { ctx, provided, registered, logs, injected };
}

/** The rows of cordis.patch.yml without comments, as text lines (no YAML parser is installed, so the file is read as text). */
const patchLines = read("cordis.patch.yml")
  .split("\n")
  .filter((line) => !/^\s*#/.test(line) && line.trim() !== "");

describe("package.json", () => {
  it("is an MIT, plain-JavaScript ES module by its author that a plugin manager can read as a bundle", () => {
    assert.equal(pkg.name, "dsh-ihateposting");
    assert.equal(pkg.license, "MIT");
    assert.deepEqual(pkg.author, { name: "Parag Hasmukhbhai Gajera", email: "support@ihateposting.com", url: "https://github.com/iHatePostingOrg" });
    assert.equal(pkg.type, "module");
    assert.deepEqual(pkg.dsh, { bundle: { patch: "./cordis.patch.yml" } });
    assert.ok(pkg.keywords.includes("dsh-plugin") && pkg.keywords.includes("deepseek-harness"));
    assert.ok(pkg.description.length > 20);
    assert.equal(pkg.dependencies, undefined, "the plugin needs no dependency of its own");
    assert.equal(pkg.devDependencies, undefined);
    assert.match(pkg.engines.node, /20/);
  });

  it("asks of the host the two packages it is built on, in ranges that include the versions DeepSeek Harness pins (cordis 4.0.2, schemastery 3.18.2)", () => {
    assert.deepEqual(pkg.peerDependencies, { "@deepseek-ai/cordis": "^4.0.1", "@deepseek-ai/schemastery": "^3.18.1" });
  });

  it("exports the plugin, its package.json and its patch, runs its tests with node's runner, and ships only lib, the patch, the README and the licence", () => {
    assert.deepEqual(pkg.exports, { ".": "./lib/index.js", "./package.json": "./package.json", "./cordis.patch.yml": "./cordis.patch.yml" });
    assert.equal(pkg.main, "./lib/index.js");
    assert.equal(pkg.scripts.test, 'node --test "test/*.test.mjs"');
    assert.deepEqual(pkg.files, ["lib/", "cordis.patch.yml", "README.md", "LICENSE"]);
    for (const entry of pkg.files) assert.ok(fs.existsSync(path.join(PLUGIN, entry)), `${entry} is listed in files but missing`);
    assert.ok(!pkg.files.some((f) => f.startsWith("test") || f.startsWith("skill")), "the tests and the unused skill copy are not shipped");
    assert.ok(read("LICENSE").startsWith("MIT License"));
  });
});

describe("cordis.patch.yml", () => {
  it("inserts the plugin's own row and one MCP client row, in that order", () => {
    assert.equal(patchLines[0], "- insert:");
    const ids = patchLines.filter((l) => /^\s+- id: /.test(l)).map((l) => l.replace(/^\s+- id: /, ""));
    assert.deepEqual(ids, ["ihateposting", "ihateposting-mcp"]);
    assert.ok(patchLines.includes("      name: dsh-ihateposting"));
    assert.ok(patchLines.includes("      name: '@deepseek-ai/dsh-mcp-client'"));
  });

  it("configures the first row with the variable and the default address, and nothing else", () => {
    const first = patchLines.slice(1, patchLines.indexOf("    - id: ihateposting-mcp"));
    assert.deepEqual(first.slice(2), ["      config:", "        apiKeyEnv: IHATEPOSTING_API_KEY", "        baseUrl: https://app.ihateposting.com"]);
  });

  it("makes the MCP row inject the service and read the address and the headers from it, over streamable HTTP, as a server named ihateposting", () => {
    const row = patchLines.slice(patchLines.indexOf("    - id: ihateposting-mcp"));
    for (const line of ["      inject: [ihateposting]", "        transport: streamable-http", "        serverName: ihateposting", "        url: !!js ctx.ihateposting.url", "        headers: !!js ctx.ihateposting.headers", "        failOnStartupError: false"]) assert.ok(row.includes(line), `missing: ${line.trim()}`);
    const serverName = row.find((l) => l.trim().startsWith("serverName:")).split(":")[1].trim();
    assert.match(serverName, /^[A-Za-z0-9_-]{1,32}$/);
  });

  it("keeps the reconnect settings: on, 2 s first delay, 30 s longest, 10 attempts", () => {
    const row = patchLines.join("\n");
    assert.match(row, /reconnect:\n\s+enabled: true\n\s+initialDelayMs: 2000\n\s+maxDelayMs: 30000\n\s+maxAttempts: 10/);
  });

  it("holds no key, no use of the environment and no other address: the plugin alone reads the key, and no row is switched off", () => {
    const text = patchLines.join("\n");
    assert.ok(!text.includes("process.env"), "the patch reads the environment");
    assert.ok(!text.includes("Authorization") && !text.includes("Bearer"), "the patch builds the header");
    assert.ok(!text.includes("disabled"), "a row is switched off by a key check");
    assert.deepEqual(text.match(/https?:\/\/\S+/g), ["https://app.ihateposting.com"]);
    assert.ok(!read("cordis.patch.yml").includes("/mcp/oauth"), "the browser sign-in address is wired");
  });
});

describe("the plugin (lib/index.js)", { skip: skipIfNoHook }, async () => {
  const plugin = await import("../lib/index.js");

  it("has only named exports: a name, the service's name, the defaults, the settings schema, apply and two helpers", () => {
    assert.deepEqual(Object.keys(plugin).sort(), ["Config", "DEFAULT_BASE_URL", "DEFAULT_KEY_VARIABLE", "SERVICE_NAME", "apply", "displayUrl", "name", "resolveConnection"]);
    assert.equal("default" in plugin, false);
    assert.equal(plugin.name, "dsh-ihateposting");
    assert.equal(plugin.name, pkg.name);
    assert.equal(plugin.SERVICE_NAME, "ihateposting");
    assert.equal(plugin.DEFAULT_KEY_VARIABLE, "IHATEPOSTING_API_KEY");
    assert.equal(plugin.DEFAULT_BASE_URL, "https://app.ihateposting.com");
    assert.equal(typeof plugin.apply, "function");
  });

  describe("the settings schema", () => {
    it("fills the four defaults when nothing is given", () => {
      for (const given of [undefined, {}]) assert.deepEqual(plugin.Config(given), { apiKeyEnv: "IHATEPOSTING_API_KEY", apiKey: "", baseUrl: "https://app.ihateposting.com", skill: true });
    });

    it("keeps what is given and fills the rest", () => {
      assert.deepEqual(plugin.Config({ apiKeyEnv: "MY_KEY", baseUrl: "https://self.example/api", skill: false }), { apiKeyEnv: "MY_KEY", apiKey: "", baseUrl: "https://self.example/api", skill: false });
    });

    it("refuses a setting of the wrong type", () => {
      for (const bad of [{ apiKeyEnv: 5 }, { apiKey: true }, { baseUrl: 5 }, { skill: "yes" }, { skill: 1 }, []]) assert.throws(() => plugin.Config(bad), undefined, JSON.stringify(bad));
    });

    it("takes a null, as a missing value, for the default (the library does)", () => {
      const defaults = { apiKeyEnv: "IHATEPOSTING_API_KEY", apiKey: "", baseUrl: "https://app.ihateposting.com", skill: true };
      assert.deepEqual(plugin.Config(null), defaults);
      assert.deepEqual(plugin.Config({ baseUrl: null, skill: null }), defaults);
    });
  });

  describe("resolveConnection", () => {
    const settings = (over = {}) => ({ apiKeyEnv: "IHATEPOSTING_API_KEY", apiKey: "", baseUrl: "https://app.ihateposting.com", ...over });

    it("reads the key from the named variable and builds the address and the header", () => {
      const c = plugin.resolveConnection(settings(), { IHATEPOSTING_API_KEY: FAKE_KEY });
      assert.deepEqual(c, { url: DEFAULT_MCP, headers: { Authorization: `Bearer ${FAKE_KEY}` }, configured: true, source: "env.IHATEPOSTING_API_KEY", problem: "" });
    });

    it("reads another variable when the setting names one, and ignores the default one then", () => {
      const c = plugin.resolveConnection(settings({ apiKeyEnv: "MY_KEY" }), { MY_KEY: FAKE_KEY, IHATEPOSTING_API_KEY: OTHER_KEY });
      assert.equal(c.headers.Authorization, `Bearer ${FAKE_KEY}`);
      assert.equal(c.source, "env.MY_KEY");
    });

    it("prefers an inline key to the variable", () => {
      const c = plugin.resolveConnection(settings({ apiKey: FAKE_KEY }), { IHATEPOSTING_API_KEY: OTHER_KEY });
      assert.equal(c.headers.Authorization, `Bearer ${FAKE_KEY}`);
      assert.equal(c.source, "config.apiKey");
    });

    it("drops spaces and a line break around the key", () => {
      assert.equal(plugin.resolveConnection(settings(), { IHATEPOSTING_API_KEY: `  ${FAKE_KEY}\r\n` }).headers.Authorization, `Bearer ${FAKE_KEY}`);
      assert.equal(plugin.resolveConnection(settings({ apiKey: `\t${FAKE_KEY} ` }), {}).headers.Authorization, `Bearer ${FAKE_KEY}`);
    });

    it("says the key is missing, with no header, for a variable that is not set, empty or only spaces", () => {
      for (const env of [{}, { IHATEPOSTING_API_KEY: "" }, { IHATEPOSTING_API_KEY: "   \n" }, { IHATEPOSTING_API_KEY: undefined }]) {
        const c = plugin.resolveConnection(settings(), env);
        assert.deepEqual([c.configured, c.headers, c.source, c.problem], [false, {}, "none", ""]);
      }
    });

    it("refuses to use a key with a space or a control character inside, so no header can be split, and does not carry it in anything it returns", () => {
      for (const bad of ["abc def", "abc\r\nX-Injected: 1", "abc\u0000def", "abc\tdef", "abc\u007fdef"]) {
        const c = plugin.resolveConnection(settings(), { IHATEPOSTING_API_KEY: bad });
        assert.deepEqual([c.configured, c.headers, c.problem], [false, {}, "malformed"], JSON.stringify(bad));
        assert.ok(!JSON.stringify(c).includes("def") && !JSON.stringify(c).includes("Injected"), "the refused key is in the result");
      }
    });

    it("makes the MCP address from the API address: trailing slashes dropped, `/mcp` added once, a plain host and an empty setting handled", () => {
      const url = (baseUrl) => plugin.resolveConnection(settings({ baseUrl }), {}).url;
      assert.equal(url("https://app.ihateposting.com"), DEFAULT_MCP);
      assert.equal(url("https://app.ihateposting.com/"), DEFAULT_MCP);
      assert.equal(url("https://app.ihateposting.com///"), DEFAULT_MCP);
      assert.equal(url("https://app.ihateposting.com/mcp"), DEFAULT_MCP);
      assert.equal(url("https://app.ihateposting.com/mcp/"), DEFAULT_MCP);
      assert.equal(url("  https://self.example  "), "https://self.example/mcp");
      assert.equal(url(""), DEFAULT_MCP);
      assert.equal(url(undefined), DEFAULT_MCP);
    });

    it("tolerates a missing settings object and a missing environment", () => {
      assert.doesNotThrow(() => plugin.resolveConnection(undefined, {}));
      assert.equal(plugin.resolveConnection(undefined, {}).url, DEFAULT_MCP);
      assert.equal(plugin.resolveConnection({}, { IHATEPOSTING_API_KEY: FAKE_KEY }).configured, true);
    });
  });

  describe("displayUrl", () => {
    it("shows an address without user name, password, query or fragment, and says so for a text that is no address", () => {
      assert.equal(plugin.displayUrl("https://user:secretpw@host.example/api/mcp?key=abc#frag"), "https://host.example/api/mcp");
      assert.equal(plugin.displayUrl(DEFAULT_MCP), DEFAULT_MCP);
      assert.equal(plugin.displayUrl("not an address"), "(an address that is not valid)");
      assert.equal(plugin.displayUrl(""), "(an address that is not valid)");
    });
  });

  describe("apply", () => {
    it("provides the service `ihateposting` with the address, the headers and whether a key was found, and registers the skill once", () => {
      const { ctx, provided, registered, injected } = fakeContext();
      withEnv("IHATEPOSTING_API_KEY", FAKE_KEY, () => plugin.apply(ctx, {}));
      assert.deepEqual(Object.keys(provided), ["ihateposting"]);
      assert.equal(provided.ihateposting.url, DEFAULT_MCP);
      assert.deepEqual(provided.ihateposting.headers, { Authorization: `Bearer ${FAKE_KEY}` });
      assert.equal(provided.ihateposting.configured, true);
      assert.deepEqual(injected, [["skills"]]);
      assert.equal(registered.length, 1);
      const [skill] = registered;
      assert.deepEqual(Object.keys(skill).sort(), ["content", "description", "invocation", "name", "source"]);
      assert.equal(skill.name, "ihateposting");
      assert.equal(skill.source, "runtime");
      assert.deepEqual(skill.invocation, { modelInvocable: true, userInvocable: true });
    });

    it("hands out a fresh, plain copy of the headers on every read, so no reader can change what the next one gets", () => {
      const { ctx, provided } = fakeContext();
      plugin.apply(ctx, { apiKey: FAKE_KEY });
      const first = provided.ihateposting.headers;
      const second = provided.ihateposting.headers;
      assert.notEqual(first, second);
      assert.equal(Object.isFrozen(first) || Object.isFrozen(second), false);
      first.Authorization = "changed";
      first.Extra = "x";
      assert.deepEqual(provided.ihateposting.headers, { Authorization: `Bearer ${FAKE_KEY}` });
      assert.equal(Object.isFrozen(provided.ihateposting), false);
    });

    it("takes its settings from the row: an inline key, another variable, another address, no skill", () => {
      const { ctx, provided, registered, injected } = fakeContext();
      withEnv("MY_KEY", OTHER_KEY, () => plugin.apply(ctx, { apiKeyEnv: "MY_KEY", baseUrl: "https://self.example/api/", skill: false }));
      assert.equal(provided.ihateposting.url, "https://self.example/api/mcp");
      assert.equal(provided.ihateposting.headers.Authorization, `Bearer ${OTHER_KEY}`);
      assert.deepEqual([injected, registered], [[], []], "the skill was asked for although the setting says no");
    });

    it("loads without a skills service and without a logger of its own (the console is used)", () => {
      const noSkills = fakeContext({ skills: false });
      assert.doesNotThrow(() => plugin.apply(noSkills.ctx, { apiKey: FAKE_KEY }));
      assert.equal(noSkills.registered.length, 0);
      const noLogger = fakeContext({ logger: false });
      const out = captureOutput(() => withEnv("IHATEPOSTING_API_KEY", undefined, () => plugin.apply(noLogger.ctx, {})));
      assert.match(out, /no iHatePosting API key found/);
    });

    it("refuses wrong settings with an error rather than going on", () => {
      assert.throws(() => plugin.apply(fakeContext().ctx, { skill: "yes" }));
      assert.throws(() => plugin.apply(fakeContext().ctx, { apiKeyEnv: 5 }));
    });

    it("logs one line naming where the key came from and the address, when there is a key", () => {
      const { ctx, logs } = fakeContext();
      withEnv("IHATEPOSTING_API_KEY", FAKE_KEY, () => plugin.apply(ctx, {}));
      assert.deepEqual(logs, [["info", `dsh-ihateposting: iHatePosting MCP endpoint ${DEFAULT_MCP} (key from env.IHATEPOSTING_API_KEY)`]]);
    });

    it("without a key it loads, warns once and registers the skill, naming the variable, where a key is made and what happens next", () => {
      const { ctx, provided, registered, logs } = fakeContext();
      assert.doesNotThrow(() => withEnv("IHATEPOSTING_API_KEY", undefined, () => plugin.apply(ctx, {})));
      assert.equal(logs.length, 1);
      const [level, text] = logs[0];
      assert.equal(level, "warn");
      for (const part of ["IHATEPOSTING_API_KEY", "Settings > Agents / Dev", DEFAULT_MCP, "without credentials", "401", "no tools"]) assert.ok(text.includes(part), `the warning lacks "${part}"`);
      assert.equal(provided.ihateposting.configured, false);
      assert.deepEqual(provided.ihateposting.headers, {});
      assert.equal(registered.length, 1);
    });

    it("names the variable that was set in the settings, not the default one, in its warning", () => {
      const { ctx, logs } = fakeContext();
      withEnv("MY_OWN_KEY", undefined, () => plugin.apply(ctx, { apiKeyEnv: "MY_OWN_KEY" }));
      assert.ok(logs[0][1].includes("MY_OWN_KEY") && !logs[0][1].includes("IHATEPOSTING_API_KEY"));
    });

    it("warns, without repeating the value, about a key that has a space or a line break inside", () => {
      for (const [settings, env] of [[{}, "abc def ghi"], [{}, "line1\nline2"], [{ apiKey: "inline key" }, undefined]]) {
        const { ctx, provided, logs } = fakeContext();
        withEnv("IHATEPOSTING_API_KEY", env, () => plugin.apply(ctx, settings));
        assert.equal(provided.ihateposting.configured, false);
        assert.deepEqual(provided.ihateposting.headers, {});
        assert.equal(logs.length, 1);
        assert.match(logs[0][1], /holds a space or a control character/);
        assert.ok(!/ghi|line2|inline key/.test(JSON.stringify(logs)), "the value is in the log");
      }
    });

    it("warns when the API address is plain http to a host that is not this computer, and says nothing of it for localhost", () => {
      const remote = fakeContext();
      plugin.apply(remote.ctx, { apiKey: FAKE_KEY, baseUrl: "http://self.example/api" });
      assert.ok(remote.logs.some(([level, text]) => level === "warn" && text.includes("is not https")));
      for (const local of ["http://localhost:3000/api", "http://127.0.0.1/api", "http://[::1]:3000/api"]) {
        const l = fakeContext();
        plugin.apply(l.ctx, { apiKey: FAKE_KEY, baseUrl: local });
        assert.ok(!l.logs.some(([, text]) => text.includes("is not https")), local);
      }
    });

    it("never prints the key: not in a log line, not in the console, not in a warning, whichever way it was given", () => {
      const cases = [
        () => withEnv("IHATEPOSTING_API_KEY", FAKE_KEY, () => plugin.apply(fakeContext().ctx, {})),
        () => plugin.apply(fakeContext().ctx, { apiKey: FAKE_KEY }),
        () => plugin.apply(fakeContext({ logger: false }).ctx, { apiKey: FAKE_KEY }),
        () => withEnv("IHATEPOSTING_API_KEY", `${FAKE_KEY} space`, () => plugin.apply(fakeContext({ logger: false }).ctx, {})),
        () => plugin.apply(fakeContext({ logger: false }).ctx, { apiKey: FAKE_KEY, baseUrl: `https://u:${OTHER_KEY}@host.example/api?k=${OTHER_KEY}` }),
      ];
      for (const run of cases) {
        const output = captureOutput(run);
        assert.ok(!output.includes(FAKE_KEY) && !output.includes(OTHER_KEY), `a key came out: ${output.slice(0, 120)}`);
      }
      const { ctx, logs, registered } = fakeContext();
      plugin.apply(ctx, { apiKey: FAKE_KEY, baseUrl: `https://u:${OTHER_KEY}@host.example/api?k=${OTHER_KEY}` });
      assert.ok(!JSON.stringify(logs).includes(FAKE_KEY) && !JSON.stringify(logs).includes(OTHER_KEY));
      assert.ok(!JSON.stringify(registered).includes(FAKE_KEY), "the skill holds the key");
    });

    it("keeps the key out of what it registers, and only the service holds it", () => {
      const { ctx, provided, registered } = fakeContext();
      plugin.apply(ctx, { apiKey: FAKE_KEY });
      assert.ok(JSON.stringify(provided.ihateposting.headers).includes(FAKE_KEY), "the service must hold the header");
      assert.ok(!JSON.stringify(registered).includes(FAKE_KEY));
      assert.ok(!JSON.stringify({ url: provided.ihateposting.url, configured: provided.ihateposting.configured }).includes(FAKE_KEY));
    });
  });
});

describe("the real @deepseek-ai/schemastery", { skip: realSchemastery ? false : "the real package is not installed here (the checks above ran against the stand-in)" }, async () => {
  const plugin = await import("../lib/index.js");

  it("is what the plugin's settings schema is made with, and validates the same way", async () => {
    const real = await import("@deepseek-ai/schemastery");
    assert.equal(real.isStandIn, undefined, "the stand-in was loaded although the real package can be found");
    assert.deepEqual(plugin.Config({}), { apiKeyEnv: "IHATEPOSTING_API_KEY", apiKey: "", baseUrl: "https://app.ihateposting.com", skill: true });
    assert.throws(() => plugin.Config({ skill: "yes" }));
    assert.throws(() => plugin.Config({ apiKeyEnv: 5 }));
  });
});

describe("the skill (lib/skill.js)", async () => {
  const { SKILL_NAME, SKILL_DESCRIPTION, SKILL_CONTENT } = await import("../lib/skill.js");

  it("is a kebab-case name with a description and a short text", () => {
    assert.match(SKILL_NAME, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(SKILL_DESCRIPTION.length > 40 && SKILL_DESCRIPTION.length <= 1024);
    assert.ok(SKILL_CONTENT.length > 1500 && SKILL_CONTENT.length < 8000, `${SKILL_CONTENT.length} characters`);
  });

  it("names the server's tools as mcp__ihateposting__<tool>, only tools the server has, and every tool an agent calls", () => {
    for (const [, tool] of SKILL_CONTENT.matchAll(/mcp__ihateposting__(\w+)/g)) assert.ok(SERVER_TOOLS.includes(tool), `${tool} is not a tool of the server`);
    for (const tool of SERVER_TOOLS.filter((t) => t !== "uploadWidgetTicketTool")) assert.ok(SKILL_CONTENT.includes(tool), `the skill never mentions ${tool}`);
    assert.ok(SKILL_CONTENT.includes("uploadWidgetTicketTool") === false, "the panel's own tool is for the panel");
  });

  it("gives the order of work, the date and the text rules, drafts by default, a confirmation before a delete, and what the server cannot do", () => {
    for (const part of ["UTC", "draft", "<p>", "`<u>` and `<strong>` in one element", "ask them to confirm", "cannot be undone", "cannot connect a new channel", "AI", "show it or repeat it"]) assert.ok(SKILL_CONTENT.includes(part), `the skill lacks "${part}"`);
    assert.match(SKILL_CONTENT, /Use `draft` unless the person clearly asked to publish/);
    assert.ok(SKILL_CONTENT.indexOf("integrationList") < SKILL_CONTENT.indexOf("integrationSchema") && SKILL_CONTENT.indexOf("integrationSchema") < SKILL_CONTENT.indexOf("integrationSchedulePostTool"));
  });

  it("tells the model nothing about a command line or a shell, holds no address, key or other product's name", () => {
    assert.ok(!/ihateposting-agent|\bnpm\b|\bBash\b|\bshell\b/.test(SKILL_CONTENT));
    assert.ok(!/https?:\/\//.test(SKILL_CONTENT));
    assert.ok(!/Bearer\s+[A-Za-z0-9]/.test(SKILL_CONTENT));
    assert.ok(!SKILL_CONTENT.includes(["Post", "iz"].join("")));
  });
});

describe("the files as a whole", () => {
  it("hold no key, no email address besides the author's and no long secret-looking token", () => {
    for (const file of allFiles()) {
      if (file.startsWith("test/")) continue;
      const text = read(file);
      assert.ok(!/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(text.replaceAll("support@ihateposting.com", "")), `${file} has an email address`);
      assert.ok(!/Bearer\s+(?!\$\{|<)[A-Za-z0-9_-]{12,}/.test(text), `${file} has a literal bearer token`);
      assert.ok(!/\b[0-9a-f]{40,}\b/i.test(text), `${file} has a long hex token`);
      assert.ok(!/\b(sk|ihp|pk)[-_][A-Za-z0-9]{16,}/.test(text), `${file} has a key-shaped token`);
    }
  });

  it("make no network call of their own, write nothing to the console and run no program: the key only ever leaves in the MCP client's header", () => {
    for (const file of allFiles().filter((f) => f.startsWith("lib/"))) {
      const code = read(file).replace(/\/\/.*$/gm, "");
      assert.ok(!/\bfetch\s*\(|node:https?|node:net|node:dns|XMLHttpRequest|WebSocket|child_process/.test(code), `${file} reaches out`);
      assert.ok(!/process\.std(out|err)/.test(code), `${file} writes to the output`);
      assert.ok(!/console\.(log|info|warn|error|debug)\(/.test(code), `${file} calls console directly`);
    }
  });

  it("have exactly the layout the package says, and nothing else (no copy of the repository's skill: the plugin carries a short one of its own in lib/skill.js)", () => {
    assert.deepEqual(allFiles().sort(), ["LICENSE", "README.md", "cordis.patch.yml", "lib/index.js", "lib/skill.js", "package.json", "test/index.test.mjs", "test/package.json", "test/schemastery-stand-in.mjs", "test/stand-in-hooks.mjs"]);
    assert.ok(!fs.existsSync(path.join(PLUGIN, "lib", "key.js")), "the key check is gone: the plugin no longer refuses to load");
    assert.ok(!fs.existsSync(path.join(PLUGIN, "skill")), "the unused copy of the skill is gone");
  });
});

describe("README.md", () => {
  const readme = read("README.md");

  it("documents the four settings with their defaults, and the keyless behaviour with its consequence", () => {
    for (const setting of ["`apiKeyEnv` | `IHATEPOSTING_API_KEY`", "`apiKey` | `''`", "`baseUrl` | `https://app.ihateposting.com`", "`skill` | `true`"]) assert.ok(readme.includes(setting), `the settings table lacks ${setting}`);
    assert.match(readme, /Without a key[\s\S]*warning[\s\S]*401[\s\S]*registers no tools[\s\S]*keeps booting/);
    assert.ok(readme.includes("https://app.ihateposting.com/mcp"));
    assert.ok(!/refuses to load|is not loading because/.test(readme), "the old rule is still described");
  });

  it("names every tool an agent calls, the two rows, the install commands and the variable", () => {
    for (const tool of SERVER_TOOLS.filter((t) => t !== "uploadWidgetTicketTool")) assert.ok(readme.includes(tool), `the README never mentions ${tool}`);
    for (const part of ["`ihateposting`", "`ihateposting-mcp`", "dsh plugin --profile web add dsh-ihateposting", "dsh plugin --profile web add /absolute/path/to/iHatePosting-Agent/plugins/dsh-ihateposting", "IHATEPOSTING_API_KEY", "Settings > Agents / Dev"]) assert.ok(readme.includes(part), `the README lacks ${part}`);
  });

  it("says plainly what is unverified, and cites the pages the interface was checked against", () => {
    assert.match(readme, /## Unverified/);
    assert.match(readme, /No real `dsh` was run/);
    for (const page of ["docs/user/develop/basic/publish.md", "docs/user/develop/basic/index.md", "docs/user/develop/basic/config.md", "docs/cordis-primer.md", "packages/mcp/mcp-client/README.md"]) assert.ok(readme.includes(`https://github.com/deepseek-ai/deepseek-harness/blob/master/${page}`), `${page} is not cited`);
  });
});
