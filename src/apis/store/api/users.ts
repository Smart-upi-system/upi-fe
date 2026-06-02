import { baseApi } from "./baseApi";

// @GetMapping("/profile")
    // public ResponseEntity<UserProfileResponse> getProfile(@RequestHeader("X-User-Id")  String userId){

interface UserProfileResponse{
    userId: string;
    firstName: string;
    lastName: string;
    upiID: string;
    phone: string;
    kycStatus: string; // PENDING, VERIFIED, REJECTED
    kycDocumentUrl: string;
    profilePictureUrl: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    walletId: string; 
    active: boolean;
    createdAt: string; // Assuming it's a date string
    updatedAt: string; // Assuming it's a date string
}

interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    phone?: string;
    profilePictureUrl?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
}

interface UpdateKycRequest {
    kycStatus?: string; // PENDING, VERIFIED, REJECTED
    kycDocumentUrl?: string;
}

export const usersApi =baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getProfile : builder.query<UserProfileResponse, void>({
            query: () => ({
                url: '/users/profile',
                method: 'GET',
             }),
             transformResponse: (response: UserProfileResponse) => {
                return response;
             }
        }),


        updateProfile : builder.mutation<UserProfileResponse, UpdateProfileRequest>({
            query : (payload)=>({
                url: '/users/update-profile',
                method: 'PUT',
                body: payload
             }),
             transformResponse : (response : UserProfileResponse)=>{
                return response;
             }
        }),

        updateKyc : builder.mutation<UserProfileResponse, UpdateKycRequest>({
            query : (payload)=>({
                url: '/users/update-kyc',
                method: 'PUT',
                body: payload
             }),
             transformResponse : (response : UserProfileResponse)=>{
                return response;
             }
        })

    })
})

export const {
    useGetProfileQuery,
    useUpdateProfileMutation,
    useUpdateKycMutation
} = usersApi;













