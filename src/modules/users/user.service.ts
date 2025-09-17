import db from "../../database/connection";
import { CreateUserDTO, LoginDTO, UpdateUserDTO } from "./dto/user.dto";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { create, fetchOne, isUnique, update } from "../../utils/schema";
import {
  ConflictError,
  AppError,
  UnauthorizedError,
  NotFoundError,
} from "../../utils/errors";
import { hashPassword, verifyPassword, generateToken } from "../../utils/app";

// Define table names as constants
const USERS_TABLE = "users";
const WALLETS_TABLE = "wallets";

// Define UserRow type to match database schema
interface UserRow {
  id: string; // UUID
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  dob: string; // Date as string
  bvn: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  nokName?: string | null;
  nokPhone?: string | null;
  nokEmail?: string | null;
  nokRelationship?: string | null;
  created_at: Date;
  updated_at: Date;
}

export class UserService {
  async registerUser(payload: CreateUserDTO, initialBalance = 0) {
    try {
      // Check if email already exists
      const emailExists = await isUnique(USERS_TABLE, {
        email: payload.email.toLowerCase(),
      });
      if (!emailExists) {
        throw new ConflictError("Email already exists");
      }

      // Check if phone already exists
      if (payload.phone) {
        const phoneExists = await isUnique(USERS_TABLE, {
          phone: payload.phone,
        });
        if (!phoneExists) {
          throw new ConflictError("Phone number already exists");
        }
      }

      // Check if BVN already exists
      const bvnExists = await isUnique(USERS_TABLE, { bvn: payload.bvn });
      if (!bvnExists) {
        throw new ConflictError("BVN already exists");
      }

      const { user, walletId } = await this.createUserWithWallet(
        payload,
        initialBalance,
      );
      return { user, walletId };
    } catch (err: unknown) {
      // Re-throw AppError instances as-is, wrap others
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(
        `UserService.registerUser error: ${getErrorMessage(err)}`,
      );
    }
  }

  async createUserWithWallet(
    payload: CreateUserDTO,
    initialBalance = 0,
  ): Promise<{ user: UserRow; walletId: string }> {
    return await db.transaction(async (trx) => {
      try {
        const hashedPassword = await hashPassword(payload.password);

        const insertPayload = {
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email.toLowerCase(),
          phone: payload.phone,
          password: hashedPassword,
          dob: payload.dob,
          bvn: payload.bvn,
          addressLine1: payload.addressLine1 ?? null,
          addressLine2: payload.addressLine2 ?? null,
          city: payload.city ?? null,
          state: payload.state ?? null,
          country: payload.country ?? null,
          postalCode: payload.postalCode ?? null,
          nokName: payload.nokName ?? null,
          nokPhone: payload.nokPhone ?? null,
          nokEmail: payload.nokEmail ?? null,
          nokRelationship: payload.nokRelationship ?? null,
        };

        const createdUser = await create(USERS_TABLE, insertPayload, trx);

        const { password, ...user } = createdUser;

        const walletPayload = {
          user_id: user.id,
          balance: initialBalance,
        };

        const createdWallet = await create(WALLETS_TABLE, walletPayload, trx);

        return { user, walletId: createdWallet.id };
      } catch (err: unknown) {
        // trx will auto-rollback if this throws
        if (err instanceof AppError) {
          throw err;
        }
        throw new AppError(
          `createUserWithWallet error: ${getErrorMessage(err)}`,
        );
      }
    });
  }

  async loginUser(
    payload: LoginDTO,
  ): Promise<{ user: Omit<UserRow, "password">; token: string }> {
    try {
      // Find user by email
      const user = await fetchOne(USERS_TABLE, {
        email: payload.email.toLowerCase(),
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Verify password
      const isPasswordValid = await verifyPassword(
        payload.password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedError("Invalid email or password");
      }

      // Remove password from user object
      const { password, ...userWithoutPassword } = user;

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      return { user: userWithoutPassword, token };
    } catch (err: unknown) {
      // Re-throw AppError instances as-is, wrap others
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(
        `UserService.loginUser error: ${getErrorMessage(err)}`,
      );
    }
  }

  async updateUserProfile(
    userId: string,
    payload: UpdateUserDTO,
  ): Promise<Omit<UserRow, "password">> {
    try {
      // Check if user exists and is not deleted
      const existingUser = await fetchOne(USERS_TABLE, {
        id: userId,
      });

      if (!existingUser) {
        throw new NotFoundError("User not found");
      }

      // Check if phone number is being updated and if it's unique
      if (payload.phone && payload.phone !== existingUser.phone) {
        const phoneExists = await isUnique(USERS_TABLE, {
          phone: payload.phone,
        });
        if (!phoneExists) {
          throw new ConflictError("Phone number already exists");
        }
      }

      // Prepare update payload (only include fields that are provided)
      const updatePayload: Partial<UserRow> = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== undefined),
      );

      // Update user
      const updatedUser = await update(
        USERS_TABLE,
        { id: userId },
        updatePayload,
      );

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;

      return userWithoutPassword;
    } catch (err: unknown) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(
        `UserService.updateUserProfile error: ${getErrorMessage(err)}`,
      );
    }
  }
}
