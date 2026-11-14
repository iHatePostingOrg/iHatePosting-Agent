# Publishing ihateposting-agent to npm

This page is for the owner of the package. It says what a release is made of, what to check first, and two ways to do it: by hand from your own computer, or by publishing a GitHub release and letting the workflow do the rest. Nothing in this repository publishes by itself: the two workflows run only when a release is published on GitHub, and they have never run.

## The short version

By hand, from a clone on a computer where you are signed in to npm:

```bash
npm install
npm test                          # the whole suite; the planted-faults file takes ten minutes or more
npm pack --dry-run                # what would be published
npm login                         # first time only
npm publish --access public
```

Or with the workflow: put the repository and the `NPM_TOKEN` secret on GitHub, then publish a release whose tag is `v<the version in package.json>` (for 0.1.0, `v0.1.0`). The sections below explain each step and what can go wrong.

After either route, people install with:

```bash
npm install -g ihateposting-agent
ihateposting-agent --help
```

## What the package contains

`package.json` decides it with a `files` list: `bin`, `src`, `SKILL.md`, `skills`, `README.md`, `CHANGELOG.md` and `LICENSE`. npm adds `package.json` itself. `npm pack --dry-run` prints the result without writing a file or publishing anything; for version 0.1.0 it listed 16 files, about 22 kB packed and 98 kB unpacked:

```text
CHANGELOG.md
LICENSE
README.md
SKILL.md
bin/ihateposting-agent.mjs
package.json
skills/ihateposting-agent/SKILL.md
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

## The package name

The package is `ihateposting-agent`, and so is the command it installs. That is decided. Two fields in `package.json` are separate things:

| Field | What it decides | Value now |
| --- | --- | --- |
| `name` | What people type after `npm install` | `ihateposting-agent` |
| `bin` | What people type to run the program | `ihateposting-agent` (pointing at `bin/ihateposting-agent.mjs`) |

Before the first publish, check that nobody has the name:

```bash
npm view ihateposting-agent
```

A "404 Not Found" error means it is free. Anything else prints the package that already has it. This was not checked while writing this page (nothing here touches the registry), so run it yourself.

### If the name were taken

The command can stay the same while the package gets another name, because `bin` is independent of `name`. For example:

```json
{
  "name": "your-other-name",
  "bin": { "ihateposting-agent": "bin/ihateposting-agent.mjs" }
}
```

People would then run `npm install -g your-other-name` and still type `ihateposting-agent`. The other route is a scoped name, which belongs to your npm user or organization:

```json
{
  "name": "@your-scope/ihateposting-agent",
  "bin": { "ihateposting-agent": "bin/ihateposting-agent.mjs" }
}
```

```bash
npm install -g @your-scope/ihateposting-agent
```

A scoped package is private by default; `npm publish --access public` (which the workflow already passes) makes it public. Changing the name touches more than `package.json`:

- the install lines in `README.md`, `SKILL.md` (and its two copies), `QUICK_START.md`, `HOW_TO_RUN.md` and the other guides;
- `test/package.test.mjs`, which asserts that the name is `ihateposting-agent`;
- the plugin manifests only if you also want their `name` to change; they name the plugin, not the npm package.

## Before the first publish

Work down this list. Every item is something you can see for yourself.

- [ ] **The code is on GitHub.** `package.json` points at `https://github.com/iHatePostingOrg/iHatePosting-Agent`. The repository must exist there, with this code pushed to `main`, before you publish a release.
- [ ] **You own the name on npm**, or can publish under the scope you chose, and your npm account is set up for publishing (npm's own pages say what its two-factor and token rules are today; they have been changing, so read them rather than this page).
- [ ] **The version is the same in nine places.** `test/package.test.mjs` fails if any differ:

  | File | Field |
  | --- | --- |
  | `package.json` | `version` |
  | `.claude-plugin/plugin.json` | `version` |
  | `.claude-plugin/marketplace.json` | `metadata.version` |
  | `.cursor-plugin/plugin.json` | `version` |
  | `.cursor-plugin/marketplace.json` | `plugins[0].version` |
  | `.grok-plugin/plugin.json` | `version` |
  | `.grok-plugin/marketplace.json` | `plugins[0].version` |
  | `gemini-extension.json` | `version` |
  | `plugins/dsh-ihateposting/package.json` | `version` |

  The program itself prints the version from `package.json`.
- [ ] **`CHANGELOG.md` has an entry for the version**, as its newest heading: `## 0.1.0`. The heading now reads `## 0.1.0 (unreleased)`; the test still accepts it, but take "(unreleased)" out when you release.
- [ ] **The three copies of the skill are identical**: `SKILL.md`, `skills/ihateposting-agent/SKILL.md` and `plugins/dsh-ihateposting/skill/SKILL.md`. The tests fail otherwise, and so does a release, because the workflow runs the tests.
- [ ] **The tests pass**: `npm test`. Do not skip the planted-faults file; it is the one that proves the other tests would notice a mistake.
- [ ] **`npm pack --dry-run` lists what you expect**, and no key, `.env` or test file.
- [ ] **Nothing secret is in the tree.** `test/package.test.mjs` and `test/docs.test.mjs` look for key-like text, token-like text, private paths and email addresses. A last look at `git status` and `git diff` is still worth a minute.
- [ ] **The sign-in server is live** (next section).
- [ ] **The GitHub "About" box is filled in** (the section after next).

## The sign-in's server is the iHatePosting app

`ihateposting-agent auth:login` does not talk to a service of its own. It talks to the app, with the default address `https://app.ihateposting.com/api`:

- `POST /device/code` (so `https://app.ihateposting.com/api/device/code`) and `POST /device/token` give out and exchange the code;
- the pages `/device` (where a person types the code) and `/oauth/authorize` (where they approve) are what a person sees in the browser.

Those routes and pages must be live on `app.ihateposting.com` before `auth:login` works there. Publishing the package does not deploy them. Until they are live, `auth:login` ends with `❌ Failed to start authorization (404): ...` or `❌ Could not reach auth server at ...`, and the workaround is a workspace key in `IHATEPOSTING_API_KEY`. `CHANGELOG.md` records the same dependency and says it has not been deployed.

## The repository's About box

The box at the top right of the repository's page on github.com (the description, the website and the topics) is not part of the code and no file in this repository can set it. You set it, once, on github.com: open the repository, click the gear beside "About", and fill in the three fields. Reasonable values:

| Field | Suggested value |
| --- | --- |
| Description | The one in `package.json`: "The iHatePosting command line for AI agents and scripts: sign in, find channels, read each platform's rules, upload media and schedule or draft posts through iHatePosting's public API." (or shorter) |
| Website | `https://ihateposting.com` |
| Topics | `ihateposting`, `social-media`, `scheduling`, `cli`, `ai-agent`, `mcp`, `skill` (the package's keywords; GitHub topics are lowercase) |

## Publishing by hand

1. Check you are who you think you are, and that you are logged in:

   ```bash
   npm whoami
   ```

   If it answers with an error, run `npm login` and follow what npm asks for. Never paste a password or a token into a file in this repository.
2. Run the tests and the dry run from the repository root:

   ```bash
   npm install
   npm test
   npm pack --dry-run
   ```

   `package.json` has no `prepublishOnly` script, so `npm publish` does not run the tests for you; you do.
3. Publish:

   ```bash
   npm publish --access public
   ```

   For an unscoped package `--access public` changes nothing, and it does no harm.
4. Check the result (next section).
5. Tag the commit and publish a release on GitHub if you want one. Publishing a release also starts the two workflows, so the same version would be published a second time and fail; if you publish by hand, make the release a **pre-release** (the publish workflow skips those), or do the release first and let the workflow publish instead.

## Publishing with the GitHub workflows

Two files in `.github/workflows` run when a release is published on GitHub:

| Workflow | When it runs | What it does |
| --- | --- | --- |
| `publish-npm.yml` ("Publish to npm on release") | A release is published, and it is not a pre-release | Checks out the code, sets up Node 20 with the npm registry, checks that the release tag is `v` plus the version in `package.json`, runs `npm install && npm test`, then runs `npm publish --access public` with `NODE_AUTH_TOKEN` taken from the `NPM_TOKEN` secret. |
| `sync-skill.yml` ("Sync the plugin skill on release") | A release is published, or someone starts it by hand (`workflow_dispatch`) | Checks out `main`, copies `SKILL.md` over `skills/ihateposting-agent/SKILL.md` and `plugins/dsh-ihateposting/skill/SKILL.md`, and if that changed anything commits and pushes it to `main`. |

Neither runs on a push or a pull request. They have never run, so the first release is also their first test.

### One-time setup

1. Create an npm access token that can publish this package (npm's token page shows the kinds on offer; use the narrowest one that works). For a package that does not exist yet, a token limited to one package may not be possible: unverified, check npm's page.
2. In the GitHub repository open Settings, then Secrets and variables, then Actions, and add a repository secret named `NPM_TOKEN` with that token as its value. The token belongs in that secret only, never in a file or a commit.
3. Optionally run `sync-skill.yml` once by hand (Actions tab, choose the workflow, "Run workflow"). It proves that Actions are enabled and that the push to `main` is allowed. If the copies are already equal it changes nothing and says so. If `main` is protected against pushes from Actions, the job fails there; the fix is a repository setting, or copying the files yourself before a release.

### Making a release

1. Finish the checklist above. The version in `package.json` is the one that will be published.
2. Make sure `main` holds exactly what you want to ship.
3. Publish a release whose tag is `v<version>` and whose target is `main`. On github.com: Releases, "Draft a new release", create the tag, "Publish release". With the GitHub command line:

   ```bash
   gh release create v0.1.0 --target main --title "v0.1.0" --generate-notes
   ```

4. Open the Actions tab and watch "Publish to npm on release". The steps run in this order, and a failure stops the rest: the tag check, `npm install && npm test`, the publish.
5. If the publish job fails before the publish step (a wrong tag, a failing test), nothing was published. Fix it, then either re-run the job from the Actions tab (if the fix is in the repository's settings) or delete the release and its tag and publish a new release (if the fix is a change to the code, because a release points at the commit it was made from).

A release marked "pre-release" is skipped by `publish-npm.yml`; use that to rehearse a release on GitHub without publishing to npm.

## Verify the published package

```bash
npm view ihateposting-agent version          # the number you just published
npm install -g ihateposting-agent
ihateposting-agent --version                 # the same number
ihateposting-agent --help                    # the commands; no sign-in needed
```

Then try it where nothing of yours is in the way: a new folder, a new terminal, and no clone on the `PATH`.

```bash
mkdir try-it && cd try-it
npx ihateposting-agent --version
```

`--help` and `--version` need no sign-in and make no request. The first command that needs the server (`auth:status`, `integrations:list`) is the real proof that the address and the sign-in work.

## Updating the version

Pick the number by what changed: a fix is a patch (0.1.0 to 0.1.1), a new command or option that leaves the old ones working is a minor (0.1.0 to 0.2.0), and a change that breaks a script someone already wrote is a major (0.1.0 to 1.0.0). While the version starts with `0.`, many people treat any release as possibly breaking; say so in the changelog.

`npm version` bumps `package.json` only, and by default it also makes a git commit and a tag, which is not what this repository wants because eight other files carry the number. Use it without the git part, then change the rest by hand:

```bash
npm version patch --no-git-tag-version        # or minor, or major
```

Then, in this order:

1. Change the other eight places in the table above to the same number.
2. Add a `## <version>` heading at the top of `CHANGELOG.md` and describe the change under it.
3. Run `node --test --test-force-exit test/package.test.mjs`. It fails with the name of the file whose version differs.
4. Run the whole suite (`npm test`), commit, and publish by either route.

A version can be published only once. If you publish by mistake, npm will not let you replace it ("You cannot publish over the previously published versions"); make the next version instead. `npm deprecate ihateposting-agent@0.1.0 "use 0.1.1"` marks a bad version without removing it. npm limits unpublishing; read its current policy before you count on it.

## Testing before you publish

### What the package would hold

```bash
npm pack --dry-run
```

### The real package, installed from a tarball

```bash
npm pack --pack-destination ..                # next to the clone, not inside it
mkdir ../try-package && cd ../try-package
npm init -y
npm install ../ihateposting-agent-0.1.0.tgz
npx ihateposting-agent --version
npx ihateposting-agent --help
```

This installs the two dependencies from the registry, then runs the packed code exactly as a user's computer would. Do not run `auth:login` there unless the app's sign-in routes are live.

### The code in the clone, as a command

```bash
npm link
ihateposting-agent --version
npm unlink -g ihateposting-agent
```

### The tests

```bash
npm test
node --test --test-force-exit test/package.test.mjs
```

### npm's own rehearsal

`npm publish --dry-run` does everything a publish does except upload, and prints what it would have done. npm documents it; it was not run while this page was written.

## Common issues

| What you see | What to do |
| --- | --- |
| "You do not have permission to publish" | You are not logged in as an owner of the name. Check `npm whoami`; for a scope, check you belong to it. |
| "Package name too similar to existing package" | npm refuses names that are too close to a package that exists. Choose another name, or publish under your scope. |
| "You cannot publish over the previously published versions" | That version is already on npm. Raise the version (see above). |
| `npm error code ENEEDAUTH` or a 401 in the workflow | The `NPM_TOKEN` secret is missing, expired or not allowed to publish this package. Make a new token and update the secret. |
| The workflow stops at "The release tag must be the version in package.json" | The tag is not `v` plus the version. Delete the release and the tag, fix the version or the tag, and publish a new release. |
| The workflow stops at the tests | Run `npm test` locally on a clean clone and fix what fails. A test that fails only on GitHub's computers should be reported as a bug in the test, not skipped. |
| The skill copies differ and `package.test.mjs` fails | Copy the root file over the other two: `cp SKILL.md skills/ihateposting-agent/SKILL.md` and `cp SKILL.md plugins/dsh-ihateposting/skill/SKILL.md` (in PowerShell, `Copy-Item SKILL.md skills/ihateposting-agent/SKILL.md`, and the same for the second). |
| `sync-skill.yml` fails when it pushes | `main` is protected or the workflow lacks write access. The job asks for `contents: write`; check the repository's Actions settings. |
| A file is missing from the package | Compare `npm pack --dry-run` with the `files` list. A path in `files` that does not exist is silently left out. |
| `ihateposting-agent: command not found` after a global install | npm's global folder is not on your `PATH`. `npm prefix -g` shows it. |
| A release was published as a pre-release by mistake | The publish job was skipped. Edit the release on GitHub and clear "pre-release", or publish by hand. |

## The DeepSeek Harness plugin is separate

`plugins/dsh-ihateposting` has its own `package.json` (name `dsh-ihateposting`, version kept equal to the main one) and is **not** published by either workflow or by the steps above. Its README says it has never run inside a real DeepSeek Harness and that it has not been published. Whether to publish it is a separate decision; if you do, it is a separate `npm publish` from inside that folder, after its own tests (`node --test "plugins/dsh-ihateposting/test/*.test.mjs"`) pass.

## Summary

| Question | Answer |
| --- | --- |
| Package name and command | `ihateposting-agent`, both |
| What is published | `bin`, `src`, `SKILL.md`, `skills`, `README.md`, `CHANGELOG.md`, `LICENSE`, `package.json` |
| Files that carry the version | Nine; `test/package.test.mjs` checks them |
| Tests that must pass first | `npm test`, planted-faults file included |
| By hand | `npm publish --access public` |
| By workflow | A GitHub release tagged `v<version>`, with the `NPM_TOKEN` secret set |
| What the owner sets on github.com | The repository, the `NPM_TOKEN` secret and the About box |
| What must be live for `auth:login` | The app's `/device/code` and `/device/token` routes and its `/device` and `/oauth/authorize` pages |
| Not checked while writing this page | That the name is free, that the workflows work, any npm command that contacts the registry |
