# ihateposting-agent in one page

This page is a map of the whole repository. It says what the project is, how a command runs, what the commands are, which rules are worth remembering, where each file lives, how the code is tested and what to read next. For the full story of any topic, follow the links.

## What the project is

`ihateposting-agent` is the command line for iHatePosting, a social-media scheduling app. It talks to the app's public API, so a person, a script or an AI agent can do from a terminal what the app does in a browser: list connected channels, read each platform's rules, upload media, schedule or draft posts, change them, and read analytics.

The repository holds four things:

- the **command line** itself (plain JavaScript, no build step);
- the **skill** (`SKILL.md`), a text that teaches an AI agent to drive the command line;
- the **plugin folders** that hand the skill, and the hosted MCP server, to Claude Code, Cursor, Grok Build, Gemini CLI and DeepSeek Harness;
- the **guides, examples and tests** around them.

| | |
| --- | --- |
| Package name | `ihateposting-agent` |
| Command | `ihateposting-agent` |
| Version | 0.1.0, marked unreleased in the [CHANGELOG](CHANGELOG.md) |
| Language | JavaScript, ES modules (`.mjs`), no TypeScript, no bundler |
| Runtime | Node.js 20 or newer |
| Dependencies | `yargs` (the command line parser) and `node-fetch` (requests); nothing else |
| Licence | MIT |
| Default API address | `https://app.ihateposting.com/api` |

## What is in the repository

```text
bin/ihateposting-agent.mjs        the entry point
src/
  index.mjs                       every command, option, default, check and help text
  api.mjs                         the API client: one method per route, the upload
  config.mjs                      which key and which address a command uses
  constants.mjs                   program name, default addresses, variable names
  commands/                       auth, posts, integrations, analytics, upload
test/                             tests that run the real program against fake servers
examples/                         sample post bodies (.json) and scripts (.sh), and two guides
skills/ihateposting-agent/        the skill as the plugin folders read it
plugins/dsh-ihateposting/         the DeepSeek Harness plugin, a package of its own
.claude-plugin/ .cursor-plugin/ .grok-plugin/ gemini-extension.json mcp.json
.github/workflows/                publish-to-npm and sync-skill, both for a published release
assets/logo.png                   the logo
SKILL.md                          the skill (the source of its copies)
README.md and the guides          see "Documentation map" below
```

[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) describes every file.

## How a command runs

1. `bin/ihateposting-agent.mjs` imports `src/index.mjs`, which declares every command with `yargs` and parses the command line.
2. `yargs` fills in defaults and runs the checks. For `posts:create` that means: a text (or `--json`), a channel and a date. A failed check prints the command's usage on standard error and ends with exit code `1`, without asking the server.
3. The handler asks `getConfig()` for a key and an address: a saved sign-in first, then `IHATEPOSTING_API_KEY` and `IHATEPOSTING_API_URL`. With neither, it says how to sign in and ends with exit code `1`.
4. The handler builds the request and calls one method of the API client.
5. The client sends the key in the `Authorization` header exactly as it is, makes the request once, and returns the JSON, or fails with `Request failed: API Error (<status>): <the server's words>`.
6. The handler prints a header line and the JSON, or `❌ Failed to <what>: <why>` and exit code `1`.

`auth:login`, `auth:status` and the upload make their own requests instead of going through the shared method, but follow the same printing habits.

## The commands

Nineteen commands, grouped by what they are for. `ihateposting-agent <command> --help` shows each one's options.

| Group | Commands | What they do |
| --- | --- | --- |
| Sign-in | `auth:login`, `auth:status`, `auth:logout` | sign in with a code, check the credentials, forget the saved sign-in |
| Channels | `integrations:list`, `integrations:groups` | your channels (optionally one customer's), your customers |
| Rules | `integrations:settings <id>`, `integrations:trigger <id> <method>` | a channel's rules, length limit, settings schema and helpers; run one helper |
| Posts | `posts:create`, `posts:list` | schedule or draft a post; list posts in a window |
| Post changes | `posts:delete`, `posts:status`, `posts:settings` | delete; move between draft and scheduled; change a waiting post's settings |
| Missing ids | `posts:missing`, `posts:connect` | list the platform's recent content; tell iHatePosting which item is the post |
| Media | `upload`, `media:list`, `media:status` | upload a file (optionally adjusted); search the library; check an adjusted upload |
| Analytics | `analytics:platform`, `analytics:post` | a channel's or a post's metrics, over a number of days |

`--help`, `--version` and `<command> --help` need no sign-in. Every command in the table except the three `auth:` ones does.

## What a command prints

| Commands | Standard output | On failure |
| --- | --- | --- |
| `integrations:*`, `posts:create`, `posts:list`, `posts:status`, `posts:settings`, `posts:connect`, `upload`, `analytics:*` | one header line, then JSON | `❌ Failed to <what>: <why>` on standard error, exit code `1` |
| `posts:delete` | the header line only | the same |
| `posts:missing`, `media:list`, `media:status` | JSON only | the same |
| `auth:status` | a few status lines | it reports and ends with exit code `0` |
| `auth:login`, `auth:logout` | progress or one status line | exit code `1` when the sign-in fails |

## What it can do

**Sign in two ways.** A one-time code you approve in a browser (`auth:login`), or a workspace key in `IHATEPOSTING_API_KEY`. A saved sign-in wins over the key. The saved token lives in `~/.ihateposting/credentials.json`.

**Post to any channel the workspace has.** One command can address several channels, make threads and comments (every further `-c`), pair each part with its own media (`-m`) and alt texts (`--alt`), carry a platform's own `--settings`, and be a draft (`-t draft`) instead of scheduled. A whole request can come from a file with `--json`.

**Discover before posting.** `integrations:settings` answers a channel's rules in words, its longest text, its settings schema and its helpers. `integrations:trigger` runs a helper to fetch what only the platform knows: a Pinterest board's id, a Slack or Discord room, a LinkedIn company page to tag.

**Handle media.** `upload` sends any file and prints the address to use; `--adjust` asks the server to fit the file to the platforms' limits; `media:status` says when that is done; `media:list` finds what is already uploaded.

**Read results.** Analytics for a channel or a post, and a two-step repair (`posts:missing`, `posts:connect`) when a published post has no platform id yet.

**Fit an agent.** Every answer is JSON after one header line (or alone, for three commands). A failure is one line on standard error and exit code `1`. The skill, four plugin folders, a Gemini manifest and an MCP entry carry the same knowledge to agent tools.

## A typical session

```bash
ihateposting-agent auth:login                                  # sign in once
ihateposting-agent integrations:list                           # find a channel's id
ihateposting-agent integrations:settings <channel-id>          # read its rules and limits
ihateposting-agent upload ./picture.png                        # note the "path" in the answer
ihateposting-agent posts:create -c "Hello!" -m "<path>" \
  -s "2030-01-01T09:00:00Z" -t draft -i "<channel-id>"         # a draft, nothing is published
ihateposting-agent posts:list                                  # see it
ihateposting-agent posts:status <post-id> --status schedule    # queue it when it looks right
ihateposting-agent analytics:post <post-id> -d 7               # read the numbers after it went out
```

## Platforms

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

## Environment variables

| Variable | Default | What it does |
| --- | --- | --- |
| `IHATEPOSTING_API_KEY` | none | the key used when no sign-in is saved |
| `IHATEPOSTING_API_URL` | `https://app.ihateposting.com/api` | where the API paths are added |
| `IHATEPOSTING_AUTH_SERVER` | `https://app.ihateposting.com/api` | where `auth:login` asks for its code (`--auth-server` does the same) |

## Rules worth remembering

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

## Things to know before pointing it at a server

The command line keeps habits that are less careful than they could be. The [README](README.md) and the [CHANGELOG](CHANGELOG.md) say so plainly:

- a plain `http://` address is accepted for any host, so use `https://` except for `localhost`;
- redirects are followed and the `Authorization` header goes along (the HTTP library does this and a test pins it down);
- a request has no time limit and an answer has no size limit;
- an id with a `/` or `?` in it changes the address that is asked.

Point it only at servers you trust.

## Documentation map

| File | What it is for |
| --- | --- |
| [README.md](README.md) | install, sign-in, every command, platform examples, workflows, errors |
| [SKILL.md](SKILL.md) | the skill for AI agents: rules, patterns, gotchas |
| [QUICK_START.md](QUICK_START.md) | five minutes from nothing to a first draft |
| [FEATURES.md](FEATURES.md) | every command grouped by what you want to do |
| [HOW_TO_RUN.md](HOW_TO_RUN.md) | running from a clone, other servers, the tests, troubleshooting |
| [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md) | each platform's settings, key by key |
| [PROVIDER_SETTINGS_SUMMARY.md](PROVIDER_SETTINGS_SUMMARY.md) | the same on one page |
| [INTEGRATION_SETTINGS_DISCOVERY.md](INTEGRATION_SETTINGS_DISCOVERY.md) | reading a channel's rules and schema |
| [INTEGRATION_TOOLS_WORKFLOW.md](INTEGRATION_TOOLS_WORKFLOW.md) | channel helpers, step by step |
| [SUPPORTED_FILE_TYPES.md](SUPPORTED_FILE_TYPES.md) | what `upload` does with a file |
| [SYNTAX_UPGRADE.md](SYNTAX_UPGRADE.md) | the habits of this command line, for people moving scripts over |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | every file, and how a command travels through the code |
| [CONTRIBUTING.md](CONTRIBUTING.md) | setup, style, tests, the pull request checklist |
| [PUBLISHING.md](PUBLISHING.md) | how a release is made |
| [CHANGELOG.md](CHANGELOG.md) | what each version contains and what it costs |
| [examples/COMMAND_LINE_GUIDE.md](examples/COMMAND_LINE_GUIDE.md) | every command's syntax, one by one |
| [examples/EXAMPLES.md](examples/EXAMPLES.md) | worked examples |
| [examples/README.md](examples/README.md) | what each sample body and script is for |
| [plugins/dsh-ihateposting/README.md](plugins/dsh-ihateposting/README.md) | the DeepSeek Harness plugin and what was verified |

## Examples

[`examples/`](examples/) holds sample post bodies and shell scripts to copy and edit. The bodies are for a thread, a post with comments and media, one announcement for several platforms, a TikTok video, a YouTube video and a Pinterest pin. The scripts (`basic-usage.sh`, `draft-from-flags.sh`, `discover-and-draft.sh`, `post-from-body-file.sh`) take ids from environment variables, hold no key, delete nothing and make drafts only.

## Plugins and manifests

| Folder or file | For | Carries |
| --- | --- | --- |
| `.claude-plugin/` | Claude Code | the skill (no MCP server) |
| `.cursor-plugin/` | Cursor | the skill, the logo and the hosted MCP server |
| `.grok-plugin/` | Grok Build | the skill, the logo and the hosted MCP server |
| `gemini-extension.json` | Gemini CLI | the hosted MCP server |
| `plugins/dsh-ihateposting/` | DeepSeek Harness | the skill and an MCP connection that uses your key |
| `mcp.json` | any MCP client | an entry for the hosted MCP server |

The hosted MCP server is `https://app.ihateposting.com/api/mcp/oauth` (a browser sign-in); `https://app.ihateposting.com/api/mcp` takes the workspace key as a Bearer token instead. One version number is kept in `package.json`, every manifest and the newest CHANGELOG entry, and a test checks that they agree.

**The skill's copies.** `SKILL.md` is the source. `skills/ihateposting-agent/SKILL.md` is what the Claude Code, Cursor and Grok manifests point at, and `plugins/dsh-ihateposting/skill/SKILL.md` is the DeepSeek Harness plugin's own copy (the plugin puts a short note in front of it, telling the agent to do the same jobs with the MCP tools). A test checks that all three are identical, and the `sync-skill.yml` workflow copies the root file over the other two when a release is published.

None of these folders has been run inside the real tool (unverified). Their manifests follow the shape each tool documents.

## How it is tested

Tests use Node's built-in runner and need no network, no key and no account. `test/helpers.mjs` starts a fake API on `127.0.0.1` that records every request, and runs the real program as a child process with a home folder of its own, so your saved sign-in is never read or written.

| File | What it proves |
| --- | --- |
| `cli.test.mjs` | every command: what it sends, what it prints, how it ends, the help and version output |
| `auth.test.mjs` | the device sign-in against a fake sign-in server, every way it can end |
| `break.test.mjs` | hostile or broken servers, enormous input, thirty people at once, and that no key is printed |
| `package.test.mjs` | the package contents, one version everywhere, the skill and its copies, the manifests, the release workflows, no secret committed |
| `docs.test.mjs` | the Markdown documents: relative links, example files, no key or private path |
| `planted-faults.test.mjs` | plants known faults in copies of the code and checks that the other tests notice (slow: about ten minutes) |

`npm test` runs all of them, and the DeepSeek Harness plugin's own tests, one file at a time. While you work, run one file: `node --test test/cli.test.mjs`. The tests were run here on Windows with Node 24; nothing was run on macOS or Linux (unverified).

## Using it

**From a clone** (the package is not on npm yet):

```bash
git clone https://github.com/iHatePostingOrg/iHatePosting-Agent.git
cd iHatePosting-Agent
npm install
node bin/ihateposting-agent.mjs --help
```

**With an agent:** install the command line, sign in, then add the skill (`npx skills add iHatePostingOrg/iHatePosting-Agent`) or the plugin for your tool. The README says how for each tool.

**To release:** [PUBLISHING.md](PUBLISHING.md) has the checklist. In short, the version is set everywhere, `npm test` passes, `npm pack --dry-run` lists only what should ship, and a GitHub release whose tag is `v<version>` starts the publish workflow.

## Limits and things not verified

- The package is not published, the two release workflows have never run, and no real agent tool was pointed at the plugin folders.
- The app's sign-in routes and page must be live on `app.ihateposting.com` before `auth:login` works there. That change is written in the app's own repository and had not been deployed when this was written.
- The platform guides were written from the settings schemas the app publishes, not rechecked against a live server.
- There is no command that edits the text of an existing post, and there are no clipping commands.
- Which file types and sizes the server accepts, how each platform shows extra comment parts, and the exact shape of some answers (a board entry, the media status) depend on the server and were not checked.

## Where to read next

- New here: [QUICK_START.md](QUICK_START.md), then [README.md](README.md).
- Writing scripts: [examples/](examples/README.md), [INTEGRATION_SETTINGS_DISCOVERY.md](INTEGRATION_SETTINGS_DISCOVERY.md) and [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md).
- Building an agent: [SKILL.md](SKILL.md).
- Changing the code: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) and [CONTRIBUTING.md](CONTRIBUTING.md).
