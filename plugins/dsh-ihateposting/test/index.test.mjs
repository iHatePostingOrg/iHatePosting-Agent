// Tests for the dsh-ihateposting plugin. They use no network, no key of a real
// account and nothing installed: a made-up key is put into the environment only
// to see that it never comes out again. Run from the repository root with
//   node --test plugins/dsh-ihateposting/test
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const PLUGIN = fileURLToPath(new URL("../", import.meta.url));
const read = (file) => fs.readFileSync(path.join(PLUGIN, file), "utf8");
const pkg = JSON.parse(read("package.json"));

const MCP_URL = "https://app.ihateposting.com/api/mcp";
const FAKE_KEY = "test-key-0123456789-not-real";

/** Every file of the plugin folder, as paths relative to it. */
function allFiles(dir = PLUGIN) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "node_modules") return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? allFiles(full) : [path.relative(PLUGIN, full).replaceAll("\\", "/")];
  });
}

/** Runs `fn` with IHATEPOSTING_API_KEY set to `value` (undefined: not set at all), then puts the old value back. */
function withKey(value, fn) {
  const before = process.env.IHATEPOSTING_API_KEY;
  if (value === undefined) delete process.env.IHATEPOSTING_API_KEY;
  else process.env.IHATEPOSTING_API_KEY = value;
  try {
    return fn();
  } finally {
    if (before === undefined) delete process.env.IHATEPOSTING_API_KEY;
    else process.env.IHATEPOSTING_API_KEY = before;
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

/** A stand-in for the context DeepSeek Harness hands to a plugin: only `skills.register`, recording what it gets. */
function fakeContext() {
  const registered = [];
  return { registered, skills: { register: (skill) => (registered.push(skill), () => {}) } };
}

/** The rows of cordis.patch.yml without comments, as text lines (no YAML parser is installed, so the file is read as text). */
const patchLines = read("cordis.patch.yml")
  .split("\n")
  .filter((line) => !/^\s*#/.test(line) && line.trim() !== "");

/** The JavaScript inside a `key: !!js '...'` line of the patch, as a function of a made-up `process`. */
function patchExpression(key) {
  const line = patchLines.find((l) => new RegExp(`^\\s*${key}: !!js '`).test(l));
  assert.ok(line, `no !!js line for ${key}`);
  const source = line.replace(new RegExp(`^\\s*${key}: !!js '`), "").replace(/'\s*$/, "");
  assert.ok(!source.includes("''"), "the expression has a doubled quote, which YAML would read differently");
  return (env) => new Function("process", `return ${source}`)({ env });
}

describe("package.json", () => {
  it("is an MIT, plain-JavaScript ES module by its author that a plugin manager can read as a bundle", () => {
    assert.equal(pkg.name, "dsh-ihateposting");
    assert.equal(pkg.license, "MIT");
    assert.deepEqual(pkg.author, { name: "Parag Hasmukhbhai Gajera", email: "support@ihateposting.com", url: "https://github.com/iHatePostingOrg" });
    assert.equal(pkg.type, "module");
    assert.deepEqual(pkg.dsh, { bundle: { patch: "./cordis.patch.yml" } });
    assert.ok(pkg.keywords.includes("dsh-plugin"));
    assert.equal(typeof pkg.description, "string");
    assert.ok(pkg.description.length > 20);
    assert.equal(pkg.dependencies, undefined, "the plugin needs no dependency");
    assert.equal(pkg.devDependencies, undefined);
  });

  it("points only at files that exist, and ships the skill copy and the patch", () => {
    assert.ok(fs.existsSync(path.join(PLUGIN, pkg.main)));
    assert.equal(pkg.exports["."], pkg.main);
    for (const entry of pkg.files) assert.ok(fs.existsSync(path.join(PLUGIN, entry)), `${entry} is listed in files but missing`);
    for (const needed of ["lib/", "skill/", "cordis.patch.yml", "README.md", "LICENSE"]) assert.ok(pkg.files.includes(needed), `${needed} is not shipped`);
    assert.ok(!pkg.files.some((f) => f.startsWith("test")), "the tests are not shipped");
  });

  it("carries the licence of the repository", () => {
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

  it("connects over streamable HTTP to iHatePosting's key address and to no other address", () => {
    assert.ok(patchLines.includes("        transport: streamable-http"));
    assert.ok(patchLines.includes(`        url: ${MCP_URL}`));
    const addresses = patchLines.join("\n").match(/https?:\/\/\S+/g);
    assert.deepEqual(addresses, [MCP_URL]);
    assert.ok(!read("cordis.patch.yml").includes("/api/mcp/oauth"), "the browser sign-in address is not wired");
    assert.ok(!MCP_URL.endsWith("/"));
  });

  it("names the server so that its tools start with mcp__ihateposting__ (1 to 32 letters, digits, _ or -)", () => {
    const line = patchLines.find((l) => l.trim().startsWith("serverName:"));
    const serverName = line.split(":")[1].trim();
    assert.equal(serverName, "ihateposting");
    assert.match(serverName, /^[A-Za-z0-9_-]{1,32}$/);
  });

  it("reads the key from IHATEPOSTING_API_KEY in exactly two places: the row's switch and its Authorization header", () => {
    const uses = patchLines.filter((l) => l.includes("process.env."));
    assert.equal(uses.length, 2);
    for (const line of uses) assert.ok(line.includes("process.env.IHATEPOSTING_API_KEY"), line);
    assert.equal(patchLines.filter((l) => l.includes("Authorization")).length, 1);
    assert.ok(!patchLines.some((l) => /Bearer\s+[A-Za-z0-9_-]{8,}/.test(l)), "a literal key");
    // the switch and the header belong to the MCP row, not to the plugin's own row
    const mcpRow = patchLines.slice(patchLines.indexOf("    - id: ihateposting-mcp"));
    for (const line of uses) assert.ok(mcpRow.includes(line), "a use of the key outside the MCP row");
  });

  it("switches the MCP row off while the key is missing, empty or only spaces, and on when there is one", () => {
    const disabled = patchExpression("disabled");
    assert.equal(disabled({}), true);
    assert.equal(disabled({ IHATEPOSTING_API_KEY: "" }), true);
    assert.equal(disabled({ IHATEPOSTING_API_KEY: "   " }), true);
    assert.equal(disabled({ IHATEPOSTING_API_KEY: FAKE_KEY }), false);
  });

  it("builds the header as `Bearer <key>` (spaces around the key dropped) and never fails on a missing key", () => {
    const header = patchExpression("Authorization");
    assert.equal(header({ IHATEPOSTING_API_KEY: FAKE_KEY }), `Bearer ${FAKE_KEY}`);
    assert.equal(header({ IHATEPOSTING_API_KEY: `  ${FAKE_KEY}\n` }), `Bearer ${FAKE_KEY}`);
    assert.doesNotThrow(() => header({}));
  });
});

describe("the key check (lib/key.js)", async () => {
  const { requireKey, KEY_VARIABLE, MISSING_KEY_MESSAGE } = await import("../lib/key.js");

  it("names IHATEPOSTING_API_KEY", () => {
    assert.equal(KEY_VARIABLE, "IHATEPOSTING_API_KEY");
  });

  it("accepts a key and refuses a missing, empty, blank or non-text one with the same single sentence", () => {
    assert.doesNotThrow(() => requireKey({ IHATEPOSTING_API_KEY: FAKE_KEY }));
    for (const env of [{}, { IHATEPOSTING_API_KEY: "" }, { IHATEPOSTING_API_KEY: " \t\n" }, { IHATEPOSTING_API_KEY: undefined }, { IHATEPOSTING_API_KEY: 42 }]) {
      assert.throws(() => requireKey(env), { message: MISSING_KEY_MESSAGE });
    }
  });

  it("says it in one sentence, names the variable and where to get a key, and has no value in it", () => {
    assert.ok(!MISSING_KEY_MESSAGE.includes("\n"));
    assert.ok(MISSING_KEY_MESSAGE.endsWith("."));
    assert.equal(MISSING_KEY_MESSAGE.slice(0, -1).includes("."), false, "more than one sentence");
    assert.ok(MISSING_KEY_MESSAGE.includes("IHATEPOSTING_API_KEY"));
    assert.ok(MISSING_KEY_MESSAGE.includes("Settings > Agents / Dev"));
  });

  it("does not put the value of a refused key into the message", () => {
    for (const bad of [" ", "\t"]) {
      try {
        requireKey({ IHATEPOSTING_API_KEY: bad });
        assert.fail("accepted");
      } catch (error) {
        assert.equal(error.message, MISSING_KEY_MESSAGE);
      }
    }
  });
});

describe("the skill (lib/skill.js)", async () => {
  const { loadSkill, stripFrontmatter, SKILL_NAME, SKILL_DESCRIPTION, NOTE } = await import("../lib/skill.js");

  it("is a kebab-case name with a description, as ctx.skills.register wants", () => {
    assert.match(SKILL_NAME, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(SKILL_DESCRIPTION.length > 40);
    const skill = loadSkill();
    assert.deepEqual(Object.keys(skill).sort(), ["content", "description", "name"]);
    assert.equal(skill.name, SKILL_NAME);
  });

  it("puts the note first, then iHatePosting's skill text without its metadata block", () => {
    const { content } = loadSkill();
    assert.ok(content.startsWith(NOTE));
    assert.ok(!content.startsWith("---"));
    assert.ok(!content.includes("metadata: {"), "the metadata block is still in");
    assert.ok(content.includes("Four rules to follow every time"));
    assert.ok(content.includes("mcp__ihateposting__"));
    assert.ok(content.includes("IHATEPOSTING_API_KEY"));
  });

  it("strips a metadata block, with either kind of line ending, and leaves text without one alone", () => {
    assert.equal(stripFrontmatter("---\nname: x\n---\nBody\n"), "Body\n");
    assert.equal(stripFrontmatter("---\r\nname: x\r\n---\r\n\r\nBody\r\n"), "Body\r\n");
    assert.equal(stripFrontmatter("Body only\n"), "Body only\n");
    assert.equal(stripFrontmatter("A --- b\n"), "A --- b\n");
  });

  it("bundles a byte for byte copy of the repository's SKILL.md when run inside the repository", (t) => {
    const original = path.join(PLUGIN, "../../SKILL.md");
    if (!fs.existsSync(original)) return t.skip("not run inside the repository");
    assert.ok(fs.readFileSync(original).equals(fs.readFileSync(path.join(PLUGIN, "skill/SKILL.md"))), "skill/SKILL.md differs from the repository's SKILL.md");
  });
});

describe("the plugin (lib/index.js)", async () => {
  const plugin = await import("../lib/index.js");
  const { MISSING_KEY_MESSAGE } = await import("../lib/key.js");

  it("exports the three things a Cordis plugin needs: a name, the services it needs, and apply", () => {
    assert.equal(plugin.name, "ihateposting");
    assert.deepEqual(plugin.inject, ["skills"]);
    assert.equal(typeof plugin.apply, "function");
    assert.deepEqual(Object.keys(plugin).sort(), ["apply", "inject", "name"]);
  });

  it("registers the skill once, with a source, when a key is set", () => {
    const ctx = fakeContext();
    withKey(FAKE_KEY, () => plugin.apply(ctx));
    assert.equal(ctx.registered.length, 1);
    const [skill] = ctx.registered;
    assert.equal(skill.name, "ihateposting");
    assert.equal(skill.source, "runtime");
    assert.ok(skill.description.length > 40);
    assert.ok(skill.content.includes("Four rules to follow every time"));
  });

  it("refuses to load without a key and registers nothing", () => {
    for (const value of [undefined, "", "   "]) {
      const ctx = fakeContext();
      assert.throws(() => withKey(value, () => plugin.apply(ctx)), { message: MISSING_KEY_MESSAGE });
      assert.equal(ctx.registered.length, 0);
    }
  });

  it("never prints the key, and never hands it to the skill", () => {
    const ctx = fakeContext();
    const output = captureOutput(() => withKey(FAKE_KEY, () => plugin.apply(ctx)));
    assert.equal(output, "", "the plugin printed something");
    assert.ok(!JSON.stringify(ctx.registered).includes(FAKE_KEY));
    const failure = captureOutput(() => assert.throws(() => withKey("  ", () => plugin.apply(fakeContext()))));
    assert.equal(failure, "");
  });

  it("makes no network call and writes no log: the key only ever leaves in the MCP row's header", () => {
    for (const file of allFiles().filter((f) => f.startsWith("lib/"))) {
      const code = read(file);
      assert.ok(!/\bfetch\s*\(|node:https?|node:net|node:dns|XMLHttpRequest|WebSocket|child_process/.test(code), `${file} reaches out`);
      assert.ok(!/console\.|process\.std(out|err)|\bprocess\.env\b.*(log|write)/.test(code.replace(/\/\/.*$/gm, "")), `${file} writes output`);
      assert.ok(!code.includes("http://") && !code.includes("https://"), `${file} holds an address`);
    }
  });
});

describe("the files as a whole", () => {
  it("hold no key, no email address and no long secret-looking token", () => {
    for (const file of allFiles()) {
      const text = read(file);
      // The author's one address is in package.json (the owner gave it for the public repository); no other address is anywhere.
      assert.ok(!/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(text.replaceAll("support@ihateposting.com", "")), `${file} has an email address`);
      assert.ok(!/Bearer\s+(?!\$\{|<)[A-Za-z0-9_-]{12,}/.test(text), `${file} has a literal bearer token`);
      assert.ok(!/\b[0-9a-f]{40,}\b/i.test(text), `${file} has a long hex token`);
      assert.ok(!/\b(sk|ihp|pk)[-_][A-Za-z0-9]{16,}/.test(text), `${file} has a key-shaped token`);
    }
  });

  it("have exactly the layout the package says, and nothing else", () => {
    assert.deepEqual(allFiles().sort(), ["LICENSE", "README.md", "cordis.patch.yml", "lib/index.js", "lib/key.js", "lib/skill.js", "package.json", "skill/SKILL.md", "test/index.test.mjs", "test/package.json"]);
  });
});

describe("README.md", () => {
  const readme = read("README.md");

  it("says plainly what is unverified and that nothing has been published to npm", () => {
    assert.match(readme, /unverified/i);
    assert.match(readme, /not (been )?published/i);
    assert.ok(readme.includes("dsh plugin"));
    assert.ok(readme.includes("IHATEPOSTING_API_KEY"));
  });

  it("names the public pages the interface was checked against", () => {
    for (const page of ["docs/user/develop/basic/publish.md", "docs/subsystems/skills.md", "packages/mcp/mcp-client/README.md", "docs/user/develop/basic/config.md"]) {
      assert.ok(readme.includes(`https://github.com/deepseek-ai/deepseek-harness/blob/master/${page}`), `${page} is not cited`);
    }
  });
});
