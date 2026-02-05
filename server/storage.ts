import { changelogs, type Changelog, type InsertChangelog } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Changelogs
  createChangelog(changelog: InsertChangelog): Promise<Changelog>;
  getChangelog(id: number): Promise<Changelog | undefined>;
  listChangelogs(userId: string): Promise<Changelog[]>;
  deleteChangelog(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createChangelog(changelog: InsertChangelog): Promise<Changelog> {
    const [created] = await db
      .insert(changelogs)
      .values(changelog)
      .returning();
    return created;
  }

  async getChangelog(id: number): Promise<Changelog | undefined> {
    const [changelog] = await db
      .select()
      .from(changelogs)
      .where(eq(changelogs.id, id));
    return changelog;
  }

  async listChangelogs(userId: string): Promise<Changelog[]> {
    return db
      .select()
      .from(changelogs)
      .where(eq(changelogs.userId, userId))
      .orderBy(desc(changelogs.createdAt));
  }

  async deleteChangelog(id: number): Promise<void> {
    await db.delete(changelogs).where(eq(changelogs.id, id));
  }
}

export const storage = new DatabaseStorage();
