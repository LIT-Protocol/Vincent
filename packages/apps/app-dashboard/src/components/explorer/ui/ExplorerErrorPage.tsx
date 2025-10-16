import { AlertTriangle } from 'lucide-react';
import { ExplorerNav } from './ExplorerNav';
import { useNavigate } from 'react-router-dom';
import { fonts } from '@/components/user-dashboard/connect/ui/theme';

interface ExplorerErrorPageProps {
  title: string;
  message: string;
}

export const ExplorerErrorPage = ({ title, message }: ExplorerErrorPageProps) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="w-full relative">
      <ExplorerNav onNavigate={handleNavigate} />
      <div
        className="flex items-center justify-center px-4 sm:px-6 lg:px-8"
        style={{ minHeight: 'calc(100vh - 200px)', paddingTop: '5rem' }}
      >
        <div className="flex flex-col items-center justify-center text-center max-w-md">
          <div className="mb-6">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
          </div>

          <h2
            className="text-2xl font-semibold text-gray-900 dark:text-white mb-3"
            style={fonts.heading}
          >
            {title}
          </h2>

          <p className="text-gray-600 dark:text-gray-400" style={fonts.body}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};
