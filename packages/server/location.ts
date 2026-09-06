import { resolve, toFileUrl } from "@std/path";

/** Resolves a local path or supported URL into an importable module location. */
export function resolveModuleLocation(location: string): string {
  let url: URL;
  try {
    url = new URL(location);
  } catch {
    return toFileUrl(resolve(location)).href;
  }

  switch (url.protocol) {
    case "https:":
    case "file:":
      return url.href;
    default:
      throw new Error(
        `Unsupported module location protocol in ${location}. Only local paths, file URLs, and HTTPS URLs are supported.`,
      );
  }
}
