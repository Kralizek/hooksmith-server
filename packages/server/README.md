# @hooksmith/server

Long-running HTTP server host for Hooksmith.

## Run

The server loads Hooksmith configuration once at startup and processes events synchronously.

```sh
deno task server -- --config hooksmith.config.ts --host 127.0.0.1 --port 8080
```

Options:

- `-c, --config` — config module path, defaults to `hooksmith.config.ts`
- `--host` — bind hostname, defaults to `127.0.0.1`
- `--port` — listener port, defaults to `8080`

The same defaults can be supplied through `HOOKSMITH_CONFIG`, `HOOKSMITH_HOST`, and `HOOKSMITH_PORT`; explicit command-line options take precedence.

## Endpoints

- `GET /health` — process health
- `POST /events` — process one Hooksmith event and return its execution report

A completed Hooksmith execution returns HTTP 200 even when the report has `success: false`. HTTP 5xx responses are reserved for request-processing exceptions.
