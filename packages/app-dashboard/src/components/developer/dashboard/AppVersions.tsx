import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, Clock, Info, ChevronDown, ChevronUp, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusMessage } from '@/utils/statusMessage';
import { IAppVersionDef } from '@/api/app/types';
import listAppVersions from '@/api/app/listVersions';
import getVersion from '@/api/app/getVersion';
import editVersion from '@/api/app/editVersion';
import { useErrorPopup } from '@/providers/ErrorPopup';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface AppVersionsProps {
  appId: number;
  activeVersion?: number;
  onBack?: () => void;
}

export default function AppVersions({ appId, activeVersion, onBack }: AppVersionsProps) {
  const [versions, setVersions] = useState<IAppVersionDef[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedVersions, setExpandedVersions] = useState<{ [key: number]: boolean }>({});
  const [versionDetails, setVersionDetails] = useState<{ [key: number]: any }>({});
  const [loadingDetails, setLoadingDetails] = useState<{ [key: number]: boolean }>({});
  const [statusMessage, setStatusMessage] = useState<{
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
  } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [editedChanges, setEditedChanges] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const { showError } = useErrorPopup();

  const fetchVersions = useCallback(async () => {
    try {
      setIsLoading(true);
      const appVersions = await listAppVersions(appId);
      setVersions(appVersions);
    } catch (error) {
      console.error('Error loading app versions:', error);
      showError('Failed to load application versions', 'Error');
      setStatusMessage({
        message: 'Failed to load application versions. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [appId, showError]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const toggleVersionDetails = async (versionNumber: number) => {
    // Toggle expanded state
    setExpandedVersions((prev) => ({
      ...prev,
      [versionNumber]: !prev[versionNumber],
    }));

    // If we're expanding and don't have details yet, fetch them
    if (!expandedVersions[versionNumber] && !versionDetails[versionNumber]) {
      try {
        setLoadingDetails((prev) => ({
          ...prev,
          [versionNumber]: true,
        }));

        const details = await getVersion(appId, versionNumber);

        setVersionDetails((prev) => ({
          ...prev,
          [versionNumber]: details,
        }));
      } catch (error) {
        console.error(`Error loading details for version ${versionNumber}:`, error);
        showError(`Failed to load details for version ${versionNumber}`, 'Error');
      } finally {
        setLoadingDetails((prev) => ({
          ...prev,
          [versionNumber]: false,
        }));
      }
    }
  };

  const openEditDialog = (e: React.MouseEvent, version: IAppVersionDef) => {
    e.stopPropagation(); // Prevent row expansion when clicking edit
    setSelectedVersion(version.versionNumber);
    setEditedChanges(version.changes);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (selectedVersion === null) return;

    try {
      setIsEditing(true);
      await editVersion(appId, selectedVersion, editedChanges);

      // Update local state
      setVersions((prevVersions) =>
        prevVersions.map((v) =>
          v.versionNumber === selectedVersion ? { ...v, changes: editedChanges } : v,
        ),
      );

      setStatusMessage({
        message: 'Version changes updated successfully',
        type: 'success',
      });

      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating version changes:', error);
      showError('Failed to update version changes', 'Error');
    } finally {
      setIsEditing(false);
    }
  };

  const formatDate = (timestamp: string) => {
    // Parse timestamp from changes string (assuming format "Application Created at 1715222222222")
    const match = timestamp.match(/at (\d+)/);
    if (match && match[1]) {
      const date = new Date(parseInt(match[1]));
      // Format to match: 5/8/2024, 7:37:02 PM
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    }
    return 'Unknown date';
  };

  const formatChangesMessage = (changes: string) => {
    // Replace Unix timestamp with readable date
    const match = changes.match(/at (\d+)/);
    if (match && match[1]) {
      const date = new Date(parseInt(match[1]));
      const formattedDate = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      return changes.replace(/at \d+/, `on ${formattedDate}`);
    }
    return changes;
  };

  return (
    <div className="space-y-8">
      {statusMessage && <StatusMessage message={statusMessage.message} type={statusMessage.type} />}

      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        <h1 className="text-3xl font-bold text-black">Application Versions</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span>Version History</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="ml-2 px-2 py-0">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View application version history. Click on a version to see more details.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-[200px]">
              <div className="space-y-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-sm text-gray-600">Loading versions...</p>
              </div>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No versions found for this application.</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <>
                      <TableRow
                        key={version.versionNumber}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleVersionDetails(version.versionNumber)}
                      >
                        <TableCell className="px-2">
                          {expandedVersions[version.versionNumber] ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            v{version.versionNumber}
                            {version.versionNumber === activeVersion && (
                              <Badge variant="outline" className="ml-2 bg-green-50">
                                Active
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{version.identity}</div>
                        </TableCell>
                        <TableCell>
                          {version.enabled ? (
                            <Badge className="bg-green-500">
                              <Check className="h-3 w-3 mr-1" />
                              Enabled
                            </Badge>
                          ) : (
                            <Badge variant="outline">Disabled</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-gray-400" />
                            <span>{formatDate(version.changes)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div
                            className="max-w-[250px] truncate"
                            title={formatChangesMessage(version.changes)}
                          >
                            {formatChangesMessage(version.changes)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => openEditDialog(e, version)}
                              className="h-8 w-8 p-0"
                            >
                              <span className="sr-only">Edit changes</span>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded details row */}
                      {expandedVersions[version.versionNumber] && (
                        <TableRow key={`details-${version.versionNumber}`} className="bg-gray-50">
                          <TableCell colSpan={6} className="p-0">
                            <div className="p-6 border-t">
                              {loadingDetails[version.versionNumber] ? (
                                <div className="flex justify-center py-4">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                                </div>
                              ) : versionDetails[version.versionNumber] ? (
                                <div className="space-y-6">
                                  <h3 className="text-xl font-medium">
                                    Tools for Version v{version.versionNumber}
                                  </h3>

                                  {versionDetails[version.versionNumber].tools &&
                                  versionDetails[version.versionNumber].tools.length > 0 ? (
                                    <div className="space-y-4">
                                      {versionDetails[version.versionNumber].tools.map(
                                        (tool: any, index: number) => (
                                          <div
                                            key={index}
                                            className="border rounded-md p-4 bg-white"
                                          >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                              <div>
                                                <h4 className="font-medium text-lg mb-3 flex items-center">
                                                  <span className="mr-2">Tool {index + 1}</span>
                                                  {tool.enabled && (
                                                    <Badge className="bg-green-500 text-xs">
                                                      <Check className="h-3 w-3 mr-1" />
                                                      Enabled
                                                    </Badge>
                                                  )}
                                                </h4>
                                                <dl className="space-y-2">
                                                  {tool.toolIpfsCid && (
                                                    <div>
                                                      <dt className="font-medium text-gray-500 text-sm">
                                                        IPFS CID:
                                                      </dt>
                                                      <dd className="font-mono text-sm truncate">
                                                        {tool.toolIpfsCid}
                                                      </dd>
                                                    </div>
                                                  )}
                                                  {tool.toolPackageName && (
                                                    <div>
                                                      <dt className="font-medium text-gray-500 text-sm">
                                                        Package:
                                                      </dt>
                                                      <dd className="text-sm truncate">
                                                        {tool.toolPackageName}
                                                      </dd>
                                                    </div>
                                                  )}
                                                  {tool.toolVersion && (
                                                    <div>
                                                      <dt className="font-medium text-gray-500 text-sm">
                                                        Version:
                                                      </dt>
                                                      <dd className="text-sm truncate">
                                                        {tool.toolVersion}
                                                      </dd>
                                                    </div>
                                                  )}
                                                  {tool.identity && (
                                                    <div>
                                                      <dt className="font-medium text-gray-500 text-sm">
                                                        Identity:
                                                      </dt>
                                                      <dd className="text-sm truncate">
                                                        {tool.identity}
                                                      </dd>
                                                    </div>
                                                  )}
                                                </dl>
                                              </div>

                                              <div>
                                                {tool.policies && tool.policies.length > 0 && (
                                                  <div>
                                                    <h5 className="font-medium text-md mb-2">
                                                      Policies ({tool.policies.length})
                                                    </h5>
                                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                                      {tool.policies.map(
                                                        (policy: any, pIndex: number) => (
                                                          <div
                                                            key={pIndex}
                                                            className="border rounded p-2 bg-gray-50"
                                                          >
                                                            <div className="text-sm font-medium">
                                                              Policy {pIndex + 1}
                                                            </div>
                                                            {policy.policyIpfsCid && (
                                                              <div className="text-xs text-gray-500 truncate">
                                                                CID: {policy.policyIpfsCid}
                                                              </div>
                                                            )}
                                                            {policy.parameters &&
                                                              policy.parameters.length > 0 && (
                                                                <div className="mt-1 pl-2 border-l-2 border-gray-200">
                                                                  <div className="text-xs font-medium text-gray-500">
                                                                    Parameters:
                                                                  </div>
                                                                  {policy.parameters.map(
                                                                    (
                                                                      param: any,
                                                                      paramIndex: number,
                                                                    ) => (
                                                                      <div
                                                                        key={paramIndex}
                                                                        className="text-xs"
                                                                      >
                                                                        {param.name}:{' '}
                                                                        <span className="font-mono">
                                                                          {param.type}
                                                                        </span>
                                                                      </div>
                                                                    ),
                                                                  )}
                                                                </div>
                                                              )}
                                                          </div>
                                                        ),
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-center text-gray-500 py-4">
                                      No tools found for this version
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-center text-gray-500">
                                  Failed to load version details
                                </p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Version Changes</DialogTitle>
            <DialogDescription>
              Update the changes field for version{' '}
              {selectedVersion !== null ? `v${selectedVersion}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="changes">Changes</Label>
              <Input
                id="changes"
                value={editedChanges}
                onChange={(e) => setEditedChanges(e.target.value)}
                placeholder="Describe the changes for this version"
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleEditSubmit} disabled={isEditing}>
              {isEditing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
