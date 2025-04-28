import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react"
import { createPortal } from "react-dom"
import { XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

interface ErrorPopupProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  error?: Error | string
  details?: string
}

export function ErrorPopup({
  isOpen,
  onClose,
  title = "An error occurred",
  error,
  details
}: ErrorPopupProps) {
  const errorMessage = error instanceof Error ? error.message : error

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Skip body scroll lock to allow interaction with elements behind the popup
  // while still showing the error message

  if (!isOpen) return null;

  // Use createPortal to render the popup outside the main component tree
  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999] isolation-auto pointer-events-none">
      <div className="absolute inset-0 pointer-events-auto" onClick={onClose}></div>
      <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-xl p-6 m-4 w-full max-w-md max-h-[90vh] overflow-y-auto relative pointer-events-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-red-500">
            <XCircle className="h-5 w-5 mr-2" />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <Button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </Button>
        </div>

        {errorMessage && (
          <div className="py-2 mb-2">
            {errorMessage}
          </div>
        )}

        {details && (
          <div className="py-2 mb-4 text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-[200px] font-mono">
            <strong>Details:</strong><br />
            {details}
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={onClose} variant="destructive">
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Define the interface for an error item
interface ErrorItem {
  id: string;
  message: Error | string;
  title?: string;
  details?: string;
}

// Context for managing the error popup state globally
interface ErrorPopupContextType {
  showError: (error: Error | string, title?: string, details?: string) => void
  hideError: (id?: string) => void
}

const ErrorPopupContext = createContext<ErrorPopupContextType | undefined>(undefined)

export function ErrorPopupProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<ErrorItem[]>([]);

  // Generate unique ID for each error
  const generateId = () => `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Show a new error
  const showError = useCallback((error: Error | string, title?: string, details?: string) => {
    console.log("Showing error popup:", { error, title, details });

    const newError: ErrorItem = {
      id: generateId(),
      message: error,
      title,
      details
    };

    setErrors(prev => [...prev, newError]);
  }, []);

  // Hide a specific error or the first one if no ID provided
  const hideError = useCallback((id?: string) => {
    if (id) {
      setErrors(prev => prev.filter(error => error.id !== id));
    } else if (errors.length > 0) {
      setErrors(prev => prev.slice(1));
    }
  }, [errors]);

  // Current error is the first one in the array
  const currentError = errors[0];

  return (
    <ErrorPopupContext.Provider value={{ showError, hideError }}>
      {children}
      {currentError && (
        <ErrorPopup
          isOpen={true}
          onClose={() => hideError(currentError.id)}
          title={currentError.title}
          error={currentError.message}
          details={currentError.details}
        />
      )}
    </ErrorPopupContext.Provider>
  );
}

export function useErrorPopup() {
  const context = useContext(ErrorPopupContext)

  if (context === undefined) {
    throw new Error("useErrorPopup must be used within an ErrorPopupProvider")
  }

  return context
}

export default ErrorPopupProvider;
