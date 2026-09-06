import type { Config } from "@hooksmith/core";
import { toFileUrl } from "@std/path";

/** Loads a Hooksmith configuration module from an absolute file location. */
export async function loadConfig(location: string): Promise<Config> {
  let module: Record<string, unknown>;

  try {
    module = await import(toFileUrl(location).href);
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
