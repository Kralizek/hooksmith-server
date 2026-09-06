import { assertRejects, assertThrows } from "@std/assert";
import { assertHostConfig, loadHostConfig } from "./host_config.ts";

Deno.test("assertHostConfig rejects non-object values", () => {
  assertThrows(
    () => assertHostConfig(42),
    Error,
    "Host config must be an object",
  );
});

Deno.test("assertHostConfig rejects non-function ingress mappers", () => {
  assertThrows(
    () => assertHostConfig({ ingress: { map: 42 } }),
    Error,
    "Host config ingress.map must be a function",
  );
});

Deno.test("host config rejects non-object default exports", async () => {
  const path = await writeHostConfig("export default 42;\n");

  try {
    await assertRejects(
      () => loadHostConfig(path),
      Error,
      "Host config must be an object",
    );
  } finally {
    await Deno.remove(path);
  }
});

Deno.test("host config rejects non-function ingress mappers", async () => {
  const path = await writeHostConfig(
    "export default { ingress: { map: 42 } };\n",
  );

  try {
    await assertRejects(
      () => loadHostConfig(path),
      Error,
      "Host config ingress.map must be a function",
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
