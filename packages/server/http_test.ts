import type { EventDocument } from "@hooksmith/core";
import {
  createRuntime,
  nullLoggerFactory,
  type Runtime,
} from "@hooksmith/runtime";
import { assertEquals } from "@std/assert";
import { createRequestHandler } from "./http.ts";

function createTestRuntime(): Runtime {
  return createRuntime({ routes: [] }, { logger: nullLoggerFactory });
}

Deno.test("health endpoint returns ok", async () => {
  const handler = createRequestHandler(createTestRuntime());
  const response = await handler(new Request("http://localhost/health"));
  assertEquals(response.status, 200);
  assertEquals(await response.json(), { status: "ok" });
});

Deno.test("health endpoint rejects unsupported methods with a problem", async () => {
  const handler = createRequestHandler(createTestRuntime());
  const response = await handler(
    new Request("http://localhost/health", { method: "POST" }),
  );

  assertEquals(response.status, 405);
  assertEquals(response.headers.get("allow"), "GET");
  assertEquals(
    response.headers.get("content-type"),
    "application/problem+json",
  );
  assertEquals(await response.json(), {
    type: "about:blank",
    title: "Method Not Allowed",
    status: 405,
  });
});

Deno.test("events endpoint rejects invalid event documents with a problem", async () => {
  const handler = createRequestHandler(createTestRuntime());
  const response = await handler(
    new Request("http://localhost/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "test" }),
    }),
  );

  assertEquals(response.status, 400);
  assertEquals(
    response.headers.get("content-type"),
    "application/problem+json",
  );
  const problem = await response.json();
  assertEquals(problem.type, "about:blank");
  assertEquals(problem.title, "Bad Request");
  assertEquals(problem.status, 400);
  assertEquals(typeof problem.detail, "string");
});

Deno.test("events endpoint processes valid events", async () => {
  const handler = createRequestHandler(createTestRuntime());
  const response = await handler(
    new Request("http://localhost/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "test",
        timestamp: "2026-09-05T00:00:00Z",
        source: { kind: "test" },
        data: {},
      }),
    }),
  );
  assertEquals(response.status, 200);
  const report = await response.json();
  assertEquals(report.success, true);
});

Deno.test("events endpoint maps ingress before event validation", async () => {
  const handler = createRequestHandler(
    createTestRuntime(),
    undefined,
    ({ body, request }) => ({
      type: "webhook.test",
      timestamp: "2026-09-05T00:00:00Z",
      source: {
        kind: "webhook",
        id: request.headers.get("x-delivery-id") ?? undefined,
      },
      data: body,
    }),
  );

  const response = await handler(
    new Request("http://localhost/events", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-delivery-id": "delivery-123",
      },
      body: JSON.stringify({ message: "hello" }),
    }),
  );

  assertEquals(response.status, 200);
  const report = await response.json();
  assertEquals(report.success, true);
});

Deno.test("events endpoint rejects invalid mapped event documents", async () => {
  const invalidDocument = { type: "test" } as EventDocument;
  const handler = createRequestHandler(
    createTestRuntime(),
    undefined,
    () => invalidDocument,
  );

  const response = await handler(
    new Request("http://localhost/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "hello" }),
    }),
  );

  assertEquals(response.status, 400);
});

Deno.test("unsuccessful execution reports still return 200", async () => {
  const runtime = {
    process: () => Promise.resolve({ success: false }),
  } as unknown as Pick<Runtime, "process">;
  const handler = createRequestHandler(runtime);
  const response = await handler(
    new Request("http://localhost/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "test",
        timestamp: "2026-09-05T00:00:00Z",
        source: { kind: "test" },
        data: {},
      }),
    }),
  );
  assertEquals(response.status, 200);
});

Deno.test("events endpoint maps runtime errors to generic problems", async () => {
  const runtime = {
    process: () => Promise.reject(new Error("boom")),
  } as unknown as Pick<Runtime, "process">;
  const handler = createRequestHandler(runtime);
  const response = await handler(
    new Request("http://localhost/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "test",
        timestamp: "2026-09-05T00:00:00Z",
        source: { kind: "test" },
        data: {},
      }),
    }),
  );

  assertEquals(response.status, 500);
  assertEquals(
    response.headers.get("content-type"),
    "application/problem+json",
  );
  assertEquals(await response.json(), {
    type: "about:blank",
    title: "Internal Server Error",
    status: 500,
  });
});

Deno.test("unknown routes return a not-found problem", async () => {
  const handler = createRequestHandler(createTestRuntime());
  const response = await handler(new Request("http://localhost/unknown"));

  assertEquals(response.status, 404);
  assertEquals(
    response.headers.get("content-type"),
    "application/problem+json",
  );
  assertEquals(await response.json(), {
    type: "about:blank",
    title: "Not Found",
    status: 404,
  });
});
