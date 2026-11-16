---
name: schedule-posts
description: Draft, schedule or publish a social media post with iHatePosting. Use when the person wants to post, write a post for a channel, schedule something for a date and time, save a draft, or publish now.
---

# Draft, schedule or publish a post

## Steps

1. **Find the channels.** Call `integrationList` (and `groupList` first if a customer was named). Use a channel's `id` as `integrationId`. If the person named a platform and more than one channel matches, ask which one.
2. **Read the platform's rules.** Call `integrationSchema` for each channel before every scheduling. Follow its rules exactly: the longest post, what attachments are allowed, and the settings the platform needs. If it lists helper functions under `tools`, run them through `triggerTool` to get an id a setting needs (for example a board or channel id) instead of asking the person to look it up.
3. **Prepare any pictures or videos.** Use the `create-post-media` skill, then attach the file's `path`.
4. **Choose the type.**
   - `draft`: saved, not published. Use this whenever the person did not clearly ask to publish.
   - `schedule`: published at the given time.
   - `now`: published at once. Only when the person clearly asked for it.
5. **Write the post.** `content` is HTML with every line in a `<p>` tag. The only other tags allowed are `h1`, `h2`, `h3`, `u`, `strong`, `ul` and `li`, and `u` and `strong` must not be used together. No code blocks. The first entry of `postsAndComments` is the post; every later entry is a reply or the next part of a thread.
6. **Set the date.** `date` is in UTC like `2026-12-01T09:30:00`. When the person gives a local time, convert it and say the time you used. For type `now`, pass the current time.
7. **Call `integrationSchedulePostTool`.** Pass one item per channel. Pass the settings the platform needs as `{ key, value }` pairs; send an empty list when it needs none.
8. **Report back.** On success each item answers a post id and a preview link; give the person the link and say whether it is a draft, scheduled for a time, or published. If the answer holds `errors`, nothing was saved: read the words, fix the post and call again.

## Rules

- The tool checks every item first and saves nothing unless all are fine, so a retry after an error does not make duplicates.
- Do not invent a channel id, a date or settings. If something needed is missing, ask for it in one short question.
- Never promise a result the tool did not return. If a channel is switched off or needs reconnecting in iHatePosting, say so.
