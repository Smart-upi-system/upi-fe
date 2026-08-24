import { baseApi } from "./baseApi";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NotificationResponse {
  notificationId: string;
  userId: string;
  role: "DEBITOR" | "CREDITOR";
  type: "TRANSACTION_COMPLETED" | "TRANSACTION_FAILED" | "TRANSACTION_REVERSED";
  title: string;
  message: string;
  transactionId: string;
  amount: number;
  currency: string;
  counterpartyId: string;
  read: boolean;
  createdAt: string; // ISO date string
}

export interface NotificationPageResponse {
  notifications: NotificationResponse[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  unreadCount: number;
}

export interface MarkAsReadResponse {
  notificationId: string;
  read: boolean;
  readAt: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationPageResponse, { page?: number; size?: number }>({
      query: ({ page = 0, size = 20 }) => ({
        url: `/notification?page=${page}&size=${size}`,
        method: "GET",
      }),
      transformResponse: (response: NotificationPageResponse) => response,
      providesTags: (result) =>
        result
          ? [
              ...result.notifications.map(({ notificationId }) => ({ type: "Notification" as const, id: notificationId })),
              { type: "Notification" as const, id: "LIST" },
            ]
          : [{ type: "Notification" as const, id: "LIST" }],
    }),

    getUnreadCount: builder.query<UnreadCountResponse, void>({
      query: () => ({
        url: "/notification/unread-count",
        method: "GET",
      }),
      transformResponse: (response: UnreadCountResponse) => response,
      providesTags: [{ type: "Notification", id: "UNREAD_COUNT" }],
    }),

    markAsRead: builder.mutation<MarkAsReadResponse, string>({
      query: (notificationId) => ({
        url: `/notification/${notificationId}/read`,
        method: "PATCH",
      }),
      transformResponse: (response: MarkAsReadResponse) => response,
      invalidatesTags: (result, error, notificationId) => [
        { type: "Notification", id: notificationId },
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "UNREAD_COUNT" },
      ],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
} = notificationApi;