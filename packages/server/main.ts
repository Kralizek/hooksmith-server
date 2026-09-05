#!/usr/bin/env -S deno run -A

import { createServerApplication } from "./src/application.ts";
import { serveHttp } from "./src/http.ts";

const DEFAULT_HOSTNAME = "127.0.0.1";
const DEFAULT_PORT = 8080;
const DEFAULT_CONFIG = "hooksmith.config.ts";

/** Runs the Hooksmith server process using environment-based host settings. */
export async function main(): Promise<void> {
  const configPath = Deno.env.get("HOOKSMITH_CONFIG") ?? DEFAULT_CONFIG;
  const hostname = Deno.env.get("HOOKSMITH_HOST") ?? DEFAULT_HOSTNAME;
  const port = parsePort(Deno.env.get("HOOKSMITH_PORT"));
  const controller = new AbortController();

  const application = await createServerApplication({ configPath });

  const shutdown = () => controller.abort();
  Deno.addSignalListener("SIGINT", shutdown);
  if (Deno.build.os !== "windows") {
    Deno.addSignalListener("SIGTERM", shutdown);
  }

  try {
    await serveHttp(application.runtime, {
      hostname,
      port,
      signal: controller.signal,
      logger: application.logger,
    });
  } finally {
    Deno.removeSignalListener("SIGINT", shutdown);
    if (Deno.build.os !== "windows") {
      Deno.removeSignalListener("SIGTERM", shutdown);
    }
  }
}

function parsePort(value: string | undefined): number {
  if (value === undefined) return DEFAULT_PORT;

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("HOOKSMITH_PORT must be an integer between 1 and 65535.");
  }

  return port;
}

if (import.meta.main) {
  await main();
}
