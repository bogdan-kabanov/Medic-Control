import { Pool } from "pg";
import { loadConfig } from "./config.js";

const config = loadConfig();

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(1);
});
