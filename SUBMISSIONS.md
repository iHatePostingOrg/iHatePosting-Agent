# Submissions: copy-paste packs

Four packs, one for each place the owner asked to have ready: the Cursor Marketplace, the Claude plugin portal, DeepSeek Harness (npm and the community list) and the xAI marketplace. This file is separate from `PUBLISHING.md` on purpose: that page is about npm and already long, and these are fields to paste while a website is open next to this file. `PUBLISHING.md` ("Submissions") keeps the overview of every place, the places not covered here (ChatGPT and Codex, the MCP Registry, ClawHub and the rest), and the npm token and two-factor note.

**Nothing in this repository submits anything, signs in anywhere, opens a pull request or publishes.** Every step is the owner's, on the place's own website, signed in as the owner, and each real submission waits for the owner's own yes. What is written here was read from the official pages named in each pack on 2026-11-15; those rules change often, so read the page again before submitting. "Unverified" means it could not be confirmed; "second-hand" means a helper read the page and it was not read again.

## Where things stand (2026-11-15)

- **The changes these packs describe are not committed.** The Claude plugin's own folder (`plugins/claude-ihateposting/`), the rewritten DeepSeek plugin and these files exist only in the working copy. The Claude portal and xAI read the repository on GitHub, so the changes must be committed and pushed first.
- **The new app answered at 08:17 UTC** (`/api/mcp` and `/api/mcp/oauth` 401, the sign-in's discovery documents 200, the device routes 200): see `PUBLISHING.md`, "What must be live first". Earlier the same day they answered 404. **A real sign-in and a real MCP session were not tried**, so what a reviewer meets after installing is untested; each pack says what to expect.
- **Privacy policy and terms of service**: in every pack the addresses are `https://ihateposting.com/privacy` and `https://ihateposting.com/terms` (the marketing host; the owner's decision of 2026-11-15). The app host's own `/privacy` and `/terms` answered 404, which is **not** a blocker.
- **The name (the owner's decision of 2026-11-15: three names were offered, the answer was "No preference", and the first is used everywhere):** display name `iHatePosting` (the owner's answer "Display name : iHatePosting"); the slug of the NEW Claude connector `ihateposting-agent` (the live app's connector holds `ihateposting`); MCP Registry name `com.ihateposting/agent`. The plugin, the skill and the Gemini extension keep the name `ihateposting`, the marketplaces and the npm package are `ihateposting-agent` (the owner's answer "Back to ihateposting", 2026-11-15). The descriptions in the packs keep the old wording, in the shape of the reference's listings: no sentence tells the new listing from the live app's (the owner's decision of 2026-11-15); the places that may need one are listed in `PUBLISHING.md`, "The name of the new listings". The owner can veto the name at any time. Where it is taken or breaks a rule is in `PUBLISHING.md`, "The name of the new listings".
- **Not one of the four places was contacted.** Nothing was submitted, no form was opened and no account was used.

## The order to go in

A suggestion, with the reason for each step; every step is the owner's call.

1. **Commit and push the changes** (the owner). Steps 5 and 7 read GitHub, and the xAI pin is a commit of this repository.
2. **Change the repository's topics on GitHub** (the owner): add `gemini-cli-extension`, `dsh-plugin`, `claude-code`, `openclaw-skills`; remove `facebook`, `instagram`, `linkedin`, `tiktok-auto-post-scheduler` (the owner's decision; the limit of 20 topics is unverified). The DeepSeek list requires the `dsh-plugin` topic.
3. **Try the plugin yourself once.** Where the `claude` command is installed, `claude plugin validate ./plugins/claude-ihateposting` (it was not installed here, so nothing in this repository has been validated by it). Then a real `ihateposting-agent auth:login` against the live app, to see what a reviewer will see.
4. **DeepSeek: publish `dsh-ihateposting` by hand, then open the list's pull request** (pack 3). npm comes first because a published version cannot be changed afterwards, and the list entry should point at something that installs.
5. **Claude plugin portal** (pack 2). It needs the pushed layout and takes days; start it early.
6. **Cursor Marketplace** (pack 1). Only a repository link; review time is not stated.
7. **xAI marketplace pull request last** (pack 4): it pins a commit, so it must follow the final push; it is a pull request on another organisation's repository, and its merge time ranged from hours to six weeks in the ten merged requests read.

## Pack 1: Cursor Marketplace

**Route.** The form at https://cursor.com/marketplace/publish; it takes the repository link. Every plugin is reviewed by hand (https://cursor.com/docs/plugins). Source: https://cursor.com/docs/reference/plugins, "Submitting a plugin" and "Submission checklist", read 2026-11-15.

**What to type.** The repository link: `https://github.com/iHatePostingOrg/iHatePosting-Agent`. The documentation names no other field.

**The checklist, against this repository** (every row but the last two checked from the files):

| Cursor's checklist item | This repository |
| --- | --- |
| A valid root `plugin.json` or `.cursor-plugin/plugin.json` | `.cursor-plugin/plugin.json` |
| A unique, lowercase, kebab-case `name` | `ihateposting`. Its marketplace page answered "Marketplace Plugin Not Found" for that name on 2026-11-15 (read in the in-app browser, with a page that exists as the control; the fallback `ihateposting-agent` answered the same), so the name looked free |
| A `description` that explains the purpose | `.cursor-plugin/plugin.json`, `description` |
| Valid files and front matter for every component | The one component is `skills/ihateposting/SKILL.md`, whose front matter holds `name` and `description` (a test checks it) |
| The logo committed and referenced by a relative path | `assets/logo.png`, a 198 by 198 PNG, named as `logo` in the manifest |
| A `README.md` that documents usage | The repository's `README.md`; its section "Cursor plugin" is at `#cursor-plugin` |
| Relative, valid paths: no `..`, no absolute path | `assets/logo.png` and `./skills/ihateposting` (a test checks them) |
| A marketplace file at the root for a multi-plugin repository | `.cursor-plugin/marketplace.json`, one plugin, `ihateposting` |
| The plugin has been tested locally | **Not done**: Cursor is not installed here (unverified) |
| Agent Plugins conformance, variables declared | Not applicable: this is a Cursor plugin without variables |

**What a reviewer who installs it meets.** The skill, and one MCP server at `https://app.ihateposting.com/api/mcp/oauth`. Before sign-in that address answers 401 and names its discovery documents, which answered 200 at 08:17 UTC; whether Cursor completes that sign-in was not tried (unverified). The skill drives the `ihateposting-agent` command, which has to be installed from npm and signed in.

**Open points** (the owner told us not to touch the Cursor layout, so they are listed, not changed):

- `mcp.json` (at the root, and the same in `.cursor-plugin/`) is a flat object, `{ "ihateposting": { "type": "http", "url": "..." } }`, exactly as the reference project's files are (the owner's decision of 2026-11-16: "do the same as the reference project"). Cursor's own reference shows an `mcp.json` that wraps its servers in `mcpServers`; whether Cursor also accepts the flat form is unverified (the reference project's plugin is listed with the flat form).
- The manifest has no `mcpServers` field (as the reference project's has none), so Cursor picks up the root `mcp.json` by default, which its reference describes.

**Not blocked by anything**: the form needs only the public repository. **After approval** the listing pins a commit, so a later change needs a new request (second-hand).

## Pack 2: Claude plugin portal

**Route.** The developer portal at https://claude.ai/directory/manage, from a GitHub repository. Sources, all read 2026-11-15: https://claude.com/docs/plugins/submit.md, https://claude.com/docs/plugins/pre-submission-checklist.md and https://claude.com/docs/directory/publish.md.

**Before you start** (from those pages):

- A claude.ai account on Pro, Max, Ultra, Team or Enterprise; free accounts cannot submit. On Team and Enterprise an Owner submits.
- Your GitHub account connected to claude.ai, able to push to the repository (the portal checks).
- **The organization you submit from keeps the listing**: the first organization to submit a repository folder holds it, and a second one is refused. Submit from the one that should own it.
- Up to 10 submissions per organization in 24 hours; saved drafts and withdrawn submissions count.

**The steps and what to enter:**

| Portal step | What to enter |
| --- | --- |
| Submit new, "What would you like to submit?" | **Plugin bundle** |
| Source: Repository | `iHatePostingOrg/iHatePosting-Agent` |
| Source: Plugin path | `plugins/claude-ihateposting` |
| Source: Branch or tag | `main` (or leave empty for the default branch) |
| Validate | Run it; it applies to one commit, so validate again after any push |
| Listing details | Read from `plugin.json` and the README; to change a field, edit the files, push and validate again |
| Data handling | The owner's answers; a proposal is below |
| Compliance | A contact email where Anthropic can reach the owner, and all four acknowledgements |
| Review and submit | "GitHub push webhook" (the default) or "Scheduled check only", then Submit for review |

**The fields the listing is read from** (`plugins/claude-ihateposting/.claude-plugin/plugin.json`): name `ihateposting`, display name `iHatePosting`, the description, the icon `./logo.png`, documentation `https://github.com/iHatePostingOrg/iHatePosting-Agent#readme`, support `https://ihateposting.com/contact`, privacy `https://ihateposting.com/privacy`, terms `https://ihateposting.com/terms`, licence MIT. The README of the same folder is the listing's description.

**The data handling questions, a proposal for the owner to confirm or change.** The plugin is a text skill and stores nothing itself. It makes Claude run the `ihateposting-agent` command, which sends the posts, the files the person asks to upload and the person's key or sign-in token to iHatePosting's API at `https://app.ihateposting.com/api`. So, for the question "does it send data to services other than its declared connectors": yes, to iHatePosting's own API, through that command; the plugin declares no connector. How long iHatePosting keeps data, and whether the product is for people under 18, are the owner's answers: this repository does not say.

**The requirements, against this folder** (Anthropic's checklist, read first-hand):

| Requirement | This folder |
| --- | --- |
| The folder holds `.claude-plugin/plugin.json`; every path in it stays inside the folder | Yes; its only path is `./logo.png` |
| A README of at least 40 words, not counting code blocks | Yes, about 300 words |
| A `LICENSE` file, or `license` in `plugin.json` | Both: `LICENSE` (MIT) and `"license": "MIT"` |
| At most 512 files; text and complete PNG images only; no symbolic link; no `.DS_Store` or `Thumbs.db` | Five files: `.claude-plugin/plugin.json`, `README.md`, `LICENSE`, `logo.png`, `skills/ihateposting/SKILL.md` (a test checks the rules) |
| A file that is not an image or font stays under 256 KiB | The largest is `SKILL.md`, about 61 KB |
| Folder names on the path use letters, digits, dots, hyphens, underscores | `plugins/claude-ihateposting` |
| A `name` of lowercase letters, digits and hyphens that no other organization uses and that is not a reserved word | `ihateposting`; whether another organization uses it is checked by the portal's Validate |
| `description`, `author` and `version` set; `version` raised with every release | Set (0.1.1); raise it in `plugin.json` when a release changes the plugin |
| No hooks, no MCP server, no package launcher, no credential in any file | None; the plugin is one skill |
| The README describes everything the plugin runs, sends or fetches | It does: the command, the API address, the key variable and the saved-credentials file |

**What a reviewer who installs it meets.** An installed skill and nothing else. If they try it, Claude is told to install `ihateposting-agent` from npm (live since 2026-11-15) and to sign in with `auth:login` or a key; the sign-in's routes answered at 08:17 UTC but were not tried end to end.

**The one point to watch: the name.** The plugin is `ihateposting` (display name `iHatePosting`), the same name as the plugin in the live app's older repository, and Anthropic's connector directory already lists a connector called `ihateposting` for the old app (the owner's own listing; a helper read its page). The checklist says the portal blocks a name another organization uses and holds a look-alike for a reviewer; the older plugin and the connector are the same publisher's, and a plugin and a connector are different listings, but whether the portal treats them so is unverified. If it refuses, the fallback is `ihateposting-agent` (the install line then becomes `ihateposting-agent@ihateposting-agent`); a plugin's name is permanent once published, so decide before the first submit.

**Not blocked by anything** except the commit and push (step 1). Review time is not fixed (https://claude.com/docs/directory/submission-status.md, second-hand).

## Pack 3: DeepSeek Harness (npm and the community list)

**Part A: publish `dsh-ihateposting` to npm by hand** (the owner's decision; version 0.1.1 can never be changed once published). From the repository root, in a terminal where `npm whoami` names the owner's account (PowerShell: `npm.cmd`):

```bash
cd plugins/dsh-ihateposting
node --test "test/*.test.mjs"
npm pack --dry-run
npm whoami
npm publish --access public
```

- The dry run must list six files: `LICENSE`, `README.md`, `cordis.patch.yml`, `lib/index.js`, `lib/skill.js` and `package.json`, about 9 kB packed. If `skill/`, `test/` or `lib/key.js` appears, stop.
- npm asks for a one-time code from the authenticator when it needs one: type it yourself.
- Afterwards: `npm view dsh-ihateposting version` should answer `0.1.1`.
- The plugin asks the host for two peer packages, `@deepseek-ai/cordis` (`^4.0.1`) and `@deepseek-ai/schemastery` (`^3.18.1`); both exist on npm and the ranges include the versions DeepSeek Harness pins (4.0.2 and 3.18.2). **No real DeepSeek Harness has loaded this plugin**: the plugin's README says so and so should any listing text.

**Part B: the community list's pull request.** The list is the repository `awesome-dsh-plugin/awesome-dsh-plugin`; its contributing guide (https://raw.githubusercontent.com/awesome-dsh-plugin/awesome-dsh-plugin/main/contributing.md, read 2026-11-15) asks for one new file in a pull request. The pull request is on another organisation's repository: only with the owner's yes.

The file, named after the repository and the folder as an existing entry for a plugin inside a larger repository is (`data/plugins/<owner>__<repo>--plugins-<folder>.yml`):

```text
data/plugins/iHatePostingOrg__iHatePosting-Agent--plugins-dsh-ihateposting.yml
```

Its content, ready to paste:

```yaml
url: https://github.com/iHatePostingOrg/iHatePosting-Agent/tree/main/plugins/dsh-ihateposting
name: iHatePostingOrg/iHatePosting-Agent#dsh-ihateposting
category: tools
description:
  en: 'Connects DeepSeek Harness to iHatePosting over MCP: lists connected social channels, reads the posting rules of each platform, and drafts, schedules or publishes posts across 15 platforms.'
```

Only `description.en` is required; the guide says a maintainer adds a Chinese one. A description that contains a colon and a space must be quoted (this one is). The guide says the description is checked against the code, so every claim in it was matched to the plugin: MCP, listing channels (`integrationList`), posting rules (`integrationSchema`), draft, schedule and publish (`integrationSchedulePostTool`), 15 platforms.

**The guide's requirements, against this repository:**

| Requirement | Status |
| --- | --- |
| `dsh.bundle` in `package.json`, with a `cordis.patch.yml` that has `- insert:` rows | Yes (`plugins/dsh-ihateposting/package.json`) |
| Real, working code | Yes; tested with stand-ins, never loaded by a real DeepSeek Harness |
| The repository is at least one day old | Yes (created 2026-11-13) |
| The `dsh-plugin` topic on the repository | **Step 2 of the order** (the owner adds it) |
| Actively maintained; not a meta-package; the pull request touches only its own file | Yes; yes; yes |
| An accurate description, no superlatives | See above |

**What a reviewer who installs it meets.** `dsh plugin --profile web add dsh-ihateposting` (after Part A), a key made under Settings > Agents / Dev in iHatePosting, and `IHATEPOSTING_API_KEY` exported. With no key the plugin loads and warns once, the MCP row connects without credentials, iHatePosting answers 401 (a plain request to `https://app.ihateposting.com/api/mcp` answered 401 at 08:17 UTC) and no tools appear; dsh keeps starting. With a key, the connection itself was not tried.

**Not blocked by anything.** The plugin's code and README are final for 0.1.1 unless the owner wants a change before publishing.

## Pack 4: xAI marketplace pull request

**Route.** A pull request that adds one entry to `.grok-plugin/marketplace.json` of `xai-org/plugin-marketplace` (https://raw.githubusercontent.com/xai-org/plugin-marketplace/main/CONTRIBUTING.md and README.md, read 2026-11-15). Pull request on another organisation's repository: only with the owner's yes. Anyone can also add this repository's own marketplace without any pull request: `grok plugin marketplace add iHatePostingOrg/iHatePosting-Agent` (the form xAI's pages show; not run here).

**The entry, ready to paste** into the `plugins` array (the `sha` is a placeholder on purpose):

```json
{
  "name": "ihateposting",
  "description": "iHatePosting social media automation. Schedule posts, manage integrations, upload media, and track analytics across 15 platforms including X, LinkedIn, YouTube, TikTok, and Instagram.",
  "category": "productivity",
  "source": {
    "source": "url",
    "url": "https://github.com/iHatePostingOrg/iHatePosting-Agent.git",
    "sha": "REPLACE-WITH-THE-40-CHARACTER-COMMIT-AFTER-THE-PUSH"
  },
  "homepage": "https://ihateposting.com",
  "keywords": ["ihateposting", "ihateposting mcp", "schedule a post with ihateposting"],
  "domains": ["ihateposting.com", "app.ihateposting.com"]
}
```

**The `sha`.** xAI rejects a branch, a tag and a short SHA: it must be the full 40-character commit, public and reachable. **The exact commit cannot be named yet**, because the changes of these packs are not committed. After the push, in this repository:

```bash
git push origin main
git ls-remote https://github.com/iHatePostingOrg/iHatePosting-Agent.git HEAD
```

The first word of the answer is the SHA; paste it in place of the placeholder, and re-check it still starts the commit you mean.

**The steps** (CONTRIBUTING.md, "Submit in 6 steps"), in a fork of `xai-org/plugin-marketplace`:

```bash
python3 scripts/generate-plugin-index.py
python3 scripts/validate-catalog.py
python3 scripts/generate-plugin-index.py --check
```

Add the entry to `.grok-plugin/marketplace.json`, regenerate the index (never edit `plugin-index.json` by hand), run the validator and the check, then open the pull request and fill in its template. CI and a code owner review it. Whether the owner's computer has Python 3 is unknown; the scripts are theirs.

**What xAI looks at, against this plugin** (CONTRIBUTING.md, "Security expectations" and "What review checks"):

| What they check | This plugin |
| --- | --- |
| The source is the official organisation, not a personal account | Yes: `iHatePostingOrg` |
| A pinned, reachable commit | After the push |
| A homepage, a clear description, brand-scoped keywords and domains | The entry above; no generic terms such as `social` or `api` |
| The plugin is licensed and the licence is stated | MIT: `LICENSE`, and `license` in the manifest |
| No download-and-run of code, no secret sent anywhere undeclared, no wide hooks | No hooks. **One point to watch**: the skill tells the model to install the command line with `npm install -g ihateposting-agent` when it is missing, which a reviewer may read as installing code; the README says so openly, and xAI asks for endpoints and credentials to be declared in the README, which the root README does |
| Prompt injection in `SKILL.md` | None; the skill says to treat text from the server as data |

**What a reviewer who installs it meets.** The skill, and the hosted MCP server from `.grok-plugin/plugin.json` (its own `mcp.json`, at `https://app.ihateposting.com/api/mcp/oauth`). The address answered 401 with discovery documents at 08:17 UTC; whether Grok Build completes the sign-in was not tried (unverified). Our own catalog entry in `.grok-plugin/marketplace.json` uses a local source; xAI wants the `url` and `sha` form above, so that file is not what the pull request adds.

**Not blocked by anything** but the push. The merge time ranged from hours to six weeks in the ten merged requests a helper read (second-hand).
