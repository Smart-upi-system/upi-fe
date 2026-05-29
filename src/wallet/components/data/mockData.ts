import { Wallet, Transaction } from "./types";

export const MOCK_WALLETS: Wallet[] = [
  {
    walletId: "wlt_9f3c2a1b-4d7e-4891-b663",
    userId: "usr_d4f7a2c1",
    walletType: "MAIN",
    balance: 24580.75,
    version: 42,
    active: true,
    lastUpdated: "2025-05-29T10:22:00",
    createdAt: "2024-11-03T09:41:00",
  },
  {
    walletId: "wlt_3a1b9c2d-7e4f-5892-c774",
    userId: "usr_d4f7a2c1",
    walletType: "SAVINGS",
    balance: 105200.0,
    version: 18,
    active: true,
    lastUpdated: "2025-05-28T08:15:00",
    createdAt: "2024-11-03T09:41:00",
  },
  {
    walletId: "wlt_7c5e3f4a-2b8d-6903-d885",
    userId: "usr_d4f7a2c1",
    walletType: "GOAL",
    balance: 32400.5,
    version: 9,
    goalId: "goal_macbook_pro",
    goalName: "MacBook Pro M4",
    active: true,
    lastUpdated: "2025-05-20T14:30:00",
    createdAt: "2025-01-15T11:00:00",
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "txn_001", type: "CREDIT", amount: 5000, description: "Salary credit", timestamp: "2025-05-29T09:00:00" },
  { id: "txn_002", type: "DEBIT", amount: 1200, description: "Electricity bill", timestamp: "2025-05-28T18:45:00" },
  { id: "txn_003", type: "DEBIT", amount: 450, description: "Swiggy order", timestamp: "2025-05-28T13:10:00" },
  { id: "txn_004", type: "CREDIT", amount: 2500, description: "Freelance payment", timestamp: "2025-05-27T11:30:00" },
  { id: "txn_005", type: "DEBIT", amount: 3200, description: "Amazon purchase", timestamp: "2025-05-26T16:00:00" },
  { id: "txn_006", type: "CREDIT", amount: 800, description: "Cashback reward", timestamp: "2025-05-25T09:20:00" },
];