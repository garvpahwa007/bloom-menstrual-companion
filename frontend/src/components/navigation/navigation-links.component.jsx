import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDiary } from '../../context/diary.context.jsx';
export default function NavigationLinks({
  items,
  mobile = false
}) {
  const {
    t,
    cards
  } = useDiary();
  return items.map(({
    path,
    key,
    Icon,
    mobileKey
  }) => <NavLink key={path} to={path} end={path === '/'} className={({
    isActive
  }) => `nav-item ${mobile ? 'mobile-nav-item' : ''} ${isActive ? 'active' : ''}`}><Icon size={20} aria-hidden="true" /><span>{t(`nav.${mobile && mobileKey ? mobileKey : key}`)}</span>{key === 'doctor' && cards.length > 0 && <span className="nav-count">{cards.length}</span>}</NavLink>);
}
