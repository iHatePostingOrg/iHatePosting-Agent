// The Claude Code plugin lives in a folder of its own, plugins/claude-ihateposting, without the program's `bin/`: Anthropic's platform-support page says a plugin with a top-level `bin/` "can't be
// installed" in Claude chat or Cowork, and its marketplace reference says a manifest plus an entry that both declare components is a conflict under `strict: false`. These tests hold the layout to
// what those pages and the plugin pre-submission checklist say (https://claude.com/docs/plugins/platform-support.md, https://code.claude.com/docs/en/plugins/marketplace-reference.md,
// https://claude.com/docs/plugins/pre-submission-checklist.md, read 2026-11-15). What only the `claude` command (`claude plugin validate`) can confirm is unverified: it is not installed here.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { ROOT, claudeCopyOf } from "./helpers.mjs";

const FOLDER = "plugins/claude-ihateposting";
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const json = (file) => JSON.parse(read(file));
const walk = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.posix.join(dir, e.name)) : [path.posix.join(dir, e.name)]));
const marketplace = json(".claude-plugin/marketplace.json");
const entry = marketplace.plugins[0];
const manifest = json(`${FOLDER}/.claude-plugin/plugin.json`);

describe("the Claude Code marketplace at the repository's root", () => {
  it("names the marketplace and the plugin so that the install line is `ihateposting@ihateposting` (the plugin keeps its name, the marketplace follows the package: the owner's answers of 2026-11-15, Back to ihateposting, and of 2026-11-19, all should be ihateposting)", () => {
    assert.equal(marketplace.name, "ihateposting");
    assert.match(marketplace.name, /^[A-Za-z0-9][A-Za-z0-9._-]*$/);
    assert.ok(!marketplace.name.includes(".."));
    assert.equal(marketplace.plugins.length, 1);
    assert.equal(entry.name, "ihateposting");
    assert.equal(entry.name, manifest.name, "the entry and the plugin's own manifest must agree on the name");
    assert.match(read("README.md"), /\/plugin marketplace add iHatePostingOrg\/iHatePosting-Agent\n/);
    assert.match(read("README.md"), /\/plugin install ihateposting@ihateposting\n/);
    assert.doesNotMatch(read("README.md"), /\/plugin install ihateposting@ihateposting-agent/, "the install line names the old marketplace");
    assert.doesNotMatch(read("README.md"), /\/plugin install ihateposting-agent@/, "the plugin was renamed in an install line");
  });

  it("points the entry at the plugin's folder with a relative path: from the repository root, starting with ./, forward slashes, no .., and the folder is a plugin", () => {
    assert.equal(entry.source, `./${FOLDER}`);
    assert.ok(entry.source.startsWith("./") && !entry.source.includes("..") && !entry.source.includes("\\"));
    assert.ok(fs.statSync(path.join(ROOT, entry.source)).isDirectory());
    assert.ok(fs.existsSync(path.join(ROOT, entry.source, ".claude-plugin", "plugin.json")));
  });

  it("declares no components of its own in the entry, and no version (the plugin's manifest has it), so there is no `strict` conflict and no duplicate-version warning", () => {
    for (const key of ["commands", "agents", "skills", "hooks", "outputStyles", "themes", "mcpServers", "version", "strict"]) assert.equal(entry[key], undefined, `the entry sets ${key}`);
    assert.ok(entry.description.length > 0);
  });

  it("is not also a plugin at the root: the repository's root, which holds bin/, has no plugin manifest for Claude", () => {
    assert.equal(fs.existsSync(path.join(ROOT, ".claude-plugin", "plugin.json")), false, "a root plugin.json makes the root a plugin that holds bin/");
    assert.deepEqual(fs.readdirSync(path.join(ROOT, ".claude-plugin")), ["marketplace.json"]);
  });
});

describe("the Claude Code plugin folder", () => {
  const files = walk(FOLDER);

  it("has a manifest with the name and version of the package, the default skill folder and no component declared", () => {
    assert.equal(manifest.name, "ihateposting");
    assert.equal(manifest.displayName, "iHatePosting");
    assert.equal(manifest.version, json("package.json").version);
    for (const key of ["skills", "commands", "agents", "hooks", "outputStyles", "themes", "mcpServers", "lspServers"]) assert.equal(manifest[key], undefined, `the manifest declares ${key}`);
    assert.equal(manifest.license, "MIT");
    assert.ok(files.includes(`${FOLDER}/skills/ihateposting/SKILL.md`));
    // The skill with the changes the Claude directory's check needs (owner, 2026-11-16 and "fix it" of 2026-11-21; `claudeCopyOf` in test/helpers.mjs lists them and test/package.test.mjs says why): plain
    // indented `metadata` lines, no line linking the npm page, and no mention of the key variable.
    const forTheClaudeDirectory = claudeCopyOf(read("SKILL.md"));
    assert.equal(read(`${FOLDER}/skills/ihateposting/SKILL.md`), forTheClaudeDirectory);
    assert.ok(!read(`${FOLDER}/skills/ihateposting/SKILL.md`).includes("IHATEPOSTING_API_KEY"), "the skill names the key variable, which the Claude directory holds for a reviewer");
  });

  it("holds nothing that claude.ai or Cowork refuse: no bin/ folder, no hooks, no package.json or lock file, no script, no server", () => {
    for (const file of files) {
      const parts = file.slice(FOLDER.length + 1).split("/");
      assert.ok(!parts.includes("bin"), `${file} is under a bin/ folder`);
      assert.ok(!parts.includes("hooks") && !parts.includes("scripts") && !parts.includes("node_modules"), file);
      assert.ok(!/(^|\/)(package(-lock)?\.json|\.mcp\.json|mcp\.json|pnpm-lock\.yaml|yarn\.lock)$/.test(file), `${file} would make the plugin more than a skill`);
    }
    assert.equal(fs.existsSync(path.join(ROOT, FOLDER, "bin")), false);
    assert.ok(fs.existsSync(path.join(ROOT, "bin", "ihateposting.mjs")), "the program's own bin/ stays at the repository's root");
  });

  it("meets the directory's file rules: at most 512 files, only text and complete PNG pictures, no symbolic link, path names of letters, digits, dots, hyphens and underscores", () => {
    assert.ok(files.length <= 512, `${files.length} files`);
    for (const file of files) {
      assert.ok(!fs.lstatSync(path.join(ROOT, file)).isSymbolicLink(), file);
      assert.match(file.split("/").slice(0, 2).join("/"), /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/, "the folders on the path to the plugin");
      if (/\.png$/.test(file)) {
        const png = fs.readFileSync(path.join(ROOT, file));
        assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], file);
        assert.deepEqual([...png.subarray(png.length - 8)], [0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82], `${file} is not a complete PNG`);
      } else {
        const text = fs.readFileSync(path.join(ROOT, file));
        assert.doesNotThrow(() => new TextDecoder("utf-8", { fatal: true }).decode(text), `${file} is not text`);
      }
    }
  });

  it("has a README of at least 40 words outside code blocks, and a LICENSE", () => {
    const words = read(`${FOLDER}/README.md`).replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter(Boolean).length;
    assert.ok(words >= 40, `${words} words`);
    assert.match(read(`${FOLDER}/LICENSE`), /^MIT License\r?\n\r?\nCopyright \(c\) 2026 iHatePostingOrg\r?$/m);
    assert.equal(read(`${FOLDER}/LICENSE`), read("LICENSE"));
  });

  it("says in its README everything the plugin runs, sends and fetches, and how it is installed, with the same names as the rest of the repository", () => {
    const readme = read(`${FOLDER}/README.md`);
    assert.match(readme, /It has no hooks, no scripts and no bundled server/);
    assert.match(readme, /npm install -g ihateposting(?![-\w])/);
    assert.match(readme, /https:\/\/app\.ihateposting\.com\/api/);
    assert.match(readme, /IHATEPOSTING_API_KEY/);
    assert.match(readme, /\/plugin marketplace add iHatePostingOrg\/iHatePosting-Agent/);
    assert.match(readme, /\/plugin install ihateposting@ihateposting(?![-\w])/);
    assert.ok(!readme.includes("@ihateposting.com") && !readme.includes("Parag"), "the README names the author");
  });

  it("has listing fields that point at things that exist: the icon inside the folder, five https addresses", () => {
    assert.ok(manifest.icon.startsWith("./") && !manifest.icon.includes(".."));
    assert.ok(fs.existsSync(path.join(ROOT, FOLDER, manifest.icon)));
    assert.ok(read(`${FOLDER}/logo.png`) !== undefined && fs.readFileSync(path.join(ROOT, FOLDER, "logo.png")).equals(fs.readFileSync(path.join(ROOT, "assets", "logo.png"))));
    for (const key of ["documentationUrl", "supportUrl", "privacyPolicyUrl", "termsOfServiceUrl"]) assert.match(manifest[key], /^https:\/\/[^\s@]+$/, key);
    assert.equal(manifest.homepage, "https://github.com/iHatePostingOrg/iHatePosting-Agent#readme");
  });
});
