# Platform settings

Most platforms have a few options of their own that do not fit in "text plus pictures": a Pinterest board, a YouTube title, a TikTok privacy level. `ihateposting-agent` carries them in a JSON object called **settings**. This page describes the shape of that object for each platform.

**The server is the authority.** What follows is a reader's guide written from the settings schemas the app currently publishes; the schema, the rules and the length limit of your own channel come from

```bash
ihateposting-agent integrations:settings <channel-id>
```

Run that first. Its answer can be newer than this page. This page does not repeat the rule texts; where a platform has rules about pictures or videos, only the gist is given, and `output.rules` has the exact text. See [INTEGRATION_SETTINGS_DISCOVERY.md](INTEGRATION_SETTINGS_DISCOVERY.md) for how to read the answer, and [PROVIDER_SETTINGS_SUMMARY.md](PROVIDER_SETTINGS_SUMMARY.md) for one table of everything.

## How to pass settings

**With a flag.** `--settings` takes a JSON string. The same object is sent for every channel named with `-i`, so use it when all channels in the command are on one platform:

```bash
ihateposting-agent posts:create -i pinterest-123 -c "Ten quick tips" \
  -m "<path from upload>" -s 2026-12-15T10:00:00Z -t draft \
  --settings '{"board":"1234567890","title":"Ten tips"}'
```

**In a body file.** Each entry of `posts` has its own `settings`, so one file can address several platforms. This is also the easiest way around shell quoting problems:

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

**Later, on a post that has not gone out.** `posts:settings <post-id> --settings '<json>'` changes only the keys you pass.

Good to know:

- Do not add a `__type` key. The server knows each channel's platform and fills it in.
- Send only keys that the channel's schema lists, with values of the type it names.
- If the JSON does not parse, the program prints `❌ Failed to parse settings JSON: <why>` and ends with exit code `1` without contacting the server. If the server rejects the content, the program shows the server's words after `API Error (<status>)`.
- A platform that appears below as "none" needs no settings, and `--settings` can be left out.

## Reading the tables

"Required" means that the schema lists the key in its `required` list, so the post is refused without it. Some fields are required only in a mode (for example X's article fields); that is said in the notes. A "web address" is a string in the form of a URL. Booleans are JSON `true` or `false`; where the schema wants the words `"yes"` or `"no"` that is stated.

Many fields are written as strings with a small set of allowed values. The values are case sensitive.

## Platform by platform

### Bluesky (`bluesky`), Mastodon (`mastodon`), Telegram (`telegram`), Threads (`threads`)

None. The answer of `integrations:settings` says that no additional settings are required (a short sentence in place of a schema). Bluesky has rules about how many pictures or videos a post may hold.

### Slack (`slack`) and Discord (`discord`)

| Field | Type | Notes |
| --- | --- | --- |
| `channel` | string, not empty | **Required.** The id of the Slack or Discord channel to post in. Get ids with the helper `channels` (see [INTEGRATION_TOOLS_WORKFLOW.md](INTEGRATION_TOOLS_WORKFLOW.md)). |

```bash
--settings '{"channel":"channel-123"}'
```

### Facebook (`facebook`)

All optional.

| Field | Type | Allowed values | Notes |
| --- | --- | --- | --- |
| `post_type` | string | `post`, `story` | A story needs at least one picture or video, and each attachment becomes its own story. |
| `url` | web address | | A link to show as a preview card; used for text-only posts. A link written inside the text alone is not turned into a card. |
| `title` | string | | The title of a video post (not for stories). |
| `text_format_preset_id` | string | | An identifier of a text format preset. The schema gives no further rules. |

```bash
--settings '{"post_type":"post","url":"https://example.com/article"}'
```

### X (`x`)

All optional in the schema, but two modes exist: a normal short post, and a long-form article.

| Field | Type | Allowed values | Notes |
| --- | --- | --- | --- |
| `who_can_reply_post` | string | `everyone`, `following`, `mentionedUsers`, `subscribers`, `verified` | Who may reply. |
| `community` | string | empty, or an address of the form `https://x.com/i/communities/<digits>` | Post into an X community. |
| `post_type` | string | `post`, `article` | `article` turns the post into a long-form article. The text is then written as HTML with a limited set of tags; see `output.rules`. |
| `article_title` | string, not empty | | The title. Needed when `post_type` is `article`. |
| `article_status` | string | `draft`, `published` | Whether the article waits as a draft on X or goes live immediately. Needed when `post_type` is `article`. |
| `article_cover` | media object | | A cover picture, for articles only. An object with `id` and `path` (both required) and optionally `alt` and `thumbnail` (a web address). Use the `id` and `path` that `upload` returned. |
| `made_with_ai` | boolean | | Mark the post as made with AI. |
| `paid_partnership` | boolean | | Mark the post as a paid partnership. |

Depending on how the server is configured, the rules text of X may carry an extra sentence about links being removed from posts. Read `output.rules`.

```bash
--settings '{"who_can_reply_post":"following"}'
--settings '{"post_type":"article","article_title":"Why we moved","article_status":"draft"}'
```

### LinkedIn (`linkedin`) and LinkedIn Page (`linkedin-page`)

Both take the same optional fields.

| Field | Type | Notes |
| --- | --- | --- |
| `post_as_images_carousel` | boolean | Publish the pictures as a carousel. A carousel needs at least two pictures and nothing but pictures. |
| `carousel_name` | string | A name for the carousel. |

Both platforms have the helper `mention` to find a company page to tag.

```bash
--settings '{"post_as_images_carousel":true,"carousel_name":"Launch photos"}'
```

### Tumblr (`tumblr`)

All optional.

| Field | Type | Limits | Notes |
| --- | --- | --- | --- |
| `title` | string | 1 to 4096 characters | The post's title. |
| `link` | string | empty, or a web address | A link for the post. |
| `sourceUrl` | string | empty, or a web address | Where the content came from. |
| `tags` | string | up to 4096 characters | A single string. How several tags are separated is not stated by the schema (unverified). |

```bash
--settings '{"title":"Release notes","link":"https://example.com/notes","tags":"news"}'
```

### Pinterest (`pinterest`)

| Field | Type | Limits | Notes |
| --- | --- | --- | --- |
| `board` | string | digits only, not empty | **Required.** The board's id (digits only), never its name. Get it with the helper `boards`. |
| `title` | string | up to 100 characters | The pin's title. |
| `link` | web address | | Where the pin leads. |
| `dominant_color` | string | | A colour for the pin. The schema gives no format (unverified). |

A pin needs at least one picture; a video pin needs two attachments (the video and a cover picture); a pin of pictures may have up to five. See `output.rules` for the exact words.

```bash
--settings '{"board":"1234567890","title":"Ten tips","link":"https://example.com/tips"}'
```

### TikTok (`tiktok`)

Eight keys are required, so a complete object is always sent, even for a quick post.

| Field | Type | Allowed values | Notes |
| --- | --- | --- | --- |
| `content_posting_method` | string | `DIRECT_POST`, `UPLOAD` | **Required.** `DIRECT_POST` publishes to the account. `UPLOAD` does not publish: it hands the media to the person's TikTok app to finish and publish by hand, and TikTok then ignores the other settings except the title. |
| `privacy_level` | string | `PUBLIC_TO_EVERYONE`, `MUTUAL_FOLLOW_FRIENDS`, `FOLLOWER_OF_CREATOR`, `SELF_ONLY` | **Required.** Who can see the post. |
| `duet` | boolean | | **Required.** Allow duets. Videos only. |
| `stitch` | boolean | | **Required.** Allow stitches. Videos only. |
| `comment` | boolean | | **Required.** Allow comments. |
| `autoAddMusic` | string | `"yes"`, `"no"` | **Required.** A word, not a boolean. For photo posts: let TikTok add recommended music. |
| `brand_content_toggle` | boolean | | **Required.** One of TikTok's two branded-content switches (by its name; the schema gives no more). |
| `brand_organic_toggle` | boolean | | **Required.** The other branded-content switch. |
| `title` | string | up to 90 characters | Optional. The post's title. The one setting that survives `UPLOAD`. |
| `video_made_with_ai` | boolean | | Optional. Label a video as AI generated. Videos only. |

The rules say TikTok cannot take a post without an attachment: one video, or one or more pictures. Most of the keys count only with `DIRECT_POST`; `output.rules` spells out which.

```bash
--settings '{"content_posting_method":"DIRECT_POST","privacy_level":"SELF_ONLY","duet":false,"stitch":false,"comment":true,"autoAddMusic":"no","brand_content_toggle":false,"brand_organic_toggle":false}'
```

A body file for it is in [examples/tiktok-video.json](examples/tiktok-video.json).

### YouTube (`youtube`)

| Field | Type | Allowed values / limits | Notes |
| --- | --- | --- | --- |
| `title` | string | 1 to 100 characters | **Required.** The video's title. The post's text becomes the description. |
| `type` | string | `public`, `private`, `unlisted` | **Required.** Visibility. |
| `selfDeclaredMadeForKids` | string | `"yes"`, `"no"` | Optional. A word, not a boolean. |
| `thumbnail` | media object | | Optional. `id` and `path` (required) from an upload, optionally `alt` and `thumbnail` (a web address). |
| `tags` | list of objects | each has `value` and `label`, both strings and both required | Optional. For example `[{"value":"tutorial","label":"Tutorial"}]`. |

The post must carry a video; it cannot be empty.

```bash
--settings '{"title":"My first video","type":"private","tags":[{"value":"tutorial","label":"Tutorial"}]}'
```

A body file is in [examples/youtube-video.json](examples/youtube-video.json).

### Google Business (`gmb`)

All optional.

| Field | Type | Allowed values | Notes |
| --- | --- | --- | --- |
| `topicType` | string | `STANDARD`, `EVENT`, `OFFER` | The kind of post: an update, an event or an offer. |
| `callToActionType` | string | `NONE`, `BOOK`, `ORDER`, `SHOP`, `LEARN_MORE`, `SIGN_UP`, `GET_OFFER`, `CALL` | The button. |
| `callToActionUrl` | web address | | Where the button leads. |
| `eventTitle` | string | | For events. |
| `eventStartDate`, `eventEndDate` | string | | For events. The schema does not state a date format (unverified). |
| `eventStartTime`, `eventEndTime` | string | | For events. The schema does not state a time format (unverified). |
| `offerCouponCode` | string | | For offers. |
| `offerRedeemUrl` | web address | | For offers. |
| `offerTerms` | string | | For offers. |

A post can hold text and optionally one picture.

```bash
--settings '{"topicType":"STANDARD","callToActionType":"LEARN_MORE","callToActionUrl":"https://example.com/learn"}'
```

### Instagram (`instagram`)

| Field | Type | Allowed values | Notes |
| --- | --- | --- | --- |
| `post_type` | string | `post`, `story` | **Required.** A story can have only one picture. A post needs at least one attachment. |
| `collaborators` | list of objects | each has a required string `label` | Optional. Accounts to invite as collaborators. |
| `graduation_strategy` | string | `MANUAL`, `SS_PERFORMANCE` | Optional. |
| `is_trial_reel` | | | Listed with no type and no rules in the schema. Read `integrations:settings` before using it (unverified what it accepts). |

```bash
--settings '{"post_type":"post","collaborators":[{"label":"example_account"}]}'
```

## When something goes wrong

| What you see | What to check |
| --- | --- |
| `❌ Failed to parse settings JSON: ...` | The JSON is malformed. In a shell, single quotes around the whole object are the usual fix; in PowerShell or `cmd` use a body file instead. |
| `API Error (<status>)` followed by the server's messages | A key is probably missing, has the wrong type or is not one of the allowed values. Compare with the schema from `integrations:settings`. |
| The post is accepted but looks wrong on the platform | The channel's rules (`output.rules`) probably say something about the media or the mode you picked. |
| One `--settings` for channels of two platforms | It cannot suit both. Make one command per platform, or use a body file. |
