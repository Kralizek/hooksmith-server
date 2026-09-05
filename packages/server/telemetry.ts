import type { Span } from "@opentelemetry/api";

/** Annotates an active HTTP server span with the resolved route. */
export function annotateHttpRoute(
  span: Pick<Span, "setAttribute" | "updateName"> | undefined,
  method: string,
  route: string,
): void {
  span?.setAttribute("http.route", route);
  span?.updateName(`${method} ${route}`);
}
