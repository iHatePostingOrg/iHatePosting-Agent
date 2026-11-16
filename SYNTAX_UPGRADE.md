# iHatePosting CLI - Improved Syntax! 🎉

## What Changed

The CLI supports a **much better** command-line syntax for creating posts with comments that have their own media.

## New Syntax: Multiple `-c` and `-m` Flags

Instead of using semicolon-separated strings (which break when you need semicolons in your content), you can use multiple `-c` and `-m` flags:

```bash
ihateposting-agent posts:create \
  -c "main post content" -m "media1.png,media2.png" \
  -c "first comment" -m "media3.png" \
  -c "second comment; with semicolon!" -m "media4.png,media5.png" \
  -s "2024-12-31T12:00:00Z" \
  -t draft \
  -i "x-123"
```

In the examples down to the Summary, a media name such as `media1.png` stands for the address (`path`) that `ihateposting-agent upload` printed: `-m` never uploads a file (see "Pictures and videos are addresses, never local files" at the end of this page). Each of those examples is a draft (`-t draft`) with a date (`-s`), because `posts:create` needs a date.

## The Problem We Solved

### ❌ Old Approach (Problematic)

```bash
ihateposting-agent posts:create \
  -c "Main post" \
  --comments "Comment 1;Comment 2;Comment 3" \
  -s "2024-12-31T12:00:00Z" \
  -t draft \
  -i "x-123"
```

This program has no `--comments` option. It ignores an option it does not know, so a script written this way runs and posts only the main text.

**Issues:**
1. ❌ Can't use semicolons in comment text
2. ❌ Comments can't have their own media
3. ❌ Less intuitive syntax
4. ❌ Limited flexibility

### ✅ New Approach (Better!)

```bash
ihateposting-agent posts:create \
  -c "Main post" -m "main.jpg" \
  -c "Comment 1; with semicolon!" -m "comment1.jpg" \
  -c "Comment 2" -m "comment2.jpg" \
  -c "Comment 3" \
  -s "2024-12-31T12:00:00Z" \
  -t draft \
  -i "x-123"
```

**Benefits:**
1. ✅ Semicolons work fine in content
2. ✅ Each comment can have different media
3. ✅ More readable and intuitive
4. ✅ Fully flexible

## How It Works

### Pairing Logic

The CLI pairs `-c` and `-m` flags in order:

```bash
ihateposting-agent posts:create \
  -c "Content 1" -m "media-for-content-1.jpg" \
  -c "Content 2" -m "media-for-content-2.jpg" \
  -c "Content 3" -m "media-for-content-3.jpg" \
  -s "2024-12-31T12:00:00Z" \
  -t draft \
  -i "x-123"
```

Each of the three lines is one pair: Pair 1, Pair 2 and Pair 3.

- **1st `-c`** = Main post
- **2nd `-c`** = First comment (posted after delay)
- **3rd `-c`** = Second comment (posted after delay)
- Each `-m` is paired with the corresponding `-c` (in order)

### Media is Optional

```bash
ihateposting-agent posts:create \
  -c "Post with media" -m "image.jpg" \
  -c "Comment without media" \
  -c "Another comment" \
  -s "2024-12-31T12:00:00Z" \
  -t draft \
  -i "x-123"
```

Result:
- Post with image
- Text-only comment
- Another text-only comment

### Multiple Media per Post/Comment

```bash
ihateposting-agent posts:create \
  -c "Main post" -m "img1.jpg,img2.jpg,img3.jpg" \
  -c "Comment" -m "img4.jpg,img5.jpg" \
  -s "2024-12-31T12:00:00Z" \
  -t draft \
  -i "x-123"
```

Result:
- Main post with 3 images
- Comment with 2 images

## Real Examples

### Example 1: Product Launch

```bash
ihateposting-agent posts:create \
  -c "🚀 Launching ProductX today!" \
  -m "hero.jpg,features.jpg" \
  -c "⭐ Key features you'll love..." \
  -m "features-detail.jpg" \
  -c "💰 Special offer: 50% off!" \
  -m "discount.jpg" \
  -s "2024-12-31T12:00:00Z" \
  -t draft \
  -i "x-123,linkedin-456"
```

### Example 2: Twitter Thread

```bash
ihateposting-agent posts:create \
  -c "🧵 Thread: How to X (1/5)" -m "intro.jpg" \
  -c "Step 1: ... (2/5)" -m "step1.jpg" \
  -c "Step 2: ... (3/5)" -m "step2.jpg" \
  -c "Step 3: ... (4/5)" -m "step3.jpg" \
  -c "Conclusion (5/5)" -m "done.jpg" \
  -d 2000 \
  -s "2024-12-31T12:00:00Z" \
  -t draft \
  -i "x-123"
```

### Example 3: Tutorial with Screenshots

```bash
ihateposting-agent posts:create \
  -c "Tutorial: Feature X 📖" \
  -m "tutorial-cover.jpg" \
  -c "1. Open settings" \
  -m "settings-screenshot.jpg" \
  -c "2. Enable feature X" \
  -m "enable-screenshot.jpg" \
  -c "3. You're done! 🎉" \
  -m "success-screenshot.jpg" \
  -s "2024-12-31T12:00:00Z" \
  -t draft \
  -i "x-123"
```

### Example 4: Content with Special Characters

```bash
ihateposting-agent posts:create \
  -c "Main post about programming" \
  -c "First tip: Use const; avoid var" \
  -c "Second tip: Functions should do one thing; keep it simple" \
  -c "Third tip: Comments should explain 'why'; not 'what'" \
  -s "2024-12-31T12:00:00Z" \
  -t draft \
  -i "x-123"
```

**No escaping needed!** Semicolons work perfectly.

## Options Reference

| Option | Alias | Multiple? | Description |
|--------|-------|-----------|-------------|
| `--content` | `-c` | ✅ Yes | Post/comment content |
| `--media` | `-m` | ✅ Yes | Comma-separated media URLs |
| `--alt` | - | ✅ Yes | Comma-separated alt texts for the media of the corresponding `-m`, same order |
| `--integrations` | `-i` | ❌ No | Integration IDs |
| `--date` | `-s` | ❌ No | ISO 8601 date (required unless `--json` is used) |
| `--type` | `-t` | ❌ No | `schedule` (default) or `draft` |
| `--delay` | `-d` | ❌ No | Delay between comments (minutes, default: 0) |
| `--shortLink` | - | ❌ No | Use short links (default: true) |
| `--settings` | - | ❌ No | Platform-specific settings as a JSON string |
| `--json` | `-j` | ❌ No | Load from JSON file |

`posts:create --help` prints the same list with the program's own examples.

## Delay Between Comments

Use `-d` to control the delay between comments:

```bash
# 10 minutes between each
ihateposting-agent posts:create \
  -c "Main" \
  -c "Comment 1" \
  -c "Comment 2" \
  -d 10 \
  -s "2024-12-31T12:00:00Z" \
  -t draft \
  -i "x-123"
```

**Default:** 0 (no delay)

## Command Line vs JSON

### Use Command Line When:
- ✅ Quick posts
- ✅ Same content for all platforms
- ✅ Simple structure
- ✅ Dynamic/scripted content

### Use JSON When:
- ✅ Different content per platform
- ✅ Very complex structures
- ✅ Reusable templates
- ✅ Integration with other tools

## For AI Agents

### Generating Commands

```bash
# Build a multi-post command with media
ihateposting-agent posts:create \
  -c "Main post" \
  -m "img1.jpg,img2.jpg" \
  -c "Comment; with semicolon!" \
  -m "img3.jpg" \
  -c "Another comment" \
  -s "2024-12-31T12:00:00Z" \
  -t draft \
  -i "x-123"
```

## Migration Guide

If you have existing scripts using the old syntax (a `--comments` option and an `--image` option, which this program does not have; it ignores an option it does not know, so such a script runs but posts only its main text and no picture):

### Before:
```bash
ihateposting-agent posts:create \
  -c "Main post" \
  --comments "Comment 1;Comment 2" \
  --image "main-image.jpg" \
  -s "2024-12-31T12:00:00Z" \
  -t draft \
  -i "x-123"
```

### After:
```bash
ihateposting-agent posts:create \
  -c "Main post" -m "main-image.jpg" \
  -c "Comment 1" \
  -c "Comment 2" \
  -s "2024-12-31T12:00:00Z" \
  -t draft \
  -i "x-123"
```

## Documentation

See these files for more details:

- **[COMMAND_LINE_GUIDE.md](./examples/COMMAND_LINE_GUIDE.md)** - Comprehensive command-line guide
- **[draft-from-flags.sh](./examples/draft-from-flags.sh)** - Executable examples
- **[EXAMPLES.md](./examples/EXAMPLES.md)** - Full usage patterns
- **[SKILL.md](./SKILL.md)** - AI agent integration
- **[README.md](./README.md)** - General documentation

## Summary

### ✅ You Can Now:

1. **Use multiple `-c` flags** for main post + comments
2. **Use multiple `-m` flags** to pair media with each `-c`
3. **Use semicolons freely** in your content
4. **Create complex threads** easily from command line
5. **Each comment has its own media** array
6. **More intuitive syntax** overall

### 🎯 Perfect For:

- Twitter threads
- Product launches with follow-ups
- Tutorials with screenshots
- Event coverage
- Multi-step announcements
- Any post with comments that need their own media!

**The CLI is powerful and user-friendly!** 🚀

## Sections that were in this file before it followed the reference

These sections come unchanged from this file as it was before it followed the reference. They are kept because they hold points the reference's text does not.

### Command line syntax and moving scripts

How a post is written on the command line, how options are spelled, what the program prints, and what to change when you move an existing script to `ihateposting-agent`. Every point is something the program does today; where a result depends on the server, the page says so.

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

### Delay between parts

`-d <minutes>` (long form `--delay`) sets the delay between a post and its comments. It is written into every part, and the default is `0`:

```bash
ihateposting-agent posts:create -i x-123 -s 2026-12-15T10:00:00Z -t draft -d 10 \
  -c "Main" -c "Comment one" -c "Comment two"
```

One delay applies to all parts. To give each part its own delay, use a body file, where each part has its own `delay`.

### Command line or body file

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

### Pictures and videos are addresses, never local files

`-m` takes the addresses of files that are already in your media library. Upload first, then use the `path` the upload printed:

```bash
ihateposting-agent upload ./photo.png
ihateposting-agent posts:create -i x-123 -c "Look" -m "<path from the upload>" -s 2026-12-15T10:00:00Z -t draft
```

`posts:create` never uploads anything. If you write `-m ./photo.png`, the text `./photo.png` is sent as the address, and the server will most likely refuse or ignore it. See [SUPPORTED_FILE_TYPES.md](SUPPORTED_FILE_TYPES.md).

### The date, the type and the links

- **The date is always required.** `--date` (short `-s`) must be given unless the whole body comes from `--json`. There is no default and no "now". The program sends your text as typed; the server judges it.
- **Only two types.** `-t schedule` (the default) and `-t draft`. Anything else is refused by the program, with the usage text, before it asks the server. `posts:status <id> --status draft|schedule` moves an existing post between the two.
- **Short links are on.** `--shortLink` defaults to `true`; turn it off with `--no-shortLink`.
- **Settings are a JSON string**, the same for every channel in `-i`. See [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md).

### Option spellings

Options are handled by yargs, so a multi-word option can be written in camelCase or with dashes: `--startDate` or `--start-date`, `--release-id` or `--releaseId`, `--auth-server` or `--authServer`, `--no-shortLink` or `--no-short-link`.

Watch the short names, they are not the same everywhere:

| Short | `posts:create` | `posts:status` | `integrations:trigger` | `analytics:*` | `media:list` |
| --- | --- | --- | --- | --- | --- |
| `-s` | `--date` | `--status` | | | `--search` |
| `-d` | `--delay` (minutes) | | `--data` (JSON) | `--date` (days back) | |
| `-t` | `--type` | | | | |
| `-p` | | | | | `--page` |

### What the program prints

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

### Things that are quiet, and things that wait

- A **command name the program does not know does nothing and exits `0`**, and an **option it does not know is ignored**. A typo such as `--setting` (instead of `--settings`) or `post:create` does not warn you. Check `--help` when a command seems to have no effect.
- Nothing is retried and nothing is waited out: a rate limit or a server error is shown once and the command ends.
- There is no time limit. A server that never answers is waited for; use your shell's `timeout` when a script must not hang.

### For AI agents: writing commands

1. One `-c` for each part. Never join parts into a single string.
2. A `-m` for each part that has media, in the same order. Use `-m ""` to skip a part.
3. Take channel ids from `integrations:list`, rules and settings from `integrations:settings`, media addresses from `upload`.
4. Always give `-s` with a real date, and `-t draft` until a person has looked at the post.
5. Put settings in `--settings` for one platform per command, or in a body file for several.
6. After the call, read the JSON, not just the exit code: `0` means the server accepted the request.
7. Never print or log the key. If a command fails, show the program's own message; the program does not put the key in its messages.

### Moving an existing script

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

### Quick translation

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

### See also

- [examples/COMMAND_LINE_GUIDE.md](examples/COMMAND_LINE_GUIDE.md): the command line option by option.
- [examples/EXAMPLES.md](examples/EXAMPLES.md): longer examples.
- [FEATURES.md](FEATURES.md) and [QUICK_START.md](QUICK_START.md): the program as a whole.
- [SKILL.md](SKILL.md): the guidance written for AI agents.
- [README.md](README.md): installation and sign-in.
