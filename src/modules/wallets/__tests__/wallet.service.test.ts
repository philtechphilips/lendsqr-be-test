import { WalletService, WalletRow } from "../wallet.service";
import { TransactionService } from "../../transactions/transaction.service";
import {
  FundWalletDTO,
  TransferFundsDTO,
  WithdrawFundsDTO,
  FundWalletResponse,
  TransferFundsResponse,
  WithdrawFundsResponse,
} from "../dto/wallet.dto";
import * as schema from "../../../utils/schema";
import * as errors from "../../../utils/errors";
import db from "../../../database/connection";

// Mock all dependencies
jest.mock("../../../utils/schema");
jest.mock("../../../database/connection");
jest.mock("../../transactions/transaction.service");

const mockedSchema = schema as jest.Mocked<typeof schema>;
const mockedDb = db as jest.Mocked<typeof db>;
const MockedTransactionService = TransactionService as jest.MockedClass<
  typeof TransactionService
>;

describe("WalletService", () => {
  let walletService: WalletService;
  let mockTransactionService: jest.Mocked<TransactionService>;
  let mockTransaction: jest.Mock;

  // Hardcoded UUID strings for testing
  const testUserId = "550e8400-e29b-41d4-a716-446655440000";
  const testWalletId = "550e8400-e29b-41d4-a716-446655440001";
  const testRecipientId = "550e8400-e29b-41d4-a716-446655440002";
  const testTransactionId = "550e8400-e29b-41d4-a716-446655440003";
  const testReference = "TXN_1234567890_ABC123";

  beforeEach(() => {
    walletService = new WalletService();
    mockTransaction = jest.fn();
    mockTransactionService =
      new MockedTransactionService() as jest.Mocked<TransactionService>;

    // Mock the transaction service instance
    (walletService as any).transactionService = mockTransactionService;

    mockedDb.transaction.mockImplementation(async (callback) => {
      return await callback(mockTransaction as any);
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe("getWalletByUserId", () => {
    describe("Positive Test Cases", () => {
      it("should successfully get wallet by user ID", async () => {
        const mockWallet: WalletRow = {
          id: testWalletId,
          user_id: testUserId,
          balance: 5000,
          created_at: new Date(),
          updated_at: new Date(),
        };

        mockedSchema.fetchOne.mockResolvedValue(mockWallet);

        const result = await walletService.getWalletByUserId(testUserId);

        expect(result).toEqual(mockWallet);
        expect(mockedSchema.fetchOne).toHaveBeenCalledWith("wallets", {
          user_id: testUserId,
        });
      });

      it("should return null when wallet not found", async () => {
        mockedSchema.fetchOne.mockResolvedValue(null);

        const result = await walletService.getWalletByUserId(testUserId);

        expect(result).toBeNull();
        expect(mockedSchema.fetchOne).toHaveBeenCalledWith("wallets", {
          user_id: testUserId,
        });
      });
    });

    describe("Negative Test Cases", () => {
      it("should throw AppError when database query fails", async () => {
        const databaseError = new Error("Database connection failed");
        mockedSchema.fetchOne.mockRejectedValue(databaseError);

        await expect(
          walletService.getWalletByUserId(testUserId),
        ).rejects.toThrow(errors.AppError);
      });

      it("should re-throw AppError when schema.fetchOne throws AppError", async () => {
        const appError = new errors.AppError(
          "Database constraint violation",
          400,
        );
        mockedSchema.fetchOne.mockRejectedValue(appError);

        await expect(
          walletService.getWalletByUserId(testUserId),
        ).rejects.toThrow(appError);
      });
    });
  });

  describe("fundWallet", () => {
    const validFundWalletDTO: FundWalletDTO = {
      amount: 1000,
      reference: testReference,
    };

    const mockWallet: WalletRow = {
      id: testWalletId,
      user_id: testUserId,
      balance: 5000,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockUpdatedWallet = {
      ...mockWallet,
      balance: 6000,
    };

    const mockTransaction = {
      id: testTransactionId,
      walletId: testWalletId,
      userId: testUserId,
      type: "FUND" as const,
      amount: 1000,
      reference: testReference,
      created_at: new Date(),
      updated_at: new Date(),
    };

    describe("Positive Test Cases", () => {
      it("should successfully fund wallet with provided reference", async () => {
        mockedSchema.fetchOne.mockResolvedValue(mockWallet);
        mockedSchema.update.mockResolvedValue(mockUpdatedWallet);
        mockTransactionService.generateTransactionReference.mockReturnValue(
          testReference,
        );
        mockTransactionService.createTransaction.mockResolvedValue(
          mockTransaction,
        );

        const result = await walletService.fundWallet(
          testUserId,
          validFundWalletDTO,
        );

        expect(result).toEqual({
          wallet: mockUpdatedWallet,
          transaction: mockTransaction,
        });
        expect(mockedSchema.fetchOne).toHaveBeenCalledWith(
          "wallets",
          { user_id: testUserId },
          [],
          expect.any(Function),
        );
        expect(mockedSchema.update).toHaveBeenCalledWith(
          "wallets",
          { user_id: testUserId },
          { balance: 6000 },
          expect.any(Function),
        );
        expect(mockTransactionService.createTransaction).toHaveBeenCalledWith(
          {
            walletId: testWalletId,
            userId: testUserId,
            type: "FUND",
            amount: 1000,
            reference: testReference,
          },
          expect.any(Function),
        );
      });

      it("should successfully fund wallet with generated reference", async () => {
        const fundDTOWithoutReference: FundWalletDTO = {
          amount: 1000,
        };

        mockedSchema.fetchOne.mockResolvedValue(mockWallet);
        mockedSchema.update.mockResolvedValue(mockUpdatedWallet);
        mockTransactionService.generateTransactionReference.mockReturnValue(
          testReference,
        );
        mockTransactionService.createTransaction.mockResolvedValue(
          mockTransaction,
        );

        const result = await walletService.fundWallet(
          testUserId,
          fundDTOWithoutReference,
        );

        expect(result).toEqual({
          wallet: mockUpdatedWallet,
          transaction: mockTransaction,
        });
        expect(
          mockTransactionService.generateTransactionReference,
        ).toHaveBeenCalled();
        expect(mockTransactionService.createTransaction).toHaveBeenCalledWith(
          {
            walletId: testWalletId,
            userId: testUserId,
            type: "FUND",
            amount: 1000,
            reference: testReference,
          },
          expect.any(Function),
        );
      });
    });

    describe("Negative Test Cases", () => {
      it("should throw InvalidAmountError when amount is zero", async () => {
        const invalidFundDTO: FundWalletDTO = {
          amount: 0,
        };

        await expect(
          walletService.fundWallet(testUserId, invalidFundDTO),
        ).rejects.toThrow(errors.InvalidAmountError);
      });

      it("should throw InvalidAmountError when amount is negative", async () => {
        const invalidFundDTO: FundWalletDTO = {
          amount: -100,
        };

        await expect(
          walletService.fundWallet(testUserId, invalidFundDTO),
        ).rejects.toThrow(errors.InvalidAmountError);
      });

      it("should throw WalletNotFoundError when wallet not found", async () => {
        mockedSchema.fetchOne.mockResolvedValue(null);

        await expect(
          walletService.fundWallet(testUserId, validFundWalletDTO),
        ).rejects.toThrow(errors.WalletNotFoundError);
      });

      it("should throw AppError when database transaction fails", async () => {
        mockedSchema.fetchOne.mockRejectedValue(new Error("Database error"));

        await expect(
          walletService.fundWallet(testUserId, validFundWalletDTO),
        ).rejects.toThrow(errors.AppError);
      });
    });
  });

  describe("transferFunds", () => {
    const validTransferDTO: TransferFundsDTO = {
      recipientEmail: "recipient@example.com",
      amount: 500,
      reference: testReference,
    };

    const mockSenderWallet: WalletRow = {
      id: testWalletId,
      user_id: testUserId,
      balance: 5000,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockRecipient = {
      id: testRecipientId,
      email: "recipient@example.com",
      firstName: "Jane",
      lastName: "Doe",
    };

    const mockRecipientWallet: WalletRow = {
      id: "recipient-wallet-id",
      user_id: testRecipientId,
      balance: 2000,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockUpdatedSenderWallet = {
      ...mockSenderWallet,
      balance: 4500,
    };

    const mockUpdatedRecipientWallet = {
      ...mockRecipientWallet,
      balance: 2500,
    };

    const mockTransaction = {
      id: testTransactionId,
      walletId: testWalletId,
      userId: testUserId,
      type: "TRANSFER" as const,
      amount: 500,
      reference: testReference,
      receiverId: testRecipientId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    describe("Positive Test Cases", () => {
      it("should successfully transfer funds with provided reference", async () => {
        mockedSchema.fetchOne
          .mockResolvedValueOnce(mockSenderWallet) // sender wallet
          .mockResolvedValueOnce(mockRecipient) // recipient user
          .mockResolvedValueOnce(mockRecipientWallet); // recipient wallet

        mockedSchema.update
          .mockResolvedValueOnce(mockUpdatedSenderWallet) // update sender
          .mockResolvedValueOnce(mockUpdatedRecipientWallet); // update recipient

        mockTransactionService.generateTransactionReference.mockReturnValue(
          testReference,
        );
        mockTransactionService.createTransaction.mockResolvedValue(
          mockTransaction,
        );

        const result = await walletService.transferFunds(
          testUserId,
          validTransferDTO,
        );

        expect(result).toEqual({
          transaction: mockTransaction,
        });
        expect(mockedSchema.fetchOne).toHaveBeenCalledWith(
          "wallets",
          { user_id: testUserId },
          [],
          expect.any(Function),
        );
        expect(mockedSchema.fetchOne).toHaveBeenCalledWith(
          "users",
          { email: "recipient@example.com" },
          [],
          expect.any(Function),
        );
        expect(mockedSchema.fetchOne).toHaveBeenCalledWith(
          "wallets",
          { user_id: testRecipientId },
          [],
          expect.any(Function),
        );
        expect(mockedSchema.update).toHaveBeenCalledWith(
          "wallets",
          { user_id: testUserId },
          { balance: 4500 },
          expect.any(Function),
        );
        expect(mockedSchema.update).toHaveBeenCalledWith(
          "wallets",
          { user_id: testRecipientId },
          { balance: 2500 },
          expect.any(Function),
        );
        expect(mockTransactionService.createTransaction).toHaveBeenCalledTimes(
          2,
        );

        // Verify sender transaction has both senderId and receiverId
        expect(
          mockTransactionService.createTransaction,
        ).toHaveBeenNthCalledWith(
          1,
          {
            walletId: testWalletId,
            userId: testUserId,
            type: "TRANSFER",
            amount: 500,
            reference: testReference,
            senderId: testUserId,
            receiverId: testRecipientId,
          },
          expect.any(Function),
        );

        // Verify recipient transaction has both senderId and receiverId
        expect(
          mockTransactionService.createTransaction,
        ).toHaveBeenNthCalledWith(
          2,
          {
            walletId: "recipient-wallet-id",
            userId: testRecipientId,
            type: "TRANSFER",
            amount: 500,
            reference: testReference,
            senderId: testUserId,
            receiverId: testRecipientId,
          },
          expect.any(Function),
        );
      });

      it("should successfully transfer funds with generated reference", async () => {
        const transferDTOWithoutReference: TransferFundsDTO = {
          recipientEmail: "recipient@example.com",
          amount: 500,
        };

        mockedSchema.fetchOne
          .mockResolvedValueOnce(mockSenderWallet)
          .mockResolvedValueOnce(mockRecipient)
          .mockResolvedValueOnce(mockRecipientWallet);

        mockedSchema.update
          .mockResolvedValueOnce(mockUpdatedSenderWallet)
          .mockResolvedValueOnce(mockUpdatedRecipientWallet);

        mockTransactionService.generateTransactionReference.mockReturnValue(
          testReference,
        );
        mockTransactionService.createTransaction.mockResolvedValue(
          mockTransaction,
        );

        const result = await walletService.transferFunds(
          testUserId,
          transferDTOWithoutReference,
        );

        expect(result).toEqual({
          transaction: mockTransaction,
        });
        expect(
          mockTransactionService.generateTransactionReference,
        ).toHaveBeenCalled();
      });
    });

    describe("Negative Test Cases", () => {
      it("should throw InvalidAmountError when amount is zero", async () => {
        const invalidTransferDTO: TransferFundsDTO = {
          recipientEmail: "recipient@example.com",
          amount: 0,
        };

        await expect(
          walletService.transferFunds(testUserId, invalidTransferDTO),
        ).rejects.toThrow(errors.InvalidAmountError);
      });

      it("should throw InvalidAmountError when amount is negative", async () => {
        const invalidTransferDTO: TransferFundsDTO = {
          recipientEmail: "recipient@example.com",
          amount: -100,
        };

        await expect(
          walletService.transferFunds(testUserId, invalidTransferDTO),
        ).rejects.toThrow(errors.InvalidAmountError);
      });

      it("should throw WalletNotFoundError when sender wallet not found", async () => {
        mockedSchema.fetchOne.mockResolvedValue(null);

        await expect(
          walletService.transferFunds(testUserId, validTransferDTO),
        ).rejects.toThrow(errors.WalletNotFoundError);
      });

      it("should throw InsufficientFundsError when sender has insufficient funds", async () => {
        const insufficientWallet: WalletRow = {
          ...mockSenderWallet,
          balance: 100, // Less than transfer amount
        };

        mockedSchema.fetchOne.mockResolvedValue(insufficientWallet);

        await expect(
          walletService.transferFunds(testUserId, validTransferDTO),
        ).rejects.toThrow(errors.InsufficientFundsError);
      });

      it("should throw RecipientNotFoundError when recipient not found", async () => {
        mockedSchema.fetchOne
          .mockResolvedValueOnce(mockSenderWallet)
          .mockResolvedValueOnce(null); // recipient not found

        await expect(
          walletService.transferFunds(testUserId, validTransferDTO),
        ).rejects.toThrow(errors.RecipientNotFoundError);
      });

      it("should throw SelfTransferError when trying to transfer to self", async () => {
        const selfRecipient = {
          id: testUserId, // Same as sender
          email: "recipient@example.com",
        };

        mockedSchema.fetchOne
          .mockResolvedValueOnce(mockSenderWallet)
          .mockResolvedValueOnce(selfRecipient);

        await expect(
          walletService.transferFunds(testUserId, validTransferDTO),
        ).rejects.toThrow(errors.SelfTransferError);
      });

      it("should throw WalletNotFoundError when recipient wallet not found", async () => {
        mockedSchema.fetchOne
          .mockResolvedValueOnce(mockSenderWallet)
          .mockResolvedValueOnce(mockRecipient)
          .mockResolvedValueOnce(null); // recipient wallet not found

        await expect(
          walletService.transferFunds(testUserId, validTransferDTO),
        ).rejects.toThrow(errors.WalletNotFoundError);
      });
    });
  });

  describe("withdrawFunds", () => {
    const validWithdrawDTO: WithdrawFundsDTO = {
      amount: 500,
      reference: testReference,
    };

    const mockWallet: WalletRow = {
      id: testWalletId,
      user_id: testUserId,
      balance: 5000,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockUpdatedWallet = {
      ...mockWallet,
      balance: 4500,
    };

    const mockTransaction = {
      id: testTransactionId,
      walletId: testWalletId,
      userId: testUserId,
      type: "WITHDRAW" as const,
      amount: 500,
      reference: testReference,
      created_at: new Date(),
      updated_at: new Date(),
    };

    describe("Positive Test Cases", () => {
      it("should successfully withdraw funds with provided reference", async () => {
        mockedSchema.fetchOne.mockResolvedValue(mockWallet);
        mockedSchema.update.mockResolvedValue(mockUpdatedWallet);
        mockTransactionService.generateTransactionReference.mockReturnValue(
          testReference,
        );
        mockTransactionService.createTransaction.mockResolvedValue(
          mockTransaction,
        );

        const result = await walletService.withdrawFunds(
          testUserId,
          validWithdrawDTO,
        );

        expect(result).toEqual({
          wallet: mockUpdatedWallet,
          transaction: mockTransaction,
        });
        expect(mockedSchema.fetchOne).toHaveBeenCalledWith(
          "wallets",
          { user_id: testUserId },
          [],
          expect.any(Function),
        );
        expect(mockedSchema.update).toHaveBeenCalledWith(
          "wallets",
          { user_id: testUserId },
          { balance: 4500 },
          expect.any(Function),
        );
        expect(mockTransactionService.createTransaction).toHaveBeenCalledWith(
          {
            walletId: testWalletId,
            userId: testUserId,
            type: "WITHDRAW",
            amount: 500,
            reference: testReference,
          },
          expect.any(Function),
        );
      });

      it("should successfully withdraw funds with generated reference", async () => {
        const withdrawDTOWithoutReference: WithdrawFundsDTO = {
          amount: 500,
        };

        mockedSchema.fetchOne.mockResolvedValue(mockWallet);
        mockedSchema.update.mockResolvedValue(mockUpdatedWallet);
        mockTransactionService.generateTransactionReference.mockReturnValue(
          testReference,
        );
        mockTransactionService.createTransaction.mockResolvedValue(
          mockTransaction,
        );

        const result = await walletService.withdrawFunds(
          testUserId,
          withdrawDTOWithoutReference,
        );

        expect(result).toEqual({
          wallet: mockUpdatedWallet,
          transaction: mockTransaction,
        });
        expect(
          mockTransactionService.generateTransactionReference,
        ).toHaveBeenCalled();
      });
    });

    describe("Negative Test Cases", () => {
      it("should throw InvalidAmountError when amount is zero", async () => {
        const invalidWithdrawDTO: WithdrawFundsDTO = {
          amount: 0,
        };

        await expect(
          walletService.withdrawFunds(testUserId, invalidWithdrawDTO),
        ).rejects.toThrow(errors.InvalidAmountError);
      });

      it("should throw InvalidAmountError when amount is negative", async () => {
        const invalidWithdrawDTO: WithdrawFundsDTO = {
          amount: -100,
        };

        await expect(
          walletService.withdrawFunds(testUserId, invalidWithdrawDTO),
        ).rejects.toThrow(errors.InvalidAmountError);
      });

      it("should throw WalletNotFoundError when wallet not found", async () => {
        mockedSchema.fetchOne.mockResolvedValue(null);

        await expect(
          walletService.withdrawFunds(testUserId, validWithdrawDTO),
        ).rejects.toThrow(errors.WalletNotFoundError);
      });

      it("should throw InsufficientFundsError when insufficient funds", async () => {
        const insufficientWallet: WalletRow = {
          ...mockWallet,
          balance: 100, // Less than withdraw amount
        };

        mockedSchema.fetchOne.mockResolvedValue(insufficientWallet);

        await expect(
          walletService.withdrawFunds(testUserId, validWithdrawDTO),
        ).rejects.toThrow(errors.InsufficientFundsError);
      });

      it("should throw AppError when database transaction fails", async () => {
        mockedSchema.fetchOne.mockRejectedValue(new Error("Database error"));

        await expect(
          walletService.withdrawFunds(testUserId, validWithdrawDTO),
        ).rejects.toThrow(errors.AppError);
      });
    });
  });

  describe("getWalletBalance", () => {
    const mockWallet: WalletRow = {
      id: testWalletId,
      user_id: testUserId,
      balance: 5000,
      created_at: new Date(),
      updated_at: new Date(),
    };

    describe("Positive Test Cases", () => {
      it("should successfully get wallet balance", async () => {
        mockedSchema.fetchOne.mockResolvedValue(mockWallet);

        const result = await walletService.getWalletBalance(testUserId);

        expect(result).toEqual({ balance: 5000 });
        expect(mockedSchema.fetchOne).toHaveBeenCalledWith("wallets", {
          user_id: testUserId,
        });
      });
    });

    describe("Negative Test Cases", () => {
      it("should throw WalletNotFoundError when wallet not found", async () => {
        mockedSchema.fetchOne.mockResolvedValue(null);

        await expect(
          walletService.getWalletBalance(testUserId),
        ).rejects.toThrow(errors.WalletNotFoundError);
      });

      it("should throw AppError when database query fails", async () => {
        const databaseError = new Error("Database connection failed");
        mockedSchema.fetchOne.mockRejectedValue(databaseError);

        await expect(
          walletService.getWalletBalance(testUserId),
        ).rejects.toThrow(errors.AppError);
      });

      it("should re-throw AppError when getWalletByUserId throws AppError", async () => {
        const appError = new errors.AppError(
          "Database constraint violation",
          400,
        );
        mockedSchema.fetchOne.mockRejectedValue(appError);

        await expect(
          walletService.getWalletBalance(testUserId),
        ).rejects.toThrow(appError);
      });
    });
  });

  describe("Error Handling", () => {
    it("should wrap non-AppError exceptions in AppError for getWalletByUserId", async () => {
      const databaseError = new Error("Database connection failed");
      mockedSchema.fetchOne.mockRejectedValue(databaseError);

      await expect(walletService.getWalletByUserId(testUserId)).rejects.toThrow(
        errors.AppError,
      );
    });

    it("should re-throw AppError instances as-is for getWalletByUserId", async () => {
      const appError = new errors.AppError(
        "Database constraint violation",
        400,
      );
      mockedSchema.fetchOne.mockRejectedValue(appError);

      await expect(walletService.getWalletByUserId(testUserId)).rejects.toThrow(
        appError,
      );
    });

    it("should wrap non-AppError exceptions in AppError for fundWallet", async () => {
      const validFundWalletDTO: FundWalletDTO = {
        amount: 1000,
      };

      const databaseError = new Error("Database connection failed");
      mockedSchema.fetchOne.mockRejectedValue(databaseError);

      await expect(
        walletService.fundWallet(testUserId, validFundWalletDTO),
      ).rejects.toThrow(errors.AppError);
    });

    it("should re-throw AppError instances as-is for fundWallet", async () => {
      const validFundWalletDTO: FundWalletDTO = {
        amount: 1000,
      };

      const appError = new errors.AppError(
        "Database constraint violation",
        400,
      );
      mockedSchema.fetchOne.mockRejectedValue(appError);

      await expect(
        walletService.fundWallet(testUserId, validFundWalletDTO),
      ).rejects.toThrow(appError);
    });
  });
});
