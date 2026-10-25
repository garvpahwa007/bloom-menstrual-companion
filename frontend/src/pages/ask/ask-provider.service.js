/** Send one opted-in question only; conversation history is never submitted or persisted. */
export async function requestAskAnswer({ question, shareCycleSummary = false, cycleSummary = null, fetcher = globalThis.fetch } = {}) {
  if (typeof fetcher !== 'function') throw new Error('AI unavailable');
  const body = { question, aiConsent: true };
  if (shareCycleSummary === true) {
    body.shareCycleSummary = true;
    body.cycleSummary = cycleSummary;
  }
  const response = await fetcher('/api/ask', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(body),
  });
  let result;
  try { result = await response.json(); } catch { throw new Error('AI unavailable'); }
  if (!response.ok || typeof result?.answer !== 'string') {
    if (result?.error === 'remove_identifiers') throw new Error('remove_identifiers');
    throw new Error('AI unavailable');
  }
  return result;
}
