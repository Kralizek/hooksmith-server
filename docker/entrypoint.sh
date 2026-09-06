#!/bin/sh
set -eu

if [ -n "${HOOKSMITH_IMPORT_HOSTS:-}" ] && [ "${HOOKSMITH_ACCEPT_REMOTE_SOURCES:-false}" != "true" ]; then
  echo "HOOKSMITH_IMPORT_HOSTS requires HOOKSMITH_ACCEPT_REMOTE_SOURCES=true." >&2
  exit 1
fi

if [ -n "${HOOKSMITH_HOST_CONFIG:-}" ]; then
  set -- --config "${HOOKSMITH_CONFIG}" --host-config "${HOOKSMITH_HOST_CONFIG}" "$@"
else
  set -- --config "${HOOKSMITH_CONFIG}" "$@"
fi

if [ "${HOOKSMITH_ACCEPT_REMOTE_SOURCES:-false}" = "true" ]; then
  if [ -n "${HOOKSMITH_IMPORT_HOSTS:-}" ]; then
    exec deno run \
      --allow-read \
      --allow-env \
      --allow-net \
      "--allow-import=${HOOKSMITH_IMPORT_HOSTS}" \
      "jsr:@hooksmith/server@${HOOKSMITH_VERSION}" \
      "$@"
  fi

  exec deno run \
    --allow-read \
    --allow-env \
    --allow-net \
    --allow-import \
    "jsr:@hooksmith/server@${HOOKSMITH_VERSION}" \
    "$@"
fi

exec deno run \
  --allow-read \
  --allow-env \
  --allow-net \
  "jsr:@hooksmith/server@${HOOKSMITH_VERSION}" \
  "$@"
