import { ApiError } from '../utilities/api-error.js';

export function originGuard(config) {
  const allowed = new Set(config.allowedOrigins || []);
  if (config.publicOrigin) allowed.add(config.publicOrigin);
  return (req, _res, next) => {
    // CLI/Postman clients don't send Origin. Browser mutations must come from
    // the configured site; authenticated mutations also require a CSRF token.
    const origin = req.get('Origin');
    if (origin && !allowed.has(origin)) return next(new ApiError(403, 'ORIGIN_FORBIDDEN', 'This origin is not allowed.'));
    if (req.get('Sec-Fetch-Site') === 'cross-site') return next(new ApiError(403, 'ORIGIN_FORBIDDEN', 'Cross-site API requests are not allowed.'));
    next();
  };
}
