const originalFetch = window.fetch;

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof Request ? input.url : input.toString();

  if (url.startsWith("/api") || url.includes("/api/")) {
    const token = localStorage.getItem("occ_token");
    if (token) {
      init = init ?? {};

      // Preserve existing headers (regardless of whether they are a Headers object,
      // a plain object, or an array of pairs) and inject the Authorization header.
      const existingHeaders = new Headers(init.headers as HeadersInit | undefined);
      existingHeaders.set("Authorization", `Bearer ${token}`);
      init = { ...init, headers: existingHeaders };
    }
  }

  return originalFetch(input, init);
};

export {};
