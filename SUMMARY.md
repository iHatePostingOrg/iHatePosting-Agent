# iHatePosting CLI - Creation Summary

## ✅ What Was Created

A complete CLI package for the iHatePosting API has been successfully created at the root of this repository.

`ihateposting` is the command line for iHatePosting, a social-media scheduling app. It talks to the app's public API, so a person, a script or an AI agent can do from a terminal what the app does in a browser: list connected channels, read each platform's rules, upload media, schedule or draft posts, change them, and read analytics.

The repository holds four things:

- the **command line** itself (plain JavaScript, no build step);
- the **skill** (`SKILL.md`), a text that teaches an AI agent to drive the command line;
- the **plugin folders** that hand the skill, and the hosted MCP server, to Claude Code, Cursor, Grok Build, Gemini CLI and DeepSeek Harness;
- the **guides, examples and tests** around them.

### Package Details

- **Package Name:** `ihateposting`
- **Version:** 0.1.0
- **Executable:** `ihateposting` command
- **Language:** JavaScript, ES modules (`.mjs`), no TypeScript, no bundler
- **Runtime:** Node.js 20 or newer
- **Dependencies:** `yargs` (the command line parser) and `node-fetch` (requests); nothing else
- **Default API address:** `https://app.ihateposting.com/api`
- **Lines of Code:** 1,249 lines in `src/` (plus the two-line entry point in `bin/`)
- **Package Size:** about 50 kB packed (16 files, 49.7 kB when 0.1.0 was published)
- **License:** MIT

## 📦 Package Structure

```
iHatePosting-Agent/
├── bin/
│   └── ihateposting.mjs        # Entry point (a shebang line and one import)
│
├── src/                              # Source code (1,249 lines)
│   ├── index.mjs                     # CLI entry point with yargs
│   ├── api.mjs                       # iHatePosting API client
│   ├── config.mjs                    # Which key and which address a command uses
│   ├── constants.mjs                 # Names, addresses and variable names
│   └── commands/
│       ├── auth.mjs                  # Sign-in
│       ├── posts.mjs                 # Post management
│       ├── integrations.mjs          # Integration listing, settings and tools
│       ├── analytics.mjs             # Analytics
│       └── upload.mjs                # Media upload and library
│
├── test/                             # Tests that run the real program against fake servers
│
├── examples/                         # Usage examples
│   ├── basic-usage.sh                # Bash example (three more scripts, six sample post bodies and two guides)
│   └── ...
│
├── skills/ihateposting/              # The skill as the plugin folders read it
├── plugins/                          # claude-ihateposting, chatgpt-ihateposting, dsh-ihateposting
├── .claude-plugin/ .cursor-plugin/ .grok-plugin/ gemini-extension.json mcp.json server.json
├── .github/workflows/                # publish-npm.yml and sync-skill.yml (both run only when started by hand)
├── assets/logo.png                   # The logo
│
├── Documentation (17 files)
│   ├── README.md                     # Main documentation
│   ├── SKILL.md                      # AI agent guide
│   ├── QUICK_START.md                # Quick start guide
│   ├── CHANGELOG.md                  # Version history
│   ├── PROJECT_STRUCTURE.md          # Architecture docs
│   ├── SUMMARY.md                    # This file
│   ├── FEATURES.md                   # Everything the program does, grouped by task
│   ├── HOW_TO_RUN.md                 # Ways to start the program, the tests, troubleshooting
│   ├── SYNTAX_UPGRADE.md             # Habits of this command line, for moving scripts over
│   ├── SUPPORTED_FILE_TYPES.md       # What upload does with a file
│   ├── PROVIDER_SETTINGS.md          # Each platform's settings, key by key
│   ├── PROVIDER_SETTINGS_SUMMARY.md  # The same on one page
│   ├── INTEGRATION_SETTINGS_DISCOVERY.md   # Reading a channel's rules and schema
│   ├── INTEGRATION_TOOLS_WORKFLOW.md       # Channel helpers, step by step
│   ├── CONTRIBUTING.md               # Setup, style, tests, the pull request checklist
│   ├── PUBLISHING.md                 # How a release is made, and where else to be listed
│   └── SUBMISSIONS.md                # Copy-paste packs for four submissions
│
└── Configuration
    ├── package.json                  # Package config
    └── .gitignore                    # Git ignore
```

## 🚀 Features Implemented

### Commands

Nineteen commands. `ihateposting <command> --help` shows each one's options.

1. **posts:create** - Create social media posts
   - ✅ Content input (`-c`, repeated for comments and threads)
   - ✅ Integration selection (`-i`, one or several channels)
   - ✅ Scheduled posting (`-s`, required) and drafts (`-t draft`)
   - ✅ Media attachment (`-m`) with alt texts (`--alt`)
   - ✅ Platform-specific settings (`--settings`) and a whole body from a file (`--json`)

2. **posts:list** - List all posts
   - ✅ A date window (default: 30 days back to 30 days ahead)
   - ✅ Customer filter
   - ✅ Each post comes with its current settings

3. **posts:delete** - Delete posts by ID
   - ✅ ID-based deletion
   - ✅ Confirmation messages

4. **posts:missing** - List the platform's recent content for a post without its platform ID
   - ✅ Returns `{id, url}` items

5. **posts:status** - Change a post's status between draft and schedule
   - ✅ Move a scheduled post back to a draft
   - ✅ Promote a draft into the publishing queue

6. **posts:settings** - Change a waiting post's platform settings
   - ✅ Partial settings: only the keys you pass change
   - ✅ Unpublished (draft or scheduled) posts only

7. **posts:connect** - Connect a post to its published content
   - ✅ Records the platform's ID (`--release-id`)

8. **integrations:list** - Show connected accounts
   - ✅ List all integrations
   - ✅ Show provider info
   - ✅ Filter by group (customer)

9. **integrations:groups** - List groups (customers)
   - ✅ Returns `{id, name}`

10. **integrations:settings** - Read a channel's rules
    - ✅ Character limits, required settings and available tools

11. **integrations:trigger** - Run a channel's tool to fetch additional data
    - ✅ Pinterest boards, Slack and Discord channels, LinkedIn company pages
    - ✅ Data for the tool with `-d`

12. **analytics:platform** - A channel's analytics
    - ✅ Over a number of days (default 7)

13. **analytics:post** - One post's analytics
    - ✅ Over a number of days (default 7)

14. **upload** - Upload media files
    - ✅ Images (PNG, JPG, JPEG, GIF) and videos (MP4)
    - ✅ `--adjust` is accepted (iHatePosting does no adjusting)

15. **media:status** - Check an upload's status
    - ✅ `ready` straight away

16. **media:list** - List media already uploaded
    - ✅ Newest first, 18 per page
    - ✅ Search by original file name (`-s`) and page number (`-p`)

17. **auth:login** - Sign in with a one-time code (OAuth2 device flow)
    - ✅ Shows a code and opens the browser
    - ✅ Saves the token in `~/.ihateposting/credentials.json`

18. **auth:logout** - Forget the saved sign-in
    - ✅ Removes the saved file

19. **auth:status** - Show current authentication status
    - ✅ The method (a saved sign-in or the key) and whether the server still accepts it

### Technical Features

- ✅ Environment variable configuration (IHATEPOSTING_API_KEY)
- ✅ Custom API URL support (IHATEPOSTING_API_URL)
- ✅ A saved OAuth2 sign-in that wins over the key
- ✅ Error handling: a failure is `❌ Failed to <what>: <why>` on standard error and exit code `1`
- ✅ User-friendly error messages with emojis
- ✅ JSON output for programmatic parsing (after one header line)
- ✅ Executable shebang for direct execution
- ✅ Plain JavaScript (ES modules), no build step

## 📚 Documentation Created

1. **README.md** (Primary documentation)
   - Installation instructions
   - Usage examples
   - API reference
   - Development guide

2. **SKILL.md** (AI Agent Guide)
   - Comprehensive patterns for AI agents
   - Usage examples
   - Workflow suggestions
   - Best practices
   - Error handling

3. **QUICK_START.md**
   - Fast onboarding
   - Common workflows
   - Troubleshooting
   - Tips & tricks

4. **CHANGELOG.md**
   - Version 0.1.0 release notes
   - Feature list

5. **PROJECT_STRUCTURE.md**
   - Architecture overview
   - File descriptions
   - Build process (there is none)
   - Integration points

6. **FEATURES.md**, **HOW_TO_RUN.md** and **SYNTAX_UPGRADE.md**
   - Every command grouped by what you want to do
   - Running from a clone, other servers, the tests, troubleshooting
   - The habits of this command line, for people moving scripts over

7. **PROVIDER_SETTINGS.md**, **PROVIDER_SETTINGS_SUMMARY.md**, **INTEGRATION_SETTINGS_DISCOVERY.md**, **INTEGRATION_TOOLS_WORKFLOW.md** and **SUPPORTED_FILE_TYPES.md**
   - Each platform's settings, key by key and on one page
   - Reading a channel's rules and schema
   - Channel helpers, step by step
   - What `upload` does with a file

8. **CONTRIBUTING.md**, **PUBLISHING.md** and **SUBMISSIONS.md**
   - Setup, style, tests and the pull request checklist
   - How a release is made (by hand, with two-factor authentication), and where else to be listed
   - Copy-paste packs for the Cursor Marketplace, the Claude plugin portal, DeepSeek Harness and the xAI marketplace

9. **examples/COMMAND_LINE_GUIDE.md**, **examples/EXAMPLES.md** and **examples/README.md**
   - Every command's syntax, one by one
   - Worked examples
   - What each sample body and script is for

10. **plugins/dsh-ihateposting/README.md**
    - The DeepSeek Harness plugin and what was verified

## 🔧 Build System Integration

There is no build system: the CLI is plain JavaScript (ES modules) that runs as it is written.

### Root package.json Scripts Added

There is no monorepo root; the one `package.json` has these scripts:

```json
{
  "test": "node --test --test-concurrency=1 \"test/*.test.mjs\" \"plugins/dsh-ihateposting/test/*.test.mjs\"",
  "chatgpt-plugin:zip": "node scripts/chatgpt-plugin-zip.mjs"
}
```

### CLI Package Scripts

The command line is the package at the root, so these are the same two scripts. There is no `dev`, `build`, `start` or `publish-cli` script: the program runs as it is written (`node bin/ihateposting.mjs`), and it is published by hand with `npm publish --access public`.

## 🎯 Usage Examples

### Basic Usage

```bash
# Set API key
export IHATEPOSTING_API_KEY=your_api_key

# Create a post (a draft: the date is required)
ihateposting posts:create -c "Hello World!" -s "2030-01-01T09:00:00Z" -t draft -i "x-123"

# List posts
ihateposting posts:list

# Upload media
ihateposting upload ./image.png
```

### AI Agent Usage

```bash
# Post to social media
export IHATEPOSTING_API_KEY="your_key"
ihateposting posts:create -c "Your content here" -s "2030-01-01T09:00:00Z" -t draft -i "x-123"
```

## ✨ Example Files

1. **basic-usage.sh**
   - Shell script demonstration
   - A first tour: sign-in check, channels, a channel's rules, an optional upload, one draft, the post list
   - Stops at the first error, and needs `CHANNEL_ID`

2. **draft-from-flags.sh**, **discover-and-draft.sh** and **post-from-body-file.sh**
   - Drafts made with flags: a thread, comments with their own pictures, alt text and settings
   - Reading a channel's settings, optionally running one helper and making a draft
   - Sending a body file after checking it

3. **Sample post bodies** (`.json`)
   - A thread, a post with comments and media, one announcement for several platforms, a TikTok video, a YouTube video and a Pinterest pin

The scripts take ids from environment variables, hold no key, delete nothing and make drafts only. [`examples/`](examples/) has them all.

## 🧪 Testing

### Manual Testing Completed

```bash
✅ ihateposting --help - lists the 19 commands
✅ ihateposting --version - 0.1.0
✅ ihateposting <command> --help - works for all 19 commands
```

### Test Results

The automated tests (`npm test`) use Node's built-in runner and need no network, no key and no account. No result is written down here, because it changes with every run; the tests were run on Windows with Node 24, and nothing was run on macOS or Linux (unverified). See "How it is tested" at the end of this page.

## 📋 Checklist

- ✅ CLI package created at the root of the repository
- ✅ Package name is "ihateposting"
- ✅ Uses IHATEPOSTING_API_KEY environment variable
- ✅ Integrates with iHatePosting public API
- ✅ Built for AI agent usage
- ✅ SKILL.md created with comprehensive guide
- ✅ README.md with full documentation
- ✅ Executable entry point (`bin/ihateposting.mjs`, with a shebang)
- ✅ Examples provided
- ✅ Error handling implemented
- ✅ Help text for every command

## 🚦 Next Steps

### To Use Locally

```bash
# Run it from a clone (there is no build)
node bin/ihateposting.mjs --help

# Link globally (optional)
npm link

# Use anywhere
ihateposting --help
```

### To Publish to npm

```bash
# From the repository root
npm test
npm publish --access public
```

The owner publishes by hand, with two-factor authentication; [PUBLISHING.md](PUBLISHING.md) has the checklist.

### To Use in AI Agents

1. Install: `npm install -g ihateposting`
2. Sign in with `ihateposting auth:login`, or set the API key: `export IHATEPOSTING_API_KEY=your_key`
3. Use commands programmatically
4. Parse JSON output (skip the header line with `tail -n +2`)
5. See SKILL.md for patterns

## 📊 Statistics

- **Source Code Files:** 10 (`bin/` 1, `src/` 9)
- **Test Files:** 10 (`test/*.test.mjs`), plus the DeepSeek Harness plugin's own
- **Documentation Files:** 17 at the root, and 3 in `examples/`
- **Example Files:** 10 (4 scripts and 6 sample post bodies)
- **Total Lines of Code:** 1,249 in `src/`
- **Package Size:** about 50 kB packed (16 files, 49.7 kB when 0.1.0 was published)

## 🎉 Summary

A complete CLI tool for iHatePosting has been created with:

- ✅ 19 commands: sign in, discover, upload, post and read analytics
- ✅ Comprehensive documentation for users and AI agents
- ✅ Working examples
- ✅ No build system to maintain: plain JavaScript that runs as it is written
- ✅ Plugin folders for Claude Code, Cursor, Grok Build, Gemini CLI, DeepSeek Harness and ChatGPT and Codex
- ✅ Published to npm as 0.1.0, by hand

The CLI is installed with `npm install -g ihateposting`, and a new version is published to npm whenever the owner is ready!

## Sections that were in this file before it followed the reference

### How a command runs

1. `bin/ihateposting.mjs` imports `src/index.mjs`, which declares every command with `yargs` and parses the command line.
2. `yargs` fills in defaults and runs the checks. For `posts:create` that means: a text (or `--json`), a channel and a date. A failed check prints the command's usage on standard error and ends with exit code `1`, without asking the server.
3. The handler asks `getConfig()` for a key and an address: a saved sign-in first, then `IHATEPOSTING_API_KEY` and `IHATEPOSTING_API_URL`. With neither, it says how to sign in and ends with exit code `1`.
4. The handler builds the request and calls one method of the API client.
5. The client sends the key in the `Authorization` header exactly as it is, makes the request once, and returns the JSON, or fails with `Request failed: API Error (<status>): <the server's words>`.
6. The handler prints a header line and the JSON, or `❌ Failed to <what>: <why>` and exit code `1`.

`auth:login`, `auth:status` and the upload make their own requests instead of going through the shared method, but follow the same printing habits.

`--help`, `--version` and `<command> --help` need no sign-in. Every command except the three `auth:` ones does.

### What a command prints

| Commands | Standard output | On failure |
| --- | --- | --- |
| `integrations:*`, `posts:create`, `posts:list`, `posts:status`, `posts:settings`, `posts:connect`, `upload`, `analytics:*` | one header line, then JSON | `❌ Failed to <what>: <why>` on standard error, exit code `1` |
| `posts:delete` | the header line only | the same |
| `posts:missing`, `media:list`, `media:status` | JSON only | the same |
| `auth:status` | a few status lines | it reports and ends with exit code `0` |
| `auth:login`, `auth:logout` | progress or one status line | exit code `1` when the sign-in fails |

### What it can do

**Sign in two ways.** A one-time code you approve in a browser (`auth:login`), or a workspace key in `IHATEPOSTING_API_KEY`. A saved sign-in wins over the key. The saved token lives in `~/.ihateposting/credentials.json`.

**Post to any channel the workspace has.** One command can address several channels, make threads and comments (every further `-c`), pair each part with its own media (`-m`) and alt texts (`--alt`), carry a platform's own `--settings`, and be a draft (`-t draft`) instead of scheduled. A whole request can come from a file with `--json`.

**Discover before posting.** `integrations:settings` answers a channel's rules in words, its longest text, its settings schema and its helpers. `integrations:trigger` runs a helper to fetch what only the platform knows: a Pinterest board's id, a Slack or Discord room, a LinkedIn company page to tag.

**Handle media.** `upload` sends any file and prints the address to use; `--adjust` is accepted, but iHatePosting does no adjusting (the file is used as uploaded, and `media:status` says `ready` at once); `media:list` finds what is already uploaded.

**Read results.** Analytics for a channel or a post, and a two-step repair (`posts:missing`, `posts:connect`) when a published post has no platform id yet.

**Fit an agent.** Every answer is JSON after one header line (or alone, for three commands). A failure is one line on standard error and exit code `1`. The skill, four plugin folders, a Gemini manifest and an MCP entry carry the same knowledge to agent tools.

### A typical session

```bash
ihateposting auth:login                                  # sign in once
ihateposting integrations:list                           # find a channel's id
ihateposting integrations:settings <channel-id>          # read its rules and limits
ihateposting upload ./picture.png                        # note the "path" in the answer
ihateposting posts:create -c "Hello!" -m "<path>" \
  -s "2030-01-01T09:00:00Z" -t draft -i "<channel-id>"         # a draft, nothing is published
ihateposting posts:list                                  # see it
ihateposting posts:status <post-id> --status schedule    # queue it when it looks right
ihateposting analytics:post <post-id> -d 7               # read the numbers after it went out
```

### Platforms

iHatePosting connects sixteen channel identifiers: `bluesky`, `mastodon`, `slack`, `facebook`, `telegram`, `x`, `linkedin`, `linkedin-page`, `tumblr`, `discord`, `pinterest`, `tiktok`, `youtube`, `gmb` (Google Business), `instagram` and `threads`. That is fifteen platforms, because LinkedIn Page is a second kind of LinkedIn channel.

Some platforms have required settings:

| Platform | Required settings |
| --- | --- |
| Pinterest | `board`, the numeric id of a board |
| YouTube | `title` and `type` (`public`, `private` or `unlisted`) |
| TikTok | eight keys, among them `content_posting_method` and `privacy_level` |
| Instagram | `post_type` (`post` or `story`) |
| Slack, Discord | `channel`, the id of a room |

The others take none, or only optional ones. [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md) has every key. The server's own answer from `integrations:settings` is the final word; the guides were written from the schemas the app publishes and were not rechecked against a live server (unverified).

### Environment variables

| Variable | Default | What it does |
| --- | --- | --- |
| `IHATEPOSTING_API_KEY` | none | the key used when no sign-in is saved |
| `IHATEPOSTING_API_URL` | `https://app.ihateposting.com/api` | where the API paths are added |
| `IHATEPOSTING_AUTH_SERVER` | `https://app.ihateposting.com/api` | where `auth:login` asks for its code (`--auth-server` does the same) |

### Rules worth remembering

1. **Sign in first.** Every command except the three `auth:` ones fails without a saved sign-in or a key.
2. **The date is required.** `posts:create` needs `-s` unless the whole body comes from `--json`. There is no "now": use a date a little ahead.
3. **`posts:create` never uploads.** `-m` takes addresses of files that are already in the library. Upload, take the `path` from the answer, use it.
4. **Only two post types.** `-t schedule` (the default) and `-t draft`. `posts:status` moves a post between them.
5. **`--settings` is one object for every channel in `-i`.** Make one command per platform, or use a body file with a `settings` for each channel.
6. **Do not send `__type`.** The server knows each channel's platform and fills it in.
7. **Read `output.rules` and `output.maxLength` before you schedule.** A setting that does not apply can be dropped without an error.
8. **Choose TikTok's posting method on purpose.** `DIRECT_POST` publishes; `UPLOAD` only hands the media to the TikTok app, where a person finishes the post.
9. **A header line is not JSON.** Skip it with `tail -n +2` before `jq`, except for `posts:missing`, `media:list` and `media:status`.
10. **Nothing is retried.** A rate limit (`429`) or a server error is shown once. Wait, then run the command again.
11. **A mistyped command does nothing.** An unknown command or option is accepted and ignored, with exit code `0`. Check the spelling with `--help`.
12. **There is one failure code.** Every failure ends with exit code `1`; `auth:status` reports and ends with `0`.
13. **Never put a key in a script, a log or a commit.** `auth:status` shows only the first eight characters, and nothing else prints one.

### Things to know before pointing it at a server

The command line keeps habits that are less careful than they could be. The [README](README.md) and the [CHANGELOG](CHANGELOG.md) say so plainly:

- a plain `http://` address is accepted for any host, so use `https://` except for `localhost`;
- redirects are followed and the `Authorization` header goes along (the HTTP library does this and a test pins it down);
- a request has no time limit and an answer has no size limit;
- an id with a `/` or `?` in it changes the address that is asked.

Point it only at servers you trust.

### Plugins and manifests

| Folder or file | For | Carries |
| --- | --- | --- |
| `.claude-plugin/marketplace.json`, `plugins/claude-ihateposting/` | Claude Code | the skill (no MCP server); the plugin is in a folder without `bin/` |
| `.cursor-plugin/` | Cursor | the skill, the logo and the hosted MCP server |
| `.grok-plugin/` | Grok Build | the skill, the logo and the hosted MCP server |
| `gemini-extension.json` | Gemini CLI | the hosted MCP server |
| `plugins/dsh-ihateposting/` | DeepSeek Harness | a short skill for the MCP tools and an MCP connection that uses your key (with no key it warns and no tools appear) |
| `mcp.json` | any MCP client | an entry for the hosted MCP server |

The hosted MCP server is `https://app.ihateposting.com/mcp/oauth` (a browser sign-in); `https://app.ihateposting.com/mcp` takes the workspace key as a Bearer token instead. One version number is kept in `package.json`, every manifest and the newest CHANGELOG entry, and a test checks that they agree.

**The skill's copies.** `SKILL.md` is the source. `skills/ihateposting/SKILL.md` is what the Cursor and Grok manifests point at (and what `npx skills add` finds), and `plugins/claude-ihateposting/skills/ihateposting/SKILL.md` is the Claude Code plugin's own copy (the plugin folder is all that gets installed, so it cannot point out of it). A test checks that all three are identical. The `sync-skill.yml` workflow, which runs only when started by hand, copies the root file over `skills/ihateposting/SKILL.md` (not over the Claude plugin's copy); after a change to `SKILL.md`, copy it to the others by hand.

None of these folders has been run inside the real tool (unverified). Their manifests follow the shape each tool documents.

### How it is tested

Tests use Node's built-in runner and need no network, no key and no account. `test/helpers.mjs` starts a fake API on `127.0.0.1` that records every request, and runs the real program as a child process with a home folder of its own, so your saved sign-in is never read or written.

| File | What it proves |
| --- | --- |
| `cli.test.mjs` | every command: what it sends, what it prints, how it ends, the help and version output |
| `auth.test.mjs` | the device sign-in against a fake sign-in server, every way it can end |
| `break.test.mjs` | hostile or broken servers, enormous input, thirty people at once, and that no key is printed |
| `package.test.mjs` | the package contents, one version everywhere, the skill and its copies, the manifests, the release workflows, no secret committed |
| `docs.test.mjs` | the Markdown documents: relative links, example files, no key or private path |
| `claude-plugin.test.mjs` | the layout of the Claude Code plugin folder |
| `names.test.mjs` | the names used in the manifests and the documents |
| `packs.test.mjs` | the copy-paste packs in `SUBMISSIONS.md` |
| `submissions.test.mjs` | the ChatGPT and Codex plugin folder, its ZIP script, `server.json` and the submissions section of `PUBLISHING.md` |
| `planted-faults.test.mjs` | plants known faults in copies of the code and checks that the other tests notice (slow: ten minutes or more) |

`npm test` runs all of them, and the DeepSeek Harness plugin's own tests, one file at a time. While you work, run one file: `node --test test/cli.test.mjs`. The tests were run here on Windows with Node 24; nothing was run on macOS or Linux (unverified).

### Using it

**From npm or from a clone:**

```bash
npm install -g ihateposting
```

```bash
git clone https://github.com/iHatePostingOrg/iHatePosting-Agent.git
cd iHatePosting-Agent
npm install
node bin/ihateposting.mjs --help
```

**With an agent:** install the command line, sign in, then add the skill (`npx skills add iHatePostingOrg/iHatePosting-Agent`) or the plugin for your tool. The README says how for each tool.

**To release:** [PUBLISHING.md](PUBLISHING.md) has the checklist. In short, the version is set everywhere, `npm test` passes, `npm pack --dry-run` lists only what should ship, and the owner publishes by hand with two-factor authentication (the two GitHub workflows are in the repository but run only when started by hand and are not used for releases).

### Limits and things not verified

- The two release workflows have never run, and no real agent tool was pointed at the plugin folders.
- The app's sign-in routes and page must be live on `app.ihateposting.com` before `auth:login` works there. That change is written in the app's own repository. It had not been deployed when this was first written, and on 2026-11-15 at 08:17 UTC the routes answered (a real sign-in was not tried).
- The platform guides were written from the settings schemas the app publishes, not rechecked against a live server.
- There is no command that edits the text of an existing post, and there are no clipping commands.
- Which file types and sizes the server accepts, how each platform shows extra comment parts, and the exact shape of some answers (a board entry, the media status) depend on the server and were not checked.

### Where to read next

- New here: [QUICK_START.md](QUICK_START.md), then [README.md](README.md).
- Writing scripts: [examples/](examples/README.md), [INTEGRATION_SETTINGS_DISCOVERY.md](INTEGRATION_SETTINGS_DISCOVERY.md) and [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md).
- Building an agent: [SKILL.md](SKILL.md).
- Changing the code: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) and [CONTRIBUTING.md](CONTRIBUTING.md).
