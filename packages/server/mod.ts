#!/usr/bin/env -S deno run --allow-read --allow-env --allow-net

import { Command } from "@cliffy/command";
import serverMetadata from "./deno.json" with { type: "json" };
import { createServerApplication } from "./application.ts";
import { serveHttp } from "./http.ts";

export * from "./application.ts";
export * from "./config.ts";
export * from "./http.ts";
export * from "./problem.ts";

export const VERSION = serverMetadata.version;

function createCommand() {
  return new Command()
    .name("hooksmith-server")
    .version(VERSION)
    .description("Run Hooksmith as a long-lived HTTP server.")
    .option(
      "-c, --config <path:string>",
      "Config file.",
      { default: Deno.env.get("HOOKSMITH_CONFIG") ?? "hooksmith.config.ts" },
    )
    .option(
      "--host <hostname:string>",
      "HTTP bind hostname.",
      { default: Deno.env.get("HOOKSMITH_HOST") ?? "127.0.0.1" },
    )
    .option(
      "--port <port:number>",
      "HTTP bind port.",
      { default: Number(Deno.env.get("HOOKSMITH_PORT") ?? "8080") },
    )
    .action(async (options) => {
      if (
        !Number.isInteger(options.port) || options.port < 1 ||
        options.port > 65535
      ) {
        throw new Error("port must be an integer between 1 and 65535.");
      }

      const controller = new AbortController();
      const application = await createServerApplication({
        configPath: options.config,
      });

      const shutdown = () => controller.abort();
      Deno.addSignalListener("SIGINT", shutdown);
      if (Deno.build.os !== "windows") {
        Deno.addSignalListener("SIGTERM", shutdown);
      }

      try {
        await serveHttp(application.runtime, {
          hostname: options.host,
          port: options.port,
          signal: controller.signal,
          logger: application.logger,
        });
      } finally {
        application.dispose();
        Deno.removeSignalListener("SIGINT", shutdown);
        if (Deno.build.os !== "windows") {
          Deno.removeSignalListener("SIGTERM", shutdown);
        }
      }
    });
}

if (import.meta.main) {
  await createCommand().parse(Deno.args);
}
