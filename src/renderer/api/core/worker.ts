// src/renderer/api/workerAPI.ts
// @ts-check

import type { Assignment } from "./assignment";
import type { Debt } from "./debt";
import type { Payment } from "./payment";

// ----------------------------------------------------------------------
// 📦 Types (aligned with backend)
// ----------------------------------------------------------------------

export interface Worker {
  id: number;
  name: string;
  contact?: string | null;
  email?: string | null;
  address?: string | null;
  status: string;
  hireDate?: string | null;
  createdAt: string;
  updatedAt: string;
  debts?: Debt[];
  payments?: Payment[];
  assignments?: Assignment[];
}

export interface WorkerCreateData {
  name: string;
  contact?: string;
  email?: string;
  address?: string;
  status?: string;
  hireDate?: string;
}

export interface WorkerUpdateData extends Partial<WorkerCreateData> {}

export interface WorkerResponse {
  status: boolean;
  message: string;
  data: Worker;
}

export interface WorkersResponse {
  status: boolean;
  message: string;
  data: Worker[];
}

export interface WorkerStats {
  totalWorkers: number;
  statusBreakdown: Record<string, number>;
  workerDetails?: {
    totalAssignments: number;
    totalPayments: number;
    totalDebts: number;
    outstandingDebt: number;
  } | null;
}

export interface WorkerStatsResponse {
  status: boolean;
  message: string;
  data: WorkerStats;
}

// ----------------------------------------------------------------------
// 🧠 WorkerAPI Class
// ----------------------------------------------------------------------

class WorkerAPI {
  private channel = "worker";

  private async call<T = any>(
    method: string,
    params: Record<string, any> = {},
  ): Promise<T> {
    if (!window.backendAPI?.worker) {
      throw new Error(`Electron API (${this.channel}) not available`);
    }
    return window.backendAPI.worker({ method, params });
  }

  // 🔎 READ

  async getAll(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<WorkersResponse> {
    try {
      const response = await this.call<WorkersResponse>(
        "getAllWorkers",
        params || {},
      );
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch workers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch workers");
    }
  }

  async getById(id: number): Promise<WorkerResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<WorkerResponse>("getWorkerById", { id });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch worker");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch worker");
    }
  }

  async getByStatus(
    status: string,
    params?: Omit<Parameters<WorkerAPI["getAll"]>[0], "status">,
  ): Promise<WorkersResponse> {
    return this.getAll({ ...params, status });
  }

  async getStats(workerId?: number): Promise<WorkerStatsResponse> {
    try {
      const response = await this.call<WorkerStatsResponse>("getWorkerStats", {
        workerId,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch stats");
    }
  }

  // ✏️ WRITE

  async create(data: WorkerCreateData): Promise<WorkerResponse> {
    try {
      const response = await this.call<WorkerResponse>("createWorker", data);
      if (response.status) return response;
      throw new Error(response.message || "Failed to create worker");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create worker");
    }
  }

  async update(id: number, data: WorkerUpdateData): Promise<WorkerResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<WorkerResponse>("updateWorker", {
        id,
        ...data,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to update worker");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update worker");
    }
  }

  /**
   * Update worker status
   * @param id - Worker ID
   * @param status - New status ('active', 'inactive', 'on-leave', 'terminated')
   */
  async updateStatus(id: number, status: string): Promise<WorkerResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<WorkerResponse>("updateStatus", {
        id,
        status,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to update worker status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update worker status");
    }
  }

  async delete(id: number): Promise<WorkerResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<WorkerResponse>("deleteWorker", { id });
      if (response.status) return response;
      throw new Error(response.message || "Failed to delete worker");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete worker");
    }
  }
}

const workerAPI = new WorkerAPI();
export default workerAPI;
