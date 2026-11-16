// The name of the new listings: the owner's decision of 2026-11-15 ("No preference" to three names offered, the first used everywhere).
//   display name  iHatePosting   (the same as the live app's listings: owner, 2026-11-15, "Display name : iHatePosting")
//   the NEW Claude connector's slug  ihateposting-agent   (the live app's connector holds ihateposting)
//   the plugin, the skill and the Gemini extension keep the name ihateposting; the marketplaces and the npm package are ihateposting-agent (owner, 2026-11-15: "Back to ihateposting")
//   MCP Registry name  com.ihateposting/agent
// and no short description tells the new listing from the live app's (owner, 2026-11-15: "dont want this wording, make old one"): the descriptions are the old wording.
// Offline: it reads files only.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8").replace(/\r\n/g, "\n");
const json = (file) => JSON.parse(read(file));

const DISPLAY = "iHatePosting";
const SLUG = "ihateposting-agent"; // the marketplaces, the npm package and the new Claude connector's slug
const PLUGIN = "ihateposting"; // the plugin, the skill and the Gemini extension
const REGISTRY_NAME = "com.ihateposting/agent";
const FORBIDDEN = /new iHatePosting app|\bnew app\b|\(app\.ihateposting\.com\)/i;

const CLAUDE_PLUGIN = "plugins/claude-ihateposting/.claude-plugin/plugin.json";
const CHATGPT_PLUGIN = "plugins/chatgpt-ihateposting/plugin.json";
const chatgpt = json(CHATGPT_PLUGIN);
const ui = chatgpt.extensions["com.openai"].interface;

describe("the name of the new listings", () => {
  it("is `iHatePosting` wherever a listing shows a display name, and no display name says MCP or Plugin", () => {
    assert.equal(json(CLAUDE_PLUGIN).displayName, DISPLAY);
    assert.equal(ui.displayName, DISPLAY);
    assert.equal(json("server.json").title, DISPLAY);
    for (const name of [json(CLAUDE_PLUGIN).displayName, ui.displayName, json("server.json").title]) assert.ok(name.length <= 30 && !/\b(mcp|plugin)\b/i.test(name), name);
  });

  it("is `ihateposting` as the name of the plugin in every manifest and every marketplace entry, `ihateposting-agent` as the marketplaces' own name and the package's, and the install line joins the two", () => {
    const named = [
      [CLAUDE_PLUGIN, json(CLAUDE_PLUGIN).name],
      [".claude-plugin/marketplace.json", json(".claude-plugin/marketplace.json").plugins[0].name],
      [".cursor-plugin/plugin.json", json(".cursor-plugin/plugin.json").name],
      [".cursor-plugin/marketplace.json", json(".cursor-plugin/marketplace.json").plugins[0].name],
      [".grok-plugin/plugin.json", json(".grok-plugin/plugin.json").name],
      [".grok-plugin/marketplace.json", json(".grok-plugin/marketplace.json").plugins[0].name],
      ["gemini-extension.json", json("gemini-extension.json").name],
      [CHATGPT_PLUGIN, chatgpt.name],
    ];
    for (const [file, name] of named) assert.equal(name, PLUGIN, `${file} is called ${name}`);
    for (const file of [".claude-plugin/marketplace.json", ".cursor-plugin/marketplace.json", ".grok-plugin/marketplace.json"]) assert.equal(json(file).name, SLUG, `${file}: the marketplace's own name`);
    assert.equal(json("package.json").name, SLUG);
    assert.match(PLUGIN, /^[a-z0-9]+(-[a-z0-9]+)*$/, "kebab-case, as Claude Code, Cursor and xAI ask");
    assert.ok(PLUGIN.length <= 64 && SLUG.length <= 64, "OpenAI allows at most 64 characters");
    assert.match(read("README.md"), new RegExp(`/plugin install ${PLUGIN}@${SLUG}\\n`));
    assert.match(read("README.md"), new RegExp(`qwen extensions install iHatePostingOrg/iHatePosting-Agent:${PLUGIN}\\n`));
  });

  it("is `com.ihateposting/agent` in the registry draft, beside the old app's `com.ihateposting/mcp`, which the draft does not take over", () => {
    assert.equal(json("server.json").name, REGISTRY_NAME);
    assert.notEqual(json("server.json").name, "com.ihateposting/mcp");
    assert.match(json("server.json").name, /^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._-]+$/);
  });

  it("is in the old words everywhere: no short description tells the new listing from the live app's, and the lengths the places allow hold", () => {
    const descriptions = [
      [`${CLAUDE_PLUGIN} description`, json(CLAUDE_PLUGIN).description],
      [".claude-plugin/marketplace.json entry", json(".claude-plugin/marketplace.json").plugins[0].description],
      [".claude-plugin/marketplace.json metadata", json(".claude-plugin/marketplace.json").metadata.description],
      [".cursor-plugin/plugin.json", json(".cursor-plugin/plugin.json").description],
      [".cursor-plugin/marketplace.json entry", json(".cursor-plugin/marketplace.json").plugins[0].description],
      [".cursor-plugin/marketplace.json metadata", json(".cursor-plugin/marketplace.json").metadata.description],
      [".grok-plugin/plugin.json", json(".grok-plugin/plugin.json").description],
      [".grok-plugin/marketplace.json entry", json(".grok-plugin/marketplace.json").plugins[0].description],
      [".grok-plugin/marketplace.json", json(".grok-plugin/marketplace.json").description],
      ["gemini-extension.json", json("gemini-extension.json").description],
      [`${CHATGPT_PLUGIN} description`, chatgpt.description],
      [`${CHATGPT_PLUGIN} longDescription`, ui.longDescription],
      ["server.json", json("server.json").description],
      ["plugins/dsh-ihateposting/package.json", json("plugins/dsh-ihateposting/package.json").description],
      ["the Claude plugin's README", read("plugins/claude-ihateposting/README.md").split("\n\n")[1]],
      ["the DeepSeek plugin's README", read("plugins/dsh-ihateposting/README.md").split("\n\n")[1]],
      ["the guide's one line for the connector forms", read("PUBLISHING.md").match(/^\| One line \| (.+) \|$/m)[1]],
    ];
    for (const [where, text] of descriptions) assert.doesNotMatch(text, FORBIDDEN, `${where} tells the new listing from the live app's`);
    // The subtitle has 30 characters at most, and it too is in the old words.
    assert.doesNotMatch(ui.shortDescription, FORBIDDEN, "the subtitle tells the new listing from the live app's");
    assert.ok(ui.shortDescription.length <= 30, `the subtitle is ${ui.shortDescription.length} characters`);
    // The registry's description is limited to 100 characters.
    assert.ok(json("server.json").description.length <= 100);
  });

  it("is in the packs: the xAI entry and the DeepSeek list entry carry the name in the old words, and the Cursor and Claude rows name the slug", () => {
    const packs = read("SUBMISSIONS.md");
    const xai = JSON.parse(packs.match(/```json\n([\s\S]+?)\n```/)[1]);
    assert.equal(xai.name, PLUGIN);
    assert.doesNotMatch(xai.description, FORBIDDEN);
    assert.match(xai.description, /^iHatePosting social media automation\. Schedule posts,/);
    const yaml = packs.match(/```yaml\n([\s\S]+?)\n```/)[1];
    assert.doesNotMatch(yaml, FORBIDDEN);
    assert.match(yaml, /en: 'Connects DeepSeek Harness to iHatePosting over MCP:/);
    assert.match(packs, /A unique, lowercase, kebab-case `name` \| `ihateposting`\./);
    assert.match(packs, /name `ihateposting`, display name `iHatePosting`/);
    assert.match(packs, /one plugin, `ihateposting`/);
  });

  it("is written down in PUBLISHING.md with the places where it is taken or risky, and the connector slug and the ClawHub slug use it", () => {
    const guide = read("PUBLISHING.md");
    assert.match(guide, /^#### The name of the new listings \(the owner's decision of 2026-11-15\)$/m);
    assert.match(guide, /Three names were offered \(iHatePosting Agent, iHatePosting for Agents, iHatePosting App\) and the owner answered "No preference"/);
    assert.match(guide, /\| Slug of the new Claude connector \(permanent once published\) \| `ihateposting-agent` \|/);
    assert.match(guide, /"Back to ihateposting"/);
    assert.match(guide, /\*\*DeepSeek's npm package, `dsh-ihateposting`\*\*/);
    for (const place of ["Gemini", "cursor.directory", "The Claude plugin portal", "ChatGPT", "skills.sh"]) assert.ok(guide.includes(`**${place}`), `the guide does not say what happens at ${place}`);
    assert.match(guide, /clawhub skill publish \.\/skills\/ihateposting --slug ihateposting\n/);
    assert.match(guide, /The new listing's slug is `ihateposting-agent`/);
  });

  it("leaves the skill's own name and folder alone: a skill's name has to match its folder, and renaming the folder changes a workflow the owner left untouched", () => {
    assert.match(read("SKILL.md"), /^---\nname: ihateposting\n/);
    assert.ok(fs.existsSync(path.join(ROOT, "skills", "ihateposting", "SKILL.md")));
    assert.equal(fs.existsSync(path.join(ROOT, "skills", SLUG)), false);
  });
});
