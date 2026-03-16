const originalFetch = window.fetch;

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let url = input.toString();
  
  if (url.startsWith("/api")) {
    const token = localStorage.getItem("occ_token");
    if (token) {
      init = init || {};
      init.headers = {
        ...init.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }
  
  return originalFetch(input, init);
};

export {};
