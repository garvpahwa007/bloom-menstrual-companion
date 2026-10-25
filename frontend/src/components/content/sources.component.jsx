import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SOURCES } from '../../content/sources.js';
export function Sources({
  ids = [],
  t
}) {
  const hindi = t.language === 'hi';
  return <div className="sources"><span>{t('common.sources')}</span>{[...new Set(ids)].map(id => SOURCES[id] ? <a href={SOURCES[id].url} key={id} target="_blank" rel="noreferrer">{hindi ? SOURCES[id].nameHi || SOURCES[id].name : SOURCES[id].name}<ArrowRight size={13} aria-hidden="true" /></a> : null)}</div>;
}
export default Sources;
