import db from "../database/connection";

/**
 * Fetch multiple records
 */
export const fetch = async (
  tableName: string,
  filter: Record<string, any> = {},
  joinOptions: { table: string; first: string; second: string }[] = [],
  sortBy = "created_at",
  sortType: "asc" | "desc" = "desc",
) => {
  let query = db(tableName).where({ ...filter, isDeleted: false });

  // Handle joins (simulate populate)
  joinOptions.forEach((join) => {
    query = query.leftJoin(join.table, join.first, join.second);
  });

  const data = await query.orderBy(sortBy, sortType).select("*");
  return data;
};

/**
 * Fetch single record
 */
export const fetchOne = async (
  tableName: string,
  filter: Record<string, any> = {},
  joinOptions: { table: string; first: string; second: string }[] = [],
  trx?: any,
) => {
  const query = trx ? trx(tableName) : db(tableName);
  let queryBuilder = query.where({ ...filter, isDeleted: false });

  joinOptions.forEach((join) => {
    queryBuilder = queryBuilder.leftJoin(join.table, join.first, join.second);
  });

  const data = await queryBuilder.first();
  return data;
};

/**
 * Table metadata for better record retrieval
 */
const TABLE_METADATA = {
  users: {
    uniqueFields: ["email", "phone", "bvn"],
    primaryKey: "id",
  },
  wallets: {
    uniqueFields: ["user_id"],
    primaryKey: "id",
  },
  transactions: {
    uniqueFields: ["reference"],
    primaryKey: "id",
  },
} as const;

/**
 * Insert record and return the created record
 */
export const create = async (
  tableName: string,
  data: Record<string, any>,
  trx?: any,
) => {
  const query = trx ? trx(tableName) : db(tableName);

  // Insert the data
  await query.insert(data);

  // Create a new query instance for fetching
  const fetchQuery = trx ? trx(tableName) : db(tableName);

  // For UUID fields or when insertId is not available, find by unique fields
  const tableMeta = TABLE_METADATA[tableName as keyof typeof TABLE_METADATA];

  if (tableMeta) {
    // Try to find by unique fields in order of preference
    for (const field of tableMeta.uniqueFields) {
      if (data[field] !== undefined) {
        const newData = await fetchQuery
          .where({ [field]: data[field] })
          .first();
        if (newData) {
          return newData;
        }
      }
    }
  }

  // Fallback: find by any unique field in the data
  const uniqueFields = Object.keys(data).filter(
    (key) =>
      key.includes("email") ||
      key.includes("phone") ||
      key.includes("bvn") ||
      key.includes("reference") ||
      key.includes("user_id"),
  );

  if (uniqueFields.length > 0) {
    const filter = { [uniqueFields[0]]: data[uniqueFields[0]] };
    const newData = await fetchQuery.where(filter).first();
    if (newData) {
      return newData;
    }
  }

  // Last resort: find by all provided data fields (less reliable)
  const newData = await fetchQuery.where(data).first();
  return newData;
};

/**
 * Update record
 */
export const update = async (
  tableName: string,
  filter: Record<string, any>,
  data: Record<string, any>,
  trx?: any,
) => {
  const query = trx ? trx(tableName) : db(tableName);

  // Add isDeleted: false to filter to ensure we don't update soft-deleted records
  const updateFilter = { ...filter, isDeleted: false };

  await query.where(updateFilter).update(data);

  // Fetch the updated record
  const updatedData = await query.where(updateFilter).first();
  return updatedData;
};

/**
 * Soft delete (mark as deleted)
 */
export const deleteItem = async (
  tableName: string,
  filter: Record<string, any>,
  trx?: any,
) => {
  const query = trx ? trx(tableName) : db(tableName);
  await query.where(filter).update({ isDeleted: true });

  // Fetch the deleted record
  const deleted = await query.where(filter).first();
  return deleted;
};

/**
 * Soft delete multiple
 */
export const deleteMultipleItem = async (
  tableName: string,
  filter: Record<string, any>,
) => {
  const updated = await db(tableName).where(filter).update({ isDeleted: true });
  return updated;
};

/**
 * Check uniqueness
 */
export const isUnique = async (
  tableName: string,
  uniqueField: Record<string, any>,
  trx?: any,
) => {
  const query = trx ? trx(tableName) : db(tableName);
  const data = await query.where({ ...uniqueField, isDeleted: false }).first();
  return data == null;
};
