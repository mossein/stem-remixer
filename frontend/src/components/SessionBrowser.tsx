import { useEffect } from "react";
import { useSessionStore } from "../store/sessionStore";

export function SessionBrowser() {
  const { sessions, fetchSessions, loadSession, deleteSession } =
    useSessionStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  if (sessions.length === 0) return null;

  return (
    <div className="session-browser">
      <h3>Previous Sessions</h3>
      <div className="session-list">
        {sessions.map((s) => (
          <div key={s.id} className="session-item">
            <div className="session-info">
              <span className="session-name">{s.filename}</span>
              <span className="session-status">{s.status}</span>
              {s.bpm && (
                <span className="session-bpm">{Math.round(s.bpm)} BPM</span>
              )}
            </div>
            <div className="session-actions">
              {s.status === "ready" && (
                <button
                  className="session-btn"
                  onClick={() => loadSession(s.id)}
                >
                  Load
                </button>
              )}
              <button
                className="session-btn delete"
                onClick={() => deleteSession(s.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
