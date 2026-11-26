import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Query observers own freshness and focus/reconnect refresh.
export const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: true, refetchOnReconnect: true, gcTime: 5 * 60_000 } } });
export function AppProviders({ children }) {
  return <BrowserRouter><QueryClientProvider client={queryClient}>{children}</QueryClientProvider></BrowserRouter>;
}
