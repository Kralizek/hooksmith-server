/** RFC 9457 Problem Details response body. */
export interface Problem {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail?: string;
}

/** Creates an RFC 9457 Problem Details response. */
export function problemResponse(
  status: number,
  title: string,
  detail?: string,
  headers: HeadersInit = {},
): Response {
  const problem: Problem = {
    type: "about:blank",
    title,
    status,
    ...(detail === undefined ? {} : { detail }),
  };
  const responseHeaders = new Headers(headers);
  responseHeaders.set("content-type", "application/problem+json");

  return new Response(JSON.stringify(problem), {
    status,
    headers: responseHeaders,
  });
}
