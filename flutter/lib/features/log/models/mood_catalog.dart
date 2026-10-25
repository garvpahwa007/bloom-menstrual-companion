const moodIds = <String>[
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
];

const legacyMoodIds = <String>['veryLow', 'low', 'okay', 'good', 'great'];

const validMoodIds = <String>{...moodIds, ...legacyMoodIds};
