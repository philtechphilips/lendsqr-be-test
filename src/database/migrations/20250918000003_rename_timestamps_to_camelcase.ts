import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // For users table
  const usersHasCreatedAt = await knex.schema.hasColumn("users", "created_at");
  const usersHasUpdatedAt = await knex.schema.hasColumn("users", "updated_at");

  if (usersHasCreatedAt || usersHasUpdatedAt) {
    await knex.schema.alterTable("users", (table) => {
      if (usersHasCreatedAt) table.dropColumn("created_at");
      if (usersHasUpdatedAt) table.dropColumn("updated_at");
    });

    await knex.schema.alterTable("users", (table) => {
      table.timestamp("createdAt").defaultTo(knex.fn.now());
      table.timestamp("updatedAt").defaultTo(knex.fn.now());
    });
  }

  // For wallets table
  const walletsHasCreatedAt = await knex.schema.hasColumn(
    "wallets",
    "created_at",
  );
  const walletsHasUpdatedAt = await knex.schema.hasColumn(
    "wallets",
    "updated_at",
  );

  if (walletsHasCreatedAt || walletsHasUpdatedAt) {
    await knex.schema.alterTable("wallets", (table) => {
      if (walletsHasCreatedAt) table.dropColumn("created_at");
      if (walletsHasUpdatedAt) table.dropColumn("updated_at");
    });

    await knex.schema.alterTable("wallets", (table) => {
      table.timestamp("createdAt").defaultTo(knex.fn.now());
      table.timestamp("updatedAt").defaultTo(knex.fn.now());
    });
  }

  // For transactions table
  const transactionsHasCreatedAt = await knex.schema.hasColumn(
    "transactions",
    "created_at",
  );
  const transactionsHasUpdatedAt = await knex.schema.hasColumn(
    "transactions",
    "updated_at",
  );

  if (transactionsHasCreatedAt || transactionsHasUpdatedAt) {
    await knex.schema.alterTable("transactions", (table) => {
      if (transactionsHasCreatedAt) table.dropColumn("created_at");
      if (transactionsHasUpdatedAt) table.dropColumn("updated_at");
    });

    await knex.schema.alterTable("transactions", (table) => {
      table.timestamp("createdAt").defaultTo(knex.fn.now());
      table.timestamp("updatedAt").defaultTo(knex.fn.now());
    });
  }
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
