# dsh-ihateposting

A plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) that connects its agent to iHatePosting's hosted MCP server, so the agent can find your channels, read each platform's rules, handle media and schedule or draft posts. It also gives the agent a skill that says how to go about it.

Status: **0.1.0, never run inside a real `dsh`** (see "Unverified" below). It has not been published to npm.

## Install

From a clone of this repository, in the folder that holds `plugins/`:

```bash
dsh plugin --profile web add ./plugins/dsh-ihateposting
```

From npm, once it is published (it has not been published yet, so this does not work today):

```bash
dsh plugin --profile web add dsh-ihateposting
```

`web` is one of the profile templates `dsh` ships; use the profile you want. Installing straight from GitHub with `github:` is not described here, because the plugin sits in a subfolder of this repository and the public documentation only shows that form for a repository whose root is the plugin (unverified for a subfolder).

Then give it your workspace key (create one under **Settings > Agents / Dev** in the iHatePosting app) and start `dsh`:

```bash
# bash
export IHATEPOSTING_API_KEY=your_key
dsh --profile web
```

```powershell
# PowerShell
$env:IHATEPOSTING_API_KEY = "your_key"
dsh --profile web
```

`dsh --profile web --dump-config` shows the two rows below. It prints the `!!js` expressions as written, not their values, so the key does not appear in it.

## What it adds

`cordis.patch.yml` inserts two rows into the profile:

| Row | What it is | Without a key |
| --- | --- | --- |
| `ihateposting` | this package's own plugin: registers the `ihateposting` skill | refuses to load and says: "dsh-ihateposting is not loading because the environment variable IHATEPOSTING_API_KEY is empty or not set, so create a workspace key under Settings > Agents / Dev in iHatePosting and set it before starting dsh." |
| `ihateposting-mcp` | one `@deepseek-ai/dsh-mcp-client` connection to `https://app.ihateposting.com/api/mcp` over streamable HTTP, with `Authorization: Bearer <key>` | switched off (`disabled`), so no request is made |

The key is read from `IHATEPOSTING_API_KEY` only. It is sent only in the `Authorization` header of the `ihateposting-mcp` row, to the address above. The plugin's own code never prints it, logs it or contacts any address (the tests check this).

The MCP server's tools show up in the agent's tool list as `mcp__ihateposting__<tool>`.

The other address, `https://app.ihateposting.com/api/mcp/oauth` (a browser sign-in by OAuth), is **not** used: the pages of `dsh`'s MCP client that were read do not mention OAuth, and one third-party article says the client does not run it itself (unverified).

### The skill

The skill's text is iHatePosting's own `SKILL.md` (a byte for byte copy in `skill/SKILL.md`, so the package is complete without the repository; a test compares it with the repository's file). That file was written for the command line `ihateposting-agent`. So the plugin puts a short note in front of it that tells the agent to do the same jobs with the `mcp__ihateposting__` tools, to treat the commands as descriptions of jobs and to follow a tool's own description where it differs. The note does not name any tool, because the server's tool list was not checked from here. A skill written for the MCP tools would be better; this one is the cheapest true thing.

## What was verified, and from where

Everything about `dsh`'s plugin interface comes from its public repository, `deepseek-ai/deepseek-harness`, branch `master`, read on 2026-11-13 (through a fetch tool that summarises pages, so exact wording was not read by a person):

- A bundle is a package whose `package.json` has `"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }`; the patch is a YAML list whose `- insert:` rows have `id`, `name` (the package, by name) and optional `config`; the install commands for a local path, GitHub, npm and a tarball; `dsh --profile <name> --dump-config`; `dsh plugin --profile <name> remove <package>`; a package without the `dsh.bundle` declaration installs as a plain dependency only; `engines.dsh` and peer dependencies are how compatibility is checked: [docs/user/develop/basic/publish.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md) (also on the docs site: https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/publish).
- A plugin module exports `name`, optionally `inject`, and `apply`; a `Config` export must be a Schemastery schema, a plain object is not accepted (this plugin exports none): [docs/user/develop/basic/tool.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/tool.md) and [docs/user/develop/basic/config.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/config.md).
- `inject` names the services a plugin waits for: [docs/user/develop/framework/service.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/framework/service.md).
- `ctx.skills.register(skill)` is synchronous, returns a disposer, takes a kebab-case `name`, a `description`, the Markdown `content` and a required `source` (`'runtime'` is one of the documented values): [docs/subsystems/skills.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/skills.md). The service is named `skills` and a plugin that needs it lists `'skills'` in `inject`: [packages/skill/skill/src/index.ts](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill/src/index.ts) and [packages/skill/skill-filesystem/src/index.ts](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill-filesystem/src/index.ts).
- The MCP client is the plugin `@deepseek-ai/dsh-mcp-client`, one row per server, with `transport` (`stdio` or `streamable-http`), `serverName` (1 to 32 letters, digits, `_`, `-`), `url` and `headers`; tools are named `mcp__<serverName>__<tool>`; `!!js` with `process.env` is how its README passes a header: [packages/mcp/mcp-client/README.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/mcp/mcp-client/README.md).
- A row may carry `disabled: !!js <expression>` (the base bundle uses one for Windows): [packages/bundle/base/README.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/base/README.md).
- `--dump-config` prints `!!js` expressions as written; `.env` files in the invoking directory and the Harness home are loaded: [packages/boot/app-boot/README.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/README.md).

From the owner of this project (not checked from here): the two MCP addresses, that the key goes in `Authorization: Bearer <key>`, and that the key is made under Settings > Agents / Dev.

## Unverified

- **No real `dsh` was run.** The plugin was never loaded by `dsh`, `dsh plugin add` was not run, and no request was made to iHatePosting's server (no network and no key were used). The tests use a stand-in for the context.
- Which `dsh` releases it works with. `engines.dsh` is left out on purpose rather than guessed, so installation does not check a release. Node 20 or newer is this repository's own choice, not `dsh`'s.
- What `dsh` does when a plugin's `apply` throws: the message above is thrown, but whether `dsh` stops or only reports that row was not read in the documentation.
- Whether `!!js` expressions see a key that is only in a `.env` file. Put it in the environment to be sure.
- Whether the MCP client keeps header values out of its own logs and error text. The pages say it hides resolved values only in the mode with `expandTemplates: true`, which this plugin does not use.
- A row-level `inject` with `!!js ctx.<service>` in the patch is not used, because the public pages read do not document it.
- That the server accepts the key and what tools it lists.
- Whether `'runtime'` is what `dsh` wants as the `source` of a plugin's skill (it is in the documented list; no page says which value a plugin should use).
- Installing from `github:` for this subfolder, and installing from npm (not published).

## Tests

From the root of the repository (no network, no key, nothing to install):

```bash
node --test plugins/dsh-ihateposting/test
```

Newer Node releases (24 was the one used here) no longer expand a folder given to `node --test`; they run the path as a file. `test/package.json` points that path at `index.test.mjs`, so the command above works, and `node --test "plugins/dsh-ihateposting/test/*.test.mjs"` does the same thing. `npm test` inside this folder uses the second form.

## Licence

MIT. See `LICENSE`.
