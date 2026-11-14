# Examples, explained

A walk through the sample files in this folder, and some scenarios of their own. [README.md](README.md) is the short index of the folder; [COMMAND_LINE_GUIDE.md](COMMAND_LINE_GUIDE.md) explains each command. This page explains what each sample is for, how to send it, what to change first and what you should see.

Three rules hold for everything here:

- **Placeholders.** `x-123`, `media-123` and `https://media.example/...` are not real. Replace every one before you send a file.
- **Drafts.** Every sample has `"type": "draft"`, and every script sends drafts. A draft is kept but not published.
- **Nothing signs in for you.** Sign in first (`ihateposting-agent auth:login`) or export `IHATEPOSTING_API_KEY` in your own shell, and check with `ihateposting-agent auth:status`. From a clone that is not linked, write `node bin/ihateposting-agent.mjs` where the examples say `ihateposting-agent`.

## What a body file looks like

A body file is the whole request, and `posts:create --json <file>` sends it exactly as it is: nothing is added and no other post option is applied.

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
        { "content": "The post", "image": [], "delay": 0 },
        { "content": "A comment", "image": [], "delay": 5 }
      ],
      "settings": {}
    }
  ]
}
```

| Body field | The flag that makes it | Meaning |
| --- | --- | --- |
| `type` | `-t` | `draft` or `schedule` |
| `date` | `-s` | When the post is due, ISO 8601 with a zone |
| `shortLink` | `--shortLink` / `--no-shortLink` | Shorten links in the text |
| `posts[]` | `-i` (one entry per id) | One entry per channel |
| `posts[].integration.id` | `-i` | The channel's id from `integrations:list` |
| `posts[].value[]` | each `-c` | The post, then its comments |
| `value[].content` | `-c` | The text of that part |
| `value[].image[]` | `-m`, `--alt` | Files for that part: `id`, `path` and optionally `alt` |
| `value[].delay` | `-d` | Minutes of delay for that part |
| `posts[].settings` | `--settings` | The platform's own settings for that channel |

Two things only a file can do: give each channel its own text and settings, and give each part its own delay. (With flags, one call holds one set of settings and one delay.)

Never put `__type` in `settings`; the server adds it. The program also does not add `"creationMethod": "CLI"` to a file, though it does to a post made from flags.

### Before you send a sample

1. Replace the channel ids with ids from `ihateposting-agent integrations:list`.
2. Upload the pictures and videos (`ihateposting-agent upload ./photo.png`) and put what comes back in `id` and `path`. `posts:create` uploads nothing.
3. Read the channel's rules (`integrations:settings <id>`) and keep the text under its `maxLength`.
4. Change `date` to a time you mean.
5. Fill in what the platform needs: a Pinterest board, a TikTok privacy level, a YouTube title.

## The sample bodies

### thread-post.json: a thread on X

[thread-post.json](thread-post.json) is one X channel and three parts, five minutes apart, with `who_can_reply_post` set to `everyone`.

```bash
ihateposting-agent posts:create --json thread-post.json
```

The same thing from flags:

```bash
ihateposting-agent posts:create -i "x-123" -s "2026-12-15T10:00:00Z" -t draft -d 5 \
  --settings '{"who_can_reply_post":"everyone"}' \
  -c "1/3 We moved to weekly releases. Here is why." \
  -c "2/3 Smaller releases mean smaller surprises, and quicker fixes when there is one." \
  -c "3/3 Next up: how we test each release before it goes out."
```

One difference: `-d 5` gives the delay to every part, the first included, while the file gives the first part `0`.

### post-with-comments-and-media.json: pictures in a post and in a comment

[post-with-comments-and-media.json](post-with-comments-and-media.json) is a post with two pictures that have alt texts, a first comment with one picture, and a second comment with none.

Replace the three `path` addresses with what `upload` printed for your pictures. Alt texts are optional; leave `alt` out for a picture that needs none. This is the sample to copy when an alt text contains a comma, because `--alt` on the command line splits at commas and a file does not.

```bash
ihateposting-agent posts:create --json post-with-comments-and-media.json
```

### multi-platform-with-settings.json: one announcement, five channels

[multi-platform-with-settings.json](multi-platform-with-settings.json) sends one announcement to X, LinkedIn, Instagram, Pinterest and Bluesky in a single request. Each channel gets its own entry in `posts`, so each has its own text, pictures and settings:

| Channel | What differs |
| --- | --- |
| X (`x-123`) | One picture, `who_can_reply_post: "following"` |
| LinkedIn (`linkedin-123`) | Three pictures posted as a carousel (`post_as_images_carousel`, `carousel_name`) |
| Instagram (`instagram-123`) | One picture, `post_type: "post"` |
| Pinterest (`pinterest-123`) | A pin with its `board`, a `title` and a `link` |
| Bluesky (`bluesky-123`) | One picture, no settings |

Flags cannot do this in one call, because `--settings` is one object for every channel in the call. To use the file you need all five channels connected, or you delete the entries you have no channel for.

### tiktok-video.json: a TikTok video

[tiktok-video.json](tiktok-video.json) carries the complete set of settings TikTok asks for: a title, the posting method, the privacy level, the duet, stitch and comment switches, music, brand toggles and the AI disclosure. Upload the video first and put its `id` and `path` in `image` (videos go in the same list).

Two settings deserve a look before you send it:

- `privacy_level` is `SELF_ONLY`, which by its name is the most private of TikTok's levels, so a copy of the sample does not show a post to everyone.
- `content_posting_method` is `DIRECT_POST`, which publishes the video itself once the post is scheduled. The other method, `UPLOAD`, only hands the video to the account's inbox in the TikTok app for a person to finish. Change a waiting post's method without editing the file:

```bash
ihateposting-agent posts:settings post-123 --settings '{"content_posting_method":"UPLOAD"}'
```

### youtube-video.json: a YouTube video

[youtube-video.json](youtube-video.json) has a title, a visibility (`type`: `private` here), the made-for-kids answer, a thumbnail picture and two tags written as `{ "value": ..., "label": ... }`. The post text goes with the video; `\n\n` in the JSON is a blank line. Upload the video and the thumbnail first. Use `private` until you have looked at the result.

### pinterest-pin.json: a pin

[pinterest-pin.json](pinterest-pin.json) is a pin with a picture, a description, a title and a link. Pinterest needs a **board**, and it is the numeric id, not the board's name. Ask the channel for its boards:

```bash
ihateposting-agent integrations:trigger pinterest-123 boards
```

Copy the `value` of the board you want into `settings.board`.

## The scripts

These are Bash scripts (on Windows, Git Bash or WSL). They are not marked executable in git, so start them with `bash`. Each one starts with `set -euo pipefail`, explains itself in comments, reads ids from environment variables, holds no key, deletes nothing and makes drafts only. `AGENT` says how to start the program; it defaults to `ihateposting-agent`. From a clone:

```bash
cd examples
AGENT="node ../bin/ihateposting-agent.mjs" CHANNEL_ID=x-123 bash basic-usage.sh
```

The program's path in `AGENT` must not contain spaces, because the scripts split it into words.

### basic-usage.sh: a first tour

[basic-usage.sh](basic-usage.sh) checks the sign-in, lists the channels, prints one channel's rules, optionally uploads one picture and makes one draft. It needs `CHANNEL_ID`, and takes `POST_DATE`, `POST_TEXT` and `MEDIA_FILE` if you set them.

```bash
CHANNEL_ID=x-123 bash basic-usage.sh
CHANNEL_ID=x-123 MEDIA_FILE=./photo.png POST_TEXT="Look at this" bash basic-usage.sh
```

You see six numbered parts, each with the command's own output under it:

```text
== 1. Who is signed in? ==
== 2. Your channels ==
== 3. The rules and settings of channel x-123 ==
== 4. Upload ./photo.png ==          (only when MEDIA_FILE is set)
== 5. Make a draft ==
== 6. Posts from 30 days ago to 30 days ahead ==
```

Without `CHANNEL_ID` it stops at once with a message naming the variable.

### draft-from-flags.sh: drafts made with flags

[draft-from-flags.sh](draft-from-flags.sh) runs one block of examples for each group of variables you set: a thread and a post with a comment (X), pictures with alt text (X plus `MEDIA_URL_1` and `MEDIA_URL_2`), a pin (Pinterest with its board) and a video (YouTube with `VIDEO_URL`).

```bash
X_CHANNEL_ID=x-123 bash draft-from-flags.sh
X_CHANNEL_ID=x-123 MEDIA_URL_1=https://media.example/uploads/a.png MEDIA_URL_2=https://media.example/uploads/b.png bash draft-from-flags.sh
```

With only `X_CHANNEL_ID` it makes the thread and the replies-setting draft. With nothing set it makes no draft, says which variables it wants, and ends with exit code `1`.

### discover-and-draft.sh: look first, then write

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

### post-from-body-file.sh: send a body file with guard rails

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

## More scenarios

### A week of drafts from a list

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

### Different words for different channels

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

### Checking a body file before you send it

```bash
node -e 'const b = JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8")); console.log(b.type, b.date, b.posts.length + " channel(s)")' thread-post.json
```

For the sample this prints `draft 2026-12-15T10:00:00Z 1 channel(s)`. A file that is not valid JSON makes Node stop with a message that names the position.

### Upload a video and wait until it is ready

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

### Pick a board, then pin

```bash
ihateposting-agent integrations:trigger pinterest-123 boards
ihateposting-agent posts:create -c "Ten tips for tidy shelves" -m "https://media.example/uploads/shelves.png" \
  --settings '{"board":"1234567890","title":"Tidy shelves"}' -s "2030-01-01T09:00:00Z" -t draft -i "pinterest-123"
```

Slack and Discord work the same way with `integrations:trigger <id> channels`: the helper lists the rooms, and the channel's settings schema (`integrations:settings`) says which setting takes the id of the one you choose.

### Review the drafts and schedule one

```bash
ihateposting-agent posts:list
ihateposting-agent posts:status post-123 --status schedule
```

`posts:list` shows the window from 30 days ago to 30 days ahead; widen it with `--startDate` and `--endDate` for drafts dated further out. There is no command that edits a post's text or date. To change those, check the id twice, run `ihateposting-agent posts:delete post-123` (it cannot be undone from here) and make the post again. To stop a queued post without losing it, use `posts:status post-123 --status draft` instead.

### A weekly snapshot of analytics

```bash
for ID in x-123 bluesky-123 pinterest-123; do
  ihateposting-agent analytics:platform "$ID" -d 7 | tail -n +2 > "analytics-$ID.json"
done
```

`tail -n +2` drops the header line so each file holds clean JSON.

### A post whose analytics are "missing"

```bash
ihateposting-agent analytics:post post-123            # {"missing": true}
ihateposting-agent posts:missing post-123             # the platform's recent content
ihateposting-agent posts:connect post-123 --release-id "7321456789012345678"
ihateposting-agent analytics:post post-123            # now it has numbers
```

## When a sample fails

| What you see | What to check |
| --- | --- |
| `❌ JSON file not found: ...` | The path after `--json` is wrong. Run the command from the folder that holds the file. |
| `❌ Failed to parse JSON file: ...` | The file is not valid JSON, often a trailing comma. |
| `API Error (400)` with a list of messages | The server's words say what is wrong; a missing setting and a text over the limit are the usual causes. |
| `API Error (401)` | You are not signed in, or the key is wrong. `auth:status` tells which. |
| A post is created but a setting seems ignored | A setting that does not apply to the channel may be dropped without an error. Compare with `integrations:settings`. |
| `bash: ./basic-usage.sh: Permission denied` | Start the script with `bash basic-usage.sh`. |

## Tips for agents working from these samples

1. Copy a sample, change it, validate it, then send it. Never send a sample untouched.
2. Keep `type` as `draft` until a person has seen the result.
3. Generate unique, short `id` values for media entries; the server's `upload` answer already gives real ones.
4. Check every channel id against `integrations:list` before sending.
5. Remember that the first part is the post and the following parts are comments.

## Further reading

- [COMMAND_LINE_GUIDE.md](COMMAND_LINE_GUIDE.md) for every command and its output.
- [../PROVIDER_SETTINGS.md](../PROVIDER_SETTINGS.md) for the settings of each platform, and [../PROVIDER_SETTINGS_SUMMARY.md](../PROVIDER_SETTINGS_SUMMARY.md) for the short table.
- [../INTEGRATION_SETTINGS_DISCOVERY.md](../INTEGRATION_SETTINGS_DISCOVERY.md) and [../INTEGRATION_TOOLS_WORKFLOW.md](../INTEGRATION_TOOLS_WORKFLOW.md) for reading a channel's rules and running its helpers.
- [../SKILL.md](../SKILL.md) for the order an agent follows.
