import type { z } from "zod";

export const formatZodErrorString = (error: z.ZodError) => {
    return error.errors.map(err =>
        `${err.path.join('.')}: ${err.message} (${err.code})`
    ).join('; ');
}