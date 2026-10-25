import { addDays, daysBetween, formatDate, todayISO } from '../../utilities/date.helper.js';

const PAGE = { width: 794, height: 1123, margin: 42, scale: 2 };
const PDF_A4 = { width: 595.28, height: 841.89 };
const FONT = '"Noto Sans Devanagari", "Nirmala UI", "Kohinoor Devanagari", "Mangal", system-ui, sans-serif';
const encoder = new TextEncoder();
const cleanText = value => String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
const list = value => Array.isArray(value) ? value : [];
const count = value => Number.isFinite(value) ? Math.max(0, value) : 0;
const number = (value, lang) => new Intl.NumberFormat(lang === 'hi' ? 'hi-IN' : lang === 'ta' ? 'ta-IN' : 'en-IN').format(value);
const validDate = date => { try { return typeof date === 'string' && daysBetween(date, date) === 0; } catch { return false; } };

function span(from, to, lang) {
  if (!validDate(from) || !validDate(to)) return '—';
  if (from === to) return formatDate(from, lang, { year: 'numeric' });
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  const sameMonth = from.slice(0, 7) === to.slice(0, 7);
  const first = sameMonth ? number(Number(from.slice(8)), lang) : formatDate(from, lang, sameYear ? {} : { year: 'numeric' });
  return `${first}–${formatDate(to, lang, { year: 'numeric' })}`;
}

/** Groups only genuinely consecutive dates. A range never fills unlogged gaps. */
export function compactDateRanges(dates, lang = 'en') {
  const sorted = [...new Set(list(dates).filter(validDate))].sort();
  const groups = [];
  for (const date of sorted) {
    const last = groups.at(-1);
    if (last && addDays(last.to, 1) === date) last.to = date;
    else groups.push({ from: date, to: date });
  }
  return groups.map(group => span(group.from, group.to, lang)).join('; ');
}

function datedCount(dates, t, lang) {
  const sorted = [...new Set(list(dates).filter(validDate))].sort();
  return sorted.length ? `${t('common.days', { count: number(sorted.length, lang) })} · ${span(sorted[0], sorted.at(-1), lang)}` : '—';
}

/**
 * Pure report model. Level 0 includes every episode, completed cycle, medicine
 * name/date and guidance date. Higher levels explicitly announce condensation;
 * they retain full-history aggregates and coverage, never a newest-N selection.
 * The app's complete visit-record JSON remains the authoritative full record.
 */
export function buildVisitPDFLines(summary = {}, t, lang = 'en', { compactLevel = 0 } = {}) {
  const lines = [];
  const push = (kind, text) => lines.push({ kind, text: cleanText(text) });
  const section = (key, texts) => {
    push('section', t(key));
    for (const text of texts.length ? texts : [t('visit.none')]) push('body', text);
  };
  const cycles = list(summary.cycles);
  const periods = list(summary.periods);
  const symptoms = list(summary.symptomCounts);
  const intensity = list(summary.symptomIntensityCounts);
  const medicines = list(summary.medicines);
  const guidance = list(summary.guidance);
  const range = summary.dateRange || {};
  const from = validDate(range.from) ? formatDate(range.from, lang, { year: 'numeric' }) : '—';
  const to = validDate(range.to) ? formatDate(range.to, lang, { year: 'numeric' }) : '—';
  const rangeCount = values => values.length ? t('tracking.rangeDays', { from: number(Math.min(...values), lang), to: number(Math.max(...values), lang) }) : '—';

  push('title', t('visit.title'));
  push('subtitle', t('visit.noDiagnosis'));
  push('meta', `${t('visit.generated', { date: formatDate(todayISO(), lang, { year: 'numeric' }) })} · ${t('visit.coverage', { count: number(count(summary.loggedDays), lang), from, to })}`);
  if (compactLevel) push('notice', `${t('visit.overflow')} ${t('visit.fullRecord')}`);
  else push('meta', t('visit.overview'));

  section('visit.history', cycles.length ? [compactLevel
    ? `${t('tracking.cyclesCount', { count: number(cycles.length, lang) })} · ${rangeCount(cycles.map(cycle => count(cycle.length)))}`
    : cycles.map(cycle => t('visit.cycleLine', { from: formatDate(cycle.start, lang, { year: 'numeric' }), count: number(count(cycle.length), lang) })).join(' · ')] : []);
  section('visit.periods', periods.length ? [compactLevel
    ? `${number(periods.length, lang)} · ${rangeCount(periods.map(period => count(period.length)))}`
    : periods.map(period => `${t('visit.periodLine', { from: formatDate(period.start, lang), to: formatDate(period.end, lang, { year: 'numeric' }), count: number(count(period.length), lang) })}${period.ongoing ? ` (${t('visit.ongoing')})` : ''}`).join(' · ')] : []);
  const pain = summary.pain || {};
  section('visit.painSummary', [[
    t('visit.maxPain', { pain: number(count(pain.max), lang) }),
    t('visit.disrupted', { count: number(count(pain.daysDisrupted), lang) }),
    t('visit.unrelieved', { count: number(count(pain.daysUnrelieved), lang) }),
  ].join(' · ')]);
  section('visit.symptomCounts', symptoms.length ? [compactLevel >= 3 ? number(symptoms.length, lang) : symptoms.map(symptom => {
    const key = `tracking.symptom.${symptom.id}`; const translated = t(key);
    return t('visit.symptomCount', { symptom: translated === key ? cleanText(symptom.id) : translated, count: number(count(symptom.count), lang) });
  }).join(' · ')] : []);
  const intensityLimit = compactLevel >= 2 ? 3 : intensity.length;
  const intensityLines = intensity.slice(0, intensityLimit).map(item => {
    const key = `tracking.symptom.${item.id}`; const translated = t(key);
    return t('visit.symptomIntensityCount', {
      symptom: translated === key ? cleanText(item.id) : translated,
      mild: number(count(item.mild), lang), moderate: number(count(item.moderate), lang),
      strong: number(count(item.strong), lang), ratedDays: number(count(item.ratedDays), lang),
    });
  });
  if (intensity.length > intensityLimit) intensityLines.push(t('visit.intensityMore', { count: number(intensity.length - intensityLimit, lang) }));
  section('visit.symptomIntensity', intensityLines);
  section('visit.medicineHistory', medicines.length ? compactLevel >= 2
    ? [`${number(medicines.length, lang)} · ${datedCount(medicines.flatMap(medicine => list(medicine.dates)), t, lang)}`]
    : medicines.map(medicine => t('visit.medicineDates', {
      name: cleanText(medicine.name), dates: compactLevel ? datedCount(medicine.dates, t, lang) : compactDateRanges(medicine.dates, lang),
    })) : []);
  section('visit.careEvidence', guidance.length ? compactLevel >= 3
    ? [number(guidance.length, lang)]
    : guidance.map(card => `${t(`guidance.${card.id}.title`)} · ${compactLevel ? datedCount(card.dates, t, lang) : compactDateRanges(card.dates, lang)}`) : []);
  section('visit.questions', ['q1', 'q2', 'q3'].map(key => `• ${t(`visit.${key}`)}`));
  push('note', t('visit.note'));
  return lines;
}

function fontStyle(kind, body) {
  const sizes = { title: 25, subtitle: body, section: Math.max(14, body + 1), meta: Math.max(12, body - 2), notice: Math.max(12, body - 1), note: 12 };
  return { size: sizes[kind] || body, weight: ['title', 'section', 'notice'].includes(kind) ? 600 : 400 };
}

function wrapText(context, text, width, lang) {
  const lines = []; const words = cleanText(text).split(/\s+/); let line = '';
  const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(lang === 'hi' ? 'hi' : lang === 'ta' ? 'ta' : 'en', { granularity: 'grapheme' }) : null;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= width) { line = candidate; continue; }
    if (line) { lines.push(line); line = ''; }
    if (context.measureText(word).width <= width) { line = word; continue; }
    // Long medicine labels can wrap without splitting a Devanagari grapheme.
    const characters = segmenter ? [...segmenter.segment(word)].map(part => part.segment) : Array.from(word);
    for (const character of characters) {
      if (line && context.measureText(line + character).width > width) { lines.push(line); line = character; }
      else line += character;
    }
  }
  if (line || !lines.length) lines.push(line);
  return lines;
}

function layout(context, lines, body, lang) {
  let y = PAGE.margin; const rows = [];
  for (const line of lines) {
    const style = fontStyle(line.kind, body);
    context.font = `${style.weight} ${style.size}px ${FONT}`;
    const leading = style.size * (lang === 'hi' ? 1.48 : 1.36);
    if (line.kind === 'section') y += 10;
    if (line.kind === 'notice') y += 5;
    const wrapped = wrapText(context, line.text, PAGE.width - PAGE.margin * 2, lang);
    for (const text of wrapped) { rows.push({ ...style, kind: line.kind, text, x: PAGE.margin, y }); y += leading; }
    y += line.kind === 'title' ? 5 : line.kind === 'section' ? 3 : 3;
  }
  return { rows, height: y + PAGE.margin };
}

function decodeJPEG(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (typeof value === 'string' && value.startsWith('data:image/jpeg;base64,')) return Uint8Array.from(atob(value.slice(value.indexOf(',') + 1)), character => character.charCodeAt(0));
  throw new TypeError('A JPEG byte array or JPEG data URL is required.');
}

/**
 * Small PDF 1.4 writer: one page, one JPEG XObject, no remote dependency.
 * The stream/object layout follows Adobe's PDF Reference 1.4:
 * https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/pdfreference1.4.pdf
 */
export function imageToSinglePagePDF(jpeg, width, height, lang = 'en') {
  const image = decodeJPEG(jpeg);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 20000 || height > 20000) throw new RangeError('Invalid image dimensions.');
  if (image.length < 4 || image[0] !== 0xff || image[1] !== 0xd8 || image.at(-2) !== 0xff || image.at(-1) !== 0xd9) throw new TypeError('Invalid JPEG data.');
  const chunks = []; let size = 0; const offsets = [0];
  const append = bytes => { chunks.push(bytes); size += bytes.length; };
  const ascii = text => append(encoder.encode(text));
  ascii('%PDF-1.4\n'); append(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
  const object = (id, text) => { offsets[id] = size; ascii(`${id} 0 obj\n${text}\nendobj\n`); };
  object(1, `<< /Type /Catalog /Pages 2 0 R /Lang (${lang === 'hi' ? 'hi-IN' : lang === 'ta' ? 'ta-IN' : 'en-IN'}) >>`);
  object(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_A4.width} ${PDF_A4.height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4] = size;
  ascii(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`);
  append(image); ascii('\nendstream\nendobj\n');
  const commands = `q\n${PDF_A4.width} 0 0 ${PDF_A4.height} 0 0 cm\n/Im0 Do\nQ\n`;
  object(5, `<< /Length ${encoder.encode(commands).length} >>\nstream\n${commands}endstream`);
  const xref = size;
  ascii('xref\n0 6\n0000000000 65535 f \n');
  for (let id = 1; id <= 5; id++) ascii(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
  ascii(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(chunks, { type: 'application/pdf' });
}

/** Builds a local, printable raster PDF so native canvas shapes Hindi correctly. */
export async function createVisitPDF(summary, t, lang = 'en') {
  if (!globalThis.document?.createElement) throw new Error('A browser canvas is required.');
  if (document.fonts?.ready) await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = PAGE.width * PAGE.scale; canvas.height = PAGE.height * PAGE.scale;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('A canvas drawing context is required.');
  context.scale(PAGE.scale, PAGE.scale);
  let selected;
  for (const compactLevel of [0, 1, 2, 3]) {
    const lines = buildVisitPDFLines(summary, t, lang, { compactLevel });
    for (const body of compactLevel ? [14, 13, 12] : [16, 15, 14, 13, 12]) {
      const candidate = layout(context, lines, body, lang);
      if (candidate.height <= PAGE.height) { selected = candidate; break; }
    }
    if (selected) break;
  }
  if (!selected) throw new Error('The one-page overview could not be fitted legibly.');
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, PAGE.width, PAGE.height);
  context.textBaseline = 'top'; context.direction = 'ltr';
  for (const row of selected.rows) {
    context.font = `${row.weight} ${row.size}px ${FONT}`;
    context.fillStyle = ['title', 'section', 'notice'].includes(row.kind) ? '#53375f' : row.kind === 'meta' || row.kind === 'note' ? '#655b6c' : '#302536';
    if (row.kind === 'section') { context.fillStyle = '#eee8f2'; context.fillRect(PAGE.margin - 5, row.y - 2, PAGE.width - PAGE.margin * 2 + 10, row.size * (lang === 'hi' ? 1.48 : 1.36) + 3); context.fillStyle = '#53375f'; }
    context.fillText(row.text, row.x, row.y);
  }
  const result = imageToSinglePagePDF(canvas.toDataURL('image/jpeg', .92), canvas.width, canvas.height, lang);
  canvas.width = 0; canvas.height = 0;
  return result;
}

export default createVisitPDF;
