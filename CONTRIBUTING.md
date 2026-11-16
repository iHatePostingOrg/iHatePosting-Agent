# Contributing

This repo holds the iHatePosting CLI (published to npm as `ihateposting-agent`), the `ihateposting` agent skill and the plugin folders and manifests for Claude Code, Cursor, Grok, Gemini CLI, DeepSeek Harness and ChatGPT and Codex.

## Setup

You need Node.js 20 or newer.

```bash
npm install        # install the two dependencies (yargs and node-fetch)
npm test           # run the tests (the planted-faults file takes ten minutes or more)
node bin/ihateposting-agent.mjs --help   # run the CLI from a clone
```

There is no build step: what you edit is what runs (see [HOW_TO_RUN.md](HOW_TO_RUN.md)). The lock files (`package-lock.json`, `pnpm-lock.yaml` and `yarn.lock`) are gitignored, so do not commit them. There is no build to check before pushing; run `npm test` instead.

`npm test` runs every `test/*.test.mjs` file, and the DeepSeek Harness plugin's own tests, with Node's test runner. One of them, `planted-faults.test.mjs`, copies the repository many times and takes ten minutes or more; while you work, run a single file instead:

```bash
node --test test/cli.test.mjs
```

Tests never need a key, an account or a real server. If you find yourself wanting one, write a fake instead (see "Tests" below).

Branch off `origin/main` and open the PR against `main`. Commit messages follow the existing history: one short sentence that says what changed, in the imperative, for example `Rename the skill and its folder to ihateposting`.

## Pull request checklist

Before opening a PR, run `git fetch origin` and compare against `origin/main`:

1. **Bump the version** in all of these files, to the same value: `package.json`, `plugins/claude-ihateposting/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (`metadata.version`), `.cursor-plugin/plugin.json`, `.cursor-plugin/marketplace.json` (`plugins[0].version`), `.grok-plugin/plugin.json`, `.grok-plugin/marketplace.json` (`plugins[0].version`), `gemini-extension.json` and `plugins/dsh-ihateposting/package.json`. Bump the patch (subminor) number by default, and the minor number only for a meaningful change or a refactor. Never bump the major number unless agreed. `test/package.test.mjs` fails with the name of the file whose version differs.
2. **Add a `CHANGELOG.md` entry** for the new version, dated, under Added, Changed or Fixed, following the existing entries.
3. **Update the docs the change affects**: `README.md` (commands, API endpoint table, quick reference), `SKILL.md` for commands and agent guidance, `PUBLISHING.md` for release steps, and any GitHub workflow file under `.github/workflows` that the change touches. Do not edit the two copies of the skill by hand (`skills/ihateposting/SKILL.md` and `plugins/claude-ihateposting/skills/ihateposting/SKILL.md`): change the root `SKILL.md` and copy it over them (the `sync-skill` workflow can do the copying, but it runs only when it is started by hand). `test/package.test.mjs` fails when the three differ.
4. **Check the version against other open PRs** (`gh pr list`). If one already bumps to the same version, whichever merges second must rebase and take the next version.

If `origin/main` moves after you open the PR (for example another PR merges and bumps the version), merge or rebase `origin/main` into your branch and bump the version again before your PR is merged, so it always ends up higher than `main`'s.

## Changes to the public API

Every change in the iHatePosting app that affects the public API should have matching updates in this repo (CLI command, `README.md` and `SKILL.md`), so customers using iHatePosting with external agents stay up to date.

## Releasing

If the change needs a new CLI version on npm, the owner publishes it by hand after the PR is merged, from their own computer and with two-factor authentication, following [PUBLISHING.md](PUBLISHING.md). Publishing a GitHub release does not publish to npm: both workflows in `.github/workflows` run only when they are started by hand. The npm package page shows the `README.md` bundled in the published version, so README and `SKILL.md` changes only reach it through a new release.

## Sections that were in this file before it followed the reference

### Welcome and licence

Thank you for helping. This is a small command line, and changes of any size are welcome: a fixed word in a guide, a test for a case that was missing, a bug fix, a new option.

By contributing you agree that your work is released under the repository's [MIT licence](LICENSE).

### Code style

- Plain JavaScript in ES modules: `.mjs` files, `import`/`export`, no TypeScript, no bundler, no transpiling.
- Match the file you are editing: two spaces, double quotes, semicolons, `async`/`await`.
- Node 20 is the floor. Use only what Node 20 has.
- The program has two runtime dependencies, `yargs` and `node-fetch`. Please open an issue before adding another, and say what it would save.
- Commands are declared in one place, `src/index.mjs`. A command's handler lives in `src/commands/`, and the HTTP call in `src/api.mjs`. Keep that split.
- Keep the output contract: a header line, then the answer as JSON on standard output; errors on standard error as `❌ Failed to <what>: <why>`; exit code `1` for every failure (`auth:status` is the one exception: it reports and ends with `0`).
- Never print a key or a token, except the first eight characters that `auth:status` shows. This is tested; do not weaken it.
- Comments should say why, not repeat what the line does.

### Tests

Add or change tests together with the code.

- Use `node:test` and `node:assert/strict`, as the existing files do.
- To test a command, run the real program with `run()` from `test/helpers.mjs` against `startFakeApi()`: the fake records every request (method, path, query, headers, body) and answers whatever your handler returns. Assert on what was sent, what was printed and the exit code.
- `run()` gives each program its own temporary home folder and removes the three `IHATEPOSTING_*` variables unless you pass them, so a test can never read or write your real saved sign-in. Keep it that way: do not point a test at the real service, and do not put a real key or token in a test. Use obviously fake values (`aaaa...`, `x-123`, `post-123`).
- A bug fix needs a test that fails without the fix.
- `test/package.test.mjs` checks the package's file list, the manifests, the skill copies and that no key-like text is committed. When you add, rename or remove files it looks at, update what it expects.
- `test/planted-faults.test.mjs` lists faults that are put into copies of the code to prove the other tests notice them. If you add behaviour that matters (a header, an exit code, a precedence rule), consider adding a fault for it.
- The release workflow `.github/workflows/publish-npm.yml` runs `npm install && npm test` (it runs only when started by hand), so everything in `test/*.test.mjs` (the long planted-faults file included) runs whenever it is started.

### Documentation

If a change alters what a person sees (an option, a header line, a message, a default), update in the same pull request:

- `README.md` and the guide that covers it (`FEATURES.md`, `QUICK_START.md`, `SYNTAX_UPGRADE.md`, ...);
- `SKILL.md`, and its copies in `skills/ihateposting/SKILL.md` and `plugins/claude-ihateposting/skills/ihateposting/SKILL.md`. The three files must be identical; `test/package.test.mjs` checks that, and the `sync-skill.yml` workflow (which runs only when started by hand) can copy the root file over a copy;
- `CHANGELOG.md`, under the newest entry.

When you write examples, use placeholder ids (`x-123`, `post-123`, `media-123`), `example.com` addresses and drafts (`-t draft`), never a real account or key.

### Pull requests

A good pull request:

1. Does one thing, and says in its description what and why.
2. Has tests that cover the change, and `npm test` run before you open it. If a test fails for a reason unrelated to your change, say which one.
3. Updates the documents listed above.
4. Keeps the diff free of formatting-only changes in lines you did not otherwise touch.
5. Has no secrets in it: no key, token, `.env` file, saved `credentials.json` or private address. The repository's `.gitignore` keeps most of these out; check your diff anyway.

Version numbers are kept equal in `package.json`, the plugin manifests and the newest `CHANGELOG.md` entry; the checklist above says how to bump them, and [PUBLISHING.md](PUBLISHING.md) describes how a release is made.

### Reporting a bug without pasting a key

Please open an issue with:

- the version (`ihateposting-agent --version`), your Node.js version (`node --version`) and your operating system;
- the exact command you ran, with ids replaced by placeholders if you prefer;
- what you expected, and what you got: the exit code and the line printed on standard error (for example `❌ Failed to list integrations: Request failed: API Error (401): ...`);
- whether you signed in with `auth:login` or with `IHATEPOSTING_API_KEY` (not the key itself).

Before you post anything, remove:

- your key or token. `auth:status` prints the first eight characters of it; leave even those out;
- the contents of `~/.ihateposting/credentials.json`, which holds your token;
- any `Authorization` header from copied logs;
- anything in the server's answer that you do not want public: post texts, channel names, ids of your workspace.

If you think the problem could expose a key, a token or someone's posts, do not describe it in a public issue. Open an issue that only says you have a security report and ask for a private way to send it. This repository does not yet publish a private contact address.
