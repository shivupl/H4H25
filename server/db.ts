import dotenv from "dotenv";
dotenv.config(); 

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Check if DATABASE_URL is set, and log a warning if it's missing
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Check your .env file.");
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create a PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Ensure SSL mode is enabled
});

// Create the Drizzle ORM instance
export const db = drizzle({ client: pool, schema });

