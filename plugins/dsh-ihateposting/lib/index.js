// The plugin DeepSeek Harness loads for the "ihateposting" row of cordis.patch.yml.
//
// It does two things when it loads: it refuses to go on when no key is set, and it
// registers the iHatePosting skill. The connection to the MCP server is not made
// here; it is the second row of cordis.patch.yml, an MCP client of DeepSeek
// Harness itself, which is the only place the key is sent from.
//
// Only `name`, `inject` and `apply` are exported on purpose: that is the whole
// shape the plugin needs, and the helpers live in key.js and skill.js.

import { requireKey } from './key.js'
import { loadSkill } from './skill.js'

export const name = 'ihateposting'

export const inject = ['skills']

export function apply(ctx) {
  requireKey(process.env)
  ctx.skills.register({ ...loadSkill(), source: 'runtime' })
}
