import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router';
import { App } from '@/types/developer-dashboard/appTypes';

/**
 * Checks if the user's address is the same as the app's manager address.
 * If not, navigates to the developer dashboard.
 * Use this on any page that uses a mutation API call.
 * @param app - The app to check the address of.
 */
export function useAddressCheck(app: App | null) {
  const navigate = useNavigate();
  const { address } = useAccount();

  useEffect(() => {
    if (!app || !address) return;

    // Authorization check
    if (app.managerAddress.toLowerCase() !== address.toLowerCase()) {
      navigate('/developer');
    }
  }, [app, address, navigate]);
}
