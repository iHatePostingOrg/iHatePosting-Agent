# Discovering a channel's settings

Every platform has its own rules: how long a post may be, whether it needs a picture, which options it takes. You (or an agent) should not have to guess them. `integrations:settings` asks the server what applies to one channel and prints it. Run it before you write a post for a channel you have not posted to in this way before.

```bash
ihateposting-agent integrations:settings <channel-id>
```

This page explains the command, how to read what it prints, and how to turn the answer into a correct post. For the keys of each platform see [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md); for the helpers named in the answer see [INTEGRATION_TOOLS_WORKFLOW.md](INTEGRATION_TOOLS_WORKFLOW.md).

## The command

| Part | Meaning |
| --- | --- |
| `<channel-id>` | The `id` of an entry of `ihateposting-agent integrations:list`. The program's help calls a channel an "integration". |

There are no options besides `--help`. The program makes one request, `GET /public/v1/integration-settings/<channel-id>`, prints a header line and the server's JSON, and ends with exit code `0`. On any failure it prints `❌ Failed to get integration settings: <why>` on standard error and ends with `1`.

A channel id that is not in your workspace is refused by the server, and the program shows the refusal after `❌ Failed to get integration settings: Request failed: API Error (<status>): ...`.

## What the answer holds

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

### The three shapes of `settings`

1. **A schema object**: the platform has settings. This is most platforms. It has `type: "object"` and a `properties` map.
2. **A sentence**: `"No additional settings required"`. The platform takes none; leave `--settings` out. Bluesky, Mastodon, Telegram and Threads answer this way.
3. **An empty object `{}`**: the channel belongs to a platform the server does not know (as the app documents it; unverified here). Everything else in that answer is empty too: no rules, a `maxLength` of `0`, no helpers. Treat that as "nothing is known", not as "anything goes".

A program that reads the answer should therefore check `typeof output.settings` before it looks for `properties`.

## Reading the schema

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

## Pulling out the parts you need

The header line is not JSON, so drop it before you parse. With `jq`:

```bash
ihateposting-agent integrations:settings "$CHANNEL_ID" | tail -n +2 | jq '.output.maxLength'
ihateposting-agent integrations:settings "$CHANNEL_ID" | tail -n +2 | jq -r '.output.settings.required? // [] | .[]'
ihateposting-agent integrations:settings "$CHANNEL_ID" | tail -n +2 | jq -r '.output.tools[]?.methodName'
```

Without `jq`, Node can do the same (Node is already installed if you can run the program):

```bash
ihateposting-agent integrations:settings "$CHANNEL_ID" | tail -n +2 | node -e '
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
$lines = ihateposting-agent integrations:settings $env:CHANNEL_ID
$answer = ($lines | Select-Object -Skip 1) -join "`n" | ConvertFrom-Json
$answer.output.maxLength
$answer.output.settings.required
```

(`tail -n +2` and `sed 1d` both remove the first line. If the answer holds characters outside plain ASCII and PowerShell shows them garbled, set `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` first.)

### Keeping an answer to compare later

```bash
ihateposting-agent integrations:settings "$CHANNEL_ID" | tail -n +2 > "settings-$CHANNEL_ID.json"
```

Run the command again after the app has been updated and compare the two files with `diff`. A new key, a changed limit or a new rule shows up as a change in the file. The file holds only what the server answered, never your key.

## The workflow in three steps

### 1. Find the channel

```bash
ihateposting-agent integrations:list
```

```json
[
  { "id": "pinterest-123", "name": "Tidy Shelves", "identifier": "pinterest", "disabled": false },
  { "id": "bluesky-789", "name": "Example", "identifier": "bluesky", "disabled": false }
]
```

(Placeholder values, abridged: each entry has more fields. The program prints a header line before the list.) The `id` is what you pass on; the `identifier` is the platform.

### 2. Read its settings

```bash
ihateposting-agent integrations:settings pinterest-123
```

The answer has this outline (abridged, and not a recorded answer; the real `rules`, `maxLength` and `description` texts are what your server returns):

```json
{
  "output": {
    "rules": "...",
    "maxLength": "<a number>",
    "settings": {
      "type": "object",
      "properties": {
        "title": { "type": "string", "maxLength": 100 },
        "link": { "type": "string", "format": "url" },
        "dominant_color": { "type": "string" },
        "board": { "type": "string", "not": { "type": "null" }, "minLength": 1, "pattern": "^\\d+$", "description": "..." }
      },
      "required": ["board"]
    },
    "tools": [ { "methodName": "boards", "description": "...", "dataSchema": [] } ]
  }
}
```

What it tells you: the rules say what a pin needs in the way of media; `title` may be at most 100 characters; `link` is a web address; `board` is required and must be digits only; and a helper called `boards` takes no input (its `dataSchema` is empty).

### 3. Use it in a post

Get the one value only the platform knows, with the helper, then make the post:

```bash
ihateposting-agent integrations:trigger pinterest-123 boards

ihateposting-agent posts:create -i pinterest-123 -c "Ten quick tips for tidy shelves" \
  -m "<path from upload>" -s 2026-12-15T10:00:00Z -t draft \
  --settings '{"board":"1234567890","title":"Ten tips","link":"https://example.com/tips"}'
```

A ready body file for the same thing is [examples/pinterest-pin.json](examples/pinterest-pin.json).

## A second walk-through: a TikTok video

TikTok is the platform with the most required keys, so it shows why reading the schema first pays off.

```bash
ihateposting-agent integrations:settings tiktok-123
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
ihateposting-agent posts:create -i tiktok-123 -c "Thirty seconds on how we pack an order" \
  -m "<path of the uploaded video>" -s 2026-12-15T10:00:00Z -t draft \
  --settings '{"content_posting_method":"DIRECT_POST","privacy_level":"SELF_ONLY","duet":false,"stitch":false,"comment":true,"autoAddMusic":"no","brand_content_toggle":false,"brand_organic_toggle":false}'

ihateposting-agent posts:status <post-id> --status schedule
```

## What to expect, platform by platform

This is a map of what each answer usually contains, from the schemas the app publishes. It is a guide to help you recognise an answer, not a promise: your server's answer wins.

### X

- **Required settings:** none.
- **Optional settings:** reply control, an X community, the article keys (`post_type`, `article_title`, `article_status`, `article_cover`) and two labels (`made_with_ai`, `paid_partnership`).
- **Rules:** up to four pictures or one video, or neither; articles are written as HTML. The sentence about links may be added by the server's configuration.
- **maxLength:** short for a normal post, longer for a channel marked as verified, much longer for an article. The number depends on the channel and on the post's mode, so read it for your channel.
- **Helpers:** none.

### LinkedIn and LinkedIn Page

- **Required settings:** none. Optional: `post_as_images_carousel`, `carousel_name`.
- **Rules:** one attachment when it is a video; a carousel needs two or more pictures.
- **Helpers:** `mention`, which needs `{"query": "<company page name>"}`.

### Instagram

- **Required settings:** `post_type` (`post` or `story`).
- **Optional settings:** `collaborators`, `graduation_strategy`, `is_trial_reel` (listed without a type).
- **Rules:** at least one attachment; a story only one picture.
- **Helpers:** none.

### TikTok

- **Required settings:** eight keys: `content_posting_method`, `privacy_level`, `duet`, `stitch`, `comment`, `autoAddMusic`, `brand_content_toggle`, `brand_organic_toggle`.
- **Optional settings:** `title`, `video_made_with_ai`.
- **Rules:** a long text. Read it. It explains that `DIRECT_POST` publishes and `UPLOAD` does not, which keys count in which mode, and which apply to videos only or photos only.
- **Helpers:** none.

### YouTube

- **Required settings:** `title`, `type`. Optional: `selfDeclaredMadeForKids`, `thumbnail`, `tags`.
- **Rules:** a video is needed; the post cannot be empty.
- **Helpers:** none.

### Pinterest

- **Required settings:** `board`. Optional: `title`, `link`, `dominant_color`.
- **Rules:** at least one picture; a video pin needs a cover picture too; up to five pictures.
- **Helpers:** `boards`.

### Facebook

- **Required settings:** none. Optional: `post_type`, `url`, `title`, `text_format_preset_id`.
- **Rules:** text, pictures or a video; a story needs an attachment and each attachment is its own story.
- **Helpers:** none.

### Tumblr

- **Required settings:** none. Optional: `title`, `link`, `sourceUrl`, `tags`. No rules text.
- **Helpers:** none.

### Google Business

- **Required settings:** none. Optional: the post kind, the button, event and offer details.
- **Rules:** text and optionally one picture; updates, events and offers.
- **Helpers:** none.

### Slack and Discord

- **Required settings:** `channel`, the id of the room to post in.
- **Helpers:** `channels`, which lists the rooms.

### Bluesky, Mastodon, Telegram, Threads

No settings. The answer is short:

```json
{
  "output": {
    "maxLength": 300,
    "settings": "No additional settings required"
  }
}
```

Bluesky's answer also has a `rules` sentence about how many pictures or videos a post may hold. The `maxLength` differs from platform to platform; the number above is only an illustration.

## What you can do with the answer

Read the answer once per channel, not once per post: `required` says which keys you must send, `rules` says what to attach, and `maxLength` bounds the text.

### Check the length

```bash
LIMIT=$(ihateposting-agent integrations:settings "$CHANNEL_ID" | tail -n +2 | node -p 'JSON.parse(require("fs").readFileSync(0, "utf8")).output.maxLength')
echo "At most $LIMIT characters"
```

### List the keys a channel takes

This prints every key of the settings schema, marks the required ones with `*`, and shows the allowed values or the type:

```bash
ihateposting-agent integrations:settings "$CHANNEL_ID" | tail -n +2 | node -e '
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

### Build the post from the answer

A script that reads the answer, refuses a text that is too long, refuses to continue when required settings are missing, and then makes a draft (it never publishes):

```bash
#!/usr/bin/env bash
set -euo pipefail

CHANNEL_ID="${CHANNEL_ID:?Set CHANNEL_ID to a channel id from integrations:list}"
TEXT="${TEXT:-Ten quick tips for tidy shelves}"
POST_DATE="${POST_DATE:-2026-12-15T10:00:00Z}"

answer="$(ihateposting-agent integrations:settings "$CHANNEL_ID" | tail -n +2)"
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
ihateposting-agent posts:create "${args[@]}"
```

Run it as `CHANNEL_ID=<id> SETTINGS_JSON='{"board":"1234567890"}' bash build-draft.sh`. The shell counts characters its own way and the platform may count differently, so leave room under the limit. [examples/discover-and-draft.sh](examples/discover-and-draft.sh) is a longer script in the same spirit.

## What the program asks the server

```text
GET /public/v1/integration-settings/<channel-id>
```

The answer:

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

The key goes in the `Authorization` header exactly as it is; see [README.md](README.md) for how the program finds it. The shape above is the one the app documents; the exact `rules` and `description` words are the server's.

## When something goes wrong

| What you see | What to check |
| --- | --- |
| `❌ Failed to get integration settings: Request failed: API Error (404): ...` | The channel id is not one of your workspace's. In the app's own words the body says the integration was not found (unverified here). Copy the id from `integrations:list` again. |
| `... API Error (401): ...` | The key was refused. Check it with `ihateposting-agent auth:status`. |
| `❌ Error: No authentication found.` | Nobody is signed in. Run `auth:login`, or export `IHATEPOSTING_API_KEY`. The request was not sent. |
| The usage text, then `Not enough non-option arguments: got 0, need at least 1` | You left out the channel id. |
| `❌ Failed to get integration settings: Request failed: request to <address> failed, reason: ...` | The address could not be reached. Check `IHATEPOSTING_API_URL` and your network. The program does not retry. |
| `❌ Failed to get integration settings: Request failed: Invalid URL` | `IHATEPOSTING_API_URL` is not a web address. |
| A JSON parse error that quotes the first characters of the header line | You gave the whole output, header line included, to a JSON parser. Remove the first line (`tail -n +2`). |
| `maxLength` is `0` and everything else is empty | The server does not know this channel's platform. Nothing is known about it; ask whoever runs the server. |
| The server refuses a post although the settings match the schema | The schema does not show conditions between keys. Read `output.rules` and the `description` of each key, then read the server's message after `API Error (<status>)`. |

## Tips for AI agents

1. **Take channel ids only from `integrations:list`.** Do not make them up and do not reuse one from another workspace.
2. **Read the answer, do not recall it.** The rules, limits and schema belong to the server and can change. Read them for the channel you are about to post to.
3. **Keep four things:** `rules`, `maxLength`, the schema, and the names of the helpers. Do not keep the whole answer in a long prompt; keep the parts you use.
4. **Fill every required key.** If a key needs a value only the platform knows, find a helper in `tools` and run it.
5. **Branch on the shape.** Check whether `settings` is an object, a sentence or empty before you read `properties`.
6. **Obey the rules text even when the schema is silent.** It carries the conditions that depend on other keys.
7. **Draft first.** Make the post with `-t draft`, check it, and only then `posts:status <post-id> --status schedule`.
8. **If the server refuses something, read its words, fix the cause and try once more.** The program does not retry for you, and a rate limit is shown once.
9. **Cache sensibly.** One read per channel per session is plenty. Read again when a post is refused in a way the old answer does not explain.

## See also

- [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md) and [PROVIDER_SETTINGS_SUMMARY.md](PROVIDER_SETTINGS_SUMMARY.md): the keys and values of each platform.
- [INTEGRATION_TOOLS_WORKFLOW.md](INTEGRATION_TOOLS_WORKFLOW.md): running the helpers that `output.tools` lists.
- [SUPPORTED_FILE_TYPES.md](SUPPORTED_FILE_TYPES.md): getting pictures and videos into the media library.
- [QUICK_START.md](QUICK_START.md) and [FEATURES.md](FEATURES.md): the whole program in a page or two.
