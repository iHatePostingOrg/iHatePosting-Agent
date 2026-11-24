# Publishing the iHatePosting CLI to npm

This page is for the owner of the package. It says what a release is made of, what to check first, and how to publish it: **by hand, from your own computer, with two-factor authentication** (the owner's decision of 2026-11-15; version 0.1.0 was published this way). Nothing in this repository publishes by itself: the two workflows run only when they are started by hand, they have never run, and they are not part of the way releases are made (see "The two workflows" at the end of this page).

## Quick Publish (Current Name: "ihateposting")

```bash
# From the repository root
npm install
npm test                          # the whole suite; the planted-faults file takes ten minutes or more
npm pack --dry-run                # what would be published
npm login                         # first time only
npm publish --access public
```

npm asks for a one-time code from your authenticator when it needs one: type it yourself. A version that has been published can never be published again, even under the same number after a removal, so make every release a new number. The sections below explain each step and what can go wrong.

Then users can install:
```bash
npm install -g ihateposting
# or
pnpm install -g ihateposting

# And use:
ihateposting --help
```

## Publishing 1.0.0: the move into `ihateposting`, in order

**Status (2026-11-20, written after the owner ran these steps; seen in his screenshots and by plain requests, never run by whoever wrote this page).** The two things that had to come before step 4 are settled: Shakti's routing is live (`https://app.ihateposting.com/mcp/oauth` and `https://app.ihateposting.com/mcp` answer 401 since about 15:25 IST; plain GETs at 15:29 and 15:48 IST), and the app's Agents / Dev card, which says `npm install -g ihateposting`, went live with the deploy of 14:32 IST, so publishing 1.0.0 as `latest` was due. Steps 1 to 3 passed: `git status` clean at `c07725e`, the tarball try printed `1.0.0` and listed the commands as `ihateposting <command>`, and `npm view ihateposting versions dist-tags` showed 0.1.0 to 0.6.0, `latest` 0.6.0 and one maintainer, the owner's account. Step 4, the staged way: `npm publish --access public --tag next` printed `+ ihateposting@1.0.0` at about 16:02 IST, `npm dist-tag add ihateposting@1.0.0 latest` printed `+latest: ihateposting@1.0.0` (npm said both could take a few minutes), and a repeated `npm publish --access public` failed with E409, "Cannot publish over previously staged version" (1.0.0 was already there; nothing to fix). Step 5: `npm view ihateposting version dist-tags` printed `1.0.0` and `{ latest: '1.0.0', next: '1.0.0' }`, and `npx ihateposting --version` from an empty folder printed `1.0.0`. Step 6: `mcp-publisher` v1.8.10 (downloaded again, its SHA-256 compared with the one GitHub shows for the file) printed that `server.json` is valid, logged in with the DNS proof and published 0.13.1; the registry's list then showed 0.13.1 as `isLatest` among 13 versions. Step 7: `dsh-ihateposting@1.0.0` was published and is `latest`. Step 8 stands as written. Still open: pressing "Check for new commits" on the Claude plugin portal. ClawHub, which is not one of these steps, was brought up to date the same day (see the ClawHub notes below).

The owner's decisions of 2026-11-19 (replace it, `ihateposting` only, version 1.0.0, "all should be ihateposting", leave `ihateposting-agent` alone) are in the files. **None of the commands below was run by whoever prepared them**: no `npm publish`, no `npm deprecate`, no `npm unpublish`, no commit and no push (one rename, `bin/ihateposting-agent.mjs` to `bin/ihateposting.mjs`, is staged with `git mv`). Every step is yours, from your own computer, with two-factor authentication. In a PowerShell that blocks scripts, type `npm.cmd` for `npm`. **Two things come before step 4:** the README of this package names the connector's sign-in address `https://app.ihateposting.com/mcp/oauth`, which answers 404 until Shakti routes it to the new backend (the two listings already submitted keep `https://ihateposting.com/mcp/oauth` in their own portals, a second route of his), so do not publish before that, and do not push or run the registry step before it either (the key address `https://app.ihateposting.com/mcp`, which `server.json` and the DeepSeek plugin now name, is routed in the same change, and the old `/api/mcp` key addresses stop with it); and the Agents / Dev card of the app says `npm install -g ihateposting`, which installs the old 0.6.0 until 1.0.0 is `latest`, so do not deploy the app's change before 1.0.0 is published.

1. **Look at what will be published.** From the repository root:

   ```bash
   git status
   npm test
   npm pack --dry-run
   ```

   `git status` lists the changed files. `npm test` runs every test file; the planted-faults file takes the longest (its own header says about an hour and a half on the owner's computer, measured on 2026-11-16). `npm pack --dry-run` lists the 16 files of `ihateposting@1.0.0` (59.2 kB packed) and uploads nothing.

2. **Try the tarball where nothing of yours is in the way.** A throwaway folder keeps an `ihateposting` you may have installed globally (the old 0.6.0, for example) untouched:

   ```powershell
   npm pack --pack-destination $env:TEMP
   npm install -g --prefix "$env:TEMP\ihateposting-try" "$env:TEMP\ihateposting-1.0.0.tgz"
   & "$env:TEMP\ihateposting-try\ihateposting.cmd" --version
   & "$env:TEMP\ihateposting-try\ihateposting.cmd" --help
   ```

   `--version` prints `1.0.0` and `--help` lists the commands as `ihateposting <command>`; neither needs a sign-in. Tried the same way on 2026-11-19: it installs, and an install over 0.6.0 in the same folder leaves only the new program.

3. **Check who you are and what is on npm.**

   ```bash
   npm whoami
   npm view ihateposting versions dist-tags
   ```

   `npm whoami` must name the account that maintains `ihateposting` (the owner's; `npm login` if it does not). The second command must still show 0.1.0 to 0.6.0 with `latest` at 0.6.0, and no 1.0.0.

4. **Publish.** npm asks for a one-time code from your authenticator: type it yourself. Choose one way.

   *Staged*, which keeps `latest` on the old command line until you have looked at the new one:

   ```bash
   npm publish --access public --tag next
   npm view ihateposting dist-tags
   ```

   The second command should show `latest: 0.6.0` and `next: 1.0.0`. Try it in a throwaway folder as in step 2 (with `ihateposting@next` in place of the tarball's path), and when you are satisfied:

   ```bash
   npm dist-tag add ihateposting@1.0.0 latest
   ```

   From then on `npm install -g ihateposting` and `npm update -g ihateposting` give 1.0.0 (a global package has no version range, so its wanted version is `latest`: npm's `update` page). npm asks for a one-time code here too, or takes `--otp <code>`. The `next` tag may stay where it is; `npm dist-tag rm ihateposting next` removes it.

   *At once*:

   ```bash
   npm publish --access public
   ```

   Publishing sets `latest` to the new version unless `--tag` is given (npm's `dist-tag` page), so 1.0.0 is what everyone gets from this moment.

5. **Check the result.**

   ```bash
   npm view ihateposting version dist-tags
   ```

   In a fresh folder, `npx ihateposting --version` should print `1.0.0` (when a package has several commands npx runs the one named like the package; this package has one).

6. **The MCP Registry** (your own step, with your key and the DNS record of 2026-11-16, and only after Shakti has routed `https://app.ihateposting.com/mcp/oauth` and `https://app.ihateposting.com/mcp` to the new backend). `server.json` lists the first as its OAuth remote and the second as its key remote, so it no longer matches what the registry published as 0.13.0 (which named the `/api` addresses), and a published version cannot be changed: a new version is needed. Its number is 0.13.1 (your choice of 2026-11-19, already in `server.json`: above 0.13.0, because the registry takes the latest by semantic-version order); then, from the repository root, one command after the other:

   ```powershell
   mcp-publisher login dns --domain ihateposting.com --private-key ((Get-Content <your private key file> -Raw).Trim())
   ```

   ```powershell
   mcp-publisher publish
   ```

   The first command proves the domain with the DNS record and the key you made on 2026-11-16 (the key stays outside every repository: it is never pasted into a file here); the second reads `server.json` and publishes the new version of `com.ihateposting/mcp`. `mcp-publisher` is the registry's own program: its quickstart is linked in "Official MCP Registry" below.

7. **The DeepSeek plugin, if you want its new default out** (a separate package, `plugins/dsh-ihateposting`: see "The DeepSeek Harness plugin is separate" below). Its copy here is 1.0.0 and its default `baseUrl` is `https://app.ihateposting.com` (the key address has no `/api`); the published `dsh-ihateposting@0.1.1` still defaults to `https://app.ihateposting.com/api` and stops reaching the server when the `/api` key addresses stop. After the routing is live, from the repository root:

   ```bash
   node --test "plugins/dsh-ihateposting/test/*.test.mjs"
   cd plugins/dsh-ihateposting
   npm publish --access public
   ```

   npm asks for a one-time code: type it yourself. The account must be the one that maintains `dsh-ihateposting` (it published 0.1.1); 1.0.0 is above 0.1.1, so it becomes `latest`.

8. **Nothing for `ihateposting-agent`.** The owner chose to leave it alone: no `npm deprecate`, no `npm unpublish`. It stays at 0.1.1, and the old and the new program can be installed together (tried on 2026-11-19: different command names, no clash).

If something is wrong after step 4: a published version cannot be changed or published again, so publish the fix as 1.0.1 and mark the bad one with `npm deprecate ihateposting@1.0.0 "use 1.0.1"`. To put the old command line back as `latest` meanwhile, `npm dist-tag add ihateposting@0.6.0 latest` moves the tag (npm's `dist-tag` page: "add: Tags the specified version of the package with the specified tag").

## Publishing 1.1.0: `posts:attachments` and the four tools the server gained (2026-11-24)

**Status (2026-11-24, after the owner's steps; checked by plain reads of npm and ClawHub, never run by whoever wrote this).** Everything below is live.

- **Before publishing.** Shakti deployed the app with the new route and tools. A request without a key answers 401 `{"msg":"No API Key found"}` at `https://app.ihateposting.com/api/public/v1/posts/x/attachments` and at `.../api/public/v1/integrations/connect`, where a route that does not exist answers 404 `Cannot GET`. The public API sits under `/api` (the program's default address is `https://app.ihateposting.com/api`); the same request without `/api` is answered 404 by the website, for every route, and says nothing about the deploy.
- **One version everywhere.** `test/package.test.mjs` keeps the package, the CHANGELOG's newest entry and every plugin manifest (Claude, Cursor, Grok, Gemini, the DeepSeek package) at one number, so all of them moved from 1.0.0 to 1.1.0 in `a61698a`. The ChatGPT pack keeps its own version (1.0.0) and has not been submitted.
- **`ihateposting@1.1.0`**: published the staged way (`npm publish --access public --tag next`, then `npm dist-tag add ihateposting@1.1.0 latest`). `npm view ihateposting version dist-tags` then printed `1.1.0` with `latest` and `next` both at 1.1.0 (16 files, 61.4 kB packed), and the tarball downloaded from npm holds `posts:attachments` in `src/index.mjs`, `src/commands/posts.mjs` and the README.
- **`dsh-ihateposting@1.1.0`**: published with `npm publish --access public` from `plugins/dsh-ihateposting` (44 tests passed; the dry run listed the six files). The command printed `+ dsh-ihateposting@1.1.0`, but npm answered 404 for that version, even without its cache, for several minutes afterwards, as its notice said it might; it was `latest` at 1.1.0 later the same day.
- **ClawHub skill 1.0.3** (moderation CLEAN, updated 2026-11-24 17:51 UTC): made in a new folder kept outside the repositories next to the old ones, from `skills/ihateposting/SKILL.md` with the same one changed `metadata` line as 1.0.1 and 1.0.2 (the key is declared as well as the address). Compared with the repository's file only that line differs; compared with 1.0.2, only the `posts:attachments` lines are new.
- **ClawHub bundle 0.1.5** (`ihateposting-agent`, scan clean, updated 2026-11-24 17:52 UTC): made in a new folder from the 0.1.4 folder and the Claude plugin. **The owner chose the Claude plugin's current skill text** (no key variable and no shell arrays, as in the Claude directory's copy) over keeping 0.1.4's text, with the key line still in the front matter as in every earlier bundle version; the README is the 0.1.4 file, and the manifest and `package.json` differ from 0.1.4's only in the version. Whether ClawHub or OpenClaw treats a key that is declared but never named in the text as a problem is unverified (the scan said clean).
- **Nothing for the MCP Registry**: `server.json` names addresses, not tools.
- **Still open, the owner's**: pressing "Check for new commits" on the Claude plugin portal (what the reviewer does with a new version is unknown), and the ChatGPT pack, which needs a new submission only when the owner decides on one.
- **Unverified**: the new command and the link tool against a real platform (every test used fakes), and how any directory's reviewer treats the added tools.

## Publishing with a Different Package Name

If you want to publish as a different npm package name (e.g., "your-other-name"), for example because "ihateposting" were taken:

### 1. Change Package Name

Edit `package.json`:

```json
{
  "name": "your-other-name",  // ← Changed package name
  "version": "1.0.0",
  "bin": {
    "ihateposting": "bin/ihateposting.mjs"  // ← Keep command name!
  }
}
```

**Important:** The `bin` field determines the command name, NOT the package name!

### 2. Publish

```bash
npm publish --access public
```

There is nothing to build first.

### 3. Users Install

```bash
npm install -g your-other-name
# or
pnpm install -g your-other-name
```

### 4. Users Use

Even though the package is called "your-other-name", the command is still:

```bash
ihateposting --help  # ← Command name from "bin" field
ihateposting posts:create -c "Hello!" -s "2030-01-01T09:00:00Z" -t draft -i "x-123"
```

Changing the name touches more than `package.json`:

- the install lines in `README.md`, `SKILL.md` (and its copies), `QUICK_START.md`, `HOW_TO_RUN.md` and the other guides;
- `test/package.test.mjs`, which asserts that the name is `ihateposting`;
- the plugin manifests and the marketplaces: the plugin is called `ihateposting` and the Claude marketplace `ihateposting`, so the install line is `ihateposting@ihateposting`; a different npm package name does not have to change them, but the guides and tests that print the package name do.

## Package Name vs Command Name

| Field | Purpose | Example |
|-------|---------|---------|
| `"name"` | npm package name (what you install) | `"ihateposting"` |
| `"bin"` | Command name (what you type) | `"ihateposting"` |

**Examples:**

1. **Same name** (what the package does now):
   ```json
   "name": "ihateposting",
   "bin": { "ihateposting": "bin/ihateposting.mjs" }
   ```
   Install: `npm i -g ihateposting`
   Use: `ihateposting`

2. **Different names** (an example; the package is not published under another name):
   ```json
   "name": "your-other-name",
   "bin": { "ihateposting": "bin/ihateposting.mjs" }
   ```
   Install: `npm i -g your-other-name`
   Use: `ihateposting`

3. **Multiple commands** (an example; the package has one command):
   ```json
   "name": "your-other-name",
   "bin": {
     "ihateposting": "bin/ihateposting.mjs",
     "your-short-name": "bin/ihateposting.mjs"
   }
   ```
   Install: `npm i -g your-other-name`
   Use: `ihateposting` or `your-short-name`

## Publishing Checklist

Work down this list. Every item is something you can see for yourself.

### Before First Publish

- [ ] Check the name and the version number against what is on npm
  ```bash
  npm view ihateposting versions dist-tags
  # eight versions, 0.1.0 to 0.6.0, latest 0.6.0: the version in package.json must not be among them
  ```
  `ihateposting` is the owner's own package, so the name is not free: its versions 0.1.0 to 0.6.0 are the live app's old command line (read on 2026-11-19: eight versions, `latest` 0.6.0, one maintainer), and this program is its next version, 1.0.0 (see "The package name" at the end of this page). A version that has been published can never be published again, so **run the command again right before you publish**. Your npm account must be the package's maintainer and be set up for publishing (npm's own pages say what its two-factor and token rules are today; they have been changing, so read them rather than this page).

- [ ] Update version if needed
  ```json
  "version": "1.0.0"
  ```
  The version is the same in nine places. `test/package.test.mjs` fails if any differ:

  | File | Field |
  | --- | --- |
  | `package.json` | `version` |
  | `plugins/claude-ihateposting/.claude-plugin/plugin.json` | `version` |
  | `.claude-plugin/marketplace.json` | `metadata.version` |
  | `.cursor-plugin/plugin.json` | `version` |
  | `.cursor-plugin/marketplace.json` | `plugins[0].version` |
  | `.grok-plugin/plugin.json` | `version` |
  | `.grok-plugin/marketplace.json` | `plugins[0].version` |
  | `gemini-extension.json` | `version` |
  | `plugins/dsh-ihateposting/package.json` | `version` |

  The program itself prints the version from `package.json`.

- [ ] Review files to include
  ```json
  "files": [
    "bin",
    "src",
    "SKILL.md",
    "skills",
    "README.md",
    "CHANGELOG.md",
    "LICENSE"
  ]
  ```
  `npm pack --dry-run` lists what would be published, and no key, `.env` or test file should be in it (see "What the package contains" at the end of this page).

- [ ] Run the tests (there is nothing to build)
  ```bash
  npm test
  ```
  Do not skip the planted-faults file; it is the one that proves the other tests would notice a mistake.

- [ ] Test locally
  ```bash
  npm link
  ihateposting --help
  ```

- [ ] The code is on GitHub. `package.json` points at `https://github.com/iHatePostingOrg/iHatePosting-Agent`. The repository must exist there, with this code pushed to `main`, before you publish.
- [ ] `CHANGELOG.md` has an entry for the version, as its newest numbered heading, for example `## [1.0.0] - 2026-11-19`. Changes made since the last release sit under `## [Unreleased]`; when you pick the next number, move them under the new version's heading.
- [ ] The three copies of the skill are the same text, apart from four changes in the Claude plugin's copy: `SKILL.md`, `skills/ihateposting/SKILL.md` and `plugins/claude-ihateposting/skills/ihateposting/SKILL.md`. The Claude plugin's copy writes the front matter's `metadata` as plain indented lines instead of one line of JSON, and leaves out the line that links the npm page, because the Claude directory's check reads the one-line JSON differently from Claude Code and holds a skill that names a remote host beside the key variable (owner, 2026-11-16; the first validation of the plugin, main @ a648b2f). The third change is that it does not name the key variable at all (owner, "fix it", 2026-11-21): the check held the version for a reviewer ("Uses a credential from the user's machine") with the fake value `YOUR_API_KEY` already in place (validation of main @ 8f2f666); the program's own "Not authenticated" message says how to give it a key. Leaving the variable out did not clear the hold either (validation of main @ 2927cd2). The fourth change did: the batch-scheduling example script looped over shell arrays (`for i in "${!DATES[@]}"`, `${CONTENT[$i]}`), which the scan read as environment variables sent on a command, and the same example written with a `while read` loop and no `${...}` passes. Found on 2026-11-21 by validating test variants of the plugin from temporary branches (deleted since): a tiny skill passed, the skill cut in eight parts held only in the fourth, that part held only in this script, and the whole skill with only this script rewritten passed with no hold. Whether the key variable has to stay out was not tested. The portal limits validations ("Too many validations": about one run every 30 seconds, and a stricter limit after roughly 25 runs in 40 minutes), so validate with care. The tests fail otherwise. After a change to `SKILL.md`, copy it over `skills/ihateposting/SKILL.md` by hand (`sync-skill.yml` copies it only when it is started by hand; see "The two workflows") and make the same change in the Claude plugin's copy, keeping its four changes (`claudeCopyOf` in `test/helpers.mjs` lists them).
- [ ] Nothing secret is in the tree. `test/package.test.mjs` and `test/docs.test.mjs` look for key-like text, token-like text, private paths and email addresses. A last look at `git status` and `git diff` is still worth a minute.
- [ ] The sign-in server is live (see "The sign-in's server is the iHatePosting app" at the end of this page).
- [ ] The GitHub "About" box is filled in (see "The repository's About box" at the end of this page).

### Publish to npm

```bash
# Login to npm (first time only)
npm login

# Check who you are
npm whoami

# From the repository root
npm test
npm publish --access public
```

Publishing by hand, step by step:

1. Check you are who you think you are, and that you are logged in with `npm whoami`. If it answers with an error, run `npm login` and follow what npm asks for (the sign-in lasts about two hours, and npm asks for a one-time code from your authenticator: type it yourself, nowhere else). Never paste a password, a code or a token into a file in this repository. On a Windows computer where PowerShell blocks scripts, run `npm.cmd` in place of `npm`.
2. Run the tests and the dry run from the repository root (`npm install`, `npm test`, `npm pack --dry-run`). `package.json` has no `prepublishOnly` script, so `npm publish` does not run the tests for you; you do.
3. Publish with `npm publish --access public`. For an unscoped package `--access public` changes nothing, and it does no harm.
4. Check the result (next section).
5. Tag the commit and publish a release on GitHub if you want one. Neither workflow starts when a release is published (both run only when started by hand), so a release publishes nothing to npm.

### After Publishing

Verify it's published:
```bash
npm view ihateposting
# Should show your package info

npm view ihateposting version          # the number you just published
```

Test installation:
```bash
npm install -g ihateposting
ihateposting --version                 # the same number
ihateposting --help                    # the commands; no sign-in needed
```

Then try it where nothing of yours is in the way: a new folder, a new terminal, and no clone on the `PATH`.

```bash
mkdir try-it && cd try-it
npx ihateposting --version
```

`--help` and `--version` need no sign-in and make no request. The first command that needs the server (`auth:status`, `integrations:list`) is the real proof that the address and the sign-in work.

## Using from Monorepo Root

There is no monorepo, so there is no root script to publish from. The one `package.json` has two scripts:

```json
{
  "scripts": {
    "test": "node --test --test-concurrency=1 \"test/*.test.mjs\" \"plugins/dsh-ihateposting/test/*.test.mjs\"",
    "chatgpt-plugin:zip": "node scripts/chatgpt-plugin-zip.mjs"
  }
}
```

`chatgpt-plugin:zip` builds the ZIP for a submission and uploads nothing. So you publish from the repository root:

```bash
# From the repository root
npm publish --access public
```

## Version Updates

### Patch Release (1.0.0 → 1.0.1)

```bash
npm version patch --no-git-tag-version
# change the other eight files to the same number, then:
npm publish --access public
```

### Minor Release (1.0.0 → 1.1.0)

```bash
npm version minor --no-git-tag-version
# change the other eight files to the same number, then:
npm publish --access public
```

### Major Release (1.0.0 → 2.0.0)

```bash
npm version major --no-git-tag-version
# change the other eight files to the same number, then:
npm publish --access public
```

Pick the number by what changed: a fix is a patch (1.0.0 to 1.0.1), a new command or option that leaves the old ones working is a minor (1.0.0 to 1.1.0), and a change that breaks a script someone already wrote is a major (1.0.0 to 2.0.0). The first number in `ihateposting`, 1.0.0, was chosen by the owner because the package's earlier versions (0.1.0 to 0.6.0) are another program, the live app's own command line; from 1.0.0 on the rule above is the whole rule.

`npm version` bumps `package.json` only, and by default it also makes a git commit and a tag, which is not what this repository wants because eight other files carry the number. That is why the commands above use `--no-git-tag-version`. Then, in this order:

1. Change the other eight places in the table above to the same number.
2. Add a `## [<version>] - <date>` heading at the top of `CHANGELOG.md`, under `## [Unreleased]`, and describe the change under it.
3. Run `node --test --test-force-exit test/package.test.mjs`. It fails with the name of the file whose version differs.
4. Run the whole suite (`npm test`), commit, and publish by hand.

A version can be published only once. If you publish by mistake, npm will not let you replace it ("You cannot publish over the previously published versions"); make the next version instead. `npm deprecate ihateposting@1.0.0 "use 1.0.1"` marks a bad version without removing it. npm limits unpublishing; read its current policy before you count on it.

## Scoped Packages

If you want to publish under an organization scope:

```json
{
  "name": "@yourorg/ihateposting",
  "bin": {
    "ihateposting": "bin/ihateposting.mjs"
  }
}
```

Install:
```bash
npm install -g @yourorg/ihateposting
```

Use:
```bash
ihateposting --help
```

A scoped package is private by default; `npm publish --access public` makes it public.

## Testing Before Publishing

### Test the Build

There is no build to test: the code runs as it is written. Run the program, and the tests:

```bash
node bin/ihateposting.mjs --help
npm test
node --test --test-force-exit test/package.test.mjs
```

### Test Linking

```bash
npm link
ihateposting --help
npm unlink -g ihateposting
```

### Test Publishing (Dry Run)

```bash
npm pack --dry-run
# Shows what the package would hold

npm publish --dry-run
# Shows what would be published
```

`npm publish --dry-run` does everything a publish does except upload, and prints what it would have done. npm documents it; it was not run while this page was written.

### Test with `npm pack`

```bash
npm pack --pack-destination ..                # next to the clone, not inside it
# Creates a .tgz file there

# Test installing the tarball in a folder of its own
mkdir ../try-package && cd ../try-package
npm init -y
npm install ../ihateposting-0.1.0.tgz
npx ihateposting --version
npx ihateposting --help
```

This installs the two dependencies from the registry, then runs the packed code exactly as a user's computer would. It does not install the command globally, so it cannot replace a copy you already use, and the `.tgz` stays out of the clone (`.gitignore` does not ignore `.tgz` files). Do not run `auth:login` there unless the app's sign-in routes are live.

## Continuous Publishing

Publishing to npm is not automated: the owner publishes by hand, from their own computer, with two-factor authentication (the owner's decision of 2026-11-15). `.github/workflows/publish-npm.yml` and `.github/workflows/sync-skill.yml` are in the repository, and both run only when they are started by hand (the Actions tab, choose the workflow, "Run workflow"); neither runs on a push, a pull request or a published release.

- `publish-npm.yml` needs the `NPM_TOKEN` repository secret: an npm token with publish rights on `ihateposting`.
- Neither workflow has ever run.

To release:

1. Bump the version in the nine files listed under "Before First Publish", and add a `CHANGELOG.md` entry.
2. Merge to `main`.
3. Publish by hand from a clone of `main`: `npm publish --access public` (see "Publish to npm"). A GitHub release is optional and publishes nothing: `gh release create v<version> --target main --title v<version> --notes-file <file>` (or `--generate-notes`).

If the publish fails (for example, a wrong one-time code), run it again; a version that did get published can never be published again, so the next try needs a new number.

## Common Issues

### "You do not have permission to publish"

- Make sure you're logged in: `npm login` (`npm whoami` shows who you are)
- Check package name isn't taken: `npm view ihateposting`
- If scoped, ensure org access: `npm org ls yourorg`

### "Package name too similar to existing package"

- Choose a more unique name
- Or use a scoped package: `@yourorg/ihateposting`

### "Missing required files"

- Check `"files"` field in package.json
- Run `npm pack --dry-run` to see what would be included (a path in `files` that does not exist is silently left out)
- Compare the list with the one under "What the package contains" at the end of this page

### Command not found after install

- Check `"bin"` field is correct
- Ensure `bin/ihateposting.mjs` has shebang: `#!/usr/bin/env node`
- Try reinstalling: `npm uninstall -g ihateposting && npm install -g ihateposting`
- npm's global folder may not be on your `PATH`: `npm prefix -g` shows it

## Recommended Names

If "ihateposting" is taken, consider:

- `@yourorg/ihateposting`
- `ihateposting-cli`
- `agent-ihateposting`

None of these was looked up on npm (unverified): run `npm view <name>` first.

Remember: The package name is just for installation. The command can still be `ihateposting`!

## Summary

✅ The package name and the command are both `ihateposting`
✅ `bin` field defines the command name
✅ `name` field defines the npm package name
✅ They can be different!

**To publish now** (after the version has been raised, see "Version Updates"):

```bash
npm install
npm test
npm publish --access public
```

**Users install:**

```bash
npm install -g ihateposting
# or
pnpm install -g ihateposting
```

**Users use:**

```bash
ihateposting --help
ihateposting posts:create -c "Hello!" -s "2030-01-01T09:00:00Z" -t draft -i "x-123"
```

🚀 **Publishing is by hand, with two-factor authentication, and every release is a new version number.**

| Question | Answer |
| --- | --- |
| Package name and command | `ihateposting`, both |
| What is published | `bin`, `src`, `SKILL.md`, `skills`, `README.md`, `CHANGELOG.md`, `LICENSE`, `package.json` |
| Files that carry the version | Nine; `test/package.test.mjs` checks them |
| Tests that must pass first | `npm test`, planted-faults file included |
| By hand | `npm publish --access public` |
| By workflow | Not used: `publish-npm.yml` runs only when started by hand, and needs the `NPM_TOKEN` secret |
| What the owner sets on github.com | The repository, the `NPM_TOKEN` secret (only if the workflow is ever used) and the About box |
| What must be live for `auth:login` | The app's `/device/code` and `/device/token` routes and its `/device` and `/oauth/authorize` pages |
| Not checked while writing this page | That the workflows work, and any `npm` command that publishes (the name was read once with `npm view`, on 2026-11-14, and must be read again before publishing) |

## Sections that were in this file before it followed the reference

### What the package contains

`package.json` decides it with a `files` list: `bin`, `src`, `SKILL.md`, `skills`, `README.md`, `CHANGELOG.md` and `LICENSE`. npm adds `package.json` itself. `npm pack --dry-run` prints the result without writing a file or publishing anything; the published 0.1.0 was 16 files, 49.7 kB packed and 170.9 kB unpacked (npm's own output when it was published), and the dry run for 0.1.1 lists the same 16 files, 58.2 kB packed and 210.6 kB unpacked (the skill grew from 42.6 kB to 60.5 kB and is in the package twice). The dry run for `ihateposting` 1.0.0 (2026-11-19) lists the same 16 files, 59.2 kB packed and 212.1 kB unpacked (the new name is shorter, the changelog longer):

```text
CHANGELOG.md
LICENSE
README.md
SKILL.md
bin/ihateposting.mjs
package.json
skills/ihateposting/SKILL.md
src/api.mjs
src/commands/analytics.mjs
src/commands/auth.mjs
src/commands/integrations.mjs
src/commands/posts.mjs
src/commands/upload.mjs
src/config.mjs
src/constants.mjs
src/index.mjs
```

The numbers move a little whenever a document changes; the list should not. Left out on purpose:

- `test/`, `examples/`, the guides (`HOW_TO_RUN.md`, `PROJECT_STRUCTURE.md` and the rest) and `PUBLISHING.md`: they live in the repository.
- The plugin manifests (`.claude-plugin`, `.cursor-plugin`, `.grok-plugin`, `gemini-extension.json`, `mcp.json`), `assets/` and `plugins/`: agent tools read them from the GitHub repository, not from the npm package.
- `node_modules`, `package-lock.json`, `.env` files and `credentials.json`.

`test/package.test.mjs` checks this list every time the tests run: the needed files must be in the pack, and a file under `test`, `examples`, `plugins` or `assets`, or one that looks like a key or an environment file, fails the test. If you add a folder the program needs at run time, add it to `files` and to that test.

### The package name

The package and the command are both `ihateposting` (the owner's decision of 2026-11-19; from 2026-11-14 until then both were `ihateposting-agent`). `ihateposting` is an older package of the owner's: its versions 0.1.0 to 0.6.0 are the live app's own command line, and this program is its next version, 1.0.0 (the owner's answer "Replace it"), and **this package replaces it as the newest version**: once 1.0.0 is published as `latest`, `npm install -g ihateposting` and `npm update -g ihateposting` give this program. npm keeps every published version as it is, so the old ones stay installable by their number (`npm install -g ihateposting@0.6.0`; the registry's policy page says registry data is immutable, https://docs.npmjs.com/policies/unpublish, read 2026-11-19). `ihateposting-agent` (`0.0.0-stage`, 0.1.0 and 0.1.1) was left alone on npm: not deprecated, not unpublished, and no new version of it is made (the owner's answer "Leave it alone"). Unpublishing it was not possible anyway: after 72 hours npm's policy allows it only when no other package depends on it, it had fewer than 300 downloads over the last week and it has a single owner, and `ihateposting-agent` had 452 downloads in the week 2026-11-11 to 2026-11-17 (npm's own count, which includes mirrors and scanners). Two fields in `package.json` carry the name, and they are separate things:

| Field | What it decides | Value now |
| --- | --- | --- |
| `name` | What people type after `npm install` | `ihateposting` |
| `bin` | What people type to run the program | `ihateposting` (pointing at `bin/ihateposting.mjs`) |

#### Check the name before you publish

```bash
npm view ihateposting versions dist-tags
```

On 2026-11-19 the registry listed eight versions, 0.1.0 to 0.6.0, `latest` 0.6.0 and one maintainer, the owner's account. The number in `package.json` (1.0.0) is not among them. Run the command again right before you publish: a published `name@version` can never be used again, even after an unpublish.

#### What replacing the old command line means

Read from the old package's published files (0.6.0, packed and unpacked; installed only into a throwaway folder to ask it for its version, never signed in or used) and from this program's code. It replaces a different program, not an older build of this one:

- **Different commands.** The old one has `login <key>`, `logout`, `whoami`, `accounts`, `platforms`, `boards`, `posts`, `upload`, `post "text" --to ...` and `skill`; this one has the reference's commands (`auth:login`, `posts:create`, `integrations:list` and so on). A word that is not a command is accepted and does nothing, with exit code 0, as in the reference (the owner chose to keep it that way on 2026-11-19), so an old script that runs `ihateposting post ...` ends without an error and without a post.
- **Different servers.** The old one talks to `https://ihateposting.com` unless told otherwise; this one talks to `https://app.ihateposting.com/api`. A key, or a value of `IHATEPOSTING_API_URL`, meant for one is therefore the wrong value for the other (not tried with a real old key).
- **The same folder, different files.** The old one keeps its key and address in `~/.ihateposting/config.json` (the folder is created with mode 0700 and the file with 0600; its `logout` removes only that file). This one keeps `~/.ihateposting/credentials.json`. Neither reads or removes the other's file.
- **The same variables, in another order.** Both read `IHATEPOSTING_API_KEY` and `IHATEPOSTING_API_URL` (this one also reads `IHATEPOSTING_AUTH_SERVER`). The old one lets the variable win over its stored key; this one lets the stored sign-in win over the variable.
- **Different Node and dependencies.** The old one asks for Node 18 or newer and has no dependencies; this one asks for 20 or newer and installs `yargs` and `node-fetch`. The old `ihateposting/commands` and `ihateposting/skill` imports are gone.
- **The live app still says the old thing.** Its own command-line card says `npm install -g ihateposting` and `ihateposting login <key>` (`apps/web/src/components/app/cli-setup.tsx` in a read-only copy of the old app's repository, read on 2026-11-19), and its MCP server's upload hint says `ihateposting upload` (`packages/mcp/src/tools.ts`, same copy; whether the published `ihateposting-mcp` 0.12.9 has the same text was not checked). Once 1.0.0 is `latest`, those instructions install this program. That is a difference from the live app, accepted by the owner when he chose "Replace it"; when the live app's own texts change is the live app's side.
- **The old program stays reachable.** Anyone who needs it installs `ihateposting@0.6.0` (or an older number).

#### The live app's MCP package is not touched

`ihateposting-mcp` is a second package of the live app (latest 0.12.9, read from the registry on 2026-11-19; "MCP server for iHatePosting"; its `bin` is `ihateposting-mcp`). **This repository has no such package and does not publish one**: its MCP server is the hosted one at `https://app.ihateposting.com/mcp/oauth`, so there is nothing here to install or run locally.

#### Two names on one computer

`ihateposting` (this program) and `ihateposting-agent` (the same program as 0.1.1, still on npm) can be installed together: their commands have different names, so npm links two different files. A package that offered a command that another global package already owns would stop npm with EEXIST (tried on 2026-11-19 with two stand-in packages in a throwaway prefix, npm 11.19.1 on Windows: the second `npm install -g` stopped with "EEXIST: file already exists" and the first package's command kept running). That is why the package has one command, `ihateposting`, and not also `ihateposting-agent` (the owner's answer, 2026-11-19: "`ihateposting` only").

#### If the name were taken

The command can stay the same while the package gets another name, because `bin` is independent of `name`. For example:

```json
{
  "name": "your-other-name",
  "bin": { "ihateposting": "bin/ihateposting.mjs" }
}
```

People would then run `npm install -g your-other-name` and still type `ihateposting`. The other route is a scoped name, which belongs to your npm user or organization:

```json
{
  "name": "@your-scope/ihateposting",
  "bin": { "ihateposting": "bin/ihateposting.mjs" }
}
```

```bash
npm install -g @your-scope/ihateposting
```

A scoped package is private by default; `npm publish --access public` (which the workflow already passes) makes it public. Changing the name touches more than `package.json`:

- the install lines in `README.md`, `SKILL.md` (and its two copies), `QUICK_START.md`, `HOW_TO_RUN.md` and the other guides;
- `test/package.test.mjs`, which asserts that the name is `ihateposting`;
- the plugin manifests: their `name` is the plugin's own (`ihateposting`), not the npm package's, so it stays; only the marketplaces' `name` (`ihateposting`) is the install line's second half.

### The sign-in's server is the iHatePosting app

`ihateposting auth:login` does not talk to a service of its own. It talks to the app, with the default address `https://app.ihateposting.com/api`:

- `POST /device/code` (so `https://app.ihateposting.com/api/device/code`) and `POST /device/token` give out and exchange the code;
- the pages `/device` (where a person types the code) and `/oauth/authorize` (where they approve) are what a person sees in the browser.

Those routes and pages must be live on `app.ihateposting.com` before `auth:login` works there. Publishing the package does not deploy them. On 2026-11-15 they were not (404), and at 08:17 UTC the same day they were: `/api/device/code` answered 200, `/device` and `/oauth/authorize` 200, `/api/device/token` 400 to an empty request (a real sign-in was not tried). Where they are not live, `auth:login` ends with `❌ Failed to start authorization (404): ...` or `❌ Could not reach auth server at ...`, and the workaround is a workspace key in `IHATEPOSTING_API_KEY`.

### The repository's About box

The box at the top right of the repository's page on github.com (the description, the website and the topics) is not part of the code and no file in this repository can set it. The owner set it on github.com on 2026-11-15 (the gear beside "About"), and GitHub's API answered with the values below when they were read back. If the box is ever emptied or changed, these are the values to put back.

| Field | Value set on github.com |
| --- | --- |
| Description | "iHatePosting for AI agents a CLI, skill, and plugins that connect Claude, Cursor, Gemini, Grok and more to your social accounts on autopilot. Draft, schedule, and publish posts, upload media, and read analytics across 15 platforms, straight from your agent or the command line." (277 characters; GitHub's limit of 350 is unverified) |
| Website | `https://ihateposting.com` |
| Topics (20) | `agent-skills`, `ai-agents-automation`, `ai-post-generator`, `automation`, `claude`, `cursor`, `deepseek-harness`, `facebook`, `gemini`, `grok`, `instagram`, `linkedin`, `mcp`, `plugins`, `scheduling`, `social-media-automation`, `social-media-scheduler`, `tiktok-auto-post-scheduler`, `twitter-x`, `youtube` (GitHub lists them alphabetically; its cap of 20 topics is unverified) |

The package's own keywords in `package.json` list every platform by name; the topics above are the owner's own choice and differ from them.

### The two workflows (in the repository, run only by hand)

The owner decided on 2026-11-15 that releases are published by hand with 2FA, and that the two workflow files stay but **run only when started by hand** (`workflow_dispatch`): neither starts when a release is published, and neither runs on a push or a pull request. They have never run. To start one: the Actions tab, choose the workflow, "Run workflow".

| Workflow | What it does when started |
| --- | --- |
| `publish-npm.yml` ("Publish to npm by hand") | Asks for the version to publish. Checks out the code, sets up Node 20 with the npm registry, checks that the version asked for is the version in `package.json`, runs `npm install && npm test`, then runs `npm publish --access public` with `NODE_AUTH_TOKEN` taken from the `NPM_TOKEN` secret. |
| `sync-skill.yml` ("Sync the plugin skill by hand") | Checks out `main`, copies `SKILL.md` over `skills/ihateposting/SKILL.md`, and if that changed anything commits and pushes it to `main`. |

What follows from that:

- **A manual run of `publish-npm.yml` makes no sense for the way releases are made now.** It publishes with the `NPM_TOKEN` secret, so no one-time code from the owner's authenticator app is asked for at that moment, which is the opposite of "by hand with 2FA" (whether this token would skip the code depends on the kind of token: npm's "Bypass 2FA" option on a granular token; unverified here). It needs the secret, which this page cannot see, and a version that is not on npm yet: `0.1.0` is, so a run for it fails at the publish step. It is kept (the owner said not to remove it) for the day the owner chooses to publish from GitHub; until then it is not run.
- `sync-skill.yml` is the owner's button and **commits and pushes to `main` on its own**, with the workflow's own permission (`contents: write`). It writes only `skills/ihateposting/SKILL.md`; the Claude plugin's copy, `plugins/claude-ihateposting/skills/ihateposting/SKILL.md`, is copied by hand. If `main` is protected against pushes from Actions the job fails at the push; the fix is a repository setting, or copying the file yourself.
- `publish-npm.yml` is written for the `NPM_TOKEN` secret and Node 20. npm's new rules for tokens and trusted publishing are under "npm: tokens, two-factor and trusted publishing" below; with a hand publish they do not apply.
- Whether the repository has an `NPM_TOKEN` secret is not known to this page (a repository's secrets cannot be read from outside); with none, a run would fail at the publish step in any case.
- A GitHub release no longer starts anything. A release of the package is made by publishing by hand as described above; a GitHub release or tag is only a record the owner may add afterwards.

#### Only if `publish-npm.yml` is ever used: one-time setup

1. Create an npm access token that can publish this package (npm's token page shows the kinds on offer; use the narrowest one that works). For a package that does not exist yet, a token limited to one package may not be possible: unverified, check npm's page.
2. In the GitHub repository open Settings, then Secrets and variables, then Actions, and add a repository secret named `NPM_TOKEN` with that token as its value. The token belongs in that secret only, never in a file or a commit.

#### Only if `publish-npm.yml` is ever used: starting it

1. Finish the checklist above. Raise the version in `package.json` above the one on npm, and commit it to `main`.
2. Open the Actions tab, choose "Publish to npm by hand", "Run workflow", type that version and start it.
3. Watch the run. The steps run in this order, and a failure stops the rest: the version check, `npm install && npm test`, the publish. If it fails before the publish step (a wrong version, a failing test), nothing was published.

#### Starting `sync-skill.yml`

After a change to `SKILL.md` on `main`, open the Actions tab, choose "Sync the plugin skill by hand" and run it. If the copy is already equal it changes nothing and says so.

### Submissions: getting listed in each place

The sections above put `ihateposting` on npm. This section is about the other places a person can find the tool: directories, marketplaces and registries. **Nothing in this repository submits anything, signs in anywhere or changes a setting**: every step below is yours, on the place's own website, signed in as you. What is written here was read from the official pages named in each place on 2026-11-15. Rules in this area change often, so read the page again before you submit. "Unverified" means it could not be confirmed; "second-hand" means a helper read the page and it was not read again. The copy-paste packs for the four submissions the owner asked to have ready (Cursor Marketplace, the Claude plugin portal, DeepSeek Harness and the xAI marketplace), with the order to go in, are in `SUBMISSIONS.md`.

#### What must be live first

Checked on 2026-11-15 with plain requests (no key, no sign-in), twice, because the answers changed. **Earlier that day** the paths `/api/mcp`, `/api/mcp/oauth`, `/device`, `/.well-known/openai-apps-challenge`, `/privacy` and `/terms` on `app.ihateposting.com` all answered 404: the new app was not deployed. **At 08:17 UTC** it was:

| Path on `app.ihateposting.com` | Answer at 08:17 UTC |
| --- | --- |
| `/api/mcp` and `/api/mcp/oauth` | 401 (the `/oauth` one adds a `WWW-Authenticate` header that names its metadata) |
| `/.well-known/oauth-protected-resource/api/mcp/oauth` and `/.well-known/oauth-authorization-server/api/mcp/oauth` | 200: the sign-in's discovery documents (a registration endpoint, `S256`, the scopes `mcp:read` and `mcp:write`, no userinfo endpoint) |
| `/api/device/code` (POST), `/api/device/token` (POST, empty body), `/device`, `/oauth/authorize` | 200, 400, 200, 200 |
| `/api/public/v1/integrations` | 401 |
| `/privacy` and `/terms` | **404** (they answer 200 on `ihateposting.com`; **not a blocker**: every submission uses `https://ihateposting.com/privacy` and `https://ihateposting.com/terms`, the owner's decision of 2026-11-15) |
| `/.well-known/openai-apps-challenge` | **404** (OpenAI's portal gives the token to serve there; see the ChatGPT steps) |

What was **not** tried: a real sign-in, a real MCP session (that needs a key or a token), and any reviewer's scan. Check again before any submission:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://app.ihateposting.com/api/mcp/oauth
curl -s -o /dev/null -w "%{http_code}\n" https://app.ihateposting.com/mcp/oauth
```

401 means the route exists and wants a sign-in; 404 means it is not there. This section and its table are the probes of 2026-11-15 on the app host's earlier path `/api/mcp/oauth`, kept as they were (that path still answered 401 on 2026-11-19 at 17:23). Since 2026-11-19 the connector's sign-in address in our files is `https://app.ihateposting.com/mcp/oauth` (no `/api`), which answered **404** on that day until Shakti routes it to the new backend; the two listings already submitted keep `https://ihateposting.com/mcp/oauth` in their own portals. Check the new address before any submission; 401 then means the route exists and wants a sign-in.

**Update of 2026-11-20.** Shakti's routing went live at about 15:25 IST. Plain GETs at 15:29 and 15:48 IST: `https://app.ihateposting.com/mcp/oauth` and `https://app.ihateposting.com/mcp` answer 401; the sign-in's two discovery documents, at `/.well-known/oauth-protected-resource/mcp/oauth` and `/.well-known/oauth-authorization-server/mcp/oauth`, answer 200 and name the new address; the earlier `/api/mcp/oauth` still answers as it did; and the old key addresses `/api/mcp/<key>`, `/api/sse/<key>` and `/api/message/<key>` now answer 404 from nginx. The sentence above that says the new address answered 404 describes 2026-11-19. A real sign-in through the new address with Claude was not tried (unverified).

| Place | What is still missing |
| --- | --- |
| Claude connector (hosted MCP) | Nothing that plain requests could show. Whether the portal's connection step and tool scan pass is untested |
| ChatGPT and Codex plugin | The token at `/.well-known/openai-apps-challenge` (it comes from OpenAI's portal, so only after the upload), a demo video and a test account. OpenAI's page on submitting a plugin says that an OAuth sign-in must expose a UserInfo endpoint that returns the `email` claim with `email_verified: true` and advertise the `openid` and `email` scopes (https://developers.openai.com/plugins/guides/submit-claude-plugin.md, read 2026-11-15); the discovery document above names no userinfo endpoint and only the scopes `mcp:read` and `mcp:write`: a question for the app's side |
| Official MCP Registry entry for the new address | Nothing technical: both addresses answer. The version number and the choice of addresses are the owner's |
| The plugins and skills that drive the command line | Nothing that plain requests could show: `auth:login` can start now (a real sign-in was not tried) |

#### The places

| Place | Route (official page) | Ready in this repository | Your step |
| --- | --- | --- | --- |
| Claude Code, from this repository | Nothing to submit: `/plugin marketplace add` reads the repository (https://code.claude.com/docs/en/plugins/publish.md) | `.claude-plugin/marketplace.json` and `plugins/claude-ihateposting/` | Run `claude plugin validate` once where the `claude` command is installed. It was not available when this was written, so nothing here has been validated by it (unverified). The layout follows Anthropic's marketplace reference: the entry has the relative source `./plugins/claude-ihateposting` and declares no components, and the plugin has its own manifest. The first layout (an entry with `strict: false` and a list of skills, next to a `plugin.json` at the root) is the combination that page calls a conflict |
| Anthropic's plugin directory | Developer portal https://claude.ai/directory/manage, from a GitHub repository (https://claude.com/docs/plugins/submit.md) | `plugins/claude-ihateposting/` | Connect your GitHub account to claude.ai (it must be able to push to the repository), then submit with the plugin path `plugins/claude-ihateposting`. The checklist at https://claude.com/docs/plugins/pre-submission-checklist.md was read on 2026-11-15; `SUBMISSIONS.md` has the pack |
| Claude connector (hosted MCP) | The same portal, "MCP connector" (https://claude.com/docs/connectors/building/submission.md) | Nothing in this repository: it is the server's | Fields below. The server answers now (see "What must be live first"); a real connection was not tried |
| ChatGPT and Codex plugin | ZIP uploaded at https://platform.openai.com/plugins (https://developers.openai.com/plugins/deploy/submission.md) | `plugins/chatgpt-ihateposting/` and `npm run chatgpt-plugin:zip` | Steps below. The server answers now; OpenAI's sign-in requirement for a verified email is open (see above) |
| Cursor Marketplace | A form at cursor.com/marketplace/publish; every plugin is reviewed by hand (https://cursor.com/docs/plugins) | `.cursor-plugin/` | Submit this repository's address. The review time is not stated |
| cursor.directory | Sign in at cursor.directory/plugins/new and paste the repository address; an automated scan checks it (second-hand) | `.cursor-plugin/mcp.json`, `mcp.json` | Submit. Whether the existing page for the old app can be pointed at this repository is unverified |
| Grok Build (xAI marketplace) | A pull request to `xai-org/plugin-marketplace` (https://raw.githubusercontent.com/xai-org/plugin-marketplace/main/CONTRIBUTING.md) | `.grok-plugin/` | Optional; see below. A pull request on another organisation's repository, so only with your yes |
| Gemini CLI extensions gallery | Nothing to submit: a daily crawler lists a public repository that has the topic `gemini-cli-extension` and a root `gemini-extension.json` (https://geminicli.com/docs/extensions/releasing/) | `gemini-extension.json` | Add the topic (see "Topics" below) |
| Qwen Code | No gallery and no submission; it installs from GitHub (second-hand) | The README section | Nothing |
| DeepSeek Harness | Publish `dsh-ihateposting` to npm, and optionally a pull request to the community list (second-hand) | `plugins/dsh-ihateposting/` | See below |
| OpenClaw (ClawHub) | `clawhub login` then `clawhub skill publish` (https://docs.openclaw.ai/clawhub/publishing.md) | `skills/ihateposting/SKILL.md` | See below |
| Hermes Agent | A "tap" from a GitHub repository, no approval (second-hand) | `skills/ihateposting/` | Nothing to submit |
| skills.sh | Automatic: the list is made from installs run with `npx skills add` (second-hand) | `skills/ihateposting/` | Run the install once from another computer, or leave it to users |
| Official MCP Registry | `mcp-publisher` (https://modelcontextprotocol.io/registry/quickstart) | `server.json` | See below. Both addresses answer now |
| Glama, PulseMCP | Automatic pick-up from GitHub and from the registry (second-hand); PulseMCP's submissions are closed | – | Nothing to submit |

Not prepared, because nothing was asked for them: Muse, Perplexity, Manus, Cue, mcp.so, Smithery and the "awesome" lists on GitHub.

#### Fields to paste (Claude connector, Claude plugin, ChatGPT and Codex)

| Field | Value |
| --- | --- |
| Name | iHatePosting |
| Slug of the new Claude connector (permanent once published) | `ihateposting-agent` |
| One line | Draft, schedule and publish social posts across 15 platforms, upload media and review upcoming posts. |
| Long description | The `interface.longDescription` text in `plugins/chatgpt-ihateposting/plugin.json` (about 1,400 characters; the Claude connector form's limit is 2,000, second-hand) |
| Website | https://ihateposting.com |
| Documentation | https://github.com/iHatePostingOrg/iHatePosting-Agent#readme |
| Privacy policy | https://ihateposting.com/privacy |
| Terms of service | https://ihateposting.com/terms |
| Support page | https://ihateposting.com/contact (and your company's support address) |
| Logo | `assets/logo.png`: a square PNG, 198 by 198 pixels. OpenAI wants a square of 48 to 4096 pixels; Anthropic's icon size is unverified |
| Hosted server | `https://app.ihateposting.com/mcp/oauth` (sign-in with OAuth; the address with a key in a header is `https://app.ihateposting.com/mcp`, which OpenAI's portal cannot use: it has no API-key sign-in) |

The four URLs above (website, support, privacy, terms) all answered 200 on ihateposting.com on 2026-11-15; the same privacy and terms paths on `app.ihateposting.com` answered 404 at 08:17 UTC, which is not a blocker: these `ihateposting.com` addresses are the ones every submission uses (the owner's decision of 2026-11-15).

#### The name of the new listings (the owner's decision of 2026-11-15)

Three names were offered (iHatePosting Agent, iHatePosting for Agents, iHatePosting App) and the owner answered "No preference". He then chose the display name himself ("Display name : iHatePosting", 2026-11-15), so the display name is `iHatePosting`, the same as the live app's listings. The slug of the NEW Claude connector is `ihateposting-agent` (the live app's connector holds `ihateposting`) and the MCP Registry entry keeps its old name `com.ihateposting/mcp` and gets a new version, `0.13.0` (the owner's decision of 2026-11-16, after a first draft that used a new name, `com.ihateposting/agent`). The descriptions keep the old wording, in the shape of the reference's listings: no sentence tells the new listing from the live app's (the owner's decision of 2026-11-15). Where a place's rules or a reviewer might need one, the place is listed below for the owner instead of a sentence being written. The owner can veto any of this at any time; the manifests and these packs then change together.

The identifiers keep the owner's earlier choices (his answer "Back to ihateposting", 2026-11-15, after a first version of this change had renamed them too): the plugin is `ihateposting` in the Claude, Cursor, Grok and ChatGPT manifests, the Gemini extension is `ihateposting`, the skill is `ihateposting` in `skills/ihateposting`, the marketplaces are `ihateposting` (they were `ihateposting-agent` until the owner's answer "all should be ihateposting" of 2026-11-19), the install line is `/plugin install ihateposting@ihateposting`, the DeepSeek package is `dsh-ihateposting`, and the npm package and the command are `ihateposting` (since the same answer; before it the package was `ihateposting-agent`, still on npm at 0.1.1).

Checked on 2026-11-15 against each place's rules and against what exists. The new connector's slug is free (the Claude connector directory's page for `ihateposting-agent` "doesn't exist"; the registry name `com.ihateposting/agent` was free too on 2026-11-15, but the draft no longer uses it), and ChatGPT's display name is 18 characters of at most 30, with no "MCP" or "Plugin" (the directory cannot be searched from outside, so a clash there is only found at submission). Because the plugin and the extension are called `ihateposting` again, these places can refuse it. For each, what happens and the one fallback ready (the same everywhere: **`ihateposting-agent`**, free at every place checked, with the display name `iHatePosting Agent` unchanged):

- **The Claude plugin portal**: the portal blocks a name another organization already uses ("Name is taken") and holds a look-alike for a reviewer ("Name may be confused with an existing listing"). The older plugin of that name is in the live app's own repository, the same publisher's, so a block is not expected, but the portal's check runs only at Validate, signed in (unverified). If it refuses: submit under `ihateposting-agent`; the plugin's name is permanent once published, so the install line becomes `ihateposting-agent@ihateposting` and the manifest, the entry, the READMEs and the tests change together.
- **ChatGPT**: the live app's plugin is called iHatePosting; OpenAI treats a new MCP host as a new plugin, and a clash can only be found at submission. If it refuses the `name`: submit as `ihateposting-agent` (the display name stays `iHatePosting Agent`).
- **cursor.directory**: a page `/plugins/ihateposting` exists and is the live app's plugin (read on 2026-11-15: "14 social networks", its own MCP server named `ihateposting` and one skill), so a new listing of that name collides with it; how the site treats a duplicate is unknown (it has a "Submit a plugin" form; not tried). If it refuses: `ihateposting-agent` (the page for it answered 404).
  - **Update of 2026-11-20 (evening, IST), read in the owner's own signed-in browser and in his screenshots; nothing was submitted by this repository.** The page exists as `ihateposting-2`: the site accepted a second page titled `iHatePosting` and numbered the slug itself, so its form did not refuse a duplicate (this answers the point left open under "Display name at cursor.directory" below). After the owner replaced the page's MCP address and skill text with this repository's current files and pressed "Update Plugin", the site's scan flagged it as a second listing of the existing `ihateposting` page (the scan says that page comes from the live app's older skill repository, not from this one) and hid it until a person reviews it; the scan found nothing unsafe. Before the save the page showed no such notice. The older page's edit address sent the owner's account to the site's home page, so pointing that page at this repository (the question left open in the table of places above) probably needs whoever owns it (an inference). The owner chose to wait for the review and not to save again meanwhile. Unverified: how long the review takes, what it decides, whether a second save restarts it. The fuller record is in `SUBMISSIONS.md`, "Where things stand (2026-11-20)".
- **The Cursor Marketplace**: nothing is taken (its pages for `ihateposting` and for `ihateposting-agent` both answered "Marketplace Plugin Not Found" in the in-app browser on 2026-11-15, with a page that exists as the control). If it refuses: `ihateposting-agent`.
- **Gemini**: the extension is `ihateposting`, the name of the manifest in the live app's older repository, and Gemini uses the manifest's `name` to identify an extension on a person's machine, so installing both would collide (whether the second is refused or replaces the first is unverified). If it refuses, or the gallery shows a clash: `ihateposting-agent` (that name differs from the repository's name `iHatePosting-Agent` only in capitals; Gemini's reference says it expects an extension's name to match its directory name, and whether an install from the repository's address cares is unverified).
- **skills.sh and ClawHub**: the skill is `ihateposting`, also the name of a skill in the live app's older skill repository, which skills.sh lists (it has no slug to reserve: a skill is addressed as `owner/repo/skill`). Whether installing both into one agent overwrites the first is unverified. ClawHub's API answered 404 for `ihateposting` and for `ihateposting-agent`, so its slug is free; if it refuses: `ihateposting-agent`. A skill's name has to match its folder, so renaming the skill means renaming `skills/ihateposting` and its copies too, and `sync-skill.yml` names that folder.
- **The xAI marketplace**: `ihateposting` is not in its catalog (36 plugins read); if a reviewer objects: `ihateposting-agent` (also not there).
- **DeepSeek's npm package, `dsh-ihateposting`**: free on npm; the package name `ihateposting` is this program's own, so the plugin cannot use it. Fallback: `dsh-ihateposting-agent` (free: 404).
- **The MCP Registry** is not affected by the display name: its entry keeps the name `com.ihateposting/mcp` and gets a new version. **The Claude connector directory is affected by the display name** (see below): the new connector takes the slug `ihateposting-agent` (the old one holds `ihateposting`), which the form accepted, but the portal refused the display name `iHatePosting`.

The display name `iHatePosting` is the same as the live app's listings. What each place's rules say about that (what was read, or "unverified"):

- **Display name at the Claude connector directory (tried on 2026-11-16, in the owner's own portal)**: the portal's "Submit for review" refused a second connector listing named `iHatePosting` with "This name is already in use by another listing. Pick a different name on the Listing step." The listing that holds the name is the owner's own published connector "iHatePosting" (`https://ihateposting.com/mcp/oauth`), so the check is on the name across listings, not on the publisher; the form had accepted the slug `ihateposting-agent`. So a second connector listing needs another display name, or the existing listing has to be pointed at the new server address instead. The owner wrote to Anthropic's directory and support team on 2026-11-16 to ask which; until they answer, the connector draft is not submitted (a published name can be changed later, but needs re-review: the "managing a listing" page).
- **Display name at the Claude plugin portal**: the checklist holds a `displayName` for a reviewer when it "can't be mistaken for an existing plugin, publisher, connector, or well-known brand that isn't yours"; the live listings are the owner's own, so that clause does not apply to them, and "Name is taken" is only for another organization's plugin. Likely allowed; the check runs only at Validate, signed in (unverified).
- **Display name at ChatGPT**: it must be one line, at most 30 characters and in supported text, and not an overly generic name; no rule about two plugins with one display name was found (a new MCP host is a new plugin). Unverified; a clash is only found at submission.
- **Display name at cursor.directory**: no rule text found; the live plugin's page is titled `iHatePosting`. Unverified whether a second page with the same title is accepted (its slug has to differ).
- **Display name at the Cursor Marketplace**: the reference says a plugin's `name` must be unique; no rule about a display name was found. Unverified.
- **Display name as the registry's `title`**: the schema calls it an "Optional human-readable title or display name" that clients may use for display (1 to 100 characters); only `name` is the unique key, so an identical title is allowed by the schema.
- **Display name at ClawHub**: the slug identifies a skill, and the display name is what the owner passes with `--name` ("ClawHub stores what you pass and displays the normalized form"); no rule about two skills with one display name was found. Unverified.

#### Claude connector

1. Open https://claude.ai/directory/manage and choose the MCP connector route.
2. Give the server address and the fields above. Every tool needs a title and a read-only or destructive hint; the server sets them (in the app's `apps/backend/src/mcp/mcp-tools.ts`).
3. The sign-in must use PKCE with `S256` (https://claude.com/docs/connectors/building/authentication.md, which also gives the callback address Anthropic's side uses and the address range its calls come from).
4. The owner's existing listing for the old app (https://claude.ai/directory/ihateposting) points at `https://ihateposting.com/mcp/oauth`. Whether a published listing's server address can be edited is **unverified**: the pages read do not say. Ask Anthropic (the review contact is named in https://claude.com/docs/connectors/building/submission.md) before submitting a second listing, and keep the old address answering until they confirm. The new listing's slug is `ihateposting-agent` (free: the directory page for it "doesn't exist"); the old listing holds `ihateposting`, and a slug is permanent once published.
5. A plugin with a top-level `bin/` folder "can't be installed" in Claude chat or Cowork, while skills and remote servers load (https://claude.com/docs/plugins/platform-support.md, read 2026-11-15). That is why the Claude plugin is in `plugins/claude-ihateposting/`, a folder of its own without `bin/` (the owner's decision of 2026-11-15), and not at the repository root, which holds the program's `bin/`.

#### ChatGPT and Codex plugin

OpenAI renamed "apps" to "plugins"; the documentation is at https://developers.openai.com/plugins. The folder `plugins/chatgpt-ihateposting/` is the package: `plugin.json` (listing text, five positive and three negative review cases, release notes), `mcp.json` (the hosted address and OAuth), four skills and two icons. It declares no hooks and no app files, which OpenAI refuses.

1. Check and build the ZIP (this uploads nothing):

   ```bash
   npm run chatgpt-plugin:zip
   ```

   It checks the folder against OpenAI's package rules, then writes `dist/ihateposting-chatgpt-plugin.zip` and prints its size and SHA-256. It refuses, with every problem named, to build a ZIP the portal would reject.
2. In the OpenAI platform, verify your organization and publishing identity first (individual or company: the directory shows that name, whatever `developerName` says). Then open https://platform.openai.com/plugins, choose "Upload new or existing plugin" and upload the ZIP.
3. Connect the server in the portal. It shows a token to serve as plain text at `https://<host>/.well-known/openai-apps-challenge` on the server's host or a parent domain. Today the old host `ihateposting.com` serves a token for the old plugin; do not replace it (OpenAI: use a parent origin or a distinct host instead).
4. Finish the review details: a demo video URL (not in the ZIP), and a test account for the reviewers typed into the portal's own form (never in the ZIP, which rejects `test_credentials` and `reviewer_instructions`): no MFA, no email or SMS code. Run the five positive cases with it first.
5. Submit for review. There is no stated review time.

The old listing for the old app was built on `ihateposting.com`. OpenAI's pages say the server's origin (scheme, host or port) cannot change between versions: a different host means a **new plugin** with its own scan and review (https://developers.openai.com/plugins/deploy/app-review.md); changing a server's address on an existing plugin needs OpenAI's support, the update flow does not do it (https://developers.openai.com/plugins/deploy/submission.md). `plugin.json` here is version `1.0.0` for a new plugin; if the old listing is moved instead, the version should be higher than the old one's (its own manifest says 1.0.1; the docs say to use an explicit semantic version for submissions and updates).

#### Grok Build: the xAI marketplace

The repository carries its own Grok Build marketplace file (`.grok-plugin/marketplace.json`), so people can add it directly with `grok plugin marketplace add iHatePostingOrg/iHatePosting-Agent` (the command's form as xAI's pages show it; not run here, and the README does not mention it yet). To be listed in xAI's own catalog, xAI's contribution guide asks for a pull request that adds one entry whose remote source is pinned to a **full 40-character commit SHA** of a public commit (a branch, a tag or a short SHA is rejected), with the licence stated, and the repository's two scripts run (`generate-plugin-index.py`, `validate-catalog.py`). Our own catalog entry here uses a local source, which is for hosting our own catalog and is not the form xAI wants. Another organisation's repository: open nothing without your yes.

#### DeepSeek Harness

```bash
cd plugins/dsh-ihateposting
npm pack --dry-run
npm publish --access public
```

This is a second package: it needs your npm login and 2FA, like the first (the owner wants it published by hand). **Version 0.1.0 cannot be changed once it is on npm**, so read `npm pack --dry-run` and the plugin's README first: since 2026-11-15 the plugin follows the settings of the other project's DeepSeek plugin (the variable, an inline key, the API address and a skill switch; no key means a warning, not a refusal to load) and no longer ships the 42 kB skill copy. Its version is kept equal to the main one by a test; since 2026-11-19 its default `baseUrl` is `https://app.ihateposting.com` (the key address has no `/api`), so the published 0.1.1 and this copy differ in that value: a new version is needed once the `/api` key addresses stop (your step). `package.json` already has the `repository.directory` field npm uses for a package inside a repository. The community list is a pull request on another organisation's repository (second-hand: one YAML file per plugin): only with your yes. `SUBMISSIONS.md` has the whole pack.

#### ClawHub

```bash
clawhub login
clawhub skill publish ./skills/ihateposting --slug ihateposting
```

Read https://docs.openclaw.ai/clawhub/publishing.md for the other options first. A new release stays pending until automated security checks pass. The skill's `SKILL.md` front matter declares `requires.env` as `IHATEPOSTING_API_URL` only and no program, while the skill's text uses `IHATEPOSTING_API_KEY` and the `ihateposting` command; ClawHub's skill-format page says declared requirements must match real use (second-hand), so a mismatch may be flagged. The skill's `homepage` line also still names the site's `/ai-agents` page, which describes the old setup.

**The ClawHub skill (the owner's decisions of 2026-11-16: his own GitHub account, and the same front matter as the reference project's published skill, read from ClawHub's public API the same day).** ClawHub's checks flag a skill whose front matter does not match what the skill really uses, and the reference project changed its published skill after publishing to declare its key, so the skill is not published from `skills/ihateposting` as it is. A folder named `ihateposting`, kept outside the repositories, holds `SKILL.md`, the repository skill's text byte for byte with the same front matter except one value: `requires.env` lists both `IHATEPOSTING_API_URL` and `IHATEPOSTING_API_KEY` (**required**, as in the reference project's published copy, although the code sign-in works without a key; whether ClawHub or OpenClaw then treats a person who only signs in as missing a requirement is unverified), with no `primaryEnv`, no `envVars` and no `install` entry (the reference project's copy has none, and the owner chose to match it). The front matter keeps the repository skill's single-line JSON `metadata`, which ClawHub accepted for the reference project's skill. Version 1.0.0 also held 13 of this repository's guides next to `SKILL.md` (as the reference project publishes its own guides); ClawHub's scan then called it suspicious (SkillSpector CRITICAL with 61 issues, ClawScan suspicious, the npm-publishing guidance of this file among its concerns), so the owner chose version 1.0.1 with `SKILL.md` only, which ClawHub marked clean (ClawScan clean; SkillSpector still suspicious with 4 issues, rated HIGH: the documented post deletion and the stored credentials). Not declared: `jq`, which the skill's shell examples use but nothing depends on. Steps, the owner's, in his own window: `npm i -g clawhub` (`clawhub.cmd` in Windows PowerShell), `clawhub login` (a one-time code and a GitHub sign-in; the GitHub account must be old enough for the upload gate, its age is not stated), `clawhub skill publish <the copy's folder> --slug ihateposting --name iHatePosting --version 1.0.1 --changelog "..." --dry-run`, then the same without `--dry-run`. ClawHub publishes every skill under **MIT-0**, which differs from this repository's MIT, and a new release stays pending until its checks (ClawScan, SkillSpector, A.I.G) pass; both versions took about 12 to 20 minutes. A held or blocked release stays visible to the owner in the ClawHub dashboard, `clawhub scan download <slug> --version <version>` fetches its report, and a published version cannot be changed, so a fix is the next version (a new skill starts at `1.0.0`).

**The ClawHub plugin (a bundle plugin; the owner's decision of 2026-11-16).** ClawHub offers two plugin kinds: a code plugin, which is native OpenClaw code, and a bundle, a content pack in the Claude, Codex or Cursor layout. This repository has no OpenClaw code, so the owner published a bundle made from `plugins/claude-ihateposting` as `ihateposting-agent` (ClawHub's skills and plugins share one name space and `ihateposting` is the skill; `ihateposting-agent` was also the marketplaces' and the npm package's name until 2026-11-19), display name `iHatePosting`, under the same public handle. The folder, kept outside the repositories, is that plugin folder with five changes: the skill's front matter lists the key as required as above, the README's first heading is `# iHatePosting`, the manifest has a `skills` field (`./skills/`) and the version `0.1.3`, and two files are added: a `package.json` (`name`, `version`, `description`, `type`, `license`, `repository` and `homepage`, with no `openclaw` block, so ClawHub keeps reading the folder as a Claude bundle) and the catalog icon `assets/icon.png`, a copy of `logo.png` (the only path ClawHub takes an icon from). The first version, 0.1.1, had no `skills` field and ClawHub then listed no skill inside the bundle. Commands: `clawhub package publish <the folder> --family bundle-plugin --bundle-format claude --name ihateposting-agent --display-name iHatePosting --version 0.1.3` with `--dry-run` first; `--version` is required because ClawHub does not read it from a bundle's manifest. `clawhub package validate` refused the first folder, which had no `package.json`, and passed the 0.1.3 folder (`Plugin Inspector: PASS`, 0 breakages, 0 warnings); it writes a `reports/` folder into the package folder, which must be deleted before publishing, because a publish would send those files too. ClawHub made 0.1.2 public about 12 minutes after the submission: scan clean (A.I.G 0 findings, ClawScan clean, SkillSpector not run on bundles) and the skill listed inside it; its dashboard warned about 0.1.1, and still about 0.1.2, that the package has no `package.json` (a warning, not an error: the plugin stayed visible). Version 0.1.3, which adds the `package.json` and the icon, was public about 10 minutes after its submission (read from ClawHub's public record and pages on 2026-11-16): scan clean (A.I.G 0 findings; the language-model check rated every dimension ok, verdict benign; the page's Security audit reads Pass), the dashboard's warning gone, the listing summary taken from the `package.json` `description` (for 0.1.1 and 0.1.2 it came from the README), the skill listed inside the bundle, and the icon served by ClawHub with the same bytes as `logo.png` and shown in the Plugins catalog row (the header of the plugin's own page, seen signed out, shows none). The page offers `openclaw plugins install clawhub:ihateposting-agent@latest`; whether OpenClaw then loads the bundled skill is unverified, and the README the page shows is the Claude plugin's, with Claude Code's install lines.

**ClawHub catches up with the rename (the owner, 2026-11-20).** The skill 1.0.1 and the bundle 0.1.3 still said `ihateposting-agent` where they named the command, so a new version of each was made from this repository's files after the rename, in two new folders kept outside the repositories next to the old ones (the old folders were left as they were). The skill 1.0.2 is this repository's `SKILL.md` with the same one changed value as 1.0.1 (the front matter's `requires.env` lists `IHATEPOSTING_API_KEY` as well as `IHATEPOSTING_API_URL`). The bundle 0.1.4 is the 0.1.3 folder with the version 0.1.4 in `package.json` and in the manifest, the `package.json` description naming `ihateposting`, the README taken from `plugins/claude-ihateposting` with its first heading `# iHatePosting`, and the skill taken from the same plugin with the one added key line; the bundle's name stays `ihateposting-agent`. The copies were compared line by line with the files they come from before they were published: for the skill only the `metadata` line differs, and for the bundle the version lines, the description, the first heading of the README and the added key line. The owner published both, and his ClawHub dashboard then showed the plugin v0.1.4 and the skill v1.0.2 as Visible with all three checks green, each updated three minutes earlier; the pages' own text was not seen after that (unverified). The ClawHub CLI was v0.26.0.

#### Official MCP Registry

`server.json` in the repository's root is a **draft** for a new version, `0.13.1` (the owner's choice of 2026-11-19; `0.13.0` is the version published on 2026-11-16), of the existing registry entry `com.ihateposting/mcp` (the owner's decision of 2026-11-16: one entry, the name kept, clients move to the new server; the entry's versions went up to 0.12.9 on 2026-11-15, from the old package `ihateposting-mcp`, its repository `agent-skill`). The name fits the registry's name pattern. Versions cannot be changed afterwards, and `0.13.1` is above `0.12.9`: the registry's versioning page (read on 2026-11-16) says a published version is immutable and that the latest version is chosen by semantic-version order, so the new version becomes the latest (what happens to a plain lower version published later is not stated there, which is why the number is above the old one). Publishing it **replaces what the entry shows**: its remotes become the new server's two addresses and its repository this one. The registry accepted a new version of the existing name with another repository (see below); `mcp-publisher validate` had passed on a copy first. Since 2026-11-19 `server.json` lists `https://app.ihateposting.com/mcp/oauth` as the OAuth remote and `https://app.ihateposting.com/mcp` as the key remote, so it no longer matches what 0.13.0 published; the registry's versions cannot be changed, so a new version was needed before the change shows there, and the owner chose 0.13.1 on 2026-11-19. Publishing it is his own step, after Shakti's routing (step 6 of "Publishing 1.0.0" at the top of this page). The namespace's ownership proof is a file served at `https://ihateposting.com/.well-known/mcp-registry-auth` (if the old entry was proven by DNS instead, that record is the one); keep serving it there. Steps: https://modelcontextprotocol.io/registry/quickstart (`mcp-publisher login`, then `mcp-publisher publish`, which reads `server.json` in the folder you run it in).

**Published (the owner, 2026-11-16, 10:27 UTC).** `mcp-publisher publish` answered "Successfully published" for `com.ihateposting/mcp` version 0.13.0. The public registry then listed 12 versions with 0.13.0 as the latest (`isLatest` true; 0.12.9, published 2026-11-13, no longer is), its repository `https://github.com/iHatePostingOrg/iHatePosting-Agent`, the two remotes `https://app.ihateposting.com/api/mcp/oauth` and `https://app.ihateposting.com/api/mcp` (an `Authorization` header marked secret) and no package. The proof was a **DNS TXT record** on `ihateposting.com` (`v=MCPv1; k=ed25519; p=<public key>`) made with a new Ed25519 key, because nobody could find the private key behind the older proof file (`https://ihateposting.com/.well-known/mcp-registry-auth`, which was left as it is, so whatever uses that key still works); the login was `mcp-publisher login dns --domain ihateposting.com --private-key <the key>`. The new private key is kept by the owner outside every repository and is never committed. The record reached the domain's own nameservers at once, while public resolvers can keep the old list of TXT records for up to its 4-hour TTL; the registry's own check accepted it on the first try. Keep the record and the key for the next version.

**Published again (the owner, 2026-11-20, after 16:20 IST).** `mcp-publisher` was no longer on the owner's computer (the 2026-11-16 copy had been in a temporary folder), so v1.8.10 was downloaded from the registry's GitHub releases (`mcp-publisher_windows_amd64.tar.gz`, 7,924,347 bytes) into a folder outside both repositories; its SHA-256 was compared with the digest GitHub shows for that file and matched, and the program was unpacked from the file that matched. `mcp-publisher validate` printed that `server.json` is valid, `login dns --domain ihateposting.com` with the same key printed "Successfully logged in", and `publish` printed "Successfully published" for `com.ihateposting/mcp` 0.13.1. The registry's public list then showed 13 versions with 0.13.1 as `isLatest` and 0.13.0 no longer. The `server.json` that was published names `https://app.ihateposting.com/mcp/oauth` and `https://app.ihateposting.com/mcp` as its two remotes.

#### Topics

The Gemini gallery finds extensions by the topic `gemini-cli-extension` (https://geminicli.com/docs/extensions/releasing/). The repository has 20 topics and its cap of 20 is unverified, so adding a topic may mean removing one. Topics read by other places: DeepSeek's own README advises `dsh-plugin` (second-hand); nothing found says a topic drives discovery for Claude Code, Cursor, xAI or ClawHub. This repository does not change topics; the About box section above lists what is set. The owner decided on 2026-11-15 to add `gemini-cli-extension`, `dsh-plugin`, `claude-code` and `openclaw-skills` and to remove `facebook`, `instagram`, `linkedin` and `tiktok-auto-post-scheduler` to stay at 20; the owner makes that change on github.com, and the About box table above is updated afterwards, not before.

#### npm: tokens, two-factor and trusted publishing (read on 2026-11-15)

Sources: https://docs.npmjs.com/about-access-tokens, https://docs.npmjs.com/trusted-publishers, https://github.blog/changelog/2026-07-31-restricting-npm-bypass-2fa-granular-access-tokens, https://github.blog/changelog/2026-09-18-stage-only-npm-tokens-for-safer-automation, https://github.blog/changelog/2026-10-02-unvalidated-npm-trusted-publishing-configurations-now-expire.

- Tokens that bypass 2FA can no longer do sensitive account, organisation and package management; those now ask for an interactive 2FA step. Publishing with them still works.
- npm says it is **targeting January 2027** to remove direct publishing with bypass-2FA tokens (a target: no day is given). After that, automation either publishes with trusted publishing, or uses a "stage only" token whose `npm stage publish` a maintainer then approves with 2FA.
- What that means here: releases are published by hand (the owner's decision of 2026-11-15), which npm says is not affected. `publish-npm.yml`, which runs only when started by hand and is not used, publishes with the `NPM_TOKEN` secret: it would keep working until the change, if the token is a granular one with Bypass 2FA ticked, and then needs one of the two replacements.
- Trusted publishing needs npm CLI 11.5.1 or later and Node 22.14.0 or later, and `id-token: write` in the workflow. **The workflow here uses Node 20**, so it would need a newer Node. For a public repository, npm then adds provenance on its own. The settings are on npmjs.com under the package: organisation or user `iHatePostingOrg`, repository `iHatePosting-Agent`, workflow file `publish-npm.yml`, no environment, and which actions to allow (staged publishing is always allowed; ticking direct `npm publish` is a choice). A new configuration that has not had a successful publish after 48 hours expires, so create it when a release is ready.
- Publishing by hand, as 0.1.0 was, is not affected: an interactive `npm publish` with 2FA is what npm says stays.
- The two workflows have never run. They publish the version `package.json` holds (the tag must match it), and npm refuses a version that is already on npm, so after a hand publish a release of the same number would fail: make the next release a new version, or a pre-release (see "Publishing by hand", step 5).

### More common issues

| What you see | What to do |
| --- | --- |
| "You cannot publish over the previously published versions" | That version is already on npm. Raise the version (see "Version Updates"). |
| `npm error code ENEEDAUTH` or a 401 in the workflow | The `NPM_TOKEN` secret is missing, expired or not allowed to publish this package. Make a new token and update the secret. |
| The workflow stops at the tests | Run `npm test` locally on a clean clone and fix what fails. A test that fails only on GitHub's computers should be reported as a bug in the test, not skipped. |
| The skill copies differ and `package.test.mjs` fails | Copy the root file over the other two: `cp SKILL.md skills/ihateposting/SKILL.md` and `cp SKILL.md plugins/claude-ihateposting/skills/ihateposting/SKILL.md` (in PowerShell, `Copy-Item SKILL.md skills/ihateposting/SKILL.md`, and the same for the other). |
| `sync-skill.yml` fails when it pushes | `main` is protected or the workflow lacks write access. The job asks for `contents: write`; check the repository's Actions settings. |

### The DeepSeek Harness plugin is separate

`plugins/dsh-ihateposting` has its own `package.json` (name `dsh-ihateposting`, version kept equal to the main one) and is **not** published by either workflow or by the steps above: it is a separate `npm publish` from inside that folder, after its own tests (`node --test "plugins/dsh-ihateposting/test/*.test.mjs"`) pass. It was published that way, by hand, as `dsh-ihateposting@0.1.1` (checked on npm on 2026-11-17), and it is in the DeepSeek Harness community list (pull request awesome-dsh-plugin/awesome-dsh-plugin#15823, merged 2026-11-16). Its README says it has never run inside a real DeepSeek Harness.

**Published as 1.0.0 (the owner, 2026-11-20, after 16:28 IST).** `npm view dsh-ihateposting maintainers` listed the owner's account, `npm publish --access public` from `plugins/dsh-ihateposting` printed `+ dsh-ihateposting@1.0.0` (6 files, 10.1 kB packed, 27.2 kB unpacked), and `npm view dsh-ihateposting version dist-tags` then printed version `1.0.0` and `latest: '1.0.0'`. Its default `baseUrl` is `https://app.ihateposting.com`, the key address without `/api`; the published 0.1.1 defaulted to the `/api` form, which stopped answering with the routing of the same day. The plugin's 44 tests passed before it was published; a real DeepSeek Harness loading it was not tried (unverified).
