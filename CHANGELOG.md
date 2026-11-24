# Changelog

All notable changes to the iHatePosting CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `posts:attachments <id> -m "<url>,<url>"` - Replace the attachments of an unpublished (draft or scheduled) post. The list replaces all the existing attachments of the main post, `-m ""` removes them all, and `--alt` sets alt texts in the same order. The content, settings and publish date stay as they are. It takes `-m` once: a bare `-m`, an empty entry in the list and a repeated `-m` or `--alt` are refused before the request, so a typo or an unset shell variable cannot clear a post's attachments or shift alt texts. It calls `PUT /public/v1/posts/:id/attachments` of the app (the app has had that route since 2026-11-24; until the app is deployed with it the command answers 404).

### Changed

- The DeepSeek plugin's tool table and skill text list the tools the server gained: `integrationConnectTool` (a link to connect a new channel), `integrationAnalyticsTool`, `postAnalyticsTool` and `postAttachmentsTool`; the skill no longer says the server cannot connect a channel. The ChatGPT plugin pack's get-started skill and its listing text say the same (not yet submitted; to be submitted only after the app is deployed with the tool).

- The Claude Code plugin's copy of the skill (`plugins/claude-ihateposting/skills/ihateposting/SKILL.md`) no longer names the key variable, and its batch-scheduling example no longer loops over shell arrays (the owner's "fix it" of 2026-11-21). The Claude directory's check held the plugin for a reviewer ("Uses a credential from the user's machine"); leaving the variable out did not clear that, and the rewritten example script did (found by validating test variants of the plugin). The program's own "Not authenticated" message and its `--help` still say how to give it a key, and the other two copies of the skill keep the variable and the array example. Not in the npm package.

## [1.0.0] - 2026-11-19

The program moves into the older npm package `ihateposting` (the owner's decisions of 2026-11-19: replace it, "all should be ihateposting", version 1.0.0). The package `ihateposting-agent` (`0.0.0-stage`, 0.1.0 and 0.1.1) is left as it is on npm: not deprecated, not unpublished, and it gets no new version.

### Changed
- **The package, the command and the marketplaces are called `ihateposting`** (they were `ihateposting-agent`). `bin/ihateposting-agent.mjs` is now `bin/ihateposting.mjs`; the program names itself `ihateposting` in its help, its messages and the sign-in line (`ihateposting auth:login`); the three marketplaces are called `ihateposting`, so Claude Code installs the plugin with `/plugin install ihateposting@ihateposting`. The plugin, the skill and the Gemini extension keep their names. The GitHub repository stays `iHatePostingOrg/iHatePosting-Agent`, and the slugs of the Claude connector and of the ClawHub bundle (`ihateposting-agent`) are names of listings, not of the package: they are not changed here.
- **`ihateposting` already existed on npm.** Its versions 0.1.0 to 0.6.0 are the live app's own command line (`login`, `whoami`, `accounts`, `post` and so on, for ihateposting.com). 1.0.0 is the next version of the same package, so it is what `npm install -g ihateposting` and `npm update -g ihateposting` give from now on; the old versions stay on npm and install by their number (`npm install -g ihateposting@0.6.0`). The two programs are not compatible:
  - The commands are the reference's (`auth:login`, `posts:create`, `integrations:list` and so on), not `login`, `post`, `accounts` and so on. A word that is not a command is accepted and does nothing, with exit code 0, as in the reference, so an old script that runs `ihateposting post ...` ends without an error and without a post.
  - The server is `https://app.ihateposting.com/api`, not ihateposting.com: a key of the live app is not an account there (not tried with a real key).
  - The sign-in is saved in `~/.ihateposting/credentials.json`; the old program kept `config.json` in the same folder, and neither reads the other's file. A saved sign-in wins over `IHATEPOSTING_API_KEY` (the old program let the variable win); both programs read `IHATEPOSTING_API_URL`.
  - It needs Node.js 20 or newer (the old one ran on 18) and installs two dependencies, `yargs` and `node-fetch` (the old one had none). The old `ihateposting/commands` and `ihateposting/skill` imports are gone.
- **The hosted connector's sign-in address in the manifests is `https://app.ihateposting.com/mcp/oauth`** (it was `https://app.ihateposting.com/api/mcp/oauth`, with `/api`): `mcp.json`, `.cursor-plugin/mcp.json`, `.grok-plugin/mcp.json`, `gemini-extension.json`, the ChatGPT plugin's `mcp.json` and `server.json`, and the README and the guides that name it (the owner's decision of 2026-11-19: every keyless connector address is the app host's `/mcp/oauth`; the two listings already submitted, the Claude connector and the ChatGPT plugin, keep `https://ihateposting.com/mcp/oauth` in their own portals, not in these files). The key-based address is `https://app.ihateposting.com/mcp` too (it was `https://app.ihateposting.com/api/mcp`: the owner chose "Without /api" on 2026-11-19, and the `/api` key addresses stop at nginx once that routing is deployed): `server.json`'s second remote, the README and guides and the DeepSeek plugin, whose default `baseUrl` is now `https://app.ihateposting.com`. The program's API base `https://app.ihateposting.com/api` is unchanged. **The app host answers 404 at `/mcp/oauth` (checked 2026-11-19, 17:23) until the new backend is routed there (Shakti's step; the key address `/mcp` is routed in the same change), so these files must not be pushed, and this version must not be published (its README names the address), before that.** `server.json` no longer matches what the registry published as 0.13.0 (a registry version cannot be changed): a new registry version was needed, so `server.json` is version 0.13.1 now (the owner's choice of 2026-11-19); publishing it is his own step, after the routing.
- The skill's example key variable shows the fake value `YOUR_API_KEY` in every copy, so that the Claude directory's credential check reads the lines as examples (`SKILL.md` and `skills/` are in the npm package).
- The DeepSeek plugin's version number follows the repository's (1.0.0); its code differs from the published 0.1.1 in one value, the default `baseUrl` (`https://app.ihateposting.com`, it was `https://app.ihateposting.com/api`: the key-based MCP address loses `/api`), so a new version is needed to ship it, and a profile that sets `baseUrl` with `/api` itself must take the `/api` out. It is a separate npm package, `dsh-ihateposting`, and is not published by this release.
- The Claude Code plugin's copy of the skill (`plugins/claude-ihateposting/skills/ihateposting/SKILL.md`) differs from the other two copies in two places, so that the Claude directory's check can read it (the owner's decision of 2026-11-16): the front matter's one-line JSON `metadata` is written as plain indented lines, and the line that links the npm page is left out. Not in the npm package (its `skills/` folder keeps the one-line JSON).
- The draft entry for the official MCP Registry, `server.json`, is a new version `0.13.0` of the existing entry `com.ihateposting/mcp` (the owner's decision of 2026-11-16: one entry, the name kept; the first draft used a new name, `com.ihateposting/agent`). Published by the owner on 2026-11-16: the registry lists 0.13.0 as the latest. Not in the npm package.
- The Cursor plugin's manifest, `.cursor-plugin/plugin.json`, no longer has an `mcpServers` field, as the reference project's has none (the owner's decision of 2026-11-16): Cursor finds the root `mcp.json` by itself. Both `mcp.json` files stay flat. Not in the npm package.
- The Grok Build plugin's MCP file, `.grok-plugin/mcp.json`, is wrapped in `mcpServers`, the form of the standard `.mcp.json` (the owner's decision of 2026-11-16). xAI's marketplace tool that lists what a plugin contains reads only that form, so the flat file showed the plugin without its MCP server. Not in the npm package.

## [0.1.1] - 2026-11-16

Changes made after 0.1.0 was published to npm on 2026-11-15. What changed in the npm package is printed text (three help texts and one message), the skill, the README and this file; the commands behave as in 0.1.0. The plugin folders, the scripts and the submission files below are in the GitHub repository only: the `files` list holds none of them.

### Added
- The Claude Code plugin has a folder of its own, `plugins/claude-ihateposting/` (the owner's decision of 2026-11-15). claude.ai and Cowork refuse a plugin whose root holds a `bin/` folder, and the repository root holds the program's. The marketplace at `.claude-plugin/marketplace.json` now points its entry at `./plugins/claude-ihateposting`, the root `.claude-plugin/plugin.json` is gone, and the plugin has a README, the licence, a logo and its own copy of the skill. The Cursor, Grok and Gemini layouts were not touched by this change.
- The DeepSeek Harness plugin (`dsh-ihateposting`, not yet on npm) follows the design of the other project's DeepSeek plugin, written fresh: four settings (`apiKeyEnv`, `apiKey`, `baseUrl`, `skill`), a service `ihateposting` that the MCP row reads its address and headers from, a short skill for the MCP tools embedded in the package, and a warning instead of a refusal to load when there is no key. Peer dependencies on `@deepseek-ai/cordis` and `@deepseek-ai/schemastery`.
- For the submissions: `plugins/chatgpt-ihateposting/` and `npm run chatgpt-plugin:zip` (ChatGPT and Codex), a draft `server.json` for the MCP Registry (name `com.ihateposting/agent`, first version `0.1.0`), `SUBMISSIONS.md` and a section of `PUBLISHING.md`.

### Changed
- Names of the listings (the owner's decisions of 2026-11-15): display name `iHatePosting`; the plugin, the skill and the Gemini extension are called `ihateposting`; the Claude marketplace, the npm package and the command are called `ihateposting-agent`; Claude Code installs the plugin with `/plugin install ihateposting@ihateposting-agent`. The descriptions keep the old wording; no sentence tells the new listing from the live app's (the owner's decision of 2026-11-15).
- Releases are published by hand with two-factor authentication (the owner's decision of 2026-11-15). The two GitHub workflows run only when started by hand.
- The skill (`SKILL.md`, the same text under `skills/ihateposting/` and in the Claude Code plugin) was rewritten and enlarged: every command and option in it was read against the program's own help and the tests, and it says what an agent needs to know about iHatePosting (15 platforms, `-s` required for a post that is not sent from a `--json` file, a header line before the JSON that most commands print, the three `auth:` commands that need no sign-in). The README's line about the DeepSeek plugin says that without a key the plugin loads, warns once and shows no tools.
- Help texts that were false for iHatePosting are true now (printed text only, no behaviour change): the `integrations:trigger` example shows `linkedin-123 mention -d '{"query":"acme"}'` instead of a YouTube call that has no helper here; the `upload --adjust` help says the option is accepted for compatibility but nothing is adjusted and `media:status` answers ready at once; and the `media:status` description says the same.
- The message printed when nobody is signed in now says `1. OAuth2: ihateposting-agent auth:login` (the same line `auth:status` prints) instead of `auth:login --client-id <id> --client-secret <secret>`: `auth:login` has no such options. A deliberate difference from the other posting command lines (the owner's decision of 2026-11-16); the text on standard error changes, the exit code `1` and everything else do not.

## [0.1.0] - 2026-11-15

The first version: the command line, the agent skill and the plugin folders for iHatePosting's public API.

**Where it comes from.** It was written from scratch for iHatePosting, in this repository's own code. It is **not based on** the `iHatePostingOrg/agent-skill` repository or on any of the npm packages published from it, and nothing in it was copied from them. Its command names, options, header lines and exit codes follow the habits common to posting command lines, so scripts moved over from one of those keep working; no other program's code is in this repository.

### Added
- `auth:login` - Sign in with a one-time code and save the token
- `auth:status` - Show who is signed in and whether the credentials still work
- `auth:logout` - Forget the saved sign-in
- `integrations:list` - List the connected channels, optionally one customer's
- `integrations:groups` - List the customers (groups)
- `integrations:settings` - Read a channel's rules, length limit, settings schema and helpers
- `integrations:trigger` - Run a channel's helper (a board list, a room list, a company-page lookup)
- `posts:create` - Schedule or draft a post, with comments, media, alt texts and settings, or send a body file
- `posts:list` - List posts in a date window, optionally for one customer
- `posts:delete` - Delete a post
- `posts:status` - Move a post between draft and scheduled
- `posts:settings` - Change a waiting post's platform settings
- `posts:missing` - List the platform's recent content for a post that lacks its platform id
- `posts:connect` - Record which of that content is the post
- `analytics:platform` - Read a channel's analytics over a number of days
- `analytics:post` - Read one post's analytics over a number of days
- `upload` - Upload a file (`--adjust` is accepted, but iHatePosting does no adjusting: the file is used as uploaded)
- `media:list` - Search the media library, newest first, 18 to a page
- `media:status` - Check an upload's status (`ready` straight away, because nothing is adjusted)
- Options: `posts:create` takes `-c` (repeat it for comments or the parts of a thread), `-i` (channels), `-s` (the date), `-t` (`schedule` or `draft`), `-m` and `--alt` (media and alt texts, paired with each `-c`), `-d` (the delay between parts), `--settings`, `--json` and `--no-shortLink`. `posts:list` takes `--startDate`, `--endDate` and `--customer`; the two `analytics:` commands take `-d` (days, default 7); `media:list` takes `-s` and `-p`; `upload` takes `--adjust`; `auth:login` takes `--auth-server`.

### Features
- **Signing in.** `auth:login` is a device-code flow: the program asks the sign-in server for a code, shows it, opens the page where a person types it and approves, and asks every few seconds until they have. The token, the API address it names and the workspace id are saved in `~/.ihateposting/credentials.json` (a folder and a file only the person can open). What was saved wins over `IHATEPOSTING_API_KEY`. The sign-in server is the iHatePosting app's own routes; `IHATEPOSTING_AUTH_SERVER` or `--auth-server` can name another one.
- **Names.** The npm package and the command are `ihateposting-agent`. The plugin is called `ihateposting` in every manifest (Claude Code, Cursor, Grok Build and the Gemini extension) and each marketplace is called `ihateposting-agent`, so Claude Code installs it with `ihateposting@ihateposting-agent`. The skill is called `ihateposting` as well, and so is its folder (`skills/ihateposting`), because an Agent Skills name has to match the folder it sits in.
- **Qwen Code.** The README has an install line for Qwen Code (`qwen extensions install iHatePostingOrg/iHatePosting-Agent:ihateposting`). It needs no file of its own: Qwen Code reads the Claude Code marketplace. The line follows Qwen Code's documentation and was not run inside Qwen Code (unverified).
- **The skill.** `SKILL.md` teaches an AI agent the order that works (sign in, discover, upload, post, analyse) with four rules, patterns and common mistakes. `skills/ihateposting/SKILL.md` is a copy of it that the plugin manifests point at, and a test keeps the copies identical.
- **Plugin folders.** `.claude-plugin` (Claude Code, skill only), `.cursor-plugin` and `.grok-plugin` (skill and the hosted MCP server), `gemini-extension.json` (Gemini CLI, the hosted MCP server), `plugins/dsh-ihateposting` (DeepSeek Harness, a package of its own) and `mcp.json` (an entry for any MCP client).
- **Release workflows.** `.github/workflows/publish-npm.yml` publishes to npm and `sync-skill.yml` copies the skill into the folders the plugins read it from. Both run only when started by hand, and neither has run yet.
- **Requirements.** Node.js 20 or newer. `yargs` (^17.7.2) and `node-fetch` (^3.3.2) are the only dependencies; there are no development dependencies and no build step.
- **Platforms.** Sixteen channel identifiers: `bluesky`, `mastodon`, `slack`, `facebook`, `telegram`, `x`, `linkedin`, `linkedin-page`, `tumblr`, `discord`, `pinterest`, `tiktok`, `youtube`, `gmb` (Google Business), `instagram` and `threads`.
- **Variables.** `IHATEPOSTING_API_KEY` (no default), `IHATEPOSTING_API_URL` and `IHATEPOSTING_AUTH_SERVER` (both default to `https://app.ihateposting.com/api`).
- **What the npm package holds.** `bin`, `src`, `SKILL.md`, `skills`, `README.md`, `CHANGELOG.md` and `LICENSE`, plus `package.json`. The tests, examples, plugin folders and guides stay in the repository.
- **Guides and examples.** A README, a one-page summary, a quick start, a features list, a guide to running and testing, a project map, guides to platform settings, settings discovery, channel helpers and file types, a note for people moving scripts over, contributing and publishing guides, a command-by-command guide, and an `examples/` folder with six sample post bodies and four shell scripts.
- **Tests.** Node's built-in runner, no network and no key: every command against a fake API, the device sign-in against a fake sign-in server, hostile and broken servers and input, the package and its manifests, the documents' links, and a file that plants known faults into copies of the code to prove the other tests notice them.

### Behaviour worth knowing
- Everything that goes wrong ends with exit code `1`; `auth:status` ends with `0` even when the credentials are refused.
- Most commands print a header line and then the JSON; a failure is `❌ Failed to <what>: <why>` on standard error.
- `posts:delete` prints only its header line; `posts:missing`, `media:list` and `media:status` print only JSON.
- Nothing is waited out or tried again: a rate limit or a server error is shown once.
- `posts:create` sends the text exactly as given, needs `--date` unless `--json` is used, takes only `--type schedule` or `draft`, and its `-m` takes addresses of files that are already uploaded (`upload` first). `--json` sends a body as it is.
- An unknown command or option is accepted and does nothing (exit code `0`): the parser, `yargs`, is not told to be strict.
- A plain `http://` address, a redirect and any text as a key are accepted, with no time limit and no limit on an answer's size.

### What is specific to iHatePosting
- **Name, folder, variables:** `ihateposting-agent`, `~/.ihateposting`, `IHATEPOSTING_API_KEY`, `IHATEPOSTING_API_URL`, `IHATEPOSTING_AUTH_SERVER` (iHatePosting's own names)
- **Addresses:** API `https://app.ihateposting.com/api`; the sign-in server defaults to the API's address (iHatePosting's own app)
- **Platforms in help and docs:** fifteen platforms, sixteen identifiers; the examples use Pinterest, YouTube, X and the others the app connects (what iHatePosting connects)
- **Clipping commands:** none (iHatePosting has no clipping)
- **Advertising line in the help:** none (left out on purpose)
- **Licence:** MIT (this repository's own)

### What it costs, said once
- The program keeps behaviour that is less careful than it could be. A key or token sent over plain `http://` to another computer can be read on the way. The HTTP library (`node-fetch` 3) follows a redirect to another address **and keeps the `Authorization` header** (a test in this repository checks it). A request waits for ever. An id with a `/` or `?` in it changes the address that is asked, and a redirect of a `POST` can carry its body to the new address. Point it only at servers you trust and use `https://` except for `localhost`. `auth:status` shows the first eight characters of a key or token.

### Not verified
- No real agent tool (Claude, Cursor, Grok, Gemini, DeepSeek Harness) was pointed at the plugin folders or at `https://app.ihateposting.com/api/mcp/oauth`; their manifests follow the shape each tool documents. The skill's `metadata` line (for tools that read an `openclaw` block) was written from a published example, not run. The guides to platform settings were written from the schemas the app publishes and not rechecked against a live server. The tests were run here on Windows with Node 24; nothing was run on macOS or Linux.

### Not yet done
- The two release workflows have never run.
- Production must route the sign-in's discovery documents (`/.well-known/oauth-protected-resource/api/mcp/oauth` and `/.well-known/oauth-authorization-server/api/mcp/oauth`), the paths `/api/device/*` and the page `/device` to the app before `auth:login` and an MCP client can sign in there. The change is written in the app's repository. It was not deployed on the morning of 2026-11-15 and was at 08:17 UTC the same day (plain requests answered 401, 200 and 400 as they should; a real sign-in was not tried).
