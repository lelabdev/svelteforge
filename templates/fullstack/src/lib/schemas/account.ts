import { z } from 'zod/v4';

export const accountSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address'),
  image: z.string().url('Invalid URL').optional(),
});
