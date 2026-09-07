import type { HttpIngressMapper } from "@hooksmith/core/ingress";
import { resolveModuleLocation } from "./location.ts";

/** Optional HTTP ingress configuration for the Hooksmith server host. */
export interface HostConfig {
  readonly ingress?: {
    readonly map?: HttpIngressMapper;
  };
}

/** Asserts that a value is a valid Hooksmith server host configuration. */
export function assertHostConfig(value: unknown): asserts value is HostConfig {
  if (!isRecord(value)) {
    throw new Error("Host config must be an object.");
  }

  if (value.ingress === undefined) {
    return;
  }

  if (!isRecord(value.ingress)) {
    throw new Error("Host config ingress must be an object.");
  }

  if (
    value.ingress.map !== undefined &&
    typeof value.ingress.map !== "function"
  ) {
    throw new Error("Host config ingress.map must be a function.");
  }
}

/** Loads a Hooksmith server host configuration module from a local path, file URL, or HTTPS location. */
export async function loadHostConfig(location: string): Promise<HostConfig> {
  let module: Record<string, unknown>;

  try {
    module = await import(resolveModuleLocation(location));
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

  try {
    assertHostConfig(module.default);
  } catch (error) {
    throw new Error(`Invalid Hooksmith host config from ${location}.`, {
      cause: error,
    });
  }

  return module.default;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
