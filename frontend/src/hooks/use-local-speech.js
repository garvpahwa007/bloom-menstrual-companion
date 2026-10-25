import { useEffect, useState } from 'react';

export function useLocalSpeech(lang) {
  const [voice, setVoice] = useState(null); const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const update = () => setVoice(speechSynthesis.getVoices().find(v => v.localService && v.lang.toLowerCase().startsWith(lang === 'hi' ? 'hi' : lang === 'ta' ? 'ta' : 'en')) || null);
    update(); speechSynthesis.addEventListener('voiceschanged', update);
    return () => { speechSynthesis.cancel(); speechSynthesis.removeEventListener('voiceschanged', update); };
  }, [lang]);
  const stop = () => { if ('speechSynthesis' in window) speechSynthesis.cancel(); setSpeaking(false); };
  const speak = text => { if (!voice) return; stop(); const utterance = new SpeechSynthesisUtterance(text); utterance.voice = voice; utterance.lang = voice.lang; utterance.onend = () => setSpeaking(false); utterance.onerror = () => setSpeaking(false); setSpeaking(true); speechSynthesis.speak(utterance); };
  return { supported: 'speechSynthesis' in window, available: !!voice, speaking, speak, stop };
}

export default useLocalSpeech;
