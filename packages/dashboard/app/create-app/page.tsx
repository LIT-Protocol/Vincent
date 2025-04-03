"use client";

import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import dynamic from 'next/dynamic';
import { useIsMounted } from '@/hooks/useIsMounted';

// Use dynamic import for CreateAppScreen to prevent SSR hydration issues
const CreateAppScreen = dynamic(
  () => import('@/components/developer/CreateApp'),
  { ssr: false }
);

export default function CreateAppPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const isMounted = useIsMounted();
  
  const handleBack = () => {
    router.push('/');
  };
  
  const handleSuccess = () => {
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  };
  
  // Prevent hydration errors by ensuring we only render when mounted
  if (!isMounted) return null;
  
  // If not connected, redirect to dashboard
  if (!isConnected) {
    router.push('/');
    return null;
  }
  
  return (
    <CreateAppScreen
      onBack={handleBack}
      onSuccess={handleSuccess}
    />
  );
} 