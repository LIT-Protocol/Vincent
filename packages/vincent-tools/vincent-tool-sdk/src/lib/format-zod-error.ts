import type { z } from "zod";

export const formatZodError = (error: z.ZodError) => {
    return error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code
    }));
}