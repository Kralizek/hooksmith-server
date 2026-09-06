FROM denoland/deno:2.9.6-alpine@sha256:aa665f8777136863b5b8a0445a5cdfccff8103b5f40c9a877de5276b04facb1e AS cache

ARG HOOKSMITH_VERSION

ENV DENO_DIR=/deno-dir

RUN if [ -z "${HOOKSMITH_VERSION}" ]; then \
      echo "HOOKSMITH_VERSION build arg is required." >&2; \
      exit 1; \
    fi; \
    deno cache "jsr:@hooksmith/server@${HOOKSMITH_VERSION}"


FROM denoland/deno:2.9.6-alpine@sha256:aa665f8777136863b5b8a0445a5cdfccff8103b5f40c9a877de5276b04facb1e

ARG HOOKSMITH_VERSION

ENV DENO_DIR=/deno-dir \
    HOOKSMITH_VERSION=${HOOKSMITH_VERSION} \
    HOOKSMITH_CONFIG=/app/config/hooksmith.config.ts \
    HOOKSMITH_ACCEPT_REMOTE_SOURCES=false \
    HOOKSMITH_HOST=0.0.0.0 \
    HOOKSMITH_PORT=8080

WORKDIR /app

COPY --from=cache /deno-dir /deno-dir
COPY entrypoint.sh /usr/local/bin/hooksmith-server-entrypoint
RUN chmod +x /usr/local/bin/hooksmith-server-entrypoint

VOLUME ["/app/config"]

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/hooksmith-server-entrypoint"]
