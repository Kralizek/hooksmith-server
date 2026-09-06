import type { Config } from "@hooksmith/core";
import { resolveModuleLocation } from "./location.ts";

/** Loads a Hooksmith configuration module from a local path, file URL, or HTTPS location. */
export async function loadConfig(location: string): Promise<Config> {
  let module: Record<string, unknown>;

  try {
    module = await import(resolveModuleLocation(location));
  } catch (error) {
    throw new Error(`Failed to load Hooksmith config from ${location}.`, {
      cause: error,
    });
  }

  if (!("default" in module) || module.default == null) {
    throw new Error(
      `Hooksmith config module ${location} must have a non-null default export.`,
    );
  }

  return module.default as Config;
}
