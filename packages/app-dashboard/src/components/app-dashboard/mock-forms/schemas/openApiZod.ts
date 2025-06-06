import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

// extendZodWithOpenApi is a mutator; ensure that we get type safe usage in multiple files by importing it from here.
extendZodWithOpenApi(z);

export { z };
