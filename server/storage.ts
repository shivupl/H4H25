import { User, Resource, InsertUser, InsertResource, Watchlist } from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { users, resources, watchlist } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Resource operations
  getResources(): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  getUserResources(userId: number): Promise<Resource[]>;
  createResource(resource: InsertResource & { userId: number }): Promise<Resource>;
  updateResource(id: number, update: Partial<Resource>): Promise<Resource>;
  deleteResource(id: number): Promise<void>;

  // Watchlist operations
  getWatchlist(userId: number): Promise<Watchlist[]>;
  getWatchlistItem(userId: number, resourceId: number): Promise<Watchlist | undefined>;
  addToWatchlist(userId: number, resourceId: number): Promise<Watchlist>;
  removeFromWatchlist(userId: number, resourceId: number): Promise<void>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getResources(): Promise<Resource[]> {
    return db.select().from(resources);
  }

  async getUserResources(userId: number): Promise<Resource[]> {
    return db.select().from(resources).where(eq(resources.userId, userId));
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }

  async createResource(resource: InsertResource & { userId: number }): Promise<Resource> {
    const [newResource] = await db
      .insert(resources)
      .values({ ...resource, createdAt: new Date() })
      .returning();
    return newResource;
  }

  async updateResource(id: number, update: Partial<Resource>): Promise<Resource> {
    const [updated] = await db
      .update(resources)
      .set(update)
      .where(eq(resources.id, id))
      .returning();
    return updated;
  }

  async deleteResource(id: number): Promise<void> {
    await db.delete(resources).where(eq(resources.id, id));
  }

  async getWatchlist(userId: number): Promise<Watchlist[]> {
    return db.select().from(watchlist).where(eq(watchlist.userId, userId));
  }

  async getWatchlistItem(userId: number, resourceId: number): Promise<Watchlist | undefined> {
    const [item] = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, userId),
          eq(watchlist.resourceId, resourceId)
        )
      );
    return item;
  }

  async addToWatchlist(userId: number, resourceId: number): Promise<Watchlist> {
    const [item] = await db
      .insert(watchlist)
      .values({
        userId,
        resourceId,
        createdAt: new Date(),
      })
      .returning();
    return item;
  }

  async removeFromWatchlist(userId: number, resourceId: number): Promise<void> {
    await db
      .delete(watchlist)
      .where(
        and(
          eq(watchlist.userId, userId),
          eq(watchlist.resourceId, resourceId)
        )
      );
  }
}

export const storage = new DatabaseStorage();