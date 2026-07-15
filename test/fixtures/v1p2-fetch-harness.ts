/** Safe structural facts recorded by the injected Web fetch seam. */
export interface OneRosterV1p2FetchCall {
  readonly url: string;
  readonly method: string;
  readonly hasAuthorization: boolean;
  readonly contentType?: string;
  readonly bodyPresent: boolean;
}

/** A deterministic injected-fetch harness using real Web Response values. */
export class OneRosterV1p2FetchHarness {
  readonly calls: Array<OneRosterV1p2FetchCall> = [];
  private readonly responses: Array<Response | Error>;

  public constructor(responses: ReadonlyArray<Response | Error>) {
    this.responses = [...responses];
  }

  public readonly fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const headers = new Headers(init?.headers);
    this.calls.push({
      url: input instanceof URL ? input.toString() : typeof input === "string" ? input : input.url,
      method: init?.method ?? "GET",
      hasAuthorization: headers.has("authorization"),
      ...(headers.get("content-type") === null
        ? {}
        : { contentType: headers.get("content-type") ?? "" }),
      bodyPresent: init?.body !== undefined,
    });
    const response = this.responses.shift();
    if (response === undefined) throw new Error("Harness response queue was empty.");
    if (response instanceof Error) throw response;
    return response;
  };
}
