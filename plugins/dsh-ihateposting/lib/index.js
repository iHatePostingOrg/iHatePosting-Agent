// The plugin DeepSeek Harness loads for the "ihateposting" row of cordis.patch.yml.
//
// What it does when it loads:
//   - reads the settings (the environment variable that holds the key, an optional inline key, the API address,
//     and whether to register the skill) and checks them against the schema below;
//   - provides one service, `ihateposting`, with the address of the MCP server and the Authorization header, so that
//     the second row of the patch (an MCP client of DeepSeek Harness itself) reads both from `ctx.ihateposting`
//     instead of building the header in a YAML file;
//   - registers the iHatePosting skill when a skills service is mounted.
// It makes no network call of its own. The key leaves this process in one place only: the header the MCP client sends.
//
// Without a key it still loads: it writes one warning that names the variable and where a key comes from, and the
// MCP row then connects without credentials, which iHatePosting refuses, so no tools appear.
//
// Only named exports, which is the documented function-module form (`name`, `apply`, `Config`).

import z from '@deepseek-ai/schemastery'
import { SKILL_CONTENT, SKILL_DESCRIPTION, SKILL_NAME } from './skill.js'

/** The plugin's own name, the same as the package and the patch row's `name`. */
export const name = 'dsh-ihateposting'

/** The service this plugin provides, read by the MCP row as `ctx.ihateposting`. */
export const SERVICE_NAME = 'ihateposting'

/** The variable that holds the key unless the settings name another. */
export const DEFAULT_KEY_VARIABLE = 'IHATEPOSTING_API_KEY'

/** The API of the hosted app; the MCP endpoint is this address followed by /mcp. */
export const DEFAULT_BASE_URL = 'https://app.ihateposting.com/api'

export const Config = z.object({
  /** Environment variable that holds the key (made under Settings > Agents / Dev in iHatePosting). */
  apiKeyEnv: z.string().default(DEFAULT_KEY_VARIABLE),
  /** Inline key, for a patch-level override. Prefer the environment variable. */
  apiKey: z.string().role('secret').default(''),
  /** The API address. The MCP endpoint is `<baseUrl>/mcp`; another host (self-hosted) goes here. */
  baseUrl: z.string().default(DEFAULT_BASE_URL),
  /** Register the iHatePosting skill on `ctx.skills`. */
  skill: z.boolean().default(true),
})

/** A key is one run of visible characters: a space, a tab or a line break inside it can never be part of a real one. */
const SHAPE_OF_A_KEY = /^[^\s\u0000-\u001f\u007f]+$/

/** An address for a log line: no user name, password, query or fragment, whatever the settings held. */
export function displayUrl(address) {
  try {
    const url = new URL(address)
    return `${url.protocol}//${url.host}${url.pathname}`
  } catch {
    return '(an address that is not valid)'
  }
}

/**
 * Works out the connection from the settings and the environment.
 *
 * @param {object} config - the validated settings.
 * @param {Record<string, string | undefined>} env - where the key is read from.
 * @returns {{ url: string, headers: Record<string, string>, configured: boolean, source: string, problem: string }}
 *   `source` names where the key came from (never its value); `problem` is '' or a short reason the key was not used.
 */
export function resolveConnection(config, env = process.env) {
  const base = String(config?.baseUrl || DEFAULT_BASE_URL).trim().replace(/\/+$/, '')
  const url = base.endsWith('/mcp') ? base : `${base}/mcp`
  const variable = String(config?.apiKeyEnv || DEFAULT_KEY_VARIABLE).trim() || DEFAULT_KEY_VARIABLE
  const inline = String(config?.apiKey || '').trim()
  const fromEnv = String(env[variable] || '').trim()
  const key = inline || fromEnv
  const source = inline ? 'config.apiKey' : fromEnv ? `env.${variable}` : 'none'
  if (key && !SHAPE_OF_A_KEY.test(key)) {
    return { url, headers: {}, configured: false, source, problem: 'malformed' }
  }
  return { url, headers: key ? { Authorization: `Bearer ${key}` } : {}, configured: key.length > 0, source, problem: '' }
}

/**
 * @param {object} ctx - the plugin context.
 * @param {object} config - the settings of the row.
 */
export function apply(ctx, config) {
  const settings = Config(config ?? {})
  const connection = resolveConnection(settings)
  const log = ctx.logger ?? console
  const where = displayUrl(connection.url)

  if (connection.configured) {
    log.info?.(`dsh-ihateposting: iHatePosting MCP endpoint ${where} (key from ${connection.source})`)
  } else if (connection.problem === 'malformed') {
    log.warn?.(
      `dsh-ihateposting: the key from ${connection.source} is not used because it holds a space or a control character, ` +
        `which a real key never does. Check ${connection.source === 'config.apiKey' ? '`apiKey` on the `ihateposting` row' : settings.apiKeyEnv}. ` +
        `The ihateposting-mcp row will connect to ${where} without credentials and register no tools.`,
    )
  } else {
    log.warn?.(
      `dsh-ihateposting: no iHatePosting API key found. Set ${settings.apiKeyEnv} (make a key under Settings > Agents / Dev in iHatePosting) ` +
        `or \`apiKey\` on the \`ihateposting\` row. The ihateposting-mcp row will connect to ${where} without credentials; ` +
        'iHatePosting refuses that with 401, so no tools are registered.',
    )
  }
  if (connection.url.startsWith('http://') && !/^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(connection.url)) {
    log.warn?.(`dsh-ihateposting: ${where} is not https, so the key would travel unencrypted.`)
  }

  // Plain values, and a fresh copy of the headers on every read, so nothing that reads the service can change what the next reader gets.
  ctx.provide(SERVICE_NAME, {
    url: connection.url,
    get headers() {
      return { ...connection.headers }
    },
    configured: connection.configured,
  })

  if (settings.skill) {
    ctx.inject(['skills'], (skillsContext) => {
      if (typeof skillsContext.skills?.register !== 'function') return
      skillsContext.skills.register({
        name: SKILL_NAME,
        description: SKILL_DESCRIPTION,
        content: SKILL_CONTENT,
        source: 'runtime',
        invocation: { modelInvocable: true, userInvocable: true },
      })
    })
  }
}
