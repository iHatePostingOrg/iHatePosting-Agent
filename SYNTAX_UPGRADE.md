# Coming from another posting command line

A short note for people who have used other social-media posting command lines or scripts, and for scripts that have to be moved to `ihateposting-agent`. It lists the habits of this program that most often differ from what you may expect. Each point is something the program does today.

## Names

| Thing | Here |
| --- | --- |
| Program | `ihateposting-agent` |
| Commands | `group:action`, for example `posts:create`, `integrations:list`, `analytics:post` |
| Key variable | `IHATEPOSTING_API_KEY` |
| Address variable | `IHATEPOSTING_API_URL` (default `https://app.ihateposting.com/api`) |
| Sign-in server variable | `IHATEPOSTING_AUTH_SERVER` (or `--auth-server`) |
| Saved sign-in | `~/.ihateposting/credentials.json` |

The key is sent in the `Authorization` header exactly as it is. There is no `Bearer ` in front of it.

## Posts

**Pictures and videos are addresses, never local files.** `-m` takes the addresses of files that are already in your media library. Upload first, then use the `path` the upload printed:

```bash
ihateposting-agent upload ./photo.png
ihateposting-agent posts:create -i x-123 -c "Look" -m "<path from the upload>" -s 2026-12-15T10:00:00Z
```

`posts:create` never uploads anything.

**The date is always required.** `--date` (short `-s`) must be given unless the whole body comes from `--json`. There is no default and no "now". The program sends your text as typed; the server judges it.

**Only two types.** `-t schedule` (the default) and `-t draft`. Anything else is refused by the program before it asks the server. `posts:status <id> --status draft|schedule` moves an existing post between the two.

**Several `-c` make a thread or comments, several `-m` give each part its media.** The first `-m` goes with the first `-c`, the second with the second, whatever the order on the line. An empty `-m ""` keeps a part's place without media. `--alt` works the same and is split at commas, so alt texts that contain commas need a body file. `-d <minutes>` is the delay between parts and is applied to all of them.

**Settings are a JSON string.** `--settings '{"board":"1234567890"}'`. The same object goes to every channel in `-i`, so one command is for one platform; for several platforms in one go use a body file, where each entry of `posts` has its own `settings`. Do not include `__type`.

**Body files.** `--json <file>` (short `-j`) sends the file exactly as it is: nothing is added or changed. With it, the other post options (`-c`, `-i`, `-s`, ...) are ignored. The shape is:

```json
{
  "type": "draft",
  "date": "2026-12-15T10:00:00Z",
  "shortLink": true,
  "tags": [],
  "posts": [
    {
      "integration": { "id": "x-123" },
      "value": [{ "content": "Hello", "image": [{ "id": "img-1", "path": "https://media.example/uploads/photo.png" }], "delay": 0 }],
      "settings": {}
    }
  ]
}
```

Examples for each platform are in [examples/](examples/README.md). When the program builds the body from flags it also adds `"creationMethod": "CLI"`; a body file does not get that.

**Short links are on.** `--shortLink` defaults to `true`; turn it off with `--no-shortLink`.

## Option spellings

Options are handled by yargs, so a multi-word option can be written in camelCase or with dashes: `--startDate` or `--start-date`, `--release-id` or `--releaseId`, `--auth-server` or `--authServer`, `--no-shortLink` or `--no-short-link`.

Watch the short names, they are not the same everywhere:

| Short | `posts:create` | `posts:status` | `integrations:trigger` | `analytics:*` | `media:list` |
| --- | --- | --- | --- | --- | --- |
| `-s` | `--date` | `--status` | | | `--search` |
| `-d` | `--delay` (minutes) | | `--data` (JSON) | `--date` (days back) | |
| `-t` | `--type` | | | | |
| `-p` | | | | | `--page` |

## What the program prints

- Most commands print one **header line**, then the answer as indented JSON on standard output. A few differ: `posts:delete` prints only its header; `posts:missing`, `media:list` and `media:status` print only JSON. To parse the JSON in a script, skip the first line when there is a header (`... | sed 1d | jq ...`).
- Errors go to **standard error**: `❌ Failed to <what>: <why>`. For a refusal by the server the why is `Request failed: API Error (<status>): <the server's words>`.
- There is **one failure code**: every failure ends with exit code `1`. There are no other non-zero codes. The one command that reports without failing is `auth:status`, which prints its findings and ends with `0` even when the key is refused.
- Mistakes in the command line itself (a missing required option, a value that is not one of the choices) print the command's usage and the reason on standard error and end with `1`, without contacting the server.

## Things that are quiet, and things that wait

- A **command name the program does not know does nothing and exits `0`**, and an **option it does not know is ignored**. A typo such as `--setting` (instead of `--settings`) or `post:create` does not warn you. Check `--help` when a command seems to have no effect.
- Nothing is retried and nothing is waited out: a rate limit or a server error is shown once and the command ends.
- There is no time limit. A server that never answers is waited for; use your shell's `timeout` when a script must not hang.

## Quick translation

| You want to | Do this |
| --- | --- |
| Post text now-ish | `posts:create -i <id> -c "text" -s <a date a little ahead>` (there is no immediate mode) |
| Save without publishing | add `-t draft` |
| Attach a local picture | `upload ./pic.png`, then `-m "<returned path>"` |
| Reply chain or thread | repeat `-c` |
| Platform options | `--settings '<json>'`, after reading `integrations:settings <id>` |
| See what a platform allows | `integrations:settings <id>` (`output.rules`, `output.maxLength`, `output.settings`, `output.tools`) |
| Find an id for a setting | `integrations:trigger <id> <method>` |
| See what is scheduled | `posts:list` |
