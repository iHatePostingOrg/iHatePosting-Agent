import { IHatePostingAPI } from "../api.mjs";
import { getConfig } from "../config.mjs";

// The analytics commands, behaving as the reference's do (owner, 2026-11-13): the last 7 days unless told otherwise.

export async function getAnalytics(args) {
  const config = getConfig();
  const api = new IHatePostingAPI(config);

  if (!args.id) {
    console.error("❌ Integration ID is required");
    process.exit(1);
  }

  const date = args.date || "7";

  try {
    const result = await api.getAnalytics(args.id, date);
    console.log(`📊 Analytics for integration: ${args.id}`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("❌ Failed to get analytics:", error.message);
    process.exit(1);
  }
}

export async function getPostAnalytics(args) {
  const config = getConfig();
  const api = new IHatePostingAPI(config);

  if (!args.id) {
    console.error("❌ Post ID is required");
    process.exit(1);
  }

  const date = args.date || "7";

  try {
    const result = await api.getPostAnalytics(args.id, date);
    console.log(`📊 Analytics for post: ${args.id}`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("❌ Failed to get post analytics:", error.message);
    process.exit(1);
  }
}
