// src/renderer/api/pitakAPI.ts
// @ts-check

import type { Assignment } from "./assignment";
import type { Bukid } from "./bukid";
import type { Payment } from "./payment";

// ----------------------------------------------------------------------
// 📦 Types (aligned with backend)
// ----------------------------------------------------------------------

export interface Pitak {
  id: number;
  location: string;
  totalLuwang: number;
  layoutType: string;
  sideLengths?: any | null;
  areaSqm: number;
  notes?: string | null;
  status: "active" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  bukid?: Bukid;
  assignments?: Assignment[];
  payments?: Payment[];
}

export interface PitakCreateData {
  bukidId: number;
  location?: string;
  layoutType?: string;
  sideLengths?: any;
  areaSqm?: number;
  notes?: string;
  status?: "active" | "completed" | "cancelled";
  totalLuwang?: number;
}

export interface PitakUpdateData extends Partial<PitakCreateData> {}

export interface PitakResponse {
  status: boolean;
  message: string;
  data: Pitak;
}

export interface PitaksResponse {
  status: boolean;
  message: string;
  data: Pitak[];
}

export interface PitakStats {
  totalPitaks: number;
  statusBreakdown: Record<string, number>;
  totalArea: number;
}

export interface PitakStatsResponse {
  status: boolean;
  message: string;
  data: PitakStats;
}

// ----------------------------------------------------------------------
// 🧠 PitakAPI Class
// ----------------------------------------------------------------------

class PitakAPI {
  private channel = "pitak";

  private async call<T = any>(
    method: string,
    params: Record<string, any> = {},
  ): Promise<T> {
    if (!window.backendAPI?.pitak) {
      throw new Error(`Electron API (${this.channel}) not available`);
    }
    return window.backendAPI.pitak({ method, params });
  }

  // 🔎 READ

  async getAll(params?: {
    bukidId?: number;
    status?: "active" | "completed" | "cancelled";
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<PitaksResponse> {
    try {
      const response = await this.call<PitaksResponse>(
        "getAllPitaks",
        params || {},
      );
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch pitaks");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch pitaks");
    }
  }

  async getById(id: number): Promise<PitakResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<PitakResponse>("getPitakById", { id });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch pitak");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch pitak");
    }
  }

  async getByBukid(
    bukidId: number,
    params?: Omit<Parameters<PitakAPI["getAll"]>[0], "bukidId">,
  ): Promise<PitaksResponse> {
    return this.getAll({ ...params, bukidId });
  }

  async getStats(bukidId?: number): Promise<PitakStatsResponse> {
    try {
      const response = await this.call<PitakStatsResponse>("getPitakStats", {
        bukidId,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch stats");
    }
  }

  // ✏️ WRITE

  async create(data: PitakCreateData): Promise<PitakResponse> {
    try {
      const response = await this.call<PitakResponse>("createPitak", data);
      if (response.status) return response;
      throw new Error(response.message || "Failed to create pitak");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create pitak");
    }
  }

  async update(id: number, data: PitakUpdateData): Promise<PitakResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<PitakResponse>("updatePitak", {
        id,
        ...data,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to update pitak");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update pitak");
    }
  }

  /**
   * Update pitak status
   * @param id - Pitak ID
   * @param status - New status ('active', 'inactive', 'archived')
   */
  async updateStatus(
    id: number,
    status: "active" | "completed" | "cancelled",
  ): Promise<PitakResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<PitakResponse>("updateStatus", {
        id,
        status,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to update pitak status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update pitak status");
    }
  }

  async delete(id: number): Promise<PitakResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<PitakResponse>("deletePitak", { id });
      if (response.status) return response;
      throw new Error(response.message || "Failed to delete pitak");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete pitak");
    }
  }
}

const pitakAPI = new PitakAPI();
export default pitakAPI;
