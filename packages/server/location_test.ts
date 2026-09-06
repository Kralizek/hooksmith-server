import { assertEquals, assertThrows } from "@std/assert";
import { resolveModuleLocation } from "./location.ts";

Deno.test("module locations preserve HTTPS URLs", () => {
  assertEquals(
    resolveModuleLocation("https://example.com/config.ts"),
    "https://example.com/config.ts",
  );
});

Deno.test("module locations preserve file URLs", () => {
  assertEquals(
    resolveModuleLocation("file:///tmp/config.ts"),
    "file:///tmp/config.ts",
  );
  assertEquals(
    resolveModuleLocation("file:/tmp/config.ts"),
    "file:///tmp/config.ts",
  );
});

Deno.test("module locations resolve local paths to file URLs", () => {
  const location = resolveModuleLocation("hooksmith.config.ts");
  assertEquals(location.startsWith("file://"), true);
  assertEquals(location.endsWith("/hooksmith.config.ts"), true);
});

Deno.test("module locations reject non-HTTPS remote protocols", () => {
  for (const location of [
    "http://example.com/config.ts",
    "http:example.com/config.ts",
  ]) {
    assertThrows(
      () => resolveModuleLocation(location),
      Error,
      "Only local paths, file URLs, and HTTPS URLs are supported",
    );
  }
});
