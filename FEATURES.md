# iHatePosting CLI - Feature Summary

## ✅ Complete Feature Set

### Posts with Comments and Media - FULLY SUPPORTED

The iHatePosting CLI **fully supports** the complete post structure of the API including:

#### ✅ Posts with Comments
- Main post content
- Multiple comments/replies
- Each comment can have different content
- Configurable delays between comments

#### ✅ Multiple Media per Post/Comment
- Each post can have **multiple images** (a list of media entries)
- Each comment can have **its own images** (a separate list for each part)
- Support for various image formats (PNG, JPG, JPEG, GIF)
- Media are the URLs that `upload` returns for files you uploaded first (`posts:create` uploads nothing)
- `media:list` finds already-uploaded files so their URLs can be reused

#### ✅ Multi-Platform Posting
- Post to multiple platforms in one request
- Platform-specific content for each integration
- Different media for different platforms

#### ✅ Advanced Features
- Scheduled posting with precise timestamps
- URL shortening support
- Tags and metadata (a `tags` list in a body file, and `--settings` for a platform's own settings)
- Delays between comments (in minutes)
- Draft mode for review before posting

## Usage Modes

### 1. Simple Mode (Command Line)

For quick, simple posts:

```bash
# Single post
ihateposting-agent posts:create -c "Hello!" -s "2024-12-31T12:00:00Z" -i "x-123"

# With multiple images
ihateposting-agent posts:create -c "Post" -m "img1.jpg,img2.jpg,img3.jpg" -s "2024-12-31T12:00:00Z" -i "x-123"

# With comments (one -c for each part; a -m after a part's -c gives that part its own media)
ihateposting-agent posts:create -c "Main" -c "Comment 1" -c "Comment 2" -s "2024-12-31T12:00:00Z" -i "x-123"
```

**Limitations of Simple Mode:**
- Cannot set a custom delay for each comment (`-d` writes the same number on every part)
- Cannot give two channels different content, media or settings (`--settings` is one object for every channel named)
- Cannot carry an alt text that contains a comma (`--alt` is split at commas)
- Cannot send a first part with no words (an empty `-c ""` is refused)

### 2. Advanced Mode (JSON Files)

For complex posts with comments that have their own delays, or a different post for each channel:

```bash
ihateposting-agent posts:create --json complex-post.json
```

**Capabilities:**
- ✅ Each comment can have different media
- ✅ Custom delays between comments
- ✅ Multiple posts to different platforms
- ✅ Platform-specific content and media
- ✅ Full control over the request: the file is sent exactly as written

## Real-World Examples

The addresses in `path` are placeholders. Use the `path` that `upload` printed for your own files, and ids from your own `integrations:list`.

### Example 1: Product Launch with Follow-up Comments

**Main Post:** Product announcement with 3 product images
**Comment 1:** Feature highlight with 1 feature screenshot (delay: 60 minutes)
**Comment 2:** Special offer with 1 promotional image (delay: 120 minutes)

```json
{
  "type": "schedule",
  "date": "2024-03-15T09:00:00Z",
  "shortLink": true,
  "tags": [],
  "posts": [{
    "integration": { "id": "x-123" },
    "value": [
      {
        "content": "🚀 Launching our new product!",
        "image": [
          { "id": "p1", "path": "https://media.example/uploads/product-1.jpg" },
          { "id": "p2", "path": "https://media.example/uploads/product-2.jpg" },
          { "id": "p3", "path": "https://media.example/uploads/product-3.jpg" }
        ],
        "delay": 0
      },
      {
        "content": "⭐ Key features you'll love:",
        "image": [
          { "id": "f1", "path": "https://media.example/uploads/features-screenshot.jpg" }
        ],
        "delay": 60
      },
      {
        "content": "🎁 Limited time: 50% off!",
        "image": [
          { "id": "o1", "path": "https://media.example/uploads/special-offer.jpg" }
        ],
        "delay": 120
      }
    ],
    "settings": {}
  }]
}
```

### Example 2: Tutorial Thread

**Main Post:** Introduction with overview image
**Tweets 2-5:** Step-by-step with different screenshots for each step

```json
{
  "type": "draft",
  "date": "2024-12-31T12:00:00Z",
  "shortLink": true,
  "tags": [],
  "posts": [{
    "integration": { "id": "x-123" },
    "value": [
      {
        "content": "🧵 How to use our CLI (1/5)",
        "image": [{ "id": "1", "path": "https://media.example/uploads/overview.jpg" }],
        "delay": 0
      },
      {
        "content": "Step 1: Installation (2/5)",
        "image": [{ "id": "2", "path": "https://media.example/uploads/step1.jpg" }],
        "delay": 2
      },
      {
        "content": "Step 2: Configuration (3/5)",
        "image": [{ "id": "3", "path": "https://media.example/uploads/step2.jpg" }],
        "delay": 2
      },
      {
        "content": "Step 3: First post (4/5)",
        "image": [{ "id": "4", "path": "https://media.example/uploads/step3.jpg" }],
        "delay": 2
      },
      {
        "content": "You're all set! 🎉 (5/5)",
        "image": [{ "id": "5", "path": "https://media.example/uploads/done.jpg" }],
        "delay": 2
      }
    ],
    "settings": {}
  }]
}
```

### Example 3: Multi-Platform Campaign

**Same event, different content per platform:**

```json
{
  "type": "schedule",
  "date": "2024-12-25T12:00:00Z",
  "shortLink": true,
  "tags": [],
  "posts": [
    {
      "integration": { "id": "x-123" },
      "value": [
        {
          "content": "Short, catchy Twitter post 🐦",
          "image": [{ "id": "t1", "path": "https://media.example/uploads/twitter-square.jpg" }],
          "delay": 0
        },
        {
          "content": "Thread continuation with details",
          "image": [{ "id": "t2", "path": "https://media.example/uploads/twitter-details.jpg" }],
          "delay": 5
        }
      ],
      "settings": {}
    },
    {
      "integration": { "id": "linkedin-456" },
      "value": [{
        "content": "Professional, detailed LinkedIn post with business context...",
        "image": [
          { "id": "l1", "path": "https://media.example/uploads/linkedin-wide.jpg" },
          { "id": "l2", "path": "https://media.example/uploads/linkedin-graph.jpg" }
        ],
        "delay": 0
      }],
      "settings": {}
    },
    {
      "integration": { "id": "facebook-789" },
      "value": [
        {
          "content": "Engaging Facebook post for family/friends audience",
          "image": [
            { "id": "f1", "path": "https://media.example/uploads/facebook-photo1.jpg" },
            { "id": "f2", "path": "https://media.example/uploads/facebook-photo2.jpg" },
            { "id": "f3", "path": "https://media.example/uploads/facebook-photo3.jpg" }
          ],
          "delay": 0
        },
        {
          "content": "More info in the comments!",
          "image": [{ "id": "f4", "path": "https://media.example/uploads/facebook-cta.jpg" }],
          "delay": 5
        }
      ],
      "settings": {}
    }
  ]
}
```

## API Structure Reference

### Complete request body

```typescript
{
  type: 'schedule' | 'draft',  // The -t flag takes only these two
  creationMethod?: 'CLI',      // Added by the program when it builds the body from flags; a body file does not get it
  date: string,                // ISO 8601 date
  shortLink: boolean,
  tags: Array<unknown>,        // [] when built from flags; the shape of an entry is not described here (unverified)
  posts: Array<{
    integration: {
      id: string             // From integrations:list
    },
    value: Array<{           // Main post + comments
      content: string,
      image: Array<{         // Multiple images per post/comment
        id: string,          // From flags: a short random string made up by the program
        path: string,        // The path that upload returned
        alt?: string
      }>,
      delay: number          // Minutes
    }>,
    settings: object         // The platform's own settings, {} for none. Never add __type
  }>
}
```

## For AI Agents

### When to Use Simple Mode
- Quick single posts
- No need for a different delay on each part
- Posting to 1-2 platforms
- Same content across platforms

### When to Use Advanced Mode (JSON)
- ✅ **Parts need their own delays**
- ✅ Multi-platform with different content
- ✅ Threads with step-by-step images
- ✅ Timed follow-up comments
- ✅ Complex campaigns

### AI Agent Tips

1. **Generate JSON programmatically** - Don't write JSON manually
2. **Validate structure** - The program checks nothing in a body file; use TypeScript types or JSON schema
3. **Test with "draft" type** - Review before posting
4. **Use unique image IDs** - Generate with UUID or random strings
5. **Set appropriate delays** - The unit is minutes (`-d` and `delay`); `0` means no wait

## Files and Documentation

- **examples/post-with-comments-and-media.json** - Post with comments and media (two pictures with alt text, a comment with its own picture, a comment without one)
- **examples/multi-platform-with-settings.json** - Multi-platform campaign, each platform with its own settings
- **examples/thread-post.json** - X thread example
- **examples/EXAMPLES.md** - Each sample explained, with more scenarios
- **SKILL.md** - Full AI agent usage guide
- **README.md** - Installation and basic usage

## Summary

### Question: Does it support posts with comments, each with media?

**Answer: YES! ✅**

- ✅ Posts can have multiple comments
- ✅ Each comment can have its own media (multiple images)
- ✅ Each post can have multiple images
- ✅ Use JSON files for full control
- ✅ See examples/ directory for working templates
- ✅ Fully compatible with the iHatePosting API structure

The CLI supports the **complete post request of the iHatePosting API**: a body file is sent exactly as written.

## Sections that were in this file before it followed the reference

This file now follows the reference page's headings (the owner's decision, 2026-11-15). These sections have no counterpart there, so they moved here unchanged (each one is a third-level heading here; the first one carries the text that stood under the title).

### Introduction

What `ihateposting-agent` does, grouped by what you are trying to get done, with the exact command for each. The list of commands is the one that `ihateposting-agent --help` prints. Every command talks to the public API of iHatePosting (`/public/v1/...`) and prints what the server answers.

Three words are used throughout:

- A **channel** (the program's help says "integration") is one connected account on one platform, such as a Mastodon account or a YouTube channel. It has an **id**, which you pass to the commands, and an **identifier**, which names its platform (`x`, `youtube`, `pinterest`, ...).
- A **post** is the message for one channel. It can be followed by **comments**, for example the rest of a thread. Each part has its own text and its own pictures.
- A **customer** (also called a **group**) is a label your workspace may put on channels. It only narrows what the list commands show.

### At a glance

- **Posts with comments**, each part with its own text and its own list of pictures or videos, and alt text matched to the pictures.
- **Many channels at once.** One command can name several channels; each gets its own post.
- **Scheduled posts and drafts.** A draft is kept without being published; a status command moves a post between draft and scheduled.
- **A delay between the parts of a thread**, in minutes, and **link shortening** (on by default, off with a flag).
- **Each platform's own settings** (a Pinterest board, a YouTube title, a TikTok privacy level), as a JSON string or inside a body file.
- **Discovery.** The rules, the length limit, the settings schema and the helpers of every channel can be read before anything is written. Helpers look up values that only the platform knows: boards, Slack or Discord rooms, a company page to tag.
- **A media library:** upload, list, search and reuse files.
- **Analytics** for a channel and for a post, and a way to tell iHatePosting which post on the platform is yours when it could not learn that itself.
- **Two ways to sign in:** a code that a person approves in a browser, or a key in the environment.

### Platforms

The identifiers that channels of this app can have: `bluesky`, `mastodon`, `slack`, `facebook`, `telegram`, `x`, `linkedin`, `linkedin-page`, `tumblr`, `discord`, `pinterest`, `tiktok`, `youtube`, `gmb` (Google Business), `instagram`, `threads`.

That is fifteen platforms and sixteen identifiers: LinkedIn Page is a second kind of LinkedIn channel. `integrations:list` shows which of them your workspace has connected, and [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md) the settings each one takes.

### Authentication

| What you want | Command |
| --- | --- |
| Sign in with a code, no key to copy | `ihateposting-agent auth:login` |
| Sign in against another sign-in address | `ihateposting-agent auth:login --auth-server <address>` |
| See who is signed in and whether it still works | `ihateposting-agent auth:status` |
| Forget the saved sign-in | `ihateposting-agent auth:logout` |

`auth:login` follows the device code pattern. It asks the sign-in server for a code, prints the code in a box, tries to open the page where a person types it, and then asks the server every few seconds until the person has approved or the code has run out. What comes back is kept in `~/.ihateposting/credentials.json` (the folder is made for you alone and the file is written with mode `0600`).

For servers and scheduled jobs, set a key in the environment instead: `export IHATEPOSTING_API_KEY="<your-api-key>"`.

A saved sign-in always wins over the key in the environment, and it brings its own API address with it (so `IHATEPOSTING_API_URL` is not used while a sign-in is saved). `auth:status` shows only the first eight characters of the key or token. `auth:logout` only deletes the local file; it tells the server nothing.

### Channels and their rules

| What you want | Command |
| --- | --- |
| List the connected channels | `ihateposting-agent integrations:list` |
| List only the channels of one customer | `ihateposting-agent integrations:list --group <customer-id>` |
| List the customers | `ihateposting-agent integrations:groups` |
| Read a channel's rules, length limit, settings schema and helpers | `ihateposting-agent integrations:settings <channel-id>` |
| Run a helper that fetches a value only the platform knows | `ihateposting-agent integrations:trigger <channel-id> <method> -d '<json>'` |

`integrations:settings` is the command to run before you write anything for a channel. Its answer holds `output.rules`, `output.maxLength`, `output.settings` and `output.tools`. How to read it is in [INTEGRATION_SETTINGS_DISCOVERY.md](INTEGRATION_SETTINGS_DISCOVERY.md); the helpers are in [INTEGRATION_TOOLS_WORKFLOW.md](INTEGRATION_TOOLS_WORKFLOW.md).

### Posts and threads

The options of `posts:create`:

| What you want | Flags |
| --- | --- |
| Post to several channels at once | `-i <id>,<id>,<id>` (write `-i` once) |
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

- **`--date` (`-s`) is always required**, unless you use `--json`. The program sends the text you typed without checking it; the server decides whether it is acceptable. An ISO 8601 date with a zone, such as `2026-12-15T10:00:00Z`, is what the help text asks for.
- **Nothing is uploaded by `posts:create`.** `-m` takes the addresses of files you already uploaded with `upload` (see below).
- **Pairing is by position.** The first `-m` belongs to the first `-c`, the second `-m` to the second `-c`, and so on. A part without media that comes before one with media needs an empty `-m ""` to keep its place. The same goes for `--alt`.
- **A body file is sent exactly as it is.** The program only adds `"creationMethod": "CLI"` to bodies it builds from flags. Samples are in [examples/](examples/README.md).

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

`posts:settings` sends only the keys you pass and the server merges them into what the post already has; leave out `__type`. `posts:delete` prints a single line and no JSON. The server's delete works on the post's group (the `posts:list` answer has a `group` field): it takes the post with the comments that follow it, and, as far as the app's code says, not the same command's posts on other channels (read from the code, not tried on a live account). Check with `posts:list` before you delete.

There is no command that edits the text of an existing post. For one that has not gone out, delete it and create it again.

### Media

| What you want | Command |
| --- | --- |
| Upload a picture, video or other file | `ihateposting-agent upload <file>` |
| Ask the server to adjust the file to platform limits | `ihateposting-agent upload <file> --adjust` |
| Check whether an adjusted upload is ready | `ihateposting-agent media:status <media-id>` |
| List what is in the media library | `ihateposting-agent media:list [-s <text>] [-p <page>]` |

`upload` prints the server's answer, which includes the `id` and the `path` of the stored file. Use that `path` in `-m` (or in the `image` list of a body file). `media:list` shows 18 entries per page, newest first, and `-s` filters by the original file name. Which files are accepted is covered in [SUPPORTED_FILE_TYPES.md](SUPPORTED_FILE_TYPES.md).

### Analytics

| What you want | Command |
| --- | --- |
| A channel's analytics over the last 7 days | `ihateposting-agent analytics:platform <channel-id>` |
| Over another number of days | `ihateposting-agent analytics:platform <channel-id> -d 30` |
| One post's analytics (7 days by default) | `ihateposting-agent analytics:post <post-id>` |

`-d` is the number of days to look back. The commands print the server's answer as it is; a post that has not been published has nothing for the platform to count, so its answer may be empty.

Post analytics need the platform's own identifier for the published post (the post's `releaseId`). When a post lacks it, `analytics:post` answers `{"missing": true}`, and you can fix that in two steps:

1. `ihateposting-agent posts:missing <post-id>` asks the server which content on the platform could be this post, and prints the answer (JSON only, no header line).
2. `ihateposting-agent posts:connect <post-id> --release-id <platform-id>` records the identifier you picked.

Whether a platform can offer candidates is up to the server; an empty list means it found none.

### What every command prints

Most commands print one header line (for example `✅ Post created successfully!`, `📋 Posts:`, `🔌 Connected Integrations:`) and then the answer as indented JSON on standard output. `posts:delete` prints only its header, and `posts:missing`, `media:list` and `media:status` print only the JSON. Errors go to standard error, as `❌ Failed to <what>: <why>`, and the exit code is `1`. When you parse the output in a script, skip the header line first (`tail -n +2`). See [SYNTAX_UPGRADE.md](SYNTAX_UPGRADE.md) for the details.

### What it does not do

- No retries and no waiting: a refusal such as a rate limit is shown once and the command ends. There is no time limit either, so a server that never answers is waited for; wrap the command with your shell's `timeout` if that matters.
- No command that edits the text of an existing post.
- A command name the program does not know does nothing and ends with exit code `0`, and so does an option it does not know. Check the spelling against `--help`.
