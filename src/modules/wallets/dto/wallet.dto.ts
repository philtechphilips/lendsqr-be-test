export interface FundWalletDTO {
  amount: number;
  reference?: string;
}

export interface TransferFundsDTO {
  recipientEmail: string;
  amount: number;
  reference?: string;
}

export interface WithdrawFundsDTO {
  amount: number;
  reference?: string;
}

export interface WalletResponse {
  id: string;
  userId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface TransactionResponse {
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
  wallet?: WalletResponse; // Populated wallet data
  user?: UserResponse; // Populated user data
  receiver?: UserResponse; // Populated receiver data
  sender?: UserResponse; // Populated sender data
}

export interface FundWalletResponse {
  wallet: WalletResponse;
  transaction: TransactionResponse;
}

export interface TransferFundsResponse {
  transaction: TransactionResponse;
}

export interface WithdrawFundsResponse {
  wallet: WalletResponse;
  transaction: TransactionResponse;
}
