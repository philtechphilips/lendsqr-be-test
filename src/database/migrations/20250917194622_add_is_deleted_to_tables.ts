import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.boolean("isDeleted").defaultTo(false).notNullable();
  });

  await knex.schema.alterTable("wallets", (table) => {
    table.boolean("isDeleted").defaultTo(false).notNullable();
  });

  await knex.schema.alterTable("transactions", (table) => {
    table.boolean("isDeleted").defaultTo(false).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("isDeleted");
  });

  await knex.schema.alterTable("wallets", (table) => {
    table.dropColumn("isDeleted");
  });

  await knex.schema.alterTable("transactions", (table) => {
    table.dropColumn("isDeleted");
  });
}
