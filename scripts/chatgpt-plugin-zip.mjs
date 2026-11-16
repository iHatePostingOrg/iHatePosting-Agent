#!/usr/bin/env node
// Builds the ZIP that is uploaded at https://platform.openai.com/plugins ("Upload new or existing plugin") for the ChatGPT / Codex
// plugin in plugins/chatgpt-ihateposting. Written for this repository from OpenAI's published package rules
// (https://developers.openai.com/plugins/build/plugins and .../deploy/submission-errors); no outside code, no library: Node's own
// zlib does the compression and this file writes the archive's headers.
//
//   node scripts/chatgpt-plugin-zip.mjs                 checks the folder, then writes dist/ihateposting-chatgpt-plugin.zip
//   node scripts/chatgpt-plugin-zip.mjs --check         only checks the folder
//   node scripts/chatgpt-plugin-zip.mjs --source <dir> --out <file>
//
// What goes in: plugin.json, mcp.json, skills/ and assets/ (nothing else of the folder: not its README). Nothing is uploaded, signed in
// or sent anywhere by this script; the upload is the owner's step (PUBLISHING.md, "Submissions").
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "..");
export const DEFAULT_SOURCE = path.join(ROOT, "plugins", "chatgpt-ihateposting");
export const DEFAULT_OUT = path.join(ROOT, "dist", "ihateposting-chatgpt-plugin.zip");

/** OpenAI's limits for an uploaded ZIP (submission-errors page). */
export const LIMITS = { zipBytes: 100 * 1000 * 1000, entries: 5000, unzippedBytes: 512 * 1024 * 1024, memberBytes: 100 * 1024 * 1024, segments: 20 };
/** The tools the hosted server offers (apps/backend/src/mcp/mcp-tools.ts of the app): the review cases may name only these. */
export const KNOWN_TOOLS = ["integrationList", "groupList", "integrationSchema", "triggerTool", "integrationSchedulePostTool", "postsListTool", "postSettingsTool", "deletePostTool", "uploadFromUrlTool", "mediaListTool", "mediaStatusTool", "uploadWidgetTool", "uploadWidgetTicketTool", "uploadWidgetStatusTool"];
const PLUGIN_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
const MCP_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json";
const INCLUDED = ["plugin.json", "mcp.json", "skills", "assets"];
const PORTABLE_KEYS = new Set(["$schema", "name", "version", "description", "author", "homepage", "repository", "license", "keywords", "extensions"]);

// ---------------------------------------------------------------- CRC-32 and the ZIP format

const TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
export function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** A ZIP of `entries` ({ name, data }), names sorted, a fixed timestamp (1980-01-01) so the same files always give the same bytes. */
export function buildZip(entries) {
  const sorted = [...entries].sort((a, b) => Buffer.compare(Buffer.from(a.name), Buffer.from(b.name)));
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of sorted) {
    const nameBytes = Buffer.from(name, "utf8");
    const deflated = zlib.deflateRawSync(data, { level: 9 });
    const stored = deflated.length >= data.length;
    const body = stored ? data : deflated;
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // names are UTF-8
    local.writeUInt16LE(stored ? 0 : 8, 8);
    local.writeUInt16LE(0, 10); // time 00:00:00
    local.writeUInt16LE(0x0021, 12); // date 1980-01-01
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBytes, body);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4); // made on Unix, so the permissions below are read
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(stored ? 0 : 8, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x0021, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(((0o100644 << 16) >>> 0), 38); // a regular file, rw-r--r--
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBytes);
    offset += 30 + nameBytes.length + body.length;
  }
  const centralBytes = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(sorted.length, 8);
  end.writeUInt16LE(sorted.length, 10);
  end.writeUInt32LE(centralBytes.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBytes, end]);
}

/** Reads a ZIP back (the central directory, every entry inflated and its CRC and size checked): [{ name, data }], or throws. */
export function readZip(zip) {
  if (zip.length < 22) throw new Error("not a ZIP: too short");
  let end = -1;
  for (let at = zip.length - 22; at >= Math.max(0, zip.length - 22 - 65535); at--) {
    if (zip.readUInt32LE(at) === 0x06054b50) {
      end = at;
      break;
    }
  }
  if (end < 0) throw new Error("not a ZIP: no end-of-directory record");
  const count = zip.readUInt16LE(end + 10);
  let at = zip.readUInt32LE(end + 16);
  const out = [];
  for (let i = 0; i < count; i++) {
    if (zip.readUInt32LE(at) !== 0x02014b50) throw new Error("broken central directory");
    const method = zip.readUInt16LE(at + 10);
    const crc = zip.readUInt32LE(at + 16);
    const packed = zip.readUInt32LE(at + 20);
    const size = zip.readUInt32LE(at + 24);
    const nameLength = zip.readUInt16LE(at + 28);
    const extraLength = zip.readUInt16LE(at + 30);
    const commentLength = zip.readUInt16LE(at + 32);
    const local = zip.readUInt32LE(at + 42);
    const name = zip.subarray(at + 46, at + 46 + nameLength).toString("utf8");
    if (zip.readUInt32LE(local) !== 0x04034b50) throw new Error(`broken local header of ${name}`);
    const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    const body = zip.subarray(start, start + packed);
    const data = method === 0 ? Buffer.from(body) : method === 8 ? zlib.inflateRawSync(body) : (() => { throw new Error(`${name}: unsupported compression ${method}`); })();
    if (data.length !== size) throw new Error(`${name}: size does not match`);
    if (crc32(data) !== crc) throw new Error(`${name}: checksum does not match`);
    out.push({ name, data });
    at += 46 + nameLength + extraLength + commentLength;
  }
  return out;
}

// ---------------------------------------------------------------- collecting the files

/** The files that go into the ZIP: [{ name (with /), file }], sorted; throws on anything that is not a plain file or folder. */
export function collect(source) {
  const entries = [];
  const walk = (dir, prefix) => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      const name = `${prefix}${item.name}`;
      if (item.name === ".DS_Store" || item.name === "Thumbs.db") continue;
      const stat = fs.lstatSync(full);
      if (stat.isSymbolicLink()) throw new Error(`${name} is a symbolic link; a ZIP may hold only plain files`);
      if (stat.isDirectory()) walk(full, `${name}/`);
      else if (stat.isFile()) entries.push({ name, file: full, size: stat.size });
      else throw new Error(`${name} is not a plain file`);
    }
  };
  for (const part of INCLUDED) {
    const full = path.join(source, part);
    if (!fs.existsSync(full) && !fs.lstatSync(source, { throwIfNoEntry: false })) throw new Error(`${source} does not exist`);
    if (!fs.existsSync(full)) continue;
    const stat = fs.lstatSync(full);
    if (stat.isSymbolicLink()) throw new Error(`${part} is a symbolic link`);
    if (stat.isDirectory()) walk(full, `${part}/`);
    else entries.push({ name: part, file: full, size: stat.size });
  }
  return entries.sort((a, b) => Buffer.compare(Buffer.from(a.name), Buffer.from(b.name)));
}

// ---------------------------------------------------------------- the checks (OpenAI's rules for a public MCP plugin)

const https = (value, max = 1024) => {
  if (typeof value !== "string" || value.length === 0 || value.length > max) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.hash;
  } catch {
    return false;
  }
};
const text = (value, max) => typeof value === "string" && value.trim().length > 0 && value.length <= max;
const hasKey = (value, names) => (value && typeof value === "object" ? Object.entries(value).some(([k, v]) => names.includes(k) || hasKey(v, names)) : false);

function pngSize(buffer) {
  if (buffer.length < 24 || buffer.readUInt32BE(0) !== 0x89504e47 || buffer.readUInt32BE(4) !== 0x0d0a1a0a) return undefined;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/** Every problem found in the plugin folder, as sentences (an empty list means it can be zipped and uploaded). */
export function validatePlugin(source) {
  const problems = [];
  const add = (message) => problems.push(message);
  const read = (file) => {
    try {
      return fs.readFileSync(path.join(source, file));
    } catch {
      return undefined;
    }
  };
  const json = (file) => {
    const buffer = read(file);
    if (!buffer) return add(`${file} is missing`);
    try {
      return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(buffer));
    } catch (error) {
      return add(`${file} is not valid UTF-8 JSON: ${error.message}`);
    }
  };

  const plugin = json("plugin.json");
  if (plugin && typeof plugin === "object") {
    if (plugin.$schema !== PLUGIN_SCHEMA) add(`plugin.json "$schema" must be ${PLUGIN_SCHEMA}`);
    for (const key of Object.keys(plugin)) if (!PORTABLE_KEYS.has(key)) add(`plugin.json has the key "${key}", which the portable format does not allow at the top level`);
    if (typeof plugin.name !== "string" || plugin.name.length > 64 || !/^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(plugin.name)) add("plugin.json name must be at most 64 characters: lowercase letters, digits, dots and single hyphens");
    if (typeof plugin.version !== "string" || !/^\d+\.\d+\.\d+$/.test(plugin.version)) add("plugin.json version must be a semantic version like 1.0.0");
    if (!text(plugin.description, 4000)) add("plugin.json description must be 1 to 4000 characters");
    if (plugin.homepage !== undefined && !https(plugin.homepage, 2048)) add("plugin.json homepage must be an https address");
    if (hasKey(plugin, ["test_credentials", "reviewer_instructions"])) add("plugin.json must not hold test_credentials or reviewer_instructions: reviewer access is typed in the portal");
    const openai = plugin.extensions?.["com.openai"];
    if (!openai || typeof openai !== "object") add('plugin.json needs extensions["com.openai"]');
    else {
      if (openai.hooks !== undefined || openai.apps !== undefined) add("plugin.json must not declare hooks or apps: a plugin with them cannot be submitted");
      const ui = openai.interface ?? {};
      if (!text(ui.displayName, 30)) add("interface.displayName must be 1 to 30 characters");
      else if (/\b(mcp|plugin)\b/i.test(ui.displayName)) add('interface.displayName must not contain "MCP" or "Plugin"');
      if (!text(ui.shortDescription, 30)) add("interface.shortDescription must be 1 to 30 characters");
      if (!text(ui.longDescription, 4000)) add("interface.longDescription must be 1 to 4000 characters");
      if (!text(ui.developerName, 80)) add("interface.developerName must be 1 to 80 characters");
      if (!text(ui.category, 100)) add("interface.category must be given");
      if (!Array.isArray(ui.capabilities) || ui.capabilities.length > 20 || ui.capabilities.some((c) => !text(c, 120))) add("interface.capabilities must be at most 20 labels of at most 120 characters");
      for (const key of ["websiteURL", "supportURL", "privacyPolicyURL", "termsOfServiceURL"]) if (!https(ui[key])) add(`interface.${key} must be an https address (all four are required for an MCP plugin)`);
      if (ui.defaultPrompt !== undefined) {
        const prompts = Array.isArray(ui.defaultPrompt) ? ui.defaultPrompt : [ui.defaultPrompt];
        if (prompts.length > 3 || prompts.some((p) => !text(p, 128)) || new Set(prompts).size !== prompts.length) add("interface.defaultPrompt must be at most three different prompts of at most 128 characters");
      }
      for (const key of ["brandColor", "brandColorDark"]) if (ui[key] !== undefined && !/^#[0-9A-Fa-f]{6}$/.test(ui[key])) add(`interface.${key} must be #RRGGBB`);
      for (const key of ["logo", "composerIcon", "logoDark", "composerIconDark"]) {
        if (ui[key] === undefined) {
          if (key === "logo" || key === "composerIcon") add(`interface.${key} is required`);
          continue;
        }
        if (typeof ui[key] !== "string" || !ui[key].startsWith("./") || ui[key].split("/").includes("..") || ui[key].includes("\\") || path.isAbsolute(ui[key])) {
          add(`interface.${key} must be a relative path starting with ./ and staying inside the plugin`);
          continue;
        }
        const file = read(ui[key].slice(2));
        if (!file) add(`interface.${key} points at ${ui[key]}, which is not in the folder`);
        else if (!/\.(png|jpe?g|webp|svg)$/i.test(ui[key])) add(`${ui[key]} must be a .png, .jpg, .jpeg, .webp or .svg file`);
        else if (file.length > 5 * 1024 * 1024) add(`${ui[key]} is over 5 MiB`);
        else if (/\.png$/i.test(ui[key])) {
          const size = pngSize(file);
          if (!size) add(`${ui[key]} is not a PNG file although its name says so`);
          else if (size.width !== size.height || size.width < 48 || size.width > 4096) add(`${ui[key]} must be square, from 48 to 4096 pixels (it is ${size.width} x ${size.height})`);
        }
      }
      const cases = openai.review?.test_cases;
      const positive = cases?.positive;
      const negative = cases?.negative;
      if (!Array.isArray(positive) || positive.length !== 5) add("review.test_cases.positive must hold exactly five cases");
      if (!Array.isArray(negative) || negative.length !== 3) add("review.test_cases.negative must hold exactly three cases");
      for (const [i, c] of (positive ?? []).entries()) {
        for (const key of ["description", "prompt", "tools_triggered", "expected_behavior"]) if (!text(c?.[key], 4000)) add(`positive case ${i + 1} lacks ${key}`);
        for (const tool of String(c?.tools_triggered ?? "").split(",").map((t) => t.trim()).filter(Boolean)) if (!KNOWN_TOOLS.includes(tool)) add(`positive case ${i + 1} names "${tool}", which is not a tool of the hosted server`);
      }
      for (const [i, c] of (negative ?? []).entries()) for (const key of ["description", "prompt"]) if (!text(c?.[key], 4000)) add(`negative case ${i + 1} lacks ${key}`);
      if (openai.review?.commerce !== false) add("review.commerce must be false: this plugin sells nothing");
      if (openai.review?.demo_recording_url !== undefined && !https(openai.review.demo_recording_url, 2048)) add("review.demo_recording_url must be an https address");
      if (!text(openai.publication?.release_notes, 4000)) add("publication.release_notes must be given");
      if (openai.onboardingSkill !== undefined) {
        const m = /^\.\/skills\/([^/]+)\/SKILL\.md$/.exec(String(openai.onboardingSkill));
        if (!m || !read(`skills/${m[1]}/SKILL.md`)) add("onboardingSkill must be ./skills/<name>/SKILL.md of an included skill");
      }
    }
  }

  const mcp = json("mcp.json");
  if (mcp && typeof mcp === "object") {
    if (mcp.$schema !== MCP_SCHEMA) add(`mcp.json "$schema" must be ${MCP_SCHEMA}`);
    const servers = mcp.mcpServers && typeof mcp.mcpServers === "object" ? Object.entries(mcp.mcpServers) : [];
    if (servers.length !== 1) add("mcp.json must declare exactly one MCP server");
    for (const [name, server] of servers) {
      if (!name.trim()) add("the MCP server needs a name");
      if (server?.type !== "streamable-http") add('the MCP server type must be "streamable-http"');
      if (!https(server?.url, 2048) || new URL(server.url).search || /^(localhost|127\.|\[::1\]|0\.0\.0\.0)/.test(new URL(server.url).hostname)) add("the MCP server url must be a public https address without a query");
      if (server?.headers && Object.keys(server.headers).length > 0) add("the MCP server must have no headers: a public submission rejects them");
      const auth = server?.extensions?.["com.openai"]?.auth;
      if (!auth || !["oauth", "none", "mixed"].includes(auth.type)) add('the MCP server needs extensions["com.openai"].auth of type oauth, none or mixed (the portal has no API-key flow)');
      if (hasKey(server, ["clientSecret", "client_secret", "token", "apiKey", "api_key", "password"])) add("mcp.json must hold no secret");
    }
  }

  // Skills.
  const skillsDir = path.join(source, "skills");
  const names = [];
  let folders = [];
  try {
    folders = fs.readdirSync(skillsDir, { withFileTypes: true });
  } catch {
    add("the skills folder is missing: a public plugin needs at least one skill");
  }
  for (const folder of folders) {
    if (!folder.isDirectory()) {
      add(`skills/${folder.name} is not a folder`);
      continue;
    }
    if (folder.name.startsWith(".")) add(`skills/${folder.name}: a skill folder's name must not start with a dot`);
    const buffer = read(`skills/${folder.name}/SKILL.md`);
    if (!buffer) {
      add(`skills/${folder.name} has no SKILL.md`);
      continue;
    }
    let body;
    try {
      body = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch {
      add(`skills/${folder.name}/SKILL.md is not valid UTF-8`);
      continue;
    }
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(body);
    if (!match) {
      add(`skills/${folder.name}/SKILL.md must start with YAML front matter between --- lines`);
      continue;
    }
    const field = (key) => new RegExp(`^${key}:[ \\t]*(.+)$`, "m").exec(match[1])?.[1].trim();
    const name = field("name");
    const description = field("description");
    if (!name) add(`skills/${folder.name}/SKILL.md lacks a name`);
    else if (name !== folder.name) add(`skills/${folder.name}/SKILL.md: name "${name}" is not the folder's name`);
    if (!description) add(`skills/${folder.name}/SKILL.md lacks a description`);
    else if (description.length > 1024) add(`skills/${folder.name}/SKILL.md: description is over 1,024 characters`);
    if (!match[2].trim()) add(`skills/${folder.name}/SKILL.md has no instructions`);
    if (plugin?.name && name && `${plugin.name}:${name}`.length > 64) add(`${plugin.name}:${name} is over 64 characters`);
    if (name) names.push(name);
  }
  if (folders.length > 0 && names.length === 0) add("no valid skill was found");
  if (new Set(names).size !== names.length) add("two skills have the same name");
  return problems;
}

// ---------------------------------------------------------------- the command

/** Checks the folder and returns the ZIP's bytes (throws with every problem named when the folder is not fit to upload). */
export function buildPluginZip(source = DEFAULT_SOURCE) {
  const problems = validatePlugin(source);
  if (problems.length > 0) throw new Error(`The plugin folder is not ready:\n- ${problems.join("\n- ")}`);
  const files = collect(source);
  if (files.length > LIMITS.entries) throw new Error(`${files.length} files: a ZIP may hold at most ${LIMITS.entries}`);
  let unzipped = 0;
  const entries = files.map(({ name, file, size }) => {
    if (name.includes("\\") || name.split("/").length > LIMITS.segments || name.split("/").includes("..") || name.startsWith("/")) throw new Error(`${name}: not a safe archive path`);
    if (size > LIMITS.memberBytes) throw new Error(`${name} is over 100 MiB`);
    unzipped += size;
    return { name, data: fs.readFileSync(file) };
  });
  if (unzipped > LIMITS.unzippedBytes) throw new Error("the files together are over 512 MiB");
  const zip = buildZip(entries);
  if (zip.length > LIMITS.zipBytes) throw new Error("the ZIP is over 100 MB");
  // The archive is read back before it is trusted: every entry inflated, its size and checksum compared.
  const back = readZip(zip);
  if (back.length !== entries.length || back.some((entry, i) => entry.name !== entries[i].name || !entry.data.equals(entries.find((e) => e.name === entry.name).data))) throw new Error("the ZIP read back differently from what was written");
  return zip;
}

function main(argv) {
  let source = DEFAULT_SOURCE;
  let out = DEFAULT_OUT;
  let checkOnly = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--check") checkOnly = true;
    else if (arg === "--source" && argv[i + 1]) source = path.resolve(argv[++i]);
    else if (arg === "--out" && argv[i + 1]) out = path.resolve(argv[++i]);
    else {
      console.error(`Unknown or incomplete option "${arg}".\nUsage: node scripts/chatgpt-plugin-zip.mjs [--check] [--source <folder>] [--out <file.zip>]`);
      return 2;
    }
  }
  let zip;
  try {
    zip = buildPluginZip(source);
  } catch (error) {
    console.error(error.message);
    return 1;
  }
  const count = readZip(zip).length;
  if (checkOnly) {
    console.log(`The plugin folder is ready: ${count} files would go into the ZIP.`);
    return 0;
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const temp = `${out}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temp, zip);
    fs.renameSync(temp, out);
  } catch (error) {
    fs.rmSync(temp, { force: true });
    console.error(`Could not write ${out}: ${error.message}`);
    return 1;
  }
  console.log(`Wrote ${out}\n${count} files, ${zip.length} bytes, sha256 ${crypto.createHash("sha256").update(zip).digest("hex")}\nNothing was uploaded: upload it at https://platform.openai.com/plugins (PUBLISHING.md, "Submissions").`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main(process.argv.slice(2));
