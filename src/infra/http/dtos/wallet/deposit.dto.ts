import { z } from 'zod';

export const depositSchema = z.object({
  amountCents: z.number().int().positive('Amount must be a positive integer in cents'),
});

export type DepositDto = z.infer<typeof depositSchema>;
