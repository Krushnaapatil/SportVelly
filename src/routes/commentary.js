import { Router } from "express";
import { commentary } from "../db/schema.js";
import { db } from "../db/db.js";
import { matchIdParamSchema } from "../validation/matches.js";
import { createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary.js";
import { desc, eq } from "drizzle-orm";

export const commentaryRouter = Router({ mergeParams: true });

const MAX_LIMIT = 100;

commentaryRouter.get('/', async (req, res) => {
    const parsedParams = matchIdParamSchema.safeParse(req.params);

    if (!parsedParams.success) {
        return res.status(400).json({ error: 'Invalid match id.', details: parsedParams.error.issues });
    }

    const parsedQuery = listCommentaryQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
        return res.status(400).json({ error: 'Invalid query.', details: parsedQuery.error.issues });
    }

    const limit = Math.min(parsedQuery.data.limit ?? 100, MAX_LIMIT);

    try {
        const data = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, parsedParams.data.id))
            .orderBy(desc(commentary.createdAt))
            .limit(limit);

        res.json({ data });
    } catch (error) {
        console.error(error);

        res.status(500).json({ error: 'Failed to list commentary.' });
    }
});

commentaryRouter.post('/', async (req, res) => {
    const parsedParams = matchIdParamSchema.safeParse(req.params);

    if (!parsedParams.success) {
        return res.status(400).json({ error: 'Invalid match id.', details: parsedParams.error.issues });
    }

    const parsedBody = createCommentarySchema.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(400).json({ error: 'Invalid payload.', details: parsedBody.error.issues });
    }

    const { minutes, ...commentaryData } = parsedBody.data;

    try {
        const [event] = await db.insert(commentary).values({
            ...commentaryData,
            matchId: parsedParams.data.id,
            minute: minutes,
        }).returning();

        res.status(201).json({ data: event });
    } catch (error) {
        console.error(error);

        res.status(500).json({ error: 'Failed to create commentary.' });
    }
});
