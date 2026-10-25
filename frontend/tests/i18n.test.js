import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../src/i18n/en.js';
import hi from '../src/i18n/hi.js';
import { translator } from '../src/i18n/index.js';
import { SYMPTOMS } from '../src/constants/symptom.constant.js';
import { RED_FLAGS } from '../src/constants/redflag.constant.js';
import { FAQ } from '../src/content/faq.js';
import { LESSONS } from '../src/content/lessons.js';
import { PREGNANCY_WEEKS, PREGNANCY_DANGER_SIGNS, PREGNANCY_HELP } from '../src/content/pregnancy.js';
import { SOURCES } from '../src/content/sources.js';

const placeholders = text => [...new Set([...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]))].sort();
const validSources = (sourceIds, label) => {
  assert.ok(Array.isArray(sourceIds), `${label} sourceIds must be an array`);
  for (const id of sourceIds) {
    assert.ok(SOURCES[id], `${label}: unresolved source ${id}`);
    assert.ok(SOURCES[id].name, `${label}: source ${id} needs a name`);
    assert.equal(new URL(SOURCES[id].url).protocol, 'https:');
  }
};
const bilingual = (value, label) => {
  assert.equal(typeof value?.en, 'string', `${label} needs English`);
  assert.equal(typeof value?.hi, 'string', `${label} needs Hindi`);
  assert.ok(value.en.trim().length && value.hi.trim().length, `${label} cannot be empty`);
  assert.match(value.hi, /[\u0900-\u097f]/, `${label} needs Hindi prose`);
};

test('English and Hindi dictionaries have identical, nonempty keys and matching placeholders', () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(hi).sort());
  for (const key of Object.keys(en)) {
    assert.equal(typeof en[key], 'string', `${key} English must be text`);
    assert.equal(typeof hi[key], 'string', `${key} Hindi must be text`);
    assert.ok(en[key].trim() && hi[key].trim(), `${key} cannot be blank`);
    assert.deepEqual(placeholders(en[key]), placeholders(hi[key]), `${key} interpolation differs`);
  }
});

test('every selectable symptom has English and Hindi button labels', () => {
  for (const symptom of SYMPTOMS) {
    const key = `tracking.symptom.${symptom.id}`;
    assert.ok(en[key], `${symptom.id} needs an English label`);
    assert.ok(hi[key], `${symptom.id} needs a Hindi label`);
    assert.notEqual(translator('hi')(key), key);
  }
});

test('every evaluated guidance rule has bilingual title, explanation, and a source', () => {
  for (const rule of RED_FLAGS) {
    for (const suffix of ['title', 'why']) {
      const key = `guidance.${rule.id}.${suffix}`;
      assert.ok(en[key], `${key} needs English`);
      assert.ok(hi[key], `${key} needs Hindi`);
    }
    assert.ok(rule.source?.name, `${rule.id} source needs a name`);
    assert.equal(new URL(rule.source.url).protocol, 'https:');
    for (const source of rule.additionalSources || []) assert.equal(new URL(source.url).protocol, 'https:');
  }
});

test('every FAQ has bilingual questions and answers with resolvable source references', () => {
  assert.ok(FAQ.length >= 30);
  for (const item of FAQ) {
    bilingual(item.question, `FAQ ${item.id} question`);
    bilingual(item.answer, `FAQ ${item.id} answer`);
    validSources(item.sourceIds, `FAQ ${item.id}`);
    if (item.id !== 'privacy') assert.ok(item.sourceIds.length, `${item.id} medical answer needs a source`);
  }
});

test('each lesson has complete bilingual paragraphs and resolvable medical sources', () => {
  assert.ok(LESSONS.length >= 6);
  for (const lesson of LESSONS) {
    bilingual(lesson.title, `${lesson.id} title`);
    bilingual(lesson.summary, `${lesson.id} summary`);
    assert.ok(Array.isArray(lesson.body.en) && Array.isArray(lesson.body.hi));
    assert.equal(lesson.body.en.length, lesson.body.hi.length, `${lesson.id} paragraph count differs`);
    assert.ok(lesson.body.en.length);
    for (let index = 0; index < lesson.body.en.length; index++) bilingual({ en: lesson.body.en[index], hi: lesson.body.hi[index] }, `${lesson.id} paragraph ${index}`);
    validSources(lesson.sourceIds, `lesson ${lesson.id}`);
    assert.ok(lesson.sourceIds.length);
  }
});

test('pregnancy education covers each week 1–42 and warning signs in both languages with sources', () => {
  const covered = new Set();
  for (const range of PREGNANCY_WEEKS) {
    bilingual(range.title, `pregnancy ${range.from} title`);
    bilingual(range.body, `pregnancy ${range.from} body`);
    assert.ok(range.from <= range.to);
    for (let week = range.from; week <= range.to; week++) {
      assert.equal(covered.has(week), false, `pregnancy week ${week} appears twice`);
      covered.add(week);
    }
    validSources(range.sourceIds, `pregnancy weeks ${range.from}–${range.to}`);
    assert.ok(range.sourceIds.length);
  }
  assert.deepEqual([...covered].sort((a, b) => a - b), Array.from({ length: 42 }, (_, index) => index + 1));
  for (const sign of PREGNANCY_DANGER_SIGNS) {
    bilingual(sign.text, `pregnancy warning ${sign.id}`);
    validSources(sign.sourceIds, `pregnancy warning ${sign.id}`);
    assert.ok(sign.sourceIds.length);
  }
  bilingual(PREGNANCY_HELP, 'pregnancy urgent help');
});

test('translator interpolates values in both languages and keeps unknown keys visible for debugging', () => {
  assert.equal(translator('en')('common.days', { count: 12 }), '12 days');
  assert.match(translator('hi')('common.days', { count: 12 }), /12/);
  assert.equal(translator('en')('unknown.test.key'), 'unknown.test.key');
});
