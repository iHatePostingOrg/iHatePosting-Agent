# iHatePosting CLI - Project Structure

## Overview

The iHatePosting CLI is a complete command-line interface package for interacting with the iHatePosting social media scheduling API. It's designed for developers and AI agents to automate social media posting.

This repository holds five things:

1. **The command line**, `ihateposting-agent`: plain JavaScript ES modules (`bin/` and `src/`) that sign in, list channels, read each platform's rules, upload media, create and manage posts and read analytics, all through iHatePosting's public API.
2. **The skill**, `SKILL.md`: the text that teaches an AI agent which commands to run and in which order.
3. **Plugin folders** that register the skill, and iHatePosting's hosted MCP server where the tool supports it, with Claude Code, Cursor, Grok Build, Gemini CLI and DeepSeek Harness.
4. **Tests** that run the real program against fake servers on your own computer.
5. **Documents and examples**: this page and its neighbours, and sample post bodies and scripts.

The package name and the command are the same: `ihateposting-agent`. The licence is MIT. There is no build step, no bundler, no TypeScript and no monorepo: one `package.json` at the root, two runtime dependencies, Node.js 20 or newer.

## Directory Structure

```
iHatePosting-Agent/
├── bin/
│   └── ihateposting-agent.mjs        # Entry point: a shebang line and one import of src/index.mjs
│
├── src/                              # Source code
│   ├── index.mjs                     # Main CLI entry point
│   ├── api.mjs                       # API client for the iHatePosting API
│   ├── config.mjs                    # Configuration: which key and which address a command uses
│   ├── constants.mjs                 # Program name, default addresses, variable names, folder name, website
│   └── commands/                     # Command implementations
│       ├── auth.mjs                  # Sign-in commands (login, logout, status)
│       ├── posts.mjs                 # Posts management commands
│       ├── integrations.mjs          # Integrations listing, settings and tools
│       ├── analytics.mjs             # Analytics commands
│       └── upload.mjs                # Media upload and library commands
│
├── test/                             # Tests (Node's built-in runner)
│   ├── helpers.mjs                   # The fake API, a temporary home folder, a runner for the program
│   ├── cli.test.mjs                  # Every command against the fake API
│   ├── auth.test.mjs                 # The device sign-in against a fake sign-in server
│   ├── break.test.mjs                # Hostile or broken servers and input, many users, no key printed
│   ├── package.test.mjs              # Package contents, versions, manifests, skill copies, "no secret committed"
│   ├── docs.test.mjs                 # The Markdown documents: links, example files, no key or private path
│   ├── claude-plugin.test.mjs        # The layout of the Claude Code plugin folder
│   ├── names.test.mjs                # The names used in the manifests and the documents
│   ├── packs.test.mjs                # The copy-paste packs in SUBMISSIONS.md
│   ├── submissions.test.mjs          # The ChatGPT and Codex plugin folder, its ZIP script, server.json, PUBLISHING.md's submissions
│   ├── planted-faults.test.mjs       # Plants known faults in copies of the code and expects the tests to fail
│   ├── plugin-faults.mjs             # More planted faults, for the plugin folders (not a test file)
│   ├── submission-faults.mjs         # Planted faults for the submission files (not a test file)
│   └── refuse-network.cjs            # Preloaded by one test so that a request is recorded and refused
│
├── examples/                         # Usage examples
│   ├── README.md                     # The short index of this folder
│   ├── COMMAND_LINE_GUIDE.md         # A guide to each command with runnable examples
│   ├── EXAMPLES.md                   # A walk through the sample files below, and more scenarios
│   ├── basic-usage.sh                # Shell script example
│   ├── draft-from-flags.sh           # Drafts made with flags
│   ├── discover-and-draft.sh         # Read a channel's settings, then make a draft
│   ├── post-from-body-file.sh        # Send a body file after checking it
│   ├── thread-post.json              # Sample post body: a thread
│   ├── post-with-comments-and-media.json   # Sample post body: comments with media
│   ├── multi-platform-with-settings.json   # Sample post body: many platforms
│   ├── tiktok-video.json             # Sample post body: a TikTok video
│   ├── youtube-video.json            # Sample post body: a YouTube video
│   └── pinterest-pin.json            # Sample post body: a Pinterest pin
│
├── skills/
│   └── ihateposting/
│       └── SKILL.md                  # A copy of the root SKILL.md, for the plugin manifests to point at
│
├── plugins/
│   ├── claude-ihateposting/          # The Claude Code plugin, in a folder of its own without bin/
│   │   ├── .claude-plugin/plugin.json
│   │   ├── README.md
│   │   ├── LICENSE
│   │   ├── logo.png
│   │   └── skills/ihateposting/SKILL.md   # A copy of the skill
│   ├── chatgpt-ihateposting/         # The ChatGPT and Codex plugin for the hosted server (not in the npm package)
│   │   ├── plugin.json
│   │   ├── mcp.json
│   │   ├── README.md
│   │   ├── assets/                   # Two icons
│   │   └── skills/                   # Four skills: create-post-media, get-started, manage-scheduled-posts, schedule-posts
│   └── dsh-ihateposting/             # The DeepSeek Harness plugin: a separate small package
│       ├── cordis.patch.yml          # The two rows it adds to a Harness profile
│       ├── lib/                      # index.js (the plugin: settings, the service, the warning), skill.js (the short skill for the MCP tools)
│       ├── test/                     # index.test.mjs, stand-ins for the host's libraries, a package.json
│       ├── package.json
│       ├── README.md
│       └── LICENSE
│
├── .claude-plugin/                   # marketplace.json for Claude Code (its plugin is in plugins/claude-ihateposting)
├── .cursor-plugin/                   # plugin.json, marketplace.json and mcp.json for Cursor
├── .grok-plugin/                     # plugin.json, marketplace.json and mcp.json for Grok Build
│
├── .github/
│   └── workflows/
│       ├── publish-npm.yml           # Publishes to npm (runs only when started by hand)
│       └── sync-skill.yml            # Copies SKILL.md into the skill copies (runs only when started by hand)
│
├── assets/
│   └── logo.png                      # The logo the README, Cursor and Grok manifests use
│
├── scripts/
│   └── chatgpt-plugin-zip.mjs        # Checks plugins/chatgpt-ihateposting and builds dist/ihateposting-chatgpt-plugin.zip (uploads nothing)
│
├── package.json                      # Package configuration
├── server.json                       # A draft entry for the official MCP Registry (not published)
├── gemini-extension.json             # The extension manifest for Gemini CLI, with the hosted MCP server
├── mcp.json                          # The hosted MCP server's address, for any client that reads an mcp.json
│
├── README.md                         # Main documentation
├── SKILL.md                          # AI agent usage guide (the source of its copies)
├── QUICK_START.md                    # Quick start guide
├── CHANGELOG.md                      # Version history
├── PROJECT_STRUCTURE.md              # This file
├── SUMMARY.md, FEATURES.md, HOW_TO_RUN.md, SYNTAX_UPGRADE.md, SUPPORTED_FILE_TYPES.md,
├── PROVIDER_SETTINGS.md, PROVIDER_SETTINGS_SUMMARY.md, INTEGRATION_SETTINGS_DISCOVERY.md,
├── INTEGRATION_TOOLS_WORKFLOW.md, CONTRIBUTING.md, PUBLISHING.md, SUBMISSIONS.md
│                                     # The other guides (see Documentation Files below)
├── LICENSE                           # MIT
│
└── .gitignore                        # Git ignore rules (keys, environment files, credentials.json, node_modules)
```

`node_modules/` and `package-lock.json` appear after `npm install`; git ignores both. There is no `.npmignore`: the `files` list in `package.json` decides what is published.

## File Descriptions

### Source Files

#### `bin/ihateposting-agent.mjs`
- Two lines: `#!/usr/bin/env node` and `import "../src/index.mjs";`
- This is what `package.json`'s `bin` points at, so it is the file npm links when someone installs the package

#### `src/index.mjs`
- Main entry point for the CLI (`bin/ihateposting-agent.mjs` imports it)
- Uses `yargs` for command parsing
- Defines all available commands and their options
- Contains help text and usage examples
- Reads the version from `package.json` for `--version`
- Declares the 19 commands in the order the help shows them
- Holds the checks for `posts:create` (content or `--json`; `--integrations` and `--date` unless a body file is given)
- Ends the help with the website and the two ways to sign in
- Is not strict: a word that is not a command and an option that is not declared are accepted and ignored. That is the library's default, kept on purpose

#### `src/api.mjs`
- API client class `IHatePostingAPI`
- Handles the HTTP requests to the iHatePosting API (`auth:login` and `auth:status` make their own requests)
- Methods for:
  - Creating posts
  - Listing posts
  - Deleting posts
  - Changing a post's status and its settings
  - Connecting a post to its published content
  - Uploading files
  - Listing media and checking an uploaded file's status
  - Listing integrations and groups
  - Reading an integration's settings and triggering its tools
  - Reading a channel's and a post's analytics
- Error handling and response parsing: `request()` sends the key in `Authorization` exactly as it is, makes the request once, and returns the parsed JSON, or throws `Request failed: API Error (<status>): <the server's words>`. No timeout, no retry
- `upload` builds a `multipart/form-data` body with the field `file` (and `adjust` when asked). It fails with `Upload failed (<status>): ...`. Its `MIME_TYPES` table names the content type for each known extension (see [SUPPORTED_FILE_TYPES.md](SUPPORTED_FILE_TYPES.md))

#### `src/config.mjs`
- Configuration management
- Reads the saved sign-in first, then the environment variables `IHATEPOSTING_API_KEY` and `IHATEPOSTING_API_URL`
- Validates required settings (a saved sign-in or an API key); with neither, it says how to sign in and ends with exit code `1`
- The default address is not set here: it comes from `constants.mjs` and is applied by the API client

#### `src/constants.mjs`
- `PROGRAM`, `DEFAULT_API_URL` and `DEFAULT_AUTH_SERVER` (both `https://app.ihateposting.com/api`)
- The three variable names, `CREDENTIALS_FOLDER` (`.ihateposting`) and `WEBSITE`

#### `src/commands/posts.mjs`
- Post management commands implementation
- `createPost()` - Create new social media posts (turns the repeated `-c`, `-m` and `--alt` into the request body)
- `listPosts()` - List posts with filters
- `deletePost()` - Delete posts by ID
- `getMissingContent()` - List the platform's recent content for a post that lacks its platform ID
- `changePostStatus()` - Move a post between draft and schedule
- `updatePostSettings()` - Change a waiting post's platform settings
- `connectPost()` - Record which content is the post

#### `src/commands/integrations.mjs`
- Integration management
- `listIntegrations()` - Show connected accounts
- `listGroups()` - Show groups (customers)
- `getIntegrationSettings()` - Read a channel's rules, limits and settings schema
- `triggerIntegrationTool()` - Run a channel's tool (a board list, a room list, a company-page lookup)

#### `src/commands/upload.mjs`
- Media upload functionality
- `uploadFile()` - Upload a file (an image or a video) to iHatePosting
- `listMedia()` - Search the media library
- `getMediaStatus()` - Check whether an uploaded file is ready

#### `src/commands/analytics.mjs`
- Analytics retrieval
- `getAnalytics()` - A channel's analytics
- `getPostAnalytics()` - One post's analytics
- Seven days unless told otherwise

#### `src/commands/auth.mjs`
- Sign-in
- `authLogin()`, `authLogout()`, `authStatus()`, and `loadCredentials()` (used by `config.mjs`)
- Owns the saved file `~/.ihateposting/credentials.json`, written readable only by the person where the file system supports that
- Opens the browser with `open`, `start` or `xdg-open`

### Configuration Files

#### `package.json`
- Package name: `ihateposting-agent`
- Version: `0.1.0`
- Executable bin: `ihateposting-agent` → `bin/ihateposting-agent.mjs`
- Scripts: `test`, `chatgpt-plugin:zip`
- Files that are published: `bin`, `src`, `SKILL.md`, `skills`, `README.md`, `CHANGELOG.md` and `LICENSE`
- Repository and metadata information

There is no `tsconfig.json` and no `tsup.config.ts`: the code is plain JavaScript (ES modules) and has no build step.

### Documentation Files

#### `README.md`
- Main package documentation
- Installation instructions
- Usage examples
- API reference
- Development guide

#### `SKILL.md`
- Comprehensive guide for AI agents
- Usage patterns and workflows
- Command examples
- Best practices
- Error handling

#### `QUICK_START.md`
- Fast onboarding guide
- Installation steps
- Basic commands
- Common workflows
- Troubleshooting

#### `CHANGELOG.md`
- Version history
- Release notes
- Feature additions
- Bug fixes

#### `SUMMARY.md`
- A one-page summary of the whole repository

#### `FEATURES.md`
- Everything the program does, grouped by task

#### `HOW_TO_RUN.md`
- Ways to start the program, sign-in order, tests, development

#### `SYNTAX_UPGRADE.md`
- Habits that differ from other posting command lines, for moving scripts over

#### `SUPPORTED_FILE_TYPES.md`
- What `upload` does with a file and which content types it names

#### `PROVIDER_SETTINGS.md` and `PROVIDER_SETTINGS_SUMMARY.md`
- The settings object of each platform, in full and at a glance

#### `INTEGRATION_SETTINGS_DISCOVERY.md`
- Reading a channel's rules with `integrations:settings`

#### `INTEGRATION_TOOLS_WORKFLOW.md`
- Running a channel's helpers with `integrations:trigger`

#### `CONTRIBUTING.md`
- How to change the code, tests and documents

#### `PUBLISHING.md`
- How the owner publishes a release by hand, the overview of every place to be listed in, and npm's token and two-factor changes

#### `SUBMISSIONS.md`
- Copy-paste packs for four submissions: the Cursor Marketplace, the Claude plugin portal, DeepSeek Harness and the xAI marketplace, with the order to go in

#### `PROJECT_STRUCTURE.md`
- This file

### Example Files

#### `examples/basic-usage.sh`
- Bash script example
- Demonstrates the basic CLI workflow
- Checks the sign-in, lists integrations, reads one channel's rules, optionally uploads a picture and creates one draft post
- Nothing is deleted and nothing is published

#### `examples/draft-from-flags.sh`, `examples/discover-and-draft.sh` and `examples/post-from-body-file.sh`
- Three more Bash scripts: drafts made with flags, reading a channel's settings before drafting, and sending a body file after checking it
- They take ids and addresses from environment variables, hold no key, delete nothing and make drafts only

#### `examples/*.json`
- Six sample post bodies for `posts:create --json`: a thread, a post with comments and media, one announcement for several platforms, a TikTok video, a YouTube video and a Pinterest pin

#### `examples/README.md`, `examples/COMMAND_LINE_GUIDE.md` and `examples/EXAMPLES.md`
- The index of the folder, a guide to each command with runnable examples, and a walk through the sample files with more scenarios

## Build Process

There is no build step: the CLI is plain JavaScript (ES modules) that runs as it is written, so there is no `dist/` to produce.

### Development Build

- Nothing to watch or rebuild: you edit `src/...` and run `node bin/ihateposting-agent.mjs`
- A linked command (`npm link`) sees the change at once
- The tests start `bin/ihateposting-agent.mjs` as a child process, so they run the code a person runs

### Production Build

There is none:

1. `npm pack` copies `bin`, `src`, the skill, README, CHANGELOG and LICENSE as they are
2. `npm install -g ihateposting-agent` puts the same files on disk and links `bin`

### Output

- No `dist/` folder, no bundle and no source map are made
- The program that runs is the program you wrote: `bin/ihateposting-agent.mjs` and the nine files of `src/`
- The package packed for npm: 16 files, 22.0 kB in the 0.1.0 dry run

## Commands Architecture

### Command Flow

```
User Input
    ↓
index.mjs (yargs parser)
    ↓
Command Handler (posts.mjs, integrations.mjs, analytics.mjs, upload.mjs, auth.mjs)
    ↓
config.mjs (get API key)
    ↓
api.mjs (make API request)
    ↓
Response / Error
    ↓
Output to console
```

1. `bin/ihateposting-agent.mjs` imports `src/index.mjs`, which builds the command line and parses `process.argv`.
2. yargs picks the command, applies defaults, runs `.check()` and calls the handler. A refusal at this stage prints the command's usage and the reason on standard error and ends with exit code `1`; no request has been made.
3. The handler calls `getConfig()`. Nobody signed in ends the program with `1` before any request.
4. The handler builds its data (for `posts:create`, the body made from `-c`, `-m`, `--alt`, `-i`, `--date`, `--type`, `--delay`, `--shortLink` and `--settings`) and calls one `IHatePostingAPI` method.
5. `request()` sends it once and returns the parsed JSON, or throws.
6. The handler prints and ends. A thrown error becomes `❌ Failed to <what>: <why>` on standard error and exit code `1`.

`auth:login` and `auth:status` (in `auth.mjs`) and `upload` (in `api.mjs`) call `node-fetch` themselves instead of going through `request()`, because they need different headers or answers.

### Available Commands

1. **posts:create**
   - Options: `--content`, `--media`, `--alt`, `--integrations`, `--date`, `--type`, `--delay`, `--json`, `--shortLink`, `--settings`
   - Handler: `commands/posts.mjs::createPost()`
   - Route: `POST /public/v1/posts`
   - Prints: `✅ Post created successfully!` and the JSON

2. **posts:list**
   - Options: `--startDate`, `--endDate`, `--customer`
   - Handler: `commands/posts.mjs::listPosts()`
   - Route: `GET /public/v1/posts?startDate&endDate[&customer]`
   - Prints: `📋 Posts:` and the JSON

3. **posts:delete**
   - Positional: `<id>`
   - Handler: `commands/posts.mjs::deletePost()`
   - Route: `DELETE /public/v1/posts/<id>`
   - Prints: `✅ Post <id> deleted successfully!` (and no JSON)

4. **posts:missing**
   - Positional: `<id>`
   - Handler: `commands/posts.mjs::getMissingContent()`
   - Route: `GET /public/v1/posts/<id>/missing`
   - Prints: the JSON only

5. **posts:status**
   - Positional: `<id>`
   - Options: `--status` (`draft` or `schedule`, required)
   - Handler: `commands/posts.mjs::changePostStatus()`
   - Route: `PUT /public/v1/posts/<id>/status`
   - Prints: `✅ Post <id> status changed to <status>` and the JSON

6. **posts:settings**
   - Positional: `<id>`
   - Options: `--settings` (required)
   - Handler: `commands/posts.mjs::updatePostSettings()`
   - Route: `PUT /public/v1/posts/<id>/settings`
   - Prints: `✅ Post <id> settings updated` and the JSON

7. **posts:connect**
   - Positional: `<id>`
   - Options: `--release-id` (required)
   - Handler: `commands/posts.mjs::connectPost()`
   - Route: `PUT /public/v1/posts/<id>/release-id`
   - Prints: `✅ Post <id> connected to release <release-id>` and the JSON

8. **integrations:list**
   - Options: `--group`
   - Handler: `commands/integrations.mjs::listIntegrations()`
   - Route: `GET /public/v1/integrations[?group]`
   - Prints: `🔌 Connected Integrations:` and the JSON

9. **integrations:groups**
   - No options
   - Handler: `commands/integrations.mjs::listGroups()`
   - Route: `GET /public/v1/groups`
   - Prints: `👥 Groups (Customers):` and the JSON

10. **integrations:settings**
    - Positional: `<id>`
    - Handler: `commands/integrations.mjs::getIntegrationSettings()`
    - Route: `GET /public/v1/integration-settings/<id>`
    - Prints: `⚙️  Settings for integration: <id>` and the JSON

11. **integrations:trigger**
    - Positional: `<id> <method>`
    - Options: `--data` (`-d`)
    - Handler: `commands/integrations.mjs::triggerIntegrationTool()`
    - Route: `POST /public/v1/integration-trigger/<id>`
    - Prints: `🔧 Tool result for <method>:` and the JSON

12. **analytics:platform**
    - Positional: `<id>`
    - Options: `--date` (`-d`, a number of days, default 7)
    - Handler: `commands/analytics.mjs::getAnalytics()`
    - Route: `GET /public/v1/analytics/<id>?date=<days>`
    - Prints: `📊 Analytics for integration: <id>` and the JSON

13. **analytics:post**
    - Positional: `<id>`
    - Options: `--date` (`-d`, a number of days, default 7)
    - Handler: `commands/analytics.mjs::getPostAnalytics()`
    - Route: `GET /public/v1/analytics/post/<id>?date=<days>`
    - Prints: `📊 Analytics for post: <id>` and the JSON

14. **upload**
    - Positional: `<file>`
    - Options: `--adjust`
    - Handler: `commands/upload.mjs::uploadFile()`
    - Route: `POST /public/v1/upload`
    - Prints: `✅ File uploaded successfully!` and the JSON

15. **media:status**
    - Positional: `<id>`
    - Handler: `commands/upload.mjs::getMediaStatus()`
    - Route: `GET /public/v1/media/<id>/status`
    - Prints: the JSON only

16. **media:list**
    - Options: `--search` (`-s`), `--page` (`-p`)
    - Handler: `commands/upload.mjs::listMedia()`
    - Route: `GET /public/v1/media?page[&search]`
    - Prints: the JSON only

17. **auth:login**
    - Options: `--auth-server`
    - Handler: `commands/auth.mjs::authLogin()`
    - Route: `POST <auth server>/device/code`, then `POST <auth server>/device/token`
    - Prints: `🔐 Starting device authorization flow...`, the code and the page to open

18. **auth:logout**
    - No options
    - Handler: `commands/auth.mjs::authLogout()`
    - Route: none
    - Prints: `✅ Credentials removed.` or `ℹ️  No stored credentials found.`

19. **auth:status**
    - No options
    - Handler: `commands/auth.mjs::authStatus()`
    - Route: `GET /public/v1/integrations`
    - Prints: `🔐 Authentication method: ...` (a saved sign-in) or `🔑 Authentication method: ...` (a key), then whether the credentials are valid

`auth:status` is the only command that ends with `0` when the server refuses the credentials; it says so in words. Every other failure ends with `1`. Every route above is relative to the API address (`https://app.ihateposting.com/api` by default).

## Environment Variables

| Variable | Required | Default | Usage |
|----------|----------|---------|-------|
| `IHATEPOSTING_API_KEY` | ✅ Yes, when no sign-in is saved | - | Authentication token (sent in `Authorization`) |
| `IHATEPOSTING_API_URL` | ❌ No | `https://app.ihateposting.com/api` | Custom API endpoint |
| `IHATEPOSTING_AUTH_SERVER` | ❌ No | `https://app.ihateposting.com/api` | Custom auth server URL (where `auth:login` asks for its code) |

The program also reads the home folder (`HOME`, or `USERPROFILE` on Windows) to find `~/.ihateposting/credentials.json`.

## Dependencies

### Runtime Dependencies
- `yargs` (`^17.7.2`) - CLI argument parsing; it also makes the help text
- `node-fetch` (`^3.3.2`) - HTTP requests, including `FormData` for uploads
- Standard Node.js modules (`node:fs`, `node:os`, `node:path`, `node:child_process`)
- `engines.node` is `>=20`

### Dev Dependencies
There are none: the tests use `node:test` and `node:assert`, which ship with Node.

## Integration Points

### With Monorepo

There is no monorepo: this repository has one `package.json` at its root, no workspaces and no build scripts. The tests run with `npm test`.

### With iHatePosting API

1. **Endpoints Used**
   - `POST /public/v1/posts` - Create post
   - `GET /public/v1/posts` - List posts
   - `DELETE /public/v1/posts/:id` - Delete post
   - `PUT /public/v1/posts/:id/status` - Change a post's status (draft or schedule)
   - `PUT /public/v1/posts/:id/settings` - Update a post's provider settings (merged; unpublished only)
   - `GET /public/v1/posts/:id/missing` - Get missing content from the provider
   - `PUT /public/v1/posts/:id/release-id` - Update the release ID of a post
   - `GET /public/v1/integrations` - List integrations (optional `?group=` filter)
   - `GET /public/v1/groups` - List groups (customers)
   - `GET /public/v1/integration-settings/:id` - Get integration settings
   - `POST /public/v1/integration-trigger/:id` - Trigger integration tool
   - `GET /public/v1/analytics/:integration` - Get platform analytics
   - `GET /public/v1/analytics/post/:postId` - Get post analytics
   - `POST /public/v1/upload` - Upload media
   - `GET /public/v1/media` - List uploaded media (optional `?page=`, `?search=`)
   - `GET /public/v1/media/:id/status` - Status of a media uploaded with `adjust`

2. **Authentication**
   - A workspace key or a token from the sign-in, in the `Authorization` header, sent as it is, without `Bearer`
   - Configured through the environment variable `IHATEPOSTING_API_KEY` or by `auth:login`; a workspace key comes from **Settings > Agents / Dev** in the app

## Publishing

### To npm

```bash
npm publish --access public
```

This will:
1. Publish to npm with public access (there is nothing to build first)
2. Include only the files in the `files` list of `package.json`: `bin`, `src`, `SKILL.md`, `skills`, `README.md`, `CHANGELOG.md` and `LICENSE` (npm adds `package.json`)

The owner runs it by hand, from their own computer, signed in to npm with two-factor authentication; no script or workflow publishes. [PUBLISHING.md](PUBLISHING.md) has the steps, the version rules and the two workflows.

### Package Contents (via the `files` list)

**Included:**
- `bin/` - The entry point
- `src/` - The program
- `SKILL.md` and `skills/` - The skill
- `README.md`, `CHANGELOG.md` and `LICENSE` - Documentation and licence
- `package.json` - added by npm itself

**Excluded:**
- `test/` - Tests
- `examples/` - Examples
- `plugins/`, `.claude-plugin/`, `.cursor-plugin/`, `.grok-plugin/`, `gemini-extension.json`, `mcp.json`, `server.json`, `assets/` and `scripts/` - Plugin folders, manifests and helper files
- The guides (`PROJECT_STRUCTURE.md` and the other Markdown files) and `.github/`

In the 0.1.0 dry run that is 16 files, 22.0 kB packed. `plugins/dsh-ihateposting/` is a separate package with its own `files` list that this package's release does not publish.

## Testing

### Manual Testing

```bash
# Test help
node bin/ihateposting-agent.mjs --help

# Test without a key or a saved sign-in (should error)
node bin/ihateposting-agent.mjs posts:list

# Test with a key (requires valid key)
IHATEPOSTING_API_KEY=test node bin/ihateposting-agent.mjs integrations:list
```

A saved sign-in wins over the variable: run `node bin/ihateposting-agent.mjs auth:logout` first to test the key.

### Automated Testing

```bash
npm test                                    # everything, including the long planted-faults file
node --test test/cli.test.mjs               # one file
node --test "plugins/dsh-ihateposting/test/*.test.mjs"
```

- Tests of every command against a fake API on your own computer (`test/cli.test.mjs`)
- Tests of the device sign-in against a fake sign-in server (`test/auth.test.mjs`)
- Break-it tests: hostile or broken servers, enormous input, many people at once (`test/break.test.mjs`)
- Checks of the package, its manifests and its documents (`test/package.test.mjs`, `test/docs.test.mjs` and the others)
- A file that plants known faults in copies of the code and expects the tests to fail (`test/planted-faults.test.mjs`, ten minutes or more)

No test needs a key, an account or the network beyond `127.0.0.1`. The tests were run here on Windows with Node 24; nothing was run on macOS or Linux (unverified). [HOW_TO_RUN.md](HOW_TO_RUN.md) explains each file.

## Future Enhancements

None of these is scheduled. They are today's behaviour, kept on purpose to match the command lines this one follows, and each would be a decision for the owner:

1. **More Commands**
   - No command edits the text of an existing post (`posts:status` and `posts:settings` change only its status and its settings)
   - There are no clipping commands

2. **Features**
   - Requests have no timeout and answers have no size limit
   - A plain `http://` address, and a redirect that carries the key to another host, are accepted
   - An unknown command or option is ignored with exit code `0`
   - Ids are put into the address as typed
   - `-d` on `posts:create` gives the same delay to every part, the first included; a body file can give each part its own
   - `upload` names a file by what follows the last `/` of the path, so Windows backslash paths need forward slashes

## Support

- **Issues:** https://github.com/iHatePostingOrg/iHatePosting-Agent/issues
- **Docs:** See README.md, SKILL.md, QUICK_START.md, FEATURES.md
- **Website:** https://ihateposting.com
- A report that could expose a key or someone's posts does not belong in a public issue; see [CONTRIBUTING.md](CONTRIBUTING.md).

## Sections that were in this file before it followed the reference

### The tests

`npm test` runs `test/*.test.mjs` and the plugin's tests with Node's built-in runner, one file at a time. `helpers.mjs` is not a test. It exports:

- `startFakeApi(handler)`: a local server that keeps every request it gets (method, path, query, headers, body) and answers what the handler says.
- `run(argv, options)`: starts the program as a child process with a home folder of its own and none of the three `IHATEPOSTING_*` variables unless the test passes them.
- `jsonOf(stdout)`: reads the JSON that follows a header line.
- `credentialsFile(home)`, `tempDir()`, `KEY`, `TOKEN`, `BIN` and `ROOT`.

`planted-faults.test.mjs` copies the whole repository (without `.git`) once per fault, changes one thing in the copy, runs the other test files there, and demands a failure. A fault whose text is no longer in its file is itself a failure, so the list cannot rot quietly. See [HOW_TO_RUN.md](HOW_TO_RUN.md) for the commands and what each file needs.

### Plugin folders and manifests

All of them name the version, and all of them must carry the same one (`test/package.test.mjs` checks it).

- `.claude-plugin/marketplace.json` and `plugins/claude-ihateposting/`: Claude Code. The marketplace is named `ihateposting-agent` and the plugin `ihateposting` (install: `ihateposting@ihateposting-agent`). The entry's source is the relative path `./plugins/claude-ihateposting`, a folder of its own that holds the plugin's manifest, a README, the licence, the logo and the skill (a copy); it has no `bin/`, because claude.ai and Cowork refuse a plugin that has one. There is no MCP entry.
- `.cursor-plugin/` and `.grok-plugin/`: `plugin.json` (the skill, the logo, and a pointer to the folder's own `mcp.json`) and `marketplace.json`.
- `gemini-extension.json`: Gemini CLI. It names only the hosted MCP server, as `httpUrl`.
- `mcp.json`: the same server for any client that reads an `mcp.json`.
- `plugins/chatgpt-ihateposting/`: the package for OpenAI's plugin directory (ChatGPT and Codex). It talks to the hosted server only, so its skills never use the command line. `npm run chatgpt-plugin:zip` checks it and builds the ZIP the owner uploads; `PUBLISHING.md` ("Submissions") has the steps.
- `plugins/dsh-ihateposting/`: DeepSeek Harness. Its `cordis.patch.yml` adds a row that loads the plugin (four settings: the variable that holds the key, an inline key, the API address and a skill switch; it provides the service `ihateposting` and registers a short skill, and with no key it only warns) and a row for an MCP client that reads the address and the `Authorization: Bearer <key>` header from that service (by default `https://app.ihateposting.com/api/mcp`). Its README says what was and was not verified, including that it has never run inside a real Harness.

The Cursor, Grok, Gemini and `mcp.json` entries use `https://app.ihateposting.com/api/mcp/oauth`, which signs a person in through the browser.

### The app's sign-in routes

`auth:login` uses the app's device authorization. With the default address it posts to `https://app.ihateposting.com/api/device/code`, shows the code and the page it returns (`/device` on the app, where the person types the code and approves on the following `/oauth/authorize` page), and then posts to `.../api/device/token` every few seconds until the person has approved. These routes and pages have to be live on the app before `auth:login` works against it (see [PUBLISHING.md](PUBLISHING.md)).

### The hosted MCP server

Not used by the command line, but named by the manifests: `https://app.ihateposting.com/api/mcp/oauth` (browser sign-in) and `https://app.ihateposting.com/api/mcp` (a key as a bearer token).

### AI agent tools

The skill in `SKILL.md` is how Claude Code and the other agent tools learn the commands. It exists in three copies: the root `SKILL.md`, `skills/ihateposting/SKILL.md` and `plugins/claude-ihateposting/skills/ihateposting/SKILL.md`. `.github/workflows/sync-skill.yml` can copy the root file over `skills/ihateposting/SKILL.md` (not over the Claude plugin's copy), but it runs only when started by hand, and `test/package.test.mjs` fails when the copies differ.
