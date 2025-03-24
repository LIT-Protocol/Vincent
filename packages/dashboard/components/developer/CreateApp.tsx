'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import * as z from 'zod';
import React, { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { VincentContracts } from '@/services';
import { Network } from '@/services';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { mapTypeToEnum } from '@/services/types';
import ChainManager from './example/ChainManager';

// URL normalization helpers
const normalizeURL = (url: string): string => {
  if (!url) return url;
  url = url.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  if (url.startsWith('http://')) {
    url = 'https://' + url.slice(7);
  }
  return url;
};

const normalizeGitHubURL = (url: string): string => {
  if (!url) return url;
  url = url.trim();
  if (!url.includes('github.com') && url.includes('/')) {
    url = 'https://github.com/' + url;
  }
  if (!url.includes('github.com') && !url.includes('/')) {
    url = 'https://github.com/' + url;
  }
  return normalizeURL(url);
};

// Tool schema
const toolSchema = z.object({
  toolIpfsCid: z.string().min(1, "Tool IPFS CID is required"),
  policies: z.array(z.object({
    policyIpfsCid: z.string().min(1, "Policy IPFS CID is required"),
    parameters: z.array(z.object({
      name: z.string().min(1, "Parameter name is required"),
      type: z.string().default("string")
    })).min(1, "At least one parameter is required")
  })).min(1, "At least one policy is required")
});

const formSchema = z.object({
  appName: z
    .string()
    .min(2, 'App name must be at least 2 characters')
    .max(50, 'App name cannot exceed 50 characters'),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description cannot exceed 500 characters'),

  authorizedRedirectUris: z.string(),
  
  tools: z.array(toolSchema).min(1, "At least one tool is required"),

  logo: z.string().optional(),

  githubLink: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return normalizeGitHubURL(val);
    })
    .pipe(
      z
        .string()
        .url('Please enter a valid GitHub URL')
        .refine((url) => {
          try {
            const parsed = new URL(url);
            return parsed.hostname === 'github.com';
          } catch {
            return false;
          }
        }, 'Must be a GitHub URL (e.g., github.com/username/repo)')
        .optional()
    ),

  websiteUrl: z
    .string()
    .transform(normalizeURL)
    .pipe(
      z
        .string()
        .url('Please enter a valid website URL')
        .refine((url) => {
          try {
            const parsed = new URL(url);
            return parsed.protocol === 'https:';
          } catch {
            return false;
          }
        }, 'Website URL must use HTTPS')
    )
    .optional()
    .transform((val) => val || undefined),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateAppScreenProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

export default function CreateAppScreen({ onBack, onSuccess }: CreateAppScreenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const chainId = useChainId();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appName: '',
      description: '',
      authorizedRedirectUris: '',
      tools: [
        {
          toolIpfsCid: '',
          policies: [
            {
              policyIpfsCid: '',
              parameters: [
                {
                  name: '',
                  type: 'string'
                }
              ]
            }
          ]
        }
      ]
    },
    mode: 'onBlur',
  });

  // Using a single field array for tools
  const { fields: toolFields, append: appendTool, remove: removeTool } = useFieldArray({
    control: form.control,
    name: "tools",
  });

  // Using a simplified approach to manage nested arrays
  // This avoids creating multiple field arrays upfront
  const appendPolicy = (toolIndex: number) => {
    const currentTools = form.getValues().tools;
    if (toolIndex >= 0 && toolIndex < currentTools.length) {
      const updatedTools = [...currentTools];
      updatedTools[toolIndex] = {
        ...updatedTools[toolIndex],
        policies: [
          ...updatedTools[toolIndex].policies,
          {
            policyIpfsCid: '',
            parameters: [{ name: '', type: 'string' }]
          }
        ]
      };
      form.setValue('tools', updatedTools);
    }
  };

  const removePolicy = (toolIndex: number, policyIndex: number) => {
    const currentTools = form.getValues().tools;
    if (toolIndex >= 0 && toolIndex < currentTools.length) {
      const updatedTools = [...currentTools];
      const policies = [...updatedTools[toolIndex].policies];
      policies.splice(policyIndex, 1);
      updatedTools[toolIndex] = {
        ...updatedTools[toolIndex],
        policies
      };
      form.setValue('tools', updatedTools);
    }
  };

  const appendParameter = (toolIndex: number, policyIndex: number) => {
    const currentTools = form.getValues().tools;
    if (toolIndex >= 0 && toolIndex < currentTools.length &&
        policyIndex >= 0 && policyIndex < currentTools[toolIndex].policies.length) {
      const updatedTools = [...currentTools];
      const updatedPolicies = [...updatedTools[toolIndex].policies];
      const updatedParameters = [...updatedPolicies[policyIndex].parameters];
      
      updatedParameters.push({ name: '', type: 'string' });
      updatedPolicies[policyIndex] = {
        ...updatedPolicies[policyIndex],
        parameters: updatedParameters
      };
      updatedTools[toolIndex] = {
        ...updatedTools[toolIndex],
        policies: updatedPolicies
      };
      
      form.setValue('tools', updatedTools);
    }
  };

  const removeParameter = (toolIndex: number, policyIndex: number, paramIndex: number) => {
    const currentTools = form.getValues().tools;
    if (toolIndex >= 0 && toolIndex < currentTools.length &&
        policyIndex >= 0 && policyIndex < currentTools[toolIndex].policies.length &&
        paramIndex >= 0 && paramIndex < currentTools[toolIndex].policies[policyIndex].parameters.length) {
      
      const updatedTools = [...currentTools];
      const updatedPolicies = [...updatedTools[toolIndex].policies];
      const updatedParameters = [...updatedPolicies[policyIndex].parameters];
      
      updatedParameters.splice(paramIndex, 1);
      updatedPolicies[policyIndex] = {
        ...updatedPolicies[policyIndex],
        parameters: updatedParameters
      };
      updatedTools[toolIndex] = {
        ...updatedTools[toolIndex],
        policies: updatedPolicies
      };
      
      form.setValue('tools', updatedTools);
    }
  };

  // Force a re-render when form values change
  const watchTools = useWatch({
    control: form.control,
    name: 'tools'
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    form.handleSubmit(onSubmit)(e);
  };

  async function onSubmit(values: FormValues) {
    if (!address || !chainId) {
      console.log('Missing address or chainId:', { address, chainId });
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);

      // Parse string inputs into array structures expected by the contract
      const authorizedRedirectUris = !values.authorizedRedirectUris ? [] : 
        values.authorizedRedirectUris
          .split(',')
          .map((uri) => normalizeURL(uri.trim()))
          .filter(Boolean);

      // Build arrays for contract parameters from the form values
      const toolIpfsCids = values.tools.map(tool => tool.toolIpfsCid);
      
      // Each tool has an array of policies
      const toolPolicies = values.tools.map(tool => 
        tool.policies.map(policy => policy.policyIpfsCid)
      );

      // Each policy has parameter types
      const toolPolicyParameterTypes = values.tools.map(tool => 
        tool.policies.map(policy => 
          policy.parameters.map(param => mapTypeToEnum(param.type))
        )
      );

      // Each policy has parameter names
      const toolPolicyParameterNames = values.tools.map(tool => 
        tool.policies.map(policy => 
          policy.parameters.map(param => param.name)
        )
      );

      console.log("Submitting to contract:");
      console.log("Tools:", toolIpfsCids);
      console.log("Policies:", toolPolicies);
      console.log("Parameter Types:", toolPolicyParameterTypes);
      console.log("Parameter Names:", toolPolicyParameterNames);

      const contracts = new VincentContracts('datil' as Network);
      const receipt = await contracts.registerApp(
        values.appName,
        values.description,
        authorizedRedirectUris,
        [],
        toolIpfsCids,
        toolPolicies,
        toolPolicyParameterTypes,
        toolPolicyParameterNames
      );
      console.log('receipt', receipt);
      onSuccess?.();
      window.location.reload();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'Failed to create app');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-4">
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        <h1 className="text-3xl font-bold text-black">Create New App</h1>
        <ChainManager />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-black">Register New Vincent App</CardTitle>
          <CardDescription className="text-black">
            Submit your application to the Vincent registry
            <div className="mt-2 text-sm text-black">
              App Manager Address: <code className="text-black">{address}</code>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleFormSubmit} className="space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="appName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black">Application Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Vincent App" {...field} className="text-black" />
                        </FormControl>
                        <FormMessage className="text-black" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black">Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your application..."
                            rows={6}
                            {...field}
                            className="text-black"
                          />
                        </FormControl>
                        <FormMessage className="text-black" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="authorizedRedirectUris"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black">Authorized Redirect URIs</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/callback, https://app.example.com/callback"
                            {...field}
                            className="text-black"
                          />
                        </FormControl>
                        <FormMessage className="text-black" />
                      </FormItem>
                    )}
                  />

                  <div className="border p-4 rounded-md space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-black">Tools</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendTool({ 
                          toolIpfsCid: '',
                          policies: [{ policyIpfsCid: '', parameters: [{ name: '', type: 'string' }] }]
                        })}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Tool
                      </Button>
                    </div>

                    {toolFields.map((toolField, toolIndex) => {
                      const tool = watchTools?.[toolIndex];
                      const policies = tool?.policies || [];
                      
                      return (
                        <div key={toolField.id} className="border p-4 rounded-md space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-black">Tool {toolIndex + 1}</h4>
                            {toolIndex > 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTool(toolIndex)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          
                          <FormField
                            control={form.control}
                            name={`tools.${toolIndex}.toolIpfsCid`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-black">Tool IPFS CID</FormLabel>
                                <FormControl>
                                  <Input placeholder="QmUT4Ke8cPtJYRZiWrkoG9RZc77hmRETNQjvDYfLtrMUEY" {...field} className="text-black" />
                                </FormControl>
                                <FormMessage className="text-black" />
                              </FormItem>
                            )}
                          />

                          <div className="border-t pt-4 mt-4">
                            <div className="flex justify-between items-center mb-4">
                              <h5 className="font-medium text-black">Policies</h5>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => appendPolicy(toolIndex)}
                              >
                                <Plus className="h-4 w-4 mr-2" /> Add Policy
                              </Button>
                            </div>

                            {policies.map((policy: any, policyIndex: number) => {
                              const parameters = policy?.parameters || [];
                              
                              return (
                                <div key={`policy-${toolIndex}-${policyIndex}`} className="border p-3 rounded-md mb-4 space-y-3">
                                  <div className="flex justify-between items-center">
                                    <h6 className="font-medium text-black">Policy {policyIndex + 1}</h6>
                                    {policyIndex > 0 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removePolicy(toolIndex, policyIndex)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                  
                                  <FormField
                                    control={form.control}
                                    name={`tools.${toolIndex}.policies.${policyIndex}.policyIpfsCid`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-black">Policy IPFS CID</FormLabel>
                                        <FormControl>
                                          <Input placeholder="policy1" {...field} className="text-black" />
                                        </FormControl>
                                        <FormMessage className="text-black" />
                                      </FormItem>
                                    )}
                                  />

                                  <div className="border-t pt-3 mt-3">
                                    <div className="flex justify-between items-center mb-3">
                                      <h6 className="font-medium text-black">Parameters</h6>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => appendParameter(toolIndex, policyIndex)}
                                      >
                                        <Plus className="h-4 w-4 mr-2" /> Add Parameter
                                      </Button>
                                    </div>

                                    {parameters.map((param: any, paramIndex: number) => (
                                      <div key={`param-${toolIndex}-${policyIndex}-${paramIndex}`} className="flex items-center gap-2 mb-2">
                                        <FormField
                                          control={form.control}
                                          name={`tools.${toolIndex}.policies.${policyIndex}.parameters.${paramIndex}.name`}
                                          render={({ field }) => (
                                            <FormItem className="flex-1">
                                              <FormControl>
                                                <Input placeholder="Parameter name" {...field} className="text-black" />
                                              </FormControl>
                                              <FormMessage className="text-black" />
                                            </FormItem>
                                          )}
                                        />
                                        
                                        <FormField
                                          control={form.control}
                                          name={`tools.${toolIndex}.policies.${policyIndex}.parameters.${paramIndex}.type`}
                                          render={({ field }) => (
                                            <FormItem className="flex-1">
                                              <FormControl>
                                                <select 
                                                  {...field} 
                                                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                >
                                                  <option value="string">string</option>
                                                  <option value="string[]">string[]</option>
                                                  <option value="bool">bool</option>
                                                  <option value="bool[]">bool[]</option>
                                                  <option value="uint256">uint256</option>
                                                  <option value="uint256[]">uint256[]</option>
                                                  <option value="int256">int256</option>
                                                  <option value="int256[]">int256[]</option>
                                                  <option value="address">address</option>
                                                  <option value="address[]">address[]</option>
                                                  <option value="bytes">bytes</option>
                                                  <option value="bytes[]">bytes[]</option>
                                                </select>
                                              </FormControl>
                                              <FormMessage className="text-black" />
                                            </FormItem>
                                          )}
                                        />
                                        
                                        {paramIndex > 0 && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeParameter(toolIndex, policyIndex, paramIndex)}
                                            className="text-red-500 hover:text-red-700"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  type="submit"
                  className="w-full"
                  variant="secondary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
