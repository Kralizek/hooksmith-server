import { resolve, toFileUrl } from "@std/path";

/** Resolves a local path or HTTPS URL into an importable module location. */
export function resolveModuleLocation(location: string): string {
  if (location.startsWith("https://")) {
    return new URL(location).href;
  }

  if (location.startsWith("file://")) {
    return new URL(location).href;
  }

  if (location.includes("://")) {
    throw new Error(
      `Unsupported module location protocol in ${location}. Only local paths, file URLs, and HTTPS URLs are supported.`,
    );
  }

  return toFileUrl(resolve(location)).href;
}
