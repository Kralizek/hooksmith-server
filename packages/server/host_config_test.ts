import { assertRejects, assertThrows } from "@std/assert";
import { assertHostConfig, loadHostConfig } from "./host_config.ts";

Deno.test("host config rejects non-object values", () => {
  assertThrows(
    () => assertHostConfig(42),
    Error,
    "Host config must be an object",
  );
});

Deno.test("host config rejects null ingress", () => {
  assertThrows(
    () => assertHostConfig({ ingress: null }),
    Error,
    "Host config ingress must be an object",
  );
});

Deno.test("host config rejects non-function ingress mappers", () => {
  assertThrows(
    () => assertHostConfig({ ingress: { map: 42 } }),
    Error,
    "Host config ingress.map must be a function",
  );
});

Deno.test("host config rejects null ingress mappers", () => {
  assertThrows(
    () => assertHostConfig({ ingress: { map: null } }),
    Error,
    "Host config ingress.map must be a function",
  );
});

Deno.test("host config loader rejects invalid default exports", async () => {
  const path = await writeHostConfig("export default 42;\n");

  try {
    await assertRejects(
      () => loadHostConfig(path),
      Error,
      "Invalid Hooksmith host config",
    );
  } finally {
    await Deno.remove(path);
  }
});

async function writeHostConfig(source: string): Promise<string> {
  const path = await Deno.makeTempFile({ suffix: ".ts" });
  await Deno.writeTextFile(path, source);
  return path;
}
