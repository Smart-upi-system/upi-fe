import { baseApi } from "./baseApi";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WalletBalanceResponse {
  balance: string; // backend returns string
}

export interface WalletResponse {
  walletId: string;
  userId: string;
  walletType: "MAIN" | "SAVINGS" | "GOAL";
  balance: number;
  version: number;
  goalId?: string;
  goalName?: string;
  active: boolean;
  lastUpdated: string;
  createdAt: string;
}

export interface WalletsListResponse {
  wallets: WalletResponse[];
}

// ── API ───────────────────────────────────────────────────────────────────────

export const walletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBalance: builder.query<WalletBalanceResponse, void>({
      query: () => ({
        url: "/wallet/getBalance",  // matches backend @GetMapping("/wallet/getBalance") via gateway
        method: "GET",
      }),
      transformResponse: (response: WalletBalanceResponse) => response,
      providesTags: ["Wallet"],
    }),

    getWallets: builder.query<WalletResponse[], void>({
      query: () => ({
        url: "/wallet/list",  // matches backend @GetMapping("/wallet/list") via gateway
        method: "GET",
      }),
      transformResponse: (response: WalletResponse[]) => response,
      providesTags: ["Wallet"],
    }),
  }),
});

export const {
  useGetBalanceQuery,
  useGetWalletsQuery,
} = walletApi;