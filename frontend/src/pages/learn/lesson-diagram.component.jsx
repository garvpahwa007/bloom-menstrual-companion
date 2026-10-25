import React from 'react';
import { BookOpen, CalendarDays, ClipboardList, Droplets, Heart, Leaf, ShieldCheck, Sun } from 'lucide-react';
import Sources from '../../components/content/sources.component.jsx';

const diagramIcons = { drop: Droplets, leaf: Leaf, sun: Sun, calendar: CalendarDays, book: BookOpen, heart: Heart, clipboard: ClipboardList, shield: ShieldCheck };
export function LessonDiagram({ diagram, t, lang }) {
  if (!diagram) return null;
  return <figure className="lesson-diagram" aria-label={t('learn.diagram')}><ol className="diagram-grid">{diagram.steps.map((step, index) => { const Icon = diagramIcons[step.icon] || Leaf; return <li className="diagram-step" key={index}><span className="diagram-step-number" aria-hidden="true">{index + 1}</span><Icon size={30} aria-hidden="true" /><h2>{(step.label[lang] ?? step.label.en)}</h2><p>{(step.text[lang] ?? step.text.en)}</p></li>; })}</ol><figcaption className="diagram-caption">{(diagram.caption[lang] ?? diagram.caption.en)}</figcaption><Sources ids={diagram.sourceIds} t={t} /></figure>;
}

export default LessonDiagram;
