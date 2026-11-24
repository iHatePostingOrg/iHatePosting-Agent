import { readFileSync } from "node:fs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { authLogin, authLogout, authStatus } from "./commands/auth.mjs";
import { getAnalytics, getPostAnalytics } from "./commands/analytics.mjs";
import { getIntegrationSettings, listGroups, listIntegrations, triggerIntegrationTool } from "./commands/integrations.mjs";
import { changePostStatus, connectPost, createPost, deletePost, getMissingContent, listPosts, updatePostAttachments, updatePostSettings } from "./commands/posts.mjs";
import { getMediaStatus, listMedia, uploadFile } from "./commands/upload.mjs";
import { API_KEY_VARIABLE, DEFAULT_AUTH_SERVER, PROGRAM, WEBSITE } from "./constants.mjs";

// The command line, wired the way the reference is (owner, 2026-11-13): the same library (yargs), the same commands in the same order with the
// same options, short names, defaults and checks, and the same help (it is yargs' own layout). Not here: the clipping commands (this app has none), and
// the advertisement for another product that ends the reference's help. A word that is not a command is accepted and does nothing, and so is an option that
// is not known, as yargs does by default.

const version = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;

yargs(hideBin(process.argv))
  .scriptName(PROGRAM)
  .usage("$0 <command> [options]")
  .command(
    "posts:create",
    "Create a new post",
    (yargs) => {
      return yargs
        .option("content", {
          alias: "c",
          describe: "Post/comment content (can be used multiple times)",
          type: "string",
        })
        .option("media", {
          alias: "m",
          describe: "Comma-separated media URLs for the corresponding -c (can be used multiple times)",
          type: "string",
        })
        .option("alt", {
          describe: "Comma-separated alt texts for the media of the corresponding -m, same order (can be used multiple times, use --json for alt texts containing commas)",
          type: "string",
        })
        .option("integrations", {
          alias: "i",
          describe: "Comma-separated list of integration IDs",
          type: "string",
        })
        .option("date", {
          alias: "s",
          describe: "Schedule date (ISO 8601 format) - REQUIRED",
          type: "string",
        })
        .option("type", {
          alias: "t",
          describe: 'Post type: "schedule" or "draft"',
          type: "string",
          choices: ["schedule", "draft"],
          default: "schedule",
        })
        .option("delay", {
          alias: "d",
          describe: "Delay in minutes between comments (default: 0)",
          type: "number",
          default: 0,
        })
        .option("json", {
          alias: "j",
          describe: "Path to JSON file with full post structure",
          type: "string",
        })
        .option("shortLink", {
          describe: "Use short links",
          type: "boolean",
          default: true,
        })
        .option("settings", {
          describe: "Platform-specific settings as JSON string",
          type: "string",
        })
        .check((argv) => {
          if (!argv.json && !argv.content) {
            throw new Error("Either --content or --json is required");
          }
          if (!argv.json && !argv.integrations) {
            throw new Error("--integrations is required when not using --json");
          }
          if (!argv.json && !argv.date) {
            throw new Error("--date is required when not using --json");
          }
          return true;
        })
        .example('$0 posts:create -c "Hello World!" -s "2024-12-31T12:00:00Z" -i "x-123"', "Simple scheduled post")
        .example('$0 posts:create -c "Draft post" -s "2024-12-31T12:00:00Z" -t draft -i "x-123"', "Create draft post")
        .example('$0 posts:create -c "Main post" -m "img1.jpg,img2.jpg" -s "2024-12-31T12:00:00Z" -i "x-123"', "Post with multiple images")
        .example('$0 posts:create -c "Main post" -m "img1.jpg,img2.jpg" --alt "first alt,second alt" -s "2024-12-31T12:00:00Z" -i "instagram-123"', "Post with alt text per image (same order as -m)")
        .example('$0 posts:create -c "Main post" -m "img1.jpg" -c "First comment" -m "img2.jpg" -c "Second comment" -m "img3.jpg,img4.jpg" -s "2024-12-31T12:00:00Z" -i "x-123"', "Post with comments, each having their own media")
        .example('$0 posts:create -c "Main" -c "Comment with semicolon; see?" -c "Another!" -s "2024-12-31T12:00:00Z" -i "x-123"', "Comments can contain semicolons")
        .example('$0 posts:create -c "Thread 1/3" -c "Thread 2/3" -c "Thread 3/3" -d 5 -s "2024-12-31T12:00:00Z" -i "x-123"', "X thread with 5 minute delay")
        .example("$0 posts:create --json ./post.json", "Complex post from JSON file")
        .example('$0 posts:create -c "Pin description" -s "2024-12-31T12:00:00Z" --settings \'{"board":"1234567890"}\' -i "pinterest-123"', "Pinterest pin with its board")
        .example('$0 posts:create -c "Video description" -s "2024-12-31T12:00:00Z" --settings \'{"title":"My Video","type":"public","tags":[{"value":"tech","label":"Tech"}]}\' -i "youtube-123"', "YouTube post with title and tags")
        .example('$0 posts:create -c "Tweet content" -s "2024-12-31T12:00:00Z" --settings \'{"who_can_reply_post":"everyone"}\' -i "x-123"', "X post with reply settings");
    },
    createPost,
  )
  .command(
    "posts:list",
    "List all posts",
    (yargs) => {
      return yargs
        .option("startDate", {
          describe: "Start date (ISO 8601 format). Default: 30 days ago",
          type: "string",
        })
        .option("endDate", {
          describe: "End date (ISO 8601 format). Default: 30 days from now",
          type: "string",
        })
        .option("customer", {
          describe: "Customer ID (optional)",
          type: "string",
        })
        .example("$0 posts:list", "List all posts (last 30 days to next 30 days)")
        .example('$0 posts:list --startDate "2024-01-01T00:00:00Z" --endDate "2024-12-31T23:59:59Z"', "List posts for a specific date range")
        .example('$0 posts:list --customer "customer-id"', "List posts for a specific customer");
    },
    listPosts,
  )
  .command(
    "posts:delete <id>",
    "Delete a post",
    (yargs) => {
      return yargs
        .positional("id", {
          describe: "Post ID to delete",
          type: "string",
        })
        .example("$0 posts:delete abc123", "Delete post with ID abc123");
    },
    deletePost,
  )
  .command(
    "posts:missing <id>",
    "List available content from the provider for a post with missing release ID",
    (yargs) => {
      return yargs
        .positional("id", {
          describe: "Post ID",
          type: "string",
        })
        .example("$0 posts:missing post-123", "Get available content to connect to a post");
    },
    getMissingContent,
  )
  .command(
    "posts:status <id>",
    "Change a post status between draft and schedule",
    (yargs) => {
      return yargs
        .positional("id", {
          describe: "Post ID",
          type: "string",
        })
        .option("status", {
          alias: "s",
          describe: 'New status: "draft" or "schedule"',
          type: "string",
          choices: ["draft", "schedule"],
          demandOption: true,
        })
        .example("$0 posts:status post-123 --status draft", "Move a scheduled post back to draft (stops the running workflow)")
        .example("$0 posts:status post-123 --status schedule", "Schedule a draft post so it is queued for publishing");
    },
    changePostStatus,
  )
  .command(
    "posts:settings <id>",
    "Update a post's provider-specific settings (merged; only unpublished draft/scheduled posts)",
    (yargs) => {
      return yargs
        .positional("id", {
          describe: "Post ID",
          type: "string",
        })
        .option("settings", {
          describe: "Partial settings as a JSON string — only the keys you pass change; do not include __type",
          type: "string",
          demandOption: true,
        })
        .example('$0 posts:settings post-123 --settings \'{"content_posting_method":"DIRECT_POST"}\'', "Switch a TikTok draft to direct publishing")
        .example('$0 posts:settings post-123 --settings \'{"board":"1234567890"}\'', "Set a Pinterest pin's board");
    },
    updatePostSettings,
  )
  .command(
    "posts:attachments <id>",
    "Replace a post's attachments (only unpublished draft/scheduled posts)",
    (yargs) => {
      return yargs
        .positional("id", {
          describe: "Post ID",
          type: "string",
        })
        .option("media", {
          alias: "m",
          describe:
            "Comma-separated media URLs that replace all the existing attachments of the post; pass an empty string to remove them all (refused when the post would be left invalid, e.g. with no text)",
          type: "string",
          demandOption: true,
          nargs: 1,
        })
        .option("alt", {
          describe: "Comma-separated alt texts for the media of -m, same order",
          type: "string",
        })
        .example('$0 posts:attachments post-123 -m "https://appmedia.ihateposting.com/a.png,https://appmedia.ihateposting.com/b.png"', "Replace the attachments of a post with two images")
        .example('$0 posts:attachments post-123 -m ""', "Remove all the attachments of a post");
    },
    updatePostAttachments,
  )
  .command(
    "posts:connect <id>",
    "Connect a post to its published content by updating the release ID",
    (yargs) => {
      return yargs
        .positional("id", {
          describe: "Post ID",
          type: "string",
        })
        .option("release-id", {
          describe: "The platform-specific content ID to connect",
          type: "string",
          demandOption: true,
        })
        .example('$0 posts:connect post-123 --release-id "7321456789012345678"', "Connect a post to its published content");
    },
    connectPost,
  )
  .command(
    "integrations:list",
    "List all connected integrations",
    (yargs) => {
      return yargs
        .option("group", {
          describe: "Filter integrations by group (customer) ID",
          type: "string",
        })
        .example("$0 integrations:list", "List all connected integrations")
        .example('$0 integrations:list --group "customer-id"', "List integrations for a specific group");
    },
    listIntegrations,
  )
  .command("integrations:groups", "List all groups (customers)", {}, listGroups)
  .command(
    "integrations:settings <id>",
    "Get settings schema for a specific integration",
    (yargs) => {
      return yargs
        .positional("id", {
          describe: "Integration ID",
          type: "string",
        })
        .example("$0 integrations:settings pinterest-123", "Get settings schema for Pinterest integration")
        .example("$0 integrations:settings youtube-456", "Get settings schema for YouTube integration");
    },
    getIntegrationSettings,
  )
  .command(
    "integrations:trigger <id> <method>",
    "Trigger an integration tool to fetch additional data",
    (yargs) => {
      return yargs
        .positional("id", {
          describe: "Integration ID",
          type: "string",
        })
        .positional("method", {
          describe: "Method name from the integration tools",
          type: "string",
        })
        .option("data", {
          alias: "d",
          describe: "Data to pass to the tool as JSON string",
          type: "string",
        })
        .example("$0 integrations:trigger pinterest-123 boards", "Get list of boards")
        .example("$0 integrations:trigger slack-123 channels", "Get list of channels")
        .example("$0 integrations:trigger linkedin-123 mention -d '{\"query\":\"acme\"}'", "Find a LinkedIn company page to tag");
    },
    triggerIntegrationTool,
  )
  .command(
    "analytics:platform <id>",
    "Get analytics for a specific integration/channel",
    (yargs) => {
      return yargs
        .positional("id", {
          describe: "Integration ID",
          type: "string",
        })
        .option("date", {
          alias: "d",
          describe: "Number of days to look back (default: 7)",
          type: "string",
          default: "7",
        })
        .example("$0 analytics:platform integration-123", "Get last 7 days of analytics")
        .example("$0 analytics:platform integration-123 -d 30", "Get last 30 days of analytics");
    },
    getAnalytics,
  )
  .command(
    "analytics:post <id>",
    "Get analytics for a specific post",
    (yargs) => {
      return yargs
        .positional("id", {
          describe: "Post ID",
          type: "string",
        })
        .option("date", {
          alias: "d",
          describe: "Number of days to look back (default: 7)",
          type: "string",
          default: "7",
        })
        .example("$0 analytics:post post-123", "Get last 7 days of post analytics")
        .example("$0 analytics:post post-123 -d 30", "Get last 30 days of post analytics");
    },
    getPostAnalytics,
  )
  .command(
    "upload <file>",
    "Upload a file",
    (yargs) => {
      return yargs
        .positional("file", {
          describe: "File path to upload",
          type: "string",
        })
        .option("adjust", {
          type: "boolean",
          default: false,
          describe:
            "Accepted for compatibility: iHatePosting does not adjust files, so the file is used as uploaded and media:status returns ready at once",
        })
        .example("$0 upload ./image.png", "Upload an image")
        .example("$0 upload ./video.mp4 --adjust", "Upload a video (--adjust is accepted and changes nothing)");
    },
    uploadFile,
  )
  .command(
    "media:status <id>",
    "Check whether an uploaded file is ready (iHatePosting does not adjust files, so it is ready at once)",
    (yargs) => {
      return yargs
        .positional("id", {
          describe: "Media ID returned by upload",
          type: "string",
        })
        .example("$0 media:status media-123", 'Poll while the status is "processing"');
    },
    getMediaStatus,
  )
  .command(
    "media:list",
    "List media already uploaded to the media library (newest first, 18 per page)",
    (yargs) => {
      return yargs
        .option("search", {
          alias: "s",
          type: "string",
          describe: "Filter by original file name (case-insensitive)",
        })
        .option("page", {
          alias: "p",
          type: "number",
          describe: "Page number, starting at 1",
          default: 1,
        })
        .example("$0 media:list", "List the most recent uploads")
        .example("$0 media:list -s banner", 'Find uploads whose name contains "banner"');
    },
    listMedia,
  )
  .command(
    "auth:login",
    "Authenticate using OAuth2 (device flow)",
    (yargs) => {
      return yargs
        .option("auth-server", {
          describe: `Auth server URL (default: ${DEFAULT_AUTH_SERVER})`,
          type: "string",
        })
        .example("$0 auth:login", "Login via OAuth2 device flow");
    },
    authLogin,
  )
  .command("auth:logout", "Remove stored OAuth2 credentials", {}, authLogout)
  .command("auth:status", "Show current authentication status", {}, authStatus)
  .demandCommand(1, "You need at least one command")
  .help()
  .alias("h", "help")
  .version(version)
  .alias("v", "version")
  .epilogue(`For more information, visit: ${WEBSITE}\n\nAuthentication:\n  OAuth2: ${PROGRAM} auth:login\n  API Key: export ${API_KEY_VARIABLE}=your_api_key`)
  .parse();
