import { Request, Response, NextFunction } from 'express';
import { Tool } from '../../mongo/tool';

// Create a specific interface for requests with tool
export interface RequestWithTool extends Request {
  vincentTool: InstanceType<typeof Tool>;
}

// Type guard function
export const requireTool = (paramName = 'packageName') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const packageName = req.params[paramName];

    try {
      const tool = await Tool.findOne({ packageName });

      if (!tool) {
        res.status(404).end();
        return;
      }

      (req as RequestWithTool).vincentTool = tool;
      next();
    } catch (error) {
      res
        .status(500)
        .json({ message: `Error fetching tool ${packageName}`, error: (error as Error).message });
      return;
    }
  };
};

// Type-safe handler wrapper
export type ToolHandler = (
  req: RequestWithTool,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withTool = (handler: ToolHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return handler(req as RequestWithTool, res, next);
  };
};
