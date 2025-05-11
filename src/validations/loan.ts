import { z } from 'zod';
import { LoanStatusEnum } from '../constants/enums';

export const createLoanRequest = z.object({
  amount: z.number().int().positive(),
  loan_category_id: z.number().int().positive(),
  terms: z.number().int().positive(),
  interest_rate: z.number().nonnegative(),
  approved_by: z.number().int().positive().optional(),
  approved_at: z.string().datetime().optional(),
  remarks: z.string().optional(),
  collaterals: z
    .array(
      z.object({
        type: z.string().min(1).max(20),
        document_url: z.string().url().optional(),
        value_amount: z.number().int().positive(),
      })
    )
    .optional(),
});

export const updateLoanStatus = z.object({
  status: z.enum(LoanStatusEnum),
});
