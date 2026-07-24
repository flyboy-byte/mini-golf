import { sqliteTable, integer, unique } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { gamesTable } from "./games";
import { playersTable } from "./players";

export const scoresTable = sqliteTable("scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: integer("game_id").notNull().references(() => gamesTable.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => playersTable.id, { onDelete: "cascade" }),
  hole: integer("hole").notNull(),
  strokes: integer("strokes").notNull(),
}, (table) => [
  unique("scores_player_hole_unique").on(table.playerId, table.hole),
]);

export const insertScoreSchema = createInsertSchema(scoresTable).omit({ id: true });
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scoresTable.$inferSelect;
