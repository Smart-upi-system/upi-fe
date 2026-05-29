import { WalletType } from "./types";

export const WALLET_META: Record<WalletType, { emoji: string; label: string; themeClass: string }> = {
  MAIN: { emoji: "💳", label: "Main Wallet", themeClass: "theme-main" },
  SAVINGS: { emoji: "🏦", label: "Savings Wallet", themeClass: "theme-savings" },
  GOAL: { emoji: "🎯", label: "Goal Wallet", themeClass: "theme-goal" },
};