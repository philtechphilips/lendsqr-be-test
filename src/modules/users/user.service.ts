import db from "../../database/connection";
import { CreateUserDTO } from "./dto/user.dto";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { create, fetchOne, isUnique } from "../../utils/schema";
import { ConflictError, AppError } from "../../utils/errors";
import { hashPassword, verifyPassword } from "../../utils/password";

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
}
