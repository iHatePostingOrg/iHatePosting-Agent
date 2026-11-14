# ihateposting-agent

The iHatePosting command line, for people, scripts and AI agents. Sign in, list your channels, read each platform's rules, upload media, schedule or draft posts and read analytics through iHatePosting's public API. It works with X, LinkedIn, LinkedIn Page, Instagram, Facebook, Threads, YouTube, TikTok, Pinterest, Bluesky, Mastodon, Telegram, Discord, Slack, Tumblr and Google Business: whatever channels your workspace has connected.

This repository holds the command line, the agent skill that teaches an AI agent to use it, and the plugin folders that register the skill (and iHatePosting's hosted MCP server) with several agent tools. Its commands, options and output follow the conventions of other posting command lines on purpose, so that scripts written for those are easy to move; it was written from scratch for iHatePosting.

## Install as a skill

```bash
npx skills add iHatePostingOrg/iHatePosting-Agent
```

### Claude Code plugin

The folder `.claude-plugin` registers the skill. Add this repository as a plugin marketplace in Claude Code and install `ihateposting-agent` from it (unverified: no real Claude Code was pointed at it).

### Cursor, Grok Build and Gemini CLI

`.cursor-plugin`, `.grok-plugin` and `gemini-extension.json` do the same for those tools, and also name iHatePosting's hosted MCP server. They follow the shape those tools document for plugins (unverified: none was run against them).

### DeepSeek Harness

`plugins/dsh-ihateposting` is a plugin for DeepSeek Harness. See its own README for what was verified.

## The command line

### Installation

```bash
npm install -g ihateposting-agent
# or
pnpm install -g ihateposting-agent
```

Node.js 20 or newer. The only dependencies are `yargs` (the command line parser: it makes the help text) and `node-fetch` (requests).

### Authentication

**Sign in with a code (recommended).**

```bash
ihateposting-agent auth:login
```

It prints a code and opens a page of iHatePosting. Type the code there, press Authorize, then approve on the next page. The command line keeps a token in `~/.ihateposting/credentials.json` (a folder and a file only you can open). Take it back any time under **Settings → Apps → Approved Apps**.

```bash
ihateposting-agent auth:status    # who is signed in, and whether the credentials still work
ihateposting-agent auth:logout    # forget the saved sign-in
```

**Sign in with a key.** Your workspace key is under **Settings → Agents / Dev**.

```bash
export IHATEPOSTING_API_KEY=your_api_key
```

What `auth:login` saved is used first; the key in the environment is used when nothing was saved.

| Variable | What it does | Default |
| --- | --- | --- |
| `IHATEPOSTING_API_KEY` | the key to use when nothing was saved | none |
| `IHATEPOSTING_API_URL` | where the API is | `https://app.ihateposting.com/api` |
| `IHATEPOSTING_AUTH_SERVER` | where `auth:login` asks for its code (`--auth-server` does the same) | `https://app.ihateposting.com/api` |

### Commands

Run `ihateposting-agent --help` for the list and `ihateposting-agent <command> --help` for one command's options and examples.

| Command | What it does |
| --- | --- |
| `auth:login`, `auth:logout`, `auth:status` | sign in with a code, forget the sign-in, show who is signed in |
| `integrations:list [--group <id>]`, `integrations:groups` | your channels, your customer groups |
| `integrations:settings <id>` | a channel's rules, length limit, settings schema and helpers |
| `integrations:trigger <id> <method> [-d <json>]` | run a channel's helper (a Pinterest board list, a Slack room list, a LinkedIn page lookup) |
| `posts:create` | schedule or draft a post (`--json <file>` sends a body as it is) |
| `posts:list`, `posts:delete <id>`, `posts:status <id> --status draft\|schedule`, `posts:settings <id> --settings <json>` | list, delete, draft or schedule, change a waiting post's settings |
| `posts:missing <id>`, `posts:connect <id> --release-id <id>` | match a post to the platform's own post when analytics could not |
| `upload <file> [--adjust]`, `media:list [-s <text>] [-p <page>]`, `media:status <id>` | the media library |
| `analytics:platform <id> [-d <days>]`, `analytics:post <id> [-d <days>]` | a channel's or a post's analytics (7 days unless told) |

### Creating posts

```bash
# a scheduled post (the date is required)
ihateposting-agent posts:create -c "Hello!" -s "2030-01-01T09:00:00Z" -i "<channel-id>"

# a draft
ihateposting-agent posts:create -c "Hello!" -s "2030-01-01T09:00:00Z" -t draft -i "<channel-id>"

# with pictures (upload them first; -m takes the paths the upload answered)
ihateposting-agent upload ./picture.png
ihateposting-agent posts:create -c "Look!" -m "<path>" -s "2030-01-01T09:00:00Z" -i "<channel-id>"

# a thread, or a post with comments (each -c is the next part; -d is the delay in minutes between them)
ihateposting-agent posts:create -c "1/3" -c "2/3" -c "3/3" -d 5 -s "2030-01-01T09:00:00Z" -i "<channel-id>"

# a platform's own settings (build them from `integrations:settings`)
ihateposting-agent posts:create -c "Pin" -m "<path>" -s "2030-01-01T09:00:00Z" --settings '{"board":"1234567890"}' -i "<pinterest-id>"

# a whole body from a file
ihateposting-agent posts:create --json post.json
```

`posts:create` does not upload anything: `-m` takes addresses of files that are already in the library. Options may be written `--startDate` or `--start-date`, and `--no-shortLink` turns link shortening off.

### Output, errors and exit codes

Most commands print one header line (for example `✅ Post created successfully!`) and then the answer as JSON; `posts:delete` prints only its header, and `posts:missing`, `media:list` and `media:status` only JSON. Skip the header with `tail -n +2` before `jq`. A failure is printed to stderr as `❌ Failed to <what>: <why>` and the program ends with exit code `1`; `auth:status` ends with `0` even when the credentials are refused. A word that is not a command is accepted and does nothing (exit `0`), as the command line library does unless it is told otherwise.

Nothing is waited out or tried again: a rate limit (`429`) or a server error is shown once.

## What to know before you point it at a server

The command line is written to behave like the posting command lines it follows, and that includes some behaviour that is less careful than it could be. It is said here once, plainly:

- **A plain `http://` address is accepted for any host** (`IHATEPOSTING_API_URL`, `--auth-server`, and the `api_url` a sign-in server names). A key or token sent over plain `http` to another computer can be read on the way. Use `https://` everywhere except `localhost`.
- **Redirects are followed, and the key follows them.** The HTTP library (`node-fetch` 3) keeps the `Authorization` header when a redirect leads to another address; this repository's tests check it. Only point the command line at servers you trust.
- **A request waits for ever.** There is no time limit and no limit on the size of an answer.
- **Ids are put into the address as typed.** An id with a `/` or a `?` in it changes the address that is asked.
- **`auth:status` shows the first eight characters** of the key or token. Nothing else prints one.
- **The sign-in server holds no limits.** Anyone can ask it for codes; a code is eight characters of 32 and lives fifteen minutes.

## For AI agents

- **The skill** (`SKILL.md`) teaches an agent the order that works: sign in, discover channels and their rules, upload, post, analyse.
- **JSON everywhere.** Every answer after the header line is JSON.
- **Discovery before posting.** `integrations:settings <id>` answers the rules, the length limit, the settings schema and the helpers of a channel.
- **MCP instead of the command line.** iHatePosting is also an MCP server: `https://app.ihateposting.com/api/mcp/oauth` signs you in with a browser; `https://app.ihateposting.com/api/mcp` takes your key as `Authorization: Bearer <key>`. See `mcp.json`.

## Documentation

`QUICK_START.md`, `FEATURES.md`, `HOW_TO_RUN.md`, `PROVIDER_SETTINGS.md`, `INTEGRATION_SETTINGS_DISCOVERY.md`, `INTEGRATION_TOOLS_WORKFLOW.md`, `SUPPORTED_FILE_TYPES.md`, `SYNTAX_UPGRADE.md`, `PROJECT_STRUCTURE.md`, `CONTRIBUTING.md`, `PUBLISHING.md`, `CHANGELOG.md` and the samples in `examples/`.

## API endpoints it uses

All under `/public/v1`: `GET /integrations`, `GET /groups`, `GET /integration-settings/:id`, `POST /integration-trigger/:id`, `POST /posts`, `GET /posts`, `DELETE /posts/:id`, `PUT /posts/:id/status`, `PUT /posts/:id/settings`, `GET /posts/:id/missing`, `PUT /posts/:id/release-id`, `POST /upload`, `GET /media`, `GET /media/:id/status`, `GET /analytics/:id` and `GET /analytics/post/:id`. The key goes in the `Authorization` header exactly as it is, with no `Bearer`. The sign-in uses `POST /device/code` and `POST /device/token` of the sign-in server.

## Development

```bash
npm install
npm test        # unit tests and fake servers; no network, no key
```

The commands are in `src/commands/`, the HTTP client in `src/api.mjs`, the wiring in `src/index.mjs`. There is no build step. `.github/workflows` holds two release workflows (publishing to npm and syncing the plugin skill); they have never been run.

## License

MIT. See [LICENSE](LICENSE).
