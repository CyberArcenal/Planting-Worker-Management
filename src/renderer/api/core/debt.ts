// src/renderer/api/debtAPI.ts
// @ts-check

import type { DebtHistory } from "./debt_history";
import type { Session } from "./session";
import type { Worker } from "./worker";

// ----------------------------------------------------------------------
// 📦 Types (aligned with backend)
// ----------------------------------------------------------------------

export interface Debt {
  id: number;
  originalAmount: number;
  amount: number;
  reason?: string | null;
  balance: number;
  status: string;
  dateIncurred: string;
  dueDate?: string | null;
  paymentTerm?: string | null;
  interestRate: number;
  totalInterest: number;
  totalPaid: number;
  lastPaymentDate?: string | null;
  createdAt: string;
  updatedAt: string;
  worker?: Worker;
  session?: Session;
  history?: DebtHistory[];
}

export interface DebtCreateData {
  workerId: number;
  sessionId: number;
  amount: number;
  originalAmount?: number;
  reason?: string;
  dueDate?: string;
  paymentTerm?: string;
  interestRate?: number;
  status?: string;
}

export interface DebtUpdateData extends Partial<DebtCreateData> {}

export interface DebtResponse {
  status: boolean;
  message: string;
  data: Debt;
}

export interface DebtsResponse {
  status: boolean;
  message: string;
  data: Debt[];
}

export interface DebtStats {
  totalDebts: number;
  statusBreakdown: Record<string, number>;
  totalAmount: number;
  totalBalance: number;
}

export interface DebtStatsResponse {
  status: boolean;
  message: string;
  data: DebtStats;
}

// ----------------------------------------------------------------------
// 🧠 DebtAPI Class
// ----------------------------------------------------------------------

class DebtAPI {
  private channel = "debt";

  private async call<T = any>(method: string, params: Record<string, any> = {}): Promise<T> {
    if (!window.backendAPI?.debt) {
      throw new Error(`Electron API (${this.channel}) not available`);
    }
    return window.backendAPI.debt({ method, params });
  }

  // 🔎 READ

  async getAll(params?: {
    workerId?: number;
    sessionId?: number;
    status?: string;
    dueDateStart?: string;
    dueDateEnd?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<DebtsResponse> {
    try {
      const response = await this.call<DebtsResponse>("getAllDebts", params || {});
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch debts");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch debts");
    }
  }

  async getById(id: number): Promise<DebtResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<DebtResponse>("getDebtById", { id });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch debt");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch debt");
    }
  }

  async getByWorker(
    workerId: number,
    params?: Omit<Parameters<DebtAPI['getAll']>[0], 'workerId'>
  ): Promise<DebtsResponse> {
    return this.getAll({ ...params, workerId });
  }

  async getBySession(
    sessionId: number,
    params?: Omit<Parameters<DebtAPI['getAll']>[0], 'sessionId'>
  ): Promise<DebtsResponse> {
    return this.getAll({ ...params, sessionId });
  }

  async getStats(sessionId?: number): Promise<DebtStatsResponse> {
    try {
      const response = await this.call<DebtStatsResponse>("getDebtStats", { sessionId });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch stats");
    }
  }

  // ✏️ WRITE

  async create(data: DebtCreateData): Promise<DebtResponse> {
    try {
      const response = await this.call<DebtResponse>("createDebt", data);
      if (response.status) return response;
      throw new Error(response.message || "Failed to create debt");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create debt");
    }
  }

  async update(id: number, data: DebtUpdateData): Promise<DebtResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<DebtResponse>("updateDebt", { id, ...data });
      if (response.status) return response;
      throw new Error(response.message || "Failed to update debt");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update debt");
    }
  }
  /**
 * Update debt status
 * @param id - Debt ID
 * @param status - New status ('pending', 'partially_paid', 'paid', 'cancelled', 'overdue', 'settled')
 */
async updateStatus(id: number, status: string): Promise<DebtResponse> {
  try {
    if (!id || id <= 0) throw new Error("Invalid ID");
    const response = await this.call<DebtResponse>("updateStatus", { id, status });
    if (response.status) return response;
    throw new Error(response.message || "Failed to update debt status");
  } catch (error: any) {
    throw new Error(error.message || "Failed to update debt status");
  }
}

  async delete(id: number): Promise<DebtResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<DebtResponse>("deleteDebt", { id });
      if (response.status) return response;
      throw new Error(response.message || "Failed to delete debt");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete debt");
    }
  }
}

const debtAPI = new DebtAPI();
export default debtAPI;