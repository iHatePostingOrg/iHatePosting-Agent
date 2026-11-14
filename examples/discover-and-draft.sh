#!/usr/bin/env bash
# discover-and-draft.sh - find out what a channel needs, optionally run one of its helpers, and
# optionally make a DRAFT from what you found.
#
# Nothing is published and nothing is deleted. The steps:
#   1. Read the channel's settings (integrations:settings) and print a short summary: the length
#      limit, the settings it requires, and the helpers it offers.
#   2. If HELPER is set, run that helper (integrations:trigger) and print what it found.
#   3. If DRAFT_TEXT is set, make a draft with it (and with SETTINGS_JSON / MEDIA_URL if given).
#
# Variables
#   CHANNEL_ID     (required) id of a channel from `integrations:list`.
#   AGENT          How to start the program (default: ihateposting-agent).
#   HELPER         A helper name from the channel's output.tools, e.g. boards or channels.
#   HELPER_DATA    The helper's input as a JSON string, e.g. '{"query":"example-company"}'.
#   DRAFT_TEXT     The text of the draft. Without it no draft is made.
#   SETTINGS_JSON  The platform settings as a JSON string, built from the schema printed in step 1.
#   MEDIA_URL      The address (the "path") of a file already uploaded with `upload`.
#   POST_DATE      ISO 8601 date for the draft (default: a fixed example date; change it).
#
# Example: find the boards of a Pinterest channel, then draft a pin on one of them
#   CHANNEL_ID=<id> HELPER=boards ./discover-and-draft.sh
#   CHANNEL_ID=<id> DRAFT_TEXT="Ten tips" MEDIA_URL=<path> SETTINGS_JSON='{"board":"<board id>"}' ./discover-and-draft.sh

set -euo pipefail

AGENT="${AGENT:-ihateposting-agent}"
: "${CHANNEL_ID:?Set CHANNEL_ID to the id of a channel (see: ${AGENT} integrations:list)}"
POST_DATE="${POST_DATE:-2026-12-15T10:00:00Z}"

# agent: run the program with the arguments given ($AGENT is unquoted on purpose; see basic-usage.sh).
agent() {
  $AGENT "$@"
}

echo "== 1. What does channel ${CHANNEL_ID} need? =="
# The answer is a header line, then JSON. `sed 1d` removes the header line.
settings_answer="$(agent integrations:settings "${CHANNEL_ID}" | sed 1d)"

# Print the parts an author needs. output.settings may be a schema, a sentence or an empty object,
# and output.rules and output.tools may be missing, so each one is checked before it is used.
printf '%s\n' "${settings_answer}" | node -e '
  let text = "";
  process.stdin.on("data", (chunk) => (text += chunk)).on("end", () => {
    const output = JSON.parse(text).output || {};
    const schema = output.settings && typeof output.settings === "object" ? output.settings : null;
    console.log("Longest text for this channel:", output.maxLength);
    console.log("Rules:", output.rules || "(none given)");
    if (schema && schema.properties) {
      console.log("Settings it takes:", Object.keys(schema.properties).join(", "));
      console.log("Settings it requires:", (schema.required || []).join(", ") || "(none)");
    } else {
      console.log("Settings:", typeof output.settings === "string" ? output.settings : "(none)");
    }
    const tools = output.tools || [];
    if (tools.length === 0) {
      console.log("Helpers: (none)");
    }
    for (const tool of tools) {
      const inputs = (tool.dataSchema || []).map((field) => field.key).join(", ") || "no input";
      console.log("Helper:", tool.methodName, "(" + inputs + ")");
    }
  });'

if [[ -n "${HELPER:-}" ]]; then
  echo
  echo "== 2. Run the helper ${HELPER} =="
  helper_args=()
  if [[ -n "${HELPER_DATA:-}" ]]; then
    helper_args=(-d "${HELPER_DATA}")
  fi
  agent integrations:trigger "${CHANNEL_ID}" "${HELPER}" ${helper_args[@]+"${helper_args[@]}"}
fi

if [[ -n "${DRAFT_TEXT:-}" ]]; then
  echo
  echo "== 3. Make a draft =="
  extra_args=()
  if [[ -n "${MEDIA_URL:-}" ]]; then
    extra_args+=(-m "${MEDIA_URL}")
  fi
  if [[ -n "${SETTINGS_JSON:-}" ]]; then
    extra_args+=(--settings "${SETTINGS_JSON}")
  fi
  agent posts:create \
    -i "${CHANNEL_ID}" \
    -c "${DRAFT_TEXT}" \
    -s "${POST_DATE}" \
    -t draft \
    ${extra_args[@]+"${extra_args[@]}"}
fi
