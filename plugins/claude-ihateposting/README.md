# iHatePosting for Claude Code

This plugin gives Claude a skill for iHatePosting, a service that schedules and publishes social media posts. With it Claude can draft, schedule and publish posts on the channels you have connected in iHatePosting, upload pictures and videos, read analytics and look up each platform's rules. It covers 15 platforms: X, LinkedIn (profiles and pages), Instagram, Facebook, Threads, YouTube, TikTok, Pinterest, Bluesky, Mastodon, Google Business, Discord, Slack, Telegram and Tumblr.

The plugin is only a skill: one text file, `skills/ihateposting/SKILL.md`. It has no hooks, no scripts and no bundled server. Everything the skill makes Claude do goes through the `ihateposting-agent` command line, which you install yourself from npm. The skill asks Claude to install it when it is missing.

## Install

In Claude Code, add this repository as a marketplace and install the plugin from it:

```
/plugin marketplace add iHatePostingOrg/iHatePosting-Agent
/plugin install ihateposting@ihateposting-agent
```

## What it runs, sends and fetches

- It runs the `ihateposting-agent` command, which the skill tells Claude to install with `npm install -g ihateposting-agent` when it is not there. The command is open source in the same repository.
- The command talks to iHatePosting's API at `https://app.ihateposting.com/api`, and only when you ask for something that needs it. It sends your posts, files you ask it to upload, and the key or sign-in token that identifies your workspace.
- It reads your key from the `IHATEPOSTING_API_KEY` variable, or from the file `~/.ihateposting/credentials.json` that `ihateposting-agent auth:login` writes after you approve the sign-in in your browser. The key itself is made under Settings, Agents / Dev in iHatePosting.
- Nothing is sent anywhere else, and the plugin changes nothing on your computer by itself.

## More

The command line, its options and the other ways to connect an agent are in the [repository README](https://github.com/iHatePostingOrg/iHatePosting-Agent#readme). Licence: MIT, see `LICENSE`.
