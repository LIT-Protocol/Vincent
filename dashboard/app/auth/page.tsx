// /components/login/AuthClientWrapper.tsx
'use client';

import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled
const AuthViewClient = dynamic(() => import('@/components/login/AuthViewClient'), {
  ssr: false,
  loading: () => <div>Loading authentication...</div>
});

export default function AuthClientWrapper() {
  return <AuthViewClient />;
}