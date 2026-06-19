import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';
import './index.css';
import App from './App.tsx';
import PageLoader from './components/PageLoader.tsx';

// ─── Query Client Instantiation with Caching Defaults ──────────
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PageLoader />
      <App />
    </QueryClientProvider>
  </StrictMode>
);

// Web-vitals tracking
onCLS(console.log);
onFCP(console.log);
onLCP(console.log);
onTTFB(console.log);
onINP(console.log);
