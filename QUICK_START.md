# iHatePosting CLI - Quick Start Guide

## Installation

### From Source (Development)

```bash
# Clone the repository and navigate to its root
git clone https://github.com/iHatePostingOrg/iHatePosting-Agent.git
cd iHatePosting-Agent

# Install dependencies
npm install

# There is no build step: the CLI is plain JavaScript that runs as it is written

# Test locally
node bin/ihateposting-agent.mjs --help
```

### Global Installation (Development)

```bash
# From the repository root
cd iHatePosting-Agent

# Link globally
npm link

# Now you can use 'ihateposting-agent' anywhere
ihateposting-agent --help
```

### From npm

```bash
# Install globally
npm install -g ihateposting-agent

# Or with pnpm
pnpm add -g ihateposting-agent
```

## Setup

### 1. Get Your API Key

1. Log in to your iHatePosting account
2. Navigate to Settings → Agents / Dev
3. Copy your workspace API key

### 2. Set Environment Variable

```bash
# Bash/Zsh
export IHATEPOSTING_API_KEY=your_api_key_here

# Fish
set -x IHATEPOSTING_API_KEY your_api_key_here

# PowerShell
$env:IHATEPOSTING_API_KEY="your_api_key_here"
```

To make it permanent, add it to your shell profile:

```bash
# ~/.bashrc or ~/.zshrc
echo 'export IHATEPOSTING_API_KEY=your_api_key_here' >> ~/.bashrc
source ~/.bashrc
```

### 3. Verify Installation

```bash
ihateposting-agent --help
```

## Basic Commands

### Create a Post

```bash
# Simple post
ihateposting-agent posts:create -c "Hello World!" -s "2024-12-31T12:00:00Z" -i "x-123"

# Post with multiple images
ihateposting-agent posts:create \
  -c "Check these out!" \
  -m "img1.jpg,img2.jpg" \
  -s "2024-12-31T12:00:00Z" \
  -i "x-123"

# Post with comments (each can have different media!)
ihateposting-agent posts:create \
  -c "Main post" -m "main.jpg" \
  -c "First comment" -m "comment1.jpg" \
  -c "Second comment" -m "comment2.jpg" \
  -s "2024-12-31T12:00:00Z" \
  -i "x-123"

# Scheduled post
ihateposting-agent posts:create \
  -c "Future post" \
  -s "2024-12-31T12:00:00Z" \
  -i "x-123"
```

`-m` takes the `path` that `upload` returns for a file you uploaded first (see Upload Media below); `img1.jpg` and the like stand for those paths here.

### List Posts

```bash
# List all posts (last 30 days to next 30 days)
ihateposting-agent posts:list

# In a date window
ihateposting-agent posts:list --startDate "2024-01-01T00:00:00Z" --endDate "2024-12-31T23:59:59Z"

# One customer's posts
ihateposting-agent posts:list --customer "customer-id"
```

### Delete a Post

```bash
ihateposting-agent posts:delete abc123xyz
```

### List Integrations

```bash
ihateposting-agent integrations:list
```

### Upload Media

```bash
ihateposting-agent upload ./path/to/image.png
```

### List Uploaded Media

```bash
ihateposting-agent media:list --search banner
```

## Common Workflows

### 1. Check What's Connected

```bash
# See all your connected social media accounts
ihateposting-agent integrations:list
```

The output starts with the line `🔌 Connected Integrations:`, then shows integration IDs like:
```json
[
  { "id": "x-123", "name": "Example Studio", "identifier": "x" },
  { "id": "linkedin-456", "name": "Example Company", "identifier": "linkedin" }
]
```

Each entry has an `id` (what you pass to the other commands), a `name` and an `identifier` (the platform); the server may add more fields.

### 2. Create Multi-Platform Post

```bash
# Use the integration IDs from step 1
ihateposting-agent posts:create \
  -c "Posting to multiple platforms!" \
  -s "2024-12-31T12:00:00Z" \
  -i "x-123,linkedin-456,facebook-789"
```

### 3. Schedule Multiple Posts

```bash
# Morning post
ihateposting-agent posts:create -c "Good morning!" -s "2024-01-15T09:00:00Z" -i "x-123"

# Afternoon post
ihateposting-agent posts:create -c "Lunch time update!" -s "2024-01-15T12:00:00Z" -i "x-123"

# Evening post
ihateposting-agent posts:create -c "Good night!" -s "2024-01-15T20:00:00Z" -i "x-123"
```

### 4. Upload and Post Image

```bash
# First upload the image
ihateposting-agent upload ./my-image.png

# Copy the path (the URL) from the response, then create post
ihateposting-agent posts:create -c "Check out this image!" -m "path-from-upload" -s "2024-12-31T12:00:00Z" -i "x-123"
```

## Tips & Tricks

### Using with jq for JSON Parsing

```bash
# Most commands print a header line before the JSON: skip it with tail -n +2
# (media:list, media:status and posts:missing print the JSON alone)

# Get just the post IDs
ihateposting-agent posts:list | tail -n +2 | jq '.posts[] | .id'

# Get integration names
ihateposting-agent integrations:list | tail -n +2 | jq '.[] | .name'
```

### Script Automation

```bash
#!/bin/bash
# Create a batch of posts

for hour in 09 12 15 18; do
  ihateposting-agent posts:create \
    -c "Automated post at ${hour}:00" \
    -s "2024-01-15T${hour}:00:00Z" \
    -i "x-123"
  echo "Created post for ${hour}:00"
done
```

### Environment Variables

```bash
# Custom API endpoint
export IHATEPOSTING_API_URL=https://your-custom-api.com

# Use the CLI with custom endpoint
ihateposting-agent posts:list
```

`IHATEPOSTING_API_URL` (like `IHATEPOSTING_API_KEY`) counts only when no sign-in is saved: a sign-in saved by `ihateposting-agent auth:login` brings its own API address and is used first. Run `ihateposting-agent auth:logout` to let the variables count.

## Troubleshooting

### API Key Not Set

```
❌ Error: No authentication found.
Options:
  1. OAuth2: ihateposting-agent auth:login
  2. API Key: export IHATEPOSTING_API_KEY=your_api_key
```

**Solution:** Set the environment variable:
```bash
export IHATEPOSTING_API_KEY=your_key
```

Or sign in with `ihateposting-agent auth:login`.

### Command Not Found

```
ihateposting-agent: command not found
```

**Solution:** Either:
1. Use the full path: `node bin/ihateposting-agent.mjs`
2. Link globally: `npm link` (from the repository root)
3. Add to PATH: `export PATH=$PATH:$(npm prefix -g)/bin` (`npm prefix -g` prints npm's global folder; on Windows the programs are in that folder itself, not in a `bin` folder)

### API Errors

```
❌ Failed to list integrations: Request failed: API Error (401): <the server's words>
```

**Solution:** Check your API key is valid and has proper permissions.

```
❌ Failed to delete post: Request failed: API Error (404): <the server's words>
```

**Solution:** Verify the post ID exists when deleting.

## Getting Help

```bash
# General help
ihateposting-agent --help

# Command-specific help
ihateposting-agent posts:create --help
ihateposting-agent posts:list --help
ihateposting-agent posts:delete --help
```

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check [SKILL.md](./SKILL.md) for AI agent integration patterns
- See [examples/](./examples/) for more usage examples

## Links

- [iHatePosting Website](https://ihateposting.com)
- [GitHub Repository](https://github.com/iHatePostingOrg/iHatePosting-Agent)
- [Report Issues](https://github.com/iHatePostingOrg/iHatePosting-Agent/issues)

## Sections that were in this file before it followed the reference

This file now follows the reference page's headings (the owner's decision, 2026-11-15). These sections have no counterpart there, so they moved here unchanged (each one is a third-level heading here, and the sections under it are fourth-level headings).

### Before you start

From nothing to a first draft post and a look at its analytics, in a few minutes. Nothing below publishes anything: the post is made as a draft.

You need Node.js 20 or newer (`node --version` tells you which you have), an iHatePosting workspace with at least one connected channel, and a terminal: Bash, Zsh, Fish or PowerShell.

### 2. Sign in

Use a code when a person is at a browser, and a key for servers and scheduled jobs.

#### With a code

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

#### Check that it works

```bash
ihateposting-agent auth:status
```

It names the method (a saved sign-in, or the key in the environment), shows the first eight characters of the token or key, asks the server, and ends with one line:

- `✅ Credentials are valid. <n> integration(s) connected.` You are ready.
- `❌ Credentials are expired or invalid. Please re-authenticate.` The key or token was refused. Run `auth:login` again, or replace the key.
- `❌ Not authenticated.` Nothing is saved and no key is set.

`auth:status` ends with exit code `0` in all three cases, so read the line, not the exit code. A saved sign-in is used before the key in the environment.

### 3. Basic commands

#### Find your channels and read their rules

```bash
ihateposting-agent integrations:list
ihateposting-agent integrations:settings <channel-id>
```

`integrations:list` prints the line `🔌 Connected Integrations:` and a JSON list. Each entry has an `id` (what you pass to the other commands), a `name` and an `identifier` (the platform); the server may add more, such as whether the channel is disabled. Copy the `id` of the channel you want; the examples here call it `<channel-id>`.

`integrations:settings` answers with `output.rules` (what the platform allows, in words), `output.maxLength` (the longest text for this channel), `output.settings` (the platform's own settings, as a schema) and `output.tools` (helpers you can run). [INTEGRATION_SETTINGS_DISCOVERY.md](INTEGRATION_SETTINGS_DISCOVERY.md) shows how to read it. `integrations:groups` lists your customer groups.

#### Make a draft

```bash
ihateposting-agent posts:create -i <channel-id> -c "Hello from the command line" -s 2026-12-15T10:00:00Z -t draft
```

`-i` is the channel, `-c` the text, `-s` the date (always required) and `-t draft` keeps the post without publishing it. Leave `-t draft` out and it is scheduled. The answer is `✅ Post created successfully!` and a list with the `postId` of the post on each channel. Keep it.

Some platforms need a picture or a video, or settings, before a post is valid (Pinterest wants a board, YouTube a title and a video, Instagram a picture). The rules from `integrations:settings` and [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md) say which.

#### See it and change it

```bash
ihateposting-agent posts:list
ihateposting-agent posts:status <post-id> --status schedule
ihateposting-agent posts:delete <post-id>
```

`posts:list` shows the posts from 30 days ago to 30 days ahead. `posts:status` moves a post between draft and scheduled; a draft queued this way goes out on the date it already has.

#### Read analytics

```bash
ihateposting-agent analytics:platform <channel-id> -d 30
ihateposting-agent analytics:post <post-id>
```

The first shows a channel over the last 30 days (the default is 7). The second shows one post. A draft has not been published, so there is nothing yet for the platform to count and its answer may be empty; try again after the post has gone out. If a published post still has no numbers, it may lack the platform's own identifier: see `posts:missing` and `posts:connect` in [FEATURES.md](FEATURES.md).

### 4. Common workflows

**A thread, with a pause between the parts.** Each further `-c` is the next part; `-d` is the delay in minutes.

```bash
ihateposting-agent posts:create -i <channel-id> -c "1/3 The idea" -c "2/3 The details" -c "3/3 The link" -d 5 -s 2026-12-15T10:00:00Z -t draft
```

**One text for several channels.** Write `-i` once, with the ids separated by commas. `--settings` is one object for every channel in the command, so keep channels of different platforms in separate commands.

```bash
ihateposting-agent posts:create -i "<channel-id>,<other-channel-id>" -c "Posting to two places" -s 2026-12-15T10:00:00Z -t draft
```

**A complicated request.** Write it in a file (see [FEATURES.md](FEATURES.md) and [examples/README.md](examples/README.md)) and send it as it is: `ihateposting-agent posts:create --json post.json`.

### 5. Tips and tricks

#### Quotes in PowerShell and `cmd`

Single quotes around JSON work in Bash and Zsh, and they were checked in PowerShell 7. Windows PowerShell 5.1 and `cmd` can lose the double quotes inside an argument (unverified: not run here). If `--settings` gives `❌ Failed to parse settings JSON`, write the request in a file and use `--json`.

### 6. Troubleshooting

#### The server refused

```text
❌ Failed to list integrations: Request failed: API Error (401): <the server's words>
```

Every failure has this shape, `❌ Failed to <what>: <why>`, and ends with exit code `1`. Read the number:

- **401 or 403:** the key or token is wrong or expired. Run `auth:status`.
- **400:** the request is wrong; the server's words say how (a missing field, a value that is not allowed).
- **404:** the id does not exist in this workspace. Take ids from `integrations:list` or `posts:list`.
- **429:** too many requests. Wait before you run the command again; the program does not wait for you.
- **`Request failed:` with a network message:** the address cannot be reached. Check `IHATEPOSTING_API_URL` and your connection.

#### The command was refused before it left your computer

A missing or wrong option prints the command's usage and, on its last line, the reason, and ends with exit code `1`:

- `Either --content or --json is required` (an empty `-c ""` gets this too)
- `--integrations is required when not using --json`
- `--date is required when not using --json`
- `Invalid values: Argument: type, Given: "now", Choices: "schedule", "draft"`
- `Missing required argument: status` (for `posts:status` without `--status`)

A repeated `-i` (`-i a -i b`) fails with `TypeError: args.integrations.split is not a function`; write the ids once, separated by commas. JSON that does not parse prints `❌ Failed to parse settings JSON: <why>`, or `❌ Failed to parse JSON file: <why>` for a body file.

#### An upload failed

`❌ Failed to upload file: ENOENT: no such file or directory ...` means the path is wrong, as seen from the folder you ran the command in. `❌ Failed to upload file: Upload failed (<status>): <the server's words>` means the server refused the file; try another format or a smaller file.

#### Nothing happened, or it will not end

A word that is not a command, or an option the program does not know, is accepted silently and ends with exit code `0`: `post:create` is not `posts:create`, and `--setting` is not `--settings`. Check the spelling against `ihateposting-agent --help`. If it seems to hang, remember there is no time limit; stop it with Ctrl+C and check the address, or run it as `timeout 120 ihateposting-agent ...`.

#### Analytics are empty or say missing

A post that has not been published has nothing to count. If `analytics:post` answers `{"missing": true}` for a published post, run `ihateposting-agent posts:missing <post-id>`, choose the matching content, and record it with `ihateposting-agent posts:connect <post-id> --release-id <id>`.
