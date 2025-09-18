import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("transactions", (table) => {
    table
      .uuid("receiverId")
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table
      .uuid("senderId")
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("transactions", (table) => {
    table.dropColumn("receiverId");
    table.dropColumn("senderId");
  });
}
