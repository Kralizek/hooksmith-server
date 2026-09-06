import type { Logger, LoggerFactory } from "@hooksmith/core";
import { enableOpenTelemetry } from "@hooksmith/opentelemetry";
import {
  createConsoleLogWriter,
  createLoggerFactory,
  createRuntime,
  type Runtime,
} from "@hooksmith/runtime";
import { loadConfig } from "./config.ts";
import {
  type HostConfig,
  type IngressMapper,
  loadHostConfig,
} from "./host_config.ts";
import { resolveModuleLocation } from "./location.ts";

/** Options used to create the Hooksmith server application. */
export interface ServerApplicationOptions {
  readonly configLocation?: string;
  readonly hostConfigLocation?: string;
  readonly loggerFactory?: LoggerFactory;
}

/** Initialized Hooksmith server application state. */
export interface ServerApplication {
  readonly configLocation: string;
  readonly hostConfigLocation?: string;
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
    const configLocation = resolveModuleLocation(
      options.configLocation ?? "hooksmith.config.ts",
    );
    const config = await loadConfig(configLocation);
    const hostConfigLocation = options.hostConfigLocation
      ? resolveModuleLocation(options.hostConfigLocation)
      : undefined;
    const hostConfig = hostConfigLocation
      ? await loadHostConfig(hostConfigLocation)
      : undefined;
    const loggerFactory = options.loggerFactory ?? createLoggerFactory({
      write: createConsoleLogWriter(),
    });
    const logger = loggerFactory.getLogger("Server");
    const runtime = createRuntime(config, { logger: loggerFactory });

    return {
      configLocation,
      hostConfigLocation,
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
