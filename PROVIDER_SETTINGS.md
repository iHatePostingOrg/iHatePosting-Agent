# Provider-Specific Settings

The iHatePosting CLI supports platform-specific settings for each integration. Different platforms have different options and requirements.

## How to Use Provider Settings

### Method 1: Command Line Flags

```bash
ihateposting-agent posts:create \
  -c "Your content" \
  -s "2024-12-31T12:00:00Z" \
  --settings '<json-settings>' \
  -i "integration-id"
```

### Method 2: JSON File

```bash
ihateposting-agent posts:create --json post-with-settings.json
```

In the JSON file, specify settings per integration:

```json
{
  "type": "schedule",
  "date": "2024-01-15T12:00:00Z",
  "shortLink": true,
  "tags": [],
  "posts": [{
    "integration": { "id": "pinterest-123" },
    "value": [{ "content": "Post content", "image": [{ "id": "media-123", "path": "pin.jpg" }] }],
    "settings": {
      "board": "1234567890",
      "title": "My Post Title"
    }
  }]
}
```

## Supported Platforms & Settings

### YouTube (`youtube`)

**Settings:**
- `title` (required): Video title (1-100 characters)
- `type` (required): `"public"`, `"private"`, or `"unlisted"`
- `selfDeclaredMadeForKids` (optional): `"yes"` or `"no"`
- `thumbnail` (optional): Thumbnail media object (`id` and `path` from an upload)
- `tags` (optional): Array of tag objects with `value` and `label`

**Example:**
```bash
ihateposting-agent posts:create \
  -c "Video description here" \
  -m "video.mp4" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{
    "title": "My Awesome Video",
    "type": "public",
    "selfDeclaredMadeForKids": "no",
    "tags": [
      {"value": "tech", "label": "Tech"},
      {"value": "tutorial", "label": "Tutorial"}
    ]
  }' \
  -i "youtube-123"
```

### X / Twitter (`x`)

**Settings:**
- `community` (optional): X community URL (format: `https://x.com/i/communities/1234567890`)
- `who_can_reply_post` (optional): Who can reply
  - `"everyone"` - Anyone can reply
  - `"following"` - Only people you follow
  - `"mentionedUsers"` - Only mentioned users
  - `"subscribers"` - Only subscribers
  - `"verified"` - Only verified users
- `post_type` (optional): `"post"` or `"article"` — `"article"` turns the post into a long-form article, written as HTML with a limited set of tags (`integrations:settings` names them)
- `article_title` (optional): The article's title, not empty — needed for an article
- `article_status` (optional): `"draft"` or `"published"` — needed for an article; `"published"` makes the article live as soon as the post runs
- `article_cover` (optional): Cover picture, for articles only: a media object with `id` and `path` from an upload
- `made_with_ai` (optional): Boolean, marks the post as made with AI
- `paid_partnership` (optional): Boolean, marks the post as a paid partnership

**Example:**
```bash
ihateposting-agent posts:create \
  -c "Tweet content" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{
    "who_can_reply_post": "everyone"
  }' \
  -i "x-123"
```

**With Community:**
```bash
ihateposting-agent posts:create \
  -c "Community tweet" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{
    "community": "https://x.com/i/communities/1234567890",
    "who_can_reply_post": "everyone"
  }' \
  -i "x-123"
```

### LinkedIn (`linkedin`)

**Settings:**
- `post_as_images_carousel` (boolean): Post as image carousel (needs at least two pictures, and nothing but pictures)
- `carousel_name` (optional): Carousel name if posting as carousel

A LinkedIn Page is a channel of its own (`linkedin-page`) and takes the same settings.

**Example:**
```bash
ihateposting-agent posts:create \
  -c "LinkedIn post" \
  -m "img1.jpg,img2.jpg,img3.jpg" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{
    "post_as_images_carousel": true,
    "carousel_name": "Product Showcase"
  }' \
  -i "linkedin-123"
```

### Instagram (`instagram`)

**Settings:**
- `post_type` (required): `"post"` or `"story"`
- `is_trial_reel` (optional): Listed in the schema with no type and no rules; read `integrations:settings` before using it
- `graduation_strategy` (optional): `"MANUAL"` or `"SS_PERFORMANCE"`
- `collaborators` (optional): Array of collaborator objects with `label`

**Example:**
```bash
ihateposting-agent posts:create \
  -c "Instagram post" \
  -m "photo.jpg" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{
    "post_type": "post"
  }' \
  -i "instagram-123"
```

**Story Example:**
```bash
ihateposting-agent posts:create \
  -c "Story content" \
  -m "story-image.jpg" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{
    "post_type": "story"
  }' \
  -i "instagram-123"
```

### TikTok (`tiktok`)

**Settings:**

Two independent axes decide whether a TikTok setting applies. A setting sent on the wrong axis is **silently discarded** — the API still reports success:

1. **Posting method** — every setting below except `title` requires `content_posting_method: "DIRECT_POST"`. With `"UPLOAD"`, TikTok keeps only the title/content and discards everything else.
2. **Media type** — `duet`, `stitch`, and `video_made_with_ai` apply to **video posts only**; `autoAddMusic` applies to **photo posts only**; the rest apply to both.

The eight settings marked (required) below must always be sent, even where the axes above say a setting is ignored: for an ignored switch send `false`, or `"no"` for `autoAddMusic`.

- `title` (optional): Video title (max 90 characters) — the only setting that survives `"UPLOAD"`
- `privacy_level` (required, DIRECT_POST only, video + photo): Privacy level
  - `"PUBLIC_TO_EVERYONE"`
  - `"MUTUAL_FOLLOW_FRIENDS"`
  - `"FOLLOWER_OF_CREATOR"`
  - `"SELF_ONLY"`
- `duet` (required boolean, DIRECT_POST only, **video posts only**): Allow duets
- `stitch` (required boolean, DIRECT_POST only, **video posts only**): Allow stitch
- `comment` (required boolean, DIRECT_POST only, video + photo): Allow comments
- `autoAddMusic` (required, DIRECT_POST only, **photo posts only**): `"yes"` or `"no"` — automatically adds music to photo posts; ignored on video posts, so don't set it there
- `brand_content_toggle` (required boolean, DIRECT_POST only, video + photo): Brand content toggle
- `brand_organic_toggle` (required boolean, DIRECT_POST only, video + photo): Brand organic toggle
- `video_made_with_ai` (optional boolean, DIRECT_POST only, **video posts only**): Label the video as AI-generated
- `content_posting_method` (required): `"DIRECT_POST"` or `"UPLOAD"`
  - **Use `"DIRECT_POST"`.** It publishes the post to TikTok.
  - `"UPLOAD"` does **not** publish. It sends the media to the account's TikTok app inbox, where the user must manually finish and publish it within 24 hours (according to the rules text) or it is discarded.
  - `"UPLOAD"` also discards every other setting in this list except `title`.
  - Only use `"UPLOAD"` when the user has **explicitly** asked to review or edit the post inside the TikTok app before publishing. Never infer it from the user saying "upload this video" — that means `"DIRECT_POST"`.

**Example:**
```bash
ihateposting-agent posts:create \
  -c "TikTok video description" \
  -m "video.mp4" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{
    "title": "Check this out!",
    "privacy_level": "PUBLIC_TO_EVERYONE",
    "duet": true,
    "stitch": true,
    "comment": true,
    "autoAddMusic": "no",
    "brand_content_toggle": false,
    "brand_organic_toggle": false,
    "video_made_with_ai": false,
    "content_posting_method": "DIRECT_POST"
  }' \
  -i "tiktok-123"
```

A body file for it is in [examples/tiktok-video.json](examples/tiktok-video.json).

### Facebook (`facebook`)

**Settings** (all optional):
- `post_type`: `"post"` or `"story"` — a story needs at least one picture or video, and each attachment becomes a story of its own
- `url`: A link to show as a preview card. It works for text-only posts; a link written inside the text alone is not turned into a card
- `title`: The title of a video post (not for stories)
- `text_format_preset_id`: An identifier of a text format preset; the schema gives no further rules

**Example:**
```bash
ihateposting-agent posts:create \
  -c "Facebook post" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{
    "post_type": "post",
    "url": "https://example.com/article"
  }' \
  -i "facebook-123"
```

### Pinterest (`pinterest`)

**Settings:**
- `board` (required): The board's id (digits only), never its name. Get it with `integrations:trigger <integration-id> boards`
- `title` (optional): Pin title (max 100 characters)
- `link` (optional): Web address the pin leads to
- `dominant_color` (optional): A colour for the pin; the schema gives no format

**Example:**
```bash
ihateposting-agent posts:create \
  -c "Pin description" \
  -m "pin-image.jpg" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{
    "board": "1234567890",
    "title": "Pin Title"
  }' \
  -i "pinterest-123"
```

### Discord (`discord`)

**Settings:**
- `channel` (required): The id of the Discord channel to post in (not empty). Get the ids with `integrations:trigger <integration-id> channels`

**Example:**
```bash
ihateposting-agent posts:create \
  -c "Patch notes are up" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{
    "channel": "1234567890123456789"
  }' \
  -i "discord-123"
```

`-i` takes the id of your iHatePosting channel (the connected server); `channel` inside the settings is the id of a channel inside Discord.

### Slack (`slack`)

**Settings:**
- `channel` (required): The id of the Slack channel to post in (not empty). Get the ids with `integrations:trigger <integration-id> channels`

**Example:**
```bash
ihateposting-agent posts:create \
  -c "Release is out" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{
    "channel": "C0002"
  }' \
  -i "slack-123"
```

`-i` takes the id of your iHatePosting channel (the connected workspace); `channel` inside the settings is the id of a channel inside Slack.

### Tumblr (`tumblr`)

**Settings** (all optional):
- `title`: The post's title (1-4096 characters)
- `link`: A link for the post (empty, or a web address)
- `sourceUrl`: Where the content came from (empty, or a web address)
- `tags`: One string, up to 4096 characters. A JSON array does not match the schema, and the schema does not say how several tags are separated

**Example:**
```bash
ihateposting-agent posts:create \
  -c "Release notes are out" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{
    "title": "Release notes",
    "link": "https://example.com/notes",
    "tags": "news"
  }' \
  -i "tumblr-123"
```

### Google Business (`gmb`)

**Settings** (all optional):
- `topicType`: `"STANDARD"`, `"EVENT"` or `"OFFER"` — an update, an event or an offer
- `callToActionType`: `"NONE"`, `"BOOK"`, `"ORDER"`, `"SHOP"`, `"LEARN_MORE"`, `"SIGN_UP"`, `"GET_OFFER"` or `"CALL"` — the button on the post
- `callToActionUrl`: Where the button leads (a web address)
- `eventTitle`: For events
- `eventStartDate`, `eventEndDate`: For events; the schema does not state a date format
- `eventStartTime`, `eventEndTime`: For events; the schema does not state a time format
- `offerCouponCode`, `offerRedeemUrl`, `offerTerms`: For offers

A post holds text and, optionally, one picture.

**Example:**
```bash
ihateposting-agent posts:create \
  -c "Our new opening hours" \
  -s "2024-12-31T12:00:00Z" \
  --settings '{
    "topicType": "STANDARD",
    "callToActionType": "LEARN_MORE",
    "callToActionUrl": "https://example.com/learn"
  }' \
  -i "gmb-123"
```

## Platforms Without Specific Settings

These platforms take no settings:
- `threads`
- `mastodon`
- `bluesky`
- `telegram`

For these, you don't need to specify settings:
```bash
-i "threads-123"  # or any of the above
```

## Using JSON Files for Complex Settings

For complex settings, it's easier to use JSON files:

### Pinterest Example

**pinterest-pin.json:**
```json
{
  "type": "schedule",
  "date": "2024-01-15T12:00:00Z",
  "shortLink": true,
  "tags": [],
  "posts": [{
    "integration": { "id": "pinterest-123" },
    "value": [{
      "content": "Check out this cool project!",
      "image": [{ "id": "media-123", "path": "pin.jpg" }]
    }],
    "settings": {
      "board": "1234567890",
      "title": "My Cool Project - Built with TypeScript",
      "link": "https://example.com/project"
    }
  }]
}
```

```bash
ihateposting-agent posts:create --json pinterest-pin.json
```

### YouTube Example

**youtube-video.json:**
```json
{
  "type": "schedule",
  "date": "2024-12-25T12:00:00Z",
  "shortLink": true,
  "tags": [],
  "posts": [{
    "integration": { "id": "youtube-123" },
    "value": [{
      "content": "Full video description with timestamps...",
      "image": [{
        "id": "media-123",
        "path": "https://cdn.example.com/video.mp4"
      }]
    }],
    "settings": {
      "title": "How to Build a CLI Tool",
      "type": "public",
      "selfDeclaredMadeForKids": "no",
      "thumbnail": {
        "id": "media-124",
        "path": "https://cdn.example.com/thumbnail.jpg"
      },
      "tags": [
        { "value": "programming", "label": "Programming" },
        { "value": "typescript", "label": "TypeScript" },
        { "value": "tutorial", "label": "Tutorial" }
      ]
    }
  }]
}
```

```bash
ihateposting-agent posts:create --json youtube-video.json
```

### Multi-Platform with Different Settings

**multi-platform-campaign.json:**
```json
{
  "type": "schedule",
  "date": "2024-01-15T12:00:00Z",
  "shortLink": true,
  "tags": [],
  "posts": [
    {
      "integration": { "id": "pinterest-123" },
      "value": [{ "content": "Pinterest-specific content", "image": [{ "id": "media-123", "path": "pin.jpg" }] }],
      "settings": {
        "board": "1234567890",
        "title": "Post Title"
      }
    },
    {
      "integration": { "id": "x-123" },
      "value": [{ "content": "Twitter-specific content", "image": [] }],
      "settings": {
        "who_can_reply_post": "everyone"
      }
    },
    {
      "integration": { "id": "linkedin-123" },
      "value": [
        {
          "content": "LinkedIn post",
          "image": [
            { "id": "1", "path": "img1.jpg" },
            { "id": "2", "path": "img2.jpg" }
          ]
        }
      ],
      "settings": {
        "post_as_images_carousel": true,
        "carousel_name": "Product Launch"
      }
    }
  ]
}
```

## Tips

1. **Use JSON files for complex settings** - Command-line JSON strings get messy fast
2. **Validate your settings** - The API will return errors if settings are invalid
3. **Check required fields** - Each platform has different required fields
4. **Platform-specific content** - Different platforms may need different content/media
5. **Test with drafts first** - Use `"type": "draft"` to test without posting

## Finding Your Provider Type

To find the correct provider type for your integration:

```bash
ihateposting-agent integrations:list
```

This will show the `identifier` field for each integration; it tells you which of the sections above applies. The settings never carry it: the server reads it from the channel. (Do not confuse it with the integration's `id`, which is what you pass to `-i`.)

## Common Errors

### Adding __type

```json
{
  "settings": {
    "__type": "youtube",  // ❌ Not needed
    "title": "My Video"
  }
}
```

**Fix:**
```json
{
  "settings": {
    "title": "My Video"  // ✅ The server adds __type from the integration
  }
}
```

### Wrong Provider Type

```bash
# ❌ Wrong
ihateposting-agent integrations:list | tail -n +2 | jq '.[] | select(.identifier=="twitter")'  # Should be "x"

# ✅ Correct
ihateposting-agent integrations:list | tail -n +2 | jq '.[] | select(.identifier=="x")'
```

`posts:create` has no `-p` flag; if a script passes one, it is ignored. The platform comes from the integration id.

### Invalid Settings for Platform

Each platform validates its own settings. Check the error message and refer to the platform's required fields above.

## See Also

- **EXAMPLES.md** - General usage examples
- **COMMAND_LINE_GUIDE.md** - Command-line syntax
- **SKILL.md** - AI agent patterns

## Sections that were in this file before it followed the reference

### The server is the authority

**The server is the authority.** This page is a reader's guide, written from the settings schemas the app currently publishes. The schema, the rules and the length limit of your own channel come from

```bash
ihateposting-agent integrations:settings <channel-id>
```

Run that first. Its answer can be newer than this page. The page does not repeat the rule texts; where a platform has rules about pictures or videos, only the gist is given, and `output.rules` has the exact words. See [INTEGRATION_SETTINGS_DISCOVERY.md](INTEGRATION_SETTINGS_DISCOVERY.md) for how to read the answer, and [PROVIDER_SETTINGS_SUMMARY.md](PROVIDER_SETTINGS_SUMMARY.md) for one table of everything.

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
- **A platform described above as having no settings** needs none, and `--settings` can be left out. Quoting is your shell's job; see "Common errors" below for the Windows specifics.

### Reading the settings

"Required" means the schema lists the key in its `required` list, so the post is refused without it. Some keys are required only in a mode (for example X's article keys); the notes say so. A "web address" is a string in the form of a URL. Booleans are JSON `true` or `false`; where the schema wants the words `"yes"` or `"no"`, that is stated, because mixing the two up is an easy mistake to make.

Many keys are strings with a small set of allowed values. The values are case sensitive: `public` is not `Public`.

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

### Common errors

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

#### Quoting on Windows

The same JSON that works in Bash can arrive mangled in other shells. These results come from a check on one Windows machine with a small program that printed the arguments it received:

- **PowerShell 7** passes a single-quoted string such as `'{"board":"1234567890","title":"Ten tips"}'` through unchanged.
- **`cmd`** accepts the JSON inside double quotes with each inner quote written as `\"`:

  ```bat
  ihateposting-agent posts:create -i pinterest-123 -c "Ten quick tips" -s 2026-12-15T10:00:00Z -t draft --settings "{\"board\":\"1234567890\",\"title\":\"Ten tips\"}"
  ```

- **Windows PowerShell 5.1** is the unreliable one. It removes the double quotes inside the string, which produces exactly the "Failed to parse settings JSON" case, and it splits an argument at spaces when the argument also holds quotes. Writing each inner quote as `\"` (for example with `-replace '"', '\"'`) helps only when the JSON holds no spaces.

If you are on Windows PowerShell 5.1, install PowerShell 7 or use a body file. A body file does not depend on the shell at all, so when in doubt, use one.
