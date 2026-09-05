import type { Config } from "@hooksmith/core";
import { toFileUrl } from "@std/path";

/** Loads a Hooksmith configuration module from an absolute file path. */
export async function loadConfig(path: string): Promise<Config> {
  let module: Record<string, unknown>;

  try {
    module = await import(toFileUrl(path).href);
  } catch (error) {
    throw new Error(`Failed to load Hooksmith config from ${path}.`, {
      cause: error,
    });
  }

  if (!("default" in module) || module.default == null) {
    throw new Error(
      `Hooksmith config module ${path} must have a non-null default export.`,
    );
  }

  return module.default as Config;
}
