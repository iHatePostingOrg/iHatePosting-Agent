# Changelog

What each version of `ihateposting-agent` contains, newest first. The version number is the same in `package.json`, in every plugin manifest and in the heading of the newest entry below; a test checks that they agree.

## 0.1.0 (unreleased)

The first version: the command line, the agent skill and the plugin folders for iHatePosting's public API.

**Where it comes from.** It was written from scratch for iHatePosting, in this repository's own code and words. It is **not based on** the `iHatePostingOrg/agent-skill` repository or on any of the npm packages published from it, and nothing in it was copied from them. Its command names, options, header lines and exit codes follow the habits common to posting command lines, so scripts moved over from one of those keep working; no other program's code or text is in this repository.

### What the first version contains

**Nineteen commands** (`ihateposting-agent <command> --help` shows each one's options and examples):

| Command | What it does |
| --- | --- |
| `auth:login` | signs in with a one-time code and saves the token |
| `auth:status` | shows who is signed in and whether the credentials still work |
| `auth:logout` | forgets the saved sign-in |
| `integrations:list` | lists the connected channels, optionally one customer's |
| `integrations:groups` | lists the customers (groups) |
| `integrations:settings` | reads a channel's rules, length limit, settings schema and helpers |
| `integrations:trigger` | runs a channel's helper (a board list, a room list, a company-page lookup) |
| `posts:create` | schedules or drafts a post, with comments, media, alt texts and settings, or sends a body file |
| `posts:list` | lists posts in a date window, optionally for one customer |
| `posts:delete` | deletes a post |
| `posts:status` | moves a post between draft and scheduled |
| `posts:settings` | changes a waiting post's platform settings |
| `posts:missing` | lists the platform's recent content for a post that lacks its platform id |
| `posts:connect` | records which of that content is the post |
| `analytics:platform` | reads a channel's analytics over a number of days |
| `analytics:post` | reads one post's analytics over a number of days |
| `upload` | uploads a file, optionally asking the server to adjust it to the platforms' limits |
| `media:list` | searches the media library, newest first, 18 to a page |
| `media:status` | checks whether an adjusted upload is ready |

The options: `posts:create` takes `-c` (repeat it for comments or the parts of a thread), `-i` (channels), `-s` (the date), `-t` (`schedule` or `draft`), `-m` and `--alt` (media and alt texts, paired with each `-c`), `-d` (the delay between parts), `--settings`, `--json` and `--no-shortLink`. `posts:list` takes `--startDate`, `--endDate` and `--customer`; the two `analytics:` commands take `-d` (days, default 7); `media:list` takes `-s` and `-p`; `upload` takes `--adjust`; `auth:login` takes `--auth-server`.

**Signing in.** `auth:login` is a device-code flow: the program asks the sign-in server for a code, shows it, opens the page where a person types it and approves, and asks every few seconds until they have. The token, the API address it names and the workspace id are saved in `~/.ihateposting/credentials.json` (a folder and a file only the person can open). What was saved wins over `IHATEPOSTING_API_KEY`. The sign-in server is the iHatePosting app's own routes; `IHATEPOSTING_AUTH_SERVER` or `--auth-server` can name another one.

**Names.** The npm package and the command are `ihateposting-agent`. The plugin is called `ihateposting` in every manifest (Claude Code, Cursor, Grok Build and the Gemini extension) and each marketplace is called `ihateposting-agent`, so Claude Code installs it with `ihateposting@ihateposting-agent`. The skill itself keeps the name `ihateposting-agent`, and so does its folder.

**The skill.** `SKILL.md` teaches an AI agent the order that works (sign in, discover, upload, post, analyse) with four rules, patterns and common mistakes. It exists in three places that a test keeps identical: the root, `skills/ihateposting-agent/` and `plugins/dsh-ihateposting/skill/`.

**Plugin folders.** `.claude-plugin` (Claude Code, skill only), `.cursor-plugin` and `.grok-plugin` (skill and the hosted MCP server), `gemini-extension.json` (Gemini CLI, the hosted MCP server), `plugins/dsh-ihateposting` (DeepSeek Harness, a package of its own) and `mcp.json` (an entry for any MCP client).

**Release workflows.** `.github/workflows/publish-npm.yml` publishes to npm and `sync-skill.yml` copies the skill into the two folders the plugins read it from. Both run only when a GitHub release is published, and the first checks that the release tag equals the package version.

**Requirements.** Node.js 20 or newer. `yargs` (^17.7.2) and `node-fetch` (^3.3.2) are the only dependencies; there are no development dependencies and no build step.

**Platforms.** Sixteen channel identifiers: `bluesky`, `mastodon`, `slack`, `facebook`, `telegram`, `x`, `linkedin`, `linkedin-page`, `tumblr`, `discord`, `pinterest`, `tiktok`, `youtube`, `gmb` (Google Business), `instagram` and `threads`.

**Variables.** `IHATEPOSTING_API_KEY` (no default), `IHATEPOSTING_API_URL` and `IHATEPOSTING_AUTH_SERVER` (both default to `https://app.ihateposting.com/api`).

**What the npm package holds.** `bin`, `src`, `SKILL.md`, `skills`, `README.md`, `CHANGELOG.md` and `LICENSE`, plus `package.json`. The tests, examples, plugin folders and guides stay in the repository.

**Guides and examples.** A README, a one-page summary, a quick start, a features list, a guide to running and testing, a project map, guides to platform settings, settings discovery, channel helpers and file types, a note for people moving scripts over, contributing and publishing guides, a command-by-command guide, and an `examples/` folder with six sample post bodies and four shell scripts.

**Tests.** Node's built-in runner, no network and no key: every command against a fake API, the device sign-in against a fake sign-in server, hostile and broken servers and input, the package and its manifests, the documents' links, and a file that plants known faults into copies of the code to prove the other tests notice them.

### Behaviour worth knowing

- Everything that goes wrong ends with exit code `1`; `auth:status` ends with `0` even when the credentials are refused.
- Most commands print a header line and then the JSON; a failure is `❌ Failed to <what>: <why>` on standard error.
- `posts:delete` prints only its header line; `posts:missing`, `media:list` and `media:status` print only JSON.
- Nothing is waited out or tried again: a rate limit or a server error is shown once.
- `posts:create` sends the text exactly as given, needs `--date` unless `--json` is used, takes only `--type schedule` or `draft`, and its `-m` takes addresses of files that are already uploaded (`upload` first). `--json` sends a body as it is.
- An unknown command or option is accepted and does nothing (exit code `0`): the parser, `yargs`, is not told to be strict.
- A plain `http://` address, a redirect and any text as a key are accepted, with no time limit and no limit on an answer's size.

### What is specific to iHatePosting

| | Here | Reason |
| --- | --- | --- |
| Name, folder, variables | `ihateposting-agent`, `~/.ihateposting`, `IHATEPOSTING_API_KEY`, `IHATEPOSTING_API_URL`, `IHATEPOSTING_AUTH_SERVER` | iHatePosting's own names |
| Addresses | API `https://app.ihateposting.com/api`; the sign-in server defaults to the API's address | iHatePosting's own app |
| Platforms in help and docs | fifteen platforms, sixteen identifiers; the examples use Pinterest, YouTube, X and the others the app connects | what iHatePosting connects |
| Clipping commands | none | iHatePosting has no clipping |
| Advertising line in the help | none | left out on purpose |
| Licence | MIT | this repository's own |

### What it costs, said once

The program keeps behaviour that is less careful than it could be. A key or token sent over plain `http://` to another computer can be read on the way. The HTTP library (`node-fetch` 3) follows a redirect to another address **and keeps the `Authorization` header** (a test in this repository checks it). A request waits for ever. An id with a `/` or `?` in it changes the address that is asked, and a redirect of a `POST` can carry its body to the new address. Point it only at servers you trust and use `https://` except for `localhost`. `auth:status` shows the first eight characters of a key or token.

### Not verified

No real agent tool (Claude, Cursor, Grok, Gemini, DeepSeek Harness) was pointed at the plugin folders or at `https://app.ihateposting.com/api/mcp/oauth`; their manifests follow the shape each tool documents. The skill's `metadata` line (for tools that read an `openclaw` block) was written from a published example, not run. The guides to platform settings were written from the schemas the app publishes and not rechecked against a live server. The tests were run here on Windows with Node 24; nothing was run on macOS or Linux.

### Not yet done

- The package has not been published to npm, and the two release workflows have never run.
- Production must route the sign-in's discovery documents (`/.well-known/oauth-protected-resource/api/mcp/oauth` and `/.well-known/oauth-authorization-server/api/mcp/oauth`), the paths `/api/device/*` and the page `/device` to the app before `auth:login` and an MCP client can sign in there. The change is written in the app's repository and has not been deployed.
