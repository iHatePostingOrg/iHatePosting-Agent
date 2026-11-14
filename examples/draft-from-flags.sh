#!/usr/bin/env bash
# draft-from-flags.sh - drafts made with command line flags: a thread, comments that each have
# their own picture, alt text, and platform settings.
#
# Every post here is a DRAFT (-t draft): nothing is published and nothing is deleted. Each example
# runs only when the variables it needs are set, so you can try one at a time.
#
# Variables (all optional; set the ones for the examples you want)
#   AGENT                 How to start the program (default: ihateposting-agent).
#   POST_DATE             ISO 8601 date for the drafts (default: a fixed example date).
#   X_CHANNEL_ID          id of an X channel                  -> thread, comments with media, alt text
#   MEDIA_URL_1, _2       addresses returned by `upload`      -> used by the media examples
#   PINTEREST_CHANNEL_ID  id of a Pinterest channel           -> pin with a board
#   PINTEREST_BOARD_ID    numeric id of a board (see integrations:trigger <id> boards)
#   YOUTUBE_CHANNEL_ID    id of a YouTube channel             -> video with a title
#   VIDEO_URL             address of an uploaded video
#
# Remember: -m takes addresses of files that are ALREADY uploaded. posts:create uploads nothing.
# Run `integrations:settings <channel id>` first to read the channel's rules and length limit.

set -euo pipefail

AGENT="${AGENT:-ihateposting-agent}"
POST_DATE="${POST_DATE:-2026-12-15T10:00:00Z}"

# agent: run the program with the arguments given ($AGENT is unquoted on purpose; see basic-usage.sh).
agent() {
  $AGENT "$@"
}

ran_any=no

if [[ -n "${X_CHANNEL_ID:-}" ]]; then
  ran_any=yes

  echo "== A thread of three parts, five minutes apart =="
  # Every -c is one part. The first is the post, the others follow it. -d applies to all parts.
  agent posts:create -i "${X_CHANNEL_ID}" -s "${POST_DATE}" -t draft -d 5 \
    -c "1/3 We moved to weekly releases." \
    -c "2/3 Smaller releases mean smaller surprises." \
    -c "3/3 Next: how we test each one."

  if [[ -n "${MEDIA_URL_1:-}" && -n "${MEDIA_URL_2:-}" ]]; then
    echo
    echo "== A post and a comment, each with its own picture =="
    # The first -m belongs to the first -c, the second -m to the second -c.
    agent posts:create -i "${X_CHANNEL_ID}" -s "${POST_DATE}" -t draft \
      -c "Launch day." -m "${MEDIA_URL_1}" \
      -c "And one more from the party." -m "${MEDIA_URL_2}"

    echo
    echo "== One picture with alt text =="
    # --alt lines up with -m by position. Alt texts are split at commas, so for alt text that
    # contains a comma use a JSON body file (see post-with-comments-and-media.json).
    agent posts:create -i "${X_CHANNEL_ID}" -s "${POST_DATE}" -t draft \
      -c "The team, mid-launch." -m "${MEDIA_URL_1}" --alt "People around a table with laptops"
  fi

  echo
  echo "== Settings for X: who may reply =="
  agent posts:create -i "${X_CHANNEL_ID}" -s "${POST_DATE}" -t draft \
    -c "Replies from people I follow only." \
    --settings '{"who_can_reply_post":"following"}'
fi

if [[ -n "${PINTEREST_CHANNEL_ID:-}" && -n "${PINTEREST_BOARD_ID:-}" && -n "${MEDIA_URL_1:-}" ]]; then
  ran_any=yes
  echo
  echo "== A pin: the board is required, and it is the numeric id =="
  # Build the settings JSON from the variable. The board id is digits only, so no escaping is needed.
  agent posts:create -i "${PINTEREST_CHANNEL_ID}" -s "${POST_DATE}" -t draft \
    -c "Ten quick tips for tidy shelves." -m "${MEDIA_URL_1}" \
    --settings "{\"board\":\"${PINTEREST_BOARD_ID}\",\"title\":\"Ten tips\"}"
fi

if [[ -n "${YOUTUBE_CHANNEL_ID:-}" && -n "${VIDEO_URL:-}" ]]; then
  ran_any=yes
  echo
  echo "== A video: title and visibility are required (private keeps it to you) =="
  agent posts:create -i "${YOUTUBE_CHANNEL_ID}" -s "${POST_DATE}" -t draft \
    -c "A walk through the new checkout flow." -m "${VIDEO_URL}" \
    --settings '{"title":"Our new checkout flow","type":"private"}'
fi

if [[ "${ran_any}" == "no" ]]; then
  echo "Nothing to do: set at least X_CHANNEL_ID, or PINTEREST_CHANNEL_ID with PINTEREST_BOARD_ID and MEDIA_URL_1," >&2
  echo "or YOUTUBE_CHANNEL_ID with VIDEO_URL. The comments at the top of this file list every variable." >&2
  exit 1
fi

echo
echo "Done. List the drafts with:  ${AGENT} posts:list"
