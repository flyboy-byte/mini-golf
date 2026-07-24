import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

// Single-row table (id is always 1) holding the shared app password.
export const appSettingsTable = sqliteTable("app_settings", {
  id: integer("id").primaryKey(),
  password: text("password").notNull(),
});

export type AppSettings = typeof appSettingsTable.$inferSelect;
