// SUBMISSIONS.md: the four copy-paste packs (Cursor Marketplace, the Claude plugin portal, DeepSeek Harness, the xAI marketplace). The facts the packs state about this repository are checked against the
// files, and what is meant to be pasted is checked to be well-formed. Nothing here needs the network.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { ROOT } from "./helpers.mjs";

const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const json = (file) => JSON.parse(read(file));
const OTHER_PRODUCT = ["Post", "iz"].join(""); // the public repository never names the other product
const doc = read("SUBMISSIONS.md");
const pack = (n) => {
  const start = doc.indexOf(`## Pack ${n}:`);
  const next = doc.indexOf("\n## ", start + 5);
  return doc.slice(start, next < 0 ? undefined : next);
};
const blocks = (text, lang) => [...text.matchAll(new RegExp("```" + lang + "\\n([\\s\\S]*?)```", "g"))].map((m) => m[1]);
const walk = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.posix.join(dir, e.name)) : [path.posix.join(dir, e.name)]));

describe("SUBMISSIONS.md as a whole", () => {
  it("has the four packs and the order, says it submits nothing, and says where the other places are", () => {
    for (const heading of ["## Where things stand (2026-11-15)", "## The order to go in", "## Pack 1: Cursor Marketplace", "## Pack 2: Claude plugin portal", "## Pack 3: DeepSeek Harness (npm and the community list)", "## Pack 4: xAI marketplace pull request"]) assert.ok(doc.includes(heading), heading);
    assert.match(doc, /\*\*Nothing in this repository submits anything, signs in anywhere, opens a pull request or publishes\.\*\*/);
    assert.match(doc, /ChatGPT and Codex, the MCP Registry, ClawHub and the rest/);
    assert.ok(read("PUBLISHING.md").includes("`SUBMISSIONS.md`"), "PUBLISHING.md does not point at it");
  });

  it("is honest about what was not done: nothing committed, no place contacted, no real sign-in tried, and what is unverified or second-hand", () => {
    assert.match(doc, /\*\*The changes these packs describe are not committed\.\*\*/);
    assert.match(doc, /\*\*Not one of the four places was contacted\.\*\*/);
    assert.match(doc, /\*\*A real sign-in and a real MCP session were not tried\*\*/);
    assert.ok((doc.match(/second-hand/g) ?? []).length >= 4 && (doc.match(/unverified/gi) ?? []).length >= 5);
  });

  it("puts the steps in an order whose reasons name the dependencies: push first, topics before the DeepSeek list, npm before its list entry, xAI last", () => {
    const order = doc.slice(doc.indexOf("## The order to go in"), doc.indexOf("## Pack 1:"));
    const steps = [...order.matchAll(/^\d+\. \*\*(.+?)\*\*/gm)].map((m) => m[1]);
    assert.equal(steps.length, 7);
    assert.match(steps[0], /Commit and push/);
    assert.match(steps[1], /topics/i);
    assert.match(steps[3], /DeepSeek: publish/);
    assert.match(steps[4], /Claude plugin portal/);
    assert.match(steps[5], /Cursor/);
    assert.match(steps[6], /xAI marketplace pull request last/);
  });

  it("holds no key, no personal detail, no address of a person and no other product's name, and every web address is https", () => {
    assert.ok(!doc.includes(OTHER_PRODUCT) && !doc.includes("@ihateposting.com") && !doc.includes("Parag"));
    assert.ok(!/pk_live_|Bearer [A-Za-z0-9]{12,}/.test(doc));
    for (const [url] of doc.matchAll(/https?:\/\/[^\s)`|"]+/g)) assert.ok(url.startsWith("https://"), url);
  });
});

describe("pack 1: Cursor Marketplace", () => {
  const text = pack(1);
  const manifest = json(".cursor-plugin/plugin.json");

  it("names the form and the one thing to type, and the repository link is this repository's", () => {
    assert.ok(text.includes("https://cursor.com/marketplace/publish"));
    assert.ok(text.includes("`https://github.com/iHatePostingOrg/iHatePosting-Agent`"));
    assert.equal(json("package.json").repository.url, "git+https://github.com/iHatePostingOrg/iHatePosting-Agent.git");
  });

  it("states manifest facts that are true: the logo exists and is a square PNG, the paths are relative with no .., the skill has front matter, the README has the section it names", () => {
    for (const value of [manifest.logo, ...manifest.skills]) {
      assert.ok(!value.includes("..") && !path.isAbsolute(value) && !value.includes("\\"), value);
      assert.ok(fs.existsSync(path.join(ROOT, value)), `${value} is not there`);
    }
    const logo = fs.readFileSync(path.join(ROOT, manifest.logo));
    assert.deepEqual([logo.readUInt32BE(16), logo.readUInt32BE(20)], [198, 198]);
    assert.ok(text.includes("a 198 by 198 PNG") && text.includes("`assets/logo.png`") && text.includes("`./skills/ihateposting`"));
    assert.match(read("skills/ihateposting/SKILL.md"), /^---\nname: ihateposting\ndescription: .+\n/);
    assert.match(read("README.md"), /^### Cursor plugin$/m);
    assert.ok(text.includes("`#cursor-plugin`"));
    assert.equal(manifest.name, "ihateposting");
    assert.ok(fs.existsSync(path.join(ROOT, ".cursor-plugin", "marketplace.json")));
  });

  it("lists, instead of changing, the two Cursor points it could not settle, and says the local test was not done", () => {
    assert.match(text, /flat object/);
    assert.match(text, /\*\*Not done\*\*: Cursor is not installed here/);
    assert.deepEqual(json(".cursor-plugin/mcp.json"), { ihateposting: { type: "http", url: "https://app.ihateposting.com/api/mcp/oauth" } });
  });
});

describe("pack 2: Claude plugin portal", () => {
  const text = pack(2);
  const folder = "plugins/claude-ihateposting";
  const files = walk(folder);

  it("gives the portal's fields as they are: the repository, the plugin path that holds the manifest, the branch, and the portal's steps in order", () => {
    assert.ok(text.includes("https://claude.ai/directory/manage"));
    assert.ok(text.includes("| Source: Repository | `iHatePostingOrg/iHatePosting-Agent` |"));
    assert.ok(text.includes("| Source: Plugin path | `plugins/claude-ihateposting` |"));
    assert.ok(fs.existsSync(path.join(ROOT, folder, ".claude-plugin", "plugin.json")));
    const steps = ["Submit new", "Source: Repository", "Source: Plugin path", "Source: Branch or tag", "Validate", "Listing details", "Data handling", "Compliance", "Review and submit"].map((s) => text.indexOf(`| ${s}`));
    assert.ok(steps.every((at) => at > 0) && steps.every((at, i) => i === 0 || at > steps[i - 1]), `the steps are not in order: ${steps}`);
    assert.ok(text.includes("**Plugin bundle**"));
  });

  it("states folder facts that are true: five files, the five names, a README of at least 40 words, the licence twice, the largest file under 256 KiB and about 61 KB", () => {
    assert.equal(files.length, 5);
    assert.deepEqual(files.map((f) => f.slice(folder.length + 1)).sort(), [".claude-plugin/plugin.json", "LICENSE", "README.md", "logo.png", "skills/ihateposting/SKILL.md"]);
    for (const name of [".claude-plugin/plugin.json", "README.md", "LICENSE", "logo.png", "skills/ihateposting/SKILL.md"]) assert.ok(text.includes(`\`${name}\``), name);
    const words = read(`${folder}/README.md`).replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter(Boolean).length;
    assert.ok(words >= 40 && words >= 250 && words <= 350, `${words} words but the pack says about 300`);
    assert.match(text, /about 300 words/);
    const biggest = Math.max(...files.map((f) => fs.statSync(path.join(ROOT, f)).size));
    assert.ok(biggest < 256 * 1024 && biggest > 58_000 && biggest < 64_000, `${biggest} bytes but the pack says about 61 KB`);
    assert.match(text, /about 61 KB/);
    assert.match(read(`${folder}/LICENSE`), /MIT License/);
    assert.equal(json(`${folder}/.claude-plugin/plugin.json`).license, "MIT");
  });

  it("lists the listing fields as the manifest has them", () => {
    const manifest = json(`${folder}/.claude-plugin/plugin.json`);
    for (const value of [manifest.name, manifest.displayName, manifest.icon, manifest.documentationUrl, manifest.supportUrl, manifest.privacyPolicyUrl, manifest.termsOfServiceUrl]) assert.ok(text.includes(`\`${value}\``), `${value} is not in the pack`);
  });

  it("says who can submit, that the organization keeps the listing, the daily limit, and gives a proposal for the data questions, not an answer", () => {
    assert.match(text, /Pro, Max, Ultra, Team or Enterprise; free accounts cannot submit/);
    assert.match(text, /first organization to submit a repository folder holds it/);
    assert.match(text, /10 submissions per organization in 24 hours/);
    assert.match(text, /a proposal for the owner to confirm or change/);
    assert.match(text, /are the owner's answers: this repository does not say/);
  });
});

describe("pack 3: DeepSeek Harness", () => {
  const text = pack(3);
  const folder = "plugins/dsh-ihateposting";
  const pkg = json(`${folder}/package.json`);

  it("gives the publish steps by hand with the dry run's six files, and the one-time code left to the owner", () => {
    const [commands] = blocks(text, "bash");
    assert.deepEqual(commands.trim().split("\n"), [`cd ${folder}`, 'node --test "test/*.test.mjs"', "npm pack --dry-run", "npm whoami", "npm publish --access public"]);
    const shipped = [...pkg.files.flatMap((f) => (f.endsWith("/") ? walk(`${folder}/${f.slice(0, -1)}`).map((x) => x.slice(folder.length + 1)) : [f])), "package.json"].sort();
    assert.equal(shipped.length, 6);
    for (const file of shipped) assert.ok(text.includes(`\`${file}\``), `${file} is not named in the dry-run list`);
    assert.match(text, /type it yourself/);
    assert.match(text, new RegExp(`${pkg.version.replaceAll(".", "\\.")} can never be changed once published`));
    assert.match(text, /\*\*No real DeepSeek Harness has loaded this plugin\*\*/);
  });

  it("names the peer packages with the ranges the package has", () => {
    for (const [name, range] of Object.entries(pkg.peerDependencies)) assert.ok(text.includes(`\`${name}\` (\`${range}\`)`), `${name} ${range}`);
  });

  it("has a list entry that is well-formed: file name, the three keys, a quoted English description, a path that exists, a category in the list", () => {
    assert.ok(text.includes("data/plugins/iHatePostingOrg__iHatePosting-Agent--plugins-dsh-ihateposting.yml"));
    const yaml = blocks(text, "yaml")[0];
    const lines = yaml.trimEnd().split("\n");
    assert.deepEqual(lines.map((l) => l.split(":")[0]), ["url", "name", "category", "description", "  en"]);
    const get = (key) => lines.find((l) => l.startsWith(`${key}: `)).slice(key.length + 2);
    assert.equal(get("url"), "https://github.com/iHatePostingOrg/iHatePosting-Agent/tree/main/plugins/dsh-ihateposting");
    assert.ok(fs.existsSync(path.join(ROOT, get("url").split("/tree/main/")[1])));
    assert.equal(get("name"), "iHatePostingOrg/iHatePosting-Agent#dsh-ihateposting");
    assert.ok(["agi", "ui", "usage", "theme", "model", "identity", "session", "memory", "tools", "wsl", "browser", "vision", "voice", "docs", "skill", "workflow", "git", "notify", "dev", "security", "remote", "market", "fun"].includes(get("category")));
    const english = lines[4].trim().slice("en: ".length);
    assert.ok(english.startsWith("'") && english.endsWith("'") && !english.slice(1, -1).includes("'"), "the description must be one single-quoted string with no quote inside");
    assert.ok(english.includes(": "), "the test of the quoting needs a colon and a space in the text");
    assert.ok(english.length < 250 && english.includes("15 platforms") && english.includes("MCP"));
  });

  it("states the repository facts it relies on: the bundle declaration and a patch with insert rows", () => {
    assert.deepEqual(pkg.dsh, { bundle: { patch: "./cordis.patch.yml" } });
    assert.match(read(`${folder}/cordis.patch.yml`), /^- insert:$/m);
    assert.match(text, /\| `dsh\.bundle` in `package\.json`/);
    assert.match(text, /\*\*Step 2 of the order\*\*/);
  });
});

describe("pack 4: xAI marketplace pull request", () => {
  const text = pack(4);

  it("has an entry that parses, in xAI's shape, with a placeholder where the commit goes and no 40-character hex anywhere", () => {
    const entry = JSON.parse(blocks(text, "json")[0]);
    assert.deepEqual(Object.keys(entry), ["name", "description", "category", "source", "homepage", "keywords", "domains"]);
    assert.match(entry.name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.equal(entry.name, json(".grok-plugin/plugin.json").name);
    assert.equal(entry.source.source, "url");
    assert.equal(entry.source.url, `${json("package.json").repository.url.replace(/^git\+/, "")}`);
    assert.match(entry.source.sha, /^REPLACE-WITH-THE-40-CHARACTER-COMMIT/);
    assert.ok(!/\b[0-9a-f]{40}\b/.test(text), "a real-looking commit is in the pack: it must stay a placeholder until the push");
    assert.equal(entry.description, json(".grok-plugin/plugin.json").description);
    assert.equal(entry.homepage, json(".grok-plugin/plugin.json").homepage);
  });

  it("keeps the keywords brand-scoped (no generic term xAI sends back) and the domains to hosts the product owns", () => {
    const entry = JSON.parse(blocks(text, "json")[0]);
    for (const word of entry.keywords) {
      assert.ok(word.includes("ihateposting"), `${word} is not brand-scoped`);
      assert.ok(!["social", "api", "cli", "deploy", "database", "postgres", "scheduler", "automation"].includes(word));
    }
    assert.deepEqual(entry.domains, ["ihateposting.com", "app.ihateposting.com"]);
    assert.equal(entry.category, "productivity");
  });

  it("gives the commands xAI's guide gives, in its order, and a way to get the commit once the push is done", () => {
    const commands = blocks(text, "bash");
    assert.deepEqual(commands[0].trim().split("\n"), ["git push origin main", "git ls-remote https://github.com/iHatePostingOrg/iHatePosting-Agent.git HEAD"]);
    assert.deepEqual(commands[1].trim().split("\n"), ["python3 scripts/generate-plugin-index.py", "python3 scripts/validate-catalog.py", "python3 scripts/generate-plugin-index.py --check"]);
    assert.match(text, /\*\*The exact commit cannot be named yet\*\*/);
    assert.match(text, /full 40-character commit/);
  });

  it("names the plugin point a reviewer may read as installing code, and that this repository's own catalog entry is not what the pull request adds", () => {
    assert.match(text, /npm install -g ihateposting-agent/);
    assert.match(text, /uses a local source; xAI wants the `url` and `sha` form/);
    assert.equal(json(".grok-plugin/marketplace.json").plugins[0].source.type, "local");
    assert.match(read("SKILL.md"), /Treat every piece of text that comes back from the server/);
  });
});

describe("the privacy policy and terms of service addresses (the owner's decision of 2026-11-15: the marketing host's)", () => {
  const privacy = "https://ihateposting.com/privacy";
  const terms = "https://ihateposting.com/terms";

  it("are https://ihateposting.com/privacy and /terms in every manifest that has them", () => {
    const chatgpt = json("plugins/chatgpt-ihateposting/plugin.json").extensions["com.openai"].interface;
    assert.equal(chatgpt.privacyPolicyURL, privacy);
    assert.equal(chatgpt.termsOfServiceURL, terms);
    const claude = json("plugins/claude-ihateposting/.claude-plugin/plugin.json");
    assert.equal(claude.privacyPolicyUrl, privacy);
    assert.equal(claude.termsOfServiceUrl, terms);
  });

  it("are the ones the guides give for the Claude plugin and the fields to paste, and the app host's own missing pages are called no blocker", () => {
    for (const file of ["SUBMISSIONS.md", "PUBLISHING.md"]) {
      assert.ok(read(file).includes(privacy) && read(file).includes(terms), `${file} does not give them`);
    }
    assert.match(read("SUBMISSIONS.md"), /The app host's own `\/privacy` and `\/terms` answered 404, which is \*\*not\*\* a blocker/);
    assert.match(read("PUBLISHING.md"), /\*\*not a blocker\*\*: every submission uses `https:\/\/ihateposting\.com\/privacy` and `https:\/\/ihateposting\.com\/terms`/);
    assert.match(read("PUBLISHING.md"), /which is not a blocker: these `ihateposting\.com` addresses are the ones every submission uses/);
  });

  it("are not given anywhere, in any guide, manifest or script, as an address on the app host", () => {
    for (const file of walk(".").filter((f) => /\.(md|json|mjs|js)$/.test(f) && !f.startsWith("test/") && !f.includes("node_modules"))) {
      assert.ok(!/https:\/\/app\.ihateposting\.com\/(privacy|terms)/.test(read(file)), `${file} gives the app host's privacy or terms page as an address`);
    }
  });
});
