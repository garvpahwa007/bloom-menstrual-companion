import test from 'node:test';
import assert from 'node:assert/strict';
import { compactDateRanges, buildVisitPDFLines, imageToSinglePagePDF, createVisitPDF } from '../src/pages/visit/visit-pdf.service.js';
import { buildVisitSummary } from '../src/pages/visit/visit.service.js';
import { createDemoData } from '../src/data/demo.js';
import { translator } from '../src/i18n/index.js';

const en = translator('en'); const hi = translator('hi');
const jpeg = new Uint8Array([0xff, 0xd8, 0x01, 0x7f, 0x80, 0x00, 0xff, 0xd9]);
const summary = () => buildVisitSummary(createDemoData('2026-10-22'), { today: '2026-10-22' });

test('contiguous date grouping keeps separate gaps and years visible', () => {
  const compact = compactDateRanges(['2026-01-01', '2025-12-31', '2026-01-02', '2026-01-05', '2026-01-05'], 'en');
  assert.match(compact, /2025/); assert.match(compact, /2026/); assert.match(compact, /;/);
  assert.equal(compact.split(';').length, 2);
  assert.equal(compactDateRanges(['bad date', null]), '');
});

test('the full model includes old and new medicines without a newest-N cutoff', () => {
  const data = summary();
  data.medicines = [{ name: 'Older recorded medicine', dates: ['2020-01-01', '2020-01-02'] }, { name: 'Recent recorded medicine', dates: ['2026-10-21'] }];
  const text = buildVisitPDFLines(data, en, 'en').map(line => line.text).join('\n');
  assert.match(text, /Older recorded medicine/); assert.match(text, /Recent recorded medicine/); assert.match(text, /2020/); assert.match(text, /2026/);
  assert.doesNotMatch(text, /This overview is condensed/);
});

test('all-history symptoms and pain aggregates and each guidance rule reach the full model', () => {
  const data = summary();
  data.symptomIntensityCounts = [{ id: 'headache', mild: 1, moderate: 2, strong: 3, ratedDays: 6 }];
  const text = buildVisitPDFLines(data, en, 'en').map(line => line.text).join('\n');
  for (const symptom of data.symptomCounts) assert.ok(text.includes(en('visit.symptomCount', { symptom: en(`tracking.symptom.${symptom.id}`), count: symptom.count })));
  for (const item of data.symptomIntensityCounts) assert.ok(text.includes(en('visit.symptomIntensityCount', { symptom: en(`tracking.symptom.${item.id}`), mild: item.mild, moderate: item.moderate, strong: item.strong, ratedDays: item.ratedDays })));
  for (const card of data.guidance) assert.ok(text.includes(en(`guidance.${card.id}.title`)));
  assert.ok(text.includes(en('visit.maxPain', { pain: data.pain.max })));
  assert.ok(text.includes(en('visit.disrupted', { count: data.pain.daysDisrupted })));
});

test('condensed PDF retains the top three intensity aggregates and discloses additional ratings', () => {
  const data = summary();
  data.symptomIntensityCounts = ['headache', 'cramps', 'nausea', 'acne', 'fatigue'].map((id, index) => ({ id, mild: index, moderate: 1, strong: 0, ratedDays: index + 1 }));
  const text = buildVisitPDFLines(data, en, 'en', { compactLevel: 2 }).map(line => line.text).join('\n');
  assert.ok(text.includes(en('visit.symptomIntensityCount', { symptom: en('tracking.symptom.headache'), mild: 0, moderate: 1, strong: 0, ratedDays: 1 })));
  assert.ok(text.includes(en('visit.symptomIntensityCount', { symptom: en('tracking.symptom.nausea'), mild: 2, moderate: 1, strong: 0, ratedDays: 3 })));
  assert.ok(text.includes(en('visit.intensityMore', { count: 2 })));
  assert.equal(text.includes(en('visit.symptomIntensityCount', { symptom: en('tracking.symptom.acne'), mild: 3, moderate: 1, strong: 0, ratedDays: 4 })), false);
});

test('English and Hindi report models use their locale and contain no untranslated keys', () => {
  for (const [lang, t] of [['en', en], ['hi', hi]]) {
    const lines = buildVisitPDFLines(summary(), t, lang);
    assert.equal(lines[0].text, t('visit.title'));
    assert.ok(lines.every(line => !/^(?:visit|tracking|guidance)\.[a-zA-Z.]+$/.test(line.text)));
    assert.ok(lines.some(line => line.text.includes(t('visit.q1'))));
  }
  assert.match(buildVisitPDFLines(summary(), hi, 'hi').map(line => line.text).join(' '), /[\u0900-\u097f]/);
});

test('dense overview levels explicitly disclose condensation and keep coverage and totals', () => {
  const data = summary();
  data.medicines = Array.from({ length: 500 }, (_, i) => ({ name: `Medicine ${i}`, dates: ['2020-01-01', '2026-10-21'] }));
  for (const compactLevel of [1, 2, 3]) {
    const text = buildVisitPDFLines(data, en, 'en', { compactLevel }).map(line => line.text).join('\n');
    assert.ok(text.includes(en('visit.overflow'))); assert.ok(text.includes(en('visit.fullRecord')));
    assert.ok(text.includes(String(data.loggedDays))); assert.ok(text.includes(en('visit.maxPain', { pain: data.pain.max })));
    if (compactLevel >= 2) assert.ok(text.includes('500'));
  }
});

test('private diary notes and PIN state are outside the PDF model', () => {
  const data = { ...summary(), note: 'PRIVATE SENTINEL', settings: { pin: '4321' }, logs: { '2026-10-22': { note: 'PRIVATE SENTINEL' } } };
  const text = buildVisitPDFLines(data, en, 'en').map(line => line.text).join('\n');
  assert.doesNotMatch(text, /PRIVATE SENTINEL|4321/);
});

test('empty history still produces a useful report with questions and the no-diagnosis statement', () => {
  const lines = buildVisitPDFLines({}, en, 'en');
  assert.ok(lines.some(line => line.text === en('visit.noDiagnosis')));
  assert.ok(lines.some(line => line.text === en('visit.none')));
  assert.ok(lines.some(line => line.text.includes(en('visit.q3'))));
});

test('PDF structure has one A4 page, a JPEG XObject and byte-correct xref offsets', async () => {
  const blob = imageToSinglePagePDF(jpeg, 1588, 2246, 'hi');
  assert.equal(blob.type, 'application/pdf');
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const text = new TextDecoder('latin1').decode(bytes);
  assert.ok(text.startsWith('%PDF-1.4\n')); assert.ok(text.endsWith('%%EOF\n'));
  assert.equal((text.match(/\/Type \/Page\b/g) || []).length, 1);
  assert.match(text, /\/Count 1/); assert.match(text, /\/MediaBox \[0 0 595\.28 841\.89\]/);
  assert.match(text, /\/Lang \(hi-IN\)/); assert.match(text, /\/Filter \/DCTDecode/);
  const pointer = Number(text.match(/startxref\n(\d+)/)[1]);
  assert.equal(new TextDecoder().decode(bytes.slice(pointer, pointer + 4)), 'xref');
  const xref = new TextDecoder().decode(bytes.slice(pointer));
  const rows = xref.split('\n').slice(3, 8);
  rows.forEach((row, index) => {
    const offset = Number(row.slice(0, 10));
    assert.equal(new TextDecoder().decode(bytes.slice(offset, offset + 7)), `${index + 1} 0 obj`);
  });
});

test('JPEG bytes are embedded exactly and stream lengths count binary bytes', async () => {
  const blob = imageToSinglePagePDF(jpeg, 1, 1);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const text = new TextDecoder('latin1').decode(bytes);
  const imageObject = text.slice(text.indexOf('4 0 obj'));
  assert.match(imageObject, new RegExp(`/Length ${jpeg.length} >>`));
  const prefix = new TextEncoder().encode('stream\n');
  const streamAt = text.indexOf('stream\n', text.indexOf('4 0 obj')) + prefix.length;
  assert.deepEqual(bytes.slice(streamAt, streamAt + jpeg.length), jpeg);
});

test('PDF writer rejects invalid images and dimensions', () => {
  assert.throws(() => imageToSinglePagePDF(new Uint8Array([1, 2, 3]), 1, 1));
  for (const dimension of [0, -1, 1.5, 20001, NaN]) assert.throws(() => imageToSinglePagePDF(jpeg, dimension, 1));
});

test('canvas export requires a browser rather than a remote rendering service', async () => {
  await assert.rejects(createVisitPDF(summary(), en, 'en'), /browser canvas/);
});
