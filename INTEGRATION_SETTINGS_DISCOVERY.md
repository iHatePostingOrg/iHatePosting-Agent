# Discovering a channel's settings

Every platform has its own rules: how long a post may be, whether it needs a picture, which options it takes. You (or an agent) should not have to guess them. `integrations:settings` asks the server what applies to one channel and prints it. Run it before you write a post for a channel you have not posted to in this way before.

```bash
ihateposting-agent integrations:settings <channel-id>
```

`<channel-id>` is the `id` of an entry of `ihateposting-agent integrations:list`. A channel id that is not in your workspace is refused by the server, and the program shows the refusal after `❌ Failed to get integration settings: Request failed: API Error (<status>): ...`.

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
| `output.tools` | A list of helpers, each with a `methodName`, a `description` and a `dataSchema`. Absent when the platform has none. | Run them with `integrations:trigger` to find values the platform decides (boards, rooms, companies). See [INTEGRATION_TOOLS_WORKFLOW.md](INTEGRATION_TOOLS_WORKFLOW.md). |

If a channel is of a platform the server does not know, the answer is empty: no rules, a `maxLength` of `0`, empty settings and no helpers. Treat that as "nothing is known", not as "anything goes".

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

A key can be nested (a media object has `id`, `path`, ...). Nested objects are written out in place, not referenced.

## Pulling out the parts you need

The header line is not JSON, so drop it before you parse. With `jq`:

```bash
ihateposting-agent integrations:settings "$CHANNEL_ID" | sed 1d | jq '.output.maxLength'
ihateposting-agent integrations:settings "$CHANNEL_ID" | sed 1d | jq -r '.output.settings.required? // [] | .[]'
ihateposting-agent integrations:settings "$CHANNEL_ID" | sed 1d | jq -r '.output.tools[]?.methodName'
```

Without `jq`, Node can do the same (Node is already installed if you can run the program):

```bash
ihateposting-agent integrations:settings "$CHANNEL_ID" | sed 1d | node -e '
let s = "";
process.stdin.on("data", (d) => (s += d)).on("end", () => {
  const out = JSON.parse(s).output;
  console.log("maxLength:", out.maxLength);
  console.log("required:", (typeof out.settings === "object" && out.settings.required) || []);
  console.log("helpers:", (out.tools || []).map((t) => t.methodName));
});'
```

(`sed 1d` removes the first line. In PowerShell use `Select-Object -Skip 1` instead.)

## A worked example: a Pinterest pin

Pinterest asks for a board, and the board has to be named by its numeric id. The ids below are placeholders; yours come from your own answers.

**1. Find the channel.**

```bash
ihateposting-agent integrations:list
```

Suppose the entry you want has `"id": "pinterest-123"` and `"identifier": "pinterest"`.

**2. Read its settings.**

```bash
ihateposting-agent integrations:settings pinterest-123
```

The answer has this outline (abridged, and not a recorded answer; the real `rules` and `maxLength` are what your server returns):

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
        "board": { "type": "string", "not": { "type": "null" }, "minLength": 1, "pattern": "^\\d+$" }
      },
      "required": ["board"]
    },
    "tools": [ { "methodName": "boards", "description": "...", "dataSchema": [] } ]
  }
}
```

What it tells you: the rules say a pin needs a picture; `title` may be at most 100 characters; `link` is a web address; `board` is required and must be digits only; and there is a helper called `boards` that takes no input (its `dataSchema` is empty).

**3. Run the helper to get a board id.**

```bash
ihateposting-agent integrations:trigger pinterest-123 boards
```

The list of boards is under `output`. Pick the board you want and copy its id, which is digits only (say `1234567890`).

**4. Upload the picture** and keep the `path` the answer contains:

```bash
ihateposting-agent upload ./pin.png
```

**5. Make a draft with the settings.**

```bash
ihateposting-agent posts:create \
  -i pinterest-123 \
  -c "Ten quick tips for tidy shelves" \
  -m "<path from step 4>" \
  -s 2026-12-15T10:00:00Z \
  -t draft \
  --settings '{"board":"1234567890","title":"Ten tips","link":"https://example.com/tips"}'
```

A ready body file for the same thing is [examples/pinterest-pin.json](examples/pinterest-pin.json).

## A checklist for an agent

1. Take channel ids only from `integrations:list`.
2. Run `integrations:settings` for the channel; keep `rules`, `maxLength`, the schema and the helper names.
3. For every required key of the schema that needs a value only the platform knows, find a helper in `tools` and run it.
4. Keep every part of the text within `maxLength` and follow `rules` about media.
5. Send only keys the schema lists.
6. Make a draft first (`-t draft`); schedule it with `posts:status <post-id> --status schedule` once it looks right.
7. If the server refuses something, read its words, fix the cause, and try once more. The program does not retry for you.
