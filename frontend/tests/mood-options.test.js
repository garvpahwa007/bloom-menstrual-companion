import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../src/i18n/en.js';
import hi from '../src/i18n/hi.js';
import ta from '../src/i18n/ta.js';
import { MOOD_IDS, LEGACY_MOOD_IDS, VALID_MOOD_IDS } from '../src/constants/mood.constant.js';

test('the requested mood descriptors and legacy scale have complete translations', () => {
  assert.deepEqual(MOOD_IDS, [
    'moodSwings', 'notInControl', 'fine', 'happy', 'sad', 'sensitive', 'angry',
    'confident', 'excited', 'irritable', 'anxious', 'insecure', 'grateful', 'indifferent',
  ]);
  assert.deepEqual(LEGACY_MOOD_IDS, ['veryLow', 'low', 'okay', 'good', 'great']);
  assert.deepEqual(VALID_MOOD_IDS, [...MOOD_IDS, ...LEGACY_MOOD_IDS]);

  for (const dictionary of [en, hi, ta]) {
    for (const mood of MOOD_IDS) {
      const value = dictionary[`tracking.mood.${mood}`];
      assert.equal(typeof value, 'string', `Missing translation for ${mood}`);
      assert.ok(value.length > 0);
    }
    assert.equal(typeof dictionary['tracking.moodLegacyScale'], 'string');
  }
});
