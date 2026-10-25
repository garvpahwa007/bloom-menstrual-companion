import React from 'react';
import { useDiary } from '../../context/diary.context.jsx';
import Sidebar from '../../components/sidebar/sidebar.component.jsx';
import Header from '../../components/headers/header.component.jsx';
import Footer from '../../components/footers/footer.component.jsx';
import MobileNavigation from '../../components/navigation/mobile-navigation.component.jsx';
import GlobalFeedback from '../../components/feedback/global-feedback.component.jsx';
import ScreenBoundary from '../../components/feedback/screen-boundary.component.jsx';
import AppRoutes from '../../config/app-routes.config.jsx';
import Welcome from '../onboarding/welcome.page.jsx';
import Locked from '../privacy/locked.page.jsx';
import CloudScreen from '../cloud/cloud.page.jsx';
import { ArrowRight, Flower2 } from 'lucide-react';
export default function HomeLayout() {
  const {
    state,
    t,
    locked,
    storageError,
    lang,
    setPreLang,
    removeAll,
    unlock,
    start,
    restoreFromCloud,
    registerProfile,
    navigate,
    menuOpen,
    setMenuOpen,
    location
  } = useDiary();
  if (!state && ['/cloud', '/login'].includes(location.pathname)) return <><main className="main-content"><button className="button secondary" onClick={() => navigate('/')}>{t('cloud.back')}</button><CloudScreen state={null} lang={lang} restoreAllowed={!locked && !storageError} onRestore={restoreFromCloud} onRegisterProfile={registerProfile} /></main><GlobalFeedback /></>;
  if (storageError) return <><main className="lock-screen"><div className="card lock-card"><h1>{t('error.title')}</h1><p>{t('error.storage')}</p><button className="button primary" onClick={() => window.location.reload()}>{t('error.reload')}</button><button className="button secondary" onClick={removeAll}>{t('settings.delete')}</button></div></main><GlobalFeedback /></>;
  if (locked) return <><Locked t={t} lang={lang} setLang={setPreLang} onDelete={removeAll} onUnlock={unlock} onCloud={() => navigate('/cloud')} /><GlobalFeedback /></>;
  if (!state) return <><Welcome t={t} lang={lang} setLang={setPreLang} onStart={start} onCloud={() => navigate('/cloud')} /><GlobalFeedback /></>;
  return <div className="app-shell"><a className="skip-link" href="#main-content">{t('common.skip')}</a>{menuOpen && <button className="mobile-scrim" aria-label={t('nav.close')} onClick={() => setMenuOpen(false)} />}<Sidebar /><div className="app-content"><Header /><main id="main-content" className="main-content" tabIndex={-1}>{state.demo && <div className="demo-banner"><span><SparkleIcon />{t('demo.banner')}</span><button onClick={removeAll}>{t('demo.clear')}<ArrowRight size={14} /></button></div>}<ScreenBoundary key={location.pathname} t={t}><AppRoutes /></ScreenBoundary><Footer /></main><MobileNavigation /></div><GlobalFeedback /></div>;
}
function SparkleIcon() {
  return <Flower2 size={16} aria-hidden="true" />;
}
