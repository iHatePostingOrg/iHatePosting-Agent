# Contributing

Thank you for helping. This is a small command line, and changes of any size are welcome: a fixed word in a guide, a test for a case that was missing, a bug fix, a new option.

By contributing you agree that your work is released under the repository's [MIT licence](LICENSE).

## Set up

You need Node.js 20 or newer.

```bash
git clone <this repository>
cd iHatePosting-Agent
npm install
npm test
```

Run the program from the clone with `node bin/ihateposting-agent.mjs <command>` (see [HOW_TO_RUN.md](HOW_TO_RUN.md)). There is no build step: what you edit is what runs.

`npm test` runs every `test/*.test.mjs` file, and the DeepSeek Harness plugin's own tests, with Node's test runner. One of them, `planted-faults.test.mjs`, copies the repository many times and takes about ten minutes; while you work, run a single file instead:

```bash
node --test test/cli.test.mjs
```

Tests never need a key, an account or a real server. If you find yourself wanting one, write a fake instead (below).

## Code style

- Plain JavaScript in ES modules: `.mjs` files, `import`/`export`, no TypeScript, no bundler, no transpiling.
- Match the file you are editing: two spaces, double quotes, semicolons, `async`/`await`.
- Node 20 is the floor. Use only what Node 20 has.
- The program has two runtime dependencies, `yargs` and `node-fetch`. Please open an issue before adding another, and say what it would save.
- Commands are declared in one place, `src/index.mjs`. A command's handler lives in `src/commands/`, and the HTTP call in `src/api.mjs`. Keep that split.
- Keep the output contract: a header line, then the answer as JSON on standard output; errors on standard error as `❌ Failed to <what>: <why>`; exit code `1` for every failure (`auth:status` is the one exception: it reports and ends with `0`).
- Never print a key or a token, except the first eight characters that `auth:status` shows. This is tested; do not weaken it.
- Comments should say why, not repeat what the line does.

## Tests

Add or change tests together with the code.

- Use `node:test` and `node:assert/strict`, as the existing files do.
- To test a command, run the real program with `run()` from `test/helpers.mjs` against `startFakeApi()`: the fake records every request (method, path, query, headers, body) and answers whatever your handler returns. Assert on what was sent, what was printed and the exit code.
- `run()` gives each program its own temporary home folder and removes the three `IHATEPOSTING_*` variables unless you pass them, so a test can never read or write your real saved sign-in. Keep it that way: do not point a test at the real service, and do not put a real key or token in a test. Use obviously fake values (`aaaa...`, `x-123`, `post-123`).
- A bug fix needs a test that fails without the fix.
- `test/package.test.mjs` checks the package's file list, the manifests, the skill copy and that no key-like text is committed. When you add, rename or remove files it looks at, update what it expects.
- `test/planted-faults.test.mjs` lists faults that are put into copies of the code to prove the other tests notice them. If you add behaviour that matters (a header, an exit code, a precedence rule), consider adding a fault for it.
- The release workflow `.github/workflows/publish-npm.yml` runs `npm install && npm test`, so everything in `test/*.test.mjs` (the long planted-faults file included) runs on a release.

## Documentation

If a change alters what a person sees (an option, a header line, a message, a default), update in the same pull request:

- `README.md` and the guide that covers it (`FEATURES.md`, `QUICK_START.md`, `SYNTAX_UPGRADE.md`, ...);
- `SKILL.md`, and the copy in `skills/ihateposting-agent/SKILL.md`. The two files must be identical; `test/package.test.mjs` checks that, and the `sync-skill.yml` workflow copies one over the other on a release;
- `CHANGELOG.md`, under the newest entry.

When you write examples, use placeholder ids (`x-123`, `post-123`, `media-123`), `example.com` addresses and drafts (`-t draft`), never a real account or key.

## Pull requests

A good pull request:

1. Does one thing, and says in its description what and why.
2. Has tests that cover the change, and `npm test` run before you open it. If a test fails for a reason unrelated to your change, say which one.
3. Updates the documents listed above.
4. Keeps the diff free of formatting-only changes in lines you did not otherwise touch.
5. Has no secrets in it: no key, token, `.env` file, saved `credentials.json` or private address. The repository's `.gitignore` keeps most of these out; check your diff anyway.

Version numbers are kept equal in `package.json`, the plugin manifests and the newest `CHANGELOG.md` entry. Leave them alone unless you are preparing a release; [PUBLISHING.md](PUBLISHING.md) describes that.

## Reporting a bug without pasting a key

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
