# Submissions: copy-paste packs

Four packs, one for each place the owner asked to have ready: the Cursor Marketplace, the Claude plugin portal, DeepSeek Harness (npm and the community list) and the xAI marketplace. This file is separate from `PUBLISHING.md` on purpose: that page is about npm and already long, and these are fields to paste while a website is open next to this file. `PUBLISHING.md` ("Submissions") keeps the overview of every place, the places not covered here (ChatGPT and Codex, the MCP Registry, ClawHub and the rest), and the npm token and two-factor note.

**Nothing in this repository submits anything, signs in anywhere, opens a pull request or publishes.** Every step is the owner's, on the place's own website, signed in as the owner, and each real submission waits for the owner's own yes. What is written here was read from the official pages named in each pack on 2026-11-15; those rules change often, so read the page again before submitting. "Unverified" means it could not be confirmed; "second-hand" means a helper read the page and it was not read again.

## Where things stand (2026-11-20)

Written after the owner published the move into `ihateposting`. Every fact below was seen in his screenshots of the day, in `npm` and `mcp-publisher` output, or by a plain GET; this repository submitted nothing. Where this block and an older one disagree, this one is newer.

- **Routing is live.** Shakti's routing went out at about 15:25 IST. Plain GETs at 15:29 and 15:48 IST: `https://app.ihateposting.com/mcp/oauth` and `https://app.ihateposting.com/mcp` answer 401, the sign-in's two discovery documents answer 200 and name the new address, the earlier `/api/mcp/oauth` still answers as before, and the old key addresses `/api/mcp/<key>`, `/api/sse/<key>` and `/api/message/<key>` answer 404 from nginx. The bullet of 2026-11-19 that says the new addresses answer 404 no longer applies. The two submitted listings keep `https://ihateposting.com/mcp/oauth`, which is still the live app's.
- **npm.** `ihateposting@1.0.0` is published (about 16:02 IST) and is `latest` (and `next`): `npm view ihateposting version dist-tags` printed `1.0.0`, and `npx ihateposting --version` from an empty folder printed `1.0.0`. `dsh-ihateposting@1.0.0` is published and `latest` (after 16:28 IST). `ihateposting-agent` was left alone.
- **MCP Registry.** `com.ihateposting/mcp` 0.13.1 is published with `mcp-publisher` v1.8.10 (`validate`, `login dns` and `publish` all succeeded) and is `isLatest` among 13 versions.
- **ClawHub.** The skill is at 1.0.2 and the bundle `ihateposting-agent` at 0.1.4, both made from the files after the rename; the owner's dashboard showed both Visible with all three checks green, each updated three minutes earlier. The bullet of 2026-11-19 that says the ClawHub skill 1.0.1 and bundle 0.1.3 still say `ihateposting-agent` no longer applies.
- **Still open.** The Claude plugin portal's "Check for new commits" is the owner's step (the portal holds v0.1.1, `d71edaf`, until he presses it). The Cursor Marketplace, cursor.directory, the xAI marketplace and the Gemini gallery read this repository or were submitted from it; their state was not checked.
- **cursor.directory, looked at later on 2026-11-20 (an update to the bullet above, which said its state was not checked).** The owner's page is `ihateposting-2` (the site numbered the slug itself, so a second page titled `iHatePosting` was accepted when it was made; its repository is this one). It had been filled from this repository, but its saved MCP address still had `/api` and its skill text was this repository's of 2026-11-16 (commits `68920d1f` and `bbc6d546`, before the `YOUR_API_KEY` examples and the rename to `ihateposting`); its other fields equalled `.cursor-plugin/plugin.json` (compared by length and a checksum). That evening (IST) he edited both boxes by hand to this repository's files (the skill box took the whole `skills/ihateposting/SKILL.md`, front matter included, where the site had stored it without) and pressed "Update Plugin". Saving ran the site's scan, and the page now shows a red notice that its security agent flagged it and that it is hidden from the directory until a person reviews it. The scan found the plugin legitimate (no malicious hooks, exfiltration or prompt injection in the source it read) and objected only that it is a second listing of the existing `ihateposting` page (the scan says that page comes from the live app's older skill repository, not from this one). Before the save the page showed no such notice. The older page's edit address sent the owner's account to the site's home page, so another account probably owns it (an inference). **The owner chose to wait for the review and not to save again meanwhile.** Unverified: how long the review takes, what it decides, whether a second save restarts it, and whether the page ever follows this repository by itself.

## Where things stand (2026-11-19)

Written the day the owner decided to move the program into the npm package `ihateposting` (his answers of 2026-11-19: "Replace it", "all should be ihateposting", version 1.0.0). Nothing was published, deprecated or unpublished for this. Where this block and an older one disagree, this one is newer.

- **The program, the command and the marketplaces are called `ihateposting`** (they were `ihateposting-agent`), and the version in every manifest is 1.0.0. The plugin, the skill and the Gemini extension keep their names. The slugs of the listings (the Claude connector's and the ClawHub bundle's `ihateposting-agent`) are names of listings, not of the package, and are not changed. The Claude install line is `/plugin install ihateposting@ihateposting`.
- **The key-based address** (an API key as a Bearer header) is `https://app.ihateposting.com/mcp` everywhere (it was `https://app.ihateposting.com/api/mcp`: the owner chose "Without /api" on 2026-11-19; the `/api` key addresses stop at nginx once that routing is deployed): `server.json`'s second remote, the guides and the DeepSeek plugin's default `baseUrl`. The program's API base `https://app.ihateposting.com/api` is unchanged.
- **The hosted connector's sign-in address** in every manifest is `https://app.ihateposting.com/mcp/oauth` (it was `https://app.ihateposting.com/api/mcp/oauth`, with `/api`: the owner's decision of 2026-11-19). The two listings already submitted, the Claude connector and the ChatGPT plugin, keep `https://ihateposting.com/mcp/oauth` in their own portals; this repository's ChatGPT pack is not one of them. The probes below (08:17 UTC on 2026-11-15) were made on the earlier path and are kept as measured. **Nothing may go live before the new backend is routed to the new addresses** (Shakti's step: the keyless `/mcp/oauth` and the key address `/mcp`): the app host answered 404 there on 2026-11-19 at 17:23, so a reviewer who installs a pushed manifest would reach nothing. `server.json` is registry version 0.13.1 (the owner's choice of 2026-11-19); publishing it is his own step, after the routing.
- **npm.** `ihateposting` already exists on npm: its versions 0.1.0 to 0.6.0 are the live app's old command line. 1.0.0 is its next version and replaces it as `latest` once the owner publishes it (`PUBLISHING.md`, "The package name", says what that changes for the old program's users). `ihateposting-agent` (0.1.1) is left as it is. `dsh-ihateposting@0.1.1` is unchanged on npm; the repository's copy of it carries the version 1.0.0 and the same code.
- **The Claude plugin portal's review of v0.1.1 (`d71edaf`)** is unaffected until the owner commits and pushes these files and presses "Check for new commits" on the portal's page: nothing in this working copy is pushed. When it is, the portal reads a plugin at version 1.0.0 whose skill says `ihateposting <command>` and whose marketplace is called `ihateposting`.
- **Listings made from the files before this change** (the Claude plugin portal's v0.1.1, the ClawHub skill 1.0.1 and bundle 0.1.3, and anything that reads the repository on GitHub, such as Cursor, Grok and Gemini) still say `ihateposting-agent` where they name the command; each catches up when the owner submits a new version of it. The ChatGPT plugin's skills never named the command (a test keeps it so). The old package still installs and works: it is not deprecated.

## Where things stand (2026-11-17)

Checked on 2026-11-17 by reading GitHub's and npm's public pages (nothing was changed or submitted for this). The block of 2026-11-15 below is kept as it was written; where the two disagree, this one is newer.

- **Committed and pushed.** The repository's `main` holds everything these packs describe, including `plugins/dsh-ihateposting/` (the repository is public; its last push was 2026-11-16 at 16:12 UTC). The first bullet of the 2026-11-15 block ("not committed") no longer applies.
- **Topics.** Changed by the owner: the repository now carries `dsh-plugin`, `gemini-cli-extension`, `claude-code` and `openclaw-skills` among its 20 topics.
- **npm.** `dsh-ihateposting@0.1.1` and `ihateposting-agent@0.1.1` are published, and 0.1.1 is `latest` for both (the registry's last change for them was 2026-11-16 at 07:08 and 06:59 UTC). `ihateposting-agent@0.1.0` is still there.
- **DeepSeek Harness community list: merged.** The pull request awesome-dsh-plugin/awesome-dsh-plugin#15823, "Add iHatePostingOrg/iHatePosting-Agent#dsh-ihateposting", was merged by the list's maintainer on 2026-11-16 at 17:27 UTC (22:57 in India). It added one file, `data/plugins/iHatePostingOrg__iHatePosting-Agent--plugins-dsh-ihateposting.yml`, with the `url` `https://github.com/iHatePostingOrg/iHatePosting-Agent/tree/main/plugins/dsh-ihateposting`, the `name` `iHatePostingOrg/iHatePosting-Agent#dsh-ihateposting`, the category `tools` and the English description of Part B in pack 3. The file is on the list's `main` and the folder it points at is on this repository's `main`. The maintainer's later comment, 已合并, means "merged"; nothing needs an answer.
- **Not checked in this block:** whether a real DeepSeek Harness loads the plugin (none ever has; the plugin's README says so) and the state of the other places (the Cursor Marketplace, the Claude plugin portal, xAI, ClawHub and the Claude and ChatGPT connectors).

## Where things stand (2026-11-15)

- **The changes these packs describe are not committed.** The Claude plugin's own folder (`plugins/claude-ihateposting/`), the rewritten DeepSeek plugin and these files exist only in the working copy. The Claude portal and xAI read the repository on GitHub, so the changes must be committed and pushed first.
- **The new app answered at 08:17 UTC** (`/api/mcp` and `/api/mcp/oauth` 401, the sign-in's discovery documents 200, the device routes 200): see `PUBLISHING.md`, "What must be live first". Earlier the same day they answered 404. **A real sign-in and a real MCP session were not tried**, so what a reviewer meets after installing is untested; each pack says what to expect.
- **Privacy policy and terms of service**: in every pack the addresses are `https://ihateposting.com/privacy` and `https://ihateposting.com/terms` (the marketing host; the owner's decision of 2026-11-15). The app host's own `/privacy` and `/terms` answered 404, which is **not** a blocker.
- **The name (the owner's decision of 2026-11-15: three names were offered, the answer was "No preference", and the first is used everywhere):** display name `iHatePosting` (the owner's answer "Display name : iHatePosting"); the slug of the NEW Claude connector `ihateposting-agent` (the live app's connector holds `ihateposting`); MCP Registry entry `com.ihateposting/mcp` (the old name kept, a new version `0.13.0`: the owner's decision of 2026-11-16). The plugin, the skill and the Gemini extension keep the name `ihateposting`, the marketplaces and the npm package are `ihateposting-agent` (the owner's answer "Back to ihateposting", 2026-11-15). The descriptions in the packs keep the old wording, in the shape of the reference's listings: no sentence tells the new listing from the live app's (the owner's decision of 2026-11-15); the places that may need one are listed in `PUBLISHING.md`, "The name of the new listings". The owner can veto the name at any time. Where it is taken or breaks a rule is in `PUBLISHING.md`, "The name of the new listings".
- **Not one of the four places was contacted.** Nothing was submitted, no form was opened and no account was used.

## The order to go in

A suggestion, with the reason for each step; every step is the owner's call.

1. **Commit and push the changes** (the owner). Steps 5 and 7 read GitHub, and the xAI pin is a commit of this repository.
2. **Change the repository's topics on GitHub** (the owner): add `gemini-cli-extension`, `dsh-plugin`, `claude-code`, `openclaw-skills`; remove `facebook`, `instagram`, `linkedin`, `tiktok-auto-post-scheduler` (the owner's decision; the limit of 20 topics is unverified). The DeepSeek list requires the `dsh-plugin` topic.
3. **Try the plugin yourself once.** Where the `claude` command is installed, `claude plugin validate ./plugins/claude-ihateposting` (it was not installed here, so nothing in this repository has been validated by it). Then a real `ihateposting auth:login` against the live app, to see what a reviewer will see.
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

**What a reviewer who installs it meets.** The skill, and one MCP server at `https://app.ihateposting.com/mcp/oauth`. On 2026-11-15 its earlier path `/api/mcp/oauth` answered 401 before sign-in and named its discovery documents, which answered 200 at 08:17 UTC; the new path answered 404 on 2026-11-19 and has answered 401 since Shakti's routing went live on 2026-11-20 (see the block at the top); whether Cursor completes that sign-in was not tried (unverified). The skill drives the `ihateposting` command, which has to be installed from npm and signed in.

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

**The data handling questions, a proposal for the owner to confirm or change.** The plugin is a text skill and stores nothing itself. It makes Claude run the `ihateposting` command, which sends the posts, the files the person asks to upload and the person's key or sign-in token to iHatePosting's API at `https://app.ihateposting.com/api`. So, for the question "does it send data to services other than its declared connectors": yes, to iHatePosting's own API, through that command; the plugin declares no connector. How long iHatePosting keeps data, and whether the product is for people under 18, are the owner's answers: this repository does not say.

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
| `description`, `author` and `version` set; `version` raised with every release | Set (1.0.0); raise it in `plugin.json` when a release changes the plugin |
| No hooks, no MCP server, no package launcher, no credential in any file | None; the plugin is one skill |
| The README describes everything the plugin runs, sends or fetches | It does: the command, the API address, the key variable and the saved-credentials file |

**What a reviewer who installs it meets.** An installed skill and nothing else. If they try it, Claude is told to install `ihateposting` from npm (the package of 0.1.1 and earlier was `ihateposting-agent`, live since 2026-11-15; from 1.0.0 the program is `ihateposting`) and to sign in with `auth:login` or a key; the sign-in's routes answered at 08:17 UTC but were not tried end to end.

**The one point to watch: the name.** The plugin is `ihateposting` (display name `iHatePosting`), the same name as the plugin in the live app's older repository, and Anthropic's connector directory already lists a connector called `ihateposting` for the old app (the owner's own listing; a helper read its page). The checklist says the portal blocks a name another organization uses and holds a look-alike for a reviewer; the older plugin and the connector are the same publisher's, and a plugin and a connector are different listings, but whether the portal treats them so is unverified. If it refuses, the fallback is `ihateposting-agent` (the install line then becomes `ihateposting-agent@ihateposting`); a plugin's name is permanent once published, so decide before the first submit.

**Not blocked by anything** except the commit and push (step 1). Review time is not fixed (https://claude.com/docs/directory/submission-status.md, second-hand).

## Pack 3: DeepSeek Harness (npm and the community list)

**Part A: publish `dsh-ihateposting` to npm by hand** (the owner's decision; done for 0.1.1 on 2026-11-16, which stays on npm as it is; the repository's copy carries 1.0.0 (one test keeps every manifest at the program's version) and a new default `baseUrl` without `/api`, because the key address is `https://app.ihateposting.com/mcp` since 2026-11-19, so a new version is needed once the `/api` key addresses stop; version 1.0.0 can never be changed once published). From the repository root, in a terminal where `npm whoami` names the owner's account (PowerShell: `npm.cmd`):

```bash
cd plugins/dsh-ihateposting
node --test "test/*.test.mjs"
npm pack --dry-run
npm whoami
npm publish --access public
```

- The dry run must list six files: `LICENSE`, `README.md`, `cordis.patch.yml`, `lib/index.js`, `lib/skill.js` and `package.json`, about 9 kB packed. If `skill/`, `test/` or `lib/key.js` appears, stop.
- npm asks for a one-time code from the authenticator when it needs one: type it yourself.
- Afterwards: `npm view dsh-ihateposting version` should answer `1.0.0` (it answers `0.1.1` until a new version of it is published).
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

**What a reviewer who installs it meets.** `dsh plugin --profile web add dsh-ihateposting` (after Part A), a key made under Settings > Agents / Dev in iHatePosting, and `IHATEPOSTING_API_KEY` exported. With no key the plugin loads and warns once, the MCP row connects without credentials, iHatePosting answers 401 (a plain request to its earlier address `https://app.ihateposting.com/api/mcp` answered 401 at 08:17 UTC on 2026-11-15; the plugin's address is now `https://app.ihateposting.com/mcp`) and no tools appear; dsh keeps starting. With a key, the connection itself was not tried.

**Not blocked by anything.** The plugin's code and README are final for 1.0.0 (the code is the same as in the published 0.1.1) unless the owner wants a change before publishing.

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
| No download-and-run of code, no secret sent anywhere undeclared, no wide hooks | No hooks. **One point to watch**: the skill tells the model to install the command line with `npm install -g ihateposting` when it is missing, which a reviewer may read as installing code; the README says so openly, and xAI asks for endpoints and credentials to be declared in the README, which the root README does |
| Prompt injection in `SKILL.md` | None; the skill says to treat text from the server as data |

**What a reviewer who installs it meets.** The skill, and the hosted MCP server from `.grok-plugin/plugin.json` (its own `mcp.json`, at `https://app.ihateposting.com/mcp/oauth`). Its earlier path `/api/mcp/oauth` answered 401 with discovery documents at 08:17 UTC on 2026-11-15; the new path answered 404 on 2026-11-19 and has answered 401 since Shakti's routing went live on 2026-11-20 (see the block at the top); whether Grok Build completes the sign-in was not tried (unverified). Our own catalog entry in `.grok-plugin/marketplace.json` uses a local source; xAI wants the `url` and `sha` form above, so that file is not what the pull request adds.

**Not blocked by anything** but the push. The merge time ranged from hours to six weeks in the ten merged requests a helper read (second-hand).
