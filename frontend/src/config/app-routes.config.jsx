import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDiary } from '../context/diary.context.jsx';
import TodayScreen from '../pages/today/today.page.jsx';
import LogScreen from '../pages/log/log.page.jsx';
import CalendarScreen from '../pages/calendar/calendar.page.jsx';
import InsightsScreen from '../pages/insights/insights.page.jsx';
import GuidanceScreen from '../pages/guidance/guidance.page.jsx';
import VisitScreen from '../pages/visit/visit.page.jsx';
import LearnScreen from '../pages/learn/learn.page.jsx';
import AskScreen from '../pages/ask/ask.page.jsx';
import RemindersScreen from '../pages/reminders/reminders.page.jsx';
import PregnancyScreen from '../pages/pregnancy/pregnancy.page.jsx';
import PrivacyDataScreen from '../pages/privacy/privacy-data.page.jsx';
import SettingsScreen from '../pages/settings/settings.page.jsx';
import CloudScreen from '../pages/cloud/cloud.page.jsx';
export default function AppRoutes() {
  const {
    state,
    analysis,
    today,
    t,
    lang,
    updateState,
    restoreFromCloud,
    registerProfile,
    navigate,
    cards,
    setToast,
    vault,
    setPIN,
    removePIN,
    lock,
    exportData,
    openEncryptedExport,
    importData,
    removeAll,
    saveLog
  } = useDiary();
  const common = {
    state,
    analysis,
    today,
    t,
    lang,
    onUpdateState: updateState,
    onNavigate: navigate
  };
  return <Routes><Route path="/" element={<TodayScreen {...common} />} /><Route path="/log" element={<LogScreen {...common} onSaveLog={saveLog} />} /><Route path="/calendar" element={<CalendarScreen {...common} />} /><Route path="/insights" element={<InsightsScreen {...common} />} /><Route path="/guidance" element={<GuidanceScreen {...common} cards={cards} />} /><Route path="/doctor" element={<Navigate to="/guidance" replace />} /><Route path="/visit" element={<VisitScreen {...common} />} /><Route path="/learn" element={<LearnScreen {...common} />} /><Route path="/ask" element={<AskScreen {...common} />} /><Route path="/reminders" element={<RemindersScreen {...common} notify={setToast} />} /><Route path="/pregnancy" element={state.profile.ageGroup === 'adult' || state.profile.pregnancyFeatureEnabled || state.profile.pregnancyEnabled ? <PregnancyScreen {...common} /> : <Navigate to="/settings" replace />} /><Route path="/privacy" element={<PrivacyDataScreen {...common} vaultEnabled={!!vault} onExport={exportData} onEncryptedExport={openEncryptedExport} onImport={importData} onDelete={removeAll} />} /><Route path="/login" element={<Navigate to="/cloud" replace />} /><Route path="/cloud" element={<CloudScreen state={state} lang={lang} onRestore={restoreFromCloud} onRegisterProfile={registerProfile} />} /><Route path="/settings" element={<SettingsScreen {...common} vaultEnabled={!!vault} onEnablePIN={setPIN} onDisablePIN={removePIN} onLock={lock} onExport={exportData} onEncryptedExport={openEncryptedExport} onImport={importData} onDelete={removeAll} />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
}
