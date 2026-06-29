import { create } from "zustand";

export interface StudentProfile {
  province: string;
  score: number | null;
  subjects: string[];
  interests: string;
  cityPreference: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "thinking";
  content: string;
  toolResults?: Record<string, unknown>[];
  toolCalls?: ToolCall[];
  timestamp: Date;
}

export interface ToolCall {
  name: string;
  status: "running" | "done" | "pending";
  result?: string;
  args?: Record<string, unknown>;
}

export interface ReportData {
  profile: StudentProfile;
  recommendations: {
    tier: "reach" | "match" | "safety";
    universities: Array<{
      id: string;
      name: string;
      province: string;
      city: string;
      tags: string[];
      address: string;
      lat: number;
      lng: number;
      website: string;
    }>;
  }[];
  generatedAt: Date | null;
}

interface AppState {
  // Student profile
  profile: StudentProfile;
  setProfile: (profile: Partial<StudentProfile>) => void;

  // Chat
  chatHistory: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearChat: () => void;

  // Report
  report: ReportData | null;
  setReport: (report: ReportData) => void;

  // Shortlist
  shortlist: string[];
  toggleShortlist: (universityId: string) => void;

  // Volunteer list (从对话中提取的候选院校)
  volunteerList: Array<{
    id: string;
    name: string;
    province: string;
    city: string;
    tags: string[];
    tier?: "reach" | "match" | "safety" | "ambitious";
    note?: string;
  }>;
  addToVolunteerList: (items: AppState["volunteerList"]) => void;
  clearVolunteerList: () => void;

  // UI state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  currentPage: "home" | "chat" | "report" | "portals";
  setPage: (page: "home" | "chat" | "report" | "portals") => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: {
    province: "",
    score: null,
    subjects: [],
    interests: "",
    cityPreference: "",
  },
  setProfile: (updates) =>
    set((state) => ({ profile: { ...state.profile, ...updates } })),

  chatHistory: [],
  addMessage: (msg) =>
    set((state) => ({ chatHistory: [...state.chatHistory, msg] })),
  clearChat: () => set({ chatHistory: [] }),

  report: null,
  setReport: (report) => set({ report }),

  shortlist: [],
  toggleShortlist: (id) =>
    set((state) => ({
      shortlist: state.shortlist.includes(id)
        ? state.shortlist.filter((s) => s !== id)
        : [...state.shortlist, id],
    })),

  volunteerList: [],
  addToVolunteerList: (items) =>
    set((state) => {
      const existing = new Set(state.volunteerList.map((v) => v.id));
      const fresh = items.filter((it) => !existing.has(it.id));
      return { volunteerList: [...state.volunteerList, ...fresh] };
    }),
  clearVolunteerList: () => set({ volunteerList: [] }),

  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  currentPage: "home",
  setPage: (page) => set({ currentPage: page }),
}));
