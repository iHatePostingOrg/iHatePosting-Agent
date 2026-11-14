# Platform settings at a glance

One table for the details in [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md). It is written from the settings schemas the app publishes, so treat it as a guide: for a real channel, `ihateposting-agent integrations:settings <channel-id>` is the answer that counts (its rules, `maxLength`, schema and helpers).

The **identifier** is the platform's name as the app uses it; it is shown as `identifier` in `integrations:list`. Do not confuse it with the channel's `id`, which is what you pass to `-i` and to the other commands.

| Platform | Identifier | Required settings | Optional settings | Helpers (`integrations:trigger`) | Notes |
| --- | --- | --- | --- | --- | --- |
| Bluesky | `bluesky` | none | none | none | Rules limit how many pictures or videos a post may hold |
| Mastodon | `mastodon` | none | none | none | |
| Slack | `slack` | `channel` | none | `channels` | `channel` is the id of a Slack channel |
| Facebook | `facebook` | none | `post_type`, `url`, `title`, `text_format_preset_id` | none | `post_type` is `post` or `story`; a story needs an attachment |
| Telegram | `telegram` | none | none | none | |
| X | `x` | none | `who_can_reply_post`, `community`, `post_type`, `article_title`, `article_status`, `article_cover`, `made_with_ai`, `paid_partnership` | none | `post_type` `article` makes a long-form article, which then also needs `article_title` and `article_status` |
| LinkedIn | `linkedin` | none | `post_as_images_carousel`, `carousel_name` | `mention` (needs `{"query": ...}`) | A carousel needs at least two pictures and nothing else |
| LinkedIn Page | `linkedin-page` | none | `post_as_images_carousel`, `carousel_name` | `mention` (needs `{"query": ...}`) | Same fields as LinkedIn |
| Tumblr | `tumblr` | none | `title`, `link`, `sourceUrl`, `tags` | none | `tags` is one string |
| Discord | `discord` | `channel` | none | `channels` | `channel` is the id of a Discord channel |
| Pinterest | `pinterest` | `board` | `title`, `link`, `dominant_color` | `boards` | `board` is the numeric id (digits only), not the name; at least one picture is needed |
| TikTok | `tiktok` | `content_posting_method`, `privacy_level`, `duet`, `stitch`, `comment`, `autoAddMusic`, `brand_content_toggle`, `brand_organic_toggle` | `title`, `video_made_with_ai` | none | Needs an attachment. `UPLOAD` does not publish; `autoAddMusic` is `"yes"` or `"no"` |
| YouTube | `youtube` | `title`, `type` | `selfDeclaredMadeForKids`, `thumbnail`, `tags` | none | Needs a video. `type` is `public`, `private` or `unlisted` |
| Google Business | `gmb` | none | `topicType`, `callToActionType`, `callToActionUrl`, `eventTitle`, `eventStartDate`, `eventEndDate`, `eventStartTime`, `eventEndTime`, `offerCouponCode`, `offerRedeemUrl`, `offerTerms` | none | `topicType` is `STANDARD`, `EVENT` or `OFFER`; at most one picture |
| Instagram | `instagram` | `post_type` | `collaborators`, `graduation_strategy`, `is_trial_reel` | none | `post_type` is `post` or `story`; at least one attachment, a story only one picture |
| Threads | `threads` | none | none | none | |

Fifteen platforms, sixteen identifiers (LinkedIn Page is a second kind of LinkedIn channel).

## Reading the table

- **Required settings** are the keys the platform's schema lists as required. Other conditions (for example X's article fields) are in the notes and in the rules text.
- **Helpers** are the `methodName` values listed in `output.tools` of `integrations:settings`. A platform with none has no `tools` entry, and a helper's inputs are in its `dataSchema`. See [INTEGRATION_TOOLS_WORKFLOW.md](INTEGRATION_TOOLS_WORKFLOW.md).
- A platform with no settings has no schema; the answer is a short sentence saying so.
- Allowed values, limits and nested shapes are in [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md).

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
