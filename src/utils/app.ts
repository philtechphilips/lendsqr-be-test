import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || "Secret$123";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";

// Password Configuration
const SALT_ROUNDS = 12;

// JWT Types
export interface JWTPayload {
  userId: string;
  email: string;
}

// JWT Functions
export function generateToken(payload: JWTPayload): string {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  } catch (error) {
    throw new Error(
      `Token generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error(
      `Token verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Password Functions
export async function hashPassword(plainPassword: string): Promise<string> {
  try {
    return await bcrypt.hash(plainPassword, SALT_ROUNDS);
  } catch (error) {
    throw new Error(
      `Password hashing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    throw new Error(
      `Password verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
