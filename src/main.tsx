// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initTelemetry } from './telemetry';
import './index.css';

initTelemetry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);