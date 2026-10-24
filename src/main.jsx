import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';
import './tracking.css';
import './finish.css';
import './reference-ui.css';
import { registerPWA } from './pwa.js';

createRoot(document.getElementById('root')).render(<BrowserRouter><App /></BrowserRouter>);
registerPWA();
