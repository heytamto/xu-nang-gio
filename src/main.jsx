import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App.jsx';
import { AppProviders } from './app/providers.jsx';
import './app/styles/index.css';
import { registerChunkRecovery } from './shared/utils/chunkRecovery';

registerChunkRecovery();

// Remove retired client authentication flags and legacy order cache (may contain PII).
for (const storageName of ['localStorage', 'sessionStorage']) {
  try {
    const storage = window[storageName];
    for (const key of ['xng_admin_user', 'warehouse_authenticated', 'shop_orders']) storage.removeItem(key);
  } catch { /* Storage may be blocked by browser settings. */ }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <AppProviders><App /></AppProviders>
  </React.StrictMode>
);
