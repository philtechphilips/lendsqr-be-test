// Test setup file
// This file runs before all tests

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.KARMA_TOKEN = "test-karma-token";
process.env.JWT_SECRET = "test-jwt-secret";

// Mock the entire database connection module
jest.mock("../database/connection", () => ({
  __esModule: true,
  default: {
    transaction: jest.fn(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    first: jest.fn(),
    orderBy: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
  },
}));

// Global test timeout
jest.setTimeout(10000);
