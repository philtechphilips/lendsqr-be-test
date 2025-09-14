import db from "../database/connection";
import { getErrorMessage } from "./getErrorMessage";

export const checkDbConnection = async (): Promise<boolean | never> => {
  try {
    await db.raw("SELECT 1");
    console.log("Database connected...");
    return true;
  } catch (error: unknown) {
    console.error("Failed to connect to database:", getErrorMessage(error));
    process.exit(1);
  }
};
