import type { Logger, LoggerFactory } from "@hooksmith/core";
import {
  createConsoleLogWriter,
  createLoggerFactory,
  createRuntime,
  type Runtime,
} from "@hooksmith/runtime";
import { resolve } from "@std/path";
import { loadConfig } from "./config.ts";

/** Options used to create the Hooksmith server application. */
export interface ServerApplicationOptions {
  readonly configPath?: string;
  readonly loggerFactory?: LoggerFactory;
}

/** Initialized Hooksmith server application state. */
export interface ServerApplication {
  readonly configPath: string;
  readonly logger: Logger;
  readonly runtime: Runtime;
}

/** Loads configuration and creates the Hooksmith runtime used by the server. */
export async function createServerApplication(
  options: ServerApplicationOptions = {},
): Promise<ServerApplication> {
  const configPath = resolve(options.configPath ?? "hooksmith.config.ts");
  const config = await loadConfig(configPath);
  const loggerFactory = options.loggerFactory ?? createLoggerFactory({
    write: createConsoleLogWriter(),
  });
  const logger = loggerFactory.getLogger("Server");
  const runtime = createRuntime(config, { logger: loggerFactory });

  return { configPath, logger, runtime };
}
