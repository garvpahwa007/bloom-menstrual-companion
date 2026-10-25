export function errorMiddleware(error, _req, res, _next) {
  if (res.headersSent) return;
  let status = error.status || 500;
  let code = error.code || 'INTERNAL_ERROR';
  let message = error.message;
  if (error.type === 'entity.too.large') {
    status = 413; code = 'PAYLOAD_TOO_LARGE'; message = 'This request is too large.';
  } else if (error.type === 'entity.parse.failed') {
    status = 400; code = 'BODY_INVALID'; message = 'Send valid JSON.';
  } else if (error.code === 11000) {
    status = 409; code = 'USERNAME_TAKEN'; message = 'Choose a different alias.';
  } else if (['MongoServerSelectionError', 'MongoNetworkError', 'MongooseServerSelectionError', 'MongoNotConnectedError'].includes(error.name) || /buffering timed out|before initial connection/i.test(error.message || '')) {
    status = 503; code = 'SERVICE_UNAVAILABLE'; message = 'Cloud backup is temporarily unavailable. Your device diary still works.';
  } else if (!Number.isInteger(status) || status < 400 || status > 499) {
    status = 500; code = 'INTERNAL_ERROR'; message = 'The request could not be completed.';
  }
  // Never return database diagnostics, credentials, ciphertext or submitted values.
  res.status(status).json({ error: { code: String(code), message } });
}
