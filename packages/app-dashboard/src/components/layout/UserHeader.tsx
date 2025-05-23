import { BanknoteArrowDown, LogOut, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useClearAuthInfo } from '@/components/consent/hooks/useAuthInfo';
import { useState } from 'react';
import BackButton from '@/components/ui/BackButton';

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
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await clearAuthInfo();
    navigate('/user');
  };

  const isRootPath = location.pathname === '/';

  return (
    <div className="border-b mb-6">
      <div className="flex justify-between items-center p-3 md:p-6">
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <a href="/user" className="flex items-center">
            <img src="/vincent-logo.png" alt="Vincent" className="h-8 md:h-10 w-auto" />
          </a>

          {title && <h1 className="text-lg md:text-2xl font-bold ml-2 md:ml-4">{title}</h1>}
        </div>

        {showButtons && (
          <>
            {/* Desktop buttons */}
            <div className="hidden md:flex items-center gap-3">
              {backButton && (
                <div className="mr-2">
                  <BackButton label={backButton.label} onClick={() => navigate(backButton.to)} />
                </div>
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

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Mobile menu */}
      {showButtons && menuOpen && (
        <div className="md:hidden p-3 pb-4 flex flex-col gap-2 border-t border-gray-100">
          {backButton && (
            <div className="mb-2">
              <BackButton
                label={backButton.label}
                onClick={() => {
                  navigate(backButton.to);
                  setMenuOpen(false);
                }}
              />
            </div>
          )}

          {!isRootPath && (
            <Button
              onClick={() => {
                navigate('/user/withdraw');
                setMenuOpen(false);
              }}
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <BanknoteArrowDown className="mr-2 h-4 w-4" /> Withdraw
            </Button>
          )}

          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      )}
    </div>
  );
}
