import knex, { Knex } from "knex";

const dbConfig: Knex.Config = {
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "lendsqr_wallet",
  },
  pool: { min: 2, max: 10 },
  migrations: {
    tableName: "knex_migrations",
    directory: "./src/migrations",
  },
  seeds: {
    directory: "./src/seeds",
  },
};

const db = knex(dbConfig);

export default db;
