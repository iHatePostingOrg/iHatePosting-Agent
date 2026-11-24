# dsh-ihateposting

[![npm](https://img.shields.io/npm/v/dsh-ihateposting)](https://www.npmjs.com/package/dsh-ihateposting)

**npm:** [`dsh-ihateposting`](https://www.npmjs.com/package/dsh-ihateposting) ·
**source:** [iHatePostingOrg/iHatePosting-Agent](https://github.com/iHatePostingOrg/iHatePosting-Agent/tree/main/plugins/dsh-ihateposting)

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) plugin for
[iHatePosting](https://ihateposting.com), the social media scheduler. It connects the agent
to the iHatePosting MCP server so it can list your connected channels, fetch each platform's
posting rules, and schedule, draft, or publish posts across 15 platforms (X, LinkedIn,
Instagram, Facebook, Threads, TikTok, YouTube, Pinterest, Bluesky, Mastodon,
Discord, Slack, Telegram, and more).

## Install

From the repository:

```bash
dsh plugin --profile web add "github:iHatePostingOrg/iHatePosting-Agent#path:/plugins/dsh-ihateposting"
```

Or from npm:

```bash
dsh plugin --profile web add dsh-ihateposting
```

Then give it an iHatePosting API key. Get it from **iHatePosting → Settings → Agents / Dev**
and export it before starting dsh, or put it in `$DSH_HOME/.env`:

```bash
export IHATEPOSTING_API_KEY=your-api-key
dsh web
```

Restart the profile after installing. Ask the agent *"List my connected social media
accounts"* to verify the connection.

## What you get

The bundle mounts two rows:

| Row | Package | Role |
|---|---|---|
| `ihateposting` | `dsh-ihateposting` (this package) | Reads the API key, exposes `ctx.ihateposting` (`url`, `headers`), and registers the `ihateposting` skill that teaches the agent the posting workflow and the HTML content rules. |
| `ihateposting-mcp` | `@deepseek-ai/dsh-mcp-client` (shipped with dsh) | Connects to `https://app.ihateposting.com/mcp` over streamable HTTP with a `Bearer` header and registers the server's tools. |

The model sees the iHatePosting MCP tools under the `mcp__ihateposting__` namespace:

| Tool | What it does |
|---|---|
| `mcp__ihateposting__integrationList` | List connected channels (optionally filtered by group) |
| `mcp__ihateposting__groupList` | List customer groups |
| `mcp__ihateposting__integrationConnectTool` | A link, good for one hour, that the person opens to connect a new channel (not Bluesky or Telegram, which are added inside iHatePosting) |
| `mcp__ihateposting__integrationSchema` | Posting rules, character limits, and required settings for a platform |
| `mcp__ihateposting__triggerTool` | Platform helpers (list Discord channels, list Pinterest boards, look up LinkedIn pages) |
| `mcp__ihateposting__integrationSchedulePostTool` | Schedule, draft, or immediately publish posts |
| `mcp__ihateposting__postsListTool` | List posts between two dates |
| `mcp__ihateposting__postSettingsTool` | Update settings of an unpublished post |
| `mcp__ihateposting__postAttachmentsTool` | Replace the attachments of an unpublished post |
| `mcp__ihateposting__deletePostTool` | Delete a post |
| `mcp__ihateposting__integrationAnalyticsTool` / `postAnalyticsTool` | The analytics of a channel, and of a published post, for the last days |
| `mcp__ihateposting__uploadFromUrlTool` / `mediaListTool` / `mediaStatusTool` | Put a picture or video into the media library from a public web address, find a file that is already there, check that it is ready |
| `mcp__ihateposting__uploadWidgetTool` / `uploadWidgetStatusTool` | An upload panel for files on the person's own computer (only in a client that shows panels), and the list of what was added |

The tool list comes from the server at connect time, so new iHatePosting tools appear without a
plugin update.

## Configuration

Override the `ihateposting` row in your profile's `cordis.patch.yml` (`$DSH_HOME/profiles/web/cordis.patch.yml`).
A bare `id:` configures the existing row:

```yaml
- id: ihateposting
  config:
    apiKeyEnv: IHATEPOSTING_API_KEY            # env var that holds the key (default)
    baseUrl: https://app.ihateposting.com      # another server that answers the same routes: https://your-server.example.com
    skill: true                                # register the `ihateposting` workflow skill
```

| Field | Default | Description |
|---|---|---|
| `apiKeyEnv` | `IHATEPOSTING_API_KEY` | Environment variable read at boot for the API key. |
| `apiKey` | `''` | Inline key. Prefer the env var; this exists for patch-level overrides. |
| `baseUrl` | `https://app.ihateposting.com` | iHatePosting address. The MCP endpoint is `<baseUrl>/mcp` (an address that already ends in `/mcp` is used as it is). Another server that answers the same routes can be named here. |
| `skill` | `true` | Register the `ihateposting` skill on `ctx.skills`. |

Without a key the `ihateposting` row logs a warning naming the variable to set, and the
`ihateposting-mcp` row connects without credentials, which iHatePosting refuses with a 401, so it registers no tools. dsh keeps booting.

## Self-hosted iHatePosting

The MCP server is part of the iHatePosting app and listens at `/mcp` (Bearer auth), so by
default the plugin connects to `https://app.ihateposting.com/mcp`. The app is hosted, so there
is no server of your own to set up; another server that answers the same routes can be named with
`baseUrl`. If your profile still has `baseUrl: https://app.ihateposting.com/api` (the default of version 0.1.1), take the `/api` out: the key address has no `/api` any more.

## Development

```bash
cd plugins/dsh-ihateposting
pnpm test
```

Link a local checkout into a profile:

```bash
dsh plugin --profile web add /absolute/path/to/iHatePosting-Agent/plugins/dsh-ihateposting
```

## Related

- [iHatePosting CLI](https://github.com/iHatePostingOrg/iHatePosting-Agent) — the `ihateposting` command-line tool and the Claude Code / Cursor / Grok plugins in this repository.

## License

MIT, same as the rest of this repository.

## Sections that were in this file before it followed the reference

### Status

Status: **1.0.0, never run inside a real `dsh`** (see "Unverified" below). The version number follows the repository's; the plugin's code differs from 0.1.1 in one value, its default `baseUrl` (`https://app.ihateposting.com`, without `/api`, because the key address `https://app.ihateposting.com/mcp` has none).

### The profile name and the PowerShell form of the install

`web` is one of the profile templates `dsh` ships; use the profile you want.

```powershell
# PowerShell
$env:IHATEPOSTING_API_KEY = "your_key"
dsh web
```

### How the key is handled

The key is sent in one place only: the `Authorization: Bearer <key>` header of the `ihateposting-mcp` row, to the address above. The plugin never prints it, logs it or contacts any address itself (the tests check this). A key that holds a space or a control character is not used and is not repeated in the log.

### The browser sign-in address is not used

`https://app.ihateposting.com/mcp/oauth` (a browser sign-in by OAuth) is not wired: the pages of `dsh`'s MCP client that were read do not describe an OAuth flow (unverified), so this plugin uses the key.

### What was verified, and from where

Read first-hand on 2026-11-15 in `deepseek-ai/deepseek-harness` (branch `master`, commit `39163dd`) and in the published packages:

- A bundle is a package whose `package.json` has `"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }`: [docs/user/develop/basic/publish.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md).
- A plugin module exports `name`, optionally `inject`, and `apply`; the `Config` export must be a Schemastery schema, never a plain object: [docs/user/develop/basic/index.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/index.md) and [config.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/config.md).
- A row that lists `inject: [service]` has its `config` read as `!!js ctx.<service>.<field>` after the service is up, and the loader evaluates a row's `config` only then: [publish.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md) (the example with `ctx.myAppStartup.port`) and [docs/cordis-primer.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-primer.md).
- In `@deepseek-ai/cordis` 4.1.0 (npm): `ctx.provide(name, value)`, `ctx.inject(deps, callback)` and a callable `ctx.logger` with `info` and `warn`. In `@deepseek-ai/schemastery` 3.19.0 (npm): `.role()`. `dsh`'s own dependency catalog pins cordis 4.0.2 and schemastery 3.18.2, which the peer ranges in `package.json` (`^4.0.1`, `^3.18.1`) include.
- The MCP client row (`@deepseek-ai/dsh-mcp-client`) takes `transport`, `serverName`, `url` and `headers`, and names tools `mcp__<serverName>__<tool>`: [packages/mcp/mcp-client/README.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/mcp/mcp-client/README.md) (read on 2026-11-13, second-hand).

From the owner of this project (not checked from here): the MCP address, that the key goes in `Authorization: Bearer <key>`, and that the key is made under Settings > Agents / Dev. The server's refusal of a request without a key is read from the app's own code.

### Unverified

- **No real `dsh` was run.** The plugin was never loaded by `dsh`, `dsh plugin add` was not run, and no request was made to iHatePosting's server (no network and no key were used). The tests use stand-ins for the context and, where the real package is not installed, for `@deepseek-ai/schemastery`; with the real package installed the same checks run against it.
- Which `dsh` releases it works with. `engines.dsh` is left out on purpose rather than guessed.
- The fields `skills.register` is given: `name`, `description`, `content` and `source: 'runtime'` follow the documentation read earlier; `invocation: { modelInvocable, userInvocable }` is added because another published plugin for `dsh` passes it, and no page read describes it.
- Why other plugins export only named values: one of them says a default export makes the loader drop `inject` and `apply`, and that `schemastery` rejects frozen objects. Neither statement was found in the documentation or the package source. This plugin uses named exports (the documented function form) and hands out a fresh plain copy of the headers on every read, which is right either way.
- Whether `!!js` expressions see a key that is only in a `.env` file. Put it in the environment to be sure.
- Whether the MCP client keeps header values out of its own logs and error text.
- Installing from `github:` for this subfolder, and installing from npm.
