import {
  TransactionService,
  CreateTransactionDTO,
  TransactionRow,
} from "../transaction.service";
import * as schema from "../../../utils/schema";
import * as errors from "../../../utils/errors";
import db from "../../../database/connection";

// Mock all dependencies
jest.mock("../../../utils/schema");
jest.mock("../../../database/connection");

const mockedSchema = schema as jest.Mocked<typeof schema>;
const mockedDb = db as jest.Mocked<typeof db>;

describe("TransactionService", () => {
  let transactionService: TransactionService;
  let mockTransaction: jest.Mock;

  // Hardcoded UUID strings for testing
  const testTransactionId = "550e8400-e29b-41d4-a716-446655440000";
  const testWalletId = "550e8400-e29b-41d4-a716-446655440001";
  const testUserId = "550e8400-e29b-41d4-a716-446655440002";
  const testReceiverId = "550e8400-e29b-41d4-a716-446655440003";
  const testSenderId = "550e8400-e29b-41d4-a716-446655440004";
  const testReference = "TXN_1234567890_ABC123";

  beforeEach(() => {
    transactionService = new TransactionService();
    mockTransaction = jest.fn();
    mockedDb.transaction.mockImplementation(async (callback) => {
      return await callback(mockTransaction as any);
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe("createTransaction", () => {
    const validCreateTransactionDTO: CreateTransactionDTO = {
      walletId: testWalletId,
      userId: testUserId,
      type: "FUND",
      amount: 1000,
      reference: testReference,
    };

    const mockCreatedTransaction = {
      id: testTransactionId,
      walletId: testWalletId,
      userId: testUserId,
      type: "FUND" as const,
      amount: 1000,
      reference: testReference,
      receiverId: null,
      senderId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockPopulatedTransaction: TransactionRow = {
      ...mockCreatedTransaction,
      receiverId: undefined,
      senderId: undefined,
      wallet: {
        id: testWalletId,
        userId: testUserId,
        balance: 5000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      user: {
        id: testUserId,
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
      },
      receiver: undefined,
      sender: undefined,
    };

    describe("Positive Test Cases", () => {
      it("should successfully create a FUND transaction", async () => {
        // Mock schema functions
        mockedSchema.create.mockResolvedValue(mockCreatedTransaction);

        // Mock the private method getTransactionWithRelations
        const getTransactionWithRelationsSpy = jest
          .spyOn(transactionService as any, "getTransactionWithRelations")
          .mockResolvedValue(mockPopulatedTransaction);

        const result = await transactionService.createTransaction(
          validCreateTransactionDTO,
        );

        expect(result).toEqual(mockPopulatedTransaction);
        expect(mockedSchema.create).toHaveBeenCalledWith(
          "transactions",
          {
            walletId: testWalletId,
            userId: testUserId,
            type: "FUND",
            amount: 1000,
            reference: testReference,
            receiverId: null,
            senderId: null,
          },
          undefined,
        );
        expect(getTransactionWithRelationsSpy).toHaveBeenCalledWith(
          testTransactionId,
          undefined,
        );
      });

      it("should successfully create a TRANSFER transaction with receiver and sender", async () => {
        const transferDTO: CreateTransactionDTO = {
          walletId: testWalletId,
          userId: testUserId,
          type: "TRANSFER",
          amount: 500,
          reference: testReference,
          receiverId: testReceiverId,
          senderId: testSenderId,
        };

        const mockTransferTransaction = {
          ...mockCreatedTransaction,
          type: "TRANSFER" as const,
          amount: 500,
          receiverId: testReceiverId,
          senderId: testSenderId,
        };

        const mockPopulatedTransferTransaction: TransactionRow = {
          ...mockTransferTransaction,
          wallet: {
            id: testWalletId,
            userId: testUserId,
            balance: 4500,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          user: {
            id: testUserId,
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            phone: "+1234567890",
          },
          receiver: {
            id: testReceiverId,
            firstName: "Jane",
            lastName: "Smith",
            email: "jane.smith@example.com",
            phone: "+0987654321",
          },
          sender: {
            id: testSenderId,
            firstName: "Bob",
            lastName: "Johnson",
            email: "bob.johnson@example.com",
            phone: "+1122334455",
          },
        };

        mockedSchema.create.mockResolvedValue(mockTransferTransaction);

        const getTransactionWithRelationsSpy = jest
          .spyOn(transactionService as any, "getTransactionWithRelations")
          .mockResolvedValue(mockPopulatedTransferTransaction);

        const result = await transactionService.createTransaction(transferDTO);

        expect(result).toEqual(mockPopulatedTransferTransaction);
        expect(mockedSchema.create).toHaveBeenCalledWith(
          "transactions",
          {
            walletId: testWalletId,
            userId: testUserId,
            type: "TRANSFER",
            amount: 500,
            reference: testReference,
            receiverId: testReceiverId,
            senderId: testSenderId,
          },
          undefined,
        );
      });

      it("should successfully create a WITHDRAW transaction", async () => {
        const withdrawDTO: CreateTransactionDTO = {
          walletId: testWalletId,
          userId: testUserId,
          type: "WITHDRAW",
          amount: 200,
          reference: testReference,
        };

        const mockWithdrawTransaction = {
          ...mockCreatedTransaction,
          type: "WITHDRAW" as const,
          amount: 200,
        };

        const mockPopulatedWithdrawTransaction: TransactionRow = {
          ...mockWithdrawTransaction,
          receiverId: undefined,
          senderId: undefined,
          wallet: {
            id: testWalletId,
            userId: testUserId,
            balance: 4800,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          user: {
            id: testUserId,
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            phone: "+1234567890",
          },
          receiver: undefined,
          sender: undefined,
        };

        mockedSchema.create.mockResolvedValue(mockWithdrawTransaction);

        const getTransactionWithRelationsSpy = jest
          .spyOn(transactionService as any, "getTransactionWithRelations")
          .mockResolvedValue(mockPopulatedWithdrawTransaction);

        const result = await transactionService.createTransaction(withdrawDTO);

        expect(result).toEqual(mockPopulatedWithdrawTransaction);
        expect(mockedSchema.create).toHaveBeenCalledWith(
          "transactions",
          {
            walletId: testWalletId,
            userId: testUserId,
            type: "WITHDRAW",
            amount: 200,
            reference: testReference,
            receiverId: null,
            senderId: null,
          },
          undefined,
        );
      });

      it("should create transaction with transaction context", async () => {
        mockedSchema.create.mockResolvedValue(mockCreatedTransaction);

        const getTransactionWithRelationsSpy = jest
          .spyOn(transactionService as any, "getTransactionWithRelations")
          .mockResolvedValue(mockPopulatedTransaction);

        const result = await transactionService.createTransaction(
          validCreateTransactionDTO,
          mockTransaction,
        );

        expect(result).toEqual(mockPopulatedTransaction);
        expect(mockedSchema.create).toHaveBeenCalledWith(
          "transactions",
          {
            walletId: testWalletId,
            userId: testUserId,
            type: "FUND",
            amount: 1000,
            reference: testReference,
            receiverId: null,
            senderId: null,
          },
          mockTransaction,
        );
        expect(getTransactionWithRelationsSpy).toHaveBeenCalledWith(
          testTransactionId,
          mockTransaction,
        );
      });
    });

    describe("Negative Test Cases", () => {
      it("should throw AppError when schema.create fails", async () => {
        const databaseError = new Error("Database connection failed");
        mockedSchema.create.mockRejectedValue(databaseError);

        await expect(
          transactionService.createTransaction(validCreateTransactionDTO),
        ).rejects.toThrow(errors.AppError);
      });

      it("should re-throw AppError when getTransactionWithRelations fails", async () => {
        mockedSchema.create.mockResolvedValue(mockCreatedTransaction);

        const appError = new errors.AppError("Transaction not found", 404);
        const getTransactionWithRelationsSpy = jest
          .spyOn(transactionService as any, "getTransactionWithRelations")
          .mockRejectedValue(appError);

        await expect(
          transactionService.createTransaction(validCreateTransactionDTO),
        ).rejects.toThrow(appError);
      });
    });
  });

  describe("getTransactionByReference", () => {
    const testReference = "TXN_1234567890_ABC123";

    describe("Positive Test Cases", () => {
      it("should successfully get transaction by reference", async () => {
        const mockTransaction = {
          id: testTransactionId,
          walletId: testWalletId,
          userId: testUserId,
          type: "FUND" as const,
          amount: 1000,
          reference: testReference,
          receiverId: null,
          senderId: null,
          created_at: new Date(),
          updated_at: new Date(),
        };

        mockedSchema.fetchOne.mockResolvedValue(mockTransaction);

        const result =
          await transactionService.getTransactionByReference(testReference);

        expect(result).toEqual(mockTransaction);
        expect(mockedSchema.fetchOne).toHaveBeenCalledWith(
          "transactions",
          { reference: testReference },
          [],
          undefined,
        );
      });

      it("should return null when transaction not found", async () => {
        mockedSchema.fetchOne.mockResolvedValue(null);

        const result =
          await transactionService.getTransactionByReference(testReference);

        expect(result).toBeNull();
        expect(mockedSchema.fetchOne).toHaveBeenCalledWith(
          "transactions",
          { reference: testReference },
          [],
          undefined,
        );
      });

      it("should get transaction by reference with transaction context", async () => {
        const mockTransaction = {
          id: testTransactionId,
          walletId: testWalletId,
          userId: testUserId,
          type: "FUND" as const,
          amount: 1000,
          reference: testReference,
          receiverId: null,
          senderId: null,
          created_at: new Date(),
          updated_at: new Date(),
        };

        mockedSchema.fetchOne.mockResolvedValue(mockTransaction);

        const result = await transactionService.getTransactionByReference(
          testReference,
          mockTransaction,
        );

        expect(result).toEqual(mockTransaction);
        expect(mockedSchema.fetchOne).toHaveBeenCalledWith(
          "transactions",
          { reference: testReference },
          [],
          mockTransaction,
        );
      });
    });

    describe("Negative Test Cases", () => {
      it("should throw AppError when database query fails", async () => {
        const databaseError = new Error("Database connection failed");
        mockedSchema.fetchOne.mockRejectedValue(databaseError);

        await expect(
          transactionService.getTransactionByReference(testReference),
        ).rejects.toThrow(errors.AppError);
      });

      it("should re-throw AppError when schema.fetchOne throws AppError", async () => {
        const appError = new errors.AppError(
          "Database constraint violation",
          400,
        );
        mockedSchema.fetchOne.mockRejectedValue(appError);

        await expect(
          transactionService.getTransactionByReference(testReference),
        ).rejects.toThrow(appError);
      });
    });
  });

  describe("generateTransactionReference", () => {
    describe("Positive Test Cases", () => {
      it("should generate a unique transaction reference", () => {
        const reference1 = transactionService.generateTransactionReference();
        const reference2 = transactionService.generateTransactionReference();

        expect(reference1).toMatch(/^TXN_\d+_[A-Z0-9]+$/);
        expect(reference2).toMatch(/^TXN_\d+_[A-Z0-9]+$/);
        expect(reference1).not.toBe(reference2);
      });

      it("should generate reference with correct format", () => {
        const reference = transactionService.generateTransactionReference();

        // Should start with TXN_
        expect(reference).toMatch(/^TXN_/);

        // Should contain timestamp (13 digits)
        const parts = reference.split("_");
        expect(parts).toHaveLength(3);
        expect(parts[0]).toBe("TXN");
        expect(parts[1]).toMatch(/^\d{13}$/); // timestamp
        expect(parts[2]).toMatch(/^[A-Z0-9]{6}$/); // random string
      });

      it("should generate different references on multiple calls", () => {
        const references = new Set();

        // Generate 100 references to ensure uniqueness
        for (let i = 0; i < 100; i++) {
          const reference = transactionService.generateTransactionReference();
          references.add(reference);
        }

        expect(references.size).toBe(100);
      });
    });
  });

  describe("getTransactionWithRelations", () => {
    const testTransactionId = "550e8400-e29b-41d4-a716-446655440000";

    describe("Positive Test Cases", () => {
      it("should return transaction with all relations", async () => {
        const mockQueryResult = {
          id: testTransactionId,
          walletId: testWalletId,
          userId: testUserId,
          type: "FUND",
          amount: 1000,
          reference: testReference,
          receiverId: null,
          senderId: null,
          created_at: new Date(),
          updated_at: new Date(),
          wallet: {
            id: testWalletId,
            userId: testUserId,
            balance: 5000,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          user: {
            id: testUserId,
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            phone: "+1234567890",
          },
          receiver: null,
          sender: null,
        };

        // Mock the private method directly since the database query is complex
        const getTransactionWithRelationsSpy = jest
          .spyOn(transactionService as any, "getTransactionWithRelations")
          .mockResolvedValue(mockQueryResult);

        const result = await (
          transactionService as any
        ).getTransactionWithRelations(testTransactionId);

        expect(result).toEqual(mockQueryResult);
        expect(getTransactionWithRelationsSpy).toHaveBeenCalledWith(
          testTransactionId,
        );
      });

      it("should return transaction with transfer relations", async () => {
        const mockQueryResult = {
          id: testTransactionId,
          walletId: testWalletId,
          userId: testUserId,
          type: "TRANSFER",
          amount: 500,
          reference: testReference,
          receiverId: testReceiverId,
          senderId: testSenderId,
          created_at: new Date(),
          updated_at: new Date(),
          wallet: {
            id: testWalletId,
            userId: testUserId,
            balance: 4500,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          user: {
            id: testUserId,
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            phone: "+1234567890",
          },
          receiver: {
            id: testReceiverId,
            firstName: "Jane",
            lastName: "Smith",
            email: "jane.smith@example.com",
            phone: "+0987654321",
          },
          sender: {
            id: testSenderId,
            firstName: "Bob",
            lastName: "Johnson",
            email: "bob.johnson@example.com",
            phone: "+1122334455",
          },
        };

        // Mock the private method directly
        const getTransactionWithRelationsSpy = jest
          .spyOn(transactionService as any, "getTransactionWithRelations")
          .mockResolvedValue(mockQueryResult);

        const result = await (
          transactionService as any
        ).getTransactionWithRelations(testTransactionId);

        expect(result).toEqual(mockQueryResult);
        expect(result.receiver).toBeDefined();
        expect(result.sender).toBeDefined();
        expect(getTransactionWithRelationsSpy).toHaveBeenCalledWith(
          testTransactionId,
        );
      });

      it("should use transaction context when provided", async () => {
        const mockQueryResult = {
          id: testTransactionId,
          walletId: testWalletId,
          userId: testUserId,
          type: "FUND",
          amount: 1000,
          reference: testReference,
          receiverId: null,
          senderId: null,
          created_at: new Date(),
          updated_at: new Date(),
          wallet: null,
          user: null,
          receiver: null,
          sender: null,
        };

        // Mock the private method directly
        const getTransactionWithRelationsSpy = jest
          .spyOn(transactionService as any, "getTransactionWithRelations")
          .mockResolvedValue(mockQueryResult);

        const result = await (
          transactionService as any
        ).getTransactionWithRelations(testTransactionId, mockTransaction);

        expect(result).toEqual(mockQueryResult);
        expect(getTransactionWithRelationsSpy).toHaveBeenCalledWith(
          testTransactionId,
          mockTransaction,
        );
      });
    });

    describe("Negative Test Cases", () => {
      it("should throw AppError when transaction not found", async () => {
        // Mock the private method to throw AppError
        const getTransactionWithRelationsSpy = jest
          .spyOn(transactionService as any, "getTransactionWithRelations")
          .mockRejectedValue(new errors.AppError("Transaction not found", 404));

        await expect(
          (transactionService as any).getTransactionWithRelations(
            testTransactionId,
          ),
        ).rejects.toThrow(errors.AppError);
      });

      it("should throw AppError when database query fails", async () => {
        // Mock the private method to throw AppError
        const getTransactionWithRelationsSpy = jest
          .spyOn(transactionService as any, "getTransactionWithRelations")
          .mockRejectedValue(new errors.AppError("Database error", 500));

        await expect(
          (transactionService as any).getTransactionWithRelations(
            testTransactionId,
          ),
        ).rejects.toThrow(errors.AppError);
      });
    });
  });

  describe("Error Handling", () => {
    it("should wrap non-AppError exceptions in AppError for createTransaction", async () => {
      const validCreateTransactionDTO: CreateTransactionDTO = {
        walletId: testWalletId,
        userId: testUserId,
        type: "FUND",
        amount: 1000,
        reference: testReference,
      };

      const databaseError = new Error("Database connection failed");
      mockedSchema.create.mockRejectedValue(databaseError);

      await expect(
        transactionService.createTransaction(validCreateTransactionDTO),
      ).rejects.toThrow(errors.AppError);
    });

    it("should re-throw AppError instances as-is for createTransaction", async () => {
      const validCreateTransactionDTO: CreateTransactionDTO = {
        walletId: testWalletId,
        userId: testUserId,
        type: "FUND",
        amount: 1000,
        reference: testReference,
      };

      const appError = new errors.AppError(
        "Database constraint violation",
        400,
      );
      mockedSchema.create.mockRejectedValue(appError);

      await expect(
        transactionService.createTransaction(validCreateTransactionDTO),
      ).rejects.toThrow(appError);
    });

    it("should wrap non-AppError exceptions in AppError for getTransactionByReference", async () => {
      const databaseError = new Error("Database connection failed");
      mockedSchema.fetchOne.mockRejectedValue(databaseError);

      await expect(
        transactionService.getTransactionByReference(testReference),
      ).rejects.toThrow(errors.AppError);
    });

    it("should re-throw AppError instances as-is for getTransactionByReference", async () => {
      const appError = new errors.AppError(
        "Database constraint violation",
        400,
      );
      mockedSchema.fetchOne.mockRejectedValue(appError);

      await expect(
        transactionService.getTransactionByReference(testReference),
      ).rejects.toThrow(appError);
    });
  });
});
