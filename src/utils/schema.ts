import db from "../config/db";

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
  let query = db(tableName).where({ ...filter, is_deleted: false });

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
) => {
  let query = db(tableName).where({ ...filter, is_deleted: false });

  joinOptions.forEach((join) => {
    query = query.leftJoin(join.table, join.first, join.second);
  });

  const data = await query.first();
  return data;
};

/**
 * Insert record
 */
export const create = async (tableName: string, data: Record<string, any>) => {
  const [newData] = await db(tableName).insert(data).returning("*");
  return newData;
};

/**
 * Update record
 */
export const update = async (
  tableName: string,
  filter: Record<string, any>,
  data: Record<string, any>,
) => {
  const [updatedData] = await db(tableName)
    .where(filter)
    .update(data)
    .returning("*");

  return updatedData;
};

/**
 * Soft delete (mark as deleted)
 */
export const deleteItem = async (
  tableName: string,
  filter: Record<string, any>,
) => {
  const [deleted] = await db(tableName)
    .where(filter)
    .update({ is_deleted: true })
    .returning("*");

  return deleted;
};

/**
 * Soft delete multiple
 */
export const deleteMultipleItem = async (
  tableName: string,
  filter: Record<string, any>,
) => {
  const updated = await db(tableName)
    .where(filter)
    .update({ is_deleted: true });
  return updated;
};

/**
 * Check uniqueness
 */
export const isUnique = async (
  tableName: string,
  uniqueField: Record<string, any>,
) => {
  const data = await db(tableName).where(uniqueField).first();
  return data == null;
};
