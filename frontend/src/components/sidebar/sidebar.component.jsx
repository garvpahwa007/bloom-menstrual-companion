import React from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowRight, Heart, NotebookPen, Settings, ShieldCheck, X } from 'lucide-react';
import { useDiary } from '../../context/diary.context.jsx';
import { primaryNav, supportNav } from '../../config/navigation.config.js';
import NavigationLinks from '../navigation/navigation-links.component.jsx';
export default function Sidebar() {
  const {
    state,
    t,
    menuOpen,
    setMenuOpen,
    navigate
  } = useDiary();
  const renderNav = (items, mobile = false) => <NavigationLinks items={items} mobile={mobile} />;
  return <aside id="primary-navigation" className={`sidebar ${menuOpen ? 'open' : ''}`}><button className="icon-button sidebar-close" aria-label={t('nav.close')} onClick={() => setMenuOpen(false)}><X size={22} aria-hidden="true" /></button><NavLink className="brand" to="/"><span className="brand-mark">{state.settings.discreet ? <NotebookPen size={31} /> : <img className="bloom-brand-mark" src="/bloom-mark.png" alt="" />}</span><strong>{t(state.settings.discreet ? 'app.diary' : 'app.name')}</strong></NavLink><p className="brand-tagline">{t('app.tagline')}</p><nav aria-label={t('nav.overview')}><span className="nav-group-label">{t('nav.overview')}</span>{renderNav(primaryNav)}<span className="nav-group-label support-label">{t('nav.support')}</span>{renderNav(supportNav)}{(state.profile.ageGroup === 'adult' || state.profile.pregnancyFeatureEnabled || state.profile.pregnancyEnabled) && renderNav([{
        path: '/pregnancy',
        key: 'pregnancy',
        Icon: Heart
      }])}</nav><div className="sidebar-bottom"><div className="privacy-card"><ShieldCheck size={25} /><h3>{t('privacy.title')}</h3><p>{t('privacy.body')}</p><button className="text-link" onClick={() => navigate('/privacy')}>{t('privacy.link')}<ArrowRight size={15} /></button></div>{renderNav([{
        path: '/settings',
        key: 'settings',
        Icon: Settings
      }])}</div></aside>;
}
