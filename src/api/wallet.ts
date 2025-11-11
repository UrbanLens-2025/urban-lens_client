import axiosInstance from "./axios-config";
import { ApiResponse, CreateExternalDepositPayload, CreateExternalWithdrawPayload, GetWalletExternalTransactionsParams, GetWalletTransactionsParams, PaginatedData, Wallet, WalletExternalTransaction, WalletTransaction } from "@/types";


export const getWalletInfo = async (): Promise<Wallet> => {
    const { data } = await axiosInstance.get<ApiResponse<Wallet>>(
        '/v1/private/wallet'
    );
    return data.data;
};

export const getWalletExternalTransactions = async ({
    page = 1,
    limit = 10,
    sortBy = 'createdAt:DESC'
}: GetWalletExternalTransactionsParams): Promise<PaginatedData<WalletExternalTransaction>> => {

    const params = { page, limit, sortBy };

    const { data } = await axiosInstance.get<ApiResponse<PaginatedData<WalletExternalTransaction>>>(
        '/v1/private/wallet/transactions/external',
        { params }
    );
    return data.data;
};

export const getWalletExternalTransactionById = async (transactionId: string): Promise<WalletExternalTransaction> => {
    const { data } = await axiosInstance.get<ApiResponse<WalletExternalTransaction>>(
        `/v1/private/wallet/transactions/external/${transactionId}`
    );
    return data.data;
};

export const createExternalDeposit = async (
    payload: CreateExternalDepositPayload
): Promise<WalletExternalTransaction> => {
    const { data } = await axiosInstance.post<ApiResponse<WalletExternalTransaction>>(
        '/v1/private/wallet/external/deposit',
        payload
    );
    return data.data;
};

export const createExternalWithdraw = async (
    payload: CreateExternalWithdrawPayload
): Promise<WalletExternalTransaction> => {
    const { data } = await axiosInstance.post<ApiResponse<WalletExternalTransaction>>(
        '/v1/private/wallet/external/withdraw',
        payload
    );
    return data.data;
};

export const cancelWithdrawTransaction = async (
    transactionId: string
): Promise<WalletExternalTransaction> => {
    const { data } = await axiosInstance.post<ApiResponse<WalletExternalTransaction>>(
        `/v1/private/wallet/transactions/external/${transactionId}/cancel`
    );
    return data.data;
};

export const getWalletTransactions = async ({
    page = 1,
    limit = 20,
    sortBy = 'createdAt:DESC',
}: GetWalletTransactionsParams): Promise<PaginatedData<WalletTransaction>> => {
    const params = { page, limit, sortBy };
    const { data } = await axiosInstance.get<ApiResponse<PaginatedData<WalletTransaction>>>(
        '/v1/private/wallet/transactions',
        { params }
    );
    return data.data;
};

export const getWalletTransactionById = async (transactionId: string): Promise<WalletTransaction> => {
    const { data } = await axiosInstance.get<ApiResponse<WalletTransaction>>(
        `/v1/private/wallet/transactions/${transactionId}`
    );
    return data.data;
};