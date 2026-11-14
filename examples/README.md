# Examples

Post bodies and shell scripts to copy and edit. Everything here uses placeholder values; replace them before you use a file.

## The post bodies (`.json`)

A body file is sent with `ihateposting-agent posts:create --json <file>`. The program sends it exactly as it is, so the file has to hold the whole request:

```json
{
  "type": "draft",
  "date": "2026-12-15T10:00:00Z",
  "shortLink": true,
  "tags": [],
  "posts": [
    {
      "integration": { "id": "x-123" },
      "value": [
        { "content": "Text of the post", "image": [{ "id": "media-123", "path": "https://media.example/uploads/photo.png" }], "delay": 0 }
      ],
      "settings": {}
    }
  ]
}
```

| Key | Meaning |
| --- | --- |
| `type` | `draft` (kept, not published) or `schedule` (queued for the date). All samples are drafts. |
| `date` | When the post is due, ISO 8601 with a zone. Always needed. |
| `shortLink` | `true` to shorten the links in the text, `false` to leave them. |
| `tags` | A list; the samples leave it empty. |
| `posts` | One entry per channel. |
| `posts[].integration.id` | The channel's id, from `ihateposting-agent integrations:list`. |
| `posts[].value` | The parts of the post: the first is the post, the following ones are comments (a thread). |
| `value[].content` | The text of that part. |
| `value[].image` | Files attached to that part, each with an `id` and a `path` (and optionally an `alt` text). Videos go here too. |
| `value[].delay` | Minutes of delay for that part, as `--delay` does for flags. |
| `posts[].settings` | The platform's own settings for that channel. Do not add `__type`. |

| File | What it shows |
| --- | --- |
| [`thread-post.json`](thread-post.json) | A thread of three parts on X, five minutes apart. |
| [`post-with-comments-and-media.json`](post-with-comments-and-media.json) | A post with two pictures (with alt text), a comment with its own picture, and a comment without one. |
| [`multi-platform-with-settings.json`](multi-platform-with-settings.json) | One announcement for X, LinkedIn (a carousel), Instagram, Pinterest and Bluesky, each with its own settings. |
| [`tiktok-video.json`](tiktok-video.json) | A TikTok video with the complete set of required settings. |
| [`youtube-video.json`](youtube-video.json) | A YouTube video with title, visibility, thumbnail and tags. |
| [`pinterest-pin.json`](pinterest-pin.json) | A Pinterest pin with its board. |

What to replace before sending:

- **Channel ids** (`x-123`, `linkedin-123`, ...) with ids from `integrations:list`.
- **Media** (`id` and `path`) with what `upload` printed for your files. `posts:create` uploads nothing; a `path` has to be the address of a file that is already uploaded. The `https://media.example/...` addresses are placeholders, and a server may refuse addresses it did not issue.
- **`board`** (Pinterest) with the numeric id from `integrations:trigger <channel-id> boards`.
- **The date**, and the **text**, which must fit the channel's `maxLength` (see `integrations:settings`).
- **Settings** where your channel's schema says otherwise. The values in the samples are examples of the shape, not recommendations; the TikTok sample uses `SELF_ONLY` (by its name the most private of the four privacy levels) so that a copy does not show a post to everyone.

Each platform has its own rules about pictures and videos (YouTube needs a video, Pinterest and Instagram need an attachment, a LinkedIn carousel needs at least two pictures, and so on). The samples follow them, but read `integrations:settings` for your channels.

## The scripts (`.sh`)

For a Bash shell (on Windows, Git Bash or WSL). Each one starts with `set -euo pipefail`, explains itself in comments, takes ids and addresses from environment variables, and holds no key. None of them deletes anything, and every post they make is a draft.

| File | What it does |
| --- | --- |
| [`basic-usage.sh`](basic-usage.sh) | A first tour: sign-in check, channels, a channel's rules, an optional upload, one draft, the post list. Needs `CHANNEL_ID`. |
| [`draft-from-flags.sh`](draft-from-flags.sh) | Drafts made with flags: a thread, comments with their own pictures, alt text, and settings for X, Pinterest and YouTube. Each example runs only if its variables are set. |
| [`discover-and-draft.sh`](discover-and-draft.sh) | Reads a channel's settings and prints a summary, optionally runs one helper, optionally makes a draft from what you found. |
| [`post-from-body-file.sh`](post-from-body-file.sh) | Sends a body file after checking it: valid JSON, no placeholder ids left, and no `schedule` without `CONFIRM_SCHEDULE=yes`. |

To run one from a clone of the repository:

```bash
cd examples
AGENT="node ../bin/ihateposting-agent.mjs" CHANNEL_ID=<your channel id> bash basic-usage.sh
```

`AGENT` says how to start the program; it defaults to `ihateposting-agent`. Sign in first (`auth:login`) or export `IHATEPOSTING_API_KEY` in your own shell; never write a key into a script. In every script the date comes from `POST_DATE` (a fixed example date by default), so change it to a future date you mean.

The scripts use Node (to read JSON), `sed` and `grep`, which a machine that runs the program usually has.
