---
name: get-started
description: Set up and first use of iHatePosting in the conversation. Use when the person has just added the plugin, asks what it can do, asks which channels are connected, or is not sure how to start posting.
---

# Get started with iHatePosting

iHatePosting publishes to the social channels the person has already connected in their iHatePosting account. You work through the plugin's tools; you never ask for, repeat or store a password or a key.

## First steps

1. Call `integrationList` and show the person their channels: the platform and the name of each, and which are switched off. If a customer or group name was mentioned, call `groupList` first and pass the group's id to `integrationList`.
2. If the list is empty, say so plainly and offer a link to connect one: call `integrationConnectTool` with the platform, and the person opens the link in a browser and approves the access on the platform (Bluesky and Telegram are added inside iHatePosting). They can come back when at least one is connected.
3. Offer three starting points in one short line each: draft a post, schedule a post for a date, or look at what is already scheduled.

## What the plugin can do

- Draft, schedule or publish a post on one or more channels (the `schedule-posts` skill).
- List posts, change the settings of a post that has not gone out, or delete a post (the `manage-scheduled-posts` skill).
- Put a picture or video into the media library from a public web address, or from the person's own computer where the client shows an upload panel (the `create-post-media` skill).

## What it cannot do

- Connect a new channel, write pictures or videos with AI, or recall a post that is already live on a platform.

## Ground rules

- Nothing is published unless the person clearly asked to publish now. When they did not say, make a draft and say it is a draft.
- Say which channels a post will go to, and when, before you send it.
- Tool errors come back in words in the tool's answer. Read them, fix what they name, and try again; do not retry the same call unchanged.
