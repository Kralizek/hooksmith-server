import type { Span } from "@opentelemetry/api";
import { assertEquals } from "@std/assert";
import { annotateHttpRoute } from "./telemetry.ts";

Deno.test("annotateHttpRoute sets route and span name", () => {
  const attributes: Record<string, unknown> = {};
  let name: string | undefined;

  const span = {
    setAttribute(key: string, value: unknown) {
      attributes[key] = value;
      return this;
    },
    updateName(value: string) {
      name = value;
      return this;
    },
  } as Pick<Span, "setAttribute" | "updateName">;

  annotateHttpRoute(span, "POST", "/events");

  assertEquals(attributes, { "http.route": "/events" });
  assertEquals(name, "POST /events");
});
