import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasReceiverId = await knex.schema.hasColumn(
    "transactions",
    "receiverId",
  );
  const hasSenderId = await knex.schema.hasColumn("transactions", "senderId");

  if (!hasReceiverId || !hasSenderId) {
    return knex.schema.alterTable("transactions", (table) => {
      if (!hasReceiverId) {
        table
          .uuid("receiverId")
          .nullable()
          .references("id")
          .inTable("users")
          .onDelete("SET NULL");
      }
      if (!hasSenderId) {
        table
          .uuid("senderId")
          .nullable()
          .references("id")
          .inTable("users")
          .onDelete("SET NULL");
      }
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("transactions", (table) => {
    table.dropColumn("receiverId");
    table.dropColumn("senderId");
  });
}
