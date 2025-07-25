import type { Request, Response, NextFunction } from 'express';

import type { RequestWithTool } from './requireTool';

import { createDebugger } from '../../../../debug';
import { ToolVersion } from '../../mongo/tool';

// Create a debug instance for this middleware
const debug = createDebugger('requireToolVersion');

export interface RequestWithToolAndVersion extends RequestWithTool {
  vincentToolVersion: InstanceType<typeof ToolVersion>;
}

// Type guard function that expects vincentTool to already exist
export const requireToolVersion = (versionParam = 'version') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    debug('Processing tool version request');
    const reqWithTool = req as RequestWithTool;

    // Ensure tool middleware ran first

    if (!reqWithTool.vincentTool) {
      debug('Tool middleware did not run before ToolVersion middleware');
      res.status(500).json({
        error: 'Tool middleware must run before ToolVersion middleware',
      });
      return;
    }

    const version = req.params[versionParam];
    debug('Extracted version from params', {
      versionParam,
      version,
      packageName: reqWithTool.vincentTool.packageName,
    });

    const parseToolVersion = parseInt(version);

    if (isNaN(parseToolVersion)) {
      debug('Failed to parse tool version as integer', { version });
      res.status(400).json({ message: `tool version was not numeric: ${version}` });
      return;
    }

    try {
      const toolVersion = await ToolVersion.findOne({
        packageName: reqWithTool.vincentTool.packageName,
        version: version,
      });

      if (!toolVersion) {
        debug('Tool version not found', {
          packageName: reqWithTool.vincentTool.packageName,
          version,
        });
        res.status(404).end();
        return;
      }

      debug('Tool version found, adding to request object', {
        packageName: reqWithTool.vincentTool.packageName,
        version,
        toolVersionId: toolVersion._id,
      });
      (req as RequestWithToolAndVersion).vincentToolVersion = toolVersion;
      debug('Proceeding to next middleware');
      next();
    } catch (error) {
      debug('Error fetching tool version', {
        packageName: reqWithTool.vincentTool.packageName,
        version,
        error: (error as Error).message,
      });
      res.status(500).json({
        message: `Error fetching version ${version} for tool ${reqWithTool.vincentTool.packageName}`,
        error,
      });
      return;
    }
  };
};

// Type-safe handler wrapper
export type ToolVersionHandler<T extends Request = RequestWithToolAndVersion> = (
  req: T & RequestWithToolAndVersion,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withToolVersion = <T extends Request = Request>(handler: ToolVersionHandler<T>) => {
  return (req: T, res: Response, next: NextFunction) => {
    return handler(req as T & RequestWithToolAndVersion, res, next);
  };
};
