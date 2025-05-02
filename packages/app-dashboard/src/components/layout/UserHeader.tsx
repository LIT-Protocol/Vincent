import { ArrowLeft, BanknoteArrowDown, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useClearAuthInfo } from '@/components/consent/hooks/useAuthInfo';

interface UserHeaderProps {
  backButton?: {
    to: string;
    label: string;
  };
  title?: string;
  onSignOut?: () => void;
}

export default function UserHeader({ backButton, title, onSignOut }: UserHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearAuthInfo } = useClearAuthInfo();

  const handleDirectSignOut = async () => {
    await clearAuthInfo();
    navigate('/user');
  };

  const handleSignOut = onSignOut || handleDirectSignOut;
  const isRootPath = location.pathname === '/';

  return (
    <div className="border-b mb-6">
      <div className="flex justify-between items-center p-6">
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center">
            <img src="/vincent-logo.png" alt="Vincent" width={150} height={40} />
          </a>

          {title && <h1 className="text-2xl font-bold ml-4">{title}</h1>}
        </div>

        <div className="flex items-center gap-3">
          {backButton && (
            <Button
              variant="ghost"
              onClick={() => navigate(backButton.to)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {backButton.label}
            </Button>
          )}

          {!isRootPath && (
            <Button onClick={() => navigate('/user/withdraw')} variant="outline" size="sm">
              <BanknoteArrowDown className="mr-2 h-4 w-4" /> Withdraw
            </Button>
          )}

          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
