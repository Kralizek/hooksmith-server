import type { Logger, LoggerFactory } from "@hooksmith/core";
import { enableOpenTelemetry } from "@hooksmith/opentelemetry";
import {
  createConsoleLogWriter,
  createLoggerFactory,
  createRuntime,
  type Runtime,
} from "@hooksmith/runtime";
import { resolve } from "@std/path";
import { loadConfig } from "./config.ts";
import {
  type HostConfig,
  type IngressMapper,
  loadHostConfig,
} from "./host_config.ts";

/** Options used to create the Hooksmith server application. */
export interface ServerApplicationOptions {
  readonly configPath?: string;
  readonly hostConfigPath?: string;
  readonly loggerFactory?: LoggerFactory;
}

/** Initialized Hooksmith server application state. */
export interface ServerApplication {
  readonly configPath: string;
  readonly hostConfigPath?: string;
  readonly hostConfig?: HostConfig;
  readonly ingressMapper?: IngressMapper;
  readonly logger: Logger;
  readonly runtime: Runtime;
  dispose(): void;
}

/** Loads configuration and creates the Hooksmith runtime used by the server. */
export async function createServerApplication(
  options: ServerApplicationOptions = {},
): Promise<ServerApplication> {
  const restoreTelemetry = enableOpenTelemetry();

  try {
    const configPath = resolve(options.configPath ?? "hooksmith.config.ts");
    const config = await loadConfig(configPath);
    const hostConfigPath = options.hostConfigPath
      ? resolve(options.hostConfigPath)
      : undefined;
    const hostConfig = hostConfigPath
      ? await loadHostConfig(hostConfigPath)
      : undefined;
    const loggerFactory = options.loggerFactory ?? createLoggerFactory({
      write: createConsoleLogWriter(),
    });
    const logger = loggerFactory.getLogger("Server");
    const runtime = createRuntime(config, { logger: loggerFactory });

    return {
      configPath,
      hostConfigPath,
      hostConfig,
      ingressMapper: hostConfig?.ingress?.map,
      logger,
      runtime,
      dispose: restoreTelemetry,
    };
  } catch (error) {
    restoreTelemetry();
    throw error;
  }
}
