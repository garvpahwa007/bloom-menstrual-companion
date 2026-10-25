import test from 'node:test';
import assert from 'node:assert/strict';
import { answerQuestion } from '../src/pages/ask/ask.service.js';
import { FAQ } from '../src/content/faq.js';
import { SOURCES } from '../src/content/sources.js';

const cases = [
  { label: 'late period avoids declaring pregnancy', question: 'my period is 10 days late, am I pregnant?', id: 'late', match: /cannot confirm pregnancy/i, consult: true },
  { label: 'PCOS question does not diagnose', question: 'do I have PCOS?', id: 'pcos', match: /app cannot tell/i, consult: true },
  { label: 'hourly soaked pad gets prompt care and conditional urgent signs', question: 'I bleed through a pad every hour', id: 'heavy', match: /prompt medical advice/i, consult: true },
  { label: 'medicine question gives no tablet or dose', question: 'which tablet should I take for cramps?', id: 'crampsMedicine', match: /cannot choose a medicine or dose/i, consult: true },
  { label: 'exact supplied self-harm phrase gives immediate support', question: 'I feel like hurting myself', id: 'selfHarm', safety: 'selfHarm', match: /14416/, consult: true },
  { label: 'Hindi PCOS question gets a Hindi nondiagnostic response', question: 'क्या मुझे पीसीओएस है?', lang: 'hi', id: 'pcos', match: /ऐप यह नहीं बता सकता/, consult: true },
  { label: 'Hindi PCOD/PCOS terminology question matches Roman abbreviations', question: 'PCOD और PCOS दोनों शब्द क्यों दिखते हैं?', lang: 'hi', id: 'pcodName', match: /FOGSI की एक चिकित्सकीय एल्गोरिदम पुस्तिका/ },
  { label: '14-year-old gets adolescent-appropriate care information', question: 'I am 14 and my periods are irregular', id: 'first', match: /trusted adult|clinician/i, consult: true },
  { label: 'pregnancy possibility plus bleeding is urgent', question: 'I might be pregnant and I am bleeding', id: 'urgent', safety: 'urgent', match: /Get medical help now/, consult: true },
  { label: 'possible pregnancy plus spotting is urgent', question: 'Pregnancy might be possible and I have spotting', id: 'urgent', safety: 'urgent', match: /Get medical help now/, consult: true, urgentSources: true },
  { label: 'possible pregnancy plus severe low abdominal pain is urgent', question: 'I could be pregnant and have severe pain low in my abdomen', id: 'urgent', safety: 'urgent', match: /Get medical help now/, consult: true, urgentSources: true },
  { label: 'Hindi possible pregnancy plus bleeding is urgent', question: 'मैं गर्भवती हो सकती हूँ और हल्का खून आ रहा है', lang: 'hi', id: 'urgent', safety: 'urgent', match: /अभी चिकित्सा मदद लें/, consult: true, urgentSources: true },
  { label: 'Hindi possible pregnancy plus severe lower-belly pain is urgent', question: 'गर्भ ठहरने की संभावना है और पेट के निचले हिस्से में बहुत तेज दर्द है', lang: 'hi', id: 'urgent', safety: 'urgent', match: /अभी चिकित्सा मदद लें/, consult: true, urgentSources: true },
  { label: 'heavy bleeding plus dizziness is urgent', question: 'I have very heavy bleeding and feel dizzy', id: 'urgent', safety: 'urgent', match: /112/, consult: true },
  { label: 'heavy bleeding plus light-headedness is urgent', question: 'I am soaking a pad every hour and feel light-headed', id: 'urgent', safety: 'urgent', match: /112/, consult: true, urgentSources: true },
  { label: 'heavy bleeding plus near-fainting is urgent', question: 'My bleeding is very heavy and I nearly fainted', id: 'urgent', safety: 'urgent', match: /112/, consult: true, urgentSources: true },
  { label: 'Hindi heavy bleeding plus dizziness is urgent', question: 'बहुत ज़्यादा खून आ रहा है, पैड हर घंटे भर जाता है और सिर घूम रहा है', lang: 'hi', id: 'urgent', safety: 'urgent', match: /112/, consult: true, urgentSources: true },
  { label: 'Hindi heavy bleeding plus faintness is urgent', question: 'बहुत अधिक रक्तस्राव है और बेहोशी लग रही है', lang: 'hi', id: 'urgent', safety: 'urgent', match: /112/, consult: true, urgentSources: true },
  { label: 'sudden severe pain is urgent', question: 'I have sudden severe lower-belly pain', id: 'urgent', safety: 'urgent', match: /Get medical help now/, consult: true },
  { label: 'ovulation explanation carries pregnancy-prevention limitation', question: 'What is ovulation?', id: 'ovulation', match: /cannot be used to prevent pregnancy/i },
  { label: 'fertility question does not promise safe days', question: 'Are there safe days to prevent pregnancy?', id: 'safeDays', match: /cannot tell you a time that guarantees no pregnancy/i },
  { label: 'very low mood offers support without waiting for a pattern', question: 'I feel very low', id: 'lowMood', safety: 'support', match: /14416/, consult: true },
  { label: 'reduced baby movements get urgent maternity guidance', question: 'My baby is moving less than usual', id: 'urgent', safety: 'urgent', match: /maternity care straight away/i, consult: true },
  { label: 'severe pain unrelieved by painkillers is urgent', question: 'I have severe pain and painkillers have not helped', id: 'urgent', safety: 'urgent', match: /Get medical help now/, consult: true },
  { label: 'unknown question returns the local unknown sentinel', question: 'Explain quantum entanglement', id: 'unknown', unknown: true },
  { label: 'unknown Hindi question returns the same fallback sentinel', question: 'चाँद पर चाय बनाना', lang: 'hi', id: 'unknown', unknown: true },
];

for (const item of cases) {
  test(`Ask: ${item.label}`, () => {
    const answer = answerQuestion(item.question, item.lang || 'en');
    assert.equal(answer.id, item.id);
    if (item.match) assert.match(answer.text, item.match);
    if (item.safety) assert.equal(answer.safety, item.safety);
    if (item.consult) assert.equal(answer.consult, true);
    if (item.unknown) { assert.equal(answer.text, null); assert.deepEqual(answer.sourceIds, []); }
    if (answer.safety === 'urgent') {
      assert.match(answer.text, /112/);
      assert.match(answer.text, /108/);
    }
    if (item.urgentSources) for (const id of ['emergency', 'heavy', 'ectopic', 'pain']) assert.ok(answer.sourceIds.includes(id), `Urgent response must retain ${id} source for: ${item.question}`);
    if (answer.safety === 'selfHarm') {
      assert.match(answer.text, /112/);
      assert.match(answer.text, /14416/);
      assert.match(answer.text, /someone you trust|भरोसेमंद/);
    }
    if (answer.text && ['late', 'pcos'].includes(answer.id)) {
      assert.doesNotMatch(answer.text, /you (definitely )?have pcos|you are pregnant|you aren't pregnant|you are not pregnant/i);
    }
    if (answer.id === 'crampsMedicine') assert.doesNotMatch(answer.text, /\b\d+\s?(mg|milligrams?|tablets?)\b/i);
    for (const id of answer.sourceIds) assert.ok(SOURCES[id], `Source ${id} must resolve for question: ${item.question}`);
  });
}

test('every bilingual FAQ response has a valid source reference and an answer in both languages', () => {
  assert.ok(FAQ.length >= 30);
  for (const item of FAQ) {
    assert.ok(item.question.en && item.question.hi, `${item.id} needs both question languages`);
    assert.ok(item.answer.en && item.answer.hi, `${item.id} needs both answer languages`);
    assert.match(item.answer.hi, /[\u0900-\u097f]/, `${item.id} needs Hindi prose`);
    for (const id of item.sourceIds) assert.ok(SOURCES[id], `FAQ ${item.id} source ${id} must resolve`);
  }
});
