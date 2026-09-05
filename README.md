# Hooksmith Server

[![CI](https://github.com/Kralizek/hooksmith-server/actions/workflows/ci.yml/badge.svg)](https://github.com/Kralizek/hooksmith-server/actions/workflows/ci.yml)

Long-running HTTP server distribution for [Hooksmith](https://github.com/Kralizek/hooksmith).

This repository owns the HTTP server host around Hooksmith: the `@hooksmith/server` package and its executable entrypoint. The Hooksmith runtime, core contracts, pipeline helpers, and built-in extensions remain in the main Hooksmith repository and are consumed here as published JSR dependencies.

## Repository layout

```text
packages/
  server/         @hooksmith/server package
scripts/
  check_export_docs.ts
.github/
  workflows/
    ci.yml        Package and server validation
    release.yml   Server package releases
deno.json         Workspace and dependency configuration
```

The repository remains workspace-based intentionally so additional executable or distribution packages can be added under `packages/` without restructuring the project.

## Server

The server loads a Hooksmith configuration once at startup, accepts events over HTTP, processes each request synchronously through one runtime instance, and remains alive for subsequent requests.

```sh
deno task server -- --config hooksmith.config.ts --host 127.0.0.1 --port 8080
```

Important options:

```text
-c, --config <path>   Config file (default: hooksmith.config.ts)
    --host <hostname> HTTP bind hostname (default: 127.0.0.1)
    --port <port>     HTTP bind port (default: 8080)
```

The same defaults can be provided through `HOOKSMITH_CONFIG`, `HOOKSMITH_HOST`, and `HOOKSMITH_PORT`; explicit command-line options take precedence.

The host exposes:

- `GET /health` for process health;
- `POST /events` for processing one Hooksmith event and returning its execution report.

Completed Hooksmith executions return HTTP 200 even when the report has `success: false`. Faulty HTTP requests and server failures use RFC 9457 Problem Details with `application/problem+json`.

See [`packages/server`](packages/server) for the full HTTP contract and runtime semantics.

## OpenTelemetry

The server is an OpenTelemetry-aware Hooksmith host. It bridges Hooksmith telemetry to Deno's built-in OpenTelemetry integration while allowing Deno to own the incoming HTTP server span and distributed trace propagation.

```text
Deno HTTP server span
└─ hooksmith.event.process
   └─ hooksmith.listener
```

The server uses the standard OpenTelemetry API. It does not configure an OpenTelemetry SDK, provider, exporter, or collector. With Deno's built-in OpenTelemetry support, enable export through environment variables:

```sh
OTEL_DENO=true \
OTEL_SERVICE_NAME=hooksmith-server \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 \
deno task server
```

Use the normal `OTEL_*` environment variables for OTLP endpoints, headers, sampling, resource attributes, propagators, and exporter configuration. Hooksmith runtime, pipeline, extension, and Deno-native spans attach beneath the active HTTP request context.

## Dependencies

The server consumes published Hooksmith packages rather than source files from the runtime repository. This keeps the repository boundary explicit and lets the server evolve and release independently.

Deno's default minimum dependency age remains enabled for third-party dependencies during development in this repository. Fresh `@hooksmith/core`, `@hooksmith/opentelemetry`, and `@hooksmith/runtime` releases are explicitly exempted so this repository can validate a newly published Hooksmith runtime immediately.

The main Hooksmith repository includes `hooksmith-server` in its downstream dependency-update workflow, so new Hooksmith releases can automatically open or update dependency bump pull requests here.

## Development

Hooksmith Server tracks the latest stable Deno 2.x release in CI.

```sh
deno task check
deno task server -- --help
```

The CI pipeline validates formatting, linting, documentation, tests, type checking, and JSR publishability for the server package.

## Packages

- [`@hooksmith/server`](packages/server) — long-running HTTP host, configuration loading, lifecycle management, Problem Details responses, and OpenTelemetry integration.

## License

MIT
