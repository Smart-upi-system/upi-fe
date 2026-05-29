export type WalletType = "MAIN" | "SAVINGS" | "GOAL";

export interface Wallet {
  walletId: string;
  userId: string;
  walletType: WalletType;
  balance: number;
  version: number;
  goalId?: string;
  goalName?: string;
  active: boolean;
  lastUpdated: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  description: string;
  timestamp: string;
}