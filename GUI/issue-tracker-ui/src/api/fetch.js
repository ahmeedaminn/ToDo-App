const BASE_URL = "http://localhost:3000/api";

// options object is the method and the data coming from the body of the request. It is optional because for GET requests, we don't need to send any data.
export const apiFetch = async (endpoint, options = {}) => {
  // 1. check for the token in local storage
  const token = localStorage.getItem("token");

  // 2. Set up headers. If a token exists, attach it for your Express middleware.
  const headers = {
    // if token exists, add it to the header
    ...(token ? { "x-auth-token": token } : {}),
    // if options already has headers, spread them in. This allows us to add custom headers for specific requests without losing the default ones.
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    // Content-Type: application/json: The handshake. It tells your Express backend: "The data I am sending is a JSON object, please parse it."
    headers["Content-Type"] = "application/json";
  }

  // 3. make the fetch from the api
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });


  // 4. If the response is a 401 Unauthorized or 403 Forbidden, it means the token is invalid or expired. We should log the user out by removing the token and refreshing the page to redirect them to login.
  // but we want to ignore this check for the /auth endpoint, because that's where we get the token in the first place. If we did this check on /auth, it would cause an infinite loop of logging out and trying to log in again.
  if (
    (response.status === 401 || response.status === 403) &&
    endpoint !== "/auth"
  ) {
    localStorage.removeItem("token");
    window.location.reload(); // 2. Force the browser to refresh
    return;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || data.message || "API Error");
  }

  return data;
};
