import { TransactionRow } from "../../../wallet/components/TransactionRow";
import { baseApi } from "./baseApi";

interface TransferRequest {
    receiverUpiId: string;
    amount: number;
    remarks: string;
    idempotencyKey: string;
}

interface TransactionResponse {
    transactionId: string;
    senderId: string;
    receiverId: string;
    senderUpiId: string;
    receiverUpiId: string;
    amount: number;
    currency: string;
    status: string;
    type: string;
    remarks: string;
    failureReason: string;
    metadata: Record<string, unknown>;
    initiatedAt: string;
    completedAt: string;
    createdAt: string;
    updatedAt: string;
}

interface TransactionHistoryResponse {
   transactions: TransactionResponse[];   // array, not List
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface DepositRequest {
    upiId: string;
    amount: number;
    idempotencyKey: string;
    description: string;
}


export const transactionApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        transfer : builder.mutation<TransactionResponse, TransferRequest>({
            query : (payload)=>({
                url: '/transactions/transfer',
                method: 'POST',
                body: payload
             }),
             transformResponse : (response : TransactionResponse)=>{
                return response;
             }

        }),


        getTransaction : builder.query<TransactionResponse, string>({
            query : (transactionId)=>({
                url : `/transactions/${transactionId}`,
                method : 'GET'
             }),
             transformResponse : (response : TransactionResponse)=>{
                return response;
             }
        }),
         
        getTransactionHistory : builder.query<TransactionHistoryResponse, { page?: number; size?: number}>({
            query : ({ page = 0, size = 10, })=>({
                url : `/transactions/history?page=${page}&size=${size}`,
                method : 'GET'
             }),
             transformResponse : (response : TransactionHistoryResponse)=>{
                return response;
             }
         }),


         deposit : builder.mutation<TransactionResponse, DepositRequest>({
            query :(payload)=>({
                url: '/transactions/deposit',
                method: 'POST',
                body: payload
             }),
             transformResponse : (response : TransactionResponse)=>{
                return response;
             }        
        })






    })

})

export const {
    useTransferMutation,
    useGetTransactionQuery,
    useGetTransactionHistoryQuery,
    useDepositMutation
} = transactionApi;