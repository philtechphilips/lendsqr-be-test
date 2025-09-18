import db from "../../database/connection";
import { create, fetchOne, update, isUnique } from "../../utils/schema";
import { getErrorMessage } from "../../utils/getErrorMessage";
import {
  AppError,
  InsufficientFundsError,
  WalletNotFoundError,
  InvalidAmountError,
  RecipientNotFoundError,
  SelfTransferError,
} from "../../utils/errors";
import { TransactionService } from "../transactions/transaction.service";
import {
  FundWalletDTO,
  TransferFundsDTO,
  WithdrawFundsDTO,
  WalletResponse,
  FundWalletResponse,
  TransferFundsResponse,
  WithdrawFundsResponse,
} from "./dto/wallet.dto";

const WALLETS_TABLE = "wallets";
const USERS_TABLE = "users";

export interface WalletRow {
  id: string;
  user_id: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export class WalletService {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  /**
   * Get wallet by user ID
   */
  async getWalletByUserId(userId: string): Promise<WalletRow | null> {
    try {
      const wallet = await fetchOne(WALLETS_TABLE, { user_id: userId });
      return wallet;
    } catch (err: unknown) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(
        `WalletService.getWalletByUserId error: ${getErrorMessage(err)}`,
      );
    }
  }

  /**
   * Fund user's wallet
   */
  async fundWallet(
    userId: string,
    payload: FundWalletDTO,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<FundWalletResponse> {
    try {
      // Validate amount
      if (payload.amount <= 0) {
        throw new InvalidAmountError("Amount must be greater than 0");
      }

      return await db.transaction(async (trx) => {
        // Get user's wallet
        const wallet = await fetchOne(
          WALLETS_TABLE,
          { user_id: userId },
          [],
          trx,
        );
        if (!wallet) {
          throw new WalletNotFoundError();
        }

        // Generate transaction reference if not provided
        const reference =
          payload.reference ||
          this.transactionService.generateTransactionReference();

        // Update wallet balance
        const newBalance = Number(wallet.balance) + payload.amount;
        const updatedWallet = await update(
          WALLETS_TABLE,
          { user_id: userId },
          { balance: newBalance },
          trx,
        );

        // Create transaction record with balance tracking
        const transaction = await this.transactionService.createTransaction(
          {
            walletId: wallet.id,
            userId: userId,
            type: "FUND",
            amount: payload.amount,
            reference: reference,
            status: "PENDING",
            description: `Wallet funding of ₦${payload.amount}`,
            balanceBefore: Number(wallet.balance),
            balanceAfter: newBalance,
            fee: 0.0,
            channel: "API",
            ipAddress: ipAddress,
            userAgent: userAgent,
          },
          trx,
        );

        // Mark transaction as successful
        await this.transactionService.markTransactionSuccess(
          transaction.id,
          undefined, // balanceAfter already set during transaction creation
          trx,
        );

        return {
          wallet: updatedWallet,
          transaction: transaction,
        };
      });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(
        `WalletService.fundWallet error: ${getErrorMessage(err)}`,
      );
    }
  }

  /**
   * Transfer funds to another user
   */
  async transferFunds(
    senderUserId: string,
    payload: TransferFundsDTO,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TransferFundsResponse> {
    try {
      // Validate amount
      if (payload.amount <= 0) {
        throw new InvalidAmountError("Amount must be greater than 0");
      }

      return await db.transaction(async (trx) => {
        // Get sender's wallet
        const senderWallet = await fetchOne(
          WALLETS_TABLE,
          { user_id: senderUserId },
          [],
          trx,
        );
        if (!senderWallet) {
          throw new WalletNotFoundError();
        }

        // Check if sender has sufficient funds
        if (Number(senderWallet.balance) < payload.amount) {
          throw new InsufficientFundsError();
        }

        // Find recipient by email
        const recipient = await fetchOne(
          USERS_TABLE,
          { email: payload.recipientEmail.toLowerCase() },
          [],
          trx,
        );
        if (!recipient) {
          throw new RecipientNotFoundError();
        }

        // Check if sender is trying to transfer to themselves
        if (recipient.id === senderUserId) {
          throw new SelfTransferError();
        }

        // Get recipient's wallet
        const recipientWallet = await fetchOne(
          WALLETS_TABLE,
          { user_id: recipient.id },
          [],
          trx,
        );
        if (!recipientWallet) {
          throw new WalletNotFoundError("Recipient wallet not found");
        }

        // Generate transaction reference if not provided
        const reference =
          payload.reference ||
          this.transactionService.generateTransactionReference();

        // Update sender's wallet balance
        const senderNewBalance = Number(senderWallet.balance) - payload.amount;
        const updatedSenderWallet = await update(
          WALLETS_TABLE,
          { user_id: senderUserId },
          { balance: senderNewBalance },
          trx,
        );

        // Update recipient's wallet balance
        const recipientNewBalance =
          Number(recipientWallet.balance) + payload.amount;
        const updatedRecipientWallet = await update(
          WALLETS_TABLE,
          { user_id: recipient.id },
          { balance: recipientNewBalance },
          trx,
        );

        // Create transaction record for sender with both senderId and receiverId
        const senderTransaction =
          await this.transactionService.createTransaction(
            {
              walletId: senderWallet.id,
              userId: senderUserId,
              type: "TRANSFER",
              amount: payload.amount,
              reference: reference,
              senderId: senderUserId, // Include sender ID for debitor info
              receiverId: recipient.id, // Include receiver ID for creditor info
              status: "PENDING",
              description: `Transfer of ₦${payload.amount} to ${recipient.email}`,
              balanceBefore: Number(senderWallet.balance),
              balanceAfter: senderNewBalance,
              fee: 0.0,
              channel: "API",
              ipAddress: ipAddress,
              userAgent: userAgent,
            },
            trx,
          );

        // Create transaction record for recipient with both senderId and receiverId
        const recipientTransaction =
          await this.transactionService.createTransaction(
            {
              walletId: recipientWallet.id,
              userId: recipient.id,
              type: "TRANSFER",
              amount: payload.amount,
              reference: reference,
              senderId: senderUserId, // Include sender ID for debitor info
              receiverId: recipient.id, // Include receiver ID for creditor info
              status: "PENDING",
              description: `Transfer of ₦${payload.amount} from ${senderWallet.user_id}`,
              balanceBefore: Number(recipientWallet.balance),
              balanceAfter: recipientNewBalance,
              fee: 0.0,
              channel: "API",
              ipAddress: ipAddress,
              userAgent: userAgent,
            },
            trx,
          );

        // Mark both transactions as successful
        await this.transactionService.markTransactionSuccess(
          senderTransaction.id,
          undefined, // balanceAfter already set during transaction creation
          trx,
        );

        await this.transactionService.markTransactionSuccess(
          recipientTransaction.id,
          undefined, // balanceAfter already set during transaction creation
          trx,
        );

        // Only return sender's transaction
        return {
          transaction: senderTransaction,
        };
      });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(
        `WalletService.transferFunds error: ${getErrorMessage(err)}`,
      );
    }
  }

  /**
   * Withdraw funds from user's wallet
   */
  async withdrawFunds(
    userId: string,
    payload: WithdrawFundsDTO,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<WithdrawFundsResponse> {
    try {
      // Validate amount
      if (payload.amount <= 0) {
        throw new InvalidAmountError("Amount must be greater than 0");
      }

      return await db.transaction(async (trx) => {
        // Get user's wallet
        const wallet = await fetchOne(
          WALLETS_TABLE,
          { user_id: userId },
          [],
          trx,
        );
        if (!wallet) {
          throw new WalletNotFoundError();
        }

        // Check if user has sufficient funds
        if (Number(wallet.balance) < payload.amount) {
          throw new InsufficientFundsError();
        }

        // Generate transaction reference if not provided
        const reference =
          payload.reference ||
          this.transactionService.generateTransactionReference();

        // Update wallet balance
        const newBalance = Number(wallet.balance) - payload.amount;
        const updatedWallet = await update(
          WALLETS_TABLE,
          { user_id: userId },
          { balance: newBalance },
          trx,
        );

        // Create transaction record
        const transaction = await this.transactionService.createTransaction(
          {
            walletId: wallet.id,
            userId: userId,
            type: "WITHDRAW",
            amount: payload.amount,
            reference: reference,
            status: "PENDING",
            description: `Wallet withdrawal of ₦${payload.amount}`,
            balanceBefore: Number(wallet.balance),
            balanceAfter: newBalance,
            fee: 0.0,
            channel: "API",
            ipAddress: ipAddress,
            userAgent: userAgent,
          },
          trx,
        );

        // Mark transaction as successful
        await this.transactionService.markTransactionSuccess(
          transaction.id,
          undefined, // balanceAfter already set during transaction creation
          trx,
        );

        return {
          wallet: updatedWallet,
          transaction: transaction,
        };
      });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(
        `WalletService.withdrawFunds error: ${getErrorMessage(err)}`,
      );
    }
  }

  /**
   * Get user's wallet balance
   */
  async getWalletBalance(userId: string): Promise<{ balance: number }> {
    try {
      const wallet = await this.getWalletByUserId(userId);
      if (!wallet) {
        throw new WalletNotFoundError();
      }

      return { balance: Number(wallet.balance) };
    } catch (err: unknown) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(
        `WalletService.getWalletBalance error: ${getErrorMessage(err)}`,
      );
    }
  }
}
