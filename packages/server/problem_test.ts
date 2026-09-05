import { assertEquals } from "@std/assert";
import { problemResponse } from "./problem.ts";

Deno.test("problemResponse returns RFC 9457 media type and body", async () => {
  const response = problemResponse(400, "Bad Request", "Invalid input.");

  assertEquals(response.status, 400);
  assertEquals(
    response.headers.get("content-type"),
    "application/problem+json",
  );
  assertEquals(await response.json(), {
    type: "about:blank",
    title: "Bad Request",
    status: 400,
    detail: "Invalid input.",
  });
});
