// src/renderer/api/bukidAPI.ts
// @ts-check

import type { Pitak } from "./pitak";
import type { Session } from "./session";

// ----------------------------------------------------------------------
// 📦 Types (aligned with backend)
// ----------------------------------------------------------------------

export interface Bukid {
  id: number;
  name: string;
  status: string;
  notes?: string | null;
  location?: string | null;
  createdAt: string;
  updatedAt: string;
  session?: Session;
  pitaks?: Pitak[];
}

export interface BukidCreateData {
  name: string;
  sessionId: number;
  status?: string;
  notes?: string;
  location?: string;
}

export interface BukidUpdateData extends Partial<BukidCreateData> {}

export interface BukidResponse {
  status: boolean;
  message: string;
  data: Bukid;
}

export interface BukidsResponse {
  status: boolean;
  message: string;
  data: Bukid[];
}

export interface BukidStats {
  totalBukids: number;
  statusBreakdown: Record<string, number>;
  pitakDistribution: Array<{ bukidId: number; count: number }>;
}

export interface BukidStatsResponse {
  status: boolean;
  message: string;
  data: BukidStats;
}

// ----------------------------------------------------------------------
// 🧠 BukidAPI Class
// ----------------------------------------------------------------------

class BukidAPI {
  private channel = "bukid";

  private async call<T = any>(method: string, params: Record<string, any> = {}): Promise<T> {
    if (!window.backendAPI?.bukid) {
      throw new Error(`Electron API (${this.channel}) not available`);
    }
    return window.backendAPI.bukid({ method, params });
  }

  // 🔎 READ

  async getAll(params?: {
    sessionId?: number;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<BukidsResponse> {
    try {
      const response = await this.call<BukidsResponse>("getAllBukids", params || {});
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch bukids");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch bukids");
    }
  }

  async getById(id: number): Promise<BukidResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<BukidResponse>("getBukidById", { id });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch bukid");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch bukid");
    }
  }

  async getBySession(
    sessionId: number,
    params?: Omit<Parameters<BukidAPI['getAll']>[0], 'sessionId'>
  ): Promise<BukidsResponse> {
    return this.getAll({ ...params, sessionId });
  }

  async getStats(): Promise<BukidStatsResponse> {
    try {
      const response = await this.call<BukidStatsResponse>("getBukidStats");
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch stats");
    }
  }

  // ✏️ WRITE

  async create(data: BukidCreateData): Promise<BukidResponse> {
    try {
      const response = await this.call<BukidResponse>("createBukid", data);
      if (response.status) return response;
      throw new Error(response.message || "Failed to create bukid");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create bukid");
    }
  }

  async update(id: number, data: BukidUpdateData): Promise<BukidResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<BukidResponse>("updateBukid", { id, ...data });
      if (response.status) return response;
      throw new Error(response.message || "Failed to update bukid");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update bukid");
    }
  }

  /**
 * Update bukid status
 * @param id - Bukid ID
 * @param status - New status ('initiated', 'active', 'complete', 'inactive')
 */
async updateStatus(id: number, status: string): Promise<BukidResponse> {
  try {
    if (!id || id <= 0) throw new Error("Invalid ID");
    const response = await this.call<BukidResponse>("updateStatus", { id, status });
    if (response.status) return response;
    throw new Error(response.message || "Failed to update bukid status");
  } catch (error: any) {
    throw new Error(error.message || "Failed to update bukid status");
  }
}

  async delete(id: number): Promise<BukidResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<BukidResponse>("deleteBukid", { id });
      if (response.status) return response;
      throw new Error(response.message || "Failed to delete bukid");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete bukid");
    }
  }
}

const bukidAPI = new BukidAPI();
export default bukidAPI;