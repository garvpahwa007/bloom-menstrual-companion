import test from 'node:test';
import assert from 'node:assert/strict';
import { subscribeToLocalDay } from '../src/utilities/local-day-ticker.js';

test('local-day ticker refreshes only on day changes and catches up when the app resumes', () => {
  let today = '2026-10-25';
  let intervalCallback;
  let intervalDelay;
  let clearedTimer;
  const windowListeners = new Map();
  const documentListeners = new Map();
  const windowTarget = {
    addEventListener: (name, callback) => windowListeners.set(name, callback),
    removeEventListener: name => windowListeners.delete(name),
  };
  const documentTarget = {
    hidden: false,
    addEventListener: (name, callback) => documentListeners.set(name, callback),
    removeEventListener: name => documentListeners.delete(name),
  };
  const changed = [];
  const stop = subscribeToLocalDay(value => changed.push(value), {
    readToday: () => today,
    intervalMs: 60_000,
    windowTarget,
    documentTarget,
    setTimer: (callback, delay) => { intervalCallback = callback; intervalDelay = delay; return 'timer'; },
    clearTimer: timer => { clearedTimer = timer; },
  });

  assert.equal(intervalDelay, 60_000);
  intervalCallback();
  assert.deepEqual(changed, []);

  today = '2026-10-26';
  intervalCallback();
  assert.deepEqual(changed, ['2026-10-26']);

  today = '2026-10-27';
  windowListeners.get('focus')();
  assert.deepEqual(changed, ['2026-10-26', '2026-10-27']);

  documentTarget.hidden = true;
  today = '2026-10-28';
  documentListeners.get('visibilitychange')();
  assert.deepEqual(changed, ['2026-10-26', '2026-10-27']);
  documentTarget.hidden = false;
  documentListeners.get('visibilitychange')();
  assert.deepEqual(changed, ['2026-10-26', '2026-10-27', '2026-10-28']);

  stop();
  assert.equal(clearedTimer, 'timer');
  assert.equal(windowListeners.size, 0);
  assert.equal(documentListeners.size, 0);
});
