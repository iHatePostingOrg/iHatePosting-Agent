---
name: manage-scheduled-posts
description: Look at, change or delete posts that are already in iHatePosting. Use when the person asks what is scheduled, wants to see drafts or failed posts, change a post's platform settings, or remove a post.
---

# Review and manage existing posts

## See the posts

Call `postsListTool` with a start and an end date, both in UTC. To see what is coming up, pass now and a year ahead. Each post comes back with its id, time, state (`QUEUE` waiting, `DRAFT`, `PUBLISHED`, `ERROR`), the reason a failed post failed, its text, its current platform settings and its channel.

Show the person a short list: time, channel, state and the first words of the text. When a post failed, give the reason in plain words.

## Change a post's settings

Only a post that has not gone out (waiting or a draft) can change, and only its platform settings; its text and time stay.

1. Find the post with `postsListTool` and take its id.
2. Call `integrationSchema` for its channel to see which settings the platform has.
3. Call `postSettingsTool` with the post id and only the keys that change. They are merged into the settings it already has.
4. If the answer holds `errors`, read the words, fix the settings and call again.

To change the text or the time of a post, tell the person that this plugin cannot do it: make a new post and delete the old one only if they agree.

## Delete a post

Deleting cannot be undone. Before you call `deletePostTool`:

1. Show the person the post: its channel, time and text.
2. Ask them to confirm.
3. Only then call `deletePostTool` with the post's id.

A post made for several channels has a separate id on each channel; a repeating post is one id for all its repeats. A deleted waiting post is never published. A published post only disappears from iHatePosting and stays live on the platform; say so.

If no post matches what the person described, say that and delete nothing.
