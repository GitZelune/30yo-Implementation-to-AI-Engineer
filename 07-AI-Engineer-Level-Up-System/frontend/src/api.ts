import type { DashboardData, Priority, SkillStatus } from "./types";

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.detail === "string" ? body.detail : "请求失败，请稍后重试");
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const api = {
  dashboard: () => request<DashboardData>("/api/dashboard"),
  updateSkill: (id: number, status: SkillStatus) => request(`/api/skills/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  createTask: (payload: { title: string; priority: Priority; due_date: string | null }) => request("/api/tasks", { method: "POST", body: JSON.stringify(payload) }),
  updateTask: (id: number, completed: boolean) => request(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ completed }) }),
  deleteTask: (id: number) => request<void>(`/api/tasks/${id}`, { method: "DELETE" }),
  createLog: (payload: Record<string, unknown>) => request("/api/logs", { method: "POST", body: JSON.stringify(payload) }),
  createProject: (payload: Record<string, unknown>) => request("/api/projects", { method: "POST", body: JSON.stringify(payload) }),
};
