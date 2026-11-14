# Quick start

Five minutes from nothing to a first draft post and a look at its analytics. Nothing below publishes anything: the post is made as a draft.

You need Node.js 20 or newer and an iHatePosting workspace with at least one connected channel.

## 1. Install

If the package is available on npm under this name:

```bash
npm install -g ihateposting-agent
```

Otherwise run it from a clone of this repository (see [HOW_TO_RUN.md](HOW_TO_RUN.md)):

```bash
git clone <this repository>
cd iHatePosting-Agent
npm install
node bin/ihateposting-agent.mjs --help
```

The rest of this page writes `ihateposting-agent`; from a clone, replace it with `node bin/ihateposting-agent.mjs`.

## 2. Sign in

```bash
ihateposting-agent auth:login
```

The command prints a code in a box and a web address, and tries to open that address in your browser (the code is added to the address, and you can also type it in by hand). Make sure the code on the page is the one in your terminal, approve, and the terminal says `✅ Successfully authenticated!` and where it saved your sign-in (`~/.ihateposting/credentials.json`).

On a server or in CI there is no browser; set a key instead:

```bash
export IHATEPOSTING_API_KEY="<your-api-key>"
```

On Windows PowerShell the same is `$env:IHATEPOSTING_API_KEY = "<your-api-key>"`. Keep the key out of scripts, shell history and logs.

Check that it works:

```bash
ihateposting-agent auth:status
```

It names the method (OAuth2 or API key), shows the first eight characters of the token, asks the server, and ends with `✅ Credentials are valid. <n> integration(s) connected.`

If a command says `No authentication found`, nobody is signed in. Its message also mentions `--client-id` and `--client-secret` after `auth:login`; the command reads neither of them, plain `auth:login` is all it needs.

## 3. Find a channel

```bash
ihateposting-agent integrations:list
```

You get a JSON list under the line `🔌 Connected Integrations:`. Each entry has an `id` (what you pass to the other commands), a `name` and an `identifier` (the platform). Copy the `id` of the channel you want to use; the examples here call it `<channel-id>`.

## 4. Read its rules

```bash
ihateposting-agent integrations:settings <channel-id>
```

Under `output` you will find `rules` (what the platform allows, in words, when the server has any), `maxLength` (the longest text for this channel), `settings` (the platform's own settings as a schema, or a sentence saying there are none) and `tools` (helpers you can run, when there are any). Write the post to fit. [INTEGRATION_SETTINGS_DISCOVERY.md](INTEGRATION_SETTINGS_DISCOVERY.md) explains how to read it.

## 5. Make a draft

```bash
ihateposting-agent posts:create \
  -i <channel-id> \
  -c "Hello from the command line" \
  -s 2026-12-15T10:00:00Z \
  -t draft
```

`-i` is the channel, `-c` the text, `-s` the date (always required) and `-t draft` keeps the post without publishing it. The answer, under `✅ Post created successfully!`, lists the post's id (`postId`) for each channel. Keep it.

Some platforms need a picture or a video, or settings, before a post is valid (Pinterest wants a board, YouTube a title and a video, Instagram an attachment...). The rules from step 4 and [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md) say which.

To attach a picture, upload it first and use the address it returns:

```bash
ihateposting-agent upload ./picture.png
ihateposting-agent posts:create -i <channel-id> -c "With a picture" -m "<path from the upload answer>" -s 2026-12-15T10:00:00Z -t draft
```

`-m` never uploads anything by itself; it only takes addresses of files already uploaded.

## 6. See it, change it

```bash
ihateposting-agent posts:list
```

lists the posts from 30 days ago to 30 days ahead. To schedule the draft when you are happy with it:

```bash
ihateposting-agent posts:status <post-id> --status schedule
```

## 7. Read analytics

```bash
ihateposting-agent analytics:platform <channel-id> -d 30
ihateposting-agent analytics:post <post-id>
```

The first shows the channel over the last 30 days (the default is 7). The second shows one post. A draft has not been published, so there is nothing yet for the platform to count and its answer may be empty; try it again after the post has gone out. If a published post still has no numbers, it may be missing the platform's own identifier: see `posts:missing` and `posts:connect` in [FEATURES.md](FEATURES.md).

## Where next

- [examples/](examples/README.md): ready-to-edit post bodies and scripts.
- [FEATURES.md](FEATURES.md): every command grouped by purpose.
- [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md): the settings of each platform.
- [SYNTAX_UPGRADE.md](SYNTAX_UPGRADE.md): the habits of this command line (date required, `-m` rule, exit codes).
