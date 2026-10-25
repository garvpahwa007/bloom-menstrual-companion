import React from 'react';
import { createRoot } from 'react-dom/client';
import Routing from './config/routing.config.jsx';
import './assets/css/styles.css';
import './assets/css/tracking.css';
import './assets/css/finish.css';
import './assets/css/reference-ui.css';
import './assets/css/auth-screen.css';
import { registerPWA } from './config/pwa.config.js';

createRoot(document.getElementById('root')).render(<Routing />);
registerPWA();
