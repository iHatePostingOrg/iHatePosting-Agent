#!/usr/bin/env bash
# post-from-body-file.sh - send one of the JSON body files in this folder (or your own) with
# `posts:create --json`.
#
# Safety checks before anything is sent:
#   - the file must exist and be valid JSON;
#   - it must not still hold the placeholder ids of the samples (x-123, media-123, ...);
#   - a body whose "type" is "schedule" is sent only when you set CONFIRM_SCHEDULE=yes. The
#     samples are all drafts ("type": "draft"), which publish nothing.
# Nothing is deleted. The file is sent exactly as it is; the program adds nothing to it.
#
# Usage
#   ./post-from-body-file.sh my-post.json
#
# Variables
#   AGENT             How to start the program (default: ihateposting-agent).
#   CONFIRM_SCHEDULE  Set to "yes" to allow a body whose type is "schedule".
#
# Before you use a sample: replace every placeholder (channel ids, media ids and addresses, the
# board id, the date) with real values. Channel ids come from `integrations:list`; media addresses
# come from `upload`.

set -euo pipefail

AGENT="${AGENT:-ihateposting-agent}"
BODY_FILE="${1:?Usage: $0 <body.json>}"

if [[ ! -f "${BODY_FILE}" ]]; then
  echo "No such file: ${BODY_FILE}" >&2
  exit 1
fi

# Valid JSON? Read its "type" at the same time. Node prints the type, or stops the script.
body_type="$(
  node -e '
    const fs = require("node:fs");
    let body;
    try {
      body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    } catch (error) {
      console.error("Not valid JSON: " + error.message);
      process.exit(1);
    }
    console.log(body.type || "");' "${BODY_FILE}"
)"

# A placeholder id looks like: "id": "x-123" (a word, a dash, 123), as in the samples' channel ids
# and in their media ids (media-123).
if grep -Eq '"id"[[:space:]]*:[[:space:]]*"[a-z-]+-12[0-9]"' "${BODY_FILE}"; then
  echo "${BODY_FILE} still holds placeholder ids such as x-123 or media-123." >&2
  echo "Replace channel ids with ids from: ${AGENT} integrations:list" >&2
  echo "Replace media ids and addresses with what ${AGENT} upload printed." >&2
  exit 1
fi

if [[ "${body_type}" == "schedule" && "${CONFIRM_SCHEDULE:-}" != "yes" ]]; then
  echo "${BODY_FILE} has type \"schedule\", which queues the post for publishing." >&2
  echo "Set CONFIRM_SCHEDULE=yes to send it, or change the type to \"draft\"." >&2
  exit 1
fi

echo "Sending ${BODY_FILE} (type: ${body_type:-not set})"
# $AGENT is unquoted on purpose, so "node ./bin/ihateposting-agent.mjs" is split into words.
$AGENT posts:create --json "${BODY_FILE}"
