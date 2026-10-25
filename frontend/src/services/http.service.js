/** Cookie session + CSRF live in memory only. No diary, password, or token storage. */
export class ApiError extends Error {
  constructor(code, status = 0) {
    super(code);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export function createCloudClient(fetchRequest = (...args) => globalThis.fetch(...args)) {
  let csrfToken = null;
  async function request(path, { method = 'GET', body, authenticated = false, signal } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (authenticated && method !== 'GET' && csrfToken) headers['X-CSRF-Token'] = csrfToken;
    let response;
    try {
      response = await fetchRequest(`/api/v1${path}`, {
        method, headers, credentials: 'same-origin', cache: 'no-store', signal,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      throw new ApiError('SERVER_UNAVAILABLE');
    }
    let result;
    try { result = await response.json(); } catch { throw new ApiError('SERVER_UNAVAILABLE', response.status); }
    if (!response.ok) {
      if (response.status === 401 && result.error?.code !== 'INVALID_CREDENTIALS') csrfToken = null;
      throw new ApiError(result.error?.code || 'REQUEST_FAILED', response.status);
    }
    if (!result || !Object.hasOwn(result, 'data')) throw new ApiError('SERVER_UNAVAILABLE', response.status);
    return result.data;
  }
  async function authenticate(path, body, options) {
    csrfToken = null;
    const data = await request(path, { ...options, ...(body ? { method: 'POST', body } : {}) });
    if (!data?.user || typeof data.csrfToken !== 'string') throw new ApiError('SERVER_UNAVAILABLE');
    csrfToken = data.csrfToken;
    return data;
  }
  return {
    session: options => authenticate('/auth/session', null, options),
    register: credentials => authenticate('/auth/register', credentials),
    login: credentials => authenticate('/auth/login', credentials),
    async logout() {
      const data = await request('/auth/logout', { method: 'POST', authenticated: true });
      csrfToken = null;
      return data;
    },
    async lockSession() {
      if (!csrfToken) return false;
      // Capture the CSRF header before clearing memory. Local locking never
      // waits for the network, and failed sign-out must not restore this token.
      const pending = request('/auth/logout', { method: 'POST', authenticated: true });
      csrfToken = null;
      try { await pending; return true; } catch { return false; }
    },
    async deleteAccount(password) {
      const data = await request('/auth/account', { method: 'DELETE', body: { password }, authenticated: true });
      csrfToken = null;
      return data;
    },
    status: options => request('/diary/status', options),
    download: () => request('/diary/backup'),
    upload: (backup, expectedRevision) => request('/diary/backup', { method: 'PUT', body: { backup, expectedRevision }, authenticated: true }),
    deleteBackup: expectedRevision => request('/diary/backup', { method: 'DELETE', body: { expectedRevision }, authenticated: true }),
  };
}

export const cloudClient = createCloudClient();
