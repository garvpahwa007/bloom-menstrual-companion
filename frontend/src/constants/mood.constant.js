export const MOOD_IDS = Object.freeze([
  'moodSwings',
  'notInControl',
  'fine',
  'happy',
  'sad',
  'sensitive',
  'angry',
  'confident',
  'excited',
  'irritable',
  'anxious',
  'insecure',
  'grateful',
  'indifferent',
]);

export const LEGACY_MOOD_IDS = Object.freeze([
  'veryLow',
  'low',
  'okay',
  'good',
  'great',
]);

export const VALID_MOOD_IDS = Object.freeze([...MOOD_IDS, ...LEGACY_MOOD_IDS]);
