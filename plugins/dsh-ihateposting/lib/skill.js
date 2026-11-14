// The skill this plugin hands to the agent.
//
// The text is iHatePosting's own SKILL.md, kept as a copy in ../skill/SKILL.md so
// that the published package is complete without the rest of the repository. That
// file was written for the command line `ihateposting-agent`, so a short note is
// put in front of it that says what to do with it when the tools come from the
// MCP server instead. The copy itself is never changed.

import { readFileSync } from 'node:fs'
import { KEY_VARIABLE } from './key.js'

export const SKILL_NAME = 'ihateposting'

export const SKILL_DESCRIPTION =
  "Schedule and draft social media posts through iHatePosting: find the workspace's connected channels, " +
  "read each channel's rules, handle media, create or change posts and read analytics. " +
  'Use it when the person wants something posted, planned or measured on social media.'

export const SKILL_FILE = new URL('../skill/SKILL.md', import.meta.url)

export const NOTE = [
  "> Read this first. The text below was written for iHatePosting's command line, `ihateposting-agent`.",
  "> Here you are connected to iHatePosting's hosted MCP server instead, so the tools that do the work are in",
  '> your tool list with names that start with `mcp__ihateposting__`. Use them for the jobs described below',
  "> (channels, a channel's rules, media, creating and changing posts, analytics). Treat each command below as",
  '> the description of a job, not as something to run, and where a tool\'s own description differs from this',
  `> text, follow the tool. The harness already sends your key from ${KEY_VARIABLE} with every request, so skip`,
  '> the sign-in section.',
].join('\n')

/** Drops the `---` metadata block at the top of a skill file, if there is one. */
export function stripFrontmatter(text) {
  const block = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/.exec(text)
  return (block ? text.slice(block[0].length) : text).replace(/^\s+/, '')
}

/** The skill as `ctx.skills.register` takes it, apart from `source`. */
export function loadSkill(file = SKILL_FILE) {
  const body = stripFrontmatter(readFileSync(file, 'utf8'))
  return {
    name: SKILL_NAME,
    description: SKILL_DESCRIPTION,
    content: `${NOTE}\n\n${body}`,
  }
}
