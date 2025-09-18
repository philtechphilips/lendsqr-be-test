import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("transactions", (table) => {
    // Transaction status - critical for financial operations
    table
      .enum("status", ["PENDING", "SUCCESS", "FAILED", "CANCELLED"])
      .defaultTo("PENDING")
      .notNullable();

    // Additional metadata for financial compliance
    table.text("description").nullable(); // Human-readable description
    table.text("failureReason").nullable(); // Reason for failure if status is FAILED
    table.string("externalReference").nullable(); // External system reference (e.g., bank reference)
    table.string("channel").defaultTo("API").nullable(); // How transaction was initiated (API, WEB, MOBILE)
    table.string("ipAddress").nullable(); // IP address for audit trail
    table.string("userAgent").nullable(); // User agent for audit trail

    // Financial metadata
    table.decimal("fee", 15, 2).defaultTo(0.0).nullable(); // Transaction fee
    table.decimal("balanceBefore", 15, 2).nullable(); // Balance before transaction
    table.decimal("balanceAfter", 15, 2).nullable(); // Balance after transaction

    // Timestamps for different stages
    table.timestamp("processedAt").nullable(); // When transaction was processed
    table.timestamp("failedAt").nullable(); // When transaction failed

    // Add indexes for better performance
    table.index("status");
    table.index("processedAt");
    table.index("createdAt");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("transactions", (table) => {
    // Drop indexes first
    table.dropIndex("status");
    table.dropIndex("processedAt");
    table.dropIndex("createdAt");

    // Drop columns
    table.dropColumn("status");
    table.dropColumn("description");
    table.dropColumn("failureReason");
    table.dropColumn("externalReference");
    table.dropColumn("channel");
    table.dropColumn("ipAddress");
    table.dropColumn("userAgent");
    table.dropColumn("fee");
    table.dropColumn("balanceBefore");
    table.dropColumn("balanceAfter");
    table.dropColumn("processedAt");
    table.dropColumn("failedAt");
  });
}
