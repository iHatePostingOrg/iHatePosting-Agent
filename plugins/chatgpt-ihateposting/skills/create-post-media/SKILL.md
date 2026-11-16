---
name: create-post-media
description: Get pictures or videos into the iHatePosting media library so they can be attached to a post. Use when the person wants to post with a picture or video, gives a web address of one, or wants to upload a file from their computer.
---

# Pictures and videos for a post

A post attaches a file by its `path` from the media library. Look there first, upload only when it is not there.

## Look in the library

Call `mediaListTool` (newest first, 18 to a page; pass a name to filter). If the file the person means is already there, use its `path` and do not upload it again.

## From a public web address

Call `uploadFromUrlTool` with the address. It must be a public `https` address ending in `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` or `.mp4`. A file on someone's computer cannot be fetched this way. The answer holds the file's id and path.

Some files are prepared after they are uploaded. If the file's status is `processing`, wait about ten seconds and call `mediaStatusTool` with its id until it says `ready`. `ready` means the path can be used. If it says ready with a warning, preparing the file failed and the original is used; tell the person.

## From the person's computer or phone

Call `uploadWidgetTool`. Only clients that can show an interactive panel display it. If it does not appear, ask the person for a public web address instead. What the person adds is listed by `uploadWidgetStatusTool` with the `sessionId` that `uploadWidgetTool` returned; a file whose status is `processing` is still being prepared, so ask again in about ten seconds. Do not call `uploadWidgetTicketTool`: only the panel uses it.

## Using the file

Pass the file's `path` in `attachments` of the post item. Platforms differ in how many files and what kinds they accept (for example a platform may want one video or up to four pictures); `integrationSchema` says which, so read it before you attach. When a platform's rules ask for pictures inside the text, use the path as the `src` of an `<img>` tag.

This plugin does not create pictures or videos with AI. If the person asks for one, say so and offer to use a file they already have.
