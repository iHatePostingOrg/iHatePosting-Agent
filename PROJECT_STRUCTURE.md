# Project structure

A map of the repository: what each file and folder is for, how a command travels through the code, and what ends up in the published package.

## The tree

```text
iHatePosting-Agent/
├── bin/
│   └── ihateposting-agent.mjs        entry point (shebang line; imports src/index.mjs)
├── src/
│   ├── index.mjs                     command wiring with yargs: names, options, defaults, checks, examples, help
│   ├── api.mjs                       the API client: one request method and one method per endpoint, upload, content types
│   ├── config.mjs                    which key and which address a command uses
│   ├── constants.mjs                 program name, default addresses, variable names, folder name, website
│   └── commands/
│       ├── auth.mjs                  auth:login, auth:logout, auth:status, and the saved sign-in file
│       ├── posts.mjs                 posts:create, :list, :delete, :missing, :status, :settings, :connect
│       ├── integrations.mjs          integrations:list, :groups, :settings, :trigger
│       ├── analytics.mjs             analytics:platform, analytics:post
│       └── upload.mjs                upload, media:list, media:status
├── test/
│   ├── helpers.mjs                   the fake API, a temporary home folder, and a runner for the program
│   ├── cli.test.mjs                  every command against the fake API
│   ├── auth.test.mjs                 the device sign-in against a fake sign-in server
│   ├── break.test.mjs                hostile or broken servers and input, many users, no key printed
│   ├── package.test.mjs              package, manifests, skill copy and "no secret committed" checks
│   └── planted-faults.test.mjs       plants known faults in copies of the code and expects the tests to fail
├── examples/                         post bodies (.json) and scripts (.sh) to copy; examples/README.md says what each is
├── skills/
│   └── ihateposting-agent/
│       └── SKILL.md                  the skill, a copy of the root SKILL.md for the plugin folders
├── plugins/
│   └── dsh-ihateposting/             a separate small package (own package.json, LICENSE, README, tests) that connects
│                                     the DeepSeek Harness (`dsh`) to the hosted MCP server and registers the skill
├── .claude-plugin/                   plugin.json and marketplace.json for Claude Code
├── .cursor-plugin/                   plugin.json, marketplace.json and mcp.json for Cursor
├── .grok-plugin/                     plugin.json, marketplace.json and mcp.json for Grok
├── .github/
│   └── workflows/
│       ├── publish-npm.yml           publishes to npm when a (non-pre-)release is published
│       └── sync-skill.yml            copies SKILL.md into skills/ihateposting-agent/ on a release or by hand
├── assets/
│   └── logo.png                      the logo the Cursor and Grok manifests point at
├── gemini-extension.json             manifest for Gemini CLI, with the hosted MCP server
├── mcp.json                          the hosted MCP server's address, for MCP clients
├── SKILL.md                          the skill that teaches an AI agent the commands (the source of the copy above)
├── README.md                         overview, install, sign-in, commands, limits
├── CHANGELOG.md                      what changed in each version
├── PUBLISHING.md                     how a release is made by hand
├── LICENSE                           MIT
├── package.json                      name, version, bin, files, scripts, dependencies
├── .gitignore                        keeps keys, environment files, credentials.json and node_modules out of git
└── the guides: QUICK_START.md, HOW_TO_RUN.md, FEATURES.md, SUMMARY.md, SYNTAX_UPGRADE.md, SUPPORTED_FILE_TYPES.md,
    PROVIDER_SETTINGS.md, PROVIDER_SETTINGS_SUMMARY.md, INTEGRATION_SETTINGS_DISCOVERY.md,
    INTEGRATION_TOOLS_WORKFLOW.md, CONTRIBUTING.md, and this file
```

`node_modules/` and `package-lock.json` exist after `npm install`; both are ignored by git.

## How a command travels

1. `bin/ihateposting-agent.mjs` imports `src/index.mjs`, which builds the command line with yargs and parses `process.argv`.
2. yargs matches the command name, applies defaults, runs the `.check()` rules (for `posts:create`: content or `--json`, `--integrations` and `--date` unless a body file is given) and calls the command's handler. Failures at this stage print the command's usage on standard error and end with exit code `1`.
3. The handler calls `getConfig()` (`src/config.mjs`): the saved sign-in first (`loadCredentials()` in `src/commands/auth.mjs`), then `IHATEPOSTING_API_KEY` and `IHATEPOSTING_API_URL`. With neither, it prints how to sign in and ends with `1`.
4. The handler builds the request data (for example, `posts:create` turns `-c`, `-m`, `--alt`, `-i`, `--settings` into the body) and calls one method of `IHatePostingAPI` (`src/api.mjs`).
5. `IHatePostingAPI.request()` adds the address to the endpoint path, sends the key in the `Authorization` header, makes the request once, and returns the parsed JSON, or throws `Request failed: API Error (<status>): <the server's words>`.
6. The handler prints its header line and the JSON, or `❌ Failed to <what>: <why>` and `process.exit(1)`.

`auth:login` and `auth:status` (in `src/commands/auth.mjs`) and the upload method (in `src/api.mjs`) call `node-fetch` themselves instead of going through `request()`.

## The source files

- **`src/index.mjs`**: the one place where commands, options, short names, defaults, choices, examples and the help text are declared. It reads the version from `package.json` for `--version`. Words that are not commands, and options that are not declared, are accepted and ignored (yargs' default).
- **`src/api.mjs`**: the `IHatePostingAPI` class. Routes it uses: `/public/v1/posts` (create, list), `/public/v1/posts/<id>` (delete), `/public/v1/posts/<id>/missing`, `.../release-id`, `.../status`, `.../settings`, `/public/v1/analytics/<id>`, `/public/v1/analytics/post/<id>`, `/public/v1/integrations`, `/public/v1/groups`, `/public/v1/integration-settings/<id>`, `/public/v1/integration-trigger/<id>`, `/public/v1/media`, `/public/v1/media/<id>/status`, `/public/v1/upload`. Its `MIME_TYPES` table names the content type sent for each file extension (see [SUPPORTED_FILE_TYPES.md](SUPPORTED_FILE_TYPES.md)).
- **`src/config.mjs`**: the rule "saved sign-in, then environment, else a message".
- **`src/constants.mjs`**: `PROGRAM`, the default API address and sign-in address, the three variable names, the credentials folder name (`.ihateposting`) and the website shown in the help.
- **`src/commands/*.mjs`**: the handlers, one file per group, each printing its own header lines.

## Tests

`npm test` runs `test/*.test.mjs` with Node's built-in runner, one file at a time. `test/helpers.mjs` is not a test: it provides `startFakeApi()` (a local server that records every request and answers as the test says), `run()` (starts the program as a child process with a home folder of its own and none of the three environment variables unless given) and `jsonOf()` (reads the JSON that follows a header line). See [HOW_TO_RUN.md](HOW_TO_RUN.md) for what each file covers and what they need.

## What is published

`package.json` lists `files`: `bin`, `src`, `SKILL.md`, `skills`, `README.md`, `CHANGELOG.md` and `LICENSE` (npm adds `package.json`). So the tests, the examples, the plugin manifests, the `plugins/` folder, the guides and the workflows are not in the npm package; they live in the repository.

`plugins/dsh-ihateposting/` has a `package.json` of its own, with its own `files` list and its own tests (`node --test "plugins/dsh-ihateposting/test/*.test.mjs"` from the repository root); the root `npm test` does not run them. Its README says what was and was not verified about it, including that it has not been run inside a real `dsh`.

## The release workflows

- `publish-npm.yml` runs when a GitHub release is published (not for pre-releases): it checks that the tag is `v` plus the version in `package.json`, runs `npm install && npm test`, and then `npm publish --access public` with the `NPM_TOKEN` secret.
- `sync-skill.yml` copies `SKILL.md` into `skills/ihateposting-agent/SKILL.md` on a release or when started by hand, and commits the change to `main`.

`PUBLISHING.md` describes the manual steps around them. The repository's own notes say the workflows have not been run.

## Agent tool manifests

They point at the skill in `skills/ihateposting-agent` and, for every tool except Claude Code, also at the hosted MCP server at `https://app.ihateposting.com/api/mcp/oauth`.

- `.claude-plugin/plugin.json` and `marketplace.json`: Claude Code (skill only).
- `.cursor-plugin/` and `.grok-plugin/`: `plugin.json` (skill, logo, and a pointer to the folder's own `mcp.json`) and `marketplace.json`.
- `gemini-extension.json`: Gemini CLI, with the MCP server as `httpUrl`.
- `mcp.json`: the same MCP server for any client that reads an `mcp.json`.

The version number appears in `package.json`, in the plugin manifests and in the newest `CHANGELOG.md` entry; `test/package.test.mjs` is where that consistency is checked.
