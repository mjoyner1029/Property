// Memory-first access token store (no localStorage).
// The refresh token is assumed to be managed via httpOnly cookie on the backend.
// Consumers should subscribe to token changes if they cache axios instances, etc.

let accessToken = null;
const listeners = new Set();

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token || null;
  for (const fn of listeners) {
    try { fn(accessToken); } catch {}
  }
}

export function clearAccessToken() {
  setAccessToken(null);
}

export function onTokenChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Utility: run a safe callback; useful for axios interceptors
export function withAccessTokenHeaders(headers = {}) {
  const t = getAccessToken();
  if (t) {
    return { ...headers, Authorization: `Bearer ${t}` };
  }
  return headers;
}
