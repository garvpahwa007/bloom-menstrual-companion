import { Activity, Bell, BookOpen, CalendarDays, Heart, Home, MessageCircle, NotebookPen, ShieldCheck } from 'lucide-react';
export const primaryNav = [{
  path: '/',
  key: 'today',
  Icon: Home
}, {
  path: '/log',
  key: 'log',
  Icon: NotebookPen
}, {
  path: '/calendar',
  key: 'calendar',
  Icon: CalendarDays
}, {
  path: '/insights',
  key: 'insights',
  Icon: Activity
}];
export const supportNav = [{
  path: '/guidance',
  key: 'doctor',
  Icon: Heart
}, {
  path: '/learn',
  key: 'learn',
  Icon: BookOpen
}, {
  path: '/ask',
  key: 'ask',
  Icon: MessageCircle
}, {
  path: '/reminders',
  key: 'reminders',
  Icon: Bell
}, {
  path: '/privacy',
  key: 'privacyData',
  Icon: ShieldCheck
}];
