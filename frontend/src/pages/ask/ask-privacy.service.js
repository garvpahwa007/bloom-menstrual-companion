const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const LONG_NUMBER = /(?<!\d)(?:\+?\d[\s().-]*){10,15}(?!\d)/;
const EXPLICIT_IDENTIFIER = /\b(?:my|our)\s+(?:full\s+)?(?:name|address|phone|mobile|email|aadhaar|aadhar|id)\s+(?:is|:)|\b(?:i live at|my address|my name)\b|मेरा नाम|मेरा पता|मेरा फोन|मेरा मोबाइल|मेरा आधार|मेरा ईमेल/i;

/** A conservative check for obvious identifiers, not a general-purpose PII detector. */
export function containsDirectIdentifier(value) {
  const text = String(value || '');
  return EMAIL.test(text) || LONG_NUMBER.test(text) || EXPLICIT_IDENTIFIER.test(text);
}
