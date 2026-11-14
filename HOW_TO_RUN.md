# How to run it

This page is for running `ihateposting-agent` from a clone of the repository, pointing it at a different server, and running the tests. For a first post, see [QUICK_START.md](QUICK_START.md).

## Run it from a clone

You need Node.js 20 or newer (`node --version`). There is no build step: the program is plain ES modules, and `bin/ihateposting-agent.mjs` only imports `src/index.mjs`.

```bash
git clone <this repository>
cd iHatePosting-Agent
npm install                                   # the two dependencies: yargs and node-fetch
node bin/ihateposting-agent.mjs --version
node bin/ihateposting-agent.mjs --help
```

`--help`, `--version` and `<command> --help` need no key and make no network request, so they are a safe first check. Every other command needs a sign-in (see below) and talks to the server.

To get the plain command name on your `PATH` while you work on the code:

```bash
npm link                                      # makes `ihateposting-agent` run your clone
ihateposting-agent --version
npm unlink -g ihateposting-agent              # when you are done
```

Without linking, put `node bin/ihateposting-agent.mjs` wherever the other docs say `ihateposting-agent`.

## Sign-in, in the order the program checks it

1. **A saved sign-in**, written by `auth:login` to `~/.ihateposting/credentials.json`. If it holds a token, that token is used, and so is the API address saved with it.
2. **The environment**: `IHATEPOSTING_API_KEY` is the key, and `IHATEPOSTING_API_URL` the address. This is used only when nothing is saved.
3. Otherwise the program prints `❌ Error: No authentication found.` with two options and ends with exit code `1`.

| Variable | What it does | Default |
| --- | --- | --- |
| `IHATEPOSTING_API_KEY` | The key sent with every request when no sign-in is saved. It is sent in the `Authorization` header exactly as it is, with no `Bearer` in front. | none |
| `IHATEPOSTING_API_URL` | The address the API paths are added to. | `https://app.ihateposting.com/api` |
| `IHATEPOSTING_AUTH_SERVER` | Where `auth:login` asks for its code. The `--auth-server` flag does the same and wins over the variable. | `https://app.ihateposting.com/api` |

Two details that surprise people:

- `IHATEPOSTING_API_URL` does not change where `auth:login` goes. Only `--auth-server` or `IHATEPOSTING_AUTH_SERVER` do.
- The address is joined to each path as text (`<address>/public/v1/...`, `<address>/device/code`), so give it without a trailing slash.

## Point it at another address

For a staging copy or a development server of the app, the address is whatever serves the `public/v1/...` and `device/...` paths on that server. Two ways to sign in there:

**With a key, nothing saved.** Make sure no sign-in is saved for the home folder you run in, then set the variables:

```bash
export IHATEPOSTING_API_URL="http://localhost:3000"      # example: a development backend on this machine
export IHATEPOSTING_API_KEY="<a key from that server's workspace>"
node bin/ihateposting-agent.mjs integrations:list
```

**With the device code.** Pass the address of the sign-in server; the token and the API address the server names are saved:

```bash
node bin/ihateposting-agent.mjs auth:login --auth-server http://localhost:3000
```

Keep a development sign-in apart from your real one by giving the program a home folder of its own, which is also how the tests do it. On macOS and Linux:

```bash
HOME="$(mktemp -d)" IHATEPOSTING_API_URL="http://localhost:3000" IHATEPOSTING_API_KEY="<dev key>" \
  node bin/ihateposting-agent.mjs auth:status
```

On Windows PowerShell set `$env:USERPROFILE` to a temporary folder for the session instead. `auth:logout` removes whatever is saved in the current home folder.

Two things to keep in mind when you choose an address:

- The program accepts a plain `http://` address for any host. Send keys and tokens over `https://` everywhere except a server on your own machine, because plain `http` can be read on the way.
- Redirects are followed, and the `Authorization` header goes along to the address a redirect names (`test/break.test.mjs` checks this). Only point the program at servers you trust.

## Run the tests

```bash
npm install
npm test
```

`npm test` runs `node --test --test-concurrency=1 "test/*.test.mjs" "plugins/dsh-ihateposting/test/*.test.mjs"`, so it runs every test file of the program and of the DeepSeek Harness plugin one after another. A single file runs with `node --test test/cli.test.mjs`.

| File | What it covers |
| --- | --- |
| `test/cli.test.mjs` | Every command, run as a child process against a fake API on `127.0.0.1`: what it asks, what it prints, how it ends, the help and version output, what is saved and what the environment decides. |
| `test/auth.test.mjs` | `auth:login` against a fake sign-in server: the code box, the polling interval, every way the sign-in can end, and what is saved. |
| `test/break.test.mjs` | Hostile or broken servers (redirects, silence, nonsense, huge answers), hostile and enormous input, thirty people at once with their own sign-ins, and that no key is printed. |
| `test/package.test.mjs` | The package and its files: versions, the skill and its copy, the plugin manifests, the workflows, and that no key-like text is committed. |
| `test/planted-faults.test.mjs` | Copies the repository to a temporary folder for each fault in its list (and once with nothing planted), plants the fault in the copy and checks that the other test files fail there. Its own header says it takes about ten minutes. |

What the tests need:

- Node.js 20 or newer, the dependencies from `npm install`, and `npm` on the `PATH` (`package.test.mjs` runs `npm pack --dry-run`).
- Loopback networking: the fake servers listen on `127.0.0.1` on a free port chosen by the system.
- A temporary directory and some room in it: the planted-faults file copies the repository (with `node_modules`), and `break.test.mjs` writes files of 50 MB and serves answers of 30 MB.
- No key and no account. The test helper removes `IHATEPOSTING_API_KEY`, `IHATEPOSTING_API_URL` and `IHATEPOSTING_AUTH_SERVER` from the child's environment unless a test sets them, and gives each run a home folder of its own, so your real saved sign-in is never read or written.

Two things to know before you run them:

- One test in `cli.test.mjs` leaves the address empty on purpose, to see that the program falls back to the default address. With a network connection that sends one request, carrying a made-up key, to `https://app.ihateposting.com/api`; without a network it fails to connect, which the test accepts either way.
- `auth:login` tries to open a browser. The helper neutralises that on Windows. On macOS and Linux the `open` or `xdg-open` call is not intercepted by the helper, so a browser window may open on a local address during `auth.test.mjs` (unverified; not observed on those systems).

## Troubleshooting

| What you see | What it usually means |
| --- | --- |
| `Cannot find package 'yargs'` or `'node-fetch'` | Run `npm install` in the clone. |
| A syntax error from Node on start | Node older than 20. Check `node --version`. |
| `❌ Error: No authentication found.` | Nobody is signed in: run `auth:login`, or set `IHATEPOSTING_API_KEY`. |
| Your key seems to be ignored | A saved sign-in wins over the environment. Check with `auth:status`, and `auth:logout` if you want the key used. |
| `IHATEPOSTING_API_URL` seems to be ignored | The same reason: a saved sign-in brings its own address. |
| `❌ Failed to ...: Request failed: API Error (401): ...` | The server refused the key or token. Sign in again. |
| The command never ends | There is no time limit; a server that does not answer is waited for. Stop it with Ctrl+C, or run it under your shell's `timeout`. |
| A command does nothing and exits `0` | The command or option name is not one the program knows; names that are unknown are ignored, not reported. Compare with `--help`. |
| `upload` sends a long odd file name on Windows | The name is what follows the last `/` in the path you typed. Write the path with forward slashes (`C:/pictures/a.png`). |
| JSON passed to `--settings` or `-d` arrives broken | Quoting differs between shells. Put the settings in a body file and use `--json`, or see the [examples](examples/README.md). |
