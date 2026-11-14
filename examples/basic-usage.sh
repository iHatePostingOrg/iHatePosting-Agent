#!/usr/bin/env bash
# basic-usage.sh - a first tour of ihateposting-agent.
#
# It checks your sign-in, lists your channels, reads one channel's rules, optionally uploads one
# picture, and makes ONE DRAFT post. Nothing here publishes anything and nothing is deleted.
#
# Before you run it
#   1. Sign in once with `ihateposting-agent auth:login`, or export IHATEPOSTING_API_KEY in your
#      shell. This script never contains a key and never prints one.
#   2. Export CHANNEL_ID: the "id" of a channel shown by `ihateposting-agent integrations:list`.
#
# Optional settings (environment variables)
#   AGENT       How to start the program. Default: ihateposting-agent
#               From a clone of the repository: AGENT="node ./bin/ihateposting-agent.mjs"
#   POST_DATE   Date of the draft, ISO 8601 (default: a fixed example date; change it).
#   POST_TEXT   The text of the draft.
#   MEDIA_FILE  A local picture to upload first. The draft then carries it.
#
# Example
#   CHANNEL_ID=<your channel id> ./basic-usage.sh

set -euo pipefail

AGENT="${AGENT:-ihateposting-agent}"
: "${CHANNEL_ID:?Set CHANNEL_ID to the id of a channel (see: ${AGENT} integrations:list)}"
POST_DATE="${POST_DATE:-2026-12-15T10:00:00Z}"
POST_TEXT="${POST_TEXT:-Hello from the command line}"

# agent: run the program with the arguments given.
# $AGENT is left unquoted on purpose, so a value such as "node ./bin/ihateposting-agent.mjs" is
# split into the command and its argument. (This means the program's path must not hold spaces.)
agent() {
  $AGENT "$@"
}

echo "== 1. Who is signed in? =="
# Prints the method and the first eight characters of the key, then asks the server.
agent auth:status

echo
echo "== 2. Your channels =="
agent integrations:list

echo
echo "== 3. The rules and settings of channel ${CHANNEL_ID} =="
# Read output.rules, output.maxLength, output.settings and output.tools before you write.
agent integrations:settings "${CHANNEL_ID}"

# Extra arguments for the draft. Stays empty unless a picture is uploaded below.
media_args=()

if [[ -n "${MEDIA_FILE:-}" ]]; then
  echo
  echo "== 4. Upload ${MEDIA_FILE} =="
  # The upload prints a header line and then JSON. `sed 1d` drops the header line, and Node (which
  # you already have) reads the "path" out of the JSON. If there is no path the script stops.
  MEDIA_PATH="$(
    agent upload "${MEDIA_FILE}" | sed 1d | node -e '
      let text = "";
      process.stdin.on("data", (chunk) => (text += chunk)).on("end", () => {
        const answer = JSON.parse(text);
        if (!answer.path) {
          console.error("The upload answer has no path.");
          process.exit(1);
        }
        console.log(answer.path);
      });'
  )"
  echo "Uploaded; the address to use is: ${MEDIA_PATH}"
  media_args=(-m "${MEDIA_PATH}")
fi

echo
echo "== 5. Make a draft =="
# -t draft keeps the post without publishing it. -s (the date) is always required.
agent posts:create \
  -i "${CHANNEL_ID}" \
  -c "${POST_TEXT}" \
  -s "${POST_DATE}" \
  -t draft \
  ${media_args[@]+"${media_args[@]}"}

echo
echo "== 6. Posts from 30 days ago to 30 days ahead =="
agent posts:list

echo
echo "Done. To schedule the draft later, take its id from the list above and run:"
echo "  ${AGENT} posts:status <post-id> --status schedule"
