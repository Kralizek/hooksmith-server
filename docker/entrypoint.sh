#!/bin/sh
set -eu

DEFAULT_IMPORT_HOSTS="deno.land,jsr.io,esm.sh,raw.esm.sh,cdn.jsdelivr.net,raw.githubusercontent.com,gist.githubusercontent.com"

if [ -n "${HOOKSMITH_IMPORT_HOSTS:-}" ] && [ "${HOOKSMITH_ACCEPT_REMOTE_SOURCES:-false}" != "true" ]; then
  echo "HOOKSMITH_IMPORT_HOSTS requires HOOKSMITH_ACCEPT_REMOTE_SOURCES=true." >&2
  exit 1
fi

set -- deno run --allow-read --allow-env --allow-net "$@"

if [ "${HOOKSMITH_ACCEPT_REMOTE_SOURCES:-false}" = "true" ]; then
  if [ -n "${HOOKSMITH_IMPORT_HOSTS:-}" ]; then
    set -- "$@" "--allow-import=${DEFAULT_IMPORT_HOSTS},${HOOKSMITH_IMPORT_HOSTS}"
  else
    set -- "$@" --allow-import
  fi
fi

exec "$@" "jsr:@hooksmith/server@${HOOKSMITH_VERSION}" --config "${HOOKSMITH_CONFIG}"
