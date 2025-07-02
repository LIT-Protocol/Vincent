import { Tool } from '@/types/developer-dashboard/appTypes';

export const sortToolFromTools = (tools: Tool[] | undefined, packageName: string | undefined) => {
  if (!packageName || !tools) return null;
  return tools.find((tool) => tool.packageName === packageName) || null;
};
