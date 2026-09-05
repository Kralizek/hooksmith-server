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

Deno.test("health endpoint rejects unsupported methods", async () => {
  const handler = createRequestHandler(createTestRuntime());
  const response = await handler(new Request("http://localhost/health", { method: "POST" }));
  assertEquals(response.status, 405);
  assertEquals(response.headers.get("allow"), "GET");
});

Deno.test("events endpoint rejects invalid event documents", async () => {
  const handler = createRequestHandler(createTestRuntime());
  const response = await handler(new Request("http://localhost/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "test" }),
  }));
  assertEquals(response.status, 400);
});

Deno.test("events endpoint processes valid events", async () => {
  const handler = createRequestHandler(createTestRuntime());
  const response = await handler(new Request("http://localhost/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      type: "test",
      timestamp: "2026-09-05T00:00:00Z",
      source: { kind: "test" },
      data: {},
    }),
  }));
  assertEquals(response.status, 200);
  const report = await response.json();
  assertEquals(report.success, true);
});

Deno.test("unsuccessful execution reports still return 200", async () => {
  const runtime = {
    process: () => Promise.resolve({ success: false }),
  } as unknown as Pick<Runtime, "process">;
  const handler = createRequestHandler(runtime);
  const response = await handler(new Request("http://localhost/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      type: "test",
      timestamp: "2026-09-05T00:00:00Z",
      source: { kind: "test" },
      data: {},
    }),
  }));
  assertEquals(response.status, 200);
});

Deno.test("events endpoint maps runtime errors to 500", async () => {
  const runtime = {
    process: () => Promise.reject(new Error("boom")),
  } as unknown as Pick<Runtime, "process">;
  const handler = createRequestHandler(runtime);
  const response = await handler(new Request("http://localhost/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      type: "test",
      timestamp: "2026-09-05T00:00:00Z",
      source: { kind: "test" },
      data: {},
    }),
  }));
  assertEquals(response.status, 500);
  assertEquals(await response.json(), { error: "boom" });
});

Deno.test("unknown routes return 404", async () => {
  const handler = createRequestHandler(createTestRuntime());
  const response = await handler(new Request("http://localhost/unknown"));
  assertEquals(response.status, 404);
});
