import db from "../../database/connection";
import { create, fetchOne } from "../../utils/schema";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { AppError } from "../../utils/errors";

const TRANSACTIONS_TABLE = "transactions";

export interface CreateTransactionDTO {
  walletId: string;
  userId: string;
  type: "FUND" | "TRANSFER" | "WITHDRAW";
  amount: number;
  reference: string;
  receiverId?: string; // For transfer transactions (creditor)
  senderId?: string; // For transfer transactions (debitor)
}

export interface TransactionRow {
  id: string;
  walletId: string;
  userId: string;
  type: "FUND" | "TRANSFER" | "WITHDRAW";
  amount: number;
  reference: string;
  receiverId?: string; // For transfer transactions (creditor)
  senderId?: string; // For transfer transactions (debitor)
  createdAt: Date;
  updatedAt: Date;
  wallet?: any; // Populated wallet data
  user?: any; // Populated user data
  receiver?: any; // Populated receiver data
  sender?: any; // Populated sender data
}

export class TransactionService {
  /**
   * Create a new transaction record
   */
  async createTransaction(
    payload: CreateTransactionDTO,
    trx?: any,
  ): Promise<TransactionRow> {
    try {
      const transactionPayload = {
        walletId: payload.walletId,
        userId: payload.userId,
        type: payload.type,
        amount: payload.amount,
        reference: payload.reference,
        receiverId: payload.receiverId || null,
        senderId: payload.senderId || null,
      };

      const createdTransaction = await create(
        TRANSACTIONS_TABLE,
        transactionPayload,
        trx,
      );

      // Get the transaction with all relations - super clean!
      const populatedTransaction = await this.getTransactionWithRelations(
        createdTransaction.id,
        trx,
      );

      return populatedTransaction;
    } catch (err: unknown) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(
        `TransactionService.createTransaction error: ${getErrorMessage(err)}`,
      );
    }
  }

  /**
   * Get transaction by reference
   */
  async getTransactionByReference(
    reference: string,
    trx?: any,
  ): Promise<TransactionRow | null> {
    try {
      const transaction = await fetchOne(
        TRANSACTIONS_TABLE,
        { reference },
        [],
        trx,
      );

      return transaction;
    } catch (err: unknown) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(
        `TransactionService.getTransactionByReference error: ${getErrorMessage(err)}`,
      );
    }
  }

  /**
   * Generate a unique transaction reference
   */
  generateTransactionReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN_${timestamp}_${random}`;
  }

  /**
   * Get transaction with all related data - simple and working approach
   */
  private async getTransactionWithRelations(
    transactionId: string,
    trx?: any,
  ): Promise<TransactionRow> {
    const query = trx ? trx : db;

    const result = await query(TRANSACTIONS_TABLE)
      .where({ [`${TRANSACTIONS_TABLE}.id`]: transactionId })
      .leftJoin("wallets", `${TRANSACTIONS_TABLE}.walletId`, "wallets.id")
      .leftJoin("users", `${TRANSACTIONS_TABLE}.userId`, "users.id")
      .leftJoin(
        "users as receiver",
        `${TRANSACTIONS_TABLE}.receiverId`,
        "receiver.id",
      )
      .leftJoin(
        "users as sender",
        `${TRANSACTIONS_TABLE}.senderId`,
        "sender.id",
      )
      .select(
        `${TRANSACTIONS_TABLE}.*`,
        // Use MySQL JSON_OBJECT function for JSON aggregation
        query.raw(`
          CASE 
            WHEN wallets.id IS NOT NULL THEN 
              JSON_OBJECT(
                'id', wallets.id,
                'userId', wallets.user_id,
                'balance', wallets.balance,
                'createdAt', wallets.created_at,
                'updatedAt', wallets.updated_at
              )
            ELSE NULL 
          END as wallet
        `),
        query.raw(`
          CASE 
            WHEN users.id IS NOT NULL THEN 
              JSON_OBJECT(
                'id', users.id,
                'firstName', users.firstName,
                'lastName', users.lastName,
                'email', users.email,
                'phone', users.phone
              )
            ELSE NULL 
          END as user
        `),
        query.raw(`
          CASE 
            WHEN receiver.id IS NOT NULL THEN 
              JSON_OBJECT(
                'id', receiver.id,
                'firstName', receiver.firstName,
                'lastName', receiver.lastName,
                'email', receiver.email,
                'phone', receiver.phone
              )
            ELSE NULL 
          END as receiver
        `),
        query.raw(`
          CASE 
            WHEN sender.id IS NOT NULL THEN 
              JSON_OBJECT(
                'id', sender.id,
                'firstName', sender.firstName,
                'lastName', sender.lastName,
                'email', sender.email,
                'phone', sender.phone
              )
            ELSE NULL 
          END as sender
        `),
      )
      .first();

    if (!result) {
      throw new AppError("Transaction not found", 404);
    }

    return result as TransactionRow;
  }
}
