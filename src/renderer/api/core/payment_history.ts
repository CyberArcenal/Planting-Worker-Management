// src/renderer/api/paymentHistoryAPI.ts
// @ts-check

import type { Payment } from "./payment";

// ----------------------------------------------------------------------
// 📦 Types (aligned with backend)
// ----------------------------------------------------------------------

export interface PaymentHistory {
  id: number;
  actionType: string;
  changedField?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  oldAmount?: number | null;
  newAmount?: number | null;
  notes?: string | null;
  performedBy?: string | null;
  changeDate: string;
  referenceNumber?: string | null;
  payment?: Payment;
}

export interface PaymentHistoryCreateData {
  paymentId: number;
  actionType?: string;
  changedField?: string;
  oldValue?: string;
  newValue?: string;
  oldAmount?: number;
  newAmount?: number;
  notes?: string;
  performedBy?: string;
  referenceNumber?: string;
}

export interface PaymentHistoryUpdateData extends Partial<PaymentHistoryCreateData> {}

export interface PaymentHistoryResponse {
  status: boolean;
  message: string;
  data: PaymentHistory;
}

export interface PaymentHistoriesResponse {
  status: boolean;
  message: string;
  data: PaymentHistory[];
}

export interface PaymentHistoryStats {
  totalEntries: number;
  actionBreakdown: Record<string, number>;
}

export interface PaymentHistoryStatsResponse {
  status: boolean;
  message: string;
  data: PaymentHistoryStats;
}

// ----------------------------------------------------------------------
// 🧠 PaymentHistoryAPI Class
// ----------------------------------------------------------------------

class PaymentHistoryAPI {
  private channel = "paymentHistory";

  private async call<T = any>(method: string, params: Record<string, any> = {}): Promise<T> {
    if (!window.backendAPI?.paymentHistory) {
      throw new Error(`Electron API (${this.channel}) not available`);
    }
    return window.backendAPI.paymentHistory({ method, params });
  }

  // 🔎 READ

  async getAll(params?: {
    paymentId?: number;
    actionType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<PaymentHistoriesResponse> {
    try {
      const response = await this.call<PaymentHistoriesResponse>("getAllPaymentHistories", params || {});
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch payment histories");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch payment histories");
    }
  }

  async getById(id: number): Promise<PaymentHistoryResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<PaymentHistoryResponse>("getPaymentHistoryById", { id });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch payment history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch payment history");
    }
  }

  async getByPayment(
    paymentId: number,
    params?: Omit<Parameters<PaymentHistoryAPI['getAll']>[0], 'paymentId'>
  ): Promise<PaymentHistoriesResponse> {
    return this.getAll({ ...params, paymentId });
  }

  async getStats(paymentId?: number): Promise<PaymentHistoryStatsResponse> {
    try {
      const response = await this.call<PaymentHistoryStatsResponse>("getPaymentHistoryStats", { paymentId });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch stats");
    }
  }

  // ✏️ WRITE

  async create(data: PaymentHistoryCreateData): Promise<PaymentHistoryResponse> {
    try {
      const response = await this.call<PaymentHistoryResponse>("createPaymentHistory", data);
      if (response.status) return response;
      throw new Error(response.message || "Failed to create payment history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create payment history");
    }
  }

  async update(id: number, data: PaymentHistoryUpdateData): Promise<PaymentHistoryResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<PaymentHistoryResponse>("updatePaymentHistory", { id, ...data });
      if (response.status) return response;
      throw new Error(response.message || "Failed to update payment history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update payment history");
    }
  }

  async delete(id: number): Promise<PaymentHistoryResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<PaymentHistoryResponse>("deletePaymentHistory", { id });
      if (response.status) return response;
      throw new Error(response.message || "Failed to delete payment history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete payment history");
    }
  }
}

const paymentHistoryAPI = new PaymentHistoryAPI();
export default paymentHistoryAPI;