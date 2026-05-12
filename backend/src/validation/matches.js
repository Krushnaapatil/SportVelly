import { z } from 'zod';

export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
};

const positiveIntegerSchema = z.coerce.number().int().positive();
const nonNegativeIntegerSchema = z.coerce.number().int().nonnegative();

const isoDateStringSchema = z.string().refine(
  (value) => {
    const timestamp = Date.parse(value);

    return !Number.isNaN(timestamp) && new Date(timestamp).toISOString() === value;
  },
  { message: 'Must be a valid ISO date string' },
);

export const listMatchesQuerySchema = z.object({
  limit: positiveIntegerSchema.max(100).optional(),
});

export const matchIdParamSchema = z.object({
  id: positiveIntegerSchema,
});

export const createMatchSchema = z
  .object({
    sport: z.string().min(1),
    homeTeam: z.string().min(1),
    awayTeam: z.string().min(1),
    startTime: isoDateStringSchema,
    endTime: isoDateStringSchema,
    homeScore: nonNegativeIntegerSchema.optional(),
    awayScore: nonNegativeIntegerSchema.optional(),
  })
  .superRefine((match, ctx) => {
    if (Date.parse(match.endTime) <= Date.parse(match.startTime)) {
      ctx.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: 'endTime must be chronologically after startTime',
      });
    }
  });

export const updateScoreSchema = z.object({
  homeScore: nonNegativeIntegerSchema,
  awayScore: nonNegativeIntegerSchema,
});
