// Breaking the command line (the owner's rule: "after every task, you have to break your app"): a server that is hostile, slow, huge, cut off or nonsense, input that is hostile
// or enormous, several people at once, and that no key or token is printed. The command line does what the reference does (owner, 2026-11-13), so where the reference's
// is not careful (it waits for ever, follows redirects, puts an id into the address as typed), this one is not either: those tests say what happens, so a change shows.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { describe, it } from "node:test";
import { BIN, KEY, TOKEN, credentialsFile, run, startFakeApi, tempDir } from "./helpers.mjs";

const env = (url, extra = {}) => ({ IHATEPOSTING_API_KEY: KEY, IHATEPOSTING_API_URL: url, ...extra });

/** A server with a raw handler (it writes the answer itself), for answers a stand-in cannot make. */
async function raw(handler) {
  const requests = [];
  const server = http.createServer((req, res) => {
    requests.push({ method: req.method, url: req.url, headers: req.headers });
    handler(req, res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, requests, close: () => new Promise((resolve) => (server.closeAllConnections?.(), server.close(resolve))) };
}

describe("a redirect", () => {
  it("is followed, as the reference's are, and node-fetch 3 SENDS THE KEY ON to the server a redirect names (found by this test; Node's own fetch would not)", async () => {
    const other = await raw((req, res) => res.writeHead(200, { "Content-Type": "application/json" }).end('{"elsewhere":true}'));
    const first = await raw((req, res) => res.writeHead(302, { Location: `${other.url}/moved` }).end());
    const { code, stdout } = await run(["integrations:list"], { env: env(first.url) });
    assert.equal(code, 0);
    assert.ok(stdout.includes('"elsewhere": true'), "the redirect was not followed");
    assert.equal(first.requests[0].headers.authorization, KEY);
    assert.equal(other.requests.length, 1);
    // Found 2026-11-13 and told to the owner: the library the reference command line uses keeps the Authorization header when a redirect leaves the server's
    // address, so a server (or anything on the way that can answer for it) can send the key somewhere else. Matching the reference means this is so here too.
    assert.equal(other.requests[0].headers.authorization, KEY, "node-fetch no longer keeps the key on a redirect: the README and the owner's note are out of date");
    await Promise.all([first.close(), other.close()]);
  });

  it("carries a post's words to where a 307 sends them (said in the README)", async () => {
    const other = await raw((req, res) => {
      const chunks = [];
      req.on("data", (d) => chunks.push(d));
      req.on("end", () => res.writeHead(201, { "Content-Type": "application/json" }).end(JSON.stringify({ got: Buffer.concat(chunks).toString("utf8").length })));
    });
    const first = await raw((req, res) => res.writeHead(307, { Location: `${other.url}/elsewhere` }).end());
    const { code } = await run(["posts:create", "-i", "c1", "-s", "d", "-c", "These are the words"], { env: env(first.url) });
    assert.equal(code, 0);
    assert.equal(other.requests.at(-1).method, "POST", "a 307 did not keep the method");
    await Promise.all([first.close(), other.close()]);
  });
});

describe("a server that is hostile or broken", () => {
  it("is waited for for ever when it never answers (the reference's has no time limit): the program is still waiting after a few seconds", async () => {
    const silent = await raw(() => {});
    const child = spawn(process.execPath, [BIN, "integrations:list"], { env: { ...process.env, ...env(silent.url), HOME: tempDir(), USERPROFILE: tempDir() }, stdio: "ignore" });
    let ended = false;
    child.on("close", () => (ended = true));
    await new Promise((resolve) => setTimeout(resolve, 3000));
    assert.equal(ended, false, "the program gave up on a server that never answered");
    child.kill();
    await silent.close();
  });

  it("shows an answer of any size and shape as one failure or as itself: cut off, empty, binary, not JSON", async () => {
    for (const body of ['{"a":', "", Buffer.from([0, 255, 254, 1, 2]).toString("latin1"), "<html>nope</html>"]) {
      const server = await raw((req, res) => res.writeHead(200, { "Content-Type": "application/json" }).end(body));
      const r = await run(["integrations:list"], { env: env(server.url) });
      assert.equal(r.code, 1, JSON.stringify(body));
      assert.match(r.stderr, /^❌ Failed to list integrations: Request failed: .+\n$/, JSON.stringify(body));
      assert.ok(!/\n\s+at /.test(r.stderr));
      await server.close();
    }
  });

  it("fails as the reference's does for an answer nested a hundred thousand deep: the program cannot print it, says so as a failure and ends with 1", async () => {
    const server = await raw((req, res) => res.writeHead(200, { "Content-Type": "application/json" }).end("[".repeat(100_000) + "]".repeat(100_000)));
    const r = await run(["integrations:list"], { env: env(server.url) });
    assert.equal(r.code, 1);
    assert.match(r.stderr, /^❌ Failed to list integrations: Maximum call stack size exceeded\n$/);
    await server.close();
  });

  it("reads a very large answer (30 MB of JSON) whole and prints it: there is no limit", async () => {
    const big = JSON.stringify(["x".repeat(30 * 1024 * 1024)]);
    const server = await raw((req, res) => res.writeHead(200, { "Content-Type": "application/json" }).end(big));
    const r = await run(["integrations:list"], { env: env(server.url), timeout: 90_000 });
    assert.equal(r.code, 0);
    assert.ok(r.stdout.length > 30 * 1024 * 1024);
    await server.close();
  });

  it("is told when its connection closes in the middle of an answer, and when it is gone", async () => {
    const cut = await raw((req, res) => {
      res.writeHead(200, { "Content-Type": "application/json", "Content-Length": "5000" });
      res.write("{");
      setTimeout(() => res.socket.destroy(), 20);
    });
    const r = await run(["integrations:list"], { env: env(cut.url) });
    assert.equal(r.code, 1);
    assert.match(r.stderr, /^❌ Failed to list integrations: Request failed: .+\n$/);
    await cut.close();
    const gone = await raw(() => {});
    const url = gone.url;
    await gone.close();
    const g = await run(["posts:list"], { env: env(url) });
    assert.equal(g.code, 1);
    assert.match(g.stderr, /^❌ Failed to list posts: Request failed: /);
  });

  it("shows a 500 with a page of HTML, a 404 with nothing and a 401 with a JSON message each as one failure", async () => {
    for (const [status, body] of [[500, "<html><body>Internal</body></html>"], [404, ""], [401, '{"message":"Invalid API key"}']]) {
      const server = await raw((req, res) => res.writeHead(status).end(body));
      const r = await run(["integrations:list"], { env: env(server.url) });
      assert.equal(r.code, 1);
      assert.equal(r.stderr, `❌ Failed to list integrations: Request failed: API Error (${status}): ${body}\n`);
      await server.close();
    }
  });
});

describe("input that is hostile or enormous", () => {
  it("sends a megabyte of text (from a body file: a command line has a length limit of its own), five hundred comments and emoji exactly as they are", async () => {
    const server = await startFakeApi(() => ({ status: 201, body: [{ postId: "p" }] }));
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, "long.json"), JSON.stringify({ posts: [{ value: [{ content: "x".repeat(1_000_000) }] }] }));
    const a = await run(["posts:create", "--json", path.join(dir, "long.json")], { env: env(server.url) });
    assert.equal(a.code, 0, a.stderr.slice(0, 200));
    assert.equal(server.requests.at(-1).json.posts[0].value[0].content.length, 1_000_000);
    const many = Array.from({ length: 500 }, (_, i) => ["-c", `part ${i} 💥 <b>`]).flat();
    const b = await run(["posts:create", "-i", "c1", "-s", "2026-12-31T12:00:00Z", ...many], { env: env(server.url) });
    assert.equal(b.code, 0, b.stderr.slice(0, 200));
    assert.equal(server.requests.at(-1).json.posts[0].value.length, 500);
    assert.equal(server.requests.at(-1).json.posts[0].value[7].content, "part 7 💥 <b>");
    await server.close();
  });

  it("puts an id into the address as it was typed (the reference's does): a plain id lands where it should, one with a slash is read as part of the path", async () => {
    const server = await startFakeApi(() => ({ body: {} }));
    await run(["posts:missing", "plain-id"], { env: env(server.url) });
    assert.equal(server.requests.at(-1).path, "/public/v1/posts/plain-id/missing");
    await run(["posts:missing", "a/b"], { env: env(server.url) });
    assert.equal(server.requests.at(-1).path, "/public/v1/posts/a/b/missing");
    await run(["posts:missing", "x?y=1"], { env: env(server.url) });
    assert.equal(server.requests.at(-1).path, "/public/v1/posts/x", "an id with a ? is cut there, as typed");
    await server.close();
  });

  it("sends six hundred attachments (a command line has a length limit of its own), each with an id of its own, and a hostile address or alt text exactly as typed, for posts:attachments", async () => {
    const server = await startFakeApi(() => ({ body: {} }));
    const many = Array.from({ length: 600 }, (_, i) => `https://appmedia.ihateposting.com/f${i}.png`).join(",");
    const { code } = await run(["posts:attachments", "p1", "-m", many], { env: env(server.url) });
    assert.equal(code, 0);
    const { attachments } = server.requests.at(-1).json;
    assert.equal(attachments.length, 600);
    assert.equal(new Set(attachments.map((a) => a.id)).size, 600, "an id repeated");
    assert.deepEqual(attachments.map((a) => a.path), many.split(","));
    await run(["posts:attachments", "p1", "-m", "__proto__.png,constructor.png", "--alt", '{"__proto__":{"polluted":true}}\n<b>,\u202e'], { env: env(server.url) });
    assert.deepEqual(server.requests.at(-1).json.attachments.map(({ id: _id, ...rest }) => rest), [{ path: "__proto__.png", alt: '{"__proto__":{"polluted":true}}\n<b>' }, { path: "constructor.png", alt: "\u202e" }]);
    assert.equal({}.polluted, undefined);
    await server.close();
  });

  it("reads `__proto__` and `constructor` in --settings and --data as plain keys that change nothing, and sends them as they are", async () => {
    const server = await startFakeApi(() => ({ body: {} }));
    await run(["posts:settings", "p1", "--settings", '{"__proto__":{"polluted":"yes"},"constructor":{"x":1}}'], { env: env(server.url) });
    assert.equal(server.requests.at(-1).text, '{"settings":{"__proto__":{"polluted":"yes"},"constructor":{"x":1}}}');
    await run(["integrations:trigger", "c1", "m", "-d", '{"__proto__":{"polluted":"yes"}}'], { env: env(server.url) });
    assert.deepEqual(Object.keys(server.requests.at(-1).json.data), ["__proto__"]);
    await server.close();
  });

  it("takes a value as yargs turns it: a text option stays text, a repeated option is a list, and a delay that is not a number is no delay (the reference's behaviour, checked here)", async () => {
    const server = await startFakeApi(() => ({ status: 201, body: [] }));
    await run(["posts:create", "-i", "c1", "-s", "d", "-c", "007", "-d", "abc"], { env: env(server.url) });
    const sent = server.requests.at(-1).json;
    assert.equal(sent.posts[0].value[0].content, "007", "a text option was turned into a number");
    assert.equal(sent.posts[0].value[0].delay, 0);
    await run(["posts:create", "-i", "c1", "-s", "d", "-c", "x", "-t", "draft", "-t", "schedule"], { env: env(server.url) });
    assert.deepEqual(server.requests.at(-1).json.type, ["draft", "schedule"]);
    await server.close();
  });

  it("refuses a body file that is a directory, binary or enormous JSON, as a failure and without a crash", async () => {
    const server = await startFakeApi(() => ({ body: {} }));
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, "bin.json"), Buffer.from([0, 1, 2, 255]));
    fs.writeFileSync(path.join(dir, "deep.json"), "[".repeat(200_000));
    for (const file of [dir, path.join(dir, "bin.json"), path.join(dir, "deep.json")]) {
      const r = await run(["posts:create", "--json", file], { env: env(server.url) });
      assert.equal(r.code, 1, file);
      assert.match(r.stderr, /^❌ Failed to parse JSON file: /);
      assert.ok(!/\n\s+at /.test(r.stderr));
    }
    assert.equal(server.requests.length, 0);
    await server.close();
  });

  it("uploads a large file (50 MB) whole", async () => {
    const server = await startFakeApi(() => ({ body: { id: "m", path: "p" } }));
    const dir = tempDir();
    const big = path.join(dir, "big.mp4");
    fs.writeFileSync(big, Buffer.alloc(50 * 1024 * 1024, 1));
    const r = await run(["upload", big.replaceAll("\\", "/")], { env: env(server.url), timeout: 90_000 });
    assert.equal(r.code, 0, r.stderr.slice(0, 300));
    assert.ok(server.requests.at(-1).raw.length > 50 * 1024 * 1024);
    await server.close();
  });
});

describe("several people at once, and the key", () => {
  it("each sign in as their own saved token, never as another's, in programs of their own", async () => {
    const server = await startFakeApi((req) => ({ body: [{ asked: req.headers.authorization }] }));
    const people = Array.from({ length: 30 }, (_, i) => ({ home: tempDir(), token: `pos_${String(i).padStart(40, "A")}` }));
    for (const p of people) {
      fs.mkdirSync(path.join(p.home, ".ihateposting"), { recursive: true });
      fs.writeFileSync(credentialsFile(p.home), JSON.stringify({ accessToken: p.token, apiUrl: server.url }));
    }
    const results = await Promise.all(people.map((p) => run(["integrations:list"], { home: p.home, env: { IHATEPOSTING_API_KEY: KEY } })));
    results.forEach((r, i) => {
      assert.equal(r.code, 0);
      assert.ok(r.stdout.includes(`"asked": "${people[i].token}"`), `person ${i} was not signed in as themselves`);
      assert.ok(!people.some((p, j) => j !== i && (r.stdout + r.stderr).includes(p.token)), `person ${i} saw another's token`);
    });
    await server.close();
  });

  it("is never in anything printed whatever fails, except the first eight characters auth:status shows", async () => {
    for (const handler of [() => ({ status: 401, body: { message: "no" } }), () => ({ status: 500, body: "boom" }), () => ({ body: "<<<>>>" })]) {
      const server = await startFakeApi(handler);
      for (const argv of [["integrations:list"], ["posts:create", "-i", "c", "-c", "x", "-s", "d"], ["upload", "/does/not/exist.png"], ["auth:status"]]) {
        const r = await run(argv, { env: env(server.url, { IHATEPOSTING_API_KEY: TOKEN }) });
        const printed = (r.stdout + r.stderr).replaceAll(TOKEN.slice(0, 8) + "...", "");
        assert.ok(!printed.includes(TOKEN), `${argv[0]} printed the token`);
        assert.ok(!printed.includes(TOKEN.slice(0, 9)), `${argv[0]} printed more than eight characters of the token`);
      }
      await server.close();
    }
    const wrong = await run(["integrations:list"], { env: env("not an address", { IHATEPOSTING_API_KEY: TOKEN }) });
    assert.equal(wrong.code, 1);
    assert.ok(!(wrong.stdout + wrong.stderr).includes(TOKEN));
  });
});
