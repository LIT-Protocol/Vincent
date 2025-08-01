import { useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { Button } from '@/components/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select';

interface ConnectPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  appId: number;
  redirectUris: string[];
}

export function ConnectPageModal({
  isOpen,
  onClose,
  appId,
  redirectUris = [],
}: ConnectPageModalProps) {
  const [selectedRedirectUri, setSelectedRedirectUri] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Generate the connect page URL
  const generateConnectUrl = (redirectUri: string): string => {
    return `http://dashboard.heyvincent.ai/user/appId/${appId}/connect?redirectUri=${encodeURIComponent(redirectUri)}`;
  };

  const connectUrl = selectedRedirectUri ? generateConnectUrl(selectedRedirectUri) : '';

  const handleCopy = async () => {
    if (!connectUrl) return;

    try {
      await navigator.clipboard.writeText(connectUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err); // No need to show this to the user, not a big deal
    }
  };

  const handleOpenDirectly = () => {
    if (!connectUrl) return;
    window.open(connectUrl, '_blank');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setSelectedRedirectUri('');
      setCopied(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle>View Connect Page</DialogTitle>
          <DialogDescription>
            Generate a link to the Vincent Connect Page for your app. Users will be redirected to
            your selected URI after granting permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="redirectUri" className="block text-sm font-medium text-gray-700 mb-2">
              Select Redirect URI
            </label>
            {redirectUris.length > 0 ? (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Select value={selectedRedirectUri} onValueChange={setSelectedRedirectUri}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a redirect URI..." />
                    </SelectTrigger>
                    <SelectContent>
                      {redirectUris.map((uri) => (
                        <SelectItem key={uri} value={uri}>
                          {uri}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {connectUrl && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCopy}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      {copied ? 'Copied!' : 'Copy Link'}
                    </Button>
                    <Button
                      onClick={handleOpenDirectly}
                      className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Page
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                No redirect URIs configured. Please add redirect URIs to your app settings first.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">{/* Empty footer for spacing */}</div>
      </DialogContent>
    </Dialog>
  );
}
