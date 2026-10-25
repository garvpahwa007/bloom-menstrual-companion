import React from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, Languages, LockKeyhole, Menu, MessageCircle, NotebookPen, ShieldCheck } from 'lucide-react';
import { useDiary } from '../../context/diary.context.jsx';
import NavigationLinks from '../navigation/navigation-links.component.jsx';
export default function Header() {
  const {
    state,
    t,
    lang,
    menuOpen,
    setMenuOpen,
    updateState,
    navigate,
    removeAll,
    vault,
    lock
  } = useDiary();
  const renderNav = (items, mobile = false) => <NavigationLinks items={items} mobile={mobile} />;
  return <header className="topbar"><div className="topbar-left"><button className="icon-button menu-button" aria-label={t('nav.menu')} aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen(!menuOpen)}><Menu size={22} /></button><NavLink className="topbar-brand" to="/"><span className="brand-mark">{state.settings.discreet ? <NotebookPen size={25} /> : <img className="bloom-brand-mark" src="/bloom-mark.png" alt="" />}</span><strong>{t(state.settings.discreet ? 'app.diary' : 'app.name')}</strong></NavLink><span className="header-caption">{t('header.companion')}</span></div><div className="header-actions">{state.demo && <button type="button" className="demo-data-pill" aria-label={t('demo.clear')} title={t('demo.clear')} onClick={removeAll}>{t('header.demoData')}</button>}<span className="private-badge"><ShieldCheck size={16} />{t('common.private')}</span><button className="language-button" aria-label={t(lang === 'en' ? 'common.hindi' : lang === 'hi' ? 'common.tamil' : 'common.english')} onClick={() => updateState(s => ({
        ...s,
        settings: {
          ...s.settings,
          language: lang === 'en' ? 'hi' : lang === 'hi' ? 'ta' : 'en'
        }
      }))}><Languages size={17} /><span className="language-label">{t(lang === 'en' ? 'common.hindi' : lang === 'hi' ? 'common.tamil' : 'common.english')}</span></button>{vault && <button className="icon-button lock-shortcut" aria-label={t('header.lock')} onClick={lock}><LockKeyhole size={20} /></button>}<button className="icon-button notification-button" aria-label={t('header.notifications')} onClick={() => navigate('/reminders')}><Bell size={20} /></button><button className="icon-button ask-shortcut" aria-label={t('nav.ask')} onClick={() => navigate('/ask')}><MessageCircle size={20} /></button></div></header>;
}
