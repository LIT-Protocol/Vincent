import { Request, Response, NextFunction } from 'express';
import { ToolVersion } from '../../mongo/tool';

import { RequestWithTool } from './requireTool';

interface RequestWithToolAndVersion extends RequestWithTool {
  vincentToolVersion: InstanceType<typeof ToolVersion>;
}

// Type guard function that expects vincentTool to already exist
export const requireToolVersion = (versionParam = 'version') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const reqWithTool = req as RequestWithTool;

    // Ensure tool middleware ran first
    if (!reqWithTool.vincentTool) {
      res.status(500).json({
        error: 'Tool middleware must run before ToolVersion middleware',
      });
      return;
    }

    const version = req.params[versionParam];

    try {
      const toolVersion = await ToolVersion.findOne({
        packageName: reqWithTool.vincentTool.packageName,
        version: version,
      });

      if (!toolVersion) {
        res.status(404).end();
        return;
      }

      (req as RequestWithToolAndVersion).vincentToolVersion = toolVersion;
      next();
    } catch (error) {
      res.status(500).json({
        message: `Error fetching version ${version} for tool ${reqWithTool.vincentTool.packageName}`,
        error,
      });
      return;
    }
  };
};

// Type-safe handler wrapper
export type ToolVersionHandler = (
  req: RequestWithToolAndVersion,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withToolVersion = (handler: ToolVersionHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return handler(req as RequestWithToolAndVersion, res, next);
  };
};
