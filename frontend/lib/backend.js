const DEFAULT_BACKEND_URL = 'http://localhost:5000';
const DEFAULT_TIMEOUT_MS = 8000;

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function isLocalBackendUrl(value) {
  try {
    const { hostname } = new URL(value);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

export function getBackendConfig() {
  if (process.env.BACKEND_URL) {
    return {
      backendUrl: trimTrailingSlash(process.env.BACKEND_URL),
      source: 'BACKEND_URL',
    };
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return {
      backendUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_API_URL),
      source: 'NEXT_PUBLIC_API_URL',
    };
  }

  return {
    backendUrl: DEFAULT_BACKEND_URL,
    source: 'fallback-localhost',
  };
}

export function buildBackendUrl(pathname) {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${getBackendConfig().backendUrl}${normalizedPath}`;
}

function shouldSkipBuildTimeFetch() {
  const { backendUrl } = getBackendConfig();
  return process.env.npm_lifecycle_event === 'build' && isLocalBackendUrl(backendUrl);
}

export class BackendRequestError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'BackendRequestError';
    this.url = options.url;
    this.status = options.status ?? null;
  }
}

export async function fetchBackend(pathname, init = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...rest } = init;
  const url = buildBackendUrl(pathname);

  try {
    return await fetch(url, {
      ...rest,
      signal: signal || AbortSignal.timeout(timeoutMs),
    });
  } catch (cause) {
    throw new BackendRequestError('Failed to reach backend service.', {
      cause,
      url,
    });
  }
}

export async function fetchBackendJson(pathname, init = {}) {
  const {
    fallback = null,
    onError = null,
    onResponseError = null,
    ...fetchInit
  } = init;

  if (shouldSkipBuildTimeFetch()) {
    return fallback;
  }

  try {
    const response = await fetchBackend(pathname, fetchInit);

    if (!response.ok) {
      if (typeof onResponseError === 'function') {
        onResponseError(response);
      }
      return fallback;
    }

    return await response.json();
  } catch (error) {
    if (typeof onError === 'function') {
      onError(error);
    }
    return fallback;
  }
}
