export type SkillStatus = "locked" | "learning" | "completed";
export type Priority = "high" | "routine";

export interface Profile {
  name: string;
  role: string;
  target: string;
  level: number;
  xp: number;
  next_level_xp: number;
  learning_days: number;
  streak: number;
}

export interface Skill { id: number; category: string; name: string; status: SkillStatus; position: number }
export interface Task { id: number; title: string; priority: Priority; due_date: string | null; completed: number; created_at: string }
export interface Journal { id: number; log_date: string; topic: string; content: string; reflection: string; problem: string; commit_url: string; xp: number }
export interface Project { id: number; name: string; stack: string; progress: number; github_url: string }
export interface Achievement { name: string; icon: string; detail: string }

export interface DashboardData {
  profile: Profile;
  skills: Skill[];
  tasks: Task[];
  logs: Journal[];
  projects: Project[];
  achievements: Achievement[];
}
