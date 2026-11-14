# Features

Everything `ihateposting-agent` can do, grouped by what you are trying to get done, each with the exact command. The list of commands is the one that `ihateposting-agent --help` prints; every command talks to the public API of iHatePosting (`/public/v1/...`) and prints what the server answers.

A few words used throughout:

- A **channel** (the program's help says "integration") is one connected account of one platform, such as a Mastodon account or a YouTube channel. It has an **id**, which you pass to the commands, and an **identifier**, which names its platform (`x`, `youtube`, `pinterest`, ...).
- A **post** is one message for one channel; a post can have **comments** after it (for example the rest of a thread). Each part has its own text and its own pictures.
- A **customer** (also called a **group**) is a label your workspace may put on channels. It only narrows what the list commands show.

## Platforms

The identifiers that channels of this app can have:

`bluesky`, `mastodon`, `slack`, `facebook`, `telegram`, `x`, `linkedin`, `linkedin-page`, `tumblr`, `discord`, `pinterest`, `tiktok`, `youtube`, `gmb` (Google Business), `instagram`, `threads`.

That is fifteen platforms and sixteen identifiers: LinkedIn Page is a second kind of LinkedIn channel. Which of them your workspace has connected is shown by `integrations:list`. See [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md) for the settings each one takes.

## Authentication

| What you want | Command |
| --- | --- |
| Sign in with a code, no key to copy | `ihateposting-agent auth:login` |
| Sign in against another sign-in address | `ihateposting-agent auth:login --auth-server <address>` |
| See who is signed in and whether it still works | `ihateposting-agent auth:status` |
| Forget the saved sign-in | `ihateposting-agent auth:logout` |

`auth:login` works as a device code flow: it asks the sign-in server for a code, prints it in a box, tries to open the page where you type it, and then asks the server every few seconds until you have approved (or the code runs out). What it receives is kept in `~/.ihateposting/credentials.json` (the folder is created for you alone, the file is written with mode `0600`).

Instead of signing in you can set an API key in the environment, which suits servers and CI:

```bash
export IHATEPOSTING_API_KEY="<your-api-key>"
```

Order of precedence: a saved sign-in always wins over the environment key, and it brings its own API address with it (so `IHATEPOSTING_API_URL` is not used while a sign-in is saved). `auth:status` shows only the first eight characters of the key or token. `auth:logout` only deletes the local file; it does not tell the server anything.

## Channels and their rules

| What you want | Command |
| --- | --- |
| List the connected channels | `ihateposting-agent integrations:list` |
| List only the channels of one customer | `ihateposting-agent integrations:list --group <customer-id>` |
| List the customers | `ihateposting-agent integrations:groups` |
| Read a channel's rules, length limit, settings schema and helpers | `ihateposting-agent integrations:settings <channel-id>` |
| Run a helper that fetches a value only the platform knows | `ihateposting-agent integrations:trigger <channel-id> <method> -d '<json>'` |

`integrations:settings` is the command to run before you write anything for a channel: its answer holds `output.rules`, `output.maxLength`, `output.settings` and `output.tools`. The workflow is described in [INTEGRATION_SETTINGS_DISCOVERY.md](INTEGRATION_SETTINGS_DISCOVERY.md); the helpers in [INTEGRATION_TOOLS_WORKFLOW.md](INTEGRATION_TOOLS_WORKFLOW.md).

## Posts and threads

Create a post with flags:

```bash
ihateposting-agent posts:create -i <channel-id> -c "The words of the post" -s 2026-12-15T10:00:00Z
```

| What you want | Flags |
| --- | --- |
| Post to several channels at once | `-i <id>,<id>,<id>` |
| A thread, or a post followed by comments | repeat `-c`: `-c "First" -c "Second" -c "Third"` |
| Wait between the parts of a thread | `-d <minutes>` (applied to every part) |
| A draft that is kept but not published | `-t draft` |
| A scheduled post | `-t schedule` (the default) |
| Pictures or videos on a part | `-m "<address>,<address>"`, paired with the `-c` in the same position |
| Alt text for those pictures | `--alt "<text>,<text>"`, in the same order as the addresses |
| Settings of the platform | `--settings '<json>'` |
| Leave links in the text alone | `--no-shortLink` (short links are on by default) |
| Send a whole request body from a file | `--json <file>` (`-j`) |

Things that are easy to miss:

- **`--date` (`-s`) is always required**, unless you use `--json`. The CLI sends the text you typed without checking it; the server decides whether it is acceptable. An ISO 8601 date with a zone, such as `2026-12-15T10:00:00Z`, is what the help text asks for.
- **Nothing is uploaded by `posts:create`.** `-m` takes the addresses of files you already uploaded with `upload` (see below).
- **Pairing is by position.** The first `-m` belongs to the first `-c`, the second `-m` to the second `-c`, and so on, wherever on the line they are written. An empty `-m ""` keeps a place for a part that has no media. The same goes for `--alt`.
- **`--settings` is one object sent for every channel named with `-i`.** If you post to channels of different platforms, either run one command per platform or write a body file in which each channel has its own `settings`.
- **A body file is sent exactly as it is.** The CLI only adds `"creationMethod": "CLI"` (and `"tags": []`) to bodies it builds from flags. The shape is shown in [examples/](examples/README.md).

Work with posts that exist:

| What you want | Command |
| --- | --- |
| List posts (default window: 30 days back to 30 days ahead) | `ihateposting-agent posts:list` |
| List posts in a window | `ihateposting-agent posts:list --startDate <ISO date> --endDate <ISO date>` |
| List one customer's posts | `ihateposting-agent posts:list --customer <customer-id>` |
| Turn a post into a draft | `ihateposting-agent posts:status <post-id> --status draft` |
| Schedule a draft | `ihateposting-agent posts:status <post-id> --status schedule` |
| Change some settings of a post that has not gone out | `ihateposting-agent posts:settings <post-id> --settings '<json>'` |
| Delete a post | `ihateposting-agent posts:delete <post-id>` |

`posts:settings` sends only the keys you pass and the server merges them into what the post already has; leave out `__type`. `posts:delete` prints a single line and no JSON. Check with `posts:list` which post you are about to delete: the server's delete works on the post's group (the `posts:list` answer has a `group` field), so it may reach more than the one id you typed (unverified from this repository).

There is no command that edits the text of an existing post.

## Media

| What you want | Command |
| --- | --- |
| Upload a picture, video or other file | `ihateposting-agent upload <file>` |
| Ask the server to adjust the file to platform limits | `ihateposting-agent upload <file> --adjust` |
| Check whether an adjusted upload is ready | `ihateposting-agent media:status <media-id>` |
| List what is in the media library | `ihateposting-agent media:list [-s <text>] [-p <page>]` |

`upload` prints the server's answer, which includes the `id` and the `path` of the stored file. Use that `path` in `-m` (or in the `image` list of a body file). `media:list` shows 18 entries per page, newest first, and `-s` filters by the original file name. Which files are accepted is covered in [SUPPORTED_FILE_TYPES.md](SUPPORTED_FILE_TYPES.md).

## Analytics

| What you want | Command |
| --- | --- |
| A channel's analytics over the last 7 days | `ihateposting-agent analytics:platform <channel-id>` |
| Over another number of days | `ihateposting-agent analytics:platform <channel-id> -d 30` |
| One post's analytics (7 days by default) | `ihateposting-agent analytics:post <post-id>` |

`-d` is the number of days to look back. The commands print the server's answer as it is; an unpublished post has nothing for the platform to count, so its answer may be empty.

## Matching a post to the platform's own post

Post analytics need the platform's own identifier for the published post (the post's `releaseId`). When a post lacks it:

1. `ihateposting-agent posts:missing <post-id>` asks the server which content of the platform could be this post, and prints the answer (JSON only, no header line).
2. `ihateposting-agent posts:connect <post-id> --release-id <platform-id>` records the identifier you picked.

Whether a platform can offer candidates is up to the server; an empty list means it found none.

## What every command prints

Most commands print one header line (for example `✅ Post created successfully!`, `📋 Posts:`, `🔌 Connected Integrations:`) and then the answer as indented JSON on standard output. `posts:delete` prints only its header, and `posts:missing`, `media:list` and `media:status` print only the JSON. Errors go to standard error, as `❌ Failed to <what>: <why>`, and the exit code is `1`. When you parse the output in a script, skip the header line first. See [SYNTAX_UPGRADE.md](SYNTAX_UPGRADE.md) for the details.

## What it does not do

- No retries and no waiting: a refusal such as a rate limit is shown once and the command ends. There is no time limit either, so a server that never answers is waited for; wrap the command with your shell's `timeout` if that matters.
- No clipping commands.
- A command name the program does not know does nothing and ends with exit code `0`, and so does an option it does not know. Check the spelling against `--help`.
