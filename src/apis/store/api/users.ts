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

export interface QrCodeData {
    upiId: string;
    payeeName: string;
    currency: string;
    payload: string;
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
        getQrCodeData: builder.query<QrCodeData, void>({
            query: () => ({
                url: '/users/qr-data',
                method: 'GET',
            }),
            keepUnusedDataFor: 0,
        }),
        getQrCode: builder.query<string, void>({
            query: () => ({
                url: '/users/qr-code',
                cache: 'no-store',
                responseHandler: async (response) => {
                    if (!response.ok) return response.text();
                    const blob = await response.blob();
                    if (!blob.type.startsWith('image/') || blob.size > 1024 * 1024) {
                        throw new Error('Invalid recipient QR image');
                    }
                    return new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(String(reader.result));
                        reader.onerror = () => reject(reader.error);
                        reader.readAsDataURL(blob);
                    });
                },
            }),
            keepUnusedDataFor: 0,
        }),
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
    useGetQrCodeDataQuery,
    useLazyGetQrCodeDataQuery,
    useGetQrCodeQuery,
    useLazyGetQrCodeQuery,
    useGetProfileQuery,
    useUpdateProfileMutation,
    useUpdateKycMutation
} = usersApi;













