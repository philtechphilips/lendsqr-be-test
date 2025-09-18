import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("transactions", (table) => {
    table.dropUnique(["reference"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("transactions", (table) => {
    table.unique(["reference"]);
  });
}
