# Lendsqr Backend Test - Technical Documentation

## Project Overview

This document outlines the technical decisions, implementation approaches, and architectural choices made during the development of the Lendsqr backend test project. The project implements a wallet management system with user registration, wallet operations, and transaction handling.

## Table of Contents

1. [Architecture Decisions](#architecture-decisions)
2. [Database Design](#database-design)
3. [API Design](#api-design)
4. [Transaction Service Implementation](#transaction-service-implementation)
5. [Data Transformation Challenges](#data-transformation-challenges)
6. [Testing Strategy](#testing-strategy)
7. [Error Handling](#error-handling)
8. [Security Considerations](#security-considerations)
9. [Performance Optimizations](#performance-optimizations)
10. [Future Improvements](#future-improvements)

## Architecture Decisions

### 1. Technology Stack

**Chosen Technologies:**
- **Node.js with TypeScript**: For type safety and better development experience
- **Express.js**: Lightweight web framework
- **Knex.js**: SQL query builder for database operations
- **MySQL**: Relational database for ACID compliance
- **Jest**: Testing framework with comprehensive mocking

**Reasoning:**
- TypeScript provides compile-time type checking, reducing runtime errors
- Knex.js offers a good balance between raw SQL and ORM complexity
- MySQL ensures data consistency for financial transactions
- Express.js provides flexibility without unnecessary complexity

### 2. Project Structure

```
src/
├── config/           # Database and application configuration
├── database/         # Database migrations and connection
├── middlewares/      # Authentication and validation middleware
├── modules/          # Feature-based modules
│   ├── users/        # User management
│   ├── wallets/      # Wallet operations
│   └── transactions/ # Transaction handling
├── routes/           # API route definitions
├── utils/            # Utility functions and helpers
└── validation-schema/ # Input validation schemas
```

**Reasoning:**
- Feature-based modules promote separation of concerns
- Clear separation between business logic and infrastructure
- Scalable structure for future feature additions

## Database Design

### 1. Table Structure

**Users Table:**
```sql
- id (UUID, Primary Key)
- firstName, lastName, email, phone
- bvn (Bank Verification Number)
- isDeleted (Soft delete flag)
- timestamps
```

**Wallets Table:**
```sql
- id (UUID, Primary Key)
- user_id (Foreign Key to users)
- balance (Decimal)
- isDeleted (Soft delete flag)
- timestamps
```

**Transactions Table:**
```sql
- id (UUID, Primary Key)
- walletId, userId (Foreign Keys)
- type (FUND, TRANSFER, WITHDRAW)
- amount (Decimal)
- reference (Unique string)
- receiverId, senderId (For transfers)
- isDeleted (Soft delete flag)
- timestamps
```

### 2. Key Design Decisions

**Soft Deletes:**
- Implemented `isDeleted` flag instead of hard deletes
- Preserves audit trail for financial data
- Allows data recovery if needed

**UUID Primary Keys:**
- Better security (non-sequential IDs)
- Easier to work with in distributed systems
- Prevents enumeration attacks

**Decimal for Money:**
- Used `DECIMAL(15,2)` for precise financial calculations
- Avoids floating-point precision issues
- Standard practice for financial applications

## API Design

### 1. RESTful Endpoints

**User Management:**
```
POST /api/users/register
POST /api/users/login
GET  /api/users/profile
```

**Wallet Operations:**
```
POST /api/wallets/fund
POST /api/wallets/transfer
POST /api/wallets/withdraw
GET  /api/wallets/balance
```

### 2. Request/Response Patterns

**Consistent Response Format:**
```typescript
interface ApiResponse<T> {
  status: 'success' | 'failure';
  statusCode: number;
  message: string;
  payload: T | null;
}
```

**Reasoning:**
- Consistent API responses improve client integration
- Clear error handling and status codes
- Type-safe payload structure

## Transaction Service Implementation

### 1. The Data Transformation Challenge

**Initial Problem:**
The original implementation manually transformed flat database query results into nested objects:

```typescript
// ❌ Manual transformation approach
const populatedTransaction = {
  ...result,
  wallet: result.wallet_id ? {
    id: result.wallet_id,
    userId: result.wallet_user_id,
    balance: result.wallet_balance,
    // ... more manual mapping
  } : null,
  // ... similar for user, receiver, sender
};
```

**Issues with Manual Approach:**
- Verbose and error-prone
- Difficult to maintain
- Repetitive code
- No type safety for transformations

### 2. Solution Evolution

**Attempt 1: Helper Functions**
```typescript
// Created utility functions for transformation
export function transformTransactionData(data: any) {
  // Generic transformation logic
}
```

**Attempt 2: Repository Pattern**
```typescript
// Attempted generic repository with relations
class Repository<T> {
  async getWithRelations(id: string, relations: RelationConfig[]): Promise<T>
}
```

**Final Solution: Database-Level JSON Aggregation**
```typescript
// ✅ Using MySQL JSON_OBJECT for automatic nesting
const result = await query(TRANSACTIONS_TABLE)
  .leftJoin('wallets', 'transactions.walletId', 'wallets.id')
  .leftJoin('users', 'transactions.userId', 'users.id')
  .select(
    'transactions.*',
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
    `)
    // ... similar for other relations
  )
  .first();
```

### 3. Why This Approach Won

**Benefits:**
1. **No Manual Transformation**: Database handles the JSON building
2. **Single Query**: Efficient with proper joins
3. **Type Safety**: Direct return with proper TypeScript types
4. **Maintainable**: Easy to add/remove relations
5. **Performance**: Database-optimized JSON aggregation

**Database Compatibility:**
- **PostgreSQL**: `json_build_object()`
- **MySQL**: `JSON_OBJECT()`
- **SQLite**: `json_object()`

## Data Transformation Challenges

### 1. The Problem

When joining multiple tables, SQL returns flat results:
```sql
SELECT transactions.*, wallets.id as wallet_id, wallets.balance as wallet_balance
FROM transactions 
LEFT JOIN wallets ON transactions.walletId = wallets.id
```

This creates:
```javascript
{
  id: "123",
  amount: 100,
  wallet_id: "456",      // ❌ Flat structure
  wallet_balance: 500,   // ❌ Not nested
  user_id: "789",
  user_email: "user@example.com"
}
```

### 2. Solutions Considered

**Option 1: Manual JavaScript Transformation**
```typescript
// ❌ Verbose and error-prone
const transformed = {
  ...transaction,
  wallet: wallet_id ? { id: wallet_id, balance: wallet_balance } : null
};
```

**Option 2: Separate Queries**
```typescript
// ❌ Multiple database calls
const transaction = await getTransaction(id);
const wallet = await getWallet(transaction.walletId);
const user = await getUser(transaction.userId);
```

**Option 3: ORM with Relations**
```typescript
// ❌ Adds complexity and learning curve
const transaction = await Transaction.find(id, {
  include: ['wallet', 'user', 'receiver', 'sender']
});
```

**Option 4: Database JSON Aggregation (Chosen)**
```typescript
// ✅ Single query, database does the work
const result = await query.raw(`
  SELECT transactions.*,
    JSON_OBJECT('id', wallets.id, 'balance', wallets.balance) as wallet
  FROM transactions
  LEFT JOIN wallets ON transactions.walletId = wallets.id
`);
```

### 3. Implementation Details

**MySQL Implementation:**
```sql
SELECT 
  transactions.*,
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
FROM transactions
LEFT JOIN wallets ON transactions.walletId = wallets.id
```

**Result:**
```javascript
{
  id: "123",
  amount: 100,
  wallet: {           // ✅ Properly nested
    id: "456",
    userId: "789",
    balance: 500,
    createdAt: "2025-01-18T10:00:00Z",
    updatedAt: "2025-01-18T10:00:00Z"
  }
}
```

## Testing Strategy

### 1. Test Structure

**Unit Tests:**
- Service layer testing with mocked dependencies
- Isolated business logic testing
- Comprehensive error scenario coverage

**Integration Tests:**
- API endpoint testing
- Database transaction testing
- End-to-end workflow validation

### 2. Mocking Strategy

**Database Mocking:**
```typescript
jest.mock('../../../utils/schema');
jest.mock('../../../database/connection');
```

**Service Mocking:**
```typescript
jest.mock('../../transactions/transaction.service');
```

**Transaction Mocking:**
```typescript
mockedDb.transaction.mockImplementation(async (callback) => {
  return await callback(mockTransaction as any);
});
```

### 3. Test Challenges and Solutions

**Challenge: Mock State Persistence**
- Tests were failing due to mock state persisting between tests
- **Solution**: Proper mock reset in `beforeEach`

**Challenge: Complex Service Dependencies**
- Transaction service dependencies were complex to mock
- **Solution**: Comprehensive mock setup for each test scenario

**Challenge: Database Transaction Testing**
- Testing database transactions with proper rollback
- **Solution**: Mock transaction callbacks with proper error handling

## Error Handling

### 1. Custom Error Classes

```typescript
export class AppError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'AppError';
  }
}

export class InsufficientFundsError extends AppError {
  constructor() {
    super('Insufficient funds for this transaction', 400);
  }
}
```

### 2. Error Handling Strategy

**Service Layer:**
- Custom errors for business logic violations
- Proper error propagation with context
- Consistent error messages

**API Layer:**
- Centralized error handling middleware
- Consistent error response format
- Proper HTTP status codes

**Database Layer:**
- Transaction rollback on errors
- Connection error handling
- Query timeout handling

## Security Considerations

### 1. Input Validation

**Schema Validation:**
```typescript
const userSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required()
});
```

**Business Logic Validation:**
- Amount validation (positive numbers only)
- Email format validation
- Phone number format validation
- BVN format validation

### 2. Data Protection

**Soft Deletes:**
- No hard deletion of financial data
- Audit trail preservation
- Data recovery capabilities

**Input Sanitization:**
- SQL injection prevention through parameterized queries
- XSS protection through input validation
- CSRF protection through proper headers

### 3. Financial Security

**Transaction Integrity:**
- Database transactions for atomicity
- Balance validation before operations
- Duplicate transaction prevention

**Amount Validation:**
- Positive amount validation
- Decimal precision handling
- Overflow protection

## Performance Optimizations

### 1. Database Optimizations

**Single Query Approach:**
- Reduced database round trips
- Efficient joins with proper indexing
- JSON aggregation at database level

**Connection Pooling:**
- Knex.js connection pooling
- Proper connection management
- Query timeout handling


### 32 Query Optimization

**Indexing Strategy:**
```sql
-- User table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

-- Wallet table indexes
CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- Transaction table indexes
CREATE INDEX idx_transactions_wallet_id ON transactions(walletId);
CREATE INDEX idx_transactions_reference ON transactions(reference);
```

## Future Improvements (API Could be improved in the following ways)

### 1. Architecture Enhancements

**Microservices Migration:**
- Separate services for users, wallets, transactions
- API Gateway for request routing
- Event-driven architecture for transaction processing

**Message Queue Integration:**
- RabbitMQ or Apache Kafka for async processing
- Transaction event publishing
- Audit log streaming

### 2. Feature Additions

**Advanced Transaction Features:**
- Transaction categories and tags
- Recurring transactions
- Transaction limits and controls
- Multi-currency support

**Analytics and Reporting:**
- Transaction analytics dashboard
- Spending pattern analysis
- Financial reporting features

### 3. Security Enhancements

**Advanced Security:**
- OAuth 2.0 / OpenID Connect integration
- Multi-factor authentication
- Fraud detection algorithms
- Advanced audit logging

**Compliance:**
- PCI DSS compliance for payment processing
- GDPR compliance for data protection
- Financial regulation compliance

## Conclusion

The implementation successfully addresses the core requirements while maintaining clean, maintainable code. The key technical decisions were:

1. **Database-level JSON aggregation** for efficient data transformation
2. **Comprehensive error handling** with custom error classes
3. **Thorough testing strategy** with proper mocking
4. **Security-first approach** with input validation and soft deletes
5. **Scalable architecture** with clear separation of concerns

The solution provides a solid foundation for a production-ready wallet management system while maintaining code quality and performance standards.

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <token>
```

### Endpoints

#### User Management
- `POST /users/register` - Register new user
- `POST /users/login` - User login
- `GET /users/profile` - Get user profile

#### Wallet Operations
- `POST /wallets/fund` - Fund wallet
- `POST /wallets/transfer` - Transfer funds
- `POST /wallets/withdraw` - Withdraw funds
- `GET /wallets/balance` - Get wallet balance

### Response Format
```json
{
  "status": "success|failure",
  "statusCode": 200,
  "message": "Operation successful",
  "payload": {
    // Response data
  }
}
```

### Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `404` - Not Found (resource not found)
- `500` - Internal Server Error (system errors)

This documentation provides a comprehensive overview of the technical decisions and implementation details for the Lendsqr backend test project.
