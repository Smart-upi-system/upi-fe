import { useCallback } from "react";
import { useGetNotificationsQuery, useGetUnreadCountQuery, useMarkAsReadMutation } from "../apis/store/api/notification";

export function useNotifications(page = 0, size = 20) {
  const { data, isLoading, isError, refetch } = useGetNotificationsQuery({ page, size });
  const { data: unreadData } = useGetUnreadCountQuery();
  const [markAsRead] = useMarkAsReadMutation();

  const notifications = data?.notifications ?? [];
  const unreadCount = unreadData?.unreadCount ?? 0;

  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await markAsRead(notificationId).unwrap();
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    },
    [markAsRead]
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    isError,
    refetch,
    markAsRead: handleMarkAsRead,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.currentPage ?? 0,
    hasNext: data?.hasNext ?? false,
    hasPrevious: data?.hasPrevious ?? false,
  };
}

export function useUnreadCount() {
  const { data } = useGetUnreadCountQuery();
  return data?.unreadCount ?? 0;
}