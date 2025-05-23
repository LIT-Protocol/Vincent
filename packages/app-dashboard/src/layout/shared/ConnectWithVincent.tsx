import { useClearAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/shared/ui/button';

export default function ConnectWithVincent({ signout = false }: { signout?: boolean }) {
  const { clearAuthInfo } = useClearAuthInfo();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await clearAuthInfo();
    navigate('/user');
  };

  return (
    <div className="px-6 py-4 border-b border-gray-100 flex items-center w-[550px]">
      <div className="h-8 w-8 rounded-md flex items-center justify-center">
        <img src="/logo.svg" alt="Vincent logo" width={20} height={20} />
      </div>
      <div className="ml-3 text-base font-medium text-gray-700">Connect with Vincent</div>
      {signout && (
        <Button onClick={handleSignOut} variant="outline" size="sm" className="ml-auto">
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      )}
    </div>
  );
}
