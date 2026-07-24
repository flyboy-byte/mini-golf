import { eq } from "drizzle-orm";
import { db, appSettingsTable } from "@workspace/db";

const SETTINGS_ID = 1;

export async function ensureAppPassword(initialPassword: string): Promise<void> {
  const [existing] = await db.select().from(appSettingsTable).where(eq(appSettingsTable.id, SETTINGS_ID));
  if (!existing) {
    await db.insert(appSettingsTable).values({ id: SETTINGS_ID, password: initialPassword });
  }
}

export async function getAppPassword(): Promise<string> {
  const [row] = await db.select().from(appSettingsTable).where(eq(appSettingsTable.id, SETTINGS_ID));
  if (!row) {
    throw new Error("App password not initialized — ensureAppPassword() must run at startup.");
  }
  return row.password;
}

export async function setAppPassword(newPassword: string): Promise<void> {
  await db
    .update(appSettingsTable)
    .set({ password: newPassword })
    .where(eq(appSettingsTable.id, SETTINGS_ID));
}
