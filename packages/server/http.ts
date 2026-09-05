import type { Event, Logger } from "@hooksmith/core";
import {
  assertEventDocument,
  hydrateEvent,
  type Runtime,
} from "@hooksmith/runtime";
import { trace } from "@opentelemetry/api";
import { problemResponse } from "./problem.ts";

/** HTTP listener options for the Hooksmith server. */
export interface HttpServerOptions {
  readonly hostname?: string;
  readonly port?: number;
  readonly signal?: AbortSignal;
  readonly logger?: Logger;
}

/** Creates the HTTP request handler used by the Hooksmith server. */
export function createRequestHandler(
  runtime: Pick<Runtime, "process">,
  logger?: Logger,
): (request: Request) => Promise<Response> {
  return async (request) => {
    const path = new URL(request.url).pathname;

    if (path === "/health") {
      annotateHttpRoute(request.method, "/health");
      if (request.method !== "GET") return methodNotAllowed("GET");
      return jsonResponse({ status: "ok" });
    }

    if (path === "/events") {
      annotateHttpRoute(request.method, "/events");
      if (request.method !== "POST") return methodNotAllowed("POST");
      return await processEvent(runtime, request, logger);
    }

    return problemResponse(404, "Not Found");
  };
}

/** Starts the long-running HTTP listener for a Hooksmith runtime. */
export async function serveHttp(
  runtime: Pick<Runtime, "process">,
  options: HttpServerOptions = {},
): Promise<void> {
  const server = Deno.serve(
    {
      hostname: options.hostname ?? "127.0.0.1",
      port: options.port ?? 8080,
      signal: options.signal,
      onListen: ({ hostname, port }) => {
        options.logger?.info("Listening on {address}", {
          address: formatListenAddress(hostname, port),
        });
      },
    },
    createRequestHandler(runtime, options.logger),
  );

  await server.finished;
}

async function processEvent(
  runtime: Pick<Runtime, "process">,
  request: Request,
  logger?: Logger,
): Promise<Response> {
  let document: unknown;

  try {
    document = await request.json();
  } catch (error) {
    return problemResponse(400, "Bad Request", errorMessage(error));
  }

  let event: Event;
  try {
    assertEventDocument(document);
    event = hydrateEvent(document);
  } catch (error) {
    return problemResponse(400, "Bad Request", errorMessage(error));
  }

  try {
    const report = await runtime.process(event);
    return jsonResponse(report);
  } catch (error) {
    logger?.error("Failed to process event.", undefined, error);
    return problemResponse(500, "Internal Server Error");
  }
}

function annotateHttpRoute(method: string, route: string): void {
  const span = trace.getActiveSpan();
  span?.setAttribute("http.route", route);
  span?.updateName(`${method} ${route}`);
}

function formatListenAddress(hostname: string, port: number): string {
  const host = hostname.includes(":") ? `[${hostname}]` : hostname;
  return `http://${host}:${port}`;
}

function methodNotAllowed(allow: string): Response {
  return problemResponse(405, "Method Not Allowed", undefined, { allow });
}

function jsonResponse(value: unknown, status = 200): Response {
  return Response.json(value, { status });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
