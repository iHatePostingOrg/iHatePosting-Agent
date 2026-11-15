<p align="center">
  <img src="assets/logo.png" alt="iHatePosting" width="96" />
</p>

<p align="center">
  <strong>Schedule posts with agents to:</strong><br />
  <a href="https://ihateposting.com/ai-agents/chatgpt">ChatGPT</a> ·
  <a href="https://ihateposting.com/ai-agents/claude">Claude</a> ·
  <a href="https://ihateposting.com/ai-agents/claude-cowork">Claude Cowork</a> ·
  <a href="https://ihateposting.com/ai-agents/claude-code">Claude Code</a> ·
  <a href="https://ihateposting.com/ai-agents/codex">Codex</a> ·
  <a href="https://ihateposting.com/ai-agents/cursor">Cursor</a> ·
  <a href="https://ihateposting.com/ai-agents/openclaw">OpenClaw</a> ·
  <a href="https://ihateposting.com/ai-agents/hermes-agent">Hermes Agent</a> ·
  <a href="https://ihateposting.com/ai-agents/grok-bot">Grok Bot</a> ·
  <a href="https://ihateposting.com/ai-agents/grok-build">Grok Build</a> ·
  <a href="https://ihateposting.com/ai-agents/muse">Muse</a> ·
  <a href="https://ihateposting.com/ai-agents/perplexity-computer">Perplexity Computer</a> ·
  <a href="https://ihateposting.com/ai-agents/nanoclaw">nanoclaw</a> ·
  <a href="https://ihateposting.com/ai-agents/paperclip">Paperclip</a> ·
  <a href="https://ihateposting.com/ai-agents">MCP Server</a> ·
  <a href="https://ihateposting.com/ai-agents">AI Agents CLI</a>
</p>

## Install as a skill

```bash
npx skills add iHatePostingOrg/iHatePosting-Agent
```

### Claude Code plugin

```bash
/plugin marketplace add iHatePostingOrg/iHatePosting-Agent
/plugin install ihateposting@ihateposting-agent
```

### Grok Build plugin

This repo carries its own `.grok-plugin/plugin.json` manifest and `.grok-plugin/marketplace.json` catalog, so it can be added as a marketplace source directly.

The Grok plugin also bundles the hosted iHatePosting MCP server (`https://app.ihateposting.com/api/mcp/oauth`) via the `mcpServers` field in `.grok-plugin/plugin.json` — you'll be asked to sign in to iHatePosting on first connection; no token or local install needed. The Claude Code plugin is skill-only and does not register an MCP server; the Cursor plugin registers the same hosted server.

### Cursor plugin

This repo ships a [Cursor plugin](https://cursor.com/docs/reference/plugins) manifest at `.cursor-plugin/plugin.json`.

- **Local install (development):**

  ```bash
  git clone https://github.com/iHatePostingOrg/iHatePosting-Agent.git
  ln -s "$(pwd)/iHatePosting-Agent" ~/.cursor/plugins/local/ihateposting
  ```

  then restart Cursor or run **Developer: Reload Window**.

The plugin exposes the `ihateposting` skill, which drives the `ihateposting-agent` CLI (the CLI handles media uploads, which is required for image/video posts). Make sure the CLI is installed (`npm install -g ihateposting-agent`) and authenticated (`ihateposting-agent auth:login` or `export IHATEPOSTING_API_KEY=...`) before asking the agent to post.

### Gemini CLI extension

This repo is a [Gemini CLI extension](https://geminicli.com/docs/extensions/) (`gemini-extension.json` at the root).

```bash
gemini extensions install https://github.com/iHatePostingOrg/iHatePosting-Agent
```

It installs the hosted iHatePosting MCP server (`https://app.ihateposting.com/api/mcp/oauth`). Gemini CLI opens a browser to sign in to iHatePosting on first use; run `/mcp auth ihateposting` to re-authenticate.

### Qwen Code

Qwen Code installs Claude Code marketplaces directly, so no separate manifest is needed:

```bash
qwen extensions install iHatePostingOrg/iHatePosting-Agent:ihateposting
```

### DeepSeek Harness plugin

This repo ships a [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) bundle at [`plugins/dsh-ihateposting`](plugins/dsh-ihateposting). It connects the agent to the hosted iHatePosting MCP server and registers an `ihateposting` workflow skill.

```bash
dsh plugin --profile web add "github:iHatePostingOrg/iHatePosting-Agent#path:/plugins/dsh-ihateposting"
export IHATEPOSTING_API_KEY=your-api-key   # iHatePosting → Settings → Agents / Dev
dsh web
```

The iHatePosting tools then appear as `mcp__ihateposting__*` (`integrationList`, `integrationSchema`, `integrationSchedulePostTool`, ...). See the [plugin README](plugins/dsh-ihateposting/README.md) for configuration.

# iHatePosting CLI

**Social media automation CLI for AI agents** - Schedule posts across 15 platforms programmatically.

The iHatePosting CLI provides a command-line interface to the iHatePosting API, enabling developers and AI agents to automate social media posting, manage content, and handle media uploads across platforms like Twitter/X, LinkedIn, YouTube, TikTok, Instagram, Facebook, and more.

---

## Installation

### From npm (Recommended)

```bash
npm install -g ihateposting-agent
# or
pnpm install -g ihateposting-agent
```

---

## Authentication

### Option 1: OAuth2 (Recommended)

Authenticate using the device flow — no client ID or secret needed:

```bash
ihateposting-agent auth:login
```

This will:
1. Display a one-time code in your terminal
2. Open your browser to authorize
3. Automatically save credentials to `~/.ihateposting/credentials.json`

```bash
# Check current auth status (verifies credentials are still valid)
ihateposting-agent auth:status

# Remove stored credentials
ihateposting-agent auth:logout
```

#### Self-Hosting the Auth Server

By default, `ihateposting-agent auth:login` uses the sign-in routes of the iHatePosting app (`https://app.ihateposting.com/api`). The OAuth2 device flow server is part of the app, so there is no separate server to host; another server that answers the same routes can be named with `IHATEPOSTING_AUTH_SERVER` or `--auth-server`.

### Option 2: API Key

```bash
export IHATEPOSTING_API_KEY=your_api_key_here
```

**Optional:** Custom API endpoint

```bash
export IHATEPOSTING_API_URL=https://your-custom-api.com
```

> **Note:** OAuth2 credentials take priority over the API key when both are present.

---

## Commands

### Discovery & Settings

**List all connected integrations**
```bash
ihateposting-agent integrations:list
ihateposting-agent integrations:list --group "customer-id"
```

Returns integration IDs, provider names, and metadata. Use `--group` to return only the channels assigned to a specific group (customer).

**List all groups (customers)**
```bash
ihateposting-agent integrations:groups
```

Returns all groups (customers) for your organization as `{id, name}`. Use a group's `id` with `integrations:list --group` to filter channels.

**Get integration settings schema**
```bash
ihateposting-agent integrations:settings <integration-id>
```

Returns character limits, required settings, and available tools for fetching dynamic data.

**Trigger integration tools**
```bash
ihateposting-agent integrations:trigger <integration-id> <method-name>
ihateposting-agent integrations:trigger <integration-id> <method-name> -d '{"key":"value"}'
```

Fetch dynamic data like Pinterest boards, Slack and Discord channels, LinkedIn company pages, etc.

**Examples:**
```bash
# Get Pinterest boards
ihateposting-agent integrations:trigger pinterest-123 boards

# Get Slack channels
ihateposting-agent integrations:trigger slack-456 channels

# Find a LinkedIn company page to tag, by its exact vanity name
ihateposting-agent integrations:trigger linkedin-789 mention -d '{"query":"microsoft"}'
```

---

### Creating Posts

**Simple scheduled post**
```bash
ihateposting-agent posts:create -c "Content" -s "2024-12-31T12:00:00Z" -i "integration-id"
```

**Draft post**
```bash
ihateposting-agent posts:create -c "Content" -s "2024-12-31T12:00:00Z" -t draft -i "integration-id"
```

**Post with media**
```bash
ihateposting-agent posts:create -c "Content" -m "img1.jpg,img2.jpg" -s "2024-12-31T12:00:00Z" -i "integration-id"
```

**Post with comments** (each comment can have its own media)
```bash
ihateposting-agent posts:create \
  -c "Main post" -m "main.jpg" \
  -c "First comment" -m "comment1.jpg" \
  -c "Second comment" -m "comment2.jpg,comment3.jpg" \
  -s "2024-12-31T12:00:00Z" \
  -i "integration-id"
```

**Multi-platform post**
```bash
ihateposting-agent posts:create -c "Content" -s "2024-12-31T12:00:00Z" -i "x-id,linkedin-id,facebook-id"
```

**Platform-specific settings**
```bash
ihateposting-agent posts:create \
  -c "Content" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{"board":"1234567890"}' \
  -i "pinterest-id"
```

**Complex post from JSON file**
```bash
ihateposting-agent posts:create --json post.json
```

**Options:**
- `-c, --content` - Post/comment content (use multiple times for posts with comments)
- `-s, --date` - Schedule date in ISO 8601 format (REQUIRED)
- `-t, --type` - Post type: "schedule" or "draft" (default: "schedule")
- `-m, --media` - Comma-separated media URLs for corresponding `-c`
- `--alt` - Comma-separated alt texts for the media of the corresponding `-m`, same order (use `--json` with `image[].alt` for alt texts containing commas)
- `-i, --integrations` - Comma-separated integration IDs (required)
- `-d, --delay` - Delay between comments in minutes (default: 0)
- `--settings` - Platform-specific settings as JSON string
- `-j, --json` - Path to JSON file with full post structure
- `--shortLink` - Use short links (default: true)

---

### Managing Posts

**List posts**
```bash
ihateposting-agent posts:list
ihateposting-agent posts:list --startDate "2024-01-01T00:00:00Z" --endDate "2024-12-31T23:59:59Z"
ihateposting-agent posts:list --customer "customer-id"
```

Defaults to last 30 days to next 30 days if dates not specified. Each returned post includes its current `settings` (returned as a JSON string — `JSON.parse` it). The intended workflow is `posts:list` (read current settings) → `posts:settings` (patch them).

**Delete post**
```bash
ihateposting-agent posts:delete <post-id>
```

**Change post status (draft ↔ schedule)**
```bash
ihateposting-agent posts:status <post-id> --status draft
ihateposting-agent posts:status <post-id> --status schedule
```

Move a scheduled post back to a draft, or promote a draft into the publishing queue. Switching to `draft` also terminates any workflow that's already running for the post, so it won't publish. Switching to `schedule` queues the post for publishing at its stored date.

**Update a post's provider-specific settings**
```bash
ihateposting-agent posts:settings <post-id> --settings '{"content_posting_method":"DIRECT_POST"}'
ihateposting-agent posts:settings <post-id> --settings '{"board":"1234567890","title":"My title"}'
```

Patches a post's settings server-side. The backend **merges** the object — only the keys you pass change, everything else is preserved — so pass a partial object, not the full settings blob. Only **DRAFT/QUEUE** (unpublished) posts can be updated; published posts are rejected. Pass the **main post id**, not a comment id. Do **not** include `__type` — the backend adds it automatically from the integration.

---

### Analytics

**Get platform analytics**
```bash
ihateposting-agent analytics:platform <integration-id>
ihateposting-agent analytics:platform <integration-id> -d 30
```

Returns metrics like followers, impressions, and engagement over time for a specific integration/channel. The `-d` flag specifies the number of days to look back (default: 7).

**Get post analytics**
```bash
ihateposting-agent analytics:post <post-id>
ihateposting-agent analytics:post <post-id> -d 30
```

Returns metrics like likes, comments, shares, and impressions for a specific published post.

**⚠️ If `analytics:post` returns `{"missing": true}`**, the post was published but the platform didn't return a usable post ID. You must resolve this before analytics will work:

```bash
# 1. List available content from the provider
ihateposting-agent posts:missing <post-id>

# 2. Connect the correct content to the post
ihateposting-agent posts:connect <post-id> --release-id "7321456789012345678"

# 3. Analytics will now work
ihateposting-agent analytics:post <post-id>
```

---

### Connecting Missing Posts

Some platforms (e.g. TikTok) don't return a post ID immediately after publishing. The post's `releaseId` is set to `"missing"` and analytics won't work until resolved.

**List available content from the provider**
```bash
ihateposting-agent posts:missing <post-id>
```

Returns an array of `{id, url}` items representing recent content from the provider. Returns an empty array if the provider doesn't support this feature, which is the case for every platform today, so find the id on the platform itself and pass it to `posts:connect`.

**Connect a post to its published content**
```bash
ihateposting-agent posts:connect <post-id> --release-id "<content-id>"
```

---

### Media Upload

**Upload file and get URL**
```bash
ihateposting-agent upload <file-path>
```

**⚠️ IMPORTANT: Upload Files Before Posting**

You **must** upload media files to iHatePosting before using them in posts. Many platforms (especially TikTok, Instagram, and YouTube) require verified/trusted URLs and will reject external links.

**Workflow:**
1. Upload your file using `ihateposting-agent upload`
2. Extract the returned URL
3. Use that URL in your post's `-m` parameter

**Supported formats:**
- **Images:** PNG, JPG, JPEG, GIF
- **Videos:** MP4

**Example:**
```bash
# 1. Upload the file first
RESULT=$(ihateposting-agent upload video.mp4 | tail -n +2)   # tail skips the header line
MEDIA_PATH=$(echo "$RESULT" | jq -r '.path')

# 2. Use the iHatePosting URL in your post
ihateposting-agent posts:create -c "Check out my video!" -s "2024-12-31T12:00:00Z" -m "$MEDIA_PATH" -i "tiktok-id"
```

**Adjust media to the platforms' limits**

`--adjust` is accepted (it is off by default), but iHatePosting does no adjusting: the file is used as uploaded and every upload is ready at once.
```bash
ihateposting-agent upload video.mp4 --adjust
ihateposting-agent media:status <id>       # "ready" straight away
```

Because the status is always `ready`, there is nothing to wait for before publishing a post with this `path`.

**Reuse already uploaded media**

Files already in your media library do not need uploading again. List them (newest first, 18 per page) and reuse a file's `path`:
```bash
ihateposting-agent media:list
ihateposting-agent media:list -s banner    # filter by original file name (case-insensitive)
ihateposting-agent media:list -p 2         # page number, starting at 1
```

Returns an object with `pages` (the total page count) and `results`, a list of files with `id`, `name`, `originalName`, `path` (the URL to reuse in a post) and `createdAt`.

**Why this is required:**
- **TikTok, Instagram, YouTube** only accept URLs from trusted domains
- **Security:** Platforms verify media sources to prevent abuse
- **Reliability:** iHatePosting ensures your media is always accessible

---

## Platform-Specific Features

### Pinterest
```bash
# Get your boards (the id of a board is required)
ihateposting-agent integrations:trigger pinterest-id boards

# Upload the picture FIRST (required!)
IMAGE=$(ihateposting-agent upload image.jpg | tail -n +2)
IMAGE_URL=$(echo "$IMAGE" | jq -r '.path')

# Pin it to a board
ihateposting-agent posts:create \
  -c "Pin description" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{"board":"1234567890","title":"Pin Title"}' \
  -m "$IMAGE_URL" \
  -i "pinterest-id"
```

### YouTube
```bash
# Upload video FIRST (required!)
VIDEO=$(ihateposting-agent upload video.mp4 | tail -n +2)
VIDEO_URL=$(echo "$VIDEO" | jq -r '.path')

# Post with uploaded video URL
ihateposting-agent posts:create \
  -c "Video description" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{"title":"Video Title","type":"public","tags":[{"value":"tech","label":"Tech"}]}' \
  -m "$VIDEO_URL" \
  -i "youtube-id"
```

### TikTok
```bash
# Upload video FIRST (TikTok only accepts verified URLs!)
VIDEO=$(ihateposting-agent upload video.mp4 | tail -n +2)
VIDEO_URL=$(echo "$VIDEO" | jq -r '.path')

# Post with uploaded video URL
ihateposting-agent posts:create \
  -c "Video caption #fyp" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{"content_posting_method":"DIRECT_POST","privacy_level":"PUBLIC_TO_EVERYONE","duet":true,"stitch":true,"comment":true,"autoAddMusic":"no","brand_content_toggle":false,"brand_organic_toggle":false}' \
  -m "$VIDEO_URL" \
  -i "tiktok-id"
```

### LinkedIn
```bash
# A LinkedIn Page is a channel of its own: find the page in your channels
ihateposting-agent integrations:list

# Post as the page, with the page's channel id
ihateposting-agent posts:create \
  -c "Company announcement" \
  -s "2024-12-31T12:00:00Z" \
  -i "linkedin-page-id"
```

### X (Twitter)
```bash
# Create thread
ihateposting-agent posts:create \
  -c "Thread 1/3 🧵" \
  -c "Thread 2/3" \
  -c "Thread 3/3" \
  -s "2024-12-31T12:00:00Z" \
  -d 2000 \
  -i "x-id"

# With reply settings
ihateposting-agent posts:create \
  -c "Tweet content" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{"who_can_reply_post":"everyone"}' \
  -i "x-id"
```

### Instagram
```bash
# Upload image FIRST (Instagram requires verified URLs!)
IMAGE=$(ihateposting-agent upload image.jpg | tail -n +2)
IMAGE_URL=$(echo "$IMAGE" | jq -r '.path')

# Regular post
ihateposting-agent posts:create \
  -c "Caption #hashtag" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{"post_type":"post"}' \
  -m "$IMAGE_URL" \
  -i "instagram-id"

# Story (upload first)
STORY=$(ihateposting-agent upload story.jpg | tail -n +2)
STORY_URL=$(echo "$STORY" | jq -r '.path')

ihateposting-agent posts:create \
  -c "Story" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{"post_type":"story"}' \
  -m "$STORY_URL" \
  -i "instagram-id"
```

**See [PROVIDER_SETTINGS.md](./PROVIDER_SETTINGS.md) for all 15 platforms.**

---

## Features for AI Agents

### Discovery Workflow
The CLI enables dynamic discovery of integration capabilities:

1. **List integrations** - Get available social media accounts
2. **Get settings** - Retrieve character limits, required fields, and available tools
3. **Trigger tools** - Fetch dynamic data (boards, channels, company pages, etc.)
4. **Create posts** - Use discovered data in posts
5. **Analyze** - Get post analytics; if `{"missing": true}` is returned, resolve with `posts:missing` + `posts:connect`

This allows AI agents to adapt to different platforms without hardcoded knowledge.

### JSON Mode
For complex posts with multiple platforms and settings:

```bash
ihateposting-agent posts:create --json complex-post.json
```

JSON structure:
```json
{
  "type": "schedule",
  "date": "2024-12-31T12:00:00Z",
  "shortLink": true,
  "tags": [],
  "posts": [
    {
      "integration": { "id": "x-123" },
      "value": [
        { "content": "Tweet version", "image": [{ "id": "image-1", "path": "twitter-image.jpg" }] }
      ],
      "settings": {}
    },
    {
      "integration": { "id": "linkedin-456" },
      "value": [
        { "content": "LinkedIn version with more context...", "image": [{ "id": "image-2", "path": "linkedin-image.jpg" }] }
      ],
      "settings": {}
    }
  ]
}
```

### All Output is JSON
Every command prints JSON for easy parsing, after one header line (`posts:missing`, `media:list` and `media:status` print the JSON alone; `posts:delete` prints only its header line). Skip the header line with `tail -n +2`:

```bash
INTEGRATIONS=$(ihateposting-agent integrations:list | tail -n +2)
X_ID=$(echo "$INTEGRATIONS" | jq -r '.[] | select(.identifier=="x") | .id')
```

### Threading Support
Comments are automatically converted to threads/replies based on platform:
- **Twitter/X**: Thread of tweets
- **LinkedIn**: Comment on post
- **Instagram**: First comment

```bash
ihateposting-agent posts:create \
  -c "Main post" \
  -c "Comment 1" \
  -c "Comment 2" \
  -i "integration-id"
```

---

## Common Workflows

### Pinterest Pin with Board
```bash
#!/bin/bash
PINTEREST_ID=$(ihateposting-agent integrations:list | tail -n +2 | jq -r '.[] | select(.identifier=="pinterest") | .id')
BOARDS=$(ihateposting-agent integrations:trigger "$PINTEREST_ID" boards | tail -n +2)
BOARD_ID=$(echo "$BOARDS" | jq -r '.output[0].id')

ihateposting-agent posts:create \
  -c "My pin description" \
  -s "2024-12-31T12:00:00Z" \
  --settings "{\"board\":\"$BOARD_ID\",\"title\":\"Pin Title\"}" \
  -m "image.jpg" \
  -i "$PINTEREST_ID"
```

### YouTube Video Upload
```bash
#!/bin/bash
VIDEO=$(ihateposting-agent upload video.mp4 | tail -n +2)
VIDEO_PATH=$(echo "$VIDEO" | jq -r '.path')

ihateposting-agent posts:create \
  -c "Video description..." \
  -s "2024-12-31T12:00:00Z" \
  --settings '{"title":"My Video","type":"public","tags":[{"value":"tech","label":"Tech"}]}' \
  -m "$VIDEO_PATH" \
  -i "youtube-id"
```

### Multi-Platform Campaign
```bash
#!/bin/bash
ihateposting-agent posts:create \
  -c "Same content everywhere" \
  -s "2024-12-31T12:00:00Z" \
  -m "image.jpg" \
  -i "x-id,linkedin-id,facebook-id"
```

### Batch Scheduling
```bash
#!/bin/bash
DATES=("2024-02-14T09:00:00Z" "2024-02-15T09:00:00Z" "2024-02-16T09:00:00Z")
CONTENT=("Monday motivation 💪" "Tuesday tips 💡" "Wednesday wisdom 🧠")

for i in "${!DATES[@]}"; do
  ihateposting-agent posts:create \
    -c "${CONTENT[$i]}" \
    -s "${DATES[$i]}" \
    -i "x-id"
done
```

---

## Documentation

**For AI Agents:**
- **[SKILL.md](./SKILL.md)** - Complete skill reference with patterns and examples

**Deep-Dive Guides:**
- **[HOW_TO_RUN.md](./HOW_TO_RUN.md)** - Installation and setup methods
- **[COMMAND_LINE_GUIDE.md](./examples/COMMAND_LINE_GUIDE.md)** - Complete command syntax reference
- **[PROVIDER_SETTINGS.md](./PROVIDER_SETTINGS.md)** - All platform settings schemas
- **[INTEGRATION_TOOLS_WORKFLOW.md](./INTEGRATION_TOOLS_WORKFLOW.md)** - Tools workflow guide
- **[INTEGRATION_SETTINGS_DISCOVERY.md](./INTEGRATION_SETTINGS_DISCOVERY.md)** - Settings discovery
- **[SUPPORTED_FILE_TYPES.md](./SUPPORTED_FILE_TYPES.md)** - Media format reference
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Code architecture
- **[PUBLISHING.md](./PUBLISHING.md)** - npm publishing guide

**Examples:**
- **[examples/EXAMPLES.md](./examples/EXAMPLES.md)** - Comprehensive examples
- **[examples/](./examples/)** - Ready-to-use scripts and JSON files

---

## API Endpoints

The CLI interacts with these iHatePosting API endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/public/v1/posts` | POST | Create a post |
| `/public/v1/posts` | GET | List posts |
| `/public/v1/posts/:id` | DELETE | Delete a post |
| `/public/v1/posts/:id/settings` | PUT | Update a post's provider settings (merged; unpublished only) |
| `/public/v1/posts/:id/missing` | GET | Get missing content from provider |
| `/public/v1/posts/:id/release-id` | PUT | Update release ID for a post |
| `/public/v1/integrations` | GET | List integrations (optional `?group=` filter) |
| `/public/v1/groups` | GET | List groups (customers) |
| `/public/v1/integration-settings/:id` | GET | Get integration settings |
| `/public/v1/integration-trigger/:id` | POST | Trigger integration tool |
| `/public/v1/analytics/:integration` | GET | Get platform analytics |
| `/public/v1/analytics/post/:postId` | GET | Get post analytics |
| `/public/v1/upload` | POST | Upload media |
| `/public/v1/media` | GET | List uploaded media (optional `?page=`, `?search=`) |
| `/public/v1/media/:id/status` | GET | Status of a media uploaded with `adjust` |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `IHATEPOSTING_API_KEY` | No* | - | Your iHatePosting API key |
| `IHATEPOSTING_API_URL` | No | `https://app.ihateposting.com/api` | Custom API endpoint |
| `IHATEPOSTING_AUTH_SERVER` | No | `https://app.ihateposting.com/api` | Custom auth server URL |

*Either OAuth2 (via `ihateposting-agent auth:login`) or `IHATEPOSTING_API_KEY` is required.

---

## Error Handling

The CLI provides clear error messages with exit codes:

- **Exit code 0**: Success
- **Exit code 1**: Error occurred

**Common errors:**

| Error | Solution |
|-------|----------|
| `Not authenticated` | Run `ihateposting-agent auth:login` or set `IHATEPOSTING_API_KEY` |
| `Integration not found` | Run `integrations:list` to get valid IDs |
| `startDate must be a valid ISO 8601 date string` | Use ISO 8601 format: `"2024-12-31T12:00:00Z"` |
| A setting is refused (for example `title must be longer than or equal to 1 characters`) | Check `integrations:settings` for required fields |
| `Tool not found` | Check available tools in `integrations:settings` output |
| `Upload failed` | Verify file exists and format is supported |
| `analytics:post` returns `{"missing": true}` | Run `posts:missing <id>` then `posts:connect <id> --release-id "<rid>"` |

---

## Development

### Project Structure

```
bin/
└── ihateposting-agent.mjs      # Entry point (a shebang line and one import)
src/
├── index.mjs             # CLI entry point with yargs
├── api.mjs               # IHatePostingAPI client class
├── config.mjs            # Configuration (OAuth2 + API key)
├── constants.mjs         # Names, addresses and variable names
└── commands/
    ├── auth.mjs          # OAuth2 authentication (login/logout/status)
    ├── posts.mjs         # Post management commands
    ├── integrations.mjs  # Integration commands
    ├── analytics.mjs     # Analytics commands
    └── upload.mjs        # Media upload and library commands
examples/                 # Example scripts and JSON files
package.json
README.md                 # This file
SKILL.md                  # AI agent reference
```

### Scripts

```bash
npm install        # Install the two dependencies (yargs and node-fetch)
npm test           # Run the tests (the planted-fault check takes about twenty minutes)
node bin/ihateposting-agent.mjs --help   # Run the CLI from a clone
```

### Building

The CLI has no build step: it is plain JavaScript (ES modules) that runs as it is written, so there is no `dist/` to produce.

---

## Quick Reference

```bash
# Authentication
ihateposting-agent auth:login                                              # OAuth2 device flow
ihateposting-agent auth:status                                             # Check auth
ihateposting-agent auth:logout                                             # Remove credentials
export IHATEPOSTING_API_KEY=your_key                                 # Or use API key

# Discovery
ihateposting-agent integrations:list                           # List integrations
ihateposting-agent integrations:list --group "<group-id>"      # List integrations in a group
ihateposting-agent integrations:groups                         # List groups (customers)
ihateposting-agent integrations:settings <id>                  # Get settings
ihateposting-agent integrations:trigger <id> <method> -d '{}'  # Fetch data

# Posting (date is required)
ihateposting-agent posts:create -c "text" -s "2024-12-31T12:00:00Z" -i "id"                    # Simple
ihateposting-agent posts:create -c "text" -s "2024-12-31T12:00:00Z" -t draft -i "id"          # Draft
ihateposting-agent posts:create -c "text" -m "img.jpg" -s "2024-12-31T12:00:00Z" -i "id"      # With media
ihateposting-agent posts:create -c "main" -c "comment" -s "2024-12-31T12:00:00Z" -i "id"      # With comment
ihateposting-agent posts:create -c "text" -s "2024-12-31T12:00:00Z" --settings '{}' -i "id"   # Platform-specific
ihateposting-agent posts:create --json file.json                                               # Complex

# Management
ihateposting-agent posts:list                                  # List posts
ihateposting-agent posts:delete <id>                          # Delete post
ihateposting-agent posts:status <id> --status draft           # Move to draft (stops workflow)
ihateposting-agent posts:status <id> --status schedule        # Queue draft for publishing
ihateposting-agent posts:settings <id> --settings '{}'        # Patch a post's settings (merged; DRAFT/QUEUE only)
ihateposting-agent upload <file>                              # Upload media
ihateposting-agent upload <file> --adjust                     # Accepted; no adjusting is done here
ihateposting-agent media:status <id>                          # Check an --adjust upload
ihateposting-agent media:list -s <name>                       # Find already uploaded media to reuse

# Analytics
ihateposting-agent analytics:platform <id>                    # Platform analytics (7 days)
ihateposting-agent analytics:platform <id> -d 30             # Platform analytics (30 days)
ihateposting-agent analytics:post <id>                        # Post analytics (7 days)
ihateposting-agent analytics:post <id> -d 30                 # Post analytics (30 days)
# If analytics:post returns {"missing": true}, resolve it:
ihateposting-agent posts:missing <id>                         # List provider content
ihateposting-agent posts:connect <id> --release-id "<rid>"    # Connect content to post

# Help
ihateposting-agent --help                                     # Show help
ihateposting-agent posts:create --help                        # Command help
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and the pull request checklist (version bump, changelog entry, docs and release steps).

---

## License

MIT

---

## Links

- **Website:** [ihateposting.com](https://ihateposting.com)
- **GitHub:** [iHatePostingOrg/iHatePosting-Agent](https://github.com/iHatePostingOrg/iHatePosting-Agent)
- **Issues:** [Report bugs](https://github.com/iHatePostingOrg/iHatePosting-Agent/issues)

---

## Supported Platforms

15 platforms including:

| Platform | Integration Tools | Settings |
|----------|------------------|----------|
| Twitter/X | - | who_can_reply_post, community, post_type, article keys, made_with_ai, paid_partnership |
| LinkedIn | mention | post_as_images_carousel, carousel_name |
| YouTube | - | title, type, tags, selfDeclaredMadeForKids, thumbnail |
| TikTok | - | content_posting_method, privacy_level, comment, brand toggles, duet/stitch/video_made_with_ai (video only), autoAddMusic (photo only) |
| Instagram | - | post_type (post/story), collaborators, graduation_strategy, is_trial_reel |
| Facebook | - | post_type, url, title, text_format_preset_id (all optional) |
| Pinterest | boards | board, title, link, dominant_color |
| Discord | channels | channel |
| Slack | channels | channel |
| And 6 more... | | |

**See [PROVIDER_SETTINGS.md](./PROVIDER_SETTINGS.md) for complete documentation.**
