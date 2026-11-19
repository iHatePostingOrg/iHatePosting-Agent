# Integration Settings Discovery

The CLI now has a powerful feature to discover what settings are available for each integration!

## New Command: `integrations:settings`

Get the settings schema, validation rules, and maximum character limits for any integration.

## Usage

```bash
ihateposting integrations:settings <integration-id>
```

## What It Returns

```json
{
  "output": {
    "rules": "...",
    "maxLength": 280,
    "settings": {
      "type": "object",
      "properties": {
        "who_can_reply_post": {
          "enum": ["everyone", "following", "mentionedUsers", "subscribers", "verified"]
        },
        "community": {
          "pattern": "^(https://x.com/i/communities/\\d+)?$"
        }
      }
    }
  }
}
```

(Abridged outline of an X channel's answer, not a recorded one: the real `rules`, `maxLength` and `description` texts are what your server returns. X has no required settings, so there is no `required` list. The program prints a header line, `⚙️  Settings for integration: <integration-id>`, before the JSON.)

## Workflow

### 1. List Your Integrations

```bash
ihateposting integrations:list
```

Output:
```json
[
  {
    "id": "pinterest-abc123",
    "name": "My Pinterest Account",
    "identifier": "pinterest",
    "disabled": false
  },
  {
    "id": "youtube-def456",
    "name": "My YouTube Channel",
    "identifier": "youtube",
    "disabled": false
  },
  {
    "id": "x-ghi789",
    "name": "@myhandle",
    "identifier": "x",
    "disabled": false
  }
]
```

(Placeholder values. The program prints a header line before the list, and each entry has more fields; these are the ones used here.)

### 2. Get Settings for Specific Integration

```bash
ihateposting integrations:settings pinterest-abc123
```

Output:
```json
{
  "output": {
    "rules": "...",
    "maxLength": 500,
    "settings": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "maxLength": 100
        },
        "link": {
          "type": "string",
          "format": "url"
        },
        "dominant_color": {
          "type": "string"
        },
        "board": {
          "type": "string",
          "not": { "type": "null" },
          "minLength": 1,
          "pattern": "^\\d+$",
          "description": "..."
        }
      },
      "required": ["board"]
    },
    "tools": [
      {
        "methodName": "boards",
        "description": "...",
        "dataSchema": []
      }
    ]
  }
}
```

(Abridged outline, not a recorded answer: the real `rules`, `maxLength` and `description` texts are what your server returns.)

### 3. Use the Settings in Your Post

Now you know what settings are available and required!

```bash
ihateposting posts:create \
  -c "My post content" \
  -m "image.jpg" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{
    "board": "1234567890",
    "title": "Check this out!"
  }' \
  -i "pinterest-abc123"
```

## Examples by Platform

The numbers below are the ones the app lists at the time of writing; the number your channel answers is the one that counts.

### Pinterest

```bash
ihateposting integrations:settings pinterest-abc123
```

Returns:
- Max length: 500 characters
- Required settings: board
- Optional: title, link, dominant_color

### YouTube

```bash
ihateposting integrations:settings youtube-def456
```

Returns:
- Max length: 5,000 characters (description)
- Required settings: title, type (public/private/unlisted)
- Optional: tags, thumbnail, selfDeclaredMadeForKids

### X (Twitter)

```bash
ihateposting integrations:settings x-ghi789
```

Returns:
- Max length: 280 characters (or 4,000 for verified)
- Required settings: none
- Optional: who_can_reply_post, community, post_type, article_title, article_status, article_cover, made_with_ai, paid_partnership

### LinkedIn

```bash
ihateposting integrations:settings linkedin-jkl012
```

Returns:
- Max length: 3,000 characters
- Optional settings: post_as_images_carousel, carousel_name

### TikTok

```bash
ihateposting integrations:settings tiktok-mno345
```

Returns:
- Max length: 2,000 characters
- Required settings: privacy_level, duet, stitch, comment, autoAddMusic, brand_content_toggle, brand_organic_toggle, content_posting_method
- Optional: title, video_made_with_ai
- Posting method: every setting except title requires `content_posting_method: "DIRECT_POST"` — with `"UPLOAD"` only the title/content is kept
- Media type: duet, stitch, video_made_with_ai are video-only; autoAddMusic is photo-only; see [PROVIDER_SETTINGS.md](./PROVIDER_SETTINGS.md)

### Instagram

```bash
ihateposting integrations:settings instagram-pqr678
```

Returns:
- Max length: 2,200 characters
- Required settings: post_type (post or story)
- Optional: is_trial_reel, graduation_strategy, collaborators

## No Additional Settings Required

Some platforms don't require specific settings:

```bash
ihateposting integrations:settings threads-stu901
```

Returns:
```json
{
  "output": {
    "maxLength": 500,
    "settings": "No additional settings required"
  }
}
```

Platforms with no additional settings:
- Threads
- Mastodon
- Bluesky
- Telegram

## Use Cases

### 1. Discovery

Find out what settings are available before posting:

```bash
# What settings does YouTube support?
ihateposting integrations:settings youtube-123

# What settings does Pinterest support?
ihateposting integrations:settings pinterest-456
```

### 2. Validation

Check maximum character limits:

```bash
ihateposting integrations:settings x-789 | tail -n +2 | jq '.output.maxLength'
# Output: 280 (4000 for a channel marked as verified)
```

### 3. AI Agent Integration

AI agents can call this endpoint to:
- Discover available settings dynamically
- Validate settings before posting
- Adapt to platform-specific requirements

```bash
# Get settings schema
INTEGRATION_ID="your-integration-id"
SETTINGS=$(ihateposting integrations:settings "$INTEGRATION_ID" | tail -n +2)

# Extract max length
MAX_LENGTH=$(echo "$SETTINGS" | jq '.output.maxLength')

# Check and truncate content if needed
CONTENT="Your post content"
if [ ${#CONTENT} -gt "$MAX_LENGTH" ]; then
  CONTENT="${CONTENT:0:$MAX_LENGTH}"
fi

# List required settings
echo "$SETTINGS" | jq '.output.settings.required // []'
```

### 4. Form Generation

Use the schema to generate UI forms:

```bash
# Inspect the settings schema for form generation
ihateposting integrations:settings pinterest-123 | tail -n +2 | jq '.output.settings'

# Extract specific field properties
ihateposting integrations:settings pinterest-123 | tail -n +2 \
  | jq '.output.settings.properties'
# → board (text, required, digits only)
# → title (text, up to 100 characters)
# → link (text, a web address)
# → dominant_color (text)
```

## Combined Workflow

Complete workflow for posting with correct settings:

```bash
#!/bin/bash
export IHATEPOSTING_API_KEY=your_key

# 1. List integrations
echo "📋 Available integrations:"
ihateposting integrations:list

# 2. Get settings for Pinterest
echo ""
echo "⚙️  Pinterest settings:"
SETTINGS=$(ihateposting integrations:settings pinterest-123 | tail -n +2)
echo "$SETTINGS" | jq '.output.maxLength'
echo "$SETTINGS" | jq '.output.settings'

# 3. Create post with correct settings
echo ""
echo "📝 Creating post..."
ihateposting posts:create \
  -c "My post content" \
  -m "image.jpg" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{
    "board": "1234567890",
    "title": "Interesting post"
  }' \
  -i "pinterest-123"
```

## API Endpoint

The command calls:
```
GET /public/v1/integration-settings/:id
```

Returns:
```text
{
  output: {
    rules?: string;
    maxLength: number;
    settings: <schema> | "No additional settings required" | {};
    tools?: [{ methodName: string; description: string; dataSchema: [{ key, type, description }] }];
  }
}
```

## Error Handling

### Integration Not Found

```bash
ihateposting integrations:settings invalid-id
# ❌ Failed to get integration settings: Request failed: API Error (<status>): <the server's words>
```

### API Key Not Set

```bash
ihateposting integrations:settings pinterest-123
# ❌ Error: No authentication found.
```

## Tips

1. **Always check settings first** before creating posts with custom settings
2. **Use the schema** to validate your settings object
3. **Check maxLength** to avoid exceeding character limits
4. **For AI agents**: Cache the settings to avoid repeated API calls
5. **Required fields** must be included in your settings object

## Comparison: Before vs After

### Before ❌

```bash
# Had to guess what settings are available
# Had to read documentation or source code
# Didn't know character limits
```

### After ✅

```bash
# Discover settings programmatically
ihateposting integrations:settings pinterest-123

# See exactly what's required and optional
# Know the exact character limits
# Get validation schemas
```

## Summary

✅ **Discover settings for any integration**
✅ **Get character limits**
✅ **See validation schemas**
✅ **Know required vs optional fields**
✅ **Perfect for AI agents**
✅ **No more guesswork!**

**Now you can discover what settings each platform supports!** 🎉

## Sections that were in this file before it followed the reference

### What the answer holds

The program prints a header line, `⚙️  Settings for integration: <channel-id>`, and then the server's JSON. Everything useful is under `output`:

```text
{
  "output": {
    "rules":     "<text>",            the platform's rules, in words (left out when the platform has none)
    "maxLength": <number>,            the longest text for this channel
    "settings":  { ...schema... },    the platform's own settings, as a schema (see below)
    "tools":     [ ...helpers... ]    what `integrations:trigger` can run for this channel (left out when none)
  }
}
```

| Key | What it is | What to do with it |
| --- | --- | --- |
| `output.rules` | Plain sentences about what the platform accepts: how many pictures, whether a video is needed, what a mode means. May be missing or empty. For some platforms it can carry an extra sentence that depends on how the server is configured. | Read it before you decide what to attach. Obey it. |
| `output.maxLength` | A number: the longest post text for this channel, as the server counts it. | Keep each part of your post at or under it. The platform may count characters differently from your editor (links, emoji), so leave some room. |
| `output.settings` | The platform's settings as a JSON-schema-like object, **or** a short sentence when the platform has no settings, **or** an empty object. | Build your `--settings` from it. See "Reading the schema". |
| `output.tools` | A list of helpers, each with a `methodName`, a `description` and a `dataSchema`. Absent when the platform has none. | Run them with `integrations:trigger` to find values the platform decides (boards, rooms, companies). |

#### The three shapes of `settings`

1. **A schema object**: the platform has settings. This is most platforms. It has `type: "object"` and a `properties` map.
2. **A sentence**: `"No additional settings required"`. The platform takes none; leave `--settings` out. Bluesky, Mastodon, Telegram and Threads answer this way.
3. **An empty object `{}`**: the channel belongs to a platform the server does not know (as the app documents it; unverified here). Everything else in that answer is empty too: no rules, a `maxLength` of `0`, no helpers. Treat that as "nothing is known", not as "anything goes".

A program that reads the answer should therefore check `typeof output.settings` before it looks for `properties`.

### Reading the schema

The schema describes one object, the settings you will pass. Its parts:

| Part | Meaning |
| --- | --- |
| `type` | `object`, `string`, `boolean`, `array`... The type of the value you send. |
| `properties` | The keys the object may have, each with its own schema. Send only these keys. |
| `required` | A list of key names that must be present. It appears only when something is required; its absence means every key is optional. |
| `enum` | The allowed values, exactly as written (case matters). |
| `minLength`, `maxLength` | Limits on the length of a string. |
| `pattern` | A regular expression the string must match (for example "digits only"). |
| `format` | `url` means a web address. |
| `not: { "type": "null" }` | The value may not be null: the key must be provided. It normally also appears in `required`. |
| `items` | For arrays: the schema of each element. |
| `description` | A sentence of explanation, on some keys. Read these: they often say when a key counts. |

A key can be nested (a media object has `id`, `path`, ...). Nested objects are written out in place, not referenced. A key listed with an empty schema (`{}`) has no stated type; read the rules text and treat it with care.

What the schema cannot say: conditions that depend on another key (for example "required when `post_type` is `article`") appear only in a `description` or in `output.rules`. A schema can look complete and still miss a rule, so read both.

### Pulling out the parts you need

The header line is not JSON, so drop it before you parse. With `jq`:

```bash
ihateposting integrations:settings "$CHANNEL_ID" | tail -n +2 | jq '.output.maxLength'
ihateposting integrations:settings "$CHANNEL_ID" | tail -n +2 | jq -r '.output.settings.required? // [] | .[]'
ihateposting integrations:settings "$CHANNEL_ID" | tail -n +2 | jq -r '.output.tools[]?.methodName'
```

Without `jq`, Node can do the same (Node is already installed if you can run the program):

```bash
ihateposting integrations:settings "$CHANNEL_ID" | tail -n +2 | node -e '
let s = "";
process.stdin.on("data", (d) => (s += d)).on("end", () => {
  const out = JSON.parse(s).output;
  console.log("maxLength:", out.maxLength);
  console.log("required:", (typeof out.settings === "object" && out.settings.required) || []);
  console.log("helpers:", (out.tools || []).map((t) => t.methodName));
});'
```

In PowerShell, skip the first line and join the rest before you parse it:

```powershell
$lines = ihateposting integrations:settings $env:CHANNEL_ID
$answer = ($lines | Select-Object -Skip 1) -join "`n" | ConvertFrom-Json
$answer.output.maxLength
$answer.output.settings.required
```

(`tail -n +2` and `sed 1d` both remove the first line. If the answer holds characters outside plain ASCII and PowerShell shows them garbled, set `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` first.)

#### Keeping an answer to compare later

```bash
ihateposting integrations:settings "$CHANNEL_ID" | tail -n +2 > "settings-$CHANNEL_ID.json"
```

Run the command again after the app has been updated and compare the two files with `diff`. A new key, a changed limit or a new rule shows up as a change in the file. The file holds only what the server answered, never your key.

### A second walk-through: a TikTok video

TikTok is the platform with the most required keys, so it shows why reading the schema first pays off.

```bash
ihateposting integrations:settings tiktok-123
```

The answer has this outline (abridged; the `rules`, `maxLength` and `description` texts are your server's):

```json
{
  "output": {
    "rules": "...",
    "maxLength": "<a number>",
    "settings": {
      "type": "object",
      "properties": {
        "title": { "type": "string", "maxLength": 90 },
        "privacy_level": { "type": "string", "enum": ["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "FOLLOWER_OF_CREATOR", "SELF_ONLY"] },
        "duet": { "type": "boolean" },
        "autoAddMusic": { "type": "string", "enum": ["yes", "no"] },
        "content_posting_method": { "type": "string", "enum": ["DIRECT_POST", "UPLOAD"], "description": "..." }
      },
      "required": ["privacy_level", "duet", "stitch", "comment", "autoAddMusic", "brand_content_toggle", "brand_organic_toggle", "content_posting_method"]
    }
  }
}
```

(Only some of the keys are shown. There is no `tools` entry: nothing needs to be looked up.)

What to take from it:

1. `required` has eight keys, so the settings object is never empty for TikTok.
2. `autoAddMusic` is a word (`"yes"` or `"no"`); `duet` is a boolean. The `type` of each key says which.
3. `title` has a limit of 90 characters.
4. The `description` of `content_posting_method` and the `rules` text explain the two modes. Read them before you choose, because `UPLOAD` hands the post to a person instead of publishing it.

Then make a draft, and move it forward only after somebody has looked at it:

```bash
ihateposting posts:create -i tiktok-123 -c "Thirty seconds on how we pack an order" \
  -m "<path of the uploaded video>" -s 2026-12-15T10:00:00Z -t draft \
  --settings '{"content_posting_method":"DIRECT_POST","privacy_level":"SELF_ONLY","duet":false,"stitch":false,"comment":true,"autoAddMusic":"no","brand_content_toggle":false,"brand_organic_toggle":false}'

ihateposting posts:status <post-id> --status schedule
```

### What you can do with the answer

Read the answer once per channel, not once per post: `required` says which keys you must send, `rules` says what to attach, and `maxLength` bounds the text.

#### Check the length

```bash
LIMIT=$(ihateposting integrations:settings "$CHANNEL_ID" | tail -n +2 | node -p 'JSON.parse(require("fs").readFileSync(0, "utf8")).output.maxLength')
echo "At most $LIMIT characters"
```

#### List the keys a channel takes

This prints every key of the settings schema, marks the required ones with `*`, and shows the allowed values or the type:

```bash
ihateposting integrations:settings "$CHANNEL_ID" | tail -n +2 | node -e '
let s = "";
process.stdin.on("data", (d) => (s += d)).on("end", () => {
  const schema = JSON.parse(s).output.settings;
  if (typeof schema !== "object" || !schema.properties) return console.log("No settings for this channel.");
  const required = new Set(schema.required || []);
  for (const [key, field] of Object.entries(schema.properties)) {
    const kind = field.enum ? field.enum.join(" | ") : field.type || "(no type given)";
    console.log(`${required.has(key) ? "*" : " "} ${key.padEnd(24)} ${kind}`);
  }
});'
```

The same schema is what a form builder or an agent needs to ask a person for the right values: one field per key, a drop-down when there is an `enum`, a check box for `boolean`, a required marker from `required`.

#### Build the post from the answer

A script that reads the answer, refuses a text that is too long, refuses to continue when required settings are missing, and then makes a draft (it never publishes):

```bash
#!/usr/bin/env bash
set -euo pipefail

CHANNEL_ID="${CHANNEL_ID:?Set CHANNEL_ID to a channel id from integrations:list}"
TEXT="${TEXT:-Ten quick tips for tidy shelves}"
POST_DATE="${POST_DATE:-2026-12-15T10:00:00Z}"

answer="$(ihateposting integrations:settings "$CHANNEL_ID" | tail -n +2)"
limit="$(printf '%s' "$answer" | node -p 'JSON.parse(require("fs").readFileSync(0, "utf8")).output.maxLength')"
required="$(printf '%s' "$answer" | node -p '(JSON.parse(require("fs").readFileSync(0, "utf8")).output.settings.required || []).join(" ")' 2>/dev/null || true)"

echo "Longest text: $limit"
echo "Required settings: ${required:-none}"

if [ "${#TEXT}" -gt "$limit" ]; then
  echo "The text has ${#TEXT} characters; this channel takes at most $limit." >&2
  exit 1
fi
if [ -n "$required" ] && [ -z "${SETTINGS_JSON:-}" ]; then
  echo "This channel requires: $required. Set SETTINGS_JSON first." >&2
  exit 1
fi

args=(-i "$CHANNEL_ID" -c "$TEXT" -s "$POST_DATE" -t draft)
if [ -n "${SETTINGS_JSON:-}" ]; then
  args+=(--settings "$SETTINGS_JSON")
fi
ihateposting posts:create "${args[@]}"
```

Run it as `CHANNEL_ID=<id> SETTINGS_JSON='{"board":"1234567890"}' bash build-draft.sh`. The shell counts characters its own way and the platform may count differently, so leave room under the limit. [examples/discover-and-draft.sh](examples/discover-and-draft.sh) is a longer script in the same spirit.

### When something goes wrong

| What you see | What to check |
| --- | --- |
| `❌ Failed to get integration settings: Request failed: API Error (404): ...` | The channel id is not one of your workspace's. In the app's own words the body says the integration was not found (unverified here). Copy the id from `integrations:list` again. |
| `... API Error (401): ...` | The key was refused. Check it with `ihateposting auth:status`. |
| `❌ Error: No authentication found.` | Nobody is signed in. Run `auth:login`, or export `IHATEPOSTING_API_KEY`. The request was not sent. |
| The usage text, then `Not enough non-option arguments: got 0, need at least 1` | You left out the channel id. |
| `❌ Failed to get integration settings: Request failed: request to <address> failed, reason: ...` | The address could not be reached. Check `IHATEPOSTING_API_URL` and your network. The program does not retry. |
| `❌ Failed to get integration settings: Request failed: Invalid URL` | `IHATEPOSTING_API_URL` is not a web address. |
| A JSON parse error that quotes the first characters of the header line | You gave the whole output, header line included, to a JSON parser. Remove the first line (`tail -n +2`). |
| `maxLength` is `0` and everything else is empty | The server does not know this channel's platform. Nothing is known about it; ask whoever runs the server. |
| The server refuses a post although the settings match the schema | The schema does not show conditions between keys. Read `output.rules` and the `description` of each key, then read the server's message after `API Error (<status>)`. |

### See also

- [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md) and [PROVIDER_SETTINGS_SUMMARY.md](PROVIDER_SETTINGS_SUMMARY.md): the keys and values of each platform.
- [INTEGRATION_TOOLS_WORKFLOW.md](INTEGRATION_TOOLS_WORKFLOW.md): running the helpers that `output.tools` lists.
- [SUPPORTED_FILE_TYPES.md](SUPPORTED_FILE_TYPES.md): getting pictures and videos into the media library.
- [QUICK_START.md](QUICK_START.md) and [FEATURES.md](FEATURES.md): the whole program in a page or two.
