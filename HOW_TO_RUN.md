# Running ihateposting-agent

This page covers every way to start the command line, how to set it up, what to check when it will not start, how to test it, and how to work on its code. For a first draft post, go to [QUICK_START.md](QUICK_START.md). For a tour of every command, go to [examples/COMMAND_LINE_GUIDE.md](examples/COMMAND_LINE_GUIDE.md).

The program is plain JavaScript in ES modules, for Node.js 20 or newer (`node --version`). Nothing is compiled: the file you edit is the file that runs. `bin/ihateposting-agent.mjs` has one job, to import `src/index.mjs`.

## Five ways to start it

### 1. Straight from a clone, with node

```bash
git clone https://github.com/iHatePostingOrg/iHatePosting-Agent.git
cd iHatePosting-Agent
npm install
node bin/ihateposting-agent.mjs --version
node bin/ihateposting-agent.mjs --help
```

`--help`, `--version` and `<command> --help` need no sign-in and send no request, so they are a safe first check. Every other command needs a sign-in (see below) and talks to the server.

On macOS and Linux git stores the file without the executable bit, so `./bin/ihateposting-agent.mjs` answers "Permission denied" until you run `chmod +x bin/ihateposting-agent.mjs`. Putting `node` in front avoids the question.

### 2. Linked as a global command, with npm link

```bash
cd iHatePosting-Agent
npm link
ihateposting-agent --version
ihateposting-agent integrations:list

npm unlink -g ihateposting-agent      # when you are done
```

The global command points back at your clone, so a change to a file in `src/` shows up the next time you run it. There is no step in between.

### 3. Installed from npm

Once the package has been published (see [PUBLISHING.md](PUBLISHING.md); until then this fails with a 404):

```bash
npm install -g ihateposting-agent
ihateposting-agent --version
```

### 4. With npx, nothing installed

```bash
npx ihateposting-agent --help
npx ihateposting-agent integrations:list
```

This also needs the package to be published. A sign-in saved by `auth:login` is kept in your home folder, not in the install, so every way of running the program shares it.

### 5. From a packed tarball

To try exactly what npm would ship, before it ships, pack the clone and install the `.tgz` into an empty folder. The steps are in [PUBLISHING.md](PUBLISHING.md), under "Testing before you publish". Keep the tarball out of the clone (`--pack-destination ..`): `.gitignore` does not list `*.tgz`.

## Quick setup

1. **Dependencies.** `npm install` in the clone fetches the two the program has, `yargs` and `node-fetch`.
2. **Sign in**, one of two ways:

   ```bash
   node bin/ihateposting-agent.mjs auth:login
   ```

   It prints a code, tries to open a page of iHatePosting, and waits while you approve there. Or, on a machine with no browser, use a workspace key from **Settings > Agents / Dev** in the app:

   ```bash
   export IHATEPOSTING_API_KEY="<your key>"
   ```

3. **Check it.**

   ```bash
   node bin/ihateposting-agent.mjs auth:status
   ```

   With a key the output is:

   ```text
   🔑 Authentication method: API Key (environment variable)
   🔑 Key: abcd1234...

   🔄 Verifying credentials...
   ✅ Credentials are valid. 2 integration(s) connected.
   ```

   Only the first eight characters of a key are ever shown.
4. **Run something.** `node bin/ihateposting-agent.mjs integrations:list` prints your channels.

## Which sign-in the program uses

Each command that talks to the server asks the same question, in this order:

1. **A saved sign-in.** `auth:login` writes `~/.ihateposting/credentials.json` (on Windows, in your user folder). If that file holds an `accessToken`, the token and the saved `apiUrl` are used. The file looks like this:

   ```json
   {
     "accessToken": "<a token>",
     "apiUrl": "https://app.ihateposting.com/api",
     "organizationId": "<an id, when the server sent one>"
   }
   ```

2. **The environment.** `IHATEPOSTING_API_KEY` is the key and `IHATEPOSTING_API_URL` the address. They count only when nothing is saved.
3. **Nothing.** The program prints this to standard error and ends with exit code `1`:

   ```text
   ❌ Error: No authentication found.
   Options:
     1. OAuth2: ihateposting-agent auth:login --client-id <id> --client-secret <secret>
     2. API Key: export IHATEPOSTING_API_KEY=your_api_key
   ```

   The first option names a `--client-id` and a `--client-secret`. `auth:login` reads neither; plain `ihateposting-agent auth:login` is all it needs.

A key is sent in the `Authorization` header exactly as it is, with no `Bearer` in front.

## Pointing it at another address

For a staging copy or a development server, the address is whatever serves the `public/v1/...` and `device/...` routes there. Two ways to sign in:

**With a key, nothing saved:**

```bash
export IHATEPOSTING_API_URL="http://localhost:3000"       # example: a development server on this machine
export IHATEPOSTING_API_KEY="<a key from that server's workspace>"
node bin/ihateposting-agent.mjs integrations:list
```

**With the device code:**

```bash
node bin/ihateposting-agent.mjs auth:login --auth-server http://localhost:3000
```

The token and the API address the server names are saved.

To keep a development sign-in apart from your real one, start the program with a home folder of its own, which is also how the tests do it. On macOS and Linux:

```bash
HOME="$(mktemp -d)" IHATEPOSTING_API_URL="http://localhost:3000" IHATEPOSTING_API_KEY="<dev key>" \
  node bin/ihateposting-agent.mjs auth:status
```

In PowerShell, set `$env:USERPROFILE` to a temporary folder for the session instead. `auth:logout` removes whatever is saved in the current home folder.

Two cautions when you pick an address:

- A plain `http://` address is accepted for any host. Send keys and tokens over `https://` everywhere except a server on your own machine.
- Redirects are followed, and the `Authorization` header goes along to the address a redirect names (`test/break.test.mjs` checks this). Point the program only at servers you trust.

## Troubleshooting

| What you see | What it usually means |
| --- | --- |
| `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'yargs' imported from ...` (or `'node-fetch'`) | The dependencies are missing. Run `npm install` in the clone. |
| A syntax error from Node as soon as it starts | Node is older than 20. Check `node --version`. |
| `ihateposting-agent: command not found` after `npm link` | The folder npm links into is not on your `PATH`. `npm prefix -g` shows where it is (`<prefix>/bin` on macOS and Linux, `<prefix>` itself on Windows); add that to `PATH`, open a new terminal and try again. |
| `Permission denied` for `./bin/ihateposting-agent.mjs` | Run it with `node` in front, or `chmod +x bin/ihateposting-agent.mjs`. |
| `❌ Error: No authentication found.` | Nobody is signed in. Run `auth:login`, or set `IHATEPOSTING_API_KEY`. |
| `❌ Failed to ...: Request failed: API Error (401): ...` | The server refused the key or token. Sign in again (`auth:login`) or fix the key. |
| Your key seems to be ignored | A saved sign-in wins over the environment. `auth:status` tells which one is used; `auth:logout` lets the key count. |
| `IHATEPOSTING_API_URL` seems to be ignored | Same reason: a saved sign-in brings its own address. |
| `❌ Failed to ...: Request failed: request to <address> failed, reason: connect ECONNREFUSED ...` | Nothing answers at that address. Check the address, the server and your network. |
| `❌ Could not reach auth server at <address>: ...` | `auth:login` could not connect. Check `--auth-server` and `IHATEPOSTING_AUTH_SERVER`. |
| `❌ Failed to start authorization (404): ...` | The server is there but does not have the sign-in routes yet (`POST /device/code`). |
| `Missing required argument: ...` or `Not enough non-option arguments: ...`, then a usage text | A required option or id is missing. The usage text printed above the message shows what the command takes. |
| `❌ Failed to parse settings JSON: ...` | The text given to `--settings` is not valid JSON, or your shell removed its quotes. See the next row. |
| JSON given to `--settings` or `-d` arrives broken | Quoting differs between shells. Single quotes work in bash and zsh. In PowerShell 7 single quotes also worked when tested with `node` in front; other PowerShell versions and the Windows command prompt are not covered here, so put a post body in a file and use `--json`. |
| The command never ends | There is no time limit: a server that does not answer is waited for. Stop it with Ctrl+C, or start it under your shell's `timeout`. |
| A command does nothing and ends with exit code `0` | The word is not one the program knows. Unknown commands and options are ignored, not reported. Compare with `--help`. |
| `upload` sends a long odd file name on Windows | The name is whatever follows the last `/` in the path you typed. Write `C:/pictures/a.png`, not backslashes. |
| `auth:login` prints a code but no page opens | Open the address it printed by hand and type the code there. |

## Testing it

### Without a server: the help

```bash
node bin/ihateposting-agent.mjs --help
node bin/ihateposting-agent.mjs posts:create --help
```

### Against a fake API, by hand

The tests use a small fake server on your own computer. You can use it yourself to see exactly what the program sends and prints. Save this as `try-fake.mjs` in the root of the clone (do not commit it) and run `node try-fake.mjs`:

```js
import { run, startFakeApi } from "./test/helpers.mjs";

const api = await startFakeApi((request) => {
  console.log("the fake API was asked:", request.method, request.path, JSON.stringify(request.query));
  return { body: [{ id: "x-123", name: "Example Studio", identifier: "x", disabled: false }] };
});

const key = "a".repeat(16);
const result = await run(["integrations:list"], { env: { IHATEPOSTING_API_KEY: key, IHATEPOSTING_API_URL: api.url } });
console.log("exit code:", result.code);
console.log("key sent as it is:", api.requests[0].headers.authorization === key);
console.log(result.stdout);
await api.close();
```

It prints the request the program made, its exit code and its output. `run()` gives the program a temporary home folder, so your saved sign-in is not touched.

### The automated tests

```bash
npm install
npm test
```

`npm test` runs `node --test --test-concurrency=1 "test/*.test.mjs" "plugins/dsh-ihateposting/test/*.test.mjs"`: every test file of the program and of the DeepSeek Harness plugin, one after another. The planted-faults file inside it is the long one, roughly ten to fifteen minutes depending on the machine, so while you work run a single file or a single test:

```bash
node --test test/cli.test.mjs
node --test --test-name-pattern="makes a draft" test/cli.test.mjs
node --test --test-force-exit test/package.test.mjs
node --test "plugins/dsh-ihateposting/test/*.test.mjs"
```

| File | What it covers |
| --- | --- |
| `test/cli.test.mjs` | Every command, run as a child process against a fake API on `127.0.0.1`: what it asks, what it prints, how it ends, the help and version output, what is saved and what the environment decides. |
| `test/auth.test.mjs` | `auth:login` against a fake sign-in server: the code box, the polling interval, every way the sign-in can end, and what is saved. |
| `test/break.test.mjs` | Hostile or broken servers (redirects, silence, nonsense, huge answers), hostile and enormous input, thirty people at once with their own sign-ins, and that no key is printed. |
| `test/package.test.mjs` | The package and its files: the version everywhere, the skill and its copies, the plugin manifests, the workflows, and that no key-like text is committed. |
| `test/docs.test.mjs` | The Markdown documents: relative links that lead somewhere, example files that exist, no key, token or private path in a document. |
| `test/planted-faults.test.mjs` | For each fault in its list (and once with nothing planted) it copies the repository to a temporary folder, plants the fault in the copy and checks that the other test files fail there. |

What the tests need:

- Node.js 20 or newer, the dependencies from `npm install`, and `npm` on the `PATH` (`package.test.mjs` runs `npm pack --dry-run`).
- Loopback networking: the fake servers listen on `127.0.0.1` on a free port the system picks.
- A temporary directory with room in it: the planted-faults file copies the repository (with `node_modules`), and `break.test.mjs` writes files of 50 MB and serves answers of 30 MB.
- No key and no account. The helper removes the three `IHATEPOSTING_*` variables from the program's environment unless a test sets them, and gives each run a home folder of its own, so your saved sign-in is never read or written.

Two things to know before you run them:

- One test in `cli.test.mjs` leaves the address empty on purpose, to see that the program falls back to the default one. A preloaded file (`test/refuse-network.cjs`) refuses the request and records where it would have gone, so nothing leaves your computer.
- `auth:login` tries to open a browser. The helper neutralises that on Windows. On macOS and Linux the `open` or `xdg-open` call is not intercepted, so a browser window may open on a local address during `auth.test.mjs` (unverified; not observed on those systems).

## Working on the code

1. **Edit** a file in `src/`. The wiring (names, options, defaults, checks, help) is `src/index.mjs`; each command's handler is in `src/commands/`; the HTTP calls are in `src/api.mjs`.
2. **Run it.** With `npm link` in place, just run `ihateposting-agent ...`. Otherwise `node bin/ihateposting-agent.mjs ...`. There is no build and no watch mode, so there is nothing to wait for.
3. **Test it.** Run the test file nearest to the change (`node --test test/cli.test.mjs`). A change that alters what a person sees (a header line, a message, a default) needs its test changed in the same step.
4. **Look at the package.** `npm pack --dry-run` lists what would be published. Adding a source file does not require a `package.json` change, because `src` is included as a folder.
5. **Run `npm test`** before you commit. It includes the planted-faults check.

Adding a command usually touches these places: `src/index.mjs` (the command, its options, its examples), a handler in the matching `src/commands/` file, a method in `src/api.mjs`, a test in `test/cli.test.mjs`, the skill (`SKILL.md` and its two copies, which must stay identical), `README.md`, and `CHANGELOG.md`. [CONTRIBUTING.md](CONTRIBUTING.md) has the rules.

## Environment variables

| Variable | What it does | Default |
| --- | --- | --- |
| `IHATEPOSTING_API_KEY` | The key sent with every request when no sign-in is saved. | none |
| `IHATEPOSTING_API_URL` | The address the API paths are added to, without a trailing slash. | `https://app.ihateposting.com/api` |
| `IHATEPOSTING_AUTH_SERVER` | Where `auth:login` asks for its code. The `--auth-server` flag does the same and wins. | `https://app.ihateposting.com/api` |

`IHATEPOSTING_API_URL` does not change where `auth:login` goes; only `--auth-server` and `IHATEPOSTING_AUTH_SERVER` do. The program also reads your home folder (`HOME`, or `USERPROFILE` on Windows) to find the saved sign-in.

For one session, typing the key out or (better) reading it without echo so it stays out of your shell history:

```bash
# bash or zsh
export IHATEPOSTING_API_KEY="<your key>"
read -rs IHATEPOSTING_API_KEY && export IHATEPOSTING_API_KEY
```

```powershell
# PowerShell
$env:IHATEPOSTING_API_KEY = "<your key>"
$env:IHATEPOSTING_API_KEY = Read-Host -MaskInput "Key"
```

Putting a key in `~/.bashrc`, in a script or in a repository leaves it in plain text. Prefer `auth:login` on a machine you use daily, and a secret store on a server.

## Aliases

```bash
alias ihp='ihateposting-agent'          # in ~/.bashrc or ~/.zshrc
```

```powershell
Set-Alias ihp ihateposting-agent        # in your PowerShell profile
```

Then `ihp posts:list` does what `ihateposting-agent posts:list` does. From a clone that is not linked, make the alias run node: `alias ihp='node /path/to/iHatePosting-Agent/bin/ihateposting-agent.mjs'`.

## On a server or in CI

- There is no browser, so use a key, not `auth:login`. Store it in the system's secret store and expose it as `IHATEPOSTING_API_KEY` for the one job that needs it.
- Install with `npm install -g ihateposting-agent`, or run `npx ihateposting-agent <command>` (both need the package to be published).
- Every failure ends with exit code `1`, so a script can stop on `set -e` or test `$?`.
- Nothing is retried and nothing times out. Wrap the call in your system's `timeout` and decide yourself whether to try again after a `429` or a server error.
- Start with drafts (`-t draft`): nothing is published until a post's status is changed to `schedule`.

## Publishing and installing

Publishing is the owner's job and is described step by step in [PUBLISHING.md](PUBLISHING.md). The short version: keep the version equal everywhere, run `npm test`, run `npm pack --dry-run`, and either run `npm publish --access public` by hand or publish a GitHub release whose tag is `v<version>`. People then install with `npm install -g ihateposting-agent` or run `npx ihateposting-agent`.

## Summary

| Way | Command | Use it for |
| --- | --- | --- |
| node on the clone | `node bin/ihateposting-agent.mjs` | A first look and for working on the code; nothing to install globally |
| npm link | `ihateposting-agent` | Daily work on the code, with the real command name |
| npm global install | `ihateposting-agent` after `npm install -g ihateposting-agent` | People who only use the program (after publishing) |
| npx | `npx ihateposting-agent` | A one-off run without installing (after publishing) |
| Packed tarball | `npx ihateposting-agent` inside a folder where the `.tgz` was installed | Trying the real package before it is published |

## Recommended setup for development

```bash
git clone https://github.com/iHatePostingOrg/iHatePosting-Agent.git
cd iHatePosting-Agent
npm install
npm link
ihateposting-agent auth:login
ihateposting-agent auth:status
ihateposting-agent integrations:list
node --test test/cli.test.mjs
```

## What was checked, and what was not

Run for this page: `--help`, `--version` and every `<command> --help`; the error messages in the troubleshooting table for a missing sign-in, a refused key, an address that does not answer, a missing upload file, a bad `--settings` text and missing options (against the repository's fake API), and the missing-dependency error (in a copy without `node_modules`); the `try-fake.mjs` script (run from outside the clone with the same code); the `--test-name-pattern` command on `test/cli.test.mjs`; the quoting of JSON through PowerShell 7 and `cmd` into `node`.

Not run, so unverified: `npm link`, `npm install -g`, `npx` and the tarball steps (they change global folders or need the published package), the `chmod` and `PATH` advice for macOS and Linux, any run on a Node older than 20, the two `auth:login` messages in the table (read from the source: that command was not run), and anything against the real iHatePosting server.
