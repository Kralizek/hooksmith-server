#!/bin/sh
set -eu

DEFAULT_IMPORT_HOSTS="deno.land,jsr.io,esm.sh,raw.esm.sh,cdn.jsdelivr.net,raw.githubusercontent.com,gist.githubusercontent.com"

if [ -n "${HOOKSMITH_IMPORT_HOSTS:-}" ] && [ "${HOOKSMITH_ACCEPT_REMOTE_SOURCES:-false}" != "true" ]; then
  echo "HOOKSMITH_IMPORT_HOSTS requires HOOKSMITH_ACCEPT_REMOTE_SOURCES=true." >&2
  exit 1
fi

if [ "${HOOKSMITH_ACCEPT_REMOTE_SOURCES:-false}" = "true" ]; then
  if [ -n "${HOOKSMITH_IMPORT_HOSTS:-}" ]; then
    exec deno run \
      --allow-read \
      --allow-env \
      --allow-net \
      "--allow-import=${DEFAULT_IMPORT_HOSTS},${HOOKSMITH_IMPORT_HOSTS}" \
      "jsr:@hooksmith/server@${HOOKSMITH_VERSION}" \
      --config "${HOOKSMITH_CONFIG}" \
      "$@"
  fi

  exec deno run \
    --allow-read \
    --allow-env \
    --allow-net \
    --allow-import \
    "jsr:@hooksmith/server@${HOOKSMITH_VERSION}" \
    --config "${HOOKSMITH_CONFIG}" \
    "$@"
fi

exec deno run \
  --allow-read \
  --allow-env \
  --allow-net \
  "jsr:@hooksmith/server@${HOOKSMITH_VERSION}" \
  --config "${HOOKSMITH_CONFIG}" \
  "$@"
