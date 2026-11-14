// The documents hold together: every relative link in a Markdown file leads to a file that exists, the repository never names the command line it was shaped on,
// every example file a document mentions is there, and the README's header shows the logo that exists. No network and no key.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SKIP = new Set(["node_modules", ".git"]);

const walk = (dir) =>
  fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) => (SKIP.has(e.name) ? [] : e.isDirectory() ? walk(path.posix.join(dir, e.name)) : [path.posix.join(dir, e.name)]));
const files = walk(".");
const markdown = files.filter((f) => f.endsWith(".md"));
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

describe("the Markdown documents", () => {
  it("has a README, a summary, a changelog and the guides, each with text in it", () => {
    for (const name of ["README.md", "SUMMARY.md", "CHANGELOG.md", "SKILL.md", "QUICK_START.md", "FEATURES.md", "HOW_TO_RUN.md", "PROJECT_STRUCTURE.md", "PUBLISHING.md", "PROVIDER_SETTINGS.md", "PROVIDER_SETTINGS_SUMMARY.md", "INTEGRATION_SETTINGS_DISCOVERY.md", "INTEGRATION_TOOLS_WORKFLOW.md", "SUPPORTED_FILE_TYPES.md", "SYNTAX_UPGRADE.md", "CONTRIBUTING.md", "examples/COMMAND_LINE_GUIDE.md", "examples/EXAMPLES.md"]) {
      assert.ok(files.includes(name), `${name} is missing`);
      assert.ok(read(name).split("\n").length > 30, `${name} is nearly empty`);
    }
  });

  it("links only to files that exist: every relative link and image of every document", () => {
    const broken = [];
    for (const file of markdown) {
      // Code blocks are not links; a link inside one is an example.
      const text = read(file).replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
      for (const match of text.matchAll(/!?\[[^\]\n]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)|<(?:img|a)\s[^>]*?(?:src|href)="([^"]+)"/g)) {
        const target = (match[1] ?? match[2]).split("#")[0];
        if (!target || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target)) continue;
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), decodeURI(target)));
        if (!fs.existsSync(path.join(ROOT, resolved))) broken.push(`${file} -> ${target}`);
      }
    }
    assert.deepEqual(broken, []);
  });

  it("shows the logo at the top of the README, and the logo is a real PNG", () => {
    const head = read("README.md").split("\n").slice(0, 8).join("\n");
    assert.match(head, /<p align="center">/);
    assert.match(head, /<img src="assets\/logo\.png"/);
    assert.deepEqual([...fs.readFileSync(path.join(ROOT, "assets/logo.png")).subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  });

  it("lists every document in the README's documentation section", () => {
    const readme = read("README.md");
    for (const name of ["SUMMARY.md", "QUICK_START.md", "FEATURES.md", "HOW_TO_RUN.md", "PROJECT_STRUCTURE.md", "PROVIDER_SETTINGS.md", "INTEGRATION_SETTINGS_DISCOVERY.md", "INTEGRATION_TOOLS_WORKFLOW.md", "SUPPORTED_FILE_TYPES.md", "SYNTAX_UPGRADE.md", "PUBLISHING.md", "CHANGELOG.md", "examples/COMMAND_LINE_GUIDE.md", "examples/EXAMPLES.md"]) {
      assert.ok(readme.includes(`](${name})`) || readme.includes(`](./${name})`), `the README does not link ${name}`);
    }
  });

  it("names every example file it mentions, and the file exists", () => {
    const missing = [];
    for (const file of markdown) {
      for (const match of read(file).matchAll(/examples\/([A-Za-z0-9_.-]+\.(?:json|sh|md))/g)) if (!fs.existsSync(path.join(ROOT, "examples", match[1]))) missing.push(`${file} -> examples/${match[1]}`);
    }
    assert.deepEqual(missing, []);
  });
});

describe("the repository's own words", () => {
  it("never names the command line it was shaped on, in any file", () => {
    // The name is written in two pieces so that this file does not name it either.
    const name = new RegExp(["pos", "tiz"].join(""), "i");
    const named = [];
    for (const file of files) {
      if (/\.(png|jpg|ico|gif)$/.test(file) || file === "package-lock.json") continue;
      if (name.test(read(file))) named.push(file);
    }
    assert.deepEqual(named, []);
  });

  it("holds no key, token, email address or private path in any document or example", () => {
    for (const file of files) {
      if (!/\.(md|json|sh|yml)$/.test(file) || file === "package-lock.json" || file.startsWith("test/") || /(^|\/)(package\.json|plugin\.json|marketplace\.json|gemini-extension\.json)$/.test(file)) continue; // the manifests are package.test.mjs's
      const text = read(file);
      assert.equal(/pos_[A-Za-z0-9]{40}/.test(text), false, `${file} holds a token-like text`);
      assert.equal(/\b[0-9a-f]{64}\b/.test(text), false, `${file} holds a key-like text`);
      assert.equal(/D:\\Users|C:\\Users|\/Users\/[a-z]/i.test(text), false, `${file} names a private path`);
      for (const mail of text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/gi) ?? []) assert.ok(/@(?:example\.(?:com|org)|users\.noreply\.github\.com)$/i.test(mail) || /^[^@]+@[0-9.]+$/.test(mail) || /@(?:types|ihateposting|deepseek-ai)\//.test(mail), `${file} holds an email address: ${mail}`);
    }
  });
});
