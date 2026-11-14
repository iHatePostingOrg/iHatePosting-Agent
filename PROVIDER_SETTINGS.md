# Platform settings

Most platforms have a few options of their own that do not fit in "text plus pictures": a Pinterest board, a YouTube title, a TikTok privacy level. `ihateposting-agent` carries them in one JSON object called **settings**, which travels with each channel's part of a post. This page describes that object for every platform the program works with.

**The server is the authority.** What follows is a reader's guide, written from the settings schemas the app currently publishes. The schema, the rules and the length limit of your own channel come from

```bash
ihateposting-agent integrations:settings <channel-id>
```

Run that first. Its answer can be newer than this page. The page does not repeat the rule texts; where a platform has rules about pictures or videos, only the gist is given, and `output.rules` has the exact words. See [INTEGRATION_SETTINGS_DISCOVERY.md](INTEGRATION_SETTINGS_DISCOVERY.md) for how to read the answer, and [PROVIDER_SETTINGS_SUMMARY.md](PROVIDER_SETTINGS_SUMMARY.md) for one table of everything.

## How to pass settings

### With a flag

`--settings` takes a JSON string. The same object is sent for every channel named with `-i`, so use the flag when every channel in the command is on one platform:

```bash
ihateposting-agent posts:create -i pinterest-123 -c "Ten quick tips" \
  -m "<path from upload>" -s 2026-12-15T10:00:00Z -t draft \
  --settings '{"board":"1234567890","title":"Ten tips"}'
```

The program parses the string itself. It must be valid JSON, and it is sent exactly as you wrote it: nothing is added, removed or renamed. If you leave `--settings` out, no `settings` key is sent at all.

### In a body file

Each entry of `posts` has its own `settings`, so one file can address several platforms. A file is also the easiest way around shell quoting problems:

```json
{
  "type": "draft",
  "date": "2026-12-15T10:00:00Z",
  "shortLink": true,
  "tags": [],
  "posts": [
    { "integration": { "id": "x-123" }, "value": [{ "content": "Hello", "image": [] }], "settings": { "who_can_reply_post": "everyone" } }
  ]
}
```

```bash
ihateposting-agent posts:create --json ./body.json
```

With `--json`, the file is sent as it is and every other post option is ignored, `--settings` included. Put the settings inside the file.

### Later, on a post that has not gone out

```bash
ihateposting-agent posts:settings <post-id> --settings '{"content_posting_method":"DIRECT_POST"}'
```

The object you pass is merged into the post's settings: only the keys you name change. The program's help says it works only for posts that have not been published yet (drafts and scheduled posts). What the server does with a published post is its own answer, shown after `API Error (<status>)`.

### Rules that hold for every platform

- **Do not add a `__type` key.** The server knows each channel's platform and fills it in. The program's help for `posts:settings` says the same. The program itself would send the key if you wrote it; it does not strip anything.
- **Send only the keys the channel's schema lists**, with values of the type it names. Whether the server tolerates an unknown key is its decision (unverified here), and there is no reason to send one.
- **If the JSON does not parse**, the program prints `❌ Failed to parse settings JSON: <why>` and ends with exit code `1` without contacting the server. The words after the colon come from Node and differ a little between Node versions.
- **If the server rejects the content**, the program shows the server's own words after `Request failed: API Error (<status>):` and also ends with `1`.
- **A platform shown below as having no settings** needs none, and `--settings` can be left out. Quoting is your shell's job; see "Common errors" below for the Windows specifics.

## Reading the tables

"Required" means the schema lists the key in its `required` list, so the post is refused without it. Some keys are required only in a mode (for example X's article keys); the notes say so. A "web address" is a string in the form of a URL. Booleans are JSON `true` or `false`; where the schema wants the words `"yes"` or `"no"`, that is stated, because mixing the two up is an easy mistake to make.

Many keys are strings with a small set of allowed values. The values are case sensitive: `public` is not `Public`.

## Platform by platform

### X (`x`)

Every key is optional in the schema, but there are two modes: a normal short post, and a long-form article.

| Field | Type | Allowed values | Notes |
| --- | --- | --- | --- |
| `who_can_reply_post` | string | `everyone`, `following`, `mentionedUsers`, `subscribers`, `verified` | Who may reply. |
| `community` | string | empty, or an address of the form `https://x.com/i/communities/<digits>` | Posts into an X community. |
| `post_type` | string | `post`, `article` | `article` turns the post into a long-form article. The text is then written as HTML with a limited set of tags (the schema's description names `p`, `h1`, `h2`, `h3`, `ul`, `ol`, `li`, `strong`, `u` and `a`). |
| `article_title` | string, not empty | | The article's title. Needed for an article. |
| `article_status` | string | `draft`, `published` | Whether the article waits as a draft on X or goes live straight away. Needed for an article. |
| `article_cover` | media object | | A cover picture, for articles only. An object with `id` and `path` (both required) and optionally `alt` and `thumbnail` (a web address). Use the `id` and `path` that `upload` returned. |
| `made_with_ai` | boolean | | Marks the post as made with AI. |
| `paid_partnership` | boolean | | Marks the post as a paid partnership. |

What the rules add: a post carries up to four pictures, or one video, or nothing at all. In an article, pictures are placed inside the HTML text with an `img` tag whose `src` is an address from your media library, so upload them first. Depending on how the server is configured, the rules text may carry one more sentence saying that links are removed from posts; read `output.rules` rather than assuming.

```bash
--settings '{"who_can_reply_post":"following"}'
--settings '{"community":"https://x.com/i/communities/1234567890","who_can_reply_post":"everyone"}'
--settings '{"post_type":"article","article_title":"Why we moved","article_status":"draft"}'
```

Mistakes to avoid: an `article_status` of `published` makes the article live as soon as the post runs, so make a draft first. `community` must be empty or match the address pattern exactly, with nothing after the digits.

### LinkedIn (`linkedin`) and LinkedIn Page (`linkedin-page`)

Both take the same optional keys.

| Field | Type | Notes |
| --- | --- | --- |
| `post_as_images_carousel` | boolean | Publishes the pictures as a carousel. |
| `carousel_name` | string | A name for the carousel. |

What the rules add: with a video, the post holds that one attachment and nothing else. A carousel needs at least two attachments, and they must all be pictures. Both platforms have the helper `mention`, which finds a company page to tag; see [INTEGRATION_TOOLS_WORKFLOW.md](INTEGRATION_TOOLS_WORKFLOW.md).

```bash
--settings '{"post_as_images_carousel":true,"carousel_name":"Launch photos"}'
```

A carousel with one picture, or with a video in the mix, goes against the rules text above, and the server may refuse it.

### Instagram (`instagram`)

| Field | Type | Allowed values | Notes |
| --- | --- | --- | --- |
| `post_type` | string | `post`, `story` | **Required.** |
| `collaborators` | list of objects | each has a required string `label` | Optional. Accounts to invite as collaborators. |
| `graduation_strategy` | string | `MANUAL`, `SS_PERFORMANCE` | Optional. |
| `is_trial_reel` | | | Listed with no type and no rules in the schema. Read `integrations:settings` before using it (unverified what it accepts). |

What the rules add: a post needs at least one attachment; a story takes only one picture.

```bash
--settings '{"post_type":"post","collaborators":[{"label":"example_account"}]}'
--settings '{"post_type":"story"}'
```

### TikTok (`tiktok`)

Eight keys are required, so a complete object is always sent, even for a quick post.

| Field | Type | Allowed values | Notes |
| --- | --- | --- | --- |
| `content_posting_method` | string | `DIRECT_POST`, `UPLOAD` | **Required.** `DIRECT_POST` publishes to the account. `UPLOAD` does not publish: it hands the media to the TikTok app of the account's owner, who must finish and publish it by hand. |
| `privacy_level` | string | `PUBLIC_TO_EVERYONE`, `MUTUAL_FOLLOW_FRIENDS`, `FOLLOWER_OF_CREATOR`, `SELF_ONLY` | **Required.** Who can see the post. |
| `duet` | boolean | | **Required.** Allows duets. Applies to videos only. |
| `stitch` | boolean | | **Required.** Allows stitches. Applies to videos only. |
| `comment` | boolean | | **Required.** Allows comments. |
| `autoAddMusic` | string | `"yes"`, `"no"` | **Required.** A word, not a boolean. Applies to photo posts: lets TikTok add music. |
| `brand_content_toggle` | boolean | | **Required.** One of TikTok's two branded-content switches (the schema says no more than the key's name). |
| `brand_organic_toggle` | boolean | | **Required.** The other branded-content switch. |
| `title` | string | up to 90 characters | Optional. The post's title. |
| `video_made_with_ai` | boolean | | Optional. Labels a video as AI generated. Applies to videos only. |

How the pieces interact, in short:

- **Method first.** Except for `title`, a key counts only with `DIRECT_POST`. With `UPLOAD`, TikTok keeps the title and the text and, according to the rules text, drops the rest without an error.
- **Media second.** `duet`, `stitch` and `video_made_with_ai` mean something only for a video. `autoAddMusic` means something only for photos. Because all eight required keys must still be present, send the whole set and let the irrelevant ones be `false` or `"no"`.
- **`UPLOAD` is a hand-off.** The rules say the media waits in the person's TikTok app for a limited time (24 hours, according to the rules text) and is discarded if nobody finishes it. Use it only when a person really means to edit the post in the app.
- TikTok cannot take a post without an attachment: one video, or one or more pictures.

```bash
--settings '{"content_posting_method":"DIRECT_POST","privacy_level":"SELF_ONLY","duet":false,"stitch":false,"comment":true,"autoAddMusic":"no","brand_content_toggle":false,"brand_organic_toggle":false}'
```

A body file for it is in [examples/tiktok-video.json](examples/tiktok-video.json). To flip a draft from hand-off to direct publishing later:

```bash
ihateposting-agent posts:settings <post-id> --settings '{"content_posting_method":"DIRECT_POST"}'
```

### YouTube (`youtube`)

| Field | Type | Allowed values / limits | Notes |
| --- | --- | --- | --- |
| `title` | string | 1 to 100 characters | **Required.** The video's title. The post's text becomes its description. |
| `type` | string | `public`, `private`, `unlisted` | **Required.** Visibility. |
| `selfDeclaredMadeForKids` | string | `"yes"`, `"no"` | Optional. A word, not a boolean. |
| `thumbnail` | media object | | Optional. `id` and `path` (required) from an upload, optionally `alt` and `thumbnail` (a web address). |
| `tags` | list of objects | each has `value` and `label`, both strings and both required | Optional. For example `[{"value":"tutorial","label":"Tutorial"}]`. |

What the rules add: the post must carry a video, and it cannot be empty.

```bash
--settings '{"title":"My first video","type":"private","tags":[{"value":"tutorial","label":"Tutorial"}]}'
```

A body file is in [examples/youtube-video.json](examples/youtube-video.json). The schema has no key for a playlist; do not invent one.

### Pinterest (`pinterest`)

| Field | Type | Limits | Notes |
| --- | --- | --- | --- |
| `board` | string | digits only, not empty | **Required.** The board's id, never its name. Get it with the helper `boards`. |
| `title` | string | up to 100 characters | The pin's title. |
| `link` | web address | | Where the pin leads. |
| `dominant_color` | string | | A colour for the pin. The schema gives no format (unverified). |

What the rules add: a pin needs at least one picture. A video pin takes two attachments, the video and a cover picture, and only one video. A pin made of pictures may hold up to five.

```bash
--settings '{"board":"1234567890","title":"Ten tips","link":"https://example.com/tips"}'
```

A body file is in [examples/pinterest-pin.json](examples/pinterest-pin.json). The board id is a number written as a string; a board name does not match the digits-only pattern.

### Facebook (`facebook`)

All optional.

| Field | Type | Allowed values | Notes |
| --- | --- | --- | --- |
| `post_type` | string | `post`, `story` | A story needs at least one picture or video, and each attachment becomes a story of its own. |
| `url` | web address | | A link to show as a preview card. It works for text-only posts. A link written inside the text alone is not turned into a card. |
| `title` | string | | The title of a video post (not for stories). |
| `text_format_preset_id` | string | | An identifier of a text format preset. The schema gives no further rules. |

```bash
--settings '{"post_type":"post","url":"https://example.com/article"}'
--settings '{"post_type":"story"}'
```

### Tumblr (`tumblr`)

All optional.

| Field | Type | Limits | Notes |
| --- | --- | --- | --- |
| `title` | string | 1 to 4096 characters | The post's title. |
| `link` | string | empty, or a web address | A link for the post. |
| `sourceUrl` | string | empty, or a web address | Where the content came from. |
| `tags` | string | up to 4096 characters | One string. How several tags are separated is not stated by the schema (unverified). |

```bash
--settings '{"title":"Release notes","link":"https://example.com/notes","tags":"news"}'
```

`tags` is typed as a single string, so a JSON array does not match the schema.

### Google Business (`gmb`)

All optional.

| Field | Type | Allowed values | Notes |
| --- | --- | --- | --- |
| `topicType` | string | `STANDARD`, `EVENT`, `OFFER` | The kind of post: an update, an event or an offer. |
| `callToActionType` | string | `NONE`, `BOOK`, `ORDER`, `SHOP`, `LEARN_MORE`, `SIGN_UP`, `GET_OFFER`, `CALL` | The button on the post. |
| `callToActionUrl` | web address | | Where the button leads. |
| `eventTitle` | string | | For events. |
| `eventStartDate`, `eventEndDate` | string | | For events. The schema does not state a date format (unverified). |
| `eventStartTime`, `eventEndTime` | string | | For events. The schema does not state a time format (unverified). |
| `offerCouponCode` | string | | For offers. |
| `offerRedeemUrl` | web address | | For offers. |
| `offerTerms` | string | | For offers. |

What the rules add: a post holds text and, optionally, one picture. The three kinds are updates, events and offers.

```bash
--settings '{"topicType":"STANDARD","callToActionType":"LEARN_MORE","callToActionUrl":"https://example.com/learn"}'
```

### Slack (`slack`) and Discord (`discord`)

| Field | Type | Notes |
| --- | --- | --- |
| `channel` | string, not empty | **Required.** The id of the Slack or Discord channel to post in. Get ids with the helper `channels` (see [INTEGRATION_TOOLS_WORKFLOW.md](INTEGRATION_TOOLS_WORKFLOW.md)). |

```bash
--settings '{"channel":"channel-123"}'
```

Do not confuse the two ids. `-i` takes the id of your iHatePosting channel (the connected workspace or server); `channel` inside the settings is the id of a room inside Slack or Discord.

### Platforms without settings: Bluesky, Mastodon, Telegram, Threads

Bluesky (`bluesky`), Mastodon (`mastodon`), Telegram (`telegram`) and Threads (`threads`) take no settings. The answer of `integrations:settings` carries a short sentence in place of a schema, and `--settings` can be left out. Bluesky has rules about how many attachments a post may hold: one video, or up to four pictures, or none. Mastodon, Telegram and Threads have no rules text in the schemas the app publishes either.

```bash
ihateposting-agent posts:create -i bluesky-123 -c "Hello from the command line" -s 2026-12-15T10:00:00Z -t draft
```

## Body files for the bigger cases

When a settings object has nesting (lists, media objects) or when the text itself is long, a body file is easier to write and to review than a one-line flag.

### A YouTube video

```json
{
  "type": "draft",
  "date": "2026-12-15T10:00:00Z",
  "shortLink": true,
  "tags": [],
  "posts": [
    {
      "integration": { "id": "youtube-123" },
      "value": [
        {
          "content": "A walk through the new checkout.\n\n00:00 Start\n02:10 Payment step",
          "image": [{ "id": "media-123", "path": "https://media.example/uploads/checkout.mp4" }],
          "delay": 0
        }
      ],
      "settings": {
        "title": "The new checkout, step by step",
        "type": "unlisted",
        "selfDeclaredMadeForKids": "no",
        "thumbnail": { "id": "media-124", "path": "https://media.example/uploads/checkout-cover.png" },
        "tags": [
          { "value": "checkout", "label": "Checkout" },
          { "value": "tutorial", "label": "Tutorial" }
        ]
      }
    }
  ]
}
```

```bash
ihateposting-agent posts:create --json ./youtube-video.json
```

The `https://media.example/...` addresses are placeholders. Use the `id` and `path` that `upload` printed for your own files.

### A long-form article on X

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
        {
          "content": "<h1>Why we moved to weekly releases</h1><p>Smaller releases mean smaller surprises.</p><ul><li>Faster fixes</li><li>Less risk per release</li></ul>",
          "image": [],
          "delay": 0
        }
      ],
      "settings": {
        "post_type": "article",
        "article_title": "Why we moved to weekly releases",
        "article_status": "draft"
      }
    }
  ]
}
```

Complete files for [Pinterest](examples/pinterest-pin.json) and [TikTok](examples/tiktok-video.json) are in `examples/`; the TikTok one uses `SELF_ONLY`, so that a copy does not show a post to everyone.

## Several platforms, different settings

One body file can address as many channels as you like, each with its own settings. This sends one announcement to X, LinkedIn and Pinterest:

```json
{
  "type": "draft",
  "date": "2026-12-15T10:00:00Z",
  "shortLink": true,
  "tags": [],
  "posts": [
    {
      "integration": { "id": "x-123" },
      "value": [{ "content": "Our spring catalogue is out.", "image": [], "delay": 0 }],
      "settings": { "who_can_reply_post": "following" }
    },
    {
      "integration": { "id": "linkedin-123" },
      "value": [
        {
          "content": "Our spring catalogue is out. Three pages to start with.",
          "image": [
            { "id": "media-124", "path": "https://media.example/uploads/page-1.png" },
            { "id": "media-125", "path": "https://media.example/uploads/page-2.png" }
          ],
          "delay": 0
        }
      ],
      "settings": { "post_as_images_carousel": true, "carousel_name": "Spring catalogue" }
    },
    {
      "integration": { "id": "pinterest-123" },
      "value": [
        {
          "content": "Spring catalogue: cover and first pages.",
          "image": [{ "id": "media-123", "path": "https://media.example/uploads/cover.png" }],
          "delay": 0
        }
      ],
      "settings": { "board": "1234567890", "title": "Spring catalogue" }
    }
  ]
}
```

A larger version with five platforms is in [examples/multi-platform-with-settings.json](examples/multi-platform-with-settings.json). Each entry can have its own text and its own pictures, which matters because the platforms' rules differ: the LinkedIn entry above carries two pictures for its carousel, the X entry none.

If you prefer flags, run one command per platform, each with its own `--settings`:

```bash
ihateposting-agent posts:create -i x-123 -c "Our spring catalogue is out." -s 2026-12-15T10:00:00Z -t draft \
  --settings '{"who_can_reply_post":"following"}'

ihateposting-agent posts:create -i pinterest-123 -c "Spring catalogue: cover and first pages." \
  -m "<path from upload>" -s 2026-12-15T10:00:00Z -t draft \
  --settings '{"board":"1234567890","title":"Spring catalogue"}'
```

## Tips

1. **Read before you write.** Run `integrations:settings <channel-id>` once per channel and keep `output.rules`, `output.maxLength`, the schema and the helper names with your script.
2. **Use a body file for anything nested.** Lists, media objects and long text are easier to check in a file than in a quoted string.
3. **Start with a draft.** `-t draft` keeps the post from being queued, so a mistake costs nothing. Schedule it afterwards with `posts:status <post-id> --status schedule`. Whether a draft is validated as strictly as a scheduled post is the server's choice (unverified).
4. **Fill every required key.** A missing one is refused by the server. TikTok has eight of them, Instagram one, Pinterest one, YouTube two, Slack and Discord one.
5. **Words are words, booleans are booleans.** `autoAddMusic` and `selfDeclaredMadeForKids` take `"yes"` or `"no"` in quotes; `duet`, `comment` and the other switches take `true` or `false` without quotes.
6. **Use ids the platform gave you.** A Pinterest `board` and a Slack or Discord `channel` come from `integrations:trigger`, never from memory.
7. **One command, one platform, when you use flags.** The same `--settings` goes to every channel in `-i`.
8. **Keep the text within `maxLength`**, and change settings later with `posts:settings` instead of recreating the post.

## Finding a channel's platform (identifier)

Each entry of `integrations:list` has an `id`, a `name` and an `identifier`. The `identifier` is the platform's type, and it tells you which section above applies:

```bash
ihateposting-agent integrations:list
```

```json
[
  { "id": "pinterest-123", "name": "Tidy Shelves", "identifier": "pinterest", "disabled": false },
  { "id": "linkedin-456", "name": "Example Company", "identifier": "linkedin-page", "disabled": false }
]
```

(The entries have more fields; these are the ones you need here. The program prints a header line before the list. Values are placeholders.)

The identifiers are the ones in the headings above: `x`, `linkedin`, `linkedin-page`, `instagram`, `tiktok`, `youtube`, `pinterest`, `facebook`, `tumblr`, `gmb`, `slack`, `discord`, `bluesky`, `mastodon`, `telegram` and `threads`. [PROVIDER_SETTINGS_SUMMARY.md](PROVIDER_SETTINGS_SUMMARY.md) lists them next to their platforms.

The settings never carry the identifier; the server reads it from the channel. It matters to you only to pick the right section of this page.

## Common errors

| What you see | What it means and what to do |
| --- | --- |
| `❌ Failed to parse settings JSON: ...` | The string after `--settings` is not valid JSON. Usual causes: single quotes inside the JSON (JSON wants double quotes), a trailing comma, or a shell that removed the double quotes. Nothing was sent to the server. |
| `❌ Failed to parse JSON file: ...` | The file given to `--json` is not valid JSON. |
| `❌ JSON file not found: <path>` | The path given to `--json` is wrong, relative to the folder you ran the command in. |
| `Either --content or --json is required`, `--integrations is required when not using --json`, `--date is required when not using --json` | The usage check of `posts:create`, printed with the command's help on standard error, exit code `1`. Nothing was sent. |
| `Invalid values: Argument: type, Given: "now", ...` | `-t` accepts only `schedule` or `draft`. |
| `❌ Failed to create post: Request failed: API Error (400): ...` | The server refused the content. Read its message list: it normally says what is wrong. Compare with the schema from `integrations:settings`. |
| `❌ Failed to update post settings: ...` | `posts:settings` was refused, for instance because the post is not in a state that takes new settings. The server's words follow. |
| The post is accepted but looks wrong on the platform | The channel's rules (`output.rules`) probably say something about the media or the mode you picked. For TikTok, check that `content_posting_method` is `DIRECT_POST`. |
| One `--settings` for channels of two platforms | It cannot suit both. Make one command per platform, or use a body file. |
| `--settings` seems to be ignored | Either `--json` is also given (the file wins and the other options are ignored), or the option is misspelled; the program does not warn about an option it does not know. |
| A `-p <platform>` flag in an old script has no effect | `posts:create` has no such flag, so it is ignored. The platform comes from the channel id. |

### Quoting on Windows

The same JSON that works in Bash can arrive mangled in other shells. These results come from a check on one Windows machine with a small program that printed the arguments it received:

- **PowerShell 7** passes a single-quoted string such as `'{"board":"1234567890","title":"Ten tips"}'` through unchanged.
- **`cmd`** accepts the JSON inside double quotes with each inner quote written as `\"`:

  ```bat
  ihateposting-agent posts:create -i pinterest-123 -c "Ten quick tips" -s 2026-12-15T10:00:00Z -t draft --settings "{\"board\":\"1234567890\",\"title\":\"Ten tips\"}"
  ```

- **Windows PowerShell 5.1** is the unreliable one. It removes the double quotes inside the string, which produces exactly the "Failed to parse settings JSON" case, and it splits an argument at spaces when the argument also holds quotes. Writing each inner quote as `\"` (for example with `-replace '"', '\"'`) helps only when the JSON holds no spaces.

If you are on Windows PowerShell 5.1, install PowerShell 7 or use a body file. A body file does not depend on the shell at all, so when in doubt, use one.

## See also

- [INTEGRATION_SETTINGS_DISCOVERY.md](INTEGRATION_SETTINGS_DISCOVERY.md): how `integrations:settings` answers and how to read the schema.
- [INTEGRATION_TOOLS_WORKFLOW.md](INTEGRATION_TOOLS_WORKFLOW.md): helpers that find boards, rooms and company pages.
- [PROVIDER_SETTINGS_SUMMARY.md](PROVIDER_SETTINGS_SUMMARY.md): every platform in one table.
- [SUPPORTED_FILE_TYPES.md](SUPPORTED_FILE_TYPES.md): uploading the pictures and videos the settings refer to.
- [examples/README.md](examples/README.md): the ready body files, one per case.
- [examples/COMMAND_LINE_GUIDE.md](examples/COMMAND_LINE_GUIDE.md) and [examples/EXAMPLES.md](examples/EXAMPLES.md): more command lines.
- [SKILL.md](SKILL.md): the guidance written for AI agents.
