# Project structure

A map of the repository: what each file and folder is for, how one command travels through the code, which routes of the iHatePosting app it uses, and what ends up in the npm package.

## Overview

This repository holds five things:

1. **The command line**, `ihateposting-agent`: plain JavaScript ES modules (`bin/` and `src/`) that sign in, list channels, read each platform's rules, upload media, create and manage posts and read analytics, all through iHatePosting's public API.
2. **The skill**, `SKILL.md`: the text that teaches an AI agent which commands to run and in which order.
3. **Plugin folders** that register the skill, and iHatePosting's hosted MCP server where the tool supports it, with Claude Code, Cursor, Grok Build, Gemini CLI and DeepSeek Harness.
4. **Tests** that run the real program against fake servers on your own computer.
5. **Documents and examples**: this page and its neighbours, and sample post bodies and scripts.

The package name and the command are the same: `ihateposting-agent`. The licence is MIT. There is no build step, no bundler, no TypeScript and no monorepo: one `package.json` at the root, two runtime dependencies, Node.js 20 or newer.

## The tree

```text
iHatePosting-Agent/
├── bin/
│   └── ihateposting-agent.mjs        the entry point: a shebang line and one import of src/index.mjs
├── src/
│   ├── index.mjs                     command wiring with yargs: names, options, defaults, checks, examples, help
│   ├── api.mjs                       the API client: one request method, one method per route, the upload, content types
│   ├── config.mjs                    which key and which address a command uses
│   ├── constants.mjs                 program name, default addresses, variable names, folder name, website
│   └── commands/
│       ├── auth.mjs                  auth:login, auth:logout, auth:status and the saved sign-in file
│       ├── posts.mjs                 posts:create, :list, :delete, :missing, :status, :settings, :connect
│       ├── integrations.mjs          integrations:list, :groups, :settings, :trigger
│       ├── analytics.mjs             analytics:platform, analytics:post
│       └── upload.mjs                upload, media:list, media:status
├── test/
│   ├── helpers.mjs                   the fake API, a temporary home folder, a runner for the program
│   ├── cli.test.mjs                  every command against the fake API
│   ├── auth.test.mjs                 the device sign-in against a fake sign-in server
│   ├── break.test.mjs                hostile or broken servers and input, many users, no key printed
│   ├── package.test.mjs              package contents, versions, manifests, skill copies, "no secret committed"
│   ├── docs.test.mjs                 the Markdown documents: links, example files, no key or private path
│   ├── planted-faults.test.mjs       plants known faults in copies of the code and expects the tests to fail
│   └── refuse-network.cjs            preloaded by one test so that a request is recorded and refused
├── examples/
│   ├── README.md                     the short index of this folder
│   ├── COMMAND_LINE_GUIDE.md         a guide to each command with runnable examples
│   ├── EXAMPLES.md                   a walk through the sample files below, and more scenarios
│   ├── *.json                        six sample post bodies (thread, comments with media, many platforms, TikTok, YouTube, Pinterest)
│   └── *.sh                          four Bash scripts (basic-usage, draft-from-flags, discover-and-draft, post-from-body-file)
├── skills/
│   └── ihateposting-agent/
│       └── SKILL.md                  a copy of the root SKILL.md, for the plugin manifests to point at
├── plugins/
│   └── dsh-ihateposting/             a separate small package for DeepSeek Harness (own package.json, tests, README, LICENSE)
│       ├── cordis.patch.yml          the two rows it adds to a Harness profile
│       ├── lib/                      index.js (the plugin), key.js (the key check), skill.js (loads the skill)
│       ├── skill/SKILL.md            another copy of the skill
│       └── test/                     index.test.mjs and a package.json that makes `node --test <folder>` work
├── .claude-plugin/                   plugin.json and marketplace.json for Claude Code
├── .cursor-plugin/                   plugin.json, marketplace.json and mcp.json for Cursor
├── .grok-plugin/                     plugin.json, marketplace.json and mcp.json for Grok Build
├── .github/
│   └── workflows/
│       ├── publish-npm.yml           publishes to npm when a (non-pre-)release is published
│       └── sync-skill.yml            copies SKILL.md into the two skill copies, on a release or by hand
├── assets/
│   └── logo.png                      the logo the README, Cursor and Grok manifests use
├── gemini-extension.json             the extension manifest for Gemini CLI, with the hosted MCP server
├── mcp.json                          the hosted MCP server's address, for any client that reads an mcp.json
├── SKILL.md                          the skill (the source of the copies above)
├── README.md                         the front page: install, sign in, commands, limits
├── CHANGELOG.md                      what changed in each version
├── LICENSE                           MIT
├── package.json                      name, version, bin, files, scripts, dependencies
├── .gitignore                        keeps keys, environment files, credentials.json and node_modules out of git
└── the guides: SUMMARY.md, QUICK_START.md, FEATURES.md, HOW_TO_RUN.md, SYNTAX_UPGRADE.md, SUPPORTED_FILE_TYPES.md,
    PROVIDER_SETTINGS.md, PROVIDER_SETTINGS_SUMMARY.md, INTEGRATION_SETTINGS_DISCOVERY.md,
    INTEGRATION_TOOLS_WORKFLOW.md, CONTRIBUTING.md, PUBLISHING.md, and this file
```

`node_modules/` and `package-lock.json` appear after `npm install`; git ignores both.

## The source files

### `bin/ihateposting-agent.mjs`

Two lines: `#!/usr/bin/env node` and `import "../src/index.mjs";`. This is what `package.json`'s `bin` points at, so it is the file npm links when someone installs the package.

### `src/index.mjs`

The one place where commands, options, short names, defaults, allowed values, examples and the help text are declared, with `yargs`.

- Reads the version from `package.json` for `--version`.
- Declares the 19 commands in the order the help shows them.
- Holds the checks for `posts:create` (content or `--json`; `--integrations` and `--date` unless a body file is given).
- Ends the help with the website and the two ways to sign in.
- Is not strict: a word that is not a command and an option that is not declared are accepted and ignored. That is the library's default, kept on purpose.

### `src/api.mjs`

The `IHatePostingAPI` class.

- `request(endpoint, options)` joins the address and the path, sends the key in `Authorization` exactly as it is, makes the request once, and returns the parsed JSON, or throws `Request failed: API Error (<status>): <the server's words>`. No timeout, no retry.
- One method per route: `createPost`, `listPosts`, `deletePost`, `listMedia`, `getMediaStatus`, `upload`, `getMissingContent`, `updateReleaseId`, `changePostStatus`, `updatePostSettings`, `getAnalytics`, `getPostAnalytics`, `listIntegrations`, `listGroups`, `getIntegrationSettings`, `triggerIntegrationTool`.
- `upload` builds a `multipart/form-data` body with the field `file` (and `adjust` when asked). It fails with `Upload failed (<status>): ...`. Its `MIME_TYPES` table names the content type for each known extension (see [SUPPORTED_FILE_TYPES.md](SUPPORTED_FILE_TYPES.md)).

### `src/config.mjs`

`getConfig()`: the saved sign-in first, then `IHATEPOSTING_API_KEY` and `IHATEPOSTING_API_URL`; with neither, a message on how to sign in and `process.exit(1)`.

### `src/constants.mjs`

`PROGRAM`, `DEFAULT_API_URL` and `DEFAULT_AUTH_SERVER` (both `https://app.ihateposting.com/api`), the three variable names, `CREDENTIALS_FOLDER` (`.ihateposting`) and `WEBSITE`.

### `src/commands/*.mjs`

The handlers, one file per group. Each one gets its configuration, makes its request, prints a header line and the JSON (or `❌ Failed to <what>: <why>`) and ends with `0` or `1`.

- `auth.mjs`: `authLogin`, `authLogout`, `authStatus`, and `loadCredentials` (used by `config.mjs`). It owns the saved file `~/.ihateposting/credentials.json`, written readable only by the person where the file system supports that, and opens the browser with `open`, `start` or `xdg-open`.
- `posts.mjs`: `createPost`, `listPosts`, `deletePost`, `getMissingContent`, `changePostStatus`, `updatePostSettings`, `connectPost`. `createPost` turns the repeated `-c`, `-m` and `--alt` into the request body.
- `integrations.mjs`: `listIntegrations`, `listGroups`, `getIntegrationSettings`, `triggerIntegrationTool`.
- `analytics.mjs`: `getAnalytics`, `getPostAnalytics`; seven days unless told otherwise.
- `upload.mjs`: `uploadFile`, `listMedia`, `getMediaStatus`.

## The tests

`npm test` runs `test/*.test.mjs` and the plugin's tests with Node's built-in runner, one file at a time. `helpers.mjs` is not a test. It exports:

- `startFakeApi(handler)`: a local server that keeps every request it gets (method, path, query, headers, body) and answers what the handler says.
- `run(argv, options)`: starts the program as a child process with a home folder of its own and none of the three `IHATEPOSTING_*` variables unless the test passes them.
- `jsonOf(stdout)`: reads the JSON that follows a header line.
- `credentialsFile(home)`, `tempDir()`, `KEY`, `TOKEN`, `BIN` and `ROOT`.

`planted-faults.test.mjs` copies the whole repository (without `.git`) once per fault, changes one thing in the copy, runs the other test files there, and demands a failure. A fault whose text is no longer in its file is itself a failure, so the list cannot rot quietly. See [HOW_TO_RUN.md](HOW_TO_RUN.md) for the commands and what each file needs.

## Documents and examples

| File | What it is for |
| --- | --- |
| `README.md` | The front page: what it is, install, sign in, commands, what to know before using a server |
| `SUMMARY.md` | A one-page overview of the whole repository |
| `QUICK_START.md` | From nothing to a first draft post and a look at its analytics |
| `FEATURES.md` | Everything the program does, grouped by task |
| `HOW_TO_RUN.md` | Ways to start the program, sign-in order, tests, development |
| `SYNTAX_UPGRADE.md` | Habits that differ from other posting command lines, for moving scripts over |
| `SUPPORTED_FILE_TYPES.md` | What `upload` does with a file and which content types it names |
| `PROVIDER_SETTINGS.md`, `PROVIDER_SETTINGS_SUMMARY.md` | The settings object of each platform, in full and at a glance |
| `INTEGRATION_SETTINGS_DISCOVERY.md` | Reading a channel's rules with `integrations:settings` |
| `INTEGRATION_TOOLS_WORKFLOW.md` | Running a channel's helpers with `integrations:trigger` |
| `CONTRIBUTING.md` | How to change the code, tests and documents |
| `PUBLISHING.md` | How the owner publishes a release |
| `CHANGELOG.md` | What each version changed, and what is not verified |
| `examples/` | Sample bodies and scripts; its own guides are `COMMAND_LINE_GUIDE.md` and `EXAMPLES.md` |

## Plugin folders and manifests

All of them name the version, and all of them must carry the same one (`test/package.test.mjs` checks it).

- `.claude-plugin/plugin.json` and `marketplace.json`: Claude Code. The plugin is named `ihateposting` and the marketplace `ihateposting-agent` (install: `ihateposting@ihateposting-agent`). They point at `skills/ihateposting-agent`; there is no MCP entry.
- `.cursor-plugin/` and `.grok-plugin/`: `plugin.json` (the skill, the logo, and a pointer to the folder's own `mcp.json`) and `marketplace.json`.
- `gemini-extension.json`: Gemini CLI. It names only the hosted MCP server, as `httpUrl`.
- `mcp.json`: the same server for any client that reads an `mcp.json`.
- `plugins/dsh-ihateposting/`: DeepSeek Harness. Its `cordis.patch.yml` adds a row that loads the plugin (which refuses to load without `IHATEPOSTING_API_KEY` and registers the skill) and a row for an MCP client that sends the key as `Authorization: Bearer <key>` to `https://app.ihateposting.com/api/mcp`. Its README says what was and was not verified, including that it has never run inside a real Harness.

The Cursor, Grok, Gemini and `mcp.json` entries use `https://app.ihateposting.com/api/mcp/oauth`, which signs a person in through the browser.

## No build step

Many command lines are compiled before they run; this one is not. What that means here:

| Where | What happens |
| --- | --- |
| Developing | You edit `src/...` and run `node bin/ihateposting-agent.mjs`. A linked command (`npm link`) sees the change at once. |
| Testing | The tests start `bin/ihateposting-agent.mjs` as a child process, so they run the code a person runs. |
| Packing | `npm pack` copies `bin`, `src`, the skill, README, CHANGELOG and LICENSE as they are. |
| Installing | `npm install -g ihateposting-agent` puts the same files on disk and links `bin`. |

That is why there is no `tsconfig.json`, no bundler configuration and no `dist/` folder.

## How a command travels

```text
what you type
    ↓
bin/ihateposting-agent.mjs          imports src/index.mjs
    ↓
src/index.mjs                       yargs: command, options, defaults, checks
    ↓
src/commands/<group>.mjs            the handler
    ↓
src/config.mjs                      saved sign-in, else the environment, else exit 1
    ↓
src/api.mjs                         one request, one answer
    ↓
the handler prints                  a header line and the JSON, or ❌ Failed to <what>: <why>
```

1. `bin/ihateposting-agent.mjs` imports `src/index.mjs`, which builds the command line and parses `process.argv`.
2. yargs picks the command, applies defaults, runs `.check()` and calls the handler. A refusal at this stage prints the command's usage and the reason on standard error and ends with exit code `1`; no request has been made.
3. The handler calls `getConfig()`. Nobody signed in ends the program with `1` before any request.
4. The handler builds its data (for `posts:create`, the body made from `-c`, `-m`, `--alt`, `-i`, `--date`, `--type`, `--delay`, `--shortLink` and `--settings`) and calls one `IHatePostingAPI` method.
5. `request()` sends it once and returns the parsed JSON, or throws.
6. The handler prints and ends. A thrown error becomes `❌ Failed to <what>: <why>` on standard error and exit code `1`.

`auth:login` and `auth:status` (in `auth.mjs`) and `upload` (in `api.mjs`) call `node-fetch` themselves instead of going through `request()`, because they need different headers or answers.

## Available commands

| Command | Handler | Route it asks | Header line |
| --- | --- | --- | --- |
| `posts:create` | `createPost` | `POST /public/v1/posts` | `✅ Post created successfully!` |
| `posts:list` | `listPosts` | `GET /public/v1/posts?startDate&endDate[&customer]` | `📋 Posts:` |
| `posts:delete <id>` | `deletePost` | `DELETE /public/v1/posts/<id>` | `✅ Post <id> deleted successfully!` (and no JSON) |
| `posts:missing <id>` | `getMissingContent` | `GET /public/v1/posts/<id>/missing` | none: JSON only |
| `posts:status <id>` | `changePostStatus` | `PUT /public/v1/posts/<id>/status` | `✅ Post <id> status changed to <status>` |
| `posts:settings <id>` | `updatePostSettings` | `PUT /public/v1/posts/<id>/settings` | `✅ Post <id> settings updated` |
| `posts:connect <id>` | `connectPost` | `PUT /public/v1/posts/<id>/release-id` | `✅ Post <id> connected to release <id>` |
| `integrations:list` | `listIntegrations` | `GET /public/v1/integrations[?group]` | `🔌 Connected Integrations:` |
| `integrations:groups` | `listGroups` | `GET /public/v1/groups` | `👥 Groups (Customers):` |
| `integrations:settings <id>` | `getIntegrationSettings` | `GET /public/v1/integration-settings/<id>` | `⚙️  Settings for integration: <id>` |
| `integrations:trigger <id> <method>` | `triggerIntegrationTool` | `POST /public/v1/integration-trigger/<id>` | `🔧 Tool result for <method>:` |
| `analytics:platform <id>` | `getAnalytics` | `GET /public/v1/analytics/<id>?date=<days>` | `📊 Analytics for integration: <id>` |
| `analytics:post <id>` | `getPostAnalytics` | `GET /public/v1/analytics/post/<id>?date=<days>` | `📊 Analytics for post: <id>` |
| `upload <file>` | `uploadFile` | `POST /public/v1/upload` | `✅ File uploaded successfully!` |
| `media:list` | `listMedia` | `GET /public/v1/media?page[&search]` | none: JSON only |
| `media:status <id>` | `getMediaStatus` | `GET /public/v1/media/<id>/status` | none: JSON only |
| `auth:login` | `authLogin` | `POST <auth server>/device/code`, then `POST <auth server>/device/token` | `🔐 Starting device authorization flow...` |
| `auth:logout` | `authLogout` | none | `✅ Credentials removed.` or `ℹ️  No stored credentials found.` |
| `auth:status` | `authStatus` | `GET /public/v1/integrations` | `🔐 Authentication method: ...` |

`auth:status` is the only command that ends with `0` when the server refuses the credentials; it says so in words. Every other failure ends with `1`. Every route above is relative to the API address (`https://app.ihateposting.com/api` by default).

## Environment variables

| Variable | Required | Default | Used for |
| --- | --- | --- | --- |
| `IHATEPOSTING_API_KEY` | only when nothing is saved | none | The key sent in `Authorization` |
| `IHATEPOSTING_API_URL` | no | `https://app.ihateposting.com/api` | The API address |
| `IHATEPOSTING_AUTH_SERVER` | no | `https://app.ihateposting.com/api` | The server `auth:login` asks for its code |

The program also reads the home folder (`HOME`, or `USERPROFILE` on Windows) to find `~/.ihateposting/credentials.json`.

## Dependencies

Runtime, from `package.json`:

- `yargs` (`^17.7.2`): the command line parser; it also makes the help text.
- `node-fetch` (`^3.3.2`): the HTTP client, including `FormData` for uploads.

Node's own modules do the rest: `node:fs`, `node:os`, `node:path` and `node:child_process`. There are no development dependencies: the tests use `node:test` and `node:assert`, which ship with Node. `engines.node` is `>=20`.

## Integration points

### The iHatePosting app's public API

Everything under `/public/v1` of the API address: the table of commands above lists each route. Authentication is the `Authorization` header with a workspace key or a token from the sign-in, sent as it is, without `Bearer`. A workspace key comes from **Settings > Agents / Dev** in the app.

### The app's sign-in routes

`auth:login` uses the app's device authorization. With the default address it posts to `https://app.ihateposting.com/api/device/code`, shows the code and the page it returns (`/device` on the app, where the person types the code and approves on the following `/oauth/authorize` page), and then posts to `.../api/device/token` every few seconds until the person has approved. These routes and pages have to be live on the app before `auth:login` works against it (see [PUBLISHING.md](PUBLISHING.md)).

### The hosted MCP server

Not used by the command line, but named by the manifests: `https://app.ihateposting.com/api/mcp/oauth` (browser sign-in) and `https://app.ihateposting.com/api/mcp` (a key as a bearer token).

### AI agent tools

The skill in `SKILL.md` is how Claude Code and the other agent tools learn the commands. `.github/workflows/sync-skill.yml` keeps the two copies equal to it, and `test/package.test.mjs` fails when they are not.

## Publishing

`package.json` lists `files`: `bin`, `src`, `SKILL.md`, `skills`, `README.md`, `CHANGELOG.md` and `LICENSE` (npm adds `package.json`). In the 0.1.0 dry run that is 16 files, 22.0 kB packed. Tests, examples, plugin folders, manifests, the guides and the workflows are not in the npm package; they live in the repository. `plugins/dsh-ihateposting/` is a separate package with its own `files` list that this package's release does not publish. [PUBLISHING.md](PUBLISHING.md) has the steps, the version rules and the two workflows.

## Testing

```bash
npm test                                    # everything, including the long planted-faults file
node --test test/cli.test.mjs               # one file
node --test "plugins/dsh-ihateposting/test/*.test.mjs"
```

No test needs a key, an account or the network beyond `127.0.0.1`. [HOW_TO_RUN.md](HOW_TO_RUN.md) explains each file.

## Limits a future version could change

None of these is scheduled. They are today's behaviour, kept on purpose to match the command lines this one follows, and each would be a decision for the owner:

- Requests have no timeout and answers have no size limit.
- A plain `http://` address, and a redirect that carries the key to another host, are accepted.
- An unknown command or option is ignored with exit code `0`.
- Ids are put into the address as typed.
- `-d` on `posts:create` gives the same delay to every part, the first included; a body file can give each part its own.
- The message for a missing sign-in mentions `--client-id` and `--client-secret`, which `auth:login` does not read.
- `upload` names a file by what follows the last `/` of the path, so Windows backslash paths need forward slashes.

## Support

- Issues: https://github.com/iHatePostingOrg/iHatePosting-Agent/issues
- Website: https://ihateposting.com
- Documents: [README.md](README.md), [SKILL.md](SKILL.md), [QUICK_START.md](QUICK_START.md), [FEATURES.md](FEATURES.md)
- A report that could expose a key or someone's posts does not belong in a public issue; see [CONTRIBUTING.md](CONTRIBUTING.md).
