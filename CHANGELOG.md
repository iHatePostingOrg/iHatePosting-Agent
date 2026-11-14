# Changelog

## 0.1.0 (unreleased)

The first version: the command line, the agent skill and the plugin folders for iHatePosting's public API.

**Where it comes from.** It was written from scratch for iHatePosting, in this repository's own code and words. It is **not based on** the `iHatePostingOrg/agent-skill` repository or on any of the npm packages published from it, and nothing in it was copied from them. Its shape (command names, options, header lines, exit codes, the sign-in with a code, the skill's sections) follows the conventions of another posting command line, as the owner asked on 2026-11-13 (match it, and ask before changing anything): the other command line was read and run offline for its visible behaviour only, and none of its code or text is in this repository.

**Commands.** `auth:login`, `auth:logout`, `auth:status`; `integrations:list`, `integrations:groups`, `integrations:settings`, `integrations:trigger`; `posts:create`, `posts:list`, `posts:delete`, `posts:missing`, `posts:status`, `posts:settings`, `posts:connect`; `analytics:platform`, `analytics:post`; `upload`, `media:list`, `media:status`.

**What follows the other command line, on purpose.**

- Sign-in is a device code: the program asks the sign-in server for a code, shows it, opens the page where a person types it and approves, and asks every few seconds until they have. The token and the API address it names are saved in `~/.ihateposting/credentials.json` (only the person can open it). What was saved wins over `IHATEPOSTING_API_KEY`.
- Everything that goes wrong ends with exit code `1`; `auth:status` ends with `0` even when the credentials are refused.
- Most commands print a header line and then the JSON; a failure is `❌ Failed to <what>: <why>`.
- Nothing is waited out or tried again: a rate limit or a server error is shown once.
- `posts:create` sends the text exactly as given, needs `--date` (unless `--json`), takes `--type schedule|draft` only, and `-m` takes addresses of files that are already uploaded (`upload` first). `--json` sends a body as it is.
- An unknown command or option is accepted and does nothing (exit `0`): the parser, `yargs`, is not told to be strict.
- A plain `http://` address, a redirect and any text as a key are accepted, with no time limit and no limit on an answer's size.

**What is different, and why.**

| | Here | Reason |
| --- | --- | --- |
| Name, folder, variables | `ihateposting-agent`, `~/.ihateposting`, `IHATEPOSTING_API_KEY`, `IHATEPOSTING_API_URL`, `IHATEPOSTING_AUTH_SERVER` | iHatePosting's own names (owner's choice) |
| Addresses | API `https://app.ihateposting.com/api`; the sign-in server defaults to the API's address | iHatePosting's own app |
| Platforms in help and docs | iHatePosting's fifteen; the examples use Pinterest where the other uses a platform iHatePosting does not have | what iHatePosting connects |
| Clipping commands | none | iHatePosting has no clipping (owner's decision) |
| Advertising line in the help | none | owner's choice |
| Licence | MIT | this repository's own |

**What it costs, said once.** The program is written to behave like the one it follows, and that includes behaviour that is less careful than it could be: a key or token sent over plain `http://` to another computer can be read on the way; the HTTP library (`node-fetch` 3) follows a redirect to another address **and keeps the `Authorization` header** (checked by a test in this repository); a request waits for ever; an id with a `/` or `?` in it changes the address that is asked; and a redirect of a `POST` can carry its body to the new address. Point it only at servers you trust and use `https://` except for `localhost`. `auth:status` shows the first eight characters of a key or token.

**Not verified.** No real agent tool (Claude, Cursor, Grok, Gemini, DeepSeek Harness) was pointed at the plugin folders or at `https://app.ihateposting.com/api/mcp/oauth`; their manifests follow the shape each tool documents. The skill's `metadata` line (for tools that read an `openclaw` block) was written from a published example, not run. Production must route the sign-in's discovery documents (`/.well-known/oauth-protected-resource/api/mcp/oauth` and `/.well-known/oauth-authorization-server/api/mcp/oauth`) and the paths `/api/device/*` and the page `/device` to the app before `auth:login` and an MCP client can sign in there: the change is written in the app's repository and has not been deployed.
