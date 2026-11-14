import { readFileSync } from "node:fs";
import { IHatePostingAPI } from "../api.mjs";
import { getConfig } from "../config.mjs";

// The media commands, behaving as the reference's do (owner, 2026-11-13): a file's name is what follows the last `/` of the path typed.

export async function uploadFile(args) {
  const config = getConfig();
  const api = new IHatePostingAPI(config);

  if (!args.file) {
    console.error("❌ File path is required");
    process.exit(1);
  }

  try {
    const fileBuffer = readFileSync(args.file);
    const filename = args.file.split("/").pop() || "file";

    const result = await api.upload(fileBuffer, filename, args.adjust);
    console.log("✅ File uploaded successfully!");
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("❌ Failed to upload file:", error.message);
    process.exit(1);
  }
}

export async function listMedia(args) {
  const config = getConfig();
  const api = new IHatePostingAPI(config);

  try {
    const result = await api.listMedia(args.page, args.search);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("❌ Failed to list media:", error.message);
    process.exit(1);
  }
}

export async function getMediaStatus(args) {
  const config = getConfig();
  const api = new IHatePostingAPI(config);

  if (!args.id) {
    console.error("❌ Media ID is required");
    process.exit(1);
  }

  try {
    const result = await api.getMediaStatus(args.id);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("❌ Failed to get media status:", error.message);
    process.exit(1);
  }
}
