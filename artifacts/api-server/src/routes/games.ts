import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, gamesTable, playersTable, scoresTable } from "@workspace/db";
import {
  CreateGameBody,
  GetGameParams,
  DeleteGameParams,
  CompleteGameParams,
  AddPlayerParams,
  AddPlayerBody,
  RemovePlayerParams,
  UpsertScoreParams,
  UpsertScoreBody,
  GetLeaderboardParams,
} from "@workspace/api-zod";

const gameResponse = (game: typeof gamesTable.$inferSelect) => ({
  id: game.id,
  name: game.name,
  holes: game.holes,
  par: game.par,
  createdAt: game.createdAt.toISOString(),
  completedAt: game.completedAt ? game.completedAt.toISOString() : null,
});

const router: IRouter = Router();

// List all games
router.get("/games", async (_req, res): Promise<void> => {
  const games = await db.select().from(gamesTable).orderBy(gamesTable.createdAt);
  res.json(games.map(gameResponse));
});

// Create a game
router.post("/games", async (req, res): Promise<void> => {
  const parsed = CreateGameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [game] = await db.insert(gamesTable).values(parsed.data).returning();
  res.status(201).json(gameResponse(game));
});

// Get a game with players and scores
router.get("/games/:gameId", async (req, res): Promise<void> => {
  const params = GetGameParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, params.data.gameId));
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  const players = await db.select().from(playersTable).where(eq(playersTable.gameId, game.id));
  const scores = await db.select().from(scoresTable).where(eq(scoresTable.gameId, game.id));

  res.json({
    ...gameResponse(game),
    players: players.map((p) => ({ id: p.id, gameId: p.gameId, name: p.name })),
    scores: scores.map((s) => ({ id: s.id, gameId: s.gameId, playerId: s.playerId, hole: s.hole, strokes: s.strokes })),
  });
});

// Delete a game
router.delete("/games/:gameId", async (req, res): Promise<void> => {
  const params = DeleteGameParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(gamesTable).where(eq(gamesTable.id, params.data.gameId));
  res.sendStatus(204);
});

// Complete a game
router.post("/games/:gameId/complete", async (req, res): Promise<void> => {
  const params = CompleteGameParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [game] = await db
    .update(gamesTable)
    .set({ completedAt: new Date() })
    .where(eq(gamesTable.id, params.data.gameId))
    .returning();
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  res.json(gameResponse(game));
});

// Add a player
router.post("/games/:gameId/players", async (req, res): Promise<void> => {
  const params = AddPlayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = AddPlayerBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [player] = await db
    .insert(playersTable)
    .values({ gameId: params.data.gameId, name: body.data.name })
    .returning();
  res.status(201).json({ id: player.id, gameId: player.gameId, name: player.name });
});

// Remove a player
router.delete("/games/:gameId/players/:playerId", async (req, res): Promise<void> => {
  const params = RemovePlayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(playersTable).where(
    and(eq(playersTable.id, params.data.playerId), eq(playersTable.gameId, params.data.gameId))
  );
  res.sendStatus(204);
});

// Upsert a score
router.put("/games/:gameId/scores", async (req, res): Promise<void> => {
  const params = UpsertScoreParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpsertScoreBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [score] = await db
    .insert(scoresTable)
    .values({ gameId: params.data.gameId, playerId: body.data.playerId, hole: body.data.hole, strokes: body.data.strokes })
    .onConflictDoUpdate({
      target: [scoresTable.playerId, scoresTable.hole],
      set: { strokes: body.data.strokes },
    })
    .returning();
  res.json({ id: score.id, gameId: score.gameId, playerId: score.playerId, hole: score.hole, strokes: score.strokes });
});

// Get leaderboard
router.get("/games/:gameId/leaderboard", async (req, res): Promise<void> => {
  const params = GetLeaderboardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, params.data.gameId));
  const players = await db.select().from(playersTable).where(eq(playersTable.gameId, params.data.gameId));
  const scores = await db.select().from(scoresTable).where(eq(scoresTable.gameId, params.data.gameId));

  const par = game?.par ?? 3;

  const leaderboard = players.map((p) => {
    const playerScores = scores.filter((s) => s.playerId === p.id);
    const totalStrokes = playerScores.reduce((sum, s) => sum + s.strokes, 0);
    const holesCompleted = playerScores.length;
    return {
      playerId: p.id,
      playerName: p.name,
      totalStrokes,
      holesCompleted,
      vsPar: totalStrokes - holesCompleted * par,
    };
  });

  leaderboard.sort((a, b) => {
    if (a.holesCompleted === 0 && b.holesCompleted === 0) return 0;
    if (a.holesCompleted === 0) return 1;
    if (b.holesCompleted === 0) return -1;
    return a.totalStrokes - b.totalStrokes;
  });

  res.json(leaderboard);
});

export default router;
