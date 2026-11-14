// `auth:login`: the device flow, as the reference command line does it (owner, 2026-11-13), against a stand-in for the sign-in server (`POST /device/code`
// and `POST /device/token`): the code is asked for and shown, the program asks every `interval` seconds until a person has answered, and the token is kept; and every
// way it can end otherwise. The program is a child process, so each wait is a real one: the stand-in names an interval of one second.
import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { credentialsFile, run, startFakeApi, tempDir } from "./helpers.mjs";

const DEVICE = "d".repeat(64);
const TOKEN = `pos_${"Z".repeat(40)}`;
const pending = { status: 400, body: { error: "authorization_pending" } };
const granted = (extra = {}) => ({ status: 200, body: { access_token: TOKEN, api_url: "https://api.example/api", organization_id: "org-1", ...extra } });

/** A stand-in for the sign-in routes: `polls` is what each ask of `/device/token` is answered with, in order (the last one repeats). */
async function fakeServer({ polls = [pending, granted()], code = {}, codeStatus = 200, codeBody } = {}) {
  let at = 0;
  const server = await startFakeApi((req) => {
    if (req.path === "/device/code") return codeBody !== undefined ? { status: codeStatus, body: codeBody } : { status: codeStatus, body: { device_code: DEVICE, user_code: "ABCD-EF23", verification_uri: `${server.url}/device`, expires_in: 30, interval: 1, ...code } };
    if (req.path === "/device/token") return polls[Math.min(at++, polls.length - 1)];
    return { status: 404, body: {} };
  });
  return server;
}

const login = (server, { argv = [], env = {}, home = tempDir() } = {}) => run(["auth:login", ...argv], { home, env: { IHATEPOSTING_AUTH_SERVER: server.url, ...env } });

describe("auth:login", () => {
  it("asks for a code, shows it in a box with the page to type it on, asks at the server's pace, and keeps the token and the address it names", async () => {
    const server = await fakeServer();
    const started = Date.now();
    const r = await login(server);
    assert.equal(r.code, 0, r.stderr);
    assert.equal(
      r.stdout,
      [
        "🔐 Starting device authorization flow...",
        "",
        "  Your authorization code:",
        "",
        "    ┌─────────────────┐",
        "    │    ABCD-EF23    │",
        "    └─────────────────┘",
        "",
        "  Open this URL and enter the code above:",
        `  ${server.url}/device`,
        "",
        "  Waiting for authorization...",
        "",
        "✅ Successfully authenticated!",
        `📁 Credentials saved to ${credentialsFile(r.home)}`,
        "🏢 Organization ID: org-1",
        "",
      ].join("\n"),
    );
    assert.ok(Date.now() - started >= 1900, "it did not wait the interval between its asks");
    assert.deepEqual(JSON.parse(fs.readFileSync(credentialsFile(r.home), "utf8")), { accessToken: TOKEN, apiUrl: "https://api.example/api", organizationId: "org-1" });
    const [asked, ...polled] = server.requests;
    assert.deepEqual([asked.method, asked.path, asked.text, asked.headers["content-type"]], ["POST", "/device/code", "", "application/json"]);
    assert.equal(polled.length, 2);
    for (const p of polled) assert.deepEqual([p.method, p.path, p.json], ["POST", "/device/token", { device_code: DEVICE }]);
    assert.ok(!(r.stdout + r.stderr).includes(TOKEN));
    assert.ok(!(r.stdout + r.stderr).includes(DEVICE));
    await server.close();
  });

  it("asks the server --auth-server names before the one IHATEPOSTING_AUTH_SERVER names", async () => {
    const [env, flag] = [await fakeServer({ polls: [granted()] }), await fakeServer({ polls: [granted()] })];
    const r = await run(["auth:login", "--auth-server", flag.url], { env: { IHATEPOSTING_AUTH_SERVER: env.url } });
    assert.equal(r.code, 0, r.stderr);
    assert.equal(flag.requests.length, 2);
    assert.equal(env.requests.length, 0);
    await Promise.all([env.close(), flag.close()]);
  });

  it("keeps the default API address when the server names none, and no organization when it names none", async () => {
    const server = await fakeServer({ polls: [{ status: 200, body: { access_token: TOKEN } }] });
    const r = await login(server);
    assert.equal(r.code, 0);
    const saved = JSON.parse(fs.readFileSync(credentialsFile(r.home), "utf8"));
    assert.equal(saved.accessToken, TOKEN);
    assert.equal(saved.apiUrl, "https://app.ihateposting.com/api");
    assert.ok(!("organizationId" in saved) || saved.organizationId === undefined);
    assert.ok(!r.stdout.includes("Organization ID"));
    await server.close();
  });

  it("ends with the reference's sentences when the code expires, fails in another way (the error's own word) or the time is up, and keeps nothing", async () => {
    const cases = [
      [[{ status: 400, body: { error: "expired_token" } }], "❌ Authorization expired. Please try again."],
      [[{ status: 400, body: { error: "access_denied" } }], "❌ Authorization failed: access_denied"],
      [[{ status: 400, body: { error: "invalid_device_code" } }], "❌ Authorization failed: invalid_device_code"],
      [[{ status: 500, body: {} }], "❌ Authorization failed: undefined"],
      [[pending], "❌ Authorization timed out. Please try again."],
    ];
    for (const [polls, said] of cases) {
      const server = await fakeServer({ polls, code: { expires_in: 2 } });
      const r = await login(server);
      assert.equal(r.code, 1, said);
      assert.equal(r.stderr, `${said}\n`);
      assert.equal(fs.existsSync(credentialsFile(r.home)), false, "something was kept");
      await server.close();
    }
  });

  it("keeps asking through an answer that is not JSON, as the reference's does, and takes the token when it comes", async () => {
    const server = await fakeServer({ polls: [{ status: 502, body: "<html>bad gateway</html>" }, { status: 200, body: "" }, pending, granted()] });
    const r = await login(server);
    assert.equal(r.code, 0, r.stderr);
    assert.equal(server.requests.filter((q) => q.path === "/device/token").length, 4);
    await server.close();
  });

  it("says when the server cannot be reached or refuses to start, in the reference's words", async () => {
    const dead = await startFakeApi(() => ({}));
    const url = dead.url;
    await dead.close();
    const unreachable = await login({ url });
    assert.equal(unreachable.code, 1);
    assert.match(unreachable.stderr, new RegExp(`^❌ Could not reach auth server at ${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}: `));
    const refusing = await fakeServer({ codeStatus: 429, codeBody: { error: "temporarily_unavailable" } });
    const refused = await login(refusing);
    assert.equal(refused.code, 1);
    assert.equal(refused.stderr, '❌ Failed to start authorization (429): {"error":"temporarily_unavailable"}\n');
    await refusing.close();
  });

  it("is never given the request's secret or the token on its own screen", async () => {
    const server = await fakeServer();
    const r = await login(server);
    assert.ok(!(r.stdout + r.stderr).includes(DEVICE));
    assert.ok(!(r.stdout + r.stderr).includes(TOKEN));
    await server.close();
  });

  it("keeps the saved file for the person only (where the file system has such modes)", async () => {
    const server = await fakeServer({ polls: [granted()] });
    const r = await login(server);
    if (process.platform !== "win32") assert.equal(fs.statSync(credentialsFile(r.home)).mode & 0o777, 0o600);
    assert.ok(fs.existsSync(credentialsFile(r.home)));
    await server.close();
  });
});
