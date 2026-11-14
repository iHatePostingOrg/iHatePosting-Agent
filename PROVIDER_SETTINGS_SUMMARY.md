# Platform settings at a glance

One page of tables for the details in [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md). It is written from the settings schemas the app publishes, so treat it as a guide: for a real channel, `ihateposting-agent integrations:settings <channel-id>` is the answer that counts (its rules, `maxLength`, schema and helpers).

The **identifier** is the platform's name as the app uses it; `integrations:list` shows it as `identifier`. Do not confuse it with the channel's `id`, which is what you pass to `-i` and to the other commands.

## Every platform in one table

| Platform | Identifier | Required settings | Optional settings | Helpers (`integrations:trigger`) | Notes |
| --- | --- | --- | --- | --- | --- |
| Bluesky | `bluesky` | none | none | none | Rules limit how many pictures or videos a post may hold |
| Mastodon | `mastodon` | none | none | none | |
| Slack | `slack` | `channel` | none | `channels` | `channel` is the id of a Slack channel |
| Facebook | `facebook` | none | `post_type`, `url`, `title`, `text_format_preset_id` | none | `post_type` is `post` or `story`; a story needs an attachment |
| Telegram | `telegram` | none | none | none | |
| X | `x` | none | `who_can_reply_post`, `community`, `post_type`, `article_title`, `article_status`, `article_cover`, `made_with_ai`, `paid_partnership` | none | `post_type` `article` makes a long-form article, which then also needs `article_title` and `article_status` |
| LinkedIn | `linkedin` | none | `post_as_images_carousel`, `carousel_name` | `mention` (needs `{"query": ...}`) | A carousel needs at least two pictures and nothing else |
| LinkedIn Page | `linkedin-page` | none | `post_as_images_carousel`, `carousel_name` | `mention` (needs `{"query": ...}`) | Same keys as LinkedIn |
| Tumblr | `tumblr` | none | `title`, `link`, `sourceUrl`, `tags` | none | `tags` is one string |
| Discord | `discord` | `channel` | none | `channels` | `channel` is the id of a Discord channel |
| Pinterest | `pinterest` | `board` | `title`, `link`, `dominant_color` | `boards` | `board` is the numeric id (digits only), not the name; at least one picture is needed |
| TikTok | `tiktok` | `content_posting_method`, `privacy_level`, `duet`, `stitch`, `comment`, `autoAddMusic`, `brand_content_toggle`, `brand_organic_toggle` | `title`, `video_made_with_ai` | none | Needs an attachment. `UPLOAD` does not publish; `autoAddMusic` is `"yes"` or `"no"` |
| YouTube | `youtube` | `title`, `type` | `selfDeclaredMadeForKids`, `thumbnail`, `tags` | none | Needs a video. `type` is `public`, `private` or `unlisted` |
| Google Business | `gmb` | none | `topicType`, `callToActionType`, `callToActionUrl`, `eventTitle`, `eventStartDate`, `eventEndDate`, `eventStartTime`, `eventEndTime`, `offerCouponCode`, `offerRedeemUrl`, `offerTerms` | none | `topicType` is `STANDARD`, `EVENT` or `OFFER`; at most one picture |
| Instagram | `instagram` | `post_type` | `collaborators`, `graduation_strategy`, `is_trial_reel` | none | `post_type` is `post` or `story`; at least one attachment, a story only one picture |
| Threads | `threads` | none | none | none | |

Fifteen platforms, sixteen identifiers: LinkedIn Page is a second kind of LinkedIn channel.

## Reading the table

- **Required settings** are the keys the platform's schema lists as required. Other conditions (for example X's article keys) are in the notes and in the rules text.
- **Helpers** are the `methodName` values listed in `output.tools` of `integrations:settings`. A platform with none has no `tools` entry, and a helper's inputs are in its `dataSchema`. See [INTEGRATION_TOOLS_WORKFLOW.md](INTEGRATION_TOOLS_WORKFLOW.md).
- A platform with no settings has no schema; its answer is a short sentence saying so.
- Allowed values, limits and nested shapes are in [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md).

## Four ways to group them

| If the platform... | Then | Platforms |
| --- | --- | --- |
| has no settings | leave `--settings` out | Bluesky, Mastodon, Telegram, Threads |
| needs only an id of a room or board | one required key, found with a helper | Slack, Discord (`channel`), Pinterest (`board`) |
| has only optional settings | send nothing, or only the keys you want | Facebook, X, LinkedIn, LinkedIn Page, Tumblr, Google Business |
| has required settings that describe the post | fill every required key | YouTube (2), Instagram (1), TikTok (8) |

## Usage

| Where | How | Reach |
| --- | --- | --- |
| A flag | `posts:create ... --settings '<json>'` | The same object for every channel in `-i`, so one platform per command |
| A body file | `posts:create --json ./body.json`, with a `settings` object in each entry of `posts` | Each channel its own settings; the file is sent as it is |
| A post that has not gone out | `posts:settings <post-id> --settings '{"title":"New title"}'` | Only the keys you pass change |

Never include `__type`: the server derives it from the channel. A complete body file is shown in [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md) and in [examples/](examples/README.md).

## The smallest valid settings

```bash
# Slack and Discord
--settings '{"channel":"channel-123"}'

# Pinterest
--settings '{"board":"1234567890"}'

# YouTube
--settings '{"title":"My video","type":"private"}'

# Instagram
--settings '{"post_type":"post"}'

# TikTok
--settings '{"content_posting_method":"DIRECT_POST","privacy_level":"SELF_ONLY","duet":false,"stitch":false,"comment":false,"autoAddMusic":"no","brand_content_toggle":false,"brand_organic_toggle":false}'
```

Everything else takes `--settings` only when you want one of its optional keys.

## Quick examples of optional settings

```bash
# X: only followers may reply
--settings '{"who_can_reply_post":"following"}'

# X: a long-form article kept as a draft on X
--settings '{"post_type":"article","article_title":"Why we moved","article_status":"draft"}'

# LinkedIn or LinkedIn Page: pictures as a carousel
--settings '{"post_as_images_carousel":true,"carousel_name":"Launch photos"}'

# Facebook: a story
--settings '{"post_type":"story"}'

# Tumblr
--settings '{"title":"Release notes","link":"https://example.com/notes","tags":"news"}'

# Google Business: an update with a button
--settings '{"topicType":"STANDARD","callToActionType":"LEARN_MORE","callToActionUrl":"https://example.com/learn"}'

# Instagram: invite a collaborator
--settings '{"post_type":"post","collaborators":[{"label":"example_account"}]}'
```

## Allowed values at a glance

| Key | Platform | Values |
| --- | --- | --- |
| `post_type` | Facebook | `post`, `story` |
| `post_type` | Instagram | `post`, `story` |
| `post_type` | X | `post`, `article` |
| `who_can_reply_post` | X | `everyone`, `following`, `mentionedUsers`, `subscribers`, `verified` |
| `article_status` | X | `draft`, `published` |
| `content_posting_method` | TikTok | `DIRECT_POST`, `UPLOAD` |
| `privacy_level` | TikTok | `PUBLIC_TO_EVERYONE`, `MUTUAL_FOLLOW_FRIENDS`, `FOLLOWER_OF_CREATOR`, `SELF_ONLY` |
| `type` | YouTube | `public`, `private`, `unlisted` |
| `graduation_strategy` | Instagram | `MANUAL`, `SS_PERFORMANCE` |
| `topicType` | Google Business | `STANDARD`, `EVENT`, `OFFER` |
| `callToActionType` | Google Business | `NONE`, `BOOK`, `ORDER`, `SHOP`, `LEARN_MORE`, `SIGN_UP`, `GET_OFFER`, `CALL` |

Values are case sensitive.

## Words or booleans?

| Key | Platform | You send |
| --- | --- | --- |
| `autoAddMusic` | TikTok | `"yes"` or `"no"` (a word, in quotes) |
| `selfDeclaredMadeForKids` | YouTube | `"yes"` or `"no"` (a word, in quotes) |
| `duet`, `stitch`, `comment`, `brand_content_toggle`, `brand_organic_toggle`, `video_made_with_ai` | TikTok | `true` or `false` |
| `post_as_images_carousel` | LinkedIn, LinkedIn Page | `true` or `false` |
| `made_with_ai`, `paid_partnership` | X | `true` or `false` |

## Limits at a glance

| Key | Platform | Limit |
| --- | --- | --- |
| `title` | YouTube | 1 to 100 characters |
| `title` | Pinterest | up to 100 characters |
| `title` | TikTok | up to 90 characters |
| `title` | Tumblr | 1 to 4096 characters |
| `tags` | Tumblr | up to 4096 characters, one string |
| `board` | Pinterest | digits only, not empty |
| `channel` | Slack, Discord | a non-empty string |
| `community` | X | empty, or `https://x.com/i/communities/<digits>` |
| `article_title` | X | not empty |

## Attachments at a glance

These are the gist of each platform's rules text; `output.rules` has the exact words.

| Platform | What a post may carry |
| --- | --- |
| Bluesky | One video, or up to four pictures, or nothing |
| Facebook | Text only, pictures or a video; a story needs at least one attachment |
| X | Up to four pictures, or one video, or nothing |
| LinkedIn, LinkedIn Page | One attachment when it is a video; a carousel needs at least two pictures |
| Pinterest | At least one; a video pin has a video and a cover picture; up to five pictures |
| TikTok | One video, or one or more pictures; never nothing |
| YouTube | One video; never empty |
| Google Business | Text and, optionally, one picture |
| Instagram | At least one; a story only one picture |
| Mastodon, Telegram, Threads, Slack, Discord, Tumblr | No rules text in the schemas the app publishes |

## Text length at a glance

`output.maxLength` of `integrations:settings` is the longest text for a channel. The values below are the ones the app lists at the time of writing, to give you a feeling for the range. They are not checked from this repository, and the number your channel answers is the one that counts.

| Platform | Typical `maxLength` |
| --- | --- |
| Bluesky | 300 |
| Mastodon | 500 |
| Threads | 500 |
| Pinterest | 500 |
| Google Business | 1500 |
| Discord | 1980 |
| TikTok | 2000 |
| Instagram | 2200 |
| LinkedIn | 3000 |
| Telegram | 4096 |
| YouTube | 5000 |
| Tumblr | 32768 |
| Facebook | 63206 |
| Slack | 400000 |
| X | 280, or 4000 for a channel marked as verified, or 100000 for an article |

## Ready body files

All of them are drafts with placeholder ids. Replace the ids and the media before use (see [examples/README.md](examples/README.md)).

| File | Platforms |
| --- | --- |
| [examples/multi-platform-with-settings.json](examples/multi-platform-with-settings.json) | X, LinkedIn (carousel), Instagram, Pinterest, Bluesky |
| [examples/tiktok-video.json](examples/tiktok-video.json) | TikTok with all required keys |
| [examples/youtube-video.json](examples/youtube-video.json) | YouTube with thumbnail and tags |
| [examples/pinterest-pin.json](examples/pinterest-pin.json) | Pinterest with a board |
| [examples/thread-post.json](examples/thread-post.json) | X thread, five minutes apart |

## Finding the identifier

```bash
ihateposting-agent integrations:list
```

Each entry has `id`, `name` and `identifier`. Use the `identifier` to pick the row of the table above and the `id` for `-i`.

## Tips

1. Run `integrations:settings <channel-id>` before you write settings for a channel you have not used this way before.
2. Use a body file for anything nested, and for any shell that handles quotes badly.
3. Make a draft first (`-t draft`) and schedule it with `posts:status <post-id> --status schedule`.
4. Different platforms in one go need a body file; ids the platform decides (board, room, company) come from helpers.

## More

- [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md): every key, every allowed value, mistakes to avoid.
- [INTEGRATION_SETTINGS_DISCOVERY.md](INTEGRATION_SETTINGS_DISCOVERY.md): reading the answer of `integrations:settings`.
- [INTEGRATION_TOOLS_WORKFLOW.md](INTEGRATION_TOOLS_WORKFLOW.md): the helpers.
- [SYNTAX_UPGRADE.md](SYNTAX_UPGRADE.md): the conventions of the command line.
