# iHatePosting CLI - Advanced Examples

This directory contains examples demonstrating the full capabilities of the iHatePosting CLI, including posts with comments and multiple media.

## Understanding the Post Structure

The iHatePosting API supports a rich post structure:

```typescript
{
  type: 'schedule' | 'draft',
  date: string,              // ISO 8601 date
  shortLink: boolean,        // Use URL shortener
  tags: Tag[],              // Post tags (the samples leave it empty)
  posts: [                  // Can post to multiple platforms at once
    {
      integration: { id: string },    // Platform integration ID
      value: [                        // Main post + comments/thread
        {
          content: string,            // Post/comment text
          image: { id: string, path: string, alt?: string }[],   // Multiple media attachments
          delay?: number              // Delay in minutes before posting (for comments)
        },
        // ... more comments
      ],
      settings: {}                    // Platform-specific settings (never add __type: the server adds it)
    }
  ]
}
```

## Simple Usage Examples

### Basic Post

```bash
ihateposting-agent posts:create \
  -c "Hello World!" \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "x-123"
```

### Post with Multiple Images

```bash
ihateposting-agent posts:create \
  -c "Check out these images!" \
  -m "https://media.example/uploads/img1.jpg,https://media.example/uploads/img2.jpg,https://media.example/uploads/img3.jpg" \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "x-123"
```

### Post with Comments (Simple)

```bash
ihateposting-agent posts:create \
  -c "Main post content" \
  -c "First comment" \
  -c "Second comment" \
  -c "Third comment" \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "x-123"
```

### Scheduled Post

```bash
ihateposting-agent posts:create \
  -c "Future post" \
  -s "2026-12-31T12:00:00Z" \
  -i "x-123,linkedin-456"
```

This one has no `-t draft`, so it is queued and published at its date: use a date and channels you mean.

## Advanced JSON Examples

For complex posts with comments that have their own media, use JSON files:

### 1. Post with Comments and Media

**File:** `post-with-comments.json`

```bash
ihateposting-agent posts:create --json examples/post-with-comments.json
```

This creates:
- Main post with 2 images
- First comment with 1 image (delay: 5 minutes)
- Second comment with 2 images (delay: 10 minutes)

### 2. Multi-Platform Campaign

**File:** `multi-platform-post.json`

```bash
ihateposting-agent posts:create --json examples/multi-platform-post.json
```

This creates:
- X post with main + comment
- LinkedIn post with single content
- Facebook post with main + comment
All dated for the same time (as drafts) with platform-specific content and media!

### 3. X Thread

**File:** `thread-post.json`

```bash
ihateposting-agent posts:create --json examples/thread-post.json
```

This creates a 5-part X thread, with each tweet having its own image and a 2-minute delay between tweets.

## JSON File Structure Explained

### Basic Structure

```json
{
  "type": "draft",                  // "draft" or "schedule"
  "date": "2026-12-15T10:00:00Z",  // When to post (ISO 8601)
  "shortLink": true,                // Enable URL shortening
  "tags": [],                       // Array of tags
  "posts": [...]                    // Array of posts
}
```

### Post Structure

```json
{
  "integration": {
    "id": "x-123"                    // Get this from integrations:list
  },
  "value": [                         // Array of content (main + comments)
    {
      "content": "Post text",        // The actual content
      "image": [                     // Array of media
        {
          "id": "media-123",         // Unique identifier
          "path": "https://media.example/uploads/photo.png"   // URL of the uploaded file
        }
      ],
      "delay": 5                     // Optional delay in minutes
    }
  ],
  "settings": {}                     // Platform-specific settings (never add "__type": the server adds it)
}
```

## Use Cases

### 1. Product Launch Campaign

Create a coordinated multi-platform launch:

```json
{
  "type": "draft",
  "date": "2026-12-15T09:00:00Z",
  "posts": [
    {
      "integration": { "id": "x-123" },
      "value": [
        { "content": "🚀 Launching today!", "image": [...] },
        { "content": "Special features:", "image": [...], "delay": 60 },
        { "content": "Get it now:", "image": [...], "delay": 120 }
      ]
    },
    {
      "integration": { "id": "linkedin-456" },
      "value": [
        { "content": "Professional announcement...", "image": [...] }
      ]
    }
  ]
}
```

### 2. Tutorial Series

Create an educational thread:

```json
{
  "type": "draft",
  "posts": [
    {
      "integration": { "id": "x-123" },
      "value": [
        { "content": "🧵 How to X (1/5)", "image": [...] },
        { "content": "Step 1: ... (2/5)", "image": [...], "delay": 2 },
        { "content": "Step 2: ... (3/5)", "image": [...], "delay": 2 },
        { "content": "Step 3: ... (4/5)", "image": [...], "delay": 2 },
        { "content": "Conclusion (5/5)", "image": [...], "delay": 2 }
      ]
    }
  ]
}
```

### 3. Event Coverage

Live event updates with media:

```json
{
  "type": "draft",
  "posts": [
    {
      "integration": { "id": "x-123" },
      "value": [
        {
          "content": "📍 Event starting now!",
          "image": [
            { "id": "media-123", "path": "https://media.example/uploads/venue-photo.jpg" }
          ]
        },
        {
          "content": "First speaker taking stage",
          "image": [
            { "id": "media-124", "path": "https://media.example/uploads/speaker-photo.jpg" }
          ],
          "delay": 30
        }
      ]
    }
  ]
}
```

## Getting Integration IDs

Before creating posts, get your integration IDs:

```bash
ihateposting-agent integrations:list
```

Output (after one header line; abridged, with placeholder values):
```json
[
  { "id": "x-123", "name": "Example Studio", "identifier": "x", "disabled": false },
  { "id": "linkedin-456", "name": "Example Company", "identifier": "linkedin", "disabled": false }
]
```

Use these IDs in your `integration.id` fields.

## Tips for AI Agents

1. **Use JSON for complex posts** - If you need different content or settings for each platform, or a different delay for each comment, use JSON files
2. **Delays matter** - Use appropriate delays between comments (the delay is in minutes)
3. **Image IDs** - Generate unique IDs for each image (can use UUIDs or random strings)
4. **Validate before sending** - Check that all integration IDs exist
5. **Test with "draft" type** - Use `"type": "draft"` to create without posting

## Automation Scripts

### Batch Create from Directory

```bash
#!/bin/bash
# Create posts from all JSON files in a directory

for file in posts/*.json; do
  echo "Creating post from $file..."
  ihateposting-agent posts:create --json "$file"
  sleep 2
done
```

### Generate JSON Programmatically

```bash
# Generate a thread JSON file
cat > thread.json << 'EOF'
{
  "type": "draft",
  "date": "2026-12-31T12:00:00Z",
  "shortLink": true,
  "tags": [],
  "posts": [{
    "integration": { "id": "x-123" },
    "value": [
      { "content": "Tweet 1", "image": [] },
      { "content": "Tweet 2", "image": [], "delay": 2 },
      { "content": "Tweet 3", "image": [], "delay": 2 }
    ],
    "settings": {}
  }]
}
EOF

# Post using the JSON file
ihateposting-agent posts:create --json thread.json
```

## Error Handling

Common errors and solutions:

1. **Invalid integration ID** - Run `integrations:list` to get valid IDs
2. **Invalid image path** - Ensure images were uploaded to iHatePosting first (`ihateposting-agent upload`) and use the `path` it printed
3. **Missing required fields** - Check that `type`, `date`, `shortLink`, `tags`, and `posts` are all present
4. **Invalid date format** - Use ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`

## Further Reading

- See `SKILL.md` for AI agent patterns
- See `README.md` for installation and setup
- See `QUICK_START.md` for basic usage

## Sections that were in this file before it followed the reference

### Three rules that hold for everything here

- **Placeholders.** `x-123`, `media-123` and `https://media.example/...` are not real. Replace every one before you send a file.
- **Drafts.** Every sample has `"type": "draft"`, and every script sends drafts. A draft is kept but not published.
- **Nothing signs in for you.** Sign in first (`ihateposting-agent auth:login`) or export `IHATEPOSTING_API_KEY` in your own shell, and check with `ihateposting-agent auth:status`. From a clone that is not linked, write `node bin/ihateposting-agent.mjs` where the examples say `ihateposting-agent`.

### Before you send a sample

1. Replace the channel ids with ids from `ihateposting-agent integrations:list`.
2. Upload the pictures and videos (`ihateposting-agent upload ./photo.png`) and put what comes back in `id` and `path`. `posts:create` uploads nothing.
3. Read the channel's rules (`integrations:settings <id>`) and keep the text under its `maxLength`.
4. Change `date` to a time you mean.
5. Fill in what the platform needs: a Pinterest board, a TikTok privacy level, a YouTube title.

### The sample bodies

#### post-with-comments-and-media.json: pictures in a post and in a comment

[post-with-comments-and-media.json](post-with-comments-and-media.json) is a post with two pictures that have alt texts, a first comment with one picture, and a second comment with none.

Replace the three `path` addresses with what `upload` printed for your pictures. Alt texts are optional; leave `alt` out for a picture that needs none. This is the sample to copy when an alt text contains a comma, because `--alt` on the command line splits at commas and a file does not.

```bash
ihateposting-agent posts:create --json post-with-comments-and-media.json
```

#### multi-platform-with-settings.json: one announcement, four channels

[multi-platform-with-settings.json](multi-platform-with-settings.json) sends one announcement to Pinterest, X, LinkedIn and Instagram in a single request. Each channel gets its own entry in `posts`, so each has its own text, pictures and settings:

| Channel | What differs |
| --- | --- |
| Pinterest (`pinterest-123`) | A pin with its `board`, a `title` and a `link` |
| X (`x-123`) | A thread of four parts, three minutes apart, `who_can_reply_post: "everyone"` |
| LinkedIn (`linkedin-123`) | Three pictures posted as a carousel (`post_as_images_carousel`, `carousel_name`) |
| Instagram (`instagram-123`) | One picture, `post_type: "post"` |

Flags cannot do this in one call, because `--settings` is one object for every channel in the call. To use the file you need all four channels connected, or you delete the entries you have no channel for.

#### tiktok-video.json: a TikTok video

[tiktok-video.json](tiktok-video.json) carries the complete set of settings TikTok asks for: a title, the posting method, the privacy level, the duet, stitch and comment switches, music, brand toggles and the AI disclosure. Upload the video first and put its `id` and `path` in `image` (videos go in the same list).

Two settings deserve a look before you send it:

- `privacy_level` is `SELF_ONLY`, which by its name is the most private of TikTok's levels, so a copy of the sample does not show a post to everyone.
- `content_posting_method` is `DIRECT_POST`, which publishes the video itself once the post is scheduled. The other method, `UPLOAD`, only hands the video to the account's inbox in the TikTok app for a person to finish. Change a waiting post's method without editing the file:

```bash
ihateposting-agent posts:settings post-123 --settings '{"content_posting_method":"UPLOAD"}'
```

#### youtube-video.json: a YouTube video

[youtube-video.json](youtube-video.json) has a title, a visibility (`type`: `private` here), the made-for-kids answer, a thumbnail picture and five tags written as `{ "value": ..., "label": ... }`. The post text goes with the video; `\n\n` in the JSON is a blank line. Upload the video and the thumbnail first. Use `private` until you have looked at the result.

#### pinterest-pin.json: a pin

[pinterest-pin.json](pinterest-pin.json) is a pin with a picture, a description, a title and a link. Pinterest needs a **board**, and it is the numeric id, not the board's name. Ask the channel for its boards:

```bash
ihateposting-agent integrations:trigger pinterest-123 boards
```

Copy the `value` of the board you want into `settings.board`.

### The scripts

These are Bash scripts (on Windows, Git Bash or WSL). They are not marked executable in git, so start them with `bash`. Every one explains itself in comments, holds no key, deletes nothing and makes drafts only. `basic-usage.sh` and `command-line-examples.sh` are the plain ones: they call `ihateposting-agent` as it is written and read only `IHATEPOSTING_API_KEY`. The three others start with `set -euo pipefail` and read ids from environment variables. `AGENT` says how to start the program; it defaults to `ihateposting-agent`. From a clone:

```bash
cd examples
AGENT="node ../bin/ihateposting-agent.mjs" X_CHANNEL_ID=x-123 bash draft-from-flags.sh
```

The program's path in `AGENT` must not contain spaces, because the scripts split it into words.

#### basic-usage.sh: a first tour

[basic-usage.sh](basic-usage.sh) checks that `IHATEPOSTING_API_KEY` is set, lists the channels, makes one draft dated an hour ahead and lists the posts. Replace `x-123` in it with the id of one of your channels (step 1 prints them) before you run it. It calls `ihateposting-agent` as it is written, so from a clone link the program first (`npm link`) or edit the command.

```bash
bash basic-usage.sh
```

You see three numbered steps, each with the command's own output under it:

```text
📋 Step 1: Listing connected integrations...
📝 Step 2: Creating a test post...
📋 Step 3: Listing recent posts...
```

Without the variable it stops at once with a message naming it.

#### draft-from-flags.sh: drafts made with flags

[draft-from-flags.sh](draft-from-flags.sh) runs one block of examples for each group of variables you set: a thread and a post with a comment (X), pictures with alt text (X plus `MEDIA_URL_1` and `MEDIA_URL_2`), a pin (Pinterest with its board) and a video (YouTube with `VIDEO_URL`).

```bash
X_CHANNEL_ID=x-123 bash draft-from-flags.sh
X_CHANNEL_ID=x-123 MEDIA_URL_1=https://media.example/uploads/a.png MEDIA_URL_2=https://media.example/uploads/b.png bash draft-from-flags.sh
```

With only `X_CHANNEL_ID` it makes the thread and the replies-setting draft. With nothing set it makes no draft, says which variables it wants, and ends with exit code `1`.

#### discover-and-draft.sh: look first, then write

[discover-and-draft.sh](discover-and-draft.sh) reads a channel's settings and prints a summary (the length limit, the settings it takes and requires, the helpers), optionally runs one helper, and optionally makes a draft.

```bash
CHANNEL_ID=pinterest-123 HELPER=boards bash discover-and-draft.sh
CHANNEL_ID=x-123 DRAFT_TEXT="Ten tips" SETTINGS_JSON='{"who_can_reply_post":"everyone"}' bash discover-and-draft.sh
```

A summary looks like this (made-up channel):

```text
== 1. What does channel pinterest-123 need? ==
Longest text for this channel: 500
Rules: A pin needs one picture and a board.
Settings it takes: board, title, link
Settings it requires: board
Helper: boards (no input)
```

#### post-from-body-file.sh: send a body file with guard rails

[post-from-body-file.sh](post-from-body-file.sh) sends a body file after three checks: the file exists and is valid JSON; it no longer holds sample placeholder ids such as `x-123`; and, if its type is `schedule`, you set `CONFIRM_SCHEDULE=yes`.

```bash
bash post-from-body-file.sh my-post.json
CONFIRM_SCHEDULE=yes bash post-from-body-file.sh my-scheduled-post.json
```

Run on an untouched sample it refuses, which is the point:

```text
thread-post.json still holds placeholder ids such as x-123 or media-123.
```

It exits with `1` for a missing file, a file that is not JSON, placeholders and an unconfirmed `schedule`.

### More scenarios

#### A week of drafts from a list

```bash
CHANNEL="x-123"
i=0
while IFS= read -r line; do
  i=$((i + 1))
  ihateposting-agent posts:create -c "$line" -s "2030-01-0${i}T09:00:00Z" -t draft -i "$CHANNEL"
done <<'LIST'
Monday: a tip about tidy shelves
Tuesday: a customer story
Wednesday: behind the scenes
LIST
```

Each line becomes one draft at 09:00 UTC on its own day (the loop is good for up to nine days; the date format needs a leading zero). To publish them, change each draft's status after you have read it.

#### Different words for different channels

When the text should differ per channel, generate a body file rather than make several calls. This Node script writes one (it uses nothing but Node, which you already have):

```bash
X_ID=x-123 BSKY_ID=bluesky-123 node -e '
const body = {
  type: "draft",
  date: "2030-01-01T09:00:00Z",
  shortLink: true,
  tags: [],
  posts: [
    { integration: { id: process.env.X_ID }, value: [{ content: "Short and punchy for X.", image: [], delay: 0 }], settings: {} },
    { integration: { id: process.env.BSKY_ID }, value: [{ content: "A little longer for Bluesky, with room to explain.", image: [], delay: 0 }], settings: {} },
  ],
};
require("node:fs").writeFileSync("announcement.json", JSON.stringify(body, null, 2));
'
ihateposting-agent posts:create --json announcement.json
```

#### Checking a body file before you send it

```bash
node -e 'const b = JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8")); console.log(b.type, b.date, b.posts.length + " channel(s)")' thread-post.json
```

For the sample this prints `draft 2026-12-15T10:00:00Z 1 channel(s)`. A file that is not valid JSON makes Node stop with a message that names the position.

#### Upload a video and wait until it is ready

```bash
ihateposting-agent upload ./clip.mp4 --adjust
```

Copy the `id` it printed, then ask until the server says the adjusting is done, giving up after about five minutes:

```bash
ID="media-123"
for attempt in $(seq 1 30); do
  if ihateposting-agent media:status "$ID" | grep -q '"ready"'; then
    echo "ready"
    break
  fi
  echo "not ready yet (attempt $attempt)"
  sleep 10
done
```

Then use the `path` that `upload` printed in your post. (The status words `processing` and `ready` come from the program's help; what a real server answers while it works was not checked.)

#### Pick a board, then pin

```bash
ihateposting-agent integrations:trigger pinterest-123 boards
ihateposting-agent posts:create -c "Ten tips for tidy shelves" -m "https://media.example/uploads/shelves.png" \
  --settings '{"board":"1234567890","title":"Tidy shelves"}' -s "2030-01-01T09:00:00Z" -t draft -i "pinterest-123"
```

Slack and Discord work the same way with `integrations:trigger <id> channels`: the helper lists the rooms, and the channel's settings schema (`integrations:settings`) says which setting takes the id of the one you choose.

#### Review the drafts and schedule one

```bash
ihateposting-agent posts:list
ihateposting-agent posts:status post-123 --status schedule
```

`posts:list` shows the window from 30 days ago to 30 days ahead; widen it with `--startDate` and `--endDate` for drafts dated further out. There is no command that edits a post's text or date. To change those, check the id twice, run `ihateposting-agent posts:delete post-123` (it cannot be undone from here) and make the post again. To stop a queued post without losing it, use `posts:status post-123 --status draft` instead.

#### A weekly snapshot of analytics

```bash
for ID in x-123 bluesky-123 pinterest-123; do
  ihateposting-agent analytics:platform "$ID" -d 7 | tail -n +2 > "analytics-$ID.json"
done
```

`tail -n +2` drops the header line so each file holds clean JSON.

#### A post whose analytics are "missing"

```bash
ihateposting-agent analytics:post post-123            # {"missing": true}
ihateposting-agent posts:missing post-123             # the platform's recent content
ihateposting-agent posts:connect post-123 --release-id "7321456789012345678"
ihateposting-agent analytics:post post-123            # now it has numbers
```
