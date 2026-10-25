import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, ClipboardList, Flower2, Heart, Leaf, ShieldCheck, Sparkles, Volume2 } from 'lucide-react';
import PageHeading from '../../components/layout/page-heading.component.jsx';
import Sources from '../../components/content/sources.component.jsx';
import LessonDiagram from './lesson-diagram.component.jsx';
import { LESSONS, LESSON_DIAGRAMS } from '../../content/lessons.js';
import { lessonsForAge } from '../../content/learning-paths.js';
import { useLocalSpeech } from '../../hooks/use-local-speech.js';

const lessonIcons = [Flower2, CalendarIcon, Leaf, Heart, ShieldCheck, BookOpen, Sparkles];
function CalendarIcon(props) { return <ClipboardList {...props} />; }
export function LearnScreen({ state, t, lang }) {
  const orderedLessons = lessonsForAge(LESSONS, state?.profile.ageGroup);
  const featuredLesson = orderedLessons[0];
  const [params, setParams] = useSearchParams(); const speech = useLocalSpeech(lang);
  const lesson = LESSONS.find(item => item.id === params.get('lesson'));
  useEffect(() => { speech.stop(); }, [params.get('lesson')]);
  if (lesson) return <div className="stack lesson-detail"><button className="text-link" onClick={() => setParams({})}><ArrowLeft size={18} />{t('learn.back')}</button><article className="card prose-card"><p className="eyebrow">{t('learn.kicker')}</p><h1>{(lesson.title[lang] ?? lesson.title.en)}</h1><p className="lesson-summary">{(lesson.summary[lang] ?? lesson.summary.en)}</p><button className="button secondary" disabled={!speech.available} aria-describedby={!speech.available ? 'learn-listen-help' : undefined} onClick={() => speech.speaking ? speech.stop() : speech.speak([(lesson.title[lang] ?? lesson.title.en), ...(lesson.body[lang] ?? lesson.body.en)].join('. '))}><Volume2 size={18} />{t(speech.speaking ? 'learn.stop' : 'learn.listen')}</button>{!speech.available && <p id="learn-listen-help" className="muted text-small">{t('learn.noVoice')}</p>}<LessonDiagram diagram={LESSON_DIAGRAMS[lesson.id]} t={t} lang={lang} /><div className="prose">{(lesson.body[lang] ?? lesson.body.en).map((p, i) => <div className="lesson-paragraph" key={i}><p>{p}</p><Sources ids={lesson.paragraphSources?.[i] || lesson.sourceIds} t={t} /></div>)}</div><Sources ids={lesson.sourceIds} t={t} /><p className="muted text-small">{t('common.notice')}</p></article></div>;
  return <div className="stack"><PageHeading t={t} section="learn" /><div className="learn-feature"><div><span className="eyebrow">{t(state?.profile.ageGroup === 'adult' ? 'learn.pathAdult' : 'learn.pathUnder18')}</span><h2>{(featuredLesson.title[lang] ?? featuredLesson.title.en)}</h2><p>{(featuredLesson.summary[lang] ?? featuredLesson.summary.en)}</p><button className="button primary" onClick={() => setParams({ lesson: featuredLesson.id })}>{t('learn.read')}<ArrowRight size={18} /></button></div><div className="learn-flower" aria-hidden="true"><Flower2 size={125} strokeWidth={.7} /></div></div><div className="learn-grid">{orderedLessons.map((item, index) => { const Icon = lessonIcons[index % lessonIcons.length]; return <button key={item.id} className="card lesson-card" onClick={() => setParams({ lesson: item.id })}><span className={`lesson-icon tone-${index % 3}`}><Icon size={27} aria-hidden="true" /></span><h2>{(item.title[lang] ?? item.title.en)}</h2><p className="muted">{(item.summary[lang] ?? item.summary.en)}</p><span className="text-link">{t('learn.read')}<ArrowRight size={17} /></span></button>; })}</div></div>;
}

export default LearnScreen;
