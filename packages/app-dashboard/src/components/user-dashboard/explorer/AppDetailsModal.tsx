import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/app-dashboard/ui/dialog';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/app-dashboard/ui/badge';
import { Users, Calendar, Package, Code, GitBranch } from 'lucide-react';
import Loading from '@/layout/app-dashboard/Loading';
import { AppLogo } from './AppLogo';
import { vincentApiClient } from '@/components/app-dashboard/mock-forms/vincentApiClient';

interface AppDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAppId: string | null;
  onConnectToApp: (appId: string) => void;
}

export const AppDetailsModal = ({
  isOpen,
  onClose,
  selectedAppId,
  onConnectToApp,
}: AppDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'versions'>('tools');

  // Reset state when modal closes or app changes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('tools');
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedAppId) {
      setActiveTab('tools');
    }
  }, [selectedAppId]);

  // Convert appId to number for the API call
  const appIdNumber = selectedAppId ? parseInt(selectedAppId, 10) : 0;

  // Use Vincent API client to fetch app data for modal
  const {
    data: appMetadata,
    error: appError,
    isLoading: isLoadingApp,
  } = vincentApiClient.useGetAppQuery(
    { appId: appIdNumber },
    { skip: !isOpen || !selectedAppId || isNaN(appIdNumber) },
  );

  // Fetch app versions for the selected app
  const {
    data: appVersions,
    error: versionsError,
    isLoading: isLoadingVersions,
  } = vincentApiClient.useGetAppVersionsQuery(
    { appId: appIdNumber },
    { skip: !isOpen || !selectedAppId || isNaN(appIdNumber) },
  );

  // Fetch the active version details
  const {
    data: activeVersionData,
    error: activeVersionError,
    isLoading: isLoadingActiveVersion,
  } = vincentApiClient.useGetAppVersionQuery(
    { appId: appIdNumber, version: appMetadata?.activeVersion || 0 },
    { skip: !isOpen || !selectedAppId || isNaN(appIdNumber) || !appMetadata?.activeVersion },
  );

  const handleClose = () => {
    setActiveTab('tools'); // Reset tab before closing
    onClose();
  };

  if (!isOpen) return null;

  // Show loading if data is loading OR if there's a mismatch between selected app and returned data
  const isDataMismatched = appMetadata && appMetadata.appId !== appIdNumber;
  const shouldShowLoading = isLoadingApp || isDataMismatched;

  return (
    <Dialog key={selectedAppId} open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        key={selectedAppId}
        className="max-w-[65vw] sm:max-w-[65vw] md:max-w-[65vw] lg:max-w-[65vw] xl:max-w-[65vw] w-full max-h-[72vh] h-[72vh] overflow-y-auto"
      >
        {/* Dialog Header for Accessibility - Always present */}
        <DialogHeader className="sr-only">
          <DialogTitle>
            {appMetadata?.name || `App ${selectedAppId}` || 'Application Details'}
          </DialogTitle>
          <DialogDescription>
            View detailed information about this Vincent application including tools and version
            history.
          </DialogDescription>
        </DialogHeader>

        {shouldShowLoading ? (
          <div className="p-8 flex items-center justify-center h-full">
            <Loading />
          </div>
        ) : appError ? (
          <div className="p-8 h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-700 text-lg mb-6">
                The requested application could not be found or you don't have access to it.
              </p>
              <Button onClick={handleClose}>Close</Button>
            </div>
          </div>
        ) : appMetadata ? (
          <div className="p-0 bg-white">
            {/* App Header */}
            <div className="bg-white rounded-t-xl shadow-sm border-b border-gray-200 p-8">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {/* App Icon */}
                <div className="flex-shrink-0">
                  <AppLogo app={appMetadata} size="xl" />
                </div>
                {/* App Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{appMetadata.name}</h1>
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="outline" className="text-gray-600">
                          App ID: {appIdNumber}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>v{appMetadata.activeVersion}</span>
                        </div>
                        {appMetadata.updatedAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Updated {new Date(appMetadata.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {appMetadata.description && (
                    <p className="text-gray-700 leading-relaxed">{appMetadata.description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Tab Navigation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                      {[
                        {
                          id: 'tools',
                          name: 'Tools',
                          count: activeVersionData?.tools?.length || 0,
                        },
                        { id: 'versions', name: 'Versions', count: appVersions?.length || 0 },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as 'tools' | 'versions')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === tab.id
                              ? 'border-black text-black'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          } transition-colors`}
                        >
                          {tab.name}
                          {tab.count !== null && (
                            <span
                              className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                                activeTab === tab.id
                                  ? 'bg-black text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {tab.count}
                            </span>
                          )}
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Tab Content */}
                  <div className="p-6 h-[400px] overflow-y-auto">
                    {/* Tools Tab */}
                    {activeTab === 'tools' && (
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                          <Package className="w-5 h-5 mr-2 text-blue-600" />
                          Vincent Tools ({activeVersionData?.tools?.length || 0})
                        </h2>
                        {isLoadingActiveVersion ? (
                          <div className="text-center py-8 text-gray-500">
                            <Loading />
                            <p className="mt-4">Loading tools...</p>
                          </div>
                        ) : activeVersionError ? (
                          <div className="text-center py-8 text-red-600">
                            <p>Failed to load tools</p>
                          </div>
                        ) : activeVersionData?.tools && activeVersionData.tools.length > 0 ? (
                          <div className="space-y-4">
                            {activeVersionData.tools.map((tool, index) => (
                              <div
                                key={tool._id || index}
                                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Code className="w-4 h-4 text-gray-500" />
                                      <span className="font-mono text-sm font-medium text-gray-900">
                                        {tool.toolPackageName || 'Unknown Tool'}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        v{tool.toolVersion || 'Unknown'}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        Tool Package
                                      </span>
                                    </div>
                                  </div>
                                  <Badge
                                    variant="default"
                                    className="bg-emerald-100 text-emerald-800 border-emerald-200"
                                  >
                                    Ready
                                  </Badge>
                                </div>
                                {tool.hiddenSupportedPolicies &&
                                  tool.hiddenSupportedPolicies.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {tool.hiddenSupportedPolicies.map((policy, policyIndex) => (
                                        <Badge
                                          key={policyIndex}
                                          variant="secondary"
                                          className="text-xs bg-gray-100 text-gray-600"
                                        >
                                          {policy}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No tools found for this application version.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Versions Tab */}
                    {activeTab === 'versions' && (
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                          <GitBranch className="w-5 h-5 mr-2 text-purple-600" />
                          Version History ({appVersions?.length || 0})
                        </h2>
                        {isLoadingVersions ? (
                          <div className="text-center py-8 text-gray-500">
                            <Loading />
                            <p className="mt-4">Loading version history...</p>
                          </div>
                        ) : versionsError ? (
                          <div className="text-center py-8 text-red-600">
                            <p>Failed to load version history</p>
                          </div>
                        ) : appVersions && appVersions.length > 0 ? (
                          <div className="space-y-4">
                            {[...appVersions]
                              .sort((a, b) => {
                                // Active version comes first
                                if (a.version === appMetadata.activeVersion) return -1;
                                if (b.version === appMetadata.activeVersion) return 1;
                                // Then sort by creation date (newest first)
                                return (
                                  new Date(b.createdAt || 0).getTime() -
                                  new Date(a.createdAt || 0).getTime()
                                );
                              })
                              .map((version) => (
                                <div
                                  key={version._id}
                                  className={`border rounded-lg p-4 transition-colors ${
                                    version.version === appMetadata.activeVersion
                                      ? 'border-blue-300 bg-blue-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <GitBranch className="w-4 h-4 text-gray-500" />
                                        <span className="font-mono text-sm font-medium text-gray-900">
                                          v{String(version.version)}
                                        </span>
                                        {version.version === appMetadata.activeVersion && (
                                          <Badge
                                            variant="default"
                                            className="bg-blue-600 text-white text-xs"
                                          >
                                            ACTIVE
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4 text-xs text-gray-500">
                                        {version.createdAt && (
                                          <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(version.createdAt).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <Badge
                                      variant={version.enabled ? 'default' : 'secondary'}
                                      className={
                                        version.enabled
                                          ? 'bg-green-100 text-green-800 border-green-200'
                                          : 'bg-gray-100 text-gray-600 border-gray-200'
                                      }
                                    >
                                      {version.enabled ? 'Enabled' : 'Disabled'}
                                    </Badge>
                                  </div>
                                  {version.changes && (
                                    <p className="text-gray-600 text-sm bg-white p-2 rounded border">
                                      {version.changes}
                                    </p>
                                  )}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <GitBranch className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No version history available.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Contact Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
                  <div className="space-y-3 text-sm">
                    {appMetadata.contactEmail && (
                      <div>
                        <span className="text-gray-500">Support Email:</span>
                        <a
                          href={`mailto:${appMetadata.contactEmail}`}
                          className="ml-2 text-blue-600 hover:text-blue-800 truncate block"
                          title={appMetadata.contactEmail}
                        >
                          {appMetadata.contactEmail}
                        </a>
                      </div>
                    )}
                    {appMetadata.appUserUrl && (
                      <div>
                        <span className="text-gray-500">Website:</span>
                        <a
                          href={appMetadata.appUserUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:text-blue-800 truncate block"
                          title={appMetadata.appUserUrl}
                        >
                          {appMetadata.appUserUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="border-t border-gray-200 bg-white p-6 rounded-b-xl">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => onConnectToApp(selectedAppId!)}
                  className="bg-black hover:bg-gray-800 text-white px-8"
                >
                  Connect with Vincent
                </Button>
                <Button variant="outline" onClick={handleClose} className="px-8">
                  Return to Explorer
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
