# iHatePosting CLI - Command Line Guide

## New Syntax: Multiple `-c` and `-m` Flags

The CLI supports a much more intuitive syntax for creating posts with comments that have their own media.

## Basic Syntax

```bash
ihateposting-agent posts:create \
  -c "content" -m "media" \
  -c "content" -m "media" \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "integration-id"
```

`-c` and `-m` can be repeated multiple times. Each pair = one post/comment. The date (`-s`) is required unless the whole post comes from `--json`, and `-t draft` keeps the post without publishing it.

### How It Works

- **First `-c`**: Main post content
- **Subsequent `-c`**: Comments/replies
- **Each `-m`**: Media for the corresponding `-c`
- `-m` is optional (text-only posts/comments)
- Order matters: `-c` and `-m` are paired in order
- The file names in these examples (`photo1.jpg` and so on) stand for the `path` that `ihateposting-agent upload` printed: `-m` takes addresses of files that are already uploaded

## Examples

### 1. Simple Post

```bash
ihateposting-agent posts:create \
  -c "Hello World!" \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "x-123"
```

### 2. Post with Multiple Images

```bash
ihateposting-agent posts:create \
  -c "Check out these photos!" \
  -m "photo1.jpg,photo2.jpg,photo3.jpg" \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "x-123"
```

**Result:**
- Main post with 3 images

### 3. Post with Comments, Each Having Their Own Media

```bash
ihateposting-agent posts:create \
  -c "Main post 🚀" \
  -m "main-image1.jpg,main-image2.jpg" \
  -c "First comment 📸" \
  -m "comment1-image.jpg" \
  -c "Second comment 🎨" \
  -m "comment2-img1.jpg,comment2-img2.jpg" \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "x-123"
```

**Result:**
- Main post with 2 images
- First comment with 1 image
- Second comment with 2 images

### 4. Comments Can Contain Semicolons! 🎉

```bash
ihateposting-agent posts:create \
  -c "Main post" \
  -c "First comment; with a semicolon!" \
  -c "Second comment; with multiple; semicolons; works fine!" \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "x-123"
```

**No escaping needed!** Each `-c` is a separate argument, so special characters work perfectly.

### 5. X Thread

```bash
ihateposting-agent posts:create \
  -c "🧵 Thread about X (1/5)" \
  -m "thread1.jpg" \
  -c "Key point 1 (2/5)" \
  -m "thread2.jpg" \
  -c "Key point 2 (3/5)" \
  -m "thread3.jpg" \
  -c "Key point 3 (4/5)" \
  -m "thread4.jpg" \
  -c "Conclusion 🎉 (5/5)" \
  -m "thread5.jpg" \
  -d 2 \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "x-123"
```

**Result:** 5-part thread with 2-minute delays between tweets

### 6. Mix: Some with Media, Some Without

```bash
ihateposting-agent posts:create \
  -c "Amazing sunset! 🌅" \
  -m "sunset.jpg" \
  -c "Taken at 6:30 PM" \
  -c "Location: Santa Monica Beach" \
  -c "Camera: iPhone 15 Pro" \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "x-123"
```

**Result:**
- Main post with 1 image
- 3 text-only comments

### 7. Multi-Platform with Same Content

```bash
ihateposting-agent posts:create \
  -c "Big announcement! 🎉" \
  -m "announcement.jpg" \
  -c "More details coming soon..." \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "x-123,linkedin-456,facebook-789"
```

**Result:** Same post + comment posted to all 3 platforms

### 8. Scheduled Post with Follow-ups

```bash
ihateposting-agent posts:create \
  -c "Product launching today! 🚀" \
  -m "product-hero.jpg,product-features.jpg" \
  -c "Special launch offer: 50% off!" \
  -m "discount-banner.jpg" \
  -c "Limited to first 100 customers!" \
  -s "2026-12-25T09:00:00Z" \
  -i "x-123"
```

**Result:** Scheduled main post with 2 follow-up comments

This is the one example without `-t draft`: it is queued and published at its date, so use a date and a channel you mean.

### 9. Product Tutorial

```bash
ihateposting-agent posts:create \
  -c "Tutorial: How to Use Feature X 📖" \
  -m "tutorial-intro.jpg" \
  -c "Step 1: Open the settings menu" \
  -m "step1-screenshot.jpg" \
  -c "Step 2: Toggle the feature on" \
  -m "step2-screenshot.jpg" \
  -c "Step 3: Customize your preferences" \
  -m "step3-screenshot.jpg" \
  -c "That's it! You're all set 🎉" \
  -d 3 \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "x-123"
```

## Options Reference

| Flag | Alias | Description | Multiple? |
|------|-------|-------------|-----------|
| `--content` | `-c` | Post/comment content | ✅ Yes |
| `--media` | `-m` | Comma-separated media URLs | ✅ Yes |
| `--alt` | - | Comma-separated alt texts for the media of the corresponding `-m`, same order | ✅ Yes |
| `--integrations` | `-i` | Comma-separated integration IDs | ❌ No |
| `--date` | `-s` | ISO 8601 date (required unless you use `--json`) | ❌ No |
| `--type` | `-t` | `schedule` (the default) or `draft` | ❌ No |
| `--delay` | `-d` | Delay between comments (minutes) | ❌ No |
| `--shortLink` | - | Use URL shortener (on by default; `--no-shortLink` turns it off) | ❌ No |
| `--settings` | - | Platform-specific settings as a JSON string | ❌ No |
| `--json` | `-j` | Load from JSON file | ❌ No |

## How `-c` and `-m` Pair Together

```bash
ihateposting-agent posts:create \
  -c "First content"  -m "first-media.jpg" \
  -c "Second content" -m "second-media.jpg" \
  -c "Third content"  -m "third-media.jpg" \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "x-123"
```

Pair 1 → Main post, Pair 2 → Comment 1, Pair 3 → Comment 2.

**Pairing logic:**
- 1st `-c` pairs with 1st `-m` (if provided)
- 2nd `-c` pairs with 2nd `-m` (if provided)
- 3rd `-c` pairs with 3rd `-m` (if provided)
- If there is no `-m` left for a `-c` (or it is an empty `-m ""`), it's text-only

## Delay Between Comments

Use `-d` or `--delay` to set the delay (in minutes) between comments:

```bash
ihateposting-agent posts:create \
  -c "Main post" \
  -c "Comment 1" \
  -c "Comment 2" \
  -d 10 \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "x-123"
```

That is 10 minutes between each.

**Default:** 0 (no delay)

## Comparison: Old vs New Syntax

### ❌ Old Way (Limited)

`ihateposting-agent` has no `--comments` and no `--image` option. The program accepts an option it does not know and does nothing with it (no message), so this command makes a post with only the main text, without the comments and without the image:

```bash
# Could only do simple comments without custom media
ihateposting-agent posts:create \
  -c "Main post" \
  --comments "Comment 1;Comment 2;Comment 3" \
  --image "main-image.jpg" \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "x-123"
```

**Problems with that form:**
- Comments couldn't have their own media
- Semicolons in content would break it
- Less intuitive

### ✅ New Way (Flexible)

```bash
ihateposting-agent posts:create \
  -c "Main post" -m "main.jpg" \
  -c "Comment 1; with semicolon!" -m "comment1.jpg" \
  -c "Comment 2" -m "comment2.jpg" \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "x-123"
```

**Benefits:**
- ✅ Each comment can have its own media
- ✅ Semicolons work fine
- ✅ More readable
- ✅ More flexible

## When to Use JSON vs Command Line

### Use Command Line (`-c` and `-m`) When:
- ✅ Same content for all integrations
- ✅ Simple, straightforward posts
- ✅ Quick one-off posts
- ✅ Scripting with dynamic content

### Use JSON (`--json`) When:
- ✅ Different content per platform
- ✅ Complex settings or metadata
- ✅ Reusable post templates
- ✅ Very long or formatted content

## Tips for AI Agents

### Generate Commands Programmatically

```bash
# Generate a thread command with multiple tweets
ihateposting-agent posts:create \
  -c "Tweet 1/3" \
  -m "img1.jpg" \
  -c "Tweet 2/3" \
  -m "img2.jpg" \
  -c "Tweet 3/3" \
  -m "img3.jpg" \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "x-123"
```

### Escape Special Characters

In bash, you may need to escape some characters:

```bash
# Single quotes prevent interpolation
ihateposting-agent posts:create \
  -c 'Message with $variables and "quotes"' \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "x-123"

# Or use backslashes
ihateposting-agent posts:create \
  -c "Message with \$variables and \"quotes\"" \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "x-123"
```

## Error Handling

### Missing Integration

```bash
ihateposting-agent posts:create -c "Post" -m "img.jpg"
# --integrations is required when not using --json
```

The program prints the command's usage first, then the reason, and ends with exit code `1`.

**Fix:** Add `-i` flag

### No Content

```bash
ihateposting-agent posts:create -i "x-123"
# Either --content or --json is required
```

**Fix:** Add at least one `-c` flag

### Mismatched Count (OK!)

```bash
# This is fine! Fewer -m flags than -c flags is allowed
ihateposting-agent posts:create \
  -c "Post 1" -m "img1.jpg" \
  -c "Post 2" \
  -c "Post 3" -m "img3.jpg" \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "x-123"

# Result (each -m goes with the -c of the same count, not with the -c it stands next to):
# - Post 1 with img1.jpg
# - Post 2 with img3.jpg
# - Post 3 with no media
```

To give `img3.jpg` to Post 3 and nothing to Post 2, hold Post 2's place with an empty `-m ""`:

```bash
ihateposting-agent posts:create \
  -c "Post 1" -m "img1.jpg" \
  -c "Post 2" -m "" \
  -c "Post 3" -m "img3.jpg" \
  -s "2026-12-31T12:00:00Z" -t draft \
  -i "x-123"
```

## Full Example: Product Launch

```bash
#!/bin/bash

export IHATEPOSTING_API_KEY=your_key

ihateposting-agent posts:create \
  -c "🚀 Launching ProductX today!" \
  -m "https://media.example/uploads/hero.jpg,https://media.example/uploads/features.jpg" \
  -c $'🎯 Key Features:\n• AI-powered\n• Cloud-native\n• Open source' \
  -m "https://media.example/uploads/features-detail.jpg" \
  -c "💰 Special launch pricing: 50% off for early adopters!" \
  -m "https://media.example/uploads/pricing.jpg" \
  -c "🔗 Get started: https://example.com/productx" \
  -s "2026-12-25T09:00:00Z" \
  -d 60 \
  -i "x-123,linkedin-456,facebook-789"

echo "✅ Product launch scheduled!"
```

## See Also

- **EXAMPLES.md** - JSON file examples
- **SKILL.md** - AI agent patterns
- **README.md** - Full documentation
- **examples/*.json** - Template files

## Sections that were in this file before it followed the reference

### How to read this guide

A guide to `ihateposting-agent`, command by command, with examples you can type. It follows the order you will use the commands in: sign in, find a channel, read its rules, upload media, make a post, look after it, read its numbers.

How to read it:

- Every command is written `ihateposting-agent ...`. From a clone that is not linked, write `node bin/ihateposting-agent.mjs ...` instead (see [../HOW_TO_RUN.md](../HOW_TO_RUN.md)).
- Ids, dates and addresses are placeholders: `x-123` is a channel, `post-123` a post, `media-123` a file. Replace them with yours.
- The sample answers have made-up values. Their shape comes from the program's tests and the skill; the live server's exact fields were not checked while writing this guide, so trust your own answers over these.
- The examples make **drafts** or only read. A draft is kept but not published. The few that schedule a post, change one or delete one say so.

### 1. Sign in

#### With a code

```bash
ihateposting-agent auth:login
```

The program asks the sign-in server for a code, prints it in a box with a web address, and tries to open that address in your browser. You type the code (it may already be filled in), approve, and the terminal finishes with `✅ Successfully authenticated!`, the place the sign-in was saved (`~/.ihateposting/credentials.json`) and, when the server sent one, your organization's id. It asks every few seconds while it waits and gives up when the code expires. (The wording comes from the source; this command was not run for the guide, because it needs a real sign-in server.)

#### With a key

For a server, a CI job or any machine without a browser, use a workspace key from **Settings > Agents / Dev** in the app:

```bash
export IHATEPOSTING_API_KEY="<your key>"
```

#### Check it

```bash
ihateposting-agent auth:status
```

```text
🔑 Authentication method: API Key (environment variable)
🔑 Key: abcd1234...

🔄 Verifying credentials...
✅ Credentials are valid. 2 integration(s) connected.
```

With a saved sign-in the first lines read `🔐 Authentication method: OAuth2`, then the API address, the first eight characters of the token, the organization and the file. If nobody is signed in it says `❌ Not authenticated.` and shows the two ways. If the server refuses the credentials it says they are expired or invalid. In all three cases the exit code is `0`: `auth:status` reports, it does not fail.

A saved sign-in wins over the key. To use the key, run `ihateposting-agent auth:logout` first.

### 2. How answers look

Most commands print **one header line, then JSON**:

```text
🔌 Connected Integrations:
[
  { "id": "x-123", "name": "Example Studio", "identifier": "x", "disabled": false }
]
```

(The real output spreads the JSON over many lines, indented by two spaces. This guide squeezes it onto fewer lines wherever an answer is long.)

| Command | What it prints on success |
| --- | --- |
| `posts:delete` | Only its header line |
| `posts:missing`, `media:list`, `media:status` | Only JSON, no header line |
| every other command | A header line, then JSON |

Failures go to **standard error** as `❌ Failed to <what>: <why>`, and the program ends with **exit code `1`**. A check that fails before any request (a missing option, a wrong choice) prints the command's usage followed by the reason, also with `1`. Exit code `0` means the command ran to its end (`auth:status`, above, and a command or option name the program does not know, also end with it). There is no other code.

Nothing is waited out or tried again. A rate limit (`429`) or a server error is shown once, with the server's own words.

#### Taking the header off

Scripts that read the JSON have to skip the header line first:

```bash
ihateposting-agent integrations:list | tail -n +2
ihateposting-agent integrations:list | sed 1d          # the same
```

#### The same letter, different options

Short names are reused, so read the command's own `--help`:

| Short | `posts:create` | `posts:status` | `integrations:trigger` | `analytics:*` | `media:list` |
| --- | --- | --- | --- | --- | --- |
| `-c` | `--content` | | | | |
| `-m` | `--media` | | | | |
| `-i` | `--integrations` | | | | |
| `-s` | `--date` (when to post) | `--status` | | | `--search` |
| `-d` | `--delay` (minutes) | | `--data` (JSON) | `--date` (days back) | |
| `-t` | `--type` | | | | |
| `-j` | `--json` | | | | |
| `-p` | | | | | `--page` |

### 3. Channels

A **channel** (the program's help says "integration") is one connected account on one platform. Every command about it takes its **id**.

#### List them

```bash
ihateposting-agent integrations:list
ihateposting-agent integrations:list --group "group-1"      # only one customer's channels
ihateposting-agent integrations:groups                       # the groups (customers) and their ids
```

Each channel has an `id`, a `name`, an `identifier` (its platform: `x`, `bluesky`, `pinterest`, ...) and `disabled`. The platforms are bluesky, mastodon, slack, facebook, telegram, x, linkedin, linkedin-page, tumblr, discord, pinterest, tiktok, youtube, gmb, instagram and threads, as far as your workspace has them connected.

#### Read a channel's rules

```bash
ihateposting-agent integrations:settings pinterest-123
```

```text
⚙️  Settings for integration: pinterest-123
{
  "output": {
    "rules": "A pin needs one picture and a board.",
    "maxLength": 500,
    "settings": { "type": "object", "properties": { "board": { "type": "string" } }, "required": ["board"] },
    "tools": [ { "methodName": "boards", "description": "Get the boards", "dataSchema": [] } ]
  }
}
```

Read `output.rules` and `output.maxLength` before you write, and send only the settings its schema lists. `output.tools` names the helpers of this channel.

#### Run a helper

Some settings need a value only the platform knows. A helper fetches it:

```bash
ihateposting-agent integrations:trigger pinterest-123 boards
ihateposting-agent integrations:trigger slack-123 channels
ihateposting-agent integrations:trigger linkedin-123 mention -d '{"query":"examplecompany"}'
```

```text
🔧 Tool result for boards:
{ "output": [ { "value": "1234567890", "label": "Tidy shelves" } ] }
```

`-d` is the helper's input as a JSON text; leave it out when the helper takes none. Only the helpers listed in the channel's `output.tools` exist for it.

### 4. Media

```bash
ihateposting-agent upload ./photo.png
```

```text
✅ File uploaded successfully!
{
  "id": "media-123",
  "path": "https://media.example/uploads/photo.png",
  "name": "photo.png"
}
```

Use the `path` in posts: **`posts:create` never uploads for you**, so `-m` takes addresses of files that are already in the library. Two more things:

```bash
ihateposting-agent upload ./clip.mp4 --adjust        # ask the server to fit the file to the platforms' limits
ihateposting-agent media:status media-123            # {"status": "ready"} when the adjusting is done
```

After `--adjust`, wait until `media:status` says `ready` before you use the path; until then a post would use the original file. Look through what is already uploaded rather than uploading twice:

```bash
ihateposting-agent media:list                        # newest first, 18 to a page
ihateposting-agent media:list -s banner              # names containing "banner"
ihateposting-agent media:list -s banner -p 2         # the second page
```

The file's name is whatever follows the last `/` in the path you typed. On Windows write `C:/pictures/photo.png`, not backslashes. What file types the server accepts is the server's decision: see [../SUPPORTED_FILE_TYPES.md](../SUPPORTED_FILE_TYPES.md).

### What the program sends

A post with one picture, a comment and a setting is turned into this body (the ids of the media entries are random short strings made by the program):

```json
{
  "type": "draft",
  "creationMethod": "CLI",
  "date": "2030-01-01T09:00:00Z",
  "shortLink": true,
  "tags": [],
  "posts": [
    {
      "integration": { "id": "x-123" },
      "value": [
        { "content": "Main post", "image": [{ "id": "k3j9d2", "path": "https://media.example/uploads/a.png" }], "delay": 0 },
        { "content": "First comment", "image": [], "delay": 0 }
      ],
      "settings": { "who_can_reply_post": "everyone" }
    }
  ]
}
```

`posts` has one entry per channel in `-i`; `settings` is left out when you pass no `--settings`.

### 6. Looking after posts

```bash
ihateposting-agent posts:list                                   # 30 days back to 30 days ahead
ihateposting-agent posts:list --startDate "2030-01-01T00:00:00Z" --endDate "2030-01-31T23:59:59Z"
ihateposting-agent posts:list --customer "group-1"
```

The answer is the server's list of posts in that window; each has an id. Then:

```bash
ihateposting-agent posts:status post-123 --status schedule      # queue a draft
ihateposting-agent posts:status post-123 --status draft         # take a queued post back
ihateposting-agent posts:settings post-123 --settings '{"content_posting_method":"DIRECT_POST"}'
ihateposting-agent posts:delete post-123
```

The first three print a header line such as `✅ Post post-123 status changed to schedule` and then the server's answer. `posts:settings` merges: only the keys you pass change, and it works only on a post that has not been published. `posts:delete` prints only `✅ Post post-123 deleted successfully!` and cannot be undone from here. There is no command that changes a post's text or date.

#### A post with no platform id yet

If analytics for a post answer `{"missing": true}`, iHatePosting never learned which of the platform's own posts it is. Fix it in two steps:

```bash
ihateposting-agent posts:missing post-123                                  # the platform's recent content, with ids
ihateposting-agent posts:connect post-123 --release-id "7321456789012345678"
```

### 7. Analytics

```bash
ihateposting-agent analytics:platform x-123            # last 7 days
ihateposting-agent analytics:platform x-123 -d 30      # last 30 days
ihateposting-agent analytics:post post-123 -d 7
```

```text
📊 Analytics for integration: x-123
[ { "label": "Followers", "data": [ { "total": "10", "date": "2030-01-01" } ] } ]
```

`-d` here is a number of days back, not a delay.

### 8. Scripting with jq

(`jq` was not installed where this guide was written, so the filters below were checked by reading them against the sample answers above, not by running them.)

Skip the header, then ask `jq`:

```bash
# the id of the first Bluesky channel
BLUESKY_ID=$(ihateposting-agent integrations:list | tail -n +2 | jq -r 'first(.[] | select(.identifier=="bluesky") | .id)')

# the boards of a Pinterest channel
ihateposting-agent integrations:trigger pinterest-123 boards | tail -n +2 | jq -r '.output[] | "\(.value)\t\(.label)"'

# upload a picture and keep its address
PICTURE=$(ihateposting-agent upload ./photo.png | tail -n +2 | jq -r '.path')
ihateposting-agent posts:create -c "Look" -m "$PICTURE" -s "2030-01-01T09:00:00Z" -t draft -i "$BLUESKY_ID"

# is the text short enough for the channel?
MAX=$(ihateposting-agent integrations:settings x-123 | tail -n +2 | jq -r '.output.maxLength')
```

Check the exit code, not the text, to know whether a command worked:

```bash
if ! OUT=$(ihateposting-agent posts:create -c "Hello" -s "2030-01-01T09:00:00Z" -t draft -i "x-123" 2>&1); then
  echo "Failed: $OUT" >&2
  exit 1
fi
```

For a script that must stop at the first failure, `set -euo pipefail` at the top is enough. Without `jq`, Node reads JSON just as well:

```bash
ihateposting-agent upload ./photo.png | tail -n +2 | node -e 'let t="";process.stdin.on("data",d=>t+=d).on("end",()=>console.log(JSON.parse(t).path))'
```

#### Quoting JSON on the command line

`--settings` and `-d` take JSON text, and its double quotes must reach the program. In bash and zsh, wrap the whole text in single quotes. In PowerShell 7, single quotes also worked when the text was passed to `node` (tested); other PowerShell versions and the Windows command prompt were not tested for the program. When in doubt, put the settings inside a body file and use `--json`.
