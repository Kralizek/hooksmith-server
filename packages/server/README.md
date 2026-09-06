# @hooksmith/server

Long-running HTTP server host for Hooksmith.

## Run

The server loads Hooksmith configuration once at startup and processes events
synchronously.

```sh
deno task server -- --config hooksmith.config.ts --host 127.0.0.1 --port 8080
```

Options:

- `-c, --config` — config module location, defaults to `hooksmith.config.ts`
- `--host-config` — optional host config module location
- `--host` — bind hostname, defaults to `127.0.0.1`
- `--port` — listener port, defaults to `8080`

The same defaults can be supplied through `HOOKSMITH_CONFIG`,
`HOOKSMITH_HOST_CONFIG`, `HOOKSMITH_HOST`, and `HOOKSMITH_PORT`; explicit
command-line options take precedence.

Configuration locations can be local paths, `file:` URLs, or HTTPS URLs. Remote
configuration is loaded as executable TypeScript through Deno's module system.
The server supports HTTPS locations, but it does not grant remote-import
permission by default when run directly. The process that launches the server
must explicitly allow the required host:

```sh
deno run \
  --allow-read \
  --allow-env \
  --allow-net \
  --allow-import=raw.githubusercontent.com \
  jsr:@hooksmith/server \
  --config https://raw.githubusercontent.com/example/project/main/hooksmith.config.ts
```

This keeps capability and permission separate: Hooksmith Server understands
remote config locations, while Deno decides which remote hosts may execute code.
Using `--allow-import` without a host enables Deno's default trusted import
hosts; `--allow-import=<host>` allows an explicit host. HTTP URLs are not
supported.

When using the published container, the entrypoint maps deployment settings to
the same Deno permission model. Remote imports are disabled by default. Set
`HOOKSMITH_ACCEPT_REMOTE_SOURCES=true` to enable Deno's default trusted import
hosts. `HOOKSMITH_IMPORT_HOSTS` can add a comma-separated list of additional
hosts for deployments such as custom S3 endpoints, and is rejected unless
remote sources are explicitly enabled.

## Endpoints

- `GET /health` — process health
- `POST /events` — process one Hooksmith event and return its execution report

By default, the JSON request body sent to `POST /events` must already be a valid
Hooksmith event document.

An optional host config can provide an ingress mapper that adapts an arbitrary
JSON webhook payload before Hooksmith event validation and runtime processing:

```ts
import type { HostConfig } from "@hooksmith/server";

export default {
  ingress: {
    map: ({ body, request }) => ({
      type: "github.push",
      timestamp: new Date().toISOString(),
      source: {
        kind: "github",
        id: request.headers.get("x-github-delivery") ?? undefined,
      },
      data: body,
    }),
  },
} satisfies HostConfig;
```

The mapper receives the parsed JSON body plus the original `Request`, so webhook
packages can remain structurally compatible with the server without depending on
a shared ingress-contract package. If the host config is present but
`ingress.map` is absent, the default event-document behavior is unchanged.

A completed Hooksmith execution returns HTTP 200 even when the report has
`success: false`. HTTP 5xx responses are reserved for request-processing
exceptions.

## OpenTelemetry

The server bridges Hooksmith telemetry to Deno's built-in OpenTelemetry
integration. Enable it with the standard Deno and OpenTelemetry environment
variables:

```sh
OTEL_DENO=true \
OTEL_SERVICE_NAME=hooksmith-server \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 \
deno task server
```

Deno provides the incoming HTTP server span and distributed trace propagation;
Hooksmith runtime spans execute beneath that active request context. Standard
`OTEL_*` variables configure exporters, resource attributes, sampling, and
propagators.
