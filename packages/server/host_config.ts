import type { Event } from "@hooksmith/core";
import { toFileUrl } from "@std/path";

/** HTTP request data available to an ingress mapper. */
export interface IngressContext {
  readonly body: unknown;
  readonly request: Request;
}

/** Maps an HTTP request payload to a Hooksmith event document. */
export type IngressMapper = (
  context: IngressContext,
) => Event | Promise<Event>;

/** Optional HTTP ingress configuration for the Hooksmith server host. */
export interface HostConfig {
  readonly ingress?: {
    readonly map?: IngressMapper;
  };
}

/** Loads a Hooksmith server host configuration module from an absolute file path. */
export async function loadHostConfig(path: string): Promise<HostConfig> {
  let module: Record<string, unknown>;

  try {
    module = await import(toFileUrl(path).href);
  } catch (error) {
    throw new Error(`Failed to load Hooksmith host config from ${path}.`, {
      cause: error,
    });
  }

  if (!("default" in module) || module.default == null) {
    throw new Error(
      `Hooksmith host config module ${path} must have a non-null default export.`,
    );
  }

  return module.default as HostConfig;
}
