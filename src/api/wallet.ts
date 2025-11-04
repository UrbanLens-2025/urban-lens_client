import axiosInstance from "./axios-config";
import { ApiResponse, GetWalletExternalTransactionsParams, PaginatedData, Wallet, WalletExternalTransaction } from "@/types";


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