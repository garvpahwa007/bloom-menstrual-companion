import React from 'react';
import { Settings } from 'lucide-react';
import { useDiary } from '../../context/diary.context.jsx';
import { primaryNav, supportNav } from '../../config/navigation.config.js';
import NavigationLinks from './navigation-links.component.jsx';
export default function MobileNavigation() {
  const {
    t
  } = useDiary();
  const renderNav = (items, mobile = false) => <NavigationLinks items={items} mobile={mobile} />;
  return <nav className="mobile-bottom" aria-label={t('nav.quick')}>{renderNav([{
      ...primaryNav[0],
      mobileKey: 'today'
    }, {
      ...primaryNav[2],
      mobileKey: 'calendar'
    }, {
      ...primaryNav[3],
      mobileKey: 'insightsShort'
    }, {
      ...supportNav[1],
      mobileKey: 'learn'
    }, {
      path: '/settings',
      key: 'settings',
      mobileKey: 'you',
      Icon: Settings
    }], true)}</nav>;
}
