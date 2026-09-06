import type { EventDocument } from "@hooksmith/core";
import { toFileUrl } from "@std/path";

/** HTTP request data available to an ingress mapper. */
export interface IngressContext {
  readonly body: unknown;
  readonly request: Request;
}

/** Maps an HTTP request payload to a Hooksmith event document. */
export type IngressMapper = (
  context: IngressContext,
) => EventDocument | Promise<EventDocument>;

/** Optional HTTP ingress configuration for the Hooksmith server host. */
export interface HostConfig {
  readonly ingress?: {
    readonly map?: IngressMapper;
  };
}

/** Loads a Hooksmith server host configuration module from an absolute file location. */
export async function loadHostConfig(location: string): Promise<HostConfig> {
  let module: Record<string, unknown>;

  try {
    module = await import(toFileUrl(location).href);
  } catch (error) {
    throw new Error(`Failed to load Hooksmith host config from ${location}.`, {
      cause: error,
    });
  }

  if (!("default" in module) || module.default == null) {
    throw new Error(
      `Hooksmith host config module ${location} must have a non-null default export.`,
    );
  }

  assertHostConfig(module.default, location);
  return module.default;
}

function assertHostConfig(value: unknown, location: string): asserts value is HostConfig {
  if (!isRecord(value)) {
    throw new Error(
      `Hooksmith host config module ${location} must export an object.`,
    );
  }

  if (value.ingress === undefined || value.ingress === null) {
    return;
  }

  if (!isRecord(value.ingress)) {
    throw new Error(
      `Hooksmith host config module ${location} ingress must be an object.`,
    );
  }

  if (
    value.ingress.map !== undefined &&
    value.ingress.map !== null &&
    typeof value.ingress.map !== "function"
  ) {
    throw new Error(
      `Hooksmith host config module ${location} ingress.map must be a function.`,
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
