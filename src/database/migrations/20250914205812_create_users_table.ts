import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("(UUID())"));
    table.string("first_name").notNullable();
    table.string("last_name").notNullable();
    table.string("email").unique().notNullable();
    table.string("phone").unique().notNullable();
    table.string("password").notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("users");
}
