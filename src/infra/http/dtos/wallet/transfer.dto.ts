import { z } from 'zod';

export const transferSchema = z.object({
  targetWalletId: z.string().uuid('Invalid target wallet ID format'),
  amountCents: z.number().int().positive('Amount must be a positive integer in cents'),
});

export type TransferDto = z.infer<typeof transferSchema>;
