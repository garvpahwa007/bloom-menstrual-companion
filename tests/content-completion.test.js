import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, LESSON_DIAGRAMS } from '../src/content/lessons.js';
import { FAQ } from '../src/content/faq.js';
import { PREGNANCY_WEEKS } from '../src/content/pregnancy.js';
import { SOURCES, RED_FLAG_SOURCE_LABELS } from '../src/content/sources.js';
import { RED_FLAGS } from '../src/data/redflags.js';
import { answerQuestion } from '../src/lib/ask.js';
import { lessonsForAge } from '../src/content/learning-paths.js';

test('age-aware learning paths prioritise relevant topics without removing access or mutating content', () => {
  const original = LESSONS.map(lesson => lesson.id);
  assert.equal(lessonsForAge(LESSONS, 'under18')[0].id, 'firstPeriod');
  assert.equal(lessonsForAge(LESSONS, 'adult')[0].id, 'irregular');
  assert.deepEqual(lessonsForAge(LESSONS, 'under18').map(lesson => lesson.id).sort(), [...original].sort());
  assert.deepEqual(LESSONS.map(lesson => lesson.id), original);
});

const bilingual = (value, label) => {
  assert.ok(value?.en?.trim(), `${label}: missing English`);
  assert.match(value?.hi || '', /[\u0900-\u097f]/, `${label}: missing Hindi`);
};
const sourced = (ids, label) => {
  assert.ok(Array.isArray(ids) && ids.length > 0, `${label}: sources required`);
  for (const id of ids) {
    assert.ok(SOURCES[id], `${label}: source ${id} not found`);
    assert.ok(SOURCES[id].name && SOURCES[id].nameHi, `${label}: source titles must be bilingual`);
    assert.equal(new URL(SOURCES[id].url).protocol, 'https:');
  }
};

test('pregnancy has exactly one distinct sourced bilingual card per week from 1 through 42', () => {
  assert.equal(PREGNANCY_WEEKS.length, 42);
  assert.deepEqual(PREGNANCY_WEEKS.map(card => card.from), Array.from({ length: 42 }, (_, i) => i + 1));
  assert.equal(new Set(PREGNANCY_WEEKS.map(card => card.body.en)).size, 42);
  assert.equal(new Set(PREGNANCY_WEEKS.map(card => card.body.hi)).size, 42);
  for (const card of PREGNANCY_WEEKS) {
    assert.equal(card.from, card.to, `Week ${card.from} must be individually authored`);
    bilingual(card.title, `Week ${card.from} title`);
    bilingual(card.body, `Week ${card.from} body`);
    sourced(card.sourceIds, `Week ${card.from}`);
    assert.doesNotMatch(card.body.en, /\b\d+\s?(mg|mcg|micrograms?|milligrams?|tablets?)\b/i);
  }
});

test('late-period education explicitly discusses illness, travel and thyroid with sources', () => {
  const lesson = LESSONS.find(item => item.id === 'irregular');
  const en = lesson.body.en.join(' ');
  const hi = lesson.body.hi.join(' ');
  assert.match(en, /illness/i);
  assert.match(en, /travel/i);
  assert.match(en, /thyroid/i);
  assert.match(hi, /बीमारी/);
  assert.match(hi, /यात्रा/);
  assert.match(hi, /थायरॉइड/);
  assert.match(en, /travel alone does not establish/i, 'Travel must not become a blanket explanation');
  for (const id of ['illness', 'travel', 'thyroid']) {
    const item = FAQ.find(entry => entry.id === id);
    assert.ok(item, `Missing ${id} FAQ`);
    bilingual(item.question, `${id} question`);
    bilingual(item.answer, `${id} answer`);
    assert.ok(item.keywords.en.length && item.keywords.hi.length);
    sourced(item.sourceIds, `${id} FAQ`);
  }
});

test('new cause vocabulary reaches relevant offline answers in English and Hindi', () => {
  for (const [question, lang, id] of [
    ['Can illness affect my periods?', 'en', 'illness'],
    ['Can travel explain a late period?', 'en', 'travel'],
    ['Can thyroid problems change my cycle?', 'en', 'thyroid'],
    ['क्या बीमारी की वजह से माहवारी बदल सकती है?', 'hi', 'illness'],
    ['क्या यात्रा से माहवारी बदल सकती है?', 'hi', 'travel'],
    ['थायरॉइड की समस्या में क्या करूँ?', 'hi', 'thyroid'],
  ]) {
    assert.equal(answerQuestion(question, lang).id, id, question);
  }
});

test('every lesson paragraph has an indexed source list for both language versions', () => {
  for (const lesson of LESSONS) {
    assert.equal(lesson.body.en.length, lesson.body.hi.length, lesson.id);
    assert.equal(lesson.paragraphSources.length, lesson.body.en.length, lesson.id);
    lesson.paragraphSources.forEach((ids, index) => sourced(ids, `${lesson.id} paragraph ${index + 1}`));
  }
});

test('every lesson has bilingual instructional diagram data with source attribution', () => {
  assert.deepEqual(Object.keys(LESSON_DIAGRAMS).sort(), LESSONS.map(lesson => lesson.id).sort());
  for (const [id, diagram] of Object.entries(LESSON_DIAGRAMS)) {
    assert.ok(diagram.steps.length >= 3, `${id} needs an instructional sequence`);
    bilingual(diagram.caption, `${id} diagram caption`);
    sourced(diagram.sourceIds, `${id} diagram`);
    for (const step of diagram.steps) {
      assert.ok(step.icon, `${id} diagram step needs an icon identifier`);
      bilingual(step.label, `${id} step label`);
      bilingual(step.text, `${id} step description`);
    }
  }
});

test('every source URL used by guidance has English and Hindi catalogue titles', () => {
  for (const rule of RED_FLAGS) {
    for (const source of [rule.source, rule.adolescentSource, ...(rule.additionalSources || [])].filter(Boolean)) {
      const label = RED_FLAG_SOURCE_LABELS[source.url];
      assert.ok(label?.en && label?.hi, `${rule.id}: missing title for ${source.url}`);
    }
  }
});
