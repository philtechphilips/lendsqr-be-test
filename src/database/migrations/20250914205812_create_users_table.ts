import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("(UUID())"));
    table.string("firstName").notNullable();
    table.string("lastName").notNullable();
    table.string("email").unique().notNullable();
    table.string("phone").unique().notNullable();
    table.string("password").notNullable();
    table.date("dob").notNullable();
    table.string("bvn").unique().notNullable();

    table.string("addressLine1").nullable();
    table.string("addressLine2").nullable();
    table.string("city").nullable();
    table.string("state").nullable();
    table.string("country").nullable();
    table.string("postalCode").nullable();

    table.string("nokName").nullable();
    table.string("nokPhone").nullable();
    table.string("nokEmail").nullable();
    table.string("nokRelationship").nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("users");
}
