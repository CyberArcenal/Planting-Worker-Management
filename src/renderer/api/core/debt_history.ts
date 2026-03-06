// src/renderer/api/debtHistoryAPI.ts
// @ts-check

import type { Debt } from "./debt";
import type { Payment } from "./payment";

// ----------------------------------------------------------------------
// 📦 Types (aligned with backend)
// ----------------------------------------------------------------------

export interface DebtHistory {
  id: number;
  amountPaid: number;
  previousBalance: number;
  newBalance: number;
  transactionType: string;
  paymentMethod?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  transactionDate: string;
  createdAt: string;
  debt?: Debt;
  payment?: Payment | null;
}

export interface DebtHistoryCreateData {
  debtId: number;
  paymentId?: number | null;
  amountPaid: number;
  previousBalance: number;
  newBalance: number;
  transactionType?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface DebtHistoryUpdateData extends Partial<DebtHistoryCreateData> {}

export interface DebtHistoryResponse {
  status: boolean;
  message: string;
  data: DebtHistory;
}

export interface DebtHistoriesResponse {
  status: boolean;
  message: string;
  data: DebtHistory[];
}

export interface DebtHistoryStats {
  totalEntries: number;
  typeBreakdown: Record<string, number>;
  totalPayments: number;
}

export interface DebtHistoryStatsResponse {
  status: boolean;
  message: string;
  data: DebtHistoryStats;
}

// ----------------------------------------------------------------------
// 🧠 DebtHistoryAPI Class
// ----------------------------------------------------------------------

class DebtHistoryAPI {
  private channel = "debtHistory";

  private async call<T = any>(method: string, params: Record<string, any> = {}): Promise<T> {
    if (!window.backendAPI?.debtHistory) {
      throw new Error(`Electron API (${this.channel}) not available`);
    }
    return window.backendAPI.debtHistory({ method, params });
  }

  // 🔎 READ

  async getAll(params?: {
    debtId?: number;
    paymentId?: number;
    transactionType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<DebtHistoriesResponse> {
    try {
      const response = await this.call<DebtHistoriesResponse>("getAllDebtHistories", params || {});
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch debt histories");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch debt histories");
    }
  }

  async getById(id: number): Promise<DebtHistoryResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<DebtHistoryResponse>("getDebtHistoryById", { id });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch debt history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch debt history");
    }
  }

  async getByDebt(
    debtId: number,
    params?: Omit<Parameters<DebtHistoryAPI['getAll']>[0], 'debtId'>
  ): Promise<DebtHistoriesResponse> {
    return this.getAll({ ...params, debtId });
  }

  async getStats(debtId?: number): Promise<DebtHistoryStatsResponse> {
    try {
      const response = await this.call<DebtHistoryStatsResponse>("getDebtHistoryStats", { debtId });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch stats");
    }
  }

  // ✏️ WRITE

  async create(data: DebtHistoryCreateData): Promise<DebtHistoryResponse> {
    try {
      const response = await this.call<DebtHistoryResponse>("createDebtHistory", data);
      if (response.status) return response;
      throw new Error(response.message || "Failed to create debt history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create debt history");
    }
  }

  async update(id: number, data: DebtHistoryUpdateData): Promise<DebtHistoryResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<DebtHistoryResponse>("updateDebtHistory", { id, ...data });
      if (response.status) return response;
      throw new Error(response.message || "Failed to update debt history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update debt history");
    }
  }

  async delete(id: number): Promise<DebtHistoryResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<DebtHistoryResponse>("deleteDebtHistory", { id });
      if (response.status) return response;
      throw new Error(response.message || "Failed to delete debt history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete debt history");
    }
  }
}

const debtHistoryAPI = new DebtHistoryAPI();
export default debtHistoryAPI;