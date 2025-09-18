import { UserService } from "../user.service";
import { CreateUserDTO, LoginDTO, UpdateUserDTO } from "../dto/user.dto";
import * as schema from "../../../utils/schema";
import * as app from "../../../utils/app";
import * as errors from "../../../utils/errors";
import axios from "axios";
import db from "../../../database/connection";

// Mock all dependencies
jest.mock("../../../utils/schema");
jest.mock("../../../utils/app");
jest.mock("axios");
jest.mock("../../../database/connection");

const mockedSchema = schema as jest.Mocked<typeof schema>;
const mockedApp = app as jest.Mocked<typeof app>;
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedDb = db as jest.Mocked<typeof db>;

describe("UserService", () => {
  let userService: UserService;
  let mockTransaction: jest.Mock;

  // Hardcoded UUID strings for testing
  const testUserId = "550e8400-e29b-41d4-a716-446655440000";
  const testWalletId = "550e8400-e29b-41d4-a716-446655440001";
  const testJwtToken = "550e8400-e29b-41d4-a716-446655440002";

  beforeEach(() => {
    userService = new UserService();
    mockTransaction = jest.fn();
    mockedDb.transaction.mockImplementation(async (callback) => {
      return await callback(mockTransaction as any);
    });

    // Reset all mocks
    jest.clearAllMocks();

    // Set up environment variable
    process.env.KARMA_TOKEN = "test-karma-token";
  });

  afterEach(() => {
    delete process.env.KARMA_TOKEN;
  });

  describe("registerUser", () => {
    const validCreateUserDTO: CreateUserDTO = {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
      password: "password123",
      dob: "1990-01-01",
      bvn: "12345678901",
      addressLine1: "123 Main St",
      city: "New York",
      state: "NY",
      country: "USA",
      postalCode: "10001",
    };

    describe("Positive Test Cases", () => {
      it("should successfully register a user when Karma verification passes", async () => {
        // Mock Karma API success response
        const karmaResponse = {
          data: {
            status: "success",
            message: "Successful",
            "mock-response":
              "This is a mock response as your app is currently in test mode. Complete your KYC here: https://lsq.li/adjutor-kyc to access live data, and if you have, kindly toggle your app to live mode. If you have enquiries, reach out to api@lendsqr.com and we'll be more than happy to provide you with assistance.",
            data: {
              karma_identity: "john.doe@example.com",
              amount_in_contention: "0.00",
              reason: null,
              default_date: "2020-05-18",
              karma_type: { karma: "Others" },
              karma_identity_type: { identity_type: "Email" },
              reporting_entity: {
                name: "Blinkcash",
                email: "support@blinkcash.ng",
              },
            },
            meta: { cost: 10, balance: 1600 },
          },
        };
        mockedAxios.get.mockResolvedValue(karmaResponse);

        // Mock schema functions
        mockedSchema.isUnique.mockResolvedValue(true);
        mockedSchema.create.mockResolvedValue({
          id: testUserId,
          ...validCreateUserDTO,
          password: "hashed-password",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Mock app functions
        mockedApp.hashPassword.mockResolvedValue("hashed-password");

        const result = await userService.registerUser(validCreateUserDTO);

        expect(result).toHaveProperty("user");
        expect(result).toHaveProperty("walletId");
        expect(mockedAxios.get).toHaveBeenCalledWith(
          "https://adjutor.lendsqr.com/v2/verification/karma/john.doe%40example.com",
          expect.objectContaining({
            timeout: 30000,
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer test-karma-token",
            },
          }),
        );
      });

      it("should handle mock response from Karma API (test mode)", async () => {
        // Mock Karma API mock response (test mode)
        const karmaResponse = {
          data: {
            status: "success",
            message: "Successful",
            "mock-response":
              "This is a mock response as your app is currently in test mode. Complete your KYC here: https://lsq.li/adjutor-kyc to access live data, and if you have, kindly toggle your app to live mode. If you have enquiries, reach out to api@lendsqr.com and we'll be more than happy to provide you with assistance.",
            data: {
              karma_identity: "0zspgifzbo.ga",
              amount_in_contention: "0.00",
              reason: null,
              default_date: "2020-05-18",
              karma_type: { karma: "Others" },
              karma_identity_type: { identity_type: "Domain" },
              reporting_entity: {
                name: "Blinkcash",
                email: "support@blinkcash.ng",
              },
            },
            meta: { cost: 10, balance: 1600 },
          },
        };
        mockedAxios.get.mockResolvedValue(karmaResponse);

        // Mock schema functions
        mockedSchema.isUnique.mockResolvedValue(true);
        mockedSchema.create.mockResolvedValue({
          id: testUserId,
          ...validCreateUserDTO,
          password: "hashed-password",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Mock app functions
        mockedApp.hashPassword.mockResolvedValue("hashed-password");

        const result = await userService.registerUser(validCreateUserDTO);

        expect(result).toHaveProperty("user");
        expect(result).toHaveProperty("walletId");
      });

      it("should allow registration when Karma API fails (fallback behavior)", async () => {
        // Mock Karma API failure
        mockedAxios.get.mockRejectedValue(new Error("API Error"));

        // Mock schema functions
        mockedSchema.isUnique.mockResolvedValue(true);
        mockedSchema.create.mockResolvedValue({
          id: testUserId,
          ...validCreateUserDTO,
          password: "hashed-password",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Mock app functions
        mockedApp.hashPassword.mockResolvedValue("hashed-password");

        const result = await userService.registerUser(validCreateUserDTO);

        expect(result).toHaveProperty("user");
        expect(result).toHaveProperty("walletId");
      });
    });

    describe("Negative Test Cases", () => {
      it("should throw KarmaVerificationError when user is not eligible", async () => {
        // Mock Karma API response with issues
        const karmaResponse = {
          data: {
            status: "success",
            message: "Successful",
            data: {
              karma_identity: "john.doe@example.com",
              amount_in_contention: "1000.00",
              reason: "Fraud detected",
              default_date: "2020-05-18",
              karma_type: { karma: "Others" },
              karma_identity_type: { identity_type: "Email" },
              reporting_entity: {
                name: "Test Entity",
                email: "test@entity.com",
              },
            },
            meta: { cost: 10, balance: 1600 },
          },
        };
        mockedAxios.get.mockResolvedValue(karmaResponse);

        await expect(
          userService.registerUser(validCreateUserDTO),
        ).rejects.toThrow(errors.KarmaVerificationError);
      });

      it("should throw ConflictError when email already exists", async () => {
        // Mock Karma API success
        const karmaResponse = {
          data: {
            status: "success",
            message: "Successful",
            data: {
              karma_identity: "john.doe@example.com",
              amount_in_contention: "0.00",
              reason: null,
              default_date: "2020-05-18",
              karma_type: { karma: "Others" },
              karma_identity_type: { identity_type: "Email" },
              reporting_entity: {
                name: "Test Entity",
                email: "test@entity.com",
              },
            },
            meta: { cost: 10, balance: 1600 },
          },
        };
        mockedAxios.get.mockResolvedValue(karmaResponse);

        // Mock email already exists
        mockedSchema.isUnique.mockResolvedValue(false);

        await expect(
          userService.registerUser(validCreateUserDTO),
        ).rejects.toThrow(errors.ConflictError);
      });

      it("should throw ConflictError when phone already exists", async () => {
        // Mock Karma API success
        const karmaResponse = {
          data: {
            status: "success",
            message: "Successful",
            data: {
              karma_identity: "john.doe@example.com",
              amount_in_contention: "0.00",
              reason: null,
              default_date: "2020-05-18",
              karma_type: { karma: "Others" },
              karma_identity_type: { identity_type: "Email" },
              reporting_entity: {
                name: "Test Entity",
                email: "test@entity.com",
              },
            },
            meta: { cost: 10, balance: 1600 },
          },
        };
        mockedAxios.get.mockResolvedValue(karmaResponse);

        // Mock email exists but phone doesn't
        mockedSchema.isUnique
          .mockResolvedValueOnce(true) // email check
          .mockResolvedValueOnce(false); // phone check

        await expect(
          userService.registerUser(validCreateUserDTO),
        ).rejects.toThrow(errors.ConflictError);
      });

      it("should throw ConflictError when BVN already exists", async () => {
        // Mock Karma API success
        const karmaResponse = {
          data: {
            status: "success",
            message: "Successful",
            data: {
              karma_identity: "john.doe@example.com",
              amount_in_contention: "0.00",
              reason: null,
              default_date: "2020-05-18",
              karma_type: { karma: "Others" },
              karma_identity_type: { identity_type: "Email" },
              reporting_entity: {
                name: "Test Entity",
                email: "test@entity.com",
              },
            },
            meta: { cost: 10, balance: 1600 },
          },
        };
        mockedAxios.get.mockResolvedValue(karmaResponse);

        // Mock email and phone exist but BVN doesn't
        mockedSchema.isUnique
          .mockResolvedValueOnce(true) // email check
          .mockResolvedValueOnce(true) // phone check
          .mockResolvedValueOnce(false); // BVN check

        await expect(
          userService.registerUser(validCreateUserDTO),
        ).rejects.toThrow(errors.ConflictError);
      });
    });
  });

  describe("loginUser", () => {
    const validLoginDTO: LoginDTO = {
      email: "john.doe@example.com",
      password: "password123",
    };

    const mockUser = {
      id: testUserId,
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
      password: "hashed-password",
      dob: "1990-01-01",
      bvn: "12345678901",
      created_at: new Date(),
      updated_at: new Date(),
    };

    describe("Positive Test Cases", () => {
      it("should successfully login user with valid credentials", async () => {
        // Mock schema functions
        mockedSchema.fetchOne.mockResolvedValue(mockUser);
        mockedApp.verifyPassword.mockResolvedValue(true);
        mockedApp.generateToken.mockReturnValue(testJwtToken);

        const result = await userService.loginUser(validLoginDTO);

        expect(result).toHaveProperty("user");
        expect(result).toHaveProperty("token");
        expect(result.token).toBe(testJwtToken);
        expect(result.user).not.toHaveProperty("password");
        expect(mockedApp.generateToken).toHaveBeenCalledWith({
          userId: testUserId,
          email: "john.doe@example.com",
        });
      });
    });

    describe("Negative Test Cases", () => {
      it("should throw NotFoundError when user does not exist", async () => {
        mockedSchema.fetchOne.mockResolvedValue(null);

        await expect(userService.loginUser(validLoginDTO)).rejects.toThrow(
          errors.NotFoundError,
        );
      });

      it("should throw UnauthorizedError when password is invalid", async () => {
        mockedSchema.fetchOne.mockResolvedValue(mockUser);
        mockedApp.verifyPassword.mockResolvedValue(false);

        await expect(userService.loginUser(validLoginDTO)).rejects.toThrow(
          errors.UnauthorizedError,
        );
      });
    });
  });

  describe("updateUserProfile", () => {
    const userId = testUserId;
    const updateDTO: UpdateUserDTO = {
      firstName: "Jane",
      lastName: "Smith",
      phone: "+0987654321",
    };

    const existingUser = {
      id: userId,
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
      password: "hashed-password",
      dob: "1990-01-01",
      bvn: "12345678901",
      created_at: new Date(),
      updated_at: new Date(),
    };

    describe("Positive Test Cases", () => {
      it("should successfully update user profile", async () => {
        // Mock schema functions
        mockedSchema.fetchOne.mockResolvedValue(existingUser);
        mockedSchema.isUnique.mockResolvedValue(true);
        mockedSchema.update.mockResolvedValue({
          ...existingUser,
          ...updateDTO,
        });

        const result = await userService.updateUserProfile(userId, updateDTO);

        expect(result).not.toHaveProperty("password");
        expect(result.firstName).toBe("Jane");
        expect(result.lastName).toBe("Smith");
        expect(result.phone).toBe("+0987654321");
      });

      it("should update user profile without phone uniqueness check when phone is not changed", async () => {
        const updateWithoutPhone: UpdateUserDTO = {
          firstName: "Jane",
          lastName: "Smith",
        };

        mockedSchema.fetchOne.mockResolvedValue(existingUser);
        mockedSchema.update.mockResolvedValue({
          ...existingUser,
          ...updateWithoutPhone,
        });

        const result = await userService.updateUserProfile(
          userId,
          updateWithoutPhone,
        );

        expect(result).not.toHaveProperty("password");
        expect(result.firstName).toBe("Jane");
        expect(result.lastName).toBe("Smith");
        expect(mockedSchema.isUnique).not.toHaveBeenCalled();
      });
    });

    describe("Negative Test Cases", () => {
      it("should throw NotFoundError when user does not exist", async () => {
        mockedSchema.fetchOne.mockResolvedValue(null);

        await expect(
          userService.updateUserProfile(userId, updateDTO),
        ).rejects.toThrow(errors.NotFoundError);
      });

      it("should throw ConflictError when phone number already exists", async () => {
        mockedSchema.fetchOne.mockResolvedValue(existingUser);
        mockedSchema.isUnique.mockResolvedValue(false);

        await expect(
          userService.updateUserProfile(userId, updateDTO),
        ).rejects.toThrow(errors.ConflictError);
      });
    });
  });

  describe("createUserWithWallet", () => {
    const validCreateUserDTO: CreateUserDTO = {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
      password: "password123",
      dob: "1990-01-01",
      bvn: "12345678901",
    };

    describe("Positive Test Cases", () => {
      it("should successfully create user with wallet", async () => {
        // Mock schema functions
        mockedSchema.create
          .mockResolvedValueOnce({
            id: testUserId,
            ...validCreateUserDTO,
            password: "hashed-password",
            created_at: new Date(),
            updated_at: new Date(),
          })
          .mockResolvedValueOnce({
            id: testWalletId,
            user_id: testUserId,
            balance: 0,
            created_at: new Date(),
            updated_at: new Date(),
          });

        // Mock app functions
        mockedApp.hashPassword.mockResolvedValue("hashed-password");

        const result = await userService.createUserWithWallet(
          validCreateUserDTO,
          100,
        );

        expect(result).toHaveProperty("user");
        expect(result).toHaveProperty("walletId");
        expect(result.walletId).toBe(testWalletId);
        expect(result.user).not.toHaveProperty("password");
      });
    });

    describe("Negative Test Cases", () => {
      it("should handle transaction rollback on error", async () => {
        // Mock schema functions to throw error
        mockedSchema.create.mockRejectedValue(new Error("Database error"));
        mockedApp.hashPassword.mockResolvedValue("hashed-password");

        await expect(
          userService.createUserWithWallet(validCreateUserDTO),
        ).rejects.toThrow(errors.AppError);
      });
    });
  });

  describe("Karma Verification", () => {
    describe("getKarmaDetails", () => {
      it("should return karma details when API call succeeds", async () => {
        const mockResponse = {
          data: {
            status: "success",
            message: "Successful",
            data: {
              karma_identity: "test@example.com",
              amount_in_contention: "0.00",
              reason: null,
              default_date: "2020-05-18",
              karma_type: { karma: "Others" },
              karma_identity_type: { identity_type: "Email" },
              reporting_entity: {
                name: "Test Entity",
                email: "test@entity.com",
              },
            },
            meta: { cost: 10, balance: 1600 },
          },
        };

        mockedAxios.get.mockResolvedValue(mockResponse);

        // Access private method for testing
        const result = await (userService as any).getKarmaDetails(
          "test@example.com",
        );

        expect(result).toEqual(mockResponse.data);
        expect(mockedAxios.get).toHaveBeenCalledWith(
          "https://adjutor.lendsqr.com/v2/verification/karma/test%40example.com",
          expect.objectContaining({
            timeout: 30000,
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer test-karma-token",
            },
          }),
        );
      });

      it("should return null when API call fails", async () => {
        mockedAxios.get.mockRejectedValue(new Error("API Error"));

        const result = await (userService as any).getKarmaDetails(
          "test@example.com",
        );

        expect(result).toBeNull();
      });

      it("should handle network timeout", async () => {
        const timeoutError = new Error("timeout of 30000ms exceeded");
        timeoutError.name = "TimeoutError";
        mockedAxios.get.mockRejectedValue(timeoutError);

        const result = await (userService as any).getKarmaDetails(
          "test@example.com",
        );

        expect(result).toBeNull();
      });

      it("should handle 401 unauthorized error", async () => {
        const unauthorizedError = {
          response: {
            status: 401,
            statusText: "Unauthorized",
            data: { message: "Invalid token" },
          },
        };
        mockedAxios.get.mockRejectedValue(unauthorizedError);

        const result = await (userService as any).getKarmaDetails(
          "test@example.com",
        );

        expect(result).toBeNull();
      });
    });
  });

  describe("Error Handling", () => {
    it("should wrap non-AppError exceptions in AppError", async () => {
      const validCreateUserDTO: CreateUserDTO = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        password: "password123",
        dob: "1990-01-01",
        bvn: "12345678901",
      };

      // Mock Karma API success
      const karmaResponse = {
        data: {
          status: "success",
          message: "Successful",
          data: {
            karma_identity: "john.doe@example.com",
            amount_in_contention: "0.00",
            reason: null,
            default_date: "2020-05-18",
            karma_type: { karma: "Others" },
            karma_identity_type: { identity_type: "Email" },
            reporting_entity: { name: "Test Entity", email: "test@entity.com" },
          },
          meta: { cost: 10, balance: 1600 },
        },
      };
      mockedAxios.get.mockResolvedValue(karmaResponse);

      // Mock schema functions to throw non-AppError
      mockedSchema.isUnique.mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(
        userService.registerUser(validCreateUserDTO),
      ).rejects.toThrow(errors.AppError);
    });

    it("should re-throw AppError instances as-is", async () => {
      const validCreateUserDTO: CreateUserDTO = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        password: "password123",
        dob: "1990-01-01",
        bvn: "12345678901",
      };

      // Mock Karma API success
      const karmaResponse = {
        data: {
          status: "success",
          message: "Successful",
          data: {
            karma_identity: "john.doe@example.com",
            amount_in_contention: "0.00",
            reason: null,
            default_date: "2020-05-18",
            karma_type: { karma: "Others" },
            karma_identity_type: { identity_type: "Email" },
            reporting_entity: { name: "Test Entity", email: "test@entity.com" },
          },
          meta: { cost: 10, balance: 1600 },
        },
      };
      mockedAxios.get.mockResolvedValue(karmaResponse);

      const conflictError = new errors.ConflictError("Email already exists");
      mockedSchema.isUnique.mockRejectedValue(conflictError);

      await expect(
        userService.registerUser(validCreateUserDTO),
      ).rejects.toThrow(conflictError);
    });
  });
});
