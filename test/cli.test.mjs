// The command line end to end: the program is run as a child process (as a terminal would run it) against a stand-in for the API on this computer. What
// each command asks of the API, what it prints and how it ends, what it does when the API refuses or is not there, and that the key goes out as it is.
// Every command, option, header line and exit code is the reference command line's (owner, 2026-11-13); the places that are not are the
// names (the program, the three variables, the folder, the addresses) and the clipping commands this app does not have.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { KEY, TOKEN, credentialsFile, jsonOf, run, startFakeApi, tempDir } from "./helpers.mjs";

let api;
let handler = () => ({ body: {} });
before(async () => {
  api = await startFakeApi((req) => handler(req));
});
after(() => api.close());

const env = (extra = {}) => ({ IHATEPOSTING_API_KEY: KEY, IHATEPOSTING_API_URL: api.url, ...extra });
const last = () => api.requests.at(-1);
const answering = (body, status = 200, headers) => {
  handler = () => ({ status, body, headers });
};
const lines = (text) => text.split("\n");

describe("every command asks the API what it says and prints the header line and then the JSON", () => {
  it("sends the key exactly as it is, with no Bearer, a JSON content type, and no name of its own (as the reference's does)", async () => {
    answering([]);
    const { code } = await run(["integrations:list"], { env: env() });
    assert.equal(code, 0);
    assert.equal(last().headers.authorization, KEY);
    assert.equal(last().headers["content-type"], "application/json");
    assert.match(last().headers["user-agent"], /^node-fetch/);
    assert.equal(last().path, "/public/v1/integrations");
  });

  it("lists channels (with --group), groups, a channel's settings, and runs a helper with its data", async () => {
    answering([{ id: "c1" }]);
    const listed = await run(["integrations:list", "--group", "g1"], { env: env() });
    assert.equal(listed.stdout, `🔌 Connected Integrations:\n${JSON.stringify([{ id: "c1" }], null, 2)}\n`);
    assert.deepEqual([last().path, last().query], ["/public/v1/integrations", { group: "g1" }]);
    await run(["integrations:groups"], { env: env() });
    assert.equal(last().path, "/public/v1/groups");
    answering({ output: { rules: "r", maxLength: 280 } });
    const settings = await run(["integrations:settings", "ch-1"], { env: env() });
    assert.equal(last().path, "/public/v1/integration-settings/ch-1");
    assert.equal(lines(settings.stdout)[0], "⚙️  Settings for integration: ch-1");
    answering({ output: [{ id: 1 }] });
    const tool = await run(["integrations:trigger", "c1", "channels", "--data", '{"a":1}'], { env: env() });
    assert.deepEqual([last().method, last().path, last().json], ["POST", "/public/v1/integration-trigger/c1", { methodName: "channels", data: { a: 1 } }]);
    assert.equal(lines(tool.stdout)[0], "🔧 Tool result for channels:");
    await run(["integrations:trigger", "c1", "boards", "-d", "[1]"], { env: env() });
    assert.deepEqual(last().json, { methodName: "boards", data: [1] });
    await run(["integrations:trigger", "c1", "boards"], { env: env() });
    assert.deepEqual(last().json, { methodName: "boards", data: {} });
  });

  it("creates a post as the reference's does: the words as given, one value for each -c, the date as typed, the CLI mark, settings as given", async () => {
    answering([{ postId: "p1", integration: "c1" }], 201);
    const { code, stdout } = await run(["posts:create", "-i", "c1,c2", "-c", "Hello\nWorld <b>", "-c", "Second", "-s", "2026-12-31T12:00:00Z", "--settings", '{"post_type":"post"}', "-d", "3"], { env: env() });
    assert.equal(code, 0);
    assert.equal(stdout, `✅ Post created successfully!\n${JSON.stringify([{ postId: "p1", integration: "c1" }], null, 2)}\n`);
    const body = last().json;
    for (const post of body.posts) for (const value of post.value) for (const image of value.image) delete image.id;
    assert.deepEqual(body, {
      type: "schedule",
      creationMethod: "CLI",
      date: "2026-12-31T12:00:00Z",
      shortLink: true,
      tags: [],
      posts: ["c1", "c2"].map((id) => ({ integration: { id }, value: [{ content: "Hello\nWorld <b>", image: [], delay: 3 }, { content: "Second", image: [], delay: 3 }], settings: { post_type: "post" } })),
    });
  });

  it("makes a draft, turns short links off with --no-shortLink, pairs -m and --alt with their -c, and uploads nothing", async () => {
    answering([{ postId: "p1" }], 201);
    await run(["posts:create", "-i", "c1", "-c", "x", "-m", "https://media.example/a.png,https://media.example/b.png", "--alt", "first,second", "-s", "2026-12-31T12:00:00Z", "-t", "draft", "--no-shortLink"], { env: env() });
    assert.equal(last().json.type, "draft");
    assert.equal(last().json.shortLink, false);
    assert.deepEqual(last().json.posts[0].value[0].image.map((i) => [i.path, i.alt]), [["https://media.example/a.png", "first"], ["https://media.example/b.png", "second"]]);
    assert.match(last().json.posts[0].value[0].image[0].id, /^[a-z0-9]+$/);
    assert.equal(api.requests.filter((r) => r.path.endsWith("/upload")).length, 0, "-m uploaded a file: the reference's needs it uploaded first");
    // Comments each have their own media; a comment without a -m has none.
    await run(["posts:create", "-i", "c1", "-s", "d", "-c", "Main", "-m", "a.png", "-c", "Comment", "-c", "Third", "-m", "c.png"], { env: env() });
    assert.deepEqual(last().json.posts[0].value.map((v) => v.image.map((i) => i.path)), [["a.png"], ["c.png"], []], "-m is paired with -c by position, as the reference's does");
    // --alt is paired with -c by position too: the second part's picture gets the second --alt, not the first.
    await run(["posts:create", "-i", "c1", "-s", "d", "-c", "Main", "-m", "a.png,b.png", "--alt", "one,two", "-c", "Comment", "-m", "c.png,d.png", "--alt", "three,four"], { env: env() });
    assert.deepEqual(last().json.posts[0].value.map((v) => v.image.map((i) => [i.path, i.alt])), [[["a.png", "one"], ["b.png", "two"]], [["c.png", "three"], ["d.png", "four"]]], "--alt is paired with -c by position");
  });

  it("refuses a post it cannot make before asking the API, in the reference's words, with exit 1, and shows the command's usage on stderr", async () => {
    const before = api.requests.length;
    for (const [argv, said] of [
      [["posts:create", "-i", "c1", "-s", "2026-12-31T12:00:00Z"], "Either --content or --json is required"],
      [["posts:create", "-c", "x", "-s", "2026-12-31T12:00:00Z"], "--integrations is required when not using --json"],
      [["posts:create", "-c", "x", "-i", "c1"], "--date is required when not using --json"],
    ]) {
      const { code, stdout, stderr } = await run(argv, { env: env() });
      assert.equal(code, 1, argv.join(" "));
      assert.equal(stdout, "");
      assert.ok(stderr.startsWith("ihateposting posts:create\n\nCreate a new post\n\nOptions:"), stderr.slice(0, 80));
      assert.ok(stderr.trimEnd().endsWith(said), `${argv.join(" ")} -> ${stderr.slice(-120)}`);
    }
    const bad = await run(["posts:create", "-c", "x", "-i", "c1", "-s", "d", "-t", "now"], { env: env() });
    assert.equal(bad.code, 1);
    assert.match(bad.stderr, /Invalid values:\n  Argument: type, Given: "now", Choices: "schedule", "draft"/);
    const notJson = await run(["posts:create", "-c", "x", "-i", "c1", "-s", "d", "--settings", "{oops"], { env: env() });
    assert.equal(notJson.code, 1);
    assert.match(notJson.stderr, /^❌ Failed to parse settings JSON: /);
    assert.equal(api.requests.length, before);
  });

  it("sends a body file exactly as it is (no creation method added) and says what is wrong with one that cannot be read", async () => {
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, "body.json"), JSON.stringify({ type: "draft", posts: [] }));
    answering({}, 201);
    const sent = await run(["posts:create", "--json", path.join(dir, "body.json")], { env: env() });
    assert.equal(sent.code, 0);
    assert.deepEqual(last().json, { type: "draft", posts: [] });
    fs.writeFileSync(path.join(dir, "bad.json"), "{nope");
    const bad = await run(["posts:create", "-j", path.join(dir, "bad.json")], { env: env() });
    assert.equal(bad.code, 1);
    assert.match(bad.stderr, /^❌ Failed to parse JSON file: /);
    const missing = await run(["posts:create", "-j", path.join(dir, "absent.json")], { env: env() });
    assert.equal(missing.code, 1);
    assert.match(missing.stderr, /^❌ Failed to parse JSON file: process\.exit|^❌ JSON file not found: /);
  });

  it("lists posts from 30 days ago to 30 days ahead unless told otherwise, and passes the dates and the customer as typed", async () => {
    answering({ posts: [] });
    const before = Date.now();
    const listed = await run(["posts:list"], { env: env() });
    assert.equal(lines(listed.stdout)[0], "📋 Posts:");
    const day = 86_400_000;
    assert.ok(Math.abs(Date.parse(last().query.startDate) - (before - 30 * day)) < 60_000);
    assert.ok(Math.abs(Date.parse(last().query.endDate) - (before + 30 * day)) < 60_000);
    await run(["posts:list", "--startDate", "2026-01-01", "--end-date", "2026-02-01", "--customer", "cu1"], { env: env() });
    assert.deepEqual(last().query, { startDate: "2026-01-01", endDate: "2026-02-01", customer: "cu1" });
  });

  it("deletes a post (a header and no JSON), changes its status, its settings and its release id, each with its own header", async () => {
    answering({ ok: true });
    const deleted = await run(["posts:delete", "p-1"], { env: env() });
    assert.equal(deleted.stdout, "✅ Post p-1 deleted successfully!\n");
    assert.deepEqual([last().method, last().path], ["DELETE", "/public/v1/posts/p-1"]);
    const status = await run(["posts:status", "p1", "--status", "draft"], { env: env() });
    assert.deepEqual([last().method, last().path, last().json], ["PUT", "/public/v1/posts/p1/status", { status: "draft" }]);
    assert.equal(lines(status.stdout)[0], "✅ Post p1 status changed to draft");
    const settings = await run(["posts:settings", "p1", "--settings", '{"content_posting_method":"DIRECT_POST"}'], { env: env() });
    assert.deepEqual([last().path, last().json], ["/public/v1/posts/p1/settings", { settings: { content_posting_method: "DIRECT_POST" } }]);
    assert.equal(lines(settings.stdout)[0], "✅ Post p1 settings updated");
    const connected = await run(["posts:connect", "p1", "--release-id", "7321456789012345678"], { env: env() });
    assert.deepEqual([last().path, last().json], ["/public/v1/posts/p1/release-id", { releaseId: "7321456789012345678" }]);
    assert.equal(lines(connected.stdout)[0], "✅ Post p1 connected to release 7321456789012345678");
    answering({ missing: [] });
    const missing = await run(["posts:missing", "p1"], { env: env() });
    assert.equal(last().path, "/public/v1/posts/p1/missing");
    assert.equal(missing.stdout, `${JSON.stringify({ missing: [] }, null, 2)}\n`, "posts:missing prints the JSON alone, as the reference's does");
  });

  it("replaces a post's attachments as the reference's posts:attachments does: one comma-separated -m is the whole new list, an id for each, alt texts by position, -m \"\" removes them all", async () => {
    answering({ postId: "p1", publishDate: "2030-01-01T10:00:00" });
    const two = await run(["posts:attachments", "p1", "-m", "https://appmedia.ihateposting.com/a.png,https://appmedia.ihateposting.com/b.png"], { env: env() });
    assert.equal(two.code, 0, two.stderr);
    assert.deepEqual([last().method, last().path], ["PUT", "/public/v1/posts/p1/attachments"]);
    assert.deepEqual(Object.keys(last().json), ["attachments"]);
    assert.deepEqual(last().json.attachments.map((a) => a.path), ["https://appmedia.ihateposting.com/a.png", "https://appmedia.ihateposting.com/b.png"]);
    assert.ok(last().json.attachments.every((a) => typeof a.id === "string" && a.id.length >= 3 && !("alt" in a)));
    assert.notEqual(last().json.attachments[0].id, last().json.attachments[1].id);
    assert.equal(lines(two.stdout)[0], "✅ Post p1 attachments updated");
    assert.equal(two.stdout, `✅ Post p1 attachments updated\n${JSON.stringify({ postId: "p1", publishDate: "2030-01-01T10:00:00" }, null, 2)}\n`);
    // Spaces around an address are dropped; alt texts go by position, an empty one sets none, and an extra one is ignored.
    await run(["posts:attachments", "p1", "-m", " a.png , b.png ", "--alt", " A red bicycle , "], { env: env() });
    assert.deepEqual(last().json.attachments.map(({ id: _id, ...rest }) => rest), [{ path: "a.png", alt: "A red bicycle" }, { path: "b.png" }]);
    await run(["posts:attachments", "p1", "-m", "a.png", "--alt", "one,two,three"], { env: env() });
    assert.deepEqual(last().json.attachments.map(({ id: _id, ...rest }) => rest), [{ path: "a.png", alt: "one" }]);
    await run(["posts:attachments", "p1", "-m", "a.png,b.png", "--alt", ",second"], { env: env() });
    assert.deepEqual(last().json.attachments.map(({ id: _id, ...rest }) => rest), [{ path: "a.png" }, { path: "b.png", alt: "second" }]);
    const removed = await run(["posts:attachments", "p1", "-m", ""], { env: env() });
    assert.equal(removed.code, 0, removed.stderr);
    assert.deepEqual(last().json, { attachments: [] });
  });

  it("refuses before any request a -m that could clear a post by mistake (a bare -m, an empty entry, a repeated -m or --alt), and a missing -m, with the reference's words and exit 1", async () => {
    for (const [argv, said] of [
      [["posts:attachments", "p1"], "Missing required argument: media"],
      [["posts:attachments", "p1", "-m"], "Not enough arguments following: m"],
      [["posts:attachments", "p1", "-m", "a.png,,b.png"], '❌ --media has an empty entry. Pass -m "" to remove all attachments'],
      [["posts:attachments", "p1", "-m", "a.png,"], '❌ --media has an empty entry. Pass -m "" to remove all attachments'],
      [["posts:attachments", "p1", "-m", " , "], '❌ --media has an empty entry. Pass -m "" to remove all attachments'],
      [["posts:attachments", "p1", "-m", "a.png", "-m", "b.png"], "❌ Pass --media once, as a comma-separated list (an empty string removes all attachments)"],
      [["posts:attachments", "p1", "-m", "a.png", "--alt", "x", "--alt", "y"], "❌ Pass --alt once, as a comma-separated list in the same order as --media"],
      [["posts:attachments", "-m", "a.png"], "Not enough non-option arguments: got 0, need at least 1"],
    ]) {
      const before = api.requests.length;
      const { code, stdout, stderr } = await run(argv, { env: env() });
      assert.equal(code, 1, argv.join(" "));
      assert.equal(stdout, "");
      assert.ok(stderr.includes(said), `${argv.join(" ")} -> ${stderr.slice(-200)}`);
      assert.equal(api.requests.length, before, `${argv.join(" ")} sent a request`);
    }
  });

  it("says what the API said when it refuses (a post that went out, a file that is not one), as one failure with exit 1", async () => {
    answering({ message: "Only scheduled posts that were not published yet (or drafts) can be updated", error: "Bad Request", statusCode: 400 }, 400);
    const { code, stdout, stderr } = await run(["posts:attachments", "p1", "-m", "a.png"], { env: env() });
    assert.equal(code, 1);
    assert.equal(stdout, "");
    assert.match(stderr, /^❌ Failed to update post attachments: Request failed: API Error \(400\): .*Only scheduled posts that were not published yet/);
  });

  it("refuses a status that is not draft or schedule, and a command that lacks its word or its required option, with yargs' usage and exit 1", async () => {
    for (const [argv, said] of [
      [["posts:status", "p1", "--status", "published"], 'Invalid values:\n  Argument: status, Given: "published", Choices: "draft", "schedule"'],
      [["posts:status", "p1"], "Missing required argument: status"],
      [["posts:settings", "p1"], "Missing required argument: settings"],
      [["posts:connect", "p1"], "Missing required argument: release-id"],
      [["posts:delete"], "Not enough non-option arguments: got 0, need at least 1"],
      [["integrations:trigger", "c1"], "Not enough non-option arguments: got 1, need at least 2"],
    ]) {
      const before = api.requests.length;
      const { code, stdout, stderr } = await run(argv, { env: env() });
      assert.equal(code, 1, argv.join(" "));
      assert.equal(stdout, "");
      assert.ok(stderr.includes(said), `${argv.join(" ")} -> ${stderr.slice(-160)}`);
      assert.equal(api.requests.length, before);
    }
  });

  it("reads analytics for a channel and a post over -d days (7 unless told), with their headers", async () => {
    answering([{ label: "Followers" }]);
    const channel = await run(["analytics:platform", "c1"], { env: env() });
    assert.deepEqual([last().path, last().query], ["/public/v1/analytics/c1", { date: "7" }]);
    assert.equal(lines(channel.stdout)[0], "📊 Analytics for integration: c1");
    const post = await run(["analytics:post", "p1", "-d", "30"], { env: env() });
    assert.deepEqual([last().path, last().query], ["/public/v1/analytics/post/p1", { date: "30" }]);
    assert.equal(lines(post.stdout)[0], "📊 Analytics for post: p1");
  });

  it("lists the media library (page 1 unless told, a search only when given) and checks a file's status, printing the JSON alone", async () => {
    answering({ pages: 1, results: [] });
    const listed = await run(["media:list"], { env: env() });
    assert.deepEqual([last().path, last().query], ["/public/v1/media", { page: "1" }]);
    assert.equal(listed.stdout, `${JSON.stringify({ pages: 1, results: [] }, null, 2)}\n`);
    await run(["media:list", "-s", "banner", "-p", "2"], { env: env() });
    assert.deepEqual(last().query, { page: "2", search: "banner" });
    await run(["media:status", "m-1"], { env: env() });
    assert.equal(last().path, "/public/v1/media/m-1/status");
  });

  it("uploads a file as a form: its name, the type its extension means, and `adjust` only when asked", async () => {
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, "pic.PNG"), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    fs.writeFileSync(path.join(dir, "clip.mp4"), "video");
    fs.writeFileSync(path.join(dir, "notes.xyz"), "any bytes");
    answering({ id: "m1", path: "https://media.example/m1.png" });
    const done = await run(["upload", path.join(dir, "pic.PNG").replaceAll("\\", "/")], { env: env() });
    assert.equal(done.code, 0, done.stderr);
    assert.equal(lines(done.stdout)[0], "✅ File uploaded successfully!");
    assert.match(last().headers["content-type"], /^multipart\/form-data; boundary=/);
    assert.match(last().text, /name="file"; filename="pic\.PNG"\r\nContent-Type: image\/png/);
    assert.ok(!last().text.includes('name="adjust"'));
    assert.equal(last().headers.authorization, KEY);
    await run(["upload", path.join(dir, "clip.mp4").replaceAll("\\", "/"), "--adjust"], { env: env() });
    assert.match(last().text, /name="adjust"\r\n\r\ntrue/);
    assert.match(last().text, /filename="clip\.mp4"\r\nContent-Type: video\/mp4/);
    await run(["upload", path.join(dir, "notes.xyz").replaceAll("\\", "/")], { env: env() });
    assert.match(last().text, /filename="notes\.xyz"\r\nContent-Type: application\/octet-stream/, "any file is uploaded: the server decides");
  });

  it("says what is wrong with a file that is not there or an upload the server refuses", async () => {
    const missing = await run(["upload", "/does/not/exist.png"], { env: env() });
    assert.equal(missing.code, 1);
    assert.match(missing.stderr, /^❌ Failed to upload file: ENOENT: no such file or directory/);
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, "a.png"), "x");
    answering({ message: "File type not allowed" }, 400);
    const refused = await run(["upload", path.join(dir, "a.png").replaceAll("\\", "/")], { env: env() });
    assert.equal(refused.code, 1);
    assert.equal(refused.stderr, `❌ Failed to upload file: Upload failed (400): ${JSON.stringify({ message: "File type not allowed" })}\n`);
  });
});

describe("when the API refuses or is not there", () => {
  it("says so in the reference's words, with the server's own text, and ends with 1", async () => {
    answering({ message: ["content is required"], statusCode: 400 }, 400);
    const { code, stdout, stderr } = await run(["integrations:list"], { env: env() });
    assert.equal(code, 1);
    assert.equal(stdout, "");
    assert.equal(stderr, `❌ Failed to list integrations: Request failed: API Error (400): ${JSON.stringify({ message: ["content is required"], statusCode: 400 })}\n`);
  });

  it("asks once and shows the answer: a rate limit is not waited out and a server error is not tried again", async () => {
    for (const [status, headers] of [[429, { "retry-after": "1" }], [503, {}], [502, {}], [429, { "retry-after": "3600" }]]) {
      answering({ message: "no" }, status, headers);
      const before = api.requests.length;
      const started = Date.now();
      const { code, stderr } = await run(["integrations:list"], { env: env() });
      assert.equal(code, 1);
      assert.equal(api.requests.length - before, 1, `${status} was asked again`);
      assert.match(stderr, new RegExp(`API Error \\(${status}\\)`));
      assert.ok(Date.now() - started < 10_000, "a wait was made");
    }
  });

  it("says a key the server refuses is refused, with exit 1 (the reference has no other code)", async () => {
    answering({ message: "Invalid API key" }, 401);
    const { code, stderr } = await run(["posts:list"], { env: env() });
    assert.equal(code, 1);
    assert.match(stderr, /^❌ Failed to list posts: Request failed: API Error \(401\): /);
  });

  it("says the address could not be reached, in one sentence, and never prints a stack", async () => {
    const dead = await startFakeApi(() => ({}));
    const url = dead.url;
    await dead.close();
    const { code, stderr } = await run(["integrations:list"], { env: { IHATEPOSTING_API_KEY: KEY, IHATEPOSTING_API_URL: url } });
    assert.equal(code, 1);
    assert.match(stderr, /^❌ Failed to list integrations: Request failed: .+\n$/);
    assert.ok(!/\n\s+at /.test(stderr));
  });

  it("says how to sign in when nobody is, as the reference's does (its own wording, renamed), and asks nothing", async () => {
    const before = api.requests.length;
    const { code, stdout, stderr } = await run(["integrations:list"], { env: { IHATEPOSTING_API_URL: api.url } });
    assert.equal(code, 1);
    assert.equal(stdout, "");
    assert.equal(stderr, "❌ Error: No authentication found.\nOptions:\n  1. OAuth2: ihateposting auth:login\n  2. API Key: export IHATEPOSTING_API_KEY=your_api_key\n");
    assert.equal(api.requests.length, before);
  });
});

describe("what was saved and the environment", () => {
  it("uses what auth:login saved first, with its address, and the environment's key and address only when nothing was saved", async () => {
    const home = tempDir();
    fs.mkdirSync(path.join(home, ".ihateposting"), { recursive: true });
    fs.writeFileSync(credentialsFile(home), JSON.stringify({ accessToken: TOKEN, apiUrl: api.url, organizationId: "org-1" }));
    answering([]);
    const saved = await run(["integrations:list"], { home, env: { IHATEPOSTING_API_KEY: "from-env", IHATEPOSTING_API_URL: "http://127.0.0.1:1" } });
    assert.equal(saved.code, 0, saved.stderr);
    assert.equal(last().headers.authorization, TOKEN);
    const viaEnv = await run(["integrations:list"], { home: tempDir(), env: { IHATEPOSTING_API_KEY: "any text at all", IHATEPOSTING_API_URL: api.url } });
    assert.equal(viaEnv.code, 0);
    assert.equal(last().headers.authorization, "any text at all", "a key of any shape is taken");
  });

  it("goes to the default API address when the environment names none (the request is refused on this computer, so no real server is ever reached)", async () => {
    const refused = path.join(tempDir(), "refused.txt");
    const preload = fileURLToPath(new URL("./refuse-network.cjs", import.meta.url)).replaceAll("\\", "/");
    const { code, stderr } = await run(["integrations:list"], { env: { IHATEPOSTING_API_KEY: KEY, IHATEPOSTING_API_URL: "", NODE_OPTIONS: `--require "${preload}"`, IHP_REFUSED: refused } });
    assert.equal(code, 1);
    assert.match(stderr, /^❌ Failed to list integrations: Request failed: refused: this test does not reach the network/);
    assert.equal(fs.readFileSync(refused, "utf8"), "https://app.ihateposting.com/api/public/v1/integrations\n");
  });
});

describe("auth:status and auth:logout", () => {
  it("shows a saved sign-in first (8 characters of the token), checks it with the API, and ends with 0", async () => {
    const home = tempDir();
    fs.mkdirSync(path.join(home, ".ihateposting"), { recursive: true });
    fs.writeFileSync(credentialsFile(home), JSON.stringify({ accessToken: TOKEN, apiUrl: api.url, organizationId: "org-1" }));
    answering([{ id: "c1" }, { id: "c2" }]);
    const { code, stdout } = await run(["auth:status"], { home, env: { IHATEPOSTING_API_KEY: KEY } });
    assert.equal(code, 0);
    assert.deepEqual(lines(stdout).slice(0, 5), ["🔐 Authentication method: OAuth2", `📡 API URL: ${api.url}`, `🔑 Token: ${TOKEN.slice(0, 8)}...`, "🏢 Organization: org-1", `📁 Credentials file: ${credentialsFile(home)}`]);
    assert.ok(stdout.includes("\n🔄 Verifying credentials...\n✅ Credentials are valid. 2 integration(s) connected."));
    assert.equal(last().headers.authorization, TOKEN, "the saved token wins over the environment");
    assert.ok(!stdout.includes(TOKEN));
  });

  it("falls back to the environment's key, and says a key the server refuses is expired, still ending with 0", async () => {
    answering({}, 401);
    const { code, stdout } = await run(["auth:status"], { env: env() });
    assert.equal(code, 0);
    assert.deepEqual(lines(stdout).slice(0, 2), ["🔑 Authentication method: API Key (environment variable)", `🔑 Key: ${KEY.slice(0, 8)}...`]);
    assert.ok(stdout.includes("❌ Credentials are expired or invalid. Please re-authenticate.\n   Update your IHATEPOSTING_API_KEY environment variable."));
    assert.ok(!stdout.includes(KEY));
    answering("down", 500);
    assert.match((await run(["auth:status"], { env: env() })).stdout, /⚠️  Could not verify credentials \(HTTP 500\): down/);
  });

  it("says nobody is signed in, with the two ways, and ends with 0", async () => {
    const { code, stdout } = await run(["auth:status"], {});
    assert.equal(code, 0);
    assert.equal(stdout, "❌ Not authenticated.\n\nOptions:\n  1. OAuth2: ihateposting auth:login\n  2. API Key: export IHATEPOSTING_API_KEY=your_api_key\n");
  });

  it("removes what was saved, and says so when there was nothing", async () => {
    const home = tempDir();
    fs.mkdirSync(path.join(home, ".ihateposting"), { recursive: true });
    fs.writeFileSync(credentialsFile(home), JSON.stringify({ accessToken: TOKEN, apiUrl: api.url }));
    assert.equal((await run(["auth:logout"], { home })).stdout, "✅ Credentials removed.\n");
    assert.equal(fs.existsSync(credentialsFile(home)), false);
    assert.equal((await run(["auth:logout"], { home })).stdout, "ℹ️  No stored credentials found.\n");
  });

  it("treats a saved file without a token, or one that is not JSON, as nothing saved", async () => {
    const home = tempDir();
    fs.mkdirSync(path.join(home, ".ihateposting"), { recursive: true });
    for (const bad of ["", "{", "null", "[]", '{"accessToken":""}', '{"apiUrl":"x"}']) {
      fs.writeFileSync(credentialsFile(home), bad);
      const { stdout } = await run(["auth:status"], { home });
      assert.ok(stdout.startsWith("❌ Not authenticated."), JSON.stringify(bad));
    }
  });
});

describe("help, version and what is not a command", () => {
  it("prints yargs' own help with the commands in the reference's order, no clipping, no advertisement, and its epilogue with our names", async () => {
    const { code, stdout, stderr } = await run(["--help"], {});
    assert.equal(code, 0);
    assert.equal(stderr, "");
    assert.ok(stdout.startsWith("ihateposting <command> [options]\n\nCommands:\n"));
    const names = [...stdout.matchAll(/^  ihateposting (\S+)/gm)].map((m) => m[1]);
    assert.deepEqual(names, ["posts:create", "posts:list", "posts:delete", "posts:missing", "posts:status", "posts:settings", "posts:attachments", "posts:connect", "integrations:list", "integrations:groups", "integrations:settings", "integrations:trigger", "analytics:platform", "analytics:post", "upload", "media:status", "media:list", "auth:login", "auth:logout", "auth:status"]);
    assert.ok(!/clipping|agent-media|pos(?:ti)z/i.test(stdout));
    assert.match(stdout, /Options:\n  -h, --help     Show help +\[boolean\]\n  -v, --version  Show version number +\[boolean\]\n\nFor more information, visit: https:\/\/ihateposting\.com\n\nAuthentication:\n  OAuth2: ihateposting auth:login\n  API Key: export IHATEPOSTING_API_KEY=your_api_key\n$/);
    assert.equal((await run(["-h"], {})).stdout, stdout);
  });

  it("prints the version for --version and -v, and the usage (on stderr, with 'You need at least one command') for no command, ending with 1", async () => {
    assert.match((await run(["--version"], {})).stdout, /^\d+\.\d+\.\d+\n$/);
    assert.equal((await run(["-v"], {})).stdout, (await run(["--version"], {})).stdout);
    const none = await run([], {});
    assert.equal(none.code, 1);
    assert.equal(none.stdout, "");
    assert.ok(none.stderr.startsWith("ihateposting <command> [options]"));
    assert.ok(none.stderr.trimEnd().endsWith("You need at least one command"));
  });

  it("does nothing, silently, with exit 0, for a word that is not a command, as yargs does here: the old command line of the live app that `ihateposting` was before 1.0.0 (login, logout, whoami, accounts, platforms, boards, posts, post, skill) is not part of this program, so a script of it ends without an error and without a result (the owner kept the reference's behaviour on 2026-11-19)", async () => {
    const oldCommandLine = [["accounts"], ["platforms"], ["boards"], ["posts"], ["logout"], ["skill"], ["post", "hello", "--to", "bluesky", "--now"], ["post", "hello", "--to", "linkedin", "--at", "2026-12-01 9:00 AM", "--check"]];
    for (const argv of [["posts:explode"], ["login", KEY], ["whoami"], ["clipping:create", "x"], ["notifications"], ["upload:url", "x"], ["groups:list"], ...oldCommandLine]) {
      const { code, stdout, stderr } = await run(argv, { env: env() });
      assert.deepEqual([code, stdout, stderr], [0, "", ""], argv.join(" "));
    }
  });

  it("shows one command's usage with its options, defaults and examples for `<command> --help`", async () => {
    const { code, stdout } = await run(["posts:create", "--help"], {});
    assert.equal(code, 0);
    assert.match(stdout, /^ihateposting posts:create\n\nCreate a new post\n\nOptions:\n  -c, --content {7}Post\/comment content \(can be used multiple times\) +\[string\]/);
    assert.match(stdout, /-t, --type +Post type: "schedule" or "draft"\n +\[string\] \[choices: "schedule", "draft"\] \[default: "schedule"\]/);
    assert.match(stdout, /--shortLink +Use short links +\[boolean\] \[default: true\]/);
    assert.match(stdout, /Examples:\n/);
    assert.ok(!/reddit|pos(?:ti)z/i.test(stdout));
  });

  it("takes an option it does not know without complaint, as yargs does, and uses what it does know", async () => {
    answering([]);
    const { code } = await run(["integrations:list", "--bogus", "x", "--group", "g9"], { env: env() });
    assert.equal(code, 0);
    assert.deepEqual(last().query, { group: "g9" });
  });
});
