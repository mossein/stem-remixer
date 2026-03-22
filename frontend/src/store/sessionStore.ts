import { create } from "zustand";
import * as api from "../api/client";
import type { SessionInfo } from "../types";

interface SessionState {
  sessionId: string | null;
  session: SessionInfo | null;
  sessions: SessionInfo[];
  status: "idle" | "uploading" | "processing" | "ready" | "error";
  error: string | null;
  upload: (file: File) => Promise<void>;
  pollStatus: (id: string) => Promise<void>;
  loadSession: (id: string) => void;
  fetchSessions: () => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessionId: null,
  session: null,
  sessions: [],
  status: "idle",
  error: null,

  upload: async (file: File) => {
    set({ status: "uploading", error: null });
    try {
      const res = await api.uploadFile(file);
      set({ sessionId: res.session_id, status: "processing" });
      get().pollStatus(res.session_id);
    } catch (e) {
      set({ status: "error", error: String(e) });
    }
  },

  pollStatus: async (id: string) => {
    const poll = async () => {
      try {
        const session = await api.getSession(id);
        if (session.status === "ready") {
          set({ session, status: "ready" });
        } else if (session.status === "error") {
          set({ status: "error", error: session.error || "Processing failed" });
        } else {
          setTimeout(poll, 2000);
        }
      } catch {
        setTimeout(poll, 3000);
      }
    };
    poll();
  },

  loadSession: (id: string) => {
    set({ sessionId: id, status: "processing" });
    get().pollStatus(id);
  },

  fetchSessions: async () => {
    const sessions = await api.listSessions();
    set({ sessions });
  },

  deleteSession: async (id: string) => {
    await api.deleteSession(id);
    const { sessions, sessionId } = get();
    set({
      sessions: sessions.filter((s) => s.id !== id),
      ...(sessionId === id
        ? { sessionId: null, session: null, status: "idle" }
        : {}),
    });
  },

  reset: () => {
    set({
      sessionId: null,
      session: null,
      status: "idle",
      error: null,
    });
  },
}));
