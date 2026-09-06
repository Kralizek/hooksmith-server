FROM denoland/deno:2.9.6-alpine@sha256:aa665f8777136863b5b8a0445a5cdfccff8103b5f40c9a877de5276b04facb1e AS cache

ARG HOOKSMITH_VERSION

ENV DENO_DIR=/deno-dir

RUN deno cache "jsr:@hooksmith/server@${HOOKSMITH_VERSION}"


FROM denoland/deno:2.9.6-alpine@sha256:aa665f8777136863b5b8a0445a5cdfccff8103b5f40c9a877de5276b04facb1e

ARG HOOKSMITH_VERSION

ENV DENO_DIR=/deno-dir \
    HOOKSMITH_VERSION=${HOOKSMITH_VERSION} \
    HOOKSMITH_CONFIG=/app/config/hooksmith.config.ts \
    HOOKSMITH_HOST=0.0.0.0 \
    HOOKSMITH_PORT=8080

WORKDIR /app

COPY --from=cache /deno-dir /deno-dir

VOLUME ["/app/config"]

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "exec deno run --allow-read --allow-env --allow-net jsr:@hooksmith/server@${HOOKSMITH_VERSION} --config \"${HOOKSMITH_CONFIG}\" \"$@\"", "--"]
