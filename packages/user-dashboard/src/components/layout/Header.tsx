import { Button } from '@/components/ui/button';
import { useClearAuthInfo } from '@/components/consent/hooks/useAuthInfo';
import { LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  onSignOut?: () => void;
}

export default function Header({ onSignOut }: HeaderProps) {
  const { clearAuthInfo } = useClearAuthInfo();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDirectSignOut = async () => {
    await clearAuthInfo();
    navigate('/');
  };

  const handleSignOut = onSignOut || handleDirectSignOut;

  const isRootPath = location.pathname === '/';

  return (
    <div className="w-full bg-white border-b">
      <div className="max-w-screen-xl mx-auto flex justify-between items-center px-6 py-4">
        <a href="/" className="flex items-center">
          <img src="/vincent-logo.png" alt="Vincent" width={150} height={40} />
        </a>
        <div className="flex items-center gap-3">
          {!isRootPath && (
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
