import { baseApi } from "./baseApi";

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  [key: string]: any;
}

interface LoginRequest {
  identifier?: string;
  email?: string;
  password: string;
  [key: string]: any;
}
interface AuthRequest {
    username? :string;
    name? :string;
    email? :string;
    password: string;
}

interface SetUpiPinRequest {
    currentPassword: string;
    newPin: string;
    confirmPin: string;
}

export interface UpiPinStatus {
    configured: boolean;
    locked: boolean;
}

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
            register: builder.mutation<AuthResponse, AuthRequest>({
                query: (payload) => ({
                    url: '/auth/register',
                    method: 'POST',
                    body: payload
                }),
                transformResponse: (response: AuthResponse) => {
                    if(response.accessToken){
                        localStorage.setItem('accessToken', response.accessToken);
                    }
                    if(response.refreshToken){
                        localStorage.setItem('refreshToken', response.refreshToken);
                    }
                    return response;
                }
            }),

            login: builder.mutation<AuthResponse, LoginRequest>({
                query: (payload) => ({
                    url: '/auth/login',
                    method: 'POST',
                    body: payload
                }),
                transformResponse: (response: AuthResponse) => {
                    if(response.accessToken){
                        localStorage.setItem('accessToken', response.accessToken);
                    }
                    if(response.refreshToken){
                        localStorage.setItem('refreshToken', response.refreshToken);
                    }
                    return response;
                }
            }),

            logout: builder.mutation<void, string>({
                query: (refreshToken) => ({
                    url: '/auth/logout',
                    method: 'POST',
                    body: { refreshToken },
                }),
              onQueryStarted: async (_, { queryFulfilled }) => {
    try {
        await queryFulfilled;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    } catch (err) {
        console.error('Logout failed:', err);
    }
}

            }),

            getUpiPinStatus: builder.query<UpiPinStatus, void>({
                query: () => ({
                    url: '/auth/upi-pin/status',
                    method: 'GET',
                }),
            }),

            setUpiPin: builder.mutation<UpiPinStatus, SetUpiPinRequest>({
                query: (payload) => ({
                    url: '/auth/upi-pin',
                    method: 'PUT',
                    body: payload,
                }),
            }),

        })
});

export const {
    useRegisterMutation,
    useLoginMutation,
    useLogoutMutation,
    useGetUpiPinStatusQuery,
    useSetUpiPinMutation,
} = authApi;
