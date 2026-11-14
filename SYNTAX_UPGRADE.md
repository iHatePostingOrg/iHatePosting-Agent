# Command line syntax and moving scripts

How a post is written on the command line, how options are spelled, what the program prints, and what to change when you move an existing script to `ihateposting-agent`. Every point is something the program does today; where a result depends on the server, the page says so.

## The core idea: one `-c` for each part, one `-m` for its media

A post is a list of **parts**. The first part is the post itself; the parts after it are comments (the rest of a thread). Instead of packing everything into one string, give one `-c` per part and, if the part has pictures or a video, a `-m` right after it:

```bash
ihateposting-agent posts:create \
  -i x-123 -s 2026-12-15T10:00:00Z -t draft \
  -c "Main post" -m "<path1>,<path2>" \
  -c "First comment" -m "<path3>" \
  -c "Second comment; with a semicolon, and a comma"
```

The program has no special characters of its own to escape: a semicolon, a comma or a line break in a `-c` is just text.

### How the pairing works

- The 1st `-c` is the post. The 2nd `-c` is the first comment, the 3rd the second comment, and so on.
- `-m` is paired with `-c` **by position**, not by where it stands on the line. The first `-m` belongs to the first `-c`, the second `-m` to the second `-c`. Writing `-m a.png -c "Main" -m b.png -c "Comment"` gives the same result as writing each `-m` after its `-c`.
- Media is optional for every part. A part without a `-m` has no media.
- To give media to the second part only, keep the first part's place with an empty one: `-c "A" -m "" -c "B" -m "b.png"`.
- Several files for one part go in one `-m`, separated by commas: `-m "a.png,b.png"`. Spaces around a comma are trimmed.
- A `-m` that has no `-c` to pair with is dropped without a warning. Count your parts.

```bash
# the second part has the picture, the first has none
ihateposting-agent posts:create -i x-123 -s 2026-12-15T10:00:00Z -t draft \
  -c "Text only" -m "" \
  -c "Reply with a picture" -m "<path>"
```

### Alt texts

`--alt` follows the same rule as `-m`: one `--alt` per `-c`, with one text per picture, in the order of the addresses.

```bash
ihateposting-agent posts:create -i instagram-123 -s 2026-12-15T10:00:00Z -t draft \
  -c "Two pictures" -m "<path1>,<path2>" --alt "The team,The cake"
```

The texts are split at commas, so an alt text that itself contains a comma cannot be given this way. Use a body file for those (see below). If there are fewer alt texts than pictures, the pictures after the last text have none.

### Why one flag per part

Joining parts into one string with a separator breaks as soon as the separator appears in the text, and it leaves no room for media per part. With one flag per part, any character is allowed (including `;`), every part can have its own pictures, and a script can build the command from a list of strings.

## Real examples

A launch post with follow-ups and their pictures:

```bash
ihateposting-agent posts:create -i x-123,linkedin-456 -s 2026-12-15T10:00:00Z -t draft \
  -c "ProductX is out today" -m "<hero>,<features>" \
  -c "What it does, in three lines" -m "<details>" \
  -c "Launch offer: half price this week" -m "<offer>"
```

A thread on X, with a pause between the parts:

```bash
ihateposting-agent posts:create -i x-123 -s 2026-12-15T10:00:00Z -t draft -d 5 \
  -c "Thread: how we test a release (1/4)" \
  -c "1. A branch runs the checks on every change (2/4)" \
  -c "2. A staging copy gets the release first (3/4)" \
  -c "3. Then we ship, and we watch the graphs (4/4)"
```

Text with punctuation that would otherwise need escaping:

```bash
ihateposting-agent posts:create -i x-123 -s 2026-12-15T10:00:00Z -t draft \
  -c "Three tips for scripts" \
  -c "Tip one: use const; avoid var" \
  -c "Tip two: keep functions small; name them well, always"
```

Build the command from a list, one `-c` for each item:

```bash
parts=("Main post" "Second, with a comma" "Third; with a semicolon")
args=()
for part in "${parts[@]}"; do
  args+=(-c "$part")
done
ihateposting-agent posts:create -i "$CHANNEL_ID" "${args[@]}" -s 2026-12-15T10:00:00Z -t draft
```

## Delay between parts

`-d <minutes>` (long form `--delay`) sets the delay between a post and its comments. It is written into every part, and the default is `0`:

```bash
ihateposting-agent posts:create -i x-123 -s 2026-12-15T10:00:00Z -t draft -d 10 \
  -c "Main" -c "Comment one" -c "Comment two"
```

One delay applies to all parts. To give each part its own delay, use a body file, where each part has its own `delay`.

## All options of `posts:create`

| Option | Short | More than once? | What it takes |
| --- | --- | --- | --- |
| `--content` | `-c` | yes | The text of one part |
| `--media` | `-m` | yes | Comma-separated addresses of already uploaded files, for the `-c` in the same position |
| `--alt` | | yes | Comma-separated alt texts, same order as `-m` |
| `--integrations` | `-i` | no | Comma-separated channel ids |
| `--date` | `-s` | no | When the post is due, ISO 8601. Required unless `--json` is used |
| `--type` | `-t` | no | `schedule` (default) or `draft` |
| `--delay` | `-d` | no | Minutes between the parts. Default `0` |
| `--json` | `-j` | no | Path of a body file |
| `--shortLink` | | no | Shorten links in the text. Default on; `--no-shortLink` turns it off |
| `--settings` | | no | The platform settings as a JSON string |

`posts:create --help` prints the same list with the program's own examples.

## Command line or body file

Use flags for quick posts, for the same text on several channels, and for commands a script builds. Use a body file (`--json <file>`) for different content per channel, for alt texts with commas, for addresses that contain commas, for a different delay per part, and for anything you want to keep and review.

With `--json`, the file is sent exactly as it is and every other post option is ignored. The shape:

```json
{
  "type": "draft",
  "date": "2026-12-15T10:00:00Z",
  "shortLink": true,
  "tags": [],
  "posts": [
    {
      "integration": { "id": "x-123" },
      "value": [{ "content": "Hello", "image": [{ "id": "img-1", "path": "https://media.example/uploads/photo.png" }], "delay": 0 }],
      "settings": {}
    }
  ]
}
```

Examples for each platform are in [examples/](examples/README.md). When the program builds the body from flags it also adds `"creationMethod": "CLI"`; a body file does not get that.

## Pictures and videos are addresses, never local files

`-m` takes the addresses of files that are already in your media library. Upload first, then use the `path` the upload printed:

```bash
ihateposting-agent upload ./photo.png
ihateposting-agent posts:create -i x-123 -c "Look" -m "<path from the upload>" -s 2026-12-15T10:00:00Z -t draft
```

`posts:create` never uploads anything. If you write `-m ./photo.png`, the text `./photo.png` is sent as the address, and the server will most likely refuse or ignore it. See [SUPPORTED_FILE_TYPES.md](SUPPORTED_FILE_TYPES.md).

## The date, the type and the links

- **The date is always required.** `--date` (short `-s`) must be given unless the whole body comes from `--json`. There is no default and no "now". The program sends your text as typed; the server judges it.
- **Only two types.** `-t schedule` (the default) and `-t draft`. Anything else is refused by the program, with the usage text, before it asks the server. `posts:status <id> --status draft|schedule` moves an existing post between the two.
- **Short links are on.** `--shortLink` defaults to `true`; turn it off with `--no-shortLink`.
- **Settings are a JSON string**, the same for every channel in `-i`. See [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md).

## Option spellings

Options are handled by yargs, so a multi-word option can be written in camelCase or with dashes: `--startDate` or `--start-date`, `--release-id` or `--releaseId`, `--auth-server` or `--authServer`, `--no-shortLink` or `--no-short-link`.

Watch the short names, they are not the same everywhere:

| Short | `posts:create` | `posts:status` | `integrations:trigger` | `analytics:*` | `media:list` |
| --- | --- | --- | --- | --- | --- |
| `-s` | `--date` | `--status` | | | `--search` |
| `-d` | `--delay` (minutes) | | `--data` (JSON) | `--date` (days back) | |
| `-t` | `--type` | | | | |
| `-p` | | | | | `--page` |

## What the program prints

Most commands print one **header line**, then the answer as indented JSON on standard output. The header of each command:

| Command | Header line |
| --- | --- |
| `posts:create` | `✅ Post created successfully!` |
| `posts:list` | `📋 Posts:` |
| `posts:delete` | `✅ Post <id> deleted successfully!` (and nothing else) |
| `posts:status` | `✅ Post <id> status changed to <status>` |
| `posts:settings` | `✅ Post <id> settings updated` |
| `posts:connect` | `✅ Post <id> connected to release <release-id>` |
| `integrations:list` | `🔌 Connected Integrations:` |
| `integrations:groups` | `👥 Groups (Customers):` |
| `integrations:settings` | `⚙️  Settings for integration: <id>` |
| `integrations:trigger` | `🔧 Tool result for <method>:` |
| `analytics:platform` | `📊 Analytics for integration: <id>` |
| `analytics:post` | `📊 Analytics for post: <id>` |
| `upload` | `✅ File uploaded successfully!` |
| `posts:missing`, `media:list`, `media:status` | no header, only JSON |

To parse the JSON in a script, skip the first line when there is a header (`... | tail -n +2 | jq ...`).

Errors go to **standard error**: `❌ Failed to <what>: <why>`. For a refusal by the server the why is `Request failed: API Error (<status>): <the server's words>`; the one exception is `upload`, which says `Upload failed (<status>): ...`.

There is **one failure code**: every failure ends with exit code `1`. There are no other non-zero codes. The one command that reports without failing is `auth:status`, which prints its findings and ends with `0` even when the key is refused.

Mistakes in the command line itself (a missing required option, a value that is not one of the choices) print the command's usage and the reason on standard error and end with `1`, without contacting the server.

## Things that are quiet, and things that wait

- A **command name the program does not know does nothing and exits `0`**, and an **option it does not know is ignored**. A typo such as `--setting` (instead of `--settings`) or `post:create` does not warn you. Check `--help` when a command seems to have no effect.
- Nothing is retried and nothing is waited out: a rate limit or a server error is shown once and the command ends.
- There is no time limit. A server that never answers is waited for; use your shell's `timeout` when a script must not hang.

## For AI agents: writing commands

1. One `-c` for each part. Never join parts into a single string.
2. A `-m` for each part that has media, in the same order. Use `-m ""` to skip a part.
3. Take channel ids from `integrations:list`, rules and settings from `integrations:settings`, media addresses from `upload`.
4. Always give `-s` with a real date, and `-t draft` until a person has looked at the post.
5. Put settings in `--settings` for one platform per command, or in a body file for several.
6. After the call, read the JSON, not just the exit code: `0` means the server accepted the request.
7. Never print or log the key. If a command fails, show the program's own message; the program does not put the key in its messages.

## Moving an existing script

Scripts written with other flag names will not do what they say. Because the program ignores an option it does not know, they can still run, and "run" is not the same as "work". These are the changes that matter most:

| In the old script | What happens here | Write this instead |
| --- | --- | --- |
| `--comments "a;b"` | ignored; only the main text is posted | one `-c` for each part |
| `--image photo.png` | ignored; the post has no picture | `-m "<path from upload>"` |
| `-m ./local-file.png` | sent as text, not uploaded | `upload ./local-file.png`, then `-m "<path>"` |
| `--schedule <date>` | ignored; then `--date is required` stops the command | `-s <date>` or `--date <date>` |
| `-t now` | refused: `now` is not a choice | `-t schedule` or `-t draft`, with a date a little ahead; there is no immediate mode |
| no date at all | refused: `--date is required when not using --json` | a date with `-s` |
| `-p <platform>` | ignored; the platform comes from the channel | remove it |
| `"__type"` inside settings | sent as written | leave it out |
| a parser that expects only JSON | the header line breaks it | `tail -n +2` before parsing |
| a check for exit codes other than `0` and `1` | there are none | test for non-zero |

A before-and-after:

```bash
# before
mytool post -c "Launch day" --comments "Thanks all;Details below" --image launch.png -p x -i x-123

# after
ihateposting-agent upload ./launch.png
ihateposting-agent posts:create -i x-123 -s 2026-12-15T10:00:00Z -t draft \
  -c "Launch day" -m "<path from the upload>" \
  -c "Thanks all" \
  -c "Details below"
```

## Quick translation

| You want to | Do this |
| --- | --- |
| Post text now-ish | `posts:create -i <id> -c "text" -s <a date a little ahead>` (there is no immediate mode) |
| Save without publishing | add `-t draft` |
| Attach a local picture | `upload ./pic.png`, then `-m "<returned path>"` |
| Reply chain or thread | repeat `-c` |
| Platform options | `--settings '<json>'`, after reading `integrations:settings <id>` |
| See what a platform allows | `integrations:settings <id>` (`output.rules`, `output.maxLength`, `output.settings`, `output.tools`) |
| Find an id for a setting | `integrations:trigger <id> <method>` |
| See what is scheduled | `posts:list` |

## See also

- [examples/COMMAND_LINE_GUIDE.md](examples/COMMAND_LINE_GUIDE.md): the command line option by option.
- [examples/EXAMPLES.md](examples/EXAMPLES.md): longer examples.
- [FEATURES.md](FEATURES.md) and [QUICK_START.md](QUICK_START.md): the program as a whole.
- [SKILL.md](SKILL.md): the guidance written for AI agents.
- [README.md](README.md): installation and sign-in.
