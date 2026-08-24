import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = 'http://localhost:8080';
// console.log('BASE_URL loaded:', BASE_URL, 'VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
console.log('BASE_URL:', BASE_URL); // Add this line temporarily
export const baseApi = createApi({
  reducerPath: 'api',          // name of the slice in Redux state
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      // Attach auth token if you store it (e.g., in localStorage)
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      // Attach X-User-Id header from localStorage (set after login)
      const userId = localStorage.getItem('userId');
      if (userId) {
        headers.set('X-User-Id', userId);
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'Wallet', 'Transaction', 'Notification'], // for cache invalidation
  endpoints: () => ({}),       // endpoints will be injected from feature modules
});
