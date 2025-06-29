import { Request, Response, NextFunction } from 'express';
import { Tool } from '../../mongo/tool';
import { RequestWithVincentUser } from '../requireVincentAuth';
import { createDebugger } from '../../../../debug';

// Create a debug instance for this middleware
const debug = createDebugger('requireTool');

// Create a specific interface for requests with tool
export interface RequestWithTool extends Request {
  vincentTool: InstanceType<typeof Tool>;
}

// Combined interface for requests with both tool and vincent user
export interface RequestWithToolAndVincentUser extends RequestWithTool, RequestWithVincentUser {}

// Type guard function
export const requireTool = (paramName = 'packageName') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    debug('Processing tool request');
    const packageName = req.params[paramName];
    debug('Extracted package name from params', { paramName, packageName });

    try {
      const tool = await Tool.findOne({ packageName });

      if (!tool) {
        debug('Tool not found', { packageName });
        res.status(404).end();
        return;
      }

      debug('Tool found, adding to request object', { packageName, toolId: tool._id });
      (req as RequestWithTool).vincentTool = tool;
      debug('Proceeding to next middleware');
      next();
    } catch (error) {
      debug('Error fetching tool', { packageName, error: (error as Error).message });
      res
        .status(500)
        .json({ message: `Error fetching tool ${packageName}`, error: (error as Error).message });
      return;
    }
  };
};

// Type-safe handler wrapper
export type ToolHandler<T extends Request = RequestWithTool> = (
  req: T & RequestWithTool,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withTool = <T extends Request = Request>(handler: ToolHandler<T>) => {
  return (req: T, res: Response, next: NextFunction) => {
    return handler(req as T & RequestWithTool, res, next);
  };
};
