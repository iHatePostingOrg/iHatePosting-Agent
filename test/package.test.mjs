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

// The author the owner gave for the public repository (2026-11-14), and the fifteen platforms iHatePosting connects (LinkedIn pages are a second kind of LinkedIn channel).
const AUTHOR_NAME = "Parag Hasmukhbhai Gajera";
const AUTHOR_EMAIL = "support@ihateposting.com";
const AUTHOR_URL = "https://github.com/iHatePostingOrg";
const PLATFORM_NAMES = ["X", "LinkedIn", "Instagram", "Facebook", "Threads", "YouTube", "TikTok", "Pinterest", "Bluesky", "Mastodon", "Google Business", "Discord", "Slack", "Telegram", "Tumblr"];
const PLATFORM_KEYWORDS = ["x", "twitter", "linkedin", "facebook", "instagram", "threads", "youtube", "tiktok", "pinterest", "bluesky", "mastodon", "telegram", "discord", "slack", "tumblr", "google-business"];

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

  it("is called ihateposting-agent everywhere a person installs or runs it, never by the name of the live app's own command line, and no guide promises a local ihateposting-mcp package", () => {
    // Owner, 2026-11-14: "Both ihateposting-agent". The live app's own packages on npm, `ihateposting` and `ihateposting-mcp`, are not replaced and not offered here.
    const guides = fs.readdirSync(ROOT).filter((f) => f.endsWith(".md")).concat(fs.readdirSync(path.join(ROOT, "examples")).map((f) => `examples/${f}`), ["skills/ihateposting/SKILL.md", "plugins/dsh-ihateposting/skill/SKILL.md"]);
    for (const file of guides) {
      const text = read(file);
      assert.doesNotMatch(text, /(?:npm|pnpm|yarn) (?:install|add|i)(?: -g| --global)? ihateposting(?![-\w])/, `${file} installs the live app's own package`);
      assert.doesNotMatch(text, /npx ihateposting(?![-\w])/, `${file} runs the live app's own package`);
      assert.doesNotMatch(text, /bin\/ihateposting\.mjs/, `${file} names a file that is not there`);
      if (file !== "PUBLISHING.md") assert.doesNotMatch(text, /ihateposting-mcp/, `${file} names a package of the live app that this repository does not have`);
    }
    assert.match(read("README.md"), /npm install -g ihateposting-agent\n/);
    assert.match(read("QUICK_START.md"), /npm install -g ihateposting-agent\n/);
    const publishing = read("PUBLISHING.md");
    assert.match(publishing, /^# Publishing ihateposting-agent to npm$/m);
    assert.match(publishing, /^\| `name` \| What people type after `npm install` \| `ihateposting-agent` \|$/m);
    assert.match(publishing, /^\| `bin` \| What people type to run the program \| `ihateposting-agent` \(pointing at `bin\/ihateposting-agent\.mjs`\) \|$/m);
    assert.match(publishing, /npm view ihateposting-agent/);
    assert.match(publishing, /this package does not replace it/);
    assert.match(publishing, /This repository has no such package and does not publish one/);
  });

  it("holds exactly what `npm pack` would ship: the commands, the skill, the docs, the licence; no test, key or plugin folder", () => {
    const listed = JSON.parse(execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: ROOT, encoding: "utf8", shell: process.platform === "win32" }));
    const files = listed[0].files.map((f) => f.path.replaceAll("\\", "/")).sort();
    for (const needed of ["bin/ihateposting-agent.mjs", "src/index.mjs", "src/api.mjs", "src/config.mjs", "src/constants.mjs", "src/commands/auth.mjs", "src/commands/posts.mjs", "src/commands/integrations.mjs", "src/commands/analytics.mjs", "src/commands/upload.mjs", "SKILL.md", "skills/ihateposting/SKILL.md", "README.md", "CHANGELOG.md", "LICENSE", "package.json"]) assert.ok(files.includes(needed), `${needed} is not in the package`);
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
  it("is called like the folder it sits in, as the Agent Skills specification asks, and every manifest points at that folder", () => {
    const name = read("SKILL.md").match(/^---\nname: (.+)\n/)[1];
    assert.equal(name, "ihateposting");
    assert.ok(fs.existsSync(path.join(ROOT, "skills", name, "SKILL.md")), "the skill's folder is not named like the skill");
    assert.equal(fs.readdirSync(path.join(ROOT, "skills")).join(","), name, "the skills folder holds something else too");
    assert.match(read("skills/ihateposting/SKILL.md"), new RegExp(`^---\\nname: ${name}\\n`));
    assert.match(read("plugins/dsh-ihateposting/skill/SKILL.md"), new RegExp(`^---\\nname: ${name}\\n`));
    const listed = [json(".claude-plugin/plugin.json").skills, json(".claude-plugin/marketplace.json").plugins[0].skills, json(".cursor-plugin/plugin.json").skills, json(".cursor-plugin/marketplace.json").plugins[0].skills, json(".grok-plugin/plugin.json").skills];
    for (const skills of listed) assert.deepEqual(skills, [`./skills/${name}`]);
    assert.match(read("SUMMARY.md"), new RegExp(`skills/${name}/SKILL\\.md`));
    assert.doesNotMatch(read("SUMMARY.md"), /skills\/ihateposting-agent/);
    assert.match(read("README.md"), /npx skills add iHatePostingOrg\/iHatePosting-Agent\n/);
    // The workflow that keeps the copies identical writes to the same folder.
    assert.match(read(".github/workflows/sync-skill.yml"), new RegExp(`cp SKILL\\.md skills/${name}/SKILL\\.md`));
  });

  it("is one text in two places, with the frontmatter an installer reads", () => {
    assert.equal(read("SKILL.md"), read("skills/ihateposting/SKILL.md"));
    assert.equal(read("SKILL.md"), read("plugins/dsh-ihateposting/skill/SKILL.md"), "the DeepSeek Harness plugin carries another copy of the skill");
    const text = read("SKILL.md");
    assert.match(text, /^---\nname: ihateposting\ndescription: .{60,}\n/);
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
    // The section that says it moved from the README to HOW_TO_RUN.md (the README follows the reference page's headings).
    assert.match(read("HOW_TO_RUN.md"), /plain `http:\/\/` address is accepted for any host/);
    assert.match(read("HOW_TO_RUN.md"), /Redirects are followed, and the key follows them/);
    assert.match(read("HOW_TO_RUN.md"), /A request waits for ever/);
    assert.match(read("CHANGELOG.md"), /keeps the `Authorization` header/);
    assert.match(read("CHANGELOG.md"), /plain `http:\/\/`/);
  });

  it("says it was not made from the live agent-skill repository, and nothing else in the repository leans on it", () => {
    assert.match(read("CHANGELOG.md"), /\*\*not based on\*\* the `iHatePostingOrg\/agent-skill` repository/);
    for (const file of ["README.md", "SKILL.md", "PUBLISHING.md", "package.json", "src/index.mjs", "src/api.mjs", "src/config.mjs", "src/constants.mjs", "src/commands/auth.mjs", "src/commands/posts.mjs", "src/commands/integrations.mjs", "src/commands/analytics.mjs", "src/commands/upload.mjs"]) {
      assert.doesNotMatch(read(file), /iHatePostingOrg\/agent-skill\b|github\.com\/iHatePostingOrg\/agent-skill|iHatePostingOrg\/iHatePosting-Skill|@ihateposting\//i, `${file} names the live agent-skill repository or its npm packages`);
    }
    // The commands are the ones the program has; the live packages' commands are not here.
    const text = read("SKILL.md");
    for (const foreign of ["whoami", "upload:url", "notifications:", "groups:list", "login <key>"]) assert.ok(!text.includes(`ihateposting-agent ${foreign}`) && !text.includes(`ihateposting ${foreign}`), `the skill names "${foreign}"`);
  });

  it("ships the two release workflows, written to run only on a published release, that check the tag, and never hold a secret", () => {
    for (const [file, mustHave] of [[".github/workflows/publish-npm.yml", ["release:", "types: [published]", "RELEASE_TAG", "secrets.NPM_TOKEN", "npm test"]], [".github/workflows/sync-skill.yml", ["release:", "skills/ihateposting/SKILL.md", "plugins/dsh-ihateposting/skill/SKILL.md", "workflow_dispatch"]]]) {
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
    // The plugin is "ihateposting" everywhere it is named (kebab-case, as Claude Code's documentation asks); each marketplace is "ihateposting-agent", which is why the install is
    // `ihateposting@ihateposting-agent`; the npm package and the command are "ihateposting-agent".
    for (const file of [".claude-plugin/plugin.json", ".cursor-plugin/plugin.json", ".grok-plugin/plugin.json", "gemini-extension.json"]) assert.equal(json(file).name, "ihateposting", file);
    for (const file of [".claude-plugin/marketplace.json", ".cursor-plugin/marketplace.json", ".grok-plugin/marketplace.json"]) {
      assert.equal(json(file).name, "ihateposting-agent", `${file}: the marketplace's own name`);
      assert.equal(json(file).plugins[0].name, "ihateposting", `${file}: the plugin entry's name`);
    }
    // Claude Code installs by the entry's name, so the entry and the plugin's own manifest must agree.
    assert.equal(json(".claude-plugin/marketplace.json").plugins[0].name, json(".claude-plugin/plugin.json").name);
    assert.equal(json(".cursor-plugin/marketplace.json").plugins[0].name, json(".cursor-plugin/plugin.json").name);
    assert.match(read("README.md"), /\/plugin install ihateposting@ihateposting-agent\n/);
    assert.doesNotMatch(read("README.md"), /\/plugin install ihateposting-agent@/);
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

  it("hold no key, token or email address of a person, except the author's one address in the places that name an author", () => {
    for (const file of [".claude-plugin/plugin.json", ".claude-plugin/marketplace.json", ".cursor-plugin/plugin.json", ".cursor-plugin/marketplace.json", ".grok-plugin/plugin.json", ".grok-plugin/marketplace.json", "gemini-extension.json", "package.json", "plugins/dsh-ihateposting/package.json", "mcp.json", ".cursor-plugin/mcp.json", ".grok-plugin/mcp.json"]) {
      const text = read(file).replaceAll(AUTHOR_EMAIL, "");
      assert.ok(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[a-z]{2,}/i.test(text), `${file} holds an email address that is not the author's`);
    }
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

describe("who made it, and what it covers", () => {
  it("names the author in each place that has one, in the shape of that place, with the organisation page as the link", () => {
    assert.deepEqual(json(".claude-plugin/plugin.json").author, { name: AUTHOR_NAME, email: AUTHOR_EMAIL, url: AUTHOR_URL });
    assert.deepEqual(json(".claude-plugin/marketplace.json").owner, { name: AUTHOR_NAME, email: AUTHOR_EMAIL });
    assert.deepEqual(json(".cursor-plugin/plugin.json").author, { name: AUTHOR_NAME, email: AUTHOR_EMAIL });
    assert.deepEqual(json(".cursor-plugin/marketplace.json").owner, { name: AUTHOR_NAME, email: AUTHOR_EMAIL });
    assert.deepEqual(json(".cursor-plugin/marketplace.json").plugins[0].author, { name: AUTHOR_NAME, email: AUTHOR_EMAIL });
    assert.deepEqual(json(".grok-plugin/plugin.json").author, { name: AUTHOR_NAME, email: AUTHOR_EMAIL, url: AUTHOR_URL });
    assert.deepEqual(json(".grok-plugin/marketplace.json").owner, { name: AUTHOR_NAME, email: AUTHOR_EMAIL });
    assert.deepEqual(json("plugins/dsh-ihateposting/package.json").author, { name: AUTHOR_NAME, email: AUTHOR_EMAIL, url: AUTHOR_URL });
    // npm's own string form: "Name <email> (url)".
    assert.equal(pkg.author, `${AUTHOR_NAME} <${AUTHOR_EMAIL}> (${AUTHOR_URL})`);
    assert.equal(json("gemini-extension.json").author, undefined, "the Gemini extension has no author field");
  });

  it("points the Cursor and Grok manifests' homepage at the website, which has a page for them, and the others at the repository", () => {
    assert.equal(json(".cursor-plugin/plugin.json").homepage, "https://ihateposting.com");
    assert.equal(json(".cursor-plugin/marketplace.json").plugins[0].homepage, "https://ihateposting.com");
    assert.equal(json(".grok-plugin/plugin.json").homepage, "https://ihateposting.com");
    assert.equal(json(".grok-plugin/marketplace.json").plugins[0].homepage, "https://ihateposting.com");
    assert.match(read("SKILL.md"), /^homepage: https:\/\/ihateposting\.com\/ai-agents$/m);
    assert.equal(json("package.json").homepage, "https://github.com/iHatePostingOrg/iHatePosting-Agent#readme");
  });

  it("keeps the licence lines as they were: the organisation's name, not a person's", () => {
    for (const file of ["LICENSE", "plugins/dsh-ihateposting/LICENSE"]) {
      assert.match(read(file), /^Copyright \(c\) 2026 iHatePostingOrg$/m, file);
      assert.ok(!read(file).includes(AUTHOR_NAME), `${file} names the person`);
    }
  });

  it("puts the author's name and address in no document, example, script or workflow", () => {
    const walk = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) => (e.name === "node_modules" || e.name === ".git" ? [] : e.isDirectory() ? walk(path.posix.join(dir, e.name)) : [path.posix.join(dir, e.name)]));
    const manifests = new Set([".claude-plugin/plugin.json", ".claude-plugin/marketplace.json", ".cursor-plugin/plugin.json", ".cursor-plugin/marketplace.json", ".grok-plugin/plugin.json", ".grok-plugin/marketplace.json", "package.json", "plugins/dsh-ihateposting/package.json"]);
    for (const file of walk(".")) {
      if (!/\.(md|sh|json|yml|mjs|cjs)$/.test(file) || manifests.has(file) || file === "package-lock.json" || file.startsWith("test/") || file.includes("/test/")) continue;
      const text = read(file);
      assert.ok(!text.includes(AUTHOR_NAME) && !text.includes(AUTHOR_EMAIL), `${file} holds the author's personal details`);
    }
  });

  it("lists the same fifteen platforms by name in the longest descriptions, and says fifteen wherever a manifest counts", () => {
    for (const description of [json(".claude-plugin/plugin.json").description, json(".claude-plugin/marketplace.json").plugins[0].description, json(".cursor-plugin/plugin.json").description, json(".cursor-plugin/marketplace.json").plugins[0].description]) {
      for (const name of PLATFORM_NAMES) assert.ok(description.includes(name), `a description lacks ${name}: ${description.slice(0, 80)}`);
      assert.match(description, /across 15 platforms including /);
    }
    const counted = {
      ".claude-plugin/plugin.json": json(".claude-plugin/plugin.json").description,
      ".claude-plugin/marketplace.json": JSON.stringify(json(".claude-plugin/marketplace.json")),
      ".cursor-plugin/plugin.json": json(".cursor-plugin/plugin.json").description,
      ".cursor-plugin/marketplace.json": JSON.stringify(json(".cursor-plugin/marketplace.json")),
      ".grok-plugin/plugin.json": json(".grok-plugin/plugin.json").description,
      ".grok-plugin/marketplace.json": JSON.stringify(json(".grok-plugin/marketplace.json")),
      "gemini-extension.json": json("gemini-extension.json").description,
      "plugins/dsh-ihateposting/package.json": pkg.description === undefined ? "" : json("plugins/dsh-ihateposting/package.json").description,
      "SKILL.md": read("SKILL.md").split("\n").slice(0, 6).join("\n"),
    };
    for (const [file, text] of Object.entries(counted)) {
      const numbers = [...text.matchAll(/\b(\d+)\+?\s+(?:platforms|channels)\b/g)].map((m) => m[1]);
      assert.ok(numbers.length > 0, `${file} does not say how many platforms`);
      assert.deepEqual([...new Set(numbers)], ["15"], `${file} counts ${numbers.join(", ")}`);
    }
    // The README says the same; the sixteen identifiers are explained in the section that moved to HOW_TO_RUN.md.
    const head = read("README.md").split("\n").slice(0, 100).join("\n");
    assert.match(head, /Schedule posts across 15 platforms programmatically/);
    assert.match(read("README.md"), /15 platforms including:/);
    assert.match(read("HOW_TO_RUN.md"), /Fifteen platforms, sixteen identifiers: LinkedIn Page is a second kind of LinkedIn channel/);
  });

  it("lists every platform's name as a keyword in each manifest that has keywords, and no platform iHatePosting does not have", () => {
    const lists = {
      ".claude-plugin/plugin.json": json(".claude-plugin/plugin.json").keywords,
      ".cursor-plugin/plugin.json": json(".cursor-plugin/plugin.json").keywords,
      ".cursor-plugin/marketplace.json": json(".cursor-plugin/marketplace.json").plugins[0].keywords,
      ".grok-plugin/plugin.json": json(".grok-plugin/plugin.json").keywords,
      "package.json": pkg.keywords,
      "plugins/dsh-ihateposting/package.json": json("plugins/dsh-ihateposting/package.json").keywords,
    };
    for (const [file, keywords] of Object.entries(lists)) {
      for (const word of PLATFORM_KEYWORDS) assert.ok(keywords.includes(word), `${file} lacks the keyword ${word}`);
      assert.ok(!keywords.includes("reddit"), `${file} lists a platform iHatePosting does not have`);
      assert.equal(new Set(keywords).size, keywords.length, `${file} repeats a keyword`);
    }
  });
});
