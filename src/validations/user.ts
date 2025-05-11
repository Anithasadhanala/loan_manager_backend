import { z } from 'zod';

export const createUserRequest = z.object({
  name: z.string().max(30),
  email: z.string().email().max(30),
  oauth_id: z.string(),
  oauth_provider: z.string(),
  type: z.enum(['INDIVIDUAL', 'ORGANIZATION']),
  active: z.boolean().optional(),
});

export const createUserDetailsRequest = z.object({
  bank_name: z.string().max(20),
  account_number: z.string().max(20),
  ifsc_code: z.string().max(20),
  bank_branch: z.string().max(20),
  upi: z.string().max(20),
});
