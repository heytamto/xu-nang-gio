
import './app/styles/index.css';

import React, { useLayoutEffect } from 'react';
import ReactDOM from 'react-dom/client';

import App from './app/App.jsx';
import { AppProviders } from './app/providers.jsx';
import { registerChunkRecovery } from './shared/utils/chunkRecovery';

registerChunkRecovery();

// Xóa dữ liệu xác thực và cache đơn hàng cũ.
for (const storageName of ['localStorage', 'sessionStorage']) {
  try {
    const storage = window[storageName];

    for (const key of [
      'xng_admin_user',
      'warehouse_authenticated',
      'shop_orders',
    ]) {
      storage.removeItem(key);
    }
  } catch {
    // Storage may be blocked.
  }
}

function AppBootstrap() {
  useLayoutEffect(() => {
    document.getElementById('app-bootstrap')?.remove();
  }, []);

  return (
    <AppProviders>
      <App />
    </AppProviders>
  );
}

function mountApplication() {
  const root = document.getElementById('root');

  if (!root) return;

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <AppBootstrap />
    </React.StrictMode>
  );
}

function waitForStyles() {
  const startedAt = performance.now();

  function check() {
    const cssReady = getComputedStyle(
      document.documentElement
    )
      .getPropertyValue('--xng-css-ready')
      .trim() === '1';

    if (cssReady) {
      mountApplication();
      return;
    }

    if (performance.now() - startedAt > 10000) {
      const bootstrap = document.getElementById('app-bootstrap');

      if (bootstrap) {
        bootstrap.replaceChildren();

        const message = document.createElement('span');
        message.textContent = 'Không thể tải giao diện cửa hàng.';

        const retry = document.createElement('button');
        retry.textContent = 'Tải lại trang';
        retry.style.cssText =
          'padding:12px 24px;border:0;border-radius:12px;background:#92400e;color:white;cursor:pointer';

        retry.onclick = () => window.location.reload();

        bootstrap.append(message, retry);
      }

      return;
    }

    requestAnimationFrame(check);
  }

  check();
}

waitForStyles();
