import { z } from 'zod';

import { insightTypeSchema } from './common';

export const insightSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: insightTypeSchema,
  title: z.string(),
  message: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});
