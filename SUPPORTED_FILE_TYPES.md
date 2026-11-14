# Files you can upload

`ihateposting-agent upload <file>` sends a file to your workspace's media library, and the answer gives you the address (`path`) to use in posts. This page explains what the program does with a file, and what it leaves to the server.

## What the program does

1. It reads the whole file into memory. It checks nothing about size, content or name.
2. It takes the file's **name** from the path you typed: everything after the last `/`. On Windows, write the path with forward slashes (`C:/pictures/photo.png`); with backslashes the whole path would be sent as the name.
3. It chooses a **content type** from the name's extension, the text after the last `.`, in lower case (so `PHOTO.PNG` and `photo.png` are the same). The table below is the complete list. An extension that is not in the list, or no extension at all, is sent as `application/octet-stream` (plain bytes).
4. It sends the file as a form (`multipart/form-data`) with the field `file`. With `--adjust` it adds a field `adjust` with the value `true`; without the flag the field is not sent.
5. It prints `✅ File uploaded successfully!` and the server's JSON. On a refusal it prints `❌ Failed to upload file: Upload failed (<status>): <the server's words>` and exits with `1`.

The program never refuses a file because of its type. The server may.

## The content types the program knows

| Kind | Extensions | Sent as |
| --- | --- | --- |
| Pictures | `png` | `image/png` |
| | `jpg`, `jpeg` | `image/jpeg` |
| | `gif` | `image/gif` |
| | `webp` | `image/webp` |
| | `svg` | `image/svg+xml` |
| | `bmp` | `image/bmp` |
| | `ico` | `image/x-icon` |
| Videos | `mp4` | `video/mp4` |
| | `mov` | `video/quicktime` |
| | `avi` | `video/x-msvideo` |
| | `mkv` | `video/x-matroska` |
| | `webm` | `video/webm` |
| | `flv` | `video/x-flv` |
| | `wmv` | `video/x-ms-wmv` |
| | `m4v` | `video/x-m4v` |
| | `mpeg`, `mpg` | `video/mpeg` |
| | `3gp` | `video/3gpp` |
| Audio | `mp3` | `audio/mpeg` |
| | `wav` | `audio/wav` |
| | `ogg` | `audio/ogg` |
| | `aac` | `audio/aac` |
| | `flac` | `audio/flac` |
| | `m4a` | `audio/mp4` |
| Documents | `pdf` | `application/pdf` |
| | `doc` | `application/msword` |
| | `docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| Anything else | any other or no extension | `application/octet-stream` |

This table says what the program labels a file as, not what a platform will publish. A file type the program can label may still be refused by the server or by the platform you post to.

## What the server decides (unverified from this repository)

This repository holds only the command line, so these points are **not** verified here and you should confirm them against your server:

- Which file types are accepted. The server may refuse some of the types above (an upload answered with `Upload failed (<status>)` shows its reason).
- The largest file it accepts. The program itself sets no limit; its tests upload a 50 MB file to a fake server without trouble.
- What `--adjust` does. The program's help describes it as scaling videos to 1080p and re-encoding them to MP4, and scaling oversized pictures down; what a given server does with the `adjust` field is up to that server. The help also says to wait until `media:status <media-id>` reports `ready` before using the returned `path`, so that the post does not use the original file.
- Which of these files a platform accepts in a post. Each platform's rules (`output.rules` of `integrations:settings`) say what it expects: for example that YouTube needs a video, Pinterest and Instagram need at least one attachment, and TikTok needs a video or pictures.

## Using the result in a post

`upload` prints an object with (among other things) an `id` and a `path`. Use the `path`:

```bash
ihateposting-agent upload ./photo.png
# note the "path" in the answer, then:
ihateposting-agent posts:create -i <channel-id> -c "A photo" -m "<that path>" -s 2026-12-15T10:00:00Z -t draft
```

For several files, upload each one and give the paths to `-m` separated by commas (`-m "<path1>,<path2>"`), or put them in the `image` list of a body file (see [examples/post-with-comments-and-media.json](examples/post-with-comments-and-media.json)). A video is attached the same way as a picture. A pin that needs a cover picture next to its video lists both.

`posts:create` never uploads. Whatever you give to `-m` is sent as the text you typed; only addresses of files that are already uploaded are meant to go there, not names of files on your disk.

## Checking and finding uploads

```bash
ihateposting-agent media:list                 # newest first, 18 per page
ihateposting-agent media:list -s banner -p 2  # name contains "banner", page 2
ihateposting-agent media:status <media-id>    # for a file uploaded with --adjust
```

Both print JSON only, without a header line.

## If an upload fails

| Message | What to try |
| --- | --- |
| `❌ Failed to upload file: ENOENT: no such file or directory ...` | The path is wrong, relative to where you ran the command. |
| `❌ Failed to upload file: Upload failed (<status>): ...` | The server refused the file; read its words. A different format or a smaller file are the usual remedies. |
| `❌ Error: No authentication found.` | Sign in first (`auth:login`) or set `IHATEPOSTING_API_KEY`. |
| A very large file takes long, or uses a lot of memory | The whole file is read into memory first and there is no time limit. Consider compressing it, or letting the server adjust it with `--adjust`. |
