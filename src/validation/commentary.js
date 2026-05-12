import { z } from 'zod';

const positiveIntegerSchema = z.coerce.number().int().positive();
const nonNegativeIntegerSchema = z.coerce.number().int().nonnegative();
const strictPositiveIntegerSchema = z.number().int().positive();
const strictNonNegativeIntegerSchema = z.number().int().nonnegative();

export const listCommentaryQuerySchema = z.object({
  limit: positiveIntegerSchema.max(100).optional(),
});

export const createCommentarySchema = z.object({
  minute: strictNonNegativeIntegerSchema,
  sequence: strictNonNegativeIntegerSchema,
  period: z.string().min(1),
  eventType: z.string().min(1),
  actor: z.string().min(1),
  team: z.string().min(1),
  message: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()),
  tags: z.array(z.string()),
});
