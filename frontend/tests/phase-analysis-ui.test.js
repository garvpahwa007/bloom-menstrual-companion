import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { dictionaries } from '../src/i18n/index.js';

await build({
  entryPoints: [new URL('../src/pages/today/today.page.jsx', import.meta.url).pathname],
  outfile: new URL('../.test-cache/PhaseAnalysisPage.mjs', import.meta.url).pathname,
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  target: 'node20',
  jsx: 'automatic',
  logLevel: 'warning',
});

const { TodayScreen } = await import('../.test-cache/PhaseAnalysisPage.mjs');
const analysis = {
  cycleDay: 11,
  median: 28,
  average: 28,
  phase: { id: 'beforeOvulation', estimated: true },
  prediction: null,
  suspectedGaps: [],
  patterns: [],
  recentCycles: [],
  periods: [],
  irregular: false,
  ovulation: null,
  fertile: null,
};
const makeState = (pregnancyEnabled = false) => ({
  profile: { pregnancyEnabled, ageGroup: 'under18', fertilityEnabled: false },
  logs: {},
});
const renderToday = (pregnancyEnabled = false) => renderToStaticMarkup(React.createElement(TodayScreen, {
  state: makeState(pregnancyEnabled),
  analysis,
  t: key => key,
  lang: 'en',
  onNavigate: () => {},
}));

const phaseKeys = [
  'tracking.phaseAnalysisKicker',
  'tracking.phaseAnalysisTitle',
  'tracking.currentPhase',
  'tracking.cycleDayNumber',
  'tracking.phaseAnalysisUnavailable',
  'tracking.phaseTimelineLabel',
  'tracking.phaseName.menstrual',
  'tracking.phaseName.beforeOvulation',
  'tracking.phaseName.aroundOvulation',
  'tracking.phaseName.afterOvulation',
  'tracking.phaseEducationTitle',
  'tracking.phaseEducationBody',
  'tracking.hormone.fsh',
  'tracking.hormone.lh',
  'tracking.hormone.pg',
  'tracking.hormone.e2',
  'tracking.phaseAnalysisNote',
];

test('phase analysis has complete English, Hindi, and Tamil labels', () => {
  for (const [locale, dictionary] of Object.entries(dictionaries)) {
    for (const key of phaseKeys) assert.ok(dictionary[key], `Missing ${key} in ${locale}`);
  }
});

test('Today shows the estimated phase timeline when pregnancy mode is off', () => {
  const html = renderToday();
  assert.match(html, /class="card phase-analysis-card"/);
  assert.match(html, /tracking\.phaseAnalysisTitle/);
  assert.match(html, /tracking\.phaseName\.beforeOvulation/);
  assert.match(html, /class="phase-timeline-marker/);
  assert.match(html, /tracking\.phaseAnalysisNote/);
});

test('phase timeline is omitted in pregnancy mode', () => {
  const html = renderToday(true);
  assert.doesNotMatch(html, /phase-analysis-card/);
  assert.doesNotMatch(html, /phase-timeline-marker/);
});
