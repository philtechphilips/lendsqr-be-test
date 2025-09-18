import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // For users table
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("created_at");
    table.dropColumn("updated_at");
  });

  await knex.schema.alterTable("users", (table) => {
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });

  // For wallets table
  await knex.schema.alterTable("wallets", (table) => {
    table.dropColumn("created_at");
    table.dropColumn("updated_at");
  });

  await knex.schema.alterTable("wallets", (table) => {
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });

  // For transactions table
  await knex.schema.alterTable("transactions", (table) => {
    table.dropColumn("created_at");
    table.dropColumn("updated_at");
  });

  await knex.schema.alterTable("transactions", (table) => {
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  // For users table
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("createdAt");
    table.dropColumn("updatedAt");
  });

  await knex.schema.alterTable("users", (table) => {
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // For wallets table
  await knex.schema.alterTable("wallets", (table) => {
    table.dropColumn("createdAt");
    table.dropColumn("updatedAt");
  });

  await knex.schema.alterTable("wallets", (table) => {
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // For transactions table
  await knex.schema.alterTable("transactions", (table) => {
    table.dropColumn("createdAt");
    table.dropColumn("updatedAt");
  });

  await knex.schema.alterTable("transactions", (table) => {
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}
