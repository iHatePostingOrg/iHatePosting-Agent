// The faults planted for the submission files (see planted-faults.test.mjs): [what, file, [[from, to], …]]. Kept in a file of its own so that a check can read
// them without running the whole break-it run; it is not a test file.
const OTHER_PRODUCT = ["Post", "iz"].join(""); // the public repository never names the other product; spelled in two pieces
const FOLDER = "plugins/chatgpt-ihateposting";
const SCRIPT = "scripts/chatgpt-plugin-zip.mjs";

export const submissionFaults = [
  // The plugin's listing and review cases.
  ['the plugin\'s display name says "Plugin"', `${FOLDER}/plugin.json`, [['"displayName": "iHatePosting"', '"displayName": "iHatePosting Plugin"']]],
  ["the plugin's subtitle is 32 characters", `${FOLDER}/plugin.json`, [['"shortDescription": "Schedule Social Media Posts"', '"shortDescription": "Schedule Social Media Posts in ChatGPT"']]],
  ["a review case names a tool the server does not have", `${FOLDER}/plugin.json`, [['"tools_triggered": "uploadFromUrlTool, mediaStatusTool"', '"tools_triggered": "uploadFromUrlTool, mediaStatusTol"']]],
  ["the privacy address is plain http", `${FOLDER}/plugin.json`, [['"privacyPolicyURL": "https://ihateposting.com/privacy"', '"privacyPolicyURL": "http://ihateposting.com/privacy"']]],
  ["the plugin says it takes payments", `${FOLDER}/plugin.json`, [['"commerce": false', '"commerce": true']]],
  ["the draft case no longer says not to publish", `${FOLDER}/plugin.json`, [["Keep it a draft: do not schedule or publish it.", "Schedule it for me."]]],
  ["a demo link that does not exist is put in", `${FOLDER}/plugin.json`, [['"commerce": false,', '"commerce": false,\n        "demo_recording_url": "https://example.com/demo",']]],
  // The hosted server the plugin points at.
  ["the plugin points at another server", `${FOLDER}/mcp.json`, [["https://app.ihateposting.com/api/mcp/oauth", "https://example.com/mcp"]]],
  ["the plugin uses the old SSE transport", `${FOLDER}/mcp.json`, [['"type": "streamable-http"', '"type": "sse"']]],
  ["the plugin signs in with a registered client", `${FOLDER}/mcp.json`, [['"mode": "dcr"', '"mode": "provided"']]],
  ["the plugin's server sends a header", `${FOLDER}/mcp.json`, [['"type": "streamable-http",', '"type": "streamable-http",\n      "headers": { "Authorization": "Bearer abc" },']]],
  // The skills.
  ["a skill is not named like its folder", `${FOLDER}/skills/get-started/SKILL.md`, [["name: get-started", "name: getstarted"]]],
  ["a skill names a tool the server does not have", `${FOLDER}/skills/schedule-posts/SKILL.md`, [["`integrationSchedulePostTool`", "`integrationSchedulePostTol`"]]],
  ["a skill deletes without asking", `${FOLDER}/skills/manage-scheduled-posts/SKILL.md`, [["2. Ask them to confirm.", "2. Go ahead."]]],
  ["a skill tells the model to run the command line", `${FOLDER}/skills/get-started/SKILL.md`, [["## What it cannot do", "Run `ihateposting-agent posts:create` to post.\n\n## What it cannot do"]]],
  ["a skill names the other product", `${FOLDER}/skills/get-started/SKILL.md`, [["## What it cannot do", `Works like ${OTHER_PRODUCT}.\n\n## What it cannot do`]]],
  // The ZIP script.
  ["the ZIP takes the folder's README too", SCRIPT, [['const INCLUDED = ["plugin.json", "mcp.json", "skills", "assets"];', 'const INCLUDED = ["plugin.json", "mcp.json", "skills", "assets", "README.md"];']]],
  ["the checksum uses another polynomial", SCRIPT, [["0xedb88320 ^ (c >>> 1)", "0xedb88321 ^ (c >>> 1)"]]],
  ["a ZIP may hold ten times as many files", SCRIPT, [["entries: 5000,", "entries: 50000,"]]],
  ["a failed write leaves its temporary file", SCRIPT, [["    fs.rmSync(temp, { force: true });\n", ""]]],
  ["the display name rule is gone", SCRIPT, [["/\\b(mcp|plugin)\\b/i.test(ui.displayName)", "false"]]],
  ["any number of positive cases is accepted", SCRIPT, [["positive.length !== 5", "positive.length < 4"]]],
  ["an address with a password in it is accepted", SCRIPT, [["url.protocol === \"https:\" && !url.username && !url.password && !url.hash", 'url.protocol === "https:"']]],
  ["lifecycle hooks are accepted", SCRIPT, [["if (openai.hooks !== undefined || openai.apps !== undefined) add(", "if (false) add("]]],
  ["a logo that is not square is accepted", SCRIPT, [["size.width !== size.height || ", ""]]],
  ["the list of the server's tools lacks one the plugin uses", SCRIPT, [['"mediaStatusTool", ', ""]]],
  ["the package has no script for the ZIP", "package.json", [['"chatgpt-plugin:zip": "node scripts/chatgpt-plugin-zip.mjs"', '"chatgpt-plugin:zip": "node scripts/other.mjs"']]],
  // The Registry draft.
  ["the Registry description is over 100 characters", "server.json", [['"description": "Draft, schedule and publish social posts, upload media and list posts across 15 platforms."', '"description": "Draft, schedule and publish social posts, upload media and list posts across 15 platforms, from ChatGPT, Claude, Cursor, Gemini or Grok."']]],
  ["the Registry version is a range", "server.json", [['"version": "0.1.0"', '"version": "^0.1.0"']]],
  ["the Registry name has no namespace", "server.json", [['"name": "com.ihateposting/agent"', '"name": "ihateposting-agent"']]],
  ["the Registry name is the old app's entry", "server.json", [['"name": "com.ihateposting/agent"', '"name": "com.ihateposting/mcp"']]],
  ["a Registry remote is plain http", "server.json", [['"url": "https://app.ihateposting.com/api/mcp",', '"url": "http://app.ihateposting.com/api/mcp",']]],
  ["the Registry's header is not secret", "server.json", [['"isSecret": true', '"isSecret": false']]],
  // The owner's guide.
  ["the guide drops the January 2027 date", "PUBLISHING.md", [["targeting January 2027", "targeting 2027"]]],
  ["the guide says the privacy page is live on the app's host", "PUBLISHING.md", [["| `/privacy` and `/terms` | **404** (they answer 200 on `ihateposting.com`;", "| `/privacy` and `/terms` | 200 (they answer 200 on `ihateposting.com`;"]]],
  ["the guide calls the missing privacy page a blocker", "PUBLISHING.md", [["**not a blocker**: every submission uses", "**a blocker**: every submission uses"]]],
  ["the packs call the missing privacy page a blocker", "SUBMISSIONS.md", [["which is **not** a blocker", "which is a blocker"]]],
  ["the Claude plugin's privacy address is on the app host", "plugins/claude-ihateposting/.claude-plugin/plugin.json", [['"privacyPolicyUrl": "https://ihateposting.com/privacy"', '"privacyPolicyUrl": "https://app.ihateposting.com/privacy"']]],
  ["the ChatGPT plugin's terms address is on the app host", "plugins/chatgpt-ihateposting/plugin.json", [['"termsOfServiceURL": "https://ihateposting.com/terms"', '"termsOfServiceURL": "https://app.ihateposting.com/terms"']]],
  ["the guide drops the statement that the sign-in was not tried", "PUBLISHING.md", [["What was **not** tried: a real sign-in, a real MCP session", "What was tried: a real sign-in, a real MCP session"]]],
  ["the guide no longer says what the new app answered earlier that day", "PUBLISHING.md", [["**Earlier that day** the paths", "The paths"]]],
  ["the guide says this repository submits things", "PUBLISHING.md", [["Nothing in this repository submits anything, signs in anywhere or changes a setting", "This repository submits things for you"]]],
  ["the guide claims another Node version for the workflow", "PUBLISHING.md", [["**The workflow here uses Node 20**", "**The workflow here uses Node 24**"]]],
  ["the workflow's Node version changes without the guide", ".github/workflows/publish-npm.yml", [["node-version: 20", "node-version: 24"]]],
  ["the guide says the old host's token may be replaced", "PUBLISHING.md", [["do not replace it (OpenAI: use a parent origin or a distinct host instead)", "replace it"]]],
];
