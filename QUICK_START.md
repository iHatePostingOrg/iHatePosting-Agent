# Quick start

From nothing to a first draft post and a look at its analytics, in a few minutes. Nothing below publishes anything: the post is made as a draft.

You need Node.js 20 or newer (`node --version` tells you which you have), an iHatePosting workspace with at least one connected channel, and a terminal: Bash, Zsh, Fish or PowerShell.

## 1. Install

From npm (unverified: the package may not be published under this name yet, and a global install was not run for this guide):

```bash
npm install -g ihateposting-agent
# or
pnpm install -g ihateposting-agent
```

Or from a clone of this repository, which always works (more in [HOW_TO_RUN.md](HOW_TO_RUN.md)):

```bash
git clone https://github.com/iHatePostingOrg/iHatePosting-Agent.git
cd iHatePosting-Agent
npm install
node bin/ihateposting-agent.mjs --help
```

The rest of this page writes `ihateposting-agent`. From a clone, write `node bin/ihateposting-agent.mjs` in its place, or run `npm link` in the clone's folder to get the short name (unverified: not run for this guide; `npm unlink -g ihateposting-agent` takes it away again).

## 2. Sign in

Use a code when a person is at a browser, and a key for servers and scheduled jobs.

### With a code

```bash
ihateposting-agent auth:login
```

The program asks the sign-in server for a code and prints it:

```text
🔐 Starting device authorization flow...

  Your authorization code:

    ┌─────────────────┐
    │    ABCD-EF23    │
    └─────────────────┘

  Open this URL and enter the code above:
  <the address of the sign-in page>

  Waiting for authorization...
```

It also tries to open that page in your browser with the code filled in. Check that the code on the page is the one in your terminal, then approve. The terminal answers `✅ Successfully authenticated!`, the file it saved (`~/.ihateposting/credentials.json`) and your organization's id. If you take too long you get `❌ Authorization expired. Please try again.` or `❌ Authorization timed out. Please try again.`; run the command again.

### With a key

Your key is under Settings > Agents / Dev in iHatePosting. Put it in the environment of the current terminal:

```bash
# Bash and Zsh
export IHATEPOSTING_API_KEY="<your-api-key>"

# Fish (unverified: Fish was not run for this guide)
set -x IHATEPOSTING_API_KEY "<your-api-key>"
```

```powershell
# PowerShell
$env:IHATEPOSTING_API_KEY = "<your-api-key>"
```

To keep it for every new terminal, add the same line to your shell's startup file (`~/.bashrc` or `~/.zshrc`; in Fish `set -Ux`; in PowerShell `[Environment]::SetEnvironmentVariable("IHATEPOSTING_API_KEY", "<your-api-key>", "User")`). The persistent forms were not run for this guide (unverified), and a key kept this way sits in plain text, so use a secrets manager when you can. Keep the key out of scripts, shell history, logs and repositories.

### Check that it works

```bash
ihateposting-agent auth:status
```

It names the method (a saved sign-in, or the key in the environment), shows the first eight characters of the token or key, asks the server, and ends with one line:

- `✅ Credentials are valid. <n> integration(s) connected.` You are ready.
- `❌ Credentials are expired or invalid. Please re-authenticate.` The key or token was refused. Run `auth:login` again, or replace the key.
- `❌ Not authenticated.` Nothing is saved and no key is set.

`auth:status` ends with exit code `0` in all three cases, so read the line, not the exit code. A saved sign-in is used before the key in the environment.

## 3. Basic commands

### Find your channels and read their rules

```bash
ihateposting-agent integrations:list
ihateposting-agent integrations:settings <channel-id>
```

`integrations:list` prints the line `🔌 Connected Integrations:` and a JSON list. Each entry has an `id` (what you pass to the other commands), a `name` and an `identifier` (the platform); the server may add more, such as whether the channel is disabled. Copy the `id` of the channel you want; the examples here call it `<channel-id>`.

`integrations:settings` answers with `output.rules` (what the platform allows, in words), `output.maxLength` (the longest text for this channel), `output.settings` (the platform's own settings, as a schema) and `output.tools` (helpers you can run). [INTEGRATION_SETTINGS_DISCOVERY.md](INTEGRATION_SETTINGS_DISCOVERY.md) shows how to read it. `integrations:groups` lists your customer groups.

### Make a draft

```bash
ihateposting-agent posts:create -i <channel-id> -c "Hello from the command line" -s 2026-12-15T10:00:00Z -t draft
```

`-i` is the channel, `-c` the text, `-s` the date (always required) and `-t draft` keeps the post without publishing it. Leave `-t draft` out and it is scheduled. The answer is `✅ Post created successfully!` and a list with the `postId` of the post on each channel. Keep it.

Some platforms need a picture or a video, or settings, before a post is valid (Pinterest wants a board, YouTube a title and a video, Instagram a picture). The rules from `integrations:settings` and [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md) say which.

### Add a picture

```bash
ihateposting-agent upload ./picture.png
ihateposting-agent posts:create -i <channel-id> -c "With a picture" -m "<path from the upload answer>" -s 2026-12-15T10:00:00Z -t draft
```

`upload` prints the `id` and the `path` of the stored file, and `-m` takes that `path`. `posts:create` never uploads anything on its own. On Windows, write the file's path with forward slashes (`C:/pictures/picture.png`). `ihateposting-agent media:list -s picture` finds a file you uploaded earlier.

### See it and change it

```bash
ihateposting-agent posts:list
ihateposting-agent posts:status <post-id> --status schedule
ihateposting-agent posts:delete <post-id>
```

`posts:list` shows the posts from 30 days ago to 30 days ahead. `posts:status` moves a post between draft and scheduled; a draft queued this way goes out on the date it already has.

### Read analytics

```bash
ihateposting-agent analytics:platform <channel-id> -d 30
ihateposting-agent analytics:post <post-id>
```

The first shows a channel over the last 30 days (the default is 7). The second shows one post. A draft has not been published, so there is nothing yet for the platform to count and its answer may be empty; try again after the post has gone out. If a published post still has no numbers, it may lack the platform's own identifier: see `posts:missing` and `posts:connect` in [FEATURES.md](FEATURES.md).

## 4. Common workflows

**A thread, with a pause between the parts.** Each further `-c` is the next part; `-d` is the delay in minutes.

```bash
ihateposting-agent posts:create -i <channel-id> -c "1/3 The idea" -c "2/3 The details" -c "3/3 The link" -d 5 -s 2026-12-15T10:00:00Z -t draft
```

**Comments with their own pictures.** The nth `-m` goes with the nth `-c`.

```bash
ihateposting-agent posts:create -i <channel-id> -c "Main post" -m "<path1>" -c "First comment" -m "<path2>,<path3>" -s 2026-12-15T10:00:00Z -t draft
```

**One text for several channels.** Write `-i` once, with the ids separated by commas. `--settings` is one object for every channel in the command, so keep channels of different platforms in separate commands.

```bash
ihateposting-agent posts:create -i "<channel-id>,<other-channel-id>" -c "Posting to two places" -s 2026-12-15T10:00:00Z -t draft
```

**A short series.**

```bash
for HOUR in 09 12 15; do
  ihateposting-agent posts:create -i <channel-id> -c "Update at ${HOUR}:00" -s "2026-12-15T${HOUR}:00:00Z" -t draft
done
```

**A complicated request.** Write it in a file (see [FEATURES.md](FEATURES.md) and [examples/README.md](examples/README.md)) and send it as it is: `ihateposting-agent posts:create --json post.json`.

## 5. Tips and tricks

### Reading the output with jq

Most commands print a header line before the JSON. Skip it with `tail -n +2`:

```bash
ihateposting-agent integrations:list | tail -n +2 | jq -r '.[] | select(.disabled | not) | .id'
ihateposting-agent posts:list | tail -n +2 | jq -r '.posts[] | .id'
ihateposting-agent media:list | jq -r '.results[].path'
```

`media:list`, `media:status` and `posts:missing` print JSON only, so they need no `tail`. In PowerShell:

```powershell
ihateposting-agent integrations:list | Select-Object -Skip 1 | Out-String | ConvertFrom-Json | ForEach-Object { "$($_.identifier) $($_.id)" }
```

### Scripts

Take ids from the answers, check each exit code, and put a time limit around a command that must not hang. The program itself waits for ever for a server that does not answer, and it never retries.

```bash
#!/bin/bash
set -euo pipefail
CHANNEL="<channel-id>"
CREATED=$(timeout 120 ihateposting-agent posts:create -i "$CHANNEL" -c "Scripted draft" -s 2026-12-15T10:00:00Z -t draft | tail -n +2)
echo "Created: $(echo "$CREATED" | jq -r '.[0].postId')"
```

### Environment variables

| Variable | What it does | Default |
| --- | --- | --- |
| `IHATEPOSTING_API_KEY` | The key to use when no sign-in is saved. | none |
| `IHATEPOSTING_API_URL` | Where the API is, for the commands. Used only when no sign-in is saved. | `https://app.ihateposting.com/api` |
| `IHATEPOSTING_AUTH_SERVER` | Where `auth:login` asks for its code (`--auth-server` does the same and wins). | `https://app.ihateposting.com/api` |

To try a development server without touching your real sign-in, give the program a home folder of its own for one command, in Bash: `HOME="$(mktemp -d)" IHATEPOSTING_API_URL="http://localhost:3000" IHATEPOSTING_API_KEY="<key>" ihateposting-agent auth:status`.

### Quotes in PowerShell and `cmd`

Single quotes around JSON work in Bash and Zsh, and they were checked in PowerShell 7. Windows PowerShell 5.1 and `cmd` can lose the double quotes inside an argument (unverified: not run here). If `--settings` gives `❌ Failed to parse settings JSON`, write the request in a file and use `--json`.

## 6. Troubleshooting

### The key is not set

```text
❌ Error: No authentication found.
Options:
  1. OAuth2: ihateposting-agent auth:login --client-id <id> --client-secret <secret>
  2. API Key: export IHATEPOSTING_API_KEY=your_api_key
```

**Fix:** run `ihateposting-agent auth:login`, or export the key. The message mentions `--client-id` and `--client-secret`; the program reads neither, so plain `auth:login` is all it needs. The command ends with exit code `1`.

### Command not found

```text
ihateposting-agent: command not found
```

In PowerShell the same problem reads `The term 'ihateposting-agent' is not recognized...`. **Fix:** run it from a clone with `node bin/ihateposting-agent.mjs`, or put npm's global folder on your `PATH`. `npm prefix -g` prints that folder; the programs are in it on Windows, and in its `bin` folder elsewhere.

### The server refused

```text
❌ Failed to list integrations: Request failed: API Error (401): <the server's words>
```

Every failure has this shape, `❌ Failed to <what>: <why>`, and ends with exit code `1`. Read the number:

- **401 or 403:** the key or token is wrong or expired. Run `auth:status`.
- **400:** the request is wrong; the server's words say how (a missing field, a value that is not allowed).
- **404:** the id does not exist in this workspace. Take ids from `integrations:list` or `posts:list`.
- **429:** too many requests. Wait before you run the command again; the program does not wait for you.
- **`Request failed:` with a network message:** the address cannot be reached. Check `IHATEPOSTING_API_URL` and your connection.

### The command was refused before it left your computer

A missing or wrong option prints the command's usage and, on its last line, the reason, and ends with exit code `1`:

- `Either --content or --json is required` (an empty `-c ""` gets this too)
- `--integrations is required when not using --json`
- `--date is required when not using --json`
- `Invalid values: Argument: type, Given: "now", Choices: "schedule", "draft"`
- `Missing required argument: status` (for `posts:status` without `--status`)

A repeated `-i` (`-i a -i b`) fails with `TypeError: args.integrations.split is not a function`; write the ids once, separated by commas. JSON that does not parse prints `❌ Failed to parse settings JSON: <why>`, or `❌ Failed to parse JSON file: <why>` for a body file.

### An upload failed

`❌ Failed to upload file: ENOENT: no such file or directory ...` means the path is wrong, as seen from the folder you ran the command in. `❌ Failed to upload file: Upload failed (<status>): <the server's words>` means the server refused the file; try another format or a smaller file.

### Nothing happened, or it will not end

A word that is not a command, or an option the program does not know, is accepted silently and ends with exit code `0`: `post:create` is not `posts:create`, and `--setting` is not `--settings`. Check the spelling against `ihateposting-agent --help`. If it seems to hang, remember there is no time limit; stop it with Ctrl+C and check the address, or run it as `timeout 120 ihateposting-agent ...`.

### Analytics are empty or say missing

A post that has not been published has nothing to count. If `analytics:post` answers `{"missing": true}` for a published post, run `ihateposting-agent posts:missing <post-id>`, choose the matching content, and record it with `ihateposting-agent posts:connect <post-id> --release-id <id>`.

## 7. Getting help

```bash
ihateposting-agent --help
ihateposting-agent posts:create --help
ihateposting-agent --version
```

Help and version need no key. A command's own help lists its options, their defaults and examples.

## 8. Next steps and links

- [README.md](README.md): the whole program in one page, including what to know before pointing it at a server.
- [FEATURES.md](FEATURES.md): every command grouped by purpose, threads, comments with media, several platforms, and the shape of a request body.
- [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md): the settings of each platform.
- [SYNTAX_UPGRADE.md](SYNTAX_UPGRADE.md): the habits of this command line that people most often trip over.
- [SKILL.md](SKILL.md): the guide for AI agents, with patterns and gotchas.
- [examples/README.md](examples/README.md): ready-to-edit post bodies and scripts.
- [iHatePosting](https://ihateposting.com), its [agent pages](https://ihateposting.com/ai-agents), and [this repository's issues](https://github.com/iHatePostingOrg/iHatePosting-Agent/issues).
