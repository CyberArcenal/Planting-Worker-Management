// src/renderer/api/assignmentAPI.ts
// @ts-check

import type { Pitak } from "./pitak";
import type { Session } from "./session";
import type { Worker } from "./worker";

// ----------------------------------------------------------------------
// 📦 Types (aligned with backend response)
// ----------------------------------------------------------------------

export interface Assignment {
  id: number;
  luwangCount: number;
  assignmentDate: string; // ISO date
  status: "initiated" | "active" | "completed" | "cancelled";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  worker?: Worker;
  pitak?: Pitak;
  session?: Session;
}

export interface AssignmentResponse {
  status: boolean;
  message: string;
  data: Assignment;
}

export interface AssignmentsResponse {
  status: boolean;
  message: string;
  data: Assignment[];
}

export interface AssignmentStats {
  totalAssignments: number;
  statusBreakdown: Record<string, number>;
  totalLuwang: number;
}

export interface AssignmentStatsResponse {
  status: boolean;
  message: string;
  data: AssignmentStats;
}

export interface AssignmentFilters {
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
}

// ----------------------------------------------------------------------
// 🧠 AssignmentAPI Class
// ----------------------------------------------------------------------

class AssignmentAPI {
  private channel = "assignment";

  private async call<T = any>(
    method: string,
    params: Record<string, any> = {},
  ): Promise<T> {
    if (!window.backendAPI?.assignment) {
      throw new Error(`Electron API (${this.channel}) not available`);
    }
    return window.backendAPI.assignment({ method, params });
  }

  // 🔎 READ

  /**
   * Get all assignments with optional filters
   */
  async getAll(params?: AssignmentFilters): Promise<AssignmentsResponse> {
    try {
      const response = await this.call<AssignmentsResponse>(
        "getAllAssignments",
        params || {},
      );
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch assignments");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch assignments");
    }
  }

  /**
   * Get assignment by ID
   */
  async getById(id: number): Promise<AssignmentResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<AssignmentResponse>(
        "getAssignmentById",
        { id },
      );
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch assignment");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch assignment");
    }
  }

  /**
   * Get assignments by worker ID
   */
  async getByWorker(
    workerId: number,
    params?: Omit<Parameters<AssignmentAPI["getAll"]>[0], "workerId">,
  ): Promise<AssignmentsResponse> {
    return this.getAll({ ...params, workerId });
  }

  /**
   * Get assignments by pitak ID
   */
  async getByPitak(
    pitakId: number,
    params?: Omit<Parameters<AssignmentAPI["getAll"]>[0], "pitakId">,
  ): Promise<AssignmentsResponse> {
    return this.getAll({ ...params, pitakId });
  }

  /**
   * Get assignments by session ID
   */
  async getBySession(
    sessionId: number,
    params?: Omit<Parameters<AssignmentAPI["getAll"]>[0], "sessionId">,
  ): Promise<AssignmentsResponse> {
    return this.getAll({ ...params, sessionId });
  }

  /**
   * Get assignment statistics
   */
  async getStats(sessionId?: number): Promise<AssignmentStatsResponse> {
    try {
      const response = await this.call<AssignmentStatsResponse>(
        "getAssignmentStats",
        { sessionId },
      );
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch stats");
    }
  }

  // ✏️ WRITE

  /**
   * Create a new assignment
   */
  async create(data: {
    workerId: number;
    pitakId: number;
    sessionId: number;
    assignmentDate?: string;
    notes?: string;
    status?: string;
  }): Promise<AssignmentResponse> {
    try {
      const response = await this.call<AssignmentResponse>(
        "createAssignment",
        data,
      );
      if (response.status) return response;
      throw new Error(response.message || "Failed to create assignment");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create assignment");
    }
  }

  /**
   * Create multiple assignments at once (bulk)
   */
  async createBulk(data: {
    workerIds: number[];
    pitakId: number;
    sessionId: number;
    assignmentDate: string;
    notes?: string;
  }): Promise<AssignmentsResponse> {
    try {
      const response = await this.call<AssignmentsResponse>(
        "createBulkAssignments",
        data,
      );
      if (response.status) return response;
      throw new Error(response.message || "Failed to create assignments");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create assignments");
    }
  }

  /**
   * Update an existing assignment
   * All fields are optional; only provided fields will be updated.
   */
  async update(
    id: number,
    data: Partial<{
      workerId: number;
      pitakId: number;
      sessionId: number;
      luwangCount: number;
      assignmentDate: string;
      notes: string | null;
      status: string;
    }>,
  ): Promise<AssignmentResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<AssignmentResponse>("updateAssignment", {
        id,
        ...data,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to update assignment");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update assignment");
    }
  }

  /**
   * Update assignment status
   * @param id - Assignment ID
   * @param status - New status ('active', 'completed', 'cancelled')
   */
  async updateStatus(id: number, status: string): Promise<AssignmentResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<AssignmentResponse>("updateStatus", {
        id,
        status,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to update assignment status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update assignment status");
    }
  }

  /**
   * Delete (cancel) an assignment
   * This sets the status to 'cancelled'.
   */
  async delete(id: number): Promise<AssignmentResponse> {
    try {
      if (!id || id <= 0) throw new Error("Invalid ID");
      const response = await this.call<AssignmentResponse>("deleteAssignment", {
        id,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to delete assignment");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete assignment");
    }
  }
}

const assignmentAPI = new AssignmentAPI();
export default assignmentAPI;
