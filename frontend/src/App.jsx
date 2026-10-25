import React from 'react';
import { DiaryProvider } from './context/diary.context.jsx';
import HomeLayout from './pages/layout/home-layout.page.jsx';
export default function App() {
  return <DiaryProvider><HomeLayout /></DiaryProvider>;
}
