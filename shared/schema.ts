import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const RESOURCE_TYPES = [
  "shelter",
  "supplies",
  "transportation",
  "medical",
  "food",
  "water",
  "other",
] as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  types: text("types").array().notNull(),  // Changed from type to types array
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  capacity: integer("capacity"),
  email: text("email"),
  phone: text("phone"),
  imageUrls: text("image_urls").array(),  // Changed from imageUrl to imageUrls array
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// New table for watchlist
export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  resourceId: integer("resource_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertResourceSchema = createInsertSchema(resources)
  .pick({
    types: true,
    title: true,
    description: true,
    location: true,
    latitude: true,
    longitude: true,
    capacity: true,
    email: true,
    phone: true,
    imageUrls: true,
  })
  .extend({
    types: z.array(z.enum(RESOURCE_TYPES)).min(1, "At least one resource type is required"),
    latitude: z.string().nullable(),
    longitude: z.string().nullable(),
    capacity: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
      z.number().nullable()
    ),
    email: z.string().email().nullable(),
    phone: z.string().nullable(),
    imageUrls: z.array(z.string()).nullable(),
  });

export const insertWatchlistSchema = createInsertSchema(watchlist).pick({
  resourceId: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Watchlist = typeof watchlist.$inferSelect;
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;