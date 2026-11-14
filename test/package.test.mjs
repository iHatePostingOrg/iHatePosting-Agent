// The package and its files hold together: one version everywhere, the skill and its copy the same, the skill naming every command the program has, every plugin manifest
// valid and pointing at things that exist, the package holding what it should and nothing it should not, the trade-offs said where a person reads them, and no key anywhere.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { run } from "./helpers.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const json = (file) => JSON.parse(read(file));
const pkg = json("package.json");

/** The commands the program itself lists in its help (so a command added to the program and not to the skill is found). */
async function commandsOfTheProgram() {
  const { stdout } = await run(["--help"]);
  return [...stdout.matchAll(/^ {2}ihateposting-agent (\S+)/gm)].map((m) => m[1]);
}

describe("the package", () => {
  it("is MIT, plain JavaScript for Node 20, with the two libraries the command line is built on and a command named like the package", () => {
    assert.equal(pkg.name, "ihateposting-agent");
    assert.equal(pkg.license, "MIT");
    assert.equal(pkg.type, "module");
    assert.match(pkg.engines.node, /20/);
    assert.deepEqual(Object.keys(pkg.dependencies).sort(), ["node-fetch", "yargs"]);
    assert.deepEqual(pkg.devDependencies ?? {}, {});
    assert.deepEqual(Object.keys(pkg.bin), ["ihateposting-agent"]);
    assert.ok(fs.existsSync(path.join(ROOT, pkg.bin["ihateposting-agent"])));
    assert.ok(read(pkg.bin["ihateposting-agent"]).startsWith("#!/usr/bin/env node\n"));
    assert.ok(read("LICENSE").includes("MIT License"));
  });

  it("holds exactly what `npm pack` would ship: the commands, the skill, the docs, the licence; no test, key or plugin folder", () => {
    const listed = JSON.parse(execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: ROOT, encoding: "utf8", shell: process.platform === "win32" }));
    const files = listed[0].files.map((f) => f.path.replaceAll("\\", "/")).sort();
    for (const needed of ["bin/ihateposting-agent.mjs", "src/index.mjs", "src/api.mjs", "src/config.mjs", "src/constants.mjs", "src/commands/auth.mjs", "src/commands/posts.mjs", "src/commands/integrations.mjs", "src/commands/analytics.mjs", "src/commands/upload.mjs", "SKILL.md", "skills/ihateposting-agent/SKILL.md", "README.md", "CHANGELOG.md", "LICENSE", "package.json"]) assert.ok(files.includes(needed), `${needed} is not in the package`);
    for (const file of files) assert.ok(!/^(test|\.|PUBLISHING|assets|mcp\.json|gemini|plugins|examples)/.test(file) && !/credentials|\.env/.test(file), `${file} should not be shipped`);
    assert.ok(!files.some((f) => /login-page|loopback/.test(f)), "the old loopback sign-in page is back");
  });
});

describe("one version everywhere", () => {
  it("is the same in the package, the CHANGELOG's newest entry and every plugin manifest", () => {
    const v = pkg.version;
    assert.match(v, /^\d+\.\d+\.\d+$/);
    assert.match(read("CHANGELOG.md"), new RegExp(`^## ${v.replaceAll(".", "\\.")}`, "m"));
    assert.equal(json(".claude-plugin/plugin.json").version, v);
    assert.equal(json(".cursor-plugin/plugin.json").version, v);
    assert.equal(json(".grok-plugin/plugin.json").version, v);
    assert.equal(json("gemini-extension.json").version, v);
    assert.equal(json(".claude-plugin/marketplace.json").metadata.version, v);
    assert.equal(json(".cursor-plugin/marketplace.json").plugins[0].version, v);
    assert.equal(json(".grok-plugin/marketplace.json").plugins[0].version, v);
    assert.equal(json("plugins/dsh-ihateposting/package.json").version, v);
  });

  it("is the version the program itself shows", async () => {
    const { stdout, code } = await run(["--version"]);
    assert.equal(code, 0);
    assert.equal(stdout.trim(), pkg.version);
  });
});

describe("the skill", () => {
  it("is one text in two places, with the frontmatter an installer reads", () => {
    assert.equal(read("SKILL.md"), read("skills/ihateposting-agent/SKILL.md"));
    assert.equal(read("SKILL.md"), read("plugins/dsh-ihateposting/skill/SKILL.md"), "the DeepSeek Harness plugin carries another copy of the skill");
    const text = read("SKILL.md");
    assert.match(text, /^---\nname: ihateposting-agent\ndescription: .{60,}\n/);
    assert.match(text, /^---\n[\s\S]*?\n---\n/);
  });

  it("names every command the program has, and no command it does not have", async () => {
    const commands = await commandsOfTheProgram();
    assert.equal(commands.length, 19, `the help lists ${commands.join(", ")}`);
    const text = read("SKILL.md");
    for (const name of commands) assert.ok(text.includes(`ihateposting-agent ${name}`), `${name} is not in the skill`);
    const named = new Set([...text.matchAll(/ihateposting-agent ([a-z]+(?::[a-z]+)?)(?=[\s`"'<]|$)/g)].map((m) => m[1]));
    for (const name of named) assert.ok(commands.includes(name) || ["--help", "--version"].includes(name), `the skill names "${name}", which is no command`);
  });

  it("says in the skill and the README how to sign in, the key's variable and the exit code, and no other exit code", () => {
    for (const file of ["SKILL.md", "README.md"]) {
      const text = read(file);
      assert.ok(text.includes("IHATEPOSTING_API_KEY"), file);
      assert.ok(text.includes("auth:login"), file);
      assert.match(text, /exit code `?1`?/i, file);
      assert.ok(!/exit(s| code)? `?[23]`?\b/i.test(text), `${file} names an exit code the program does not have`);
    }
  });

  it("says plainly, where a person reads before pointing the program at a server, what following the other command line costs", () => {
    assert.match(read("README.md"), /plain `http:\/\/` address is accepted for any host/);
    assert.match(read("README.md"), /Redirects are followed, and the key follows them/);
    assert.match(read("README.md"), /A request waits for ever/);
    assert.match(read("CHANGELOG.md"), /keeps the `Authorization` header/);
    assert.match(read("CHANGELOG.md"), /plain `http:\/\/`/);
  });

  it("says it was not made from the live agent-skill repository, and nothing else in the repository leans on it", () => {
    assert.match(read("CHANGELOG.md"), /\*\*not based on\*\* the `iHatePostingOrg\/agent-skill` repository/);
    for (const file of ["README.md", "SKILL.md", "PUBLISHING.md", "package.json", "src/index.mjs", "src/api.mjs", "src/config.mjs", "src/constants.mjs", "src/commands/auth.mjs", "src/commands/posts.mjs", "src/commands/integrations.mjs", "src/commands/analytics.mjs", "src/commands/upload.mjs"]) {
      assert.doesNotMatch(read(file), /agent-skill|iHatePostingOrg\/iHatePosting-Skill|@ihateposting\//i, `${file} names the live agent-skill repository or its npm packages`);
    }
    // The commands are the ones the program has; the live packages' commands are not here.
    const text = read("SKILL.md");
    for (const foreign of ["whoami", "upload:url", "notifications:", "groups:list", "login <key>"]) assert.ok(!text.includes(`ihateposting-agent ${foreign}`) && !text.includes(`ihateposting ${foreign}`), `the skill names "${foreign}"`);
  });

  it("ships the two release workflows, written to run only on a published release, that check the tag, and never hold a secret", () => {
    for (const [file, mustHave] of [[".github/workflows/publish-npm.yml", ["release:", "types: [published]", "RELEASE_TAG", "secrets.NPM_TOKEN", "npm test"]], [".github/workflows/sync-skill.yml", ["release:", "skills/ihateposting-agent/SKILL.md", "plugins/dsh-ihateposting/skill/SKILL.md", "workflow_dispatch"]]]) {
      const text = read(file);
      for (const needle of mustHave) assert.ok(text.includes(needle), `${file} lacks ${needle}`);
      assert.doesNotMatch(text, /npm_[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}/, `${file} holds a token`);
      assert.doesNotMatch(text, /\bon:\s*\n\s*push/, `${file} runs on every push`);
    }
    assert.match(read(".github/workflows/publish-npm.yml"), /prerelease/);
    // The workflow runs the repository's own test script, not a list of files that can drift from the files that exist.
    for (const named of read(".github/workflows/publish-npm.yml").matchAll(/test\/([\w.-]+\.test\.mjs)/g)) assert.ok(fs.existsSync(path.join(ROOT, "test", named[1])), `the workflow runs ${named[1]}, which is not here`);
  });
});

describe("the plugin folders", () => {
  it("are valid JSON, name the package, and point at files that exist", () => {
    for (const file of [".claude-plugin/plugin.json", ".claude-plugin/marketplace.json", ".cursor-plugin/plugin.json", ".cursor-plugin/marketplace.json", ".cursor-plugin/mcp.json", ".grok-plugin/plugin.json", ".grok-plugin/marketplace.json", ".grok-plugin/mcp.json", "gemini-extension.json", "mcp.json"]) assert.ok(json(file), file);
    for (const file of [".claude-plugin/plugin.json", ".cursor-plugin/plugin.json", ".grok-plugin/plugin.json", "gemini-extension.json"]) assert.equal(json(file).name, "ihateposting-agent", file);
    for (const file of [".claude-plugin/plugin.json", ".cursor-plugin/plugin.json", ".grok-plugin/plugin.json"]) for (const skill of json(file).skills) assert.ok(fs.existsSync(path.join(ROOT, skill, "SKILL.md")), `${file}: ${skill}`);
    for (const file of [".cursor-plugin/plugin.json", ".grok-plugin/plugin.json"]) assert.ok(fs.existsSync(path.join(ROOT, json(file).logo)), `${file}: its logo`);
    // The logo is the app's current "i" mark as a real PNG (a stale heart SVG was shipped once and the owner caught it), not a text file with a picture's name.
    const logo = fs.readFileSync(path.join(ROOT, "assets", "logo.png"));
    assert.deepEqual([...logo.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "assets/logo.png is not a PNG");
    assert.equal(fs.existsSync(path.join(ROOT, "assets", "logo.svg")), false, "the old logo.svg is back");
    assert.ok(fs.existsSync(path.join(ROOT, json(".cursor-plugin/plugin.json").mcpServers)));
    assert.ok(fs.existsSync(path.join(ROOT, json(".grok-plugin/plugin.json").mcpServers)));
  });

  it("all point the hosted MCP server at the app's sign-in address", () => {
    for (const file of [".cursor-plugin/mcp.json", ".grok-plugin/mcp.json", "mcp.json"]) assert.deepEqual(json(file), { ihateposting: { type: "http", url: "https://app.ihateposting.com/api/mcp/oauth" } }, file);
    assert.equal(json("gemini-extension.json").mcpServers.ihateposting.httpUrl, "https://app.ihateposting.com/api/mcp/oauth");
  });

  it("hold no key, token or email address of a person", () => {
    for (const file of [".claude-plugin/plugin.json", ".claude-plugin/marketplace.json", ".cursor-plugin/plugin.json", ".cursor-plugin/marketplace.json", ".grok-plugin/plugin.json", ".grok-plugin/marketplace.json", "gemini-extension.json"]) assert.ok(!/@[a-z0-9-]+\.[a-z]{2,}/i.test(read(file)), `${file} holds an email address`);
  });
});

describe("the repository", () => {
  const walk = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) => (e.name === ".git" || e.name === "node_modules" ? [] : e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

  it("holds no API key, no token and no private path in any file", () => {
    for (const file of walk(".")) {
      if (/\.(png|jpg|svg|ico|gif)$/.test(file) || file === "package-lock.json") continue;
      const text = read(file);
      // The tests' own stand-in keys are runs of one letter; a real key is not.
      for (const key of text.match(/\b[0-9a-f]{64}\b/g) ?? []) assert.ok(/^(.)\1{63}$/.test(key) || (/^(?:[0-9a-f]{4}){16}$/.test(key) && file.includes("break.test")), `${file} holds a key-like text`);
      assert.equal(/pos_[A-Za-z0-9]{40}/.test(text.replace(/pos_(.)\1{39}/g, "")), false, `${file} holds a token-like text`);
      assert.equal(/D:\\Users|C:\\Users|\/Users\/[a-z]/i.test(text), false, `${file} names a private path`);
    }
  });

  it("ignores a saved key, an environment file and node_modules", () => {
    const ignore = read(".gitignore");
    for (const line of ["credentials.json", ".env", "node_modules/"]) assert.ok(ignore.includes(line), line);
  });
});
