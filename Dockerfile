FROM denoland/deno:alpine AS cache

ARG HOOKSMITH_VERSION

ENV DENO_DIR=/deno-dir

RUN deno cache "jsr:@hooksmith/server@${HOOKSMITH_VERSION}"


FROM denoland/deno:alpine

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
