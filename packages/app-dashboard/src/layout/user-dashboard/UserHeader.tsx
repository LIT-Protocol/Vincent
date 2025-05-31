import { ArrowLeft, BanknoteArrowDown, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/shared/ui/button';
import { useClearAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';

interface UserHeaderProps {
  backButton?: {
    to: string;
    label: string;
  };
  title?: string;
  showButtons?: boolean;
}

export default function UserHeader({ backButton, title, showButtons = true }: UserHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearAuthInfo } = useClearAuthInfo();

  const handleSignOut = async () => {
    await clearAuthInfo();
    navigate('/user');
  };

  const isRootPath = location.pathname === '/';

  return (
    <div className="border-b mb-6">
      <div className="flex justify-between items-center p-6">
        <div className="flex items-center gap-4">
          <a href="/user" className="flex items-center">
            <img src="/vincent-logo.png" alt="Vincent" width={150} height={40} />
          </a>

          {title && <h1 className="text-2xl font-bold ml-4">{title}</h1>}
        </div>

        {showButtons && (
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
              <Button onClick={() => navigate('/user/wallet')} variant="outline" size="sm">
                <BanknoteArrowDown className="mr-2 h-4 w-4" /> Wallet
              </Button>
            )}

            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
