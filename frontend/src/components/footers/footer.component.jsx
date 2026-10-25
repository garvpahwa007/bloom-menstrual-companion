import React from 'react';
import { useDiary } from '../../context/diary.context.jsx';
import NavigationLinks from '../navigation/navigation-links.component.jsx';
import Lotus from '../icons/lotus.component.jsx';
export default function Footer() {
  const {
    t
  } = useDiary();
  const renderNav = (items, mobile = false) => <NavigationLinks items={items} mobile={mobile} />;
  return <footer className="app-footer"><Lotus size={18} />{t('footer.note')}</footer>;
}
