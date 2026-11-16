# Supported File Types for Upload

The iHatePosting CLI correctly detects and uploads various media types.

## How It Works

The CLI automatically detects the MIME type based on the file extension:

```bash
ihateposting-agent upload video.mp4
# ✅ Detected as: video/mp4

ihateposting-agent upload image.png
# ✅ Detected as: image/png

ihateposting-agent upload audio.mp3
# ✅ Detected as: audio/mpeg
```

The program does not print the type it chose: it sends the type to the server together with the file, and the comments above say what is sent. It looks at the name of the file only, never at what is inside.

## Supported File Types

The CLI recognises every extension in the tables below: it sends the MIME type shown, whatever the server then does with the file. **Supported** says whether the app's media library takes the type. That is how the app was last read, and it is unverified from this repository: a refused upload shows the server's own reason (see Troubleshooting). A type the app takes may still be refused by the platform you post to.

### Images

| Extension | MIME Type | Supported |
|-----------|-----------|-----------|
| `.png` | `image/png` | ✅ Yes |
| `.jpg`, `.jpeg` | `image/jpeg` | ✅ Yes |
| `.gif` | `image/gif` | ✅ Yes |
| `.webp` | `image/webp` | ✅ Yes |
| `.bmp` | `image/bmp` | ✅ Yes |
| `.svg` | `image/svg+xml` | ❌ No |
| `.ico` | `image/x-icon` | ❌ No |

**Examples:**
```bash
ihateposting-agent upload photo.jpg
ihateposting-agent upload logo.png
ihateposting-agent upload animation.gif
```

### Videos

| Extension | MIME Type | Supported |
|-----------|-----------|-----------|
| `.mp4` | `video/mp4` | ✅ Yes |
| `.mov` | `video/quicktime` | ❌ No |
| `.avi` | `video/x-msvideo` | ❌ No |
| `.mkv` | `video/x-matroska` | ❌ No |
| `.webm` | `video/webm` | ❌ No |
| `.flv` | `video/x-flv` | ❌ No |
| `.wmv` | `video/x-ms-wmv` | ❌ No |
| `.m4v` | `video/x-m4v` | ❌ No |
| `.mpeg`, `.mpg` | `video/mpeg` | ❌ No |
| `.3gp` | `video/3gpp` | ❌ No |

**Examples:**
```bash
ihateposting-agent upload video.mp4
```

### Audio

| Extension | MIME Type | Supported |
|-----------|-----------|-----------|
| `.mp3` | `audio/mpeg` | ❌ No |
| `.wav` | `audio/wav` | ❌ No |
| `.ogg` | `audio/ogg` | ❌ No |
| `.aac` | `audio/aac` | ❌ No |
| `.flac` | `audio/flac` | ❌ No |
| `.m4a` | `audio/mp4` | ❌ No |

The CLI labels these files, but the app's media library takes only pictures and MP4 videos, so, as last read, the server refuses an upload of one.

### Documents

| Extension | MIME Type | Supported |
|-----------|-----------|-----------|
| `.pdf` | `application/pdf` | ❌ No |
| `.doc` | `application/msword` | ❌ No |
| `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | ❌ No |

The CLI labels these files, but the app's media library takes only pictures and MP4 videos, so, as last read, the server refuses an upload of one.

### Other Files

For file types not listed above, the CLI uses:
- MIME type: `application/octet-stream`
- This is a generic binary file type

The program still uploads the file; the server decides. The app, as last read, also takes AVIF and TIFF pictures, which are not listed above: the CLI sends them as `application/octet-stream`, and the app judges a file by what is inside it (unverified).

## Usage Examples

### Upload an Image

```bash
ihateposting-agent upload ./images/photo.jpg
```

Response (after the header line `✅ File uploaded successfully!`):
```json
{
  "id": "media-123",
  "name": "photo.jpg",
  "originalName": "photo.jpg",
  "path": "https://media.example/uploads/photo.jpg",
  "thumbnail": null,
  "alt": null,
  "status": "ready"
}
```

These are placeholder values, as the app describes the answer; the exact fields are the server's.

### Upload a Video (MP4)

```bash
ihateposting-agent upload ./videos/promo.mp4
```

Response (abridged):
```json
{
  "id": "media-456",
  "name": "promo.mp4",
  "originalName": "promo.mp4",
  "path": "https://media.example/uploads/promo.mp4",
  "status": "ready"
}
```

### Upload and Use in Post

```bash
# 1. Upload the file (tail skips the header line)
RESULT=$(ihateposting-agent upload video.mp4 | tail -n +2)
echo "$RESULT"

# 2. Extract the path (you'll need jq or similar)
MEDIA_PATH=$(echo "$RESULT" | jq -r '.path')

# 3. Use in a post
ihateposting-agent posts:create \
  -c "Check out my video!" \
  -m "$MEDIA_PATH" \
  -s "2024-12-31T12:00:00Z" \
  -t draft \
  --settings '{"content_posting_method":"DIRECT_POST","privacy_level":"SELF_ONLY","duet":false,"stitch":false,"comment":false,"autoAddMusic":"no","brand_content_toggle":false,"brand_organic_toggle":false}' \
  -i "tiktok-123"
```

TikTok needs its eight required settings even for a quick post (see [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md)). The variable is called `MEDIA_PATH` and not `PATH`: assigning `PATH` would break the shell, which uses it to find commands.

### Upload Multiple Files

The command takes one file per run, so run it once for each file:

```bash
# Upload images
ihateposting-agent upload image1.jpg
ihateposting-agent upload image2.png
ihateposting-agent upload image3.gif

# Upload videos
ihateposting-agent upload video1.mp4
ihateposting-agent upload video2.mp4
```

## What Changed (Fix)

Nothing had to be fixed in this program: this is how it labels a file.

### Before (❌ Bug)

There is no such bug here, so there is no "before" to show: the program does not default to `image/jpeg` for a file it does not know.

### After (✅ Fixed)

```bash
ihateposting-agent upload video.mp4
# ✅ Correctly detected as: video/mp4

ihateposting-agent upload audio.mp3
# ✅ Correctly detected as: audio/mpeg

ihateposting-agent upload document.pdf
# ✅ Correctly detected as: application/pdf

ihateposting-agent upload notes.xyz
# ✅ An unknown extension is sent as: application/octet-stream
```

## Platform-Specific Notes

These are the gist of each platform's rules text (`output.rules` of `integrations:settings`); read that text for the exact version. The program does not know these rules: they are here so you can decide what to upload. Whatever a platform allows, the app's media library takes only the pictures and the MP4 videos named above.

### TikTok
- Supports: one video, or one or more pictures; never none
- Video type: MP4 (the only video type the app takes)
- Recommended: MP4

### YouTube
- Supports: one video; never empty
- Video type: MP4 (the only video type the app takes)
- Recommended: MP4

### Instagram
- Supports: at least one attachment; a story only one picture
- Video type: MP4 (the only video type the app takes)
- Recommended: MP4 for videos

### Twitter/X
- Supports: up to four pictures, or one video, or none
- Video type: MP4 (the only video type the app takes)

### LinkedIn
- Supports (LinkedIn and LinkedIn Page): one attachment when it is a video; a carousel needs at least two pictures and nothing else
- Video type: MP4 (the only video type the app takes)
- Documents (PDF, DOC, DOCX): not accepted by the app's media library

## Troubleshooting

### "Upload failed: Unsupported file type"

The app's media library takes only a short list of types (see the tables above), and a platform may accept fewer. A refused upload prints `❌ Failed to upload file: Upload failed (<status>): <the server's words>`. The words after the status are the server's, so how a refusal for the type is worded is the server's too.

**Solution:** Convert the file to a supported format:

```bash
# Convert video to MP4
ffmpeg -i video.avi video.mp4

# Then upload
ihateposting-agent upload video.mp4
```

### File Size Limits

The program sets no limit of its own: it reads the whole file into memory and sends it (its tests upload a 50 MB file to a stand-in server without trouble). The limits that count are the app's and the platforms':

- **The app's media library**: pictures up to about 10 MB, videos up to about 1 GB (as last read; unverified from this repository)
- **Each platform** has limits of its own, which are not checked here (unverified)

### "MIME type mismatch"

If you renamed a file with the wrong extension:

```bash
# ❌ Wrong: PNG file renamed to .jpg
mv image.png image.jpg
ihateposting-agent upload image.jpg  # Might fail

# ✅ Correct: Keep original extension
ihateposting-agent upload image.png
```

The program prints no message of that name: it labels the file by its extension (here `image/jpeg`) and never looks inside it. The app, as last read, judges a file by what is inside, so a mismatch can only show up as a refusal from the server (unverified).

## Testing File Upload

```bash
# Set API key
export IHATEPOSTING_API_KEY=your_key

# Test image upload
ihateposting-agent upload test-image.jpg

# Test video upload
ihateposting-agent upload test-video.mp4
```

## Error Messages

### File Not Found
```
❌ Failed to upload file: ENOENT: no such file or directory, open '<path>'
```

**Solution:** Check the file path is correct.

### No Permission
```
❌ Failed to upload file: EACCES: permission denied, open '<path>'
```

**Solution:** Check file permissions:
```bash
chmod 644 your-file.mp4
```

### Invalid API Key
```
❌ Failed to upload file: Upload failed (401): <the server's words>
```

**Solution:** Set your API key:
```bash
export IHATEPOSTING_API_KEY=your_key
```

A sign-in saved by `ihateposting-agent auth:login` is used before the variable. `ihateposting-agent auth:status` shows which one is in use and whether it is still valid.

## Summary

✅ **28 file extensions recognised**
✅ **Automatic MIME type detection**
✅ **Images, videos, audio, documents recognised** (the app's media library takes pictures and MP4 videos)
✅ **Correct labelling of MP4, MOV, MP3, etc.**
✅ **No defaulting to JPEG!**

**The CLI labels every upload by its extension!** 🎉

## Sections that were in this file before it followed the reference

These sections come unchanged from this file as it was before it followed the reference. They are kept because they hold points the reference's text does not.

### Files you can upload

`ihateposting-agent upload <file>` sends a file to your workspace's media library, and the answer gives you the address (`path`) to use in posts.

```bash
ihateposting-agent upload ./photo.png
ihateposting-agent upload ./clip.mp4 --adjust
```

### What the program does

1. It reads the whole file into memory. It checks nothing about size, content or name. An empty file is sent as it is.
2. It takes the file's **name** from the path you typed: everything after the last `/`. On Windows, write the path with forward slashes (`C:/pictures/photo.png`) or change to the folder first (`cd C:\pictures`, then `upload ./photo.png`); with backslashes the whole path would be sent as the name.
3. It chooses a **content type** from the name's extension, the text after the last `.`, in lower case (so `PHOTO.PNG` and `photo.png` are the same). The tables above are the complete list. An extension that is not in the list, or no extension at all, is sent as `application/octet-stream` (plain bytes).
4. It sends the file as a form (`multipart/form-data`) with the field `file`. With `--adjust` it adds a field `adjust` with the value `true`; without the flag the field is not sent.
5. It prints `✅ File uploaded successfully!` and the server's JSON. On a refusal it prints `❌ Failed to upload file: Upload failed (<status>): <the server's words>` and exits with `1`.

The program never refuses a file because of its type. The server may.

Only the first path counts: `upload a.png b.png` uploads `a.png` and ignores the second word. To upload several files, run the command once per file (see below).

### How the type is chosen

The program looks at the name, never at the bytes. A few cases show what that means:

| You type | Sent as | Why |
| --- | --- | --- |
| `upload ./photo.png` | `image/png` | `.png` is in the table |
| `upload ./PHOTO.PNG` | `image/png` | the extension is lowered first |
| `upload ./holiday.final.jpeg` | `image/jpeg` | only the text after the last `.` counts |
| `upload ./.png` | `image/png` | a name that is only an extension still has one |
| `upload ./archive.tar.gz` | `application/octet-stream` | `gz` is not in the table |
| `upload ./README` | `application/octet-stream` | no extension |
| `upload ./photo.heic` | `application/octet-stream` | `heic` is not in the table |
| `upload ./photo.png` that is really a JPEG inside | `image/png` | the bytes are not looked at |

### What the server decides (unverified from this repository)

This repository holds only the command line, so these points are **not** verified here and you should confirm them against your server:

- **Which file types are accepted.** The server may refuse some of the types above, and an upload answered with `Upload failed (<status>)` shows its reason. The media library of the app, as last read, takes only a short list of pictures and videos (JPEG, PNG, GIF, WebP, AVIF, BMP, TIFF and MP4), and judges a file by its content, not by the extension the program labelled it with. On such a server, a `.mov`, `.webm`, `.pdf` or `.mp3` is refused even though the program recognises it.
- **The largest file it accepts.** The program itself sets no limit; its tests upload a 50 MB file to a stand-in server without trouble. The app, as last read, limits pictures to about 10 MB and videos to about 1 GB. Check your own server.
- **What `--adjust` does.** The program's help describes it as scaling videos to 1080p and re-encoding them to MP4, and scaling oversized pictures down. What a given server does with the `adjust` field is up to that server. A server that does no adjusting may accept the field, store the file unchanged and report it as ready at once. The help also says to wait until `media:status <media-id>` reports `ready` before using the returned `path`, so that the post does not use the original file.
- **Which of these files a platform accepts in a post.** Each platform's rules (`output.rules` of `integrations:settings`) say what it expects; the table in the next section gives the gist.

### What the platforms ask for

The program does not know these rules; it is here so you can decide what to upload. The words come from the rules text that `integrations:settings` prints for each channel, so read that text for the exact version.

| Platform | The rules say |
| --- | --- |
| Bluesky | One video, or up to four pictures, or none |
| Facebook | Text only, pictures or a video; a story needs at least one picture or video |
| X | Up to four pictures, or one video, or none |
| LinkedIn, LinkedIn Page | One attachment when it is a video; a carousel needs at least two pictures and nothing else |
| Pinterest | At least one; a video pin has the video and a cover picture; up to five pictures |
| TikTok | One video, or one or more pictures; never none |
| YouTube | One video; never empty |
| Google Business | Text and, optionally, one picture |
| Instagram | At least one attachment; a story only one picture |
| Mastodon, Telegram, Threads, Slack, Discord, Tumblr | No rules text about attachments in the schemas the app publishes |

### Using the result in a post

`upload` prints an object with (among other things) an `id` and a `path`. As the app describes it, the answer looks like this (placeholder values; the exact fields are the server's):

```json
{
  "id": "media-123",
  "name": "photo.png",
  "originalName": "photo.png",
  "path": "https://media.example/uploads/photo.png",
  "thumbnail": null,
  "alt": null,
  "status": "ready"
}
```

Use the `path`:

```bash
ihateposting-agent upload ./photo.png
# note the "path" in the answer, then:
ihateposting-agent posts:create -i <channel-id> -c "A photo" -m "<that path>" -s 2026-12-15T10:00:00Z -t draft
```

`posts:create` never uploads. Whatever you give to `-m` is sent as the text you typed; only addresses of files that are already uploaded are meant to go there, not names of files on your disk.

A video is attached the same way as a picture. A pin that needs a cover picture next to its video lists both. For several files, upload each one and give the paths to `-m` separated by commas (`-m "<path1>,<path2>"`), or put them in the `image` list of a body file (see [examples/post-with-comments-and-media.json](examples/post-with-comments-and-media.json)). Alt texts go with `--alt "<text1>,<text2>"`, in the same order as the paths.

#### Uploading several files

The program takes one file per run, so loop in your shell:

```bash
#!/usr/bin/env bash
set -euo pipefail

CHANNEL_ID="${CHANNEL_ID:?Set CHANNEL_ID to a channel id from integrations:list}"
paths=""
for file in ./one.png ./two.png ./three.png; do
  path="$(ihateposting-agent upload "$file" | tail -n +2 | node -p 'JSON.parse(require("fs").readFileSync(0, "utf8")).path')"
  paths="${paths:+$paths,}$path"
done

ihateposting-agent posts:create -i "$CHANNEL_ID" -c "Three photos" -m "$paths" -s 2026-12-15T10:00:00Z -t draft
```

The `tail -n +2` removes the header line before Node reads the JSON. In PowerShell:

```powershell
$lines = ihateposting-agent upload ./photo.png
$answer = ($lines | Select-Object -Skip 1) -join "`n" | ConvertFrom-Json
$answer.path
```

### Adjusting a file and waiting for it

`--adjust` asks the server to fit the file to the platforms' limits after the upload. The program's help says to wait for `ready` before you publish with the returned path. `media:status` takes the `id` from the upload answer and prints only JSON:

```bash
ihateposting-agent upload ./video.mp4 --adjust
ihateposting-agent media:status <media-id>
```

While the status is `processing`, poll. A polling loop that gives up after five minutes:

```bash
#!/usr/bin/env bash
set -euo pipefail

id="$(ihateposting-agent upload ./video.mp4 --adjust | tail -n +2 | node -p 'JSON.parse(require("fs").readFileSync(0, "utf8")).id')"

for attempt in $(seq 1 60); do
  status="$(ihateposting-agent media:status "$id" | node -p 'JSON.parse(require("fs").readFileSync(0, "utf8")).status')"
  echo "attempt $attempt: $status"
  if [ "$status" = "ready" ]; then
    exit 0
  fi
  sleep 5
done
echo "The file was not ready after five minutes." >&2
exit 1
```

Without `--adjust` there is nothing to wait for.

### Checking and finding uploads

```bash
ihateposting-agent media:list                 # newest first, 18 per page
ihateposting-agent media:list -s banner -p 2  # name contains "banner", page 2
ihateposting-agent media:status <media-id>    # for a file uploaded with --adjust
```

Both print JSON only, without a header line. As the app describes it, `media:list` answers an object with `pages` (how many pages there are) and `results` (the files of the page you asked for). The search is on the name the file was uploaded with, and it ignores upper and lower case. A page number of `0`, or one that is not a number (`abc`), is left out of the request, so you get the first page.

### Before you upload: a short checklist

1. The path points at a file, not a folder, and it is written with forward slashes on Windows.
2. The extension matches what the file really is. The program labels by name, and a server may check the content.
3. The type suits the platform. Look at the table above, or at `output.rules` of `integrations:settings`.
4. The size is reasonable. The program sets no limit, but the server and the platform do.
5. You will keep the `path` (and the `id`, if you use `--adjust`) from the answer.
6. The first post that uses the file is a draft.

### If an upload fails

| Message | What to try |
| --- | --- |
| `❌ Failed to upload file: ENOENT: no such file or directory, open '<path>'` | The path is wrong, relative to the folder where you ran the command. |
| `❌ Failed to upload file: EISDIR: illegal operation on a directory, read` | You gave a folder. Name a file. |
| `❌ Failed to upload file: EACCES: permission denied, open '<path>'` | The file exists but your user cannot read it. Check its permissions. |
| `❌ Failed to upload file: Upload failed (<status>): <body>` | The server refused the file. The body, as the server sent it, is printed unchanged. A different format or a smaller file are the usual remedies. |
| `❌ Failed to upload file: request to <address> failed, reason: ...` | The address could not be reached. Check `IHATEPOSTING_API_URL` and your network. |
| `❌ Failed to upload file: Invalid URL` | `IHATEPOSTING_API_URL` is not a web address. |
| `❌ Error: No authentication found.` | Sign in first (`auth:login`) or set `IHATEPOSTING_API_KEY`. |
| The usage text, then `Not enough non-option arguments: got 0, need at least 1` | You left out the file. |
| `❌ Failed to get media status: Request failed: API Error (<status>): ...` | `media:status` was refused; for example the id is not one of your workspace's files. |
| A very large file takes long, or uses a lot of memory | The whole file is read into memory first and there is no time limit. Consider compressing it, or letting the server adjust it with `--adjust`. |

Notice that a refused upload says `Upload failed (<status>)`, while every other command says `Request failed: API Error (<status>)`. The upload is the one request the program sends on its own path.

If the server says the type is not supported, converting the file is the remedy. For a video, an MP4 is the safest choice; most tools can produce one, for example `ffmpeg -i clip.mov clip.mp4`.

### Trying it without risk

Upload one small picture first and look at the answer. If your terminal has no picture handy, any small file with a `.png` extension is enough to see how the program and the server answer; the server may judge its content, so use a real picture to see a success:

```bash
ihateposting-agent upload ./small.png
ihateposting-agent media:list -s small
```

The file stays in your media library until you remove it in the app. Use drafts (`-t draft`) for the first posts that use it.

### See also

- [FEATURES.md](FEATURES.md): the media commands next to the rest of the program.
- [PROVIDER_SETTINGS.md](PROVIDER_SETTINGS.md): the settings that refer to uploaded pictures (`thumbnail`, `article_cover`).
- [INTEGRATION_SETTINGS_DISCOVERY.md](INTEGRATION_SETTINGS_DISCOVERY.md): reading each platform's media rules.
- [SYNTAX_UPGRADE.md](SYNTAX_UPGRADE.md): how `-m` and `--alt` are paired with `-c`.
