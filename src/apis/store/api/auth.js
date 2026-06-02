import { baseApi } from "./baseApi";

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) =>({
            register : builder.mutation({
                query: (payload) => ({
                    url: '/auth/register',
                    method: 'POST',
                    body: payload
                }),
                transformResponse: (response)=>{
                    if(response.accessToken){
                        localStorage.setItem('accessToken', response.accessToken);
                    }
                    if(response.refreshToken){
                        localStorage.setItem('refreshToken', response.refreshToken);
                    }
                    return response;
                }
            }),

            login : builder.mutation({
                query: (payload) => ({
                    url: '/auth/login',
                    method: 'POST',
                    body: payload
                }),
                transformResponse: (response)=>{
                    if(response.accessToken){
                        localStorage.setItem('accessToken', response.accessToken);
                    }
                    if(response.refreshToken){
                        localStorage.setItem('refreshToken', response.refreshToken);
                    }
                    return response;
                }
            }),

            logout : builder.mutation({
                query: (refreshToken)=>({
                    url: '/auth/logout',
                    method: 'POST',
                    body: {refreshToken},
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

            })

        })
});

export const {useRegisterMutation,
    useLoginMutation,
    useLogoutMutation,} = authApi;

 