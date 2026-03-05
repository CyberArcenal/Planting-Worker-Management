// src/renderer/api/paymentAPI.ts
// @ts-check

import type { Assignment } from "./assignment";
import type { Debt } from "./debt";
import type { PaymentHistory } from "./payment_history";
import type { Pitak } from "./pitak";
import type { Session } from "./session";
import type { Worker } from "./worker";

// ----------------------------------------------------------------------
// 📦 Types (aligned with backend)
// ----------------------------------------------------------------------

export interface Payment {
  id: number;
  grossPay: number;
  manualDeduction?: number | null;
  netPay: number;
  status: string;
  paymentDate?: string | null;
  paymentMethod?: string | null;
  referenceNumber?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  totalDebtDeduction: number;
  otherDeductions: number;
  deductionBreakdown?: any | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  idempotencyKey?: string | null;
  worker?: Worker;
  pitak?: Pitak;
  session?: Session;
  assignment?: Assignment | null;
  history?: PaymentHistory[];
  debtPayments?: Debt[];
}

export interface PaymentCreateData {
  workerId: number;
  pitakId: number;
  sessionId: number;
  assignmentId?: number | null;
  grossPay: number;
  manualDeduction?: number;
  netPay: number;
  status?: string;
  paymentDate?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  periodStart?: string;
  periodEnd?: string;
  totalDebtDeduction?: number;
  otherDeductions?: number;
  deductionBreakdown?: any;
  notes?: string;
  idempotencyKey?: string;
}

export interface PaymentUpdateData extends Partial<PaymentCreateData> {}

export interface PaymentResponse {
  status: boolean;
  message: string;
  data: Payment;
}

export interface PaymentsResponse {
  status: boolean;
  message: string;
  data: Payment[];
}

export interface PaymentStats {
  averagePayment: number;
  totalPayments: number;
  statusBreakdown: Record<string, number>;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
}

export interface PaymentStatsResponse {
  status: boolean;
  message: string;
  data: PaymentStats;
}

// ----------------------------------------------------------------------
// 🧠 PaymentAPI Class
// ----------------------------------------------------------------------

class PaymentAPI {
  private channel = "payment";

  private async call<T = any>(method: string, params: Record<string, any> = {}): Promise<T> {
    if (!window.backendAPI?.payment) {
      throw new Error(`Electron API (${this.channel}) not available`);
    }
    return window.backendAPI.payment({ method, params });
  }

  // 🔎 READ

  async getAll(params?: {
    workerId?: number;
    pitakId?: number;
    sessionId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<PaymentsResponse> {
    try {
      const response = await this.call<PaymentsResponse>("getAllPayments", params || {});
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch payments");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch payments");
    }
  }

  async getById(id: number): Promise<PaymentResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<PaymentResponse>("getPaymentById", { id });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch payment");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch payment");
    }
  }

  async getByWorker(
    workerId: number,
    params?: Omit<Parameters<PaymentAPI['getAll']>[0], 'workerId'>
  ): Promise<PaymentsResponse> {
    return this.getAll({ ...params, workerId });
  }

  async getByPitak(
    pitakId: number,
    params?: Omit<Parameters<PaymentAPI['getAll']>[0], 'pitakId'>
  ): Promise<PaymentsResponse> {
    return this.getAll({ ...params, pitakId });
  }

  async getBySession(
    sessionId: number,
    params?: Omit<Parameters<PaymentAPI['getAll']>[0], 'sessionId'>
  ): Promise<PaymentsResponse> {
    return this.getAll({ ...params, sessionId });
  }

  async getStats(sessionId?: number): Promise<PaymentStatsResponse> {
    try {
      const response = await this.call<PaymentStatsResponse>("getPaymentStats", { sessionId });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch stats");
    }
  }

  // ✏️ WRITE

  async create(data: PaymentCreateData): Promise<PaymentResponse> {
    try {
      const response = await this.call<PaymentResponse>("createPayment", data);
      if (response.status) return response;
      throw new Error(response.message || "Failed to create payment");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create payment");
    }
  }

  async update(id: number, data: PaymentUpdateData): Promise<PaymentResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<PaymentResponse>("updatePayment", { id, ...data });
      if (response.status) return response;
      throw new Error(response.message || "Failed to update payment");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update payment");
    }
  }

  /**
 * Update payment status
 * @param id - Payment ID
 * @param status - New status ('pending', 'partially_paid', 'complete', 'cancel')
 */
async updateStatus(id: number, status: string): Promise<PaymentResponse> {
  try {
    if (!id || id <= 0) throw new Error("Invalid ID");
    const response = await this.call<PaymentResponse>("updateStatus", { id, status });
    if (response.status) return response;
    throw new Error(response.message || "Failed to update payment status");
  } catch (error: any) {
    throw new Error(error.message || "Failed to update payment status");
  }
}

  async delete(id: number): Promise<PaymentResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<PaymentResponse>("deletePayment", { id });
      if (response.status) return response;
      throw new Error(response.message || "Failed to delete payment");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete payment");
    }
  }
}

const paymentAPI = new PaymentAPI();
export default paymentAPI;