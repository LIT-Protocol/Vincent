import { Button } from '@/components/ui/button';

interface HeaderProps {
  onSignOut?: () => void;
}

export default function Header({ onSignOut }: HeaderProps) {
  return (
    <div className="w-full bg-white border-b">
      <div className="max-w-screen-xl mx-auto flex justify-between items-center px-6 py-4">
        <a href="/" className="flex items-center">
          <img src="/vincent-logo.png" alt="Vincent" width={150} height={40} />
        </a>
        <div>
          {onSignOut && (
            <Button 
              onClick={onSignOut} 
              variant="outline"
              size="sm"
            >
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
