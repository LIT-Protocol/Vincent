"use client"

import { useState } from 'react';
import { Copy, Link } from 'lucide-react';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { AppView } from '@/services/types/appView';

interface AppUrlGeneratorProps {
  app: AppView;
}

export function AppUrlGenerator({ app }: AppUrlGeneratorProps) {
  const [selectedRedirectUri, setSelectedRedirectUri] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const consentUrl = `https://dashboard.heyvincent.ai/appId/${app.appId}/consent?redirectUri=${encodeURIComponent(selectedRedirectUri)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(consentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="text-black">
          <Link className="h-4 w-4 mr-2 font-bold text-black" />
          Generate App URL
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Generate Application URL</DialogTitle>
          <DialogDescription>
            Create a consent URL for your application with an authorized redirect URI.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 items-center gap-2">
            <label htmlFor="redirectUri" className="text-left text-black font-medium">
              Redirect URI
            </label>
            <div>
              <Select onValueChange={setSelectedRedirectUri} value={selectedRedirectUri}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a redirect URI" />
                </SelectTrigger>
                <SelectContent>
                  {app.authorizedRedirectUris && app.authorizedRedirectUris.length > 0 ? (
                    app.authorizedRedirectUris.map((uri, index) => (
                      <SelectItem key={index} value={uri}>
                        {uri}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No redirect URIs configured
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectedRedirectUri && (
            <div className="flex justify-center mt-2">
              <Button 
                variant="outline"
                onClick={copyToClipboard}
                className="text-black"
              >
                {copied ? "URL Copied!" : "Copy Application URL"}
                <Copy className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 