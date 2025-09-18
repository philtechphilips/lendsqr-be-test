import type { Knex } from "knex";
import path from "path";
import "dotenv/config";

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "lendsqr_be_test",
    },
    migrations: {
      tableName: "knex_migrations",
      directory: path.resolve(__dirname, "../database/migrations"),
      extension: "ts",
    },
  },

  production: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false }, // often required
    },
    migrations: {
      tableName: "knex_migrations",
      directory: path.resolve(__dirname, "../database/migrations"),
      extension: "js",
    },
  },  
};

export default config;
