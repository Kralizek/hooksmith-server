# @hooksmith/server

Long-running HTTP server host for Hooksmith.

## Run

The server loads Hooksmith configuration once at startup and processes events
synchronously.

```sh
deno task server
```

Environment variables:

- `HOOKSMITH_CONFIG` — config module path, defaults to `hooksmith.config.ts`
- `HOOKSMITH_HOST` — bind address, defaults to `127.0.0.1`
- `HOOKSMITH_PORT` — listener port, defaults to `8080`

## Endpoints

- `GET /health` — process health
- `POST /events` — process one Hooksmith event and return its execution report
