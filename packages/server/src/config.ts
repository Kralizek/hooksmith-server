import type { Config } from "@hooksmith/core";
import { toFileUrl } from "@std/path";

/** Loads a Hooksmith configuration module from an absolute file path. */
export async function loadConfig(path: string): Promise<Config> {
  const module = await import(toFileUrl(path).href);
  if (!("default" in module)) {
    throw new Error("Config module must have a default export.");
  }

  return module.default as Config;
}
