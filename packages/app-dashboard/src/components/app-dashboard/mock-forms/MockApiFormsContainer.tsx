import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/app-dashboard/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/app-dashboard/ui/tabs';

// Import generic app forms and all resource-based forms
import {
  GetAppForm,
  EditAppForm,
  GetAppVersionsForm,
  //GetAppVersionForm,
  EditAppVersionForm,
  CreateAppVersionForm,
  CreatePolicyForm,
  GetPolicyForm,
  EditPolicyForm,
  GetPolicyVersionsForm,
  ChangePolicyOwnerForm,
  CreatePolicyVersionForm,
  GetPolicyVersionForm,
  EditPolicyVersionForm,
  CreateToolForm,
  GetToolForm,
  EditToolForm,
  GetToolVersionsForm,
  ChangeToolOwnerForm,
  CreateToolVersionForm,
  GetToolVersionForm,
  EditToolVersionForm,
  GetAllToolsForm,
  GetAllPoliciesForm,
  CreateAppForm,
  DeleteAppForm,
  GetAllAppsForm,
} from './generic';

function InnerTabbedContainer({
  forms,
}: {
  forms: Array<{ key: string; label: string; component: React.ReactNode }>;
}) {
  const [activeTab, setActiveTab] = useState(forms[0]?.key || '');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-4 lg:grid-cols-8 mb-6">
        {forms.map((form) => (
          <TabsTrigger key={form.key} value={form.key} className="text-xs px-2">
            {form.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {forms.map((form) => (
        <TabsContent key={form.key} value={form.key}>
          {form.component}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function MockApiFormsContainer() {
  const [activeTab, setActiveTab] = useState('apps');

  const appForms = [
    { key: 'create-app', label: 'Create App', component: <CreateAppForm /> },
    { key: 'get-app', label: 'Get App', component: <GetAppForm /> },
    { key: 'get-all-apps', label: 'Get All Apps', component: <GetAllAppsForm /> },
    { key: 'edit-app', label: 'Edit App', component: <EditAppForm /> },
    { key: 'delete-app', label: 'Delete App', component: <DeleteAppForm /> },
    { key: 'get-app-versions', label: 'Get App Versions', component: <GetAppVersionsForm /> },
    { key: 'create-app-version', label: 'Create App Version', component: <CreateAppVersionForm /> },
    //{ key: 'get-app-version', label: 'Get App Version', component: <GetAppVersionForm /> },
    { key: 'edit-app-version', label: 'Edit App Version', component: <EditAppVersionForm /> },
  ];

  const policyForms = [
    { key: 'create-policy', label: 'Create Policy', component: <CreatePolicyForm /> },
    { key: 'get-policy', label: 'Get Policy', component: <GetPolicyForm /> },
    { key: 'edit-policy', label: 'Edit Policy', component: <EditPolicyForm /> },
    { key: 'get-all-policies', label: 'Get All Policies', component: <GetAllPoliciesForm /> },
    {
      key: 'get-policy-versions',
      label: 'Get Policy Versions',
      component: <GetPolicyVersionsForm />,
    },
    {
      key: 'change-policy-owner',
      label: 'Change Policy Owner',
      component: <ChangePolicyOwnerForm />,
    },
    {
      key: 'create-policy-version',
      label: 'Create Policy Version',
      component: <CreatePolicyVersionForm />,
    },
    { key: 'get-policy-version', label: 'Get Policy Version', component: <GetPolicyVersionForm /> },
    {
      key: 'edit-policy-version',
      label: 'Edit Policy Version',
      component: <EditPolicyVersionForm />,
    },
  ];

  const toolForms = [
    { key: 'create-tool', label: 'Create Tool', component: <CreateToolForm /> },
    { key: 'get-tool', label: 'Get Tool', component: <GetToolForm /> },
    { key: 'edit-tool', label: 'Edit Tool', component: <EditToolForm /> },
    { key: 'get-all-tools', label: 'Get All Tools', component: <GetAllToolsForm /> },
    { key: 'get-tool-versions', label: 'Get Tool Versions', component: <GetToolVersionsForm /> },
    { key: 'change-tool-owner', label: 'Change Tool Owner', component: <ChangeToolOwnerForm /> },
    {
      key: 'create-tool-version',
      label: 'Create Tool Version',
      component: <CreateToolVersionForm />,
    },
    { key: 'get-tool-version', label: 'Get Tool Version', component: <GetToolVersionForm /> },
    { key: 'edit-tool-version', label: 'Edit Tool Version', component: <EditToolVersionForm /> },
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-orange-900">
            Vincent API Mock Forms
          </CardTitle>
          <CardDescription>
            Test all Vincent API endpoints with these interactive forms. Each form includes
            validation, async handling, and consistent UI patterns.
            <br />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="apps">App APIs ({appForms.length})</TabsTrigger>
              <TabsTrigger value="tools">Tool APIs ({toolForms.length})</TabsTrigger>
              <TabsTrigger value="policies">Policy APIs ({policyForms.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="apps" className="mt-6">
              <InnerTabbedContainer forms={appForms} />
            </TabsContent>

            <TabsContent value="tools" className="mt-6">
              <InnerTabbedContainer forms={toolForms} />
            </TabsContent>

            <TabsContent value="policies" className="mt-6">
              <InnerTabbedContainer forms={policyForms} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
