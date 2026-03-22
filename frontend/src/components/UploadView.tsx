import { useCallback, useState } from "react";
import { useSessionStore } from "../store/sessionStore";

export function UploadView() {
  const { upload, status, error } = useSessionStore();
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (file.name.toLowerCase().endsWith(".mp3")) {
        upload(file);
      }
    },
    [upload]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (status === "uploading" || status === "processing") {
    return (
      <div className="upload-view">
        <div className="upload-processing">
          <div className="processing-visual">
            <div className="processing-ring" />
            <div className="processing-ring ring-2" />
            <div className="processing-ring ring-3" />
            <svg className="processing-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <div className="processing-text">
            <h3>{status === "uploading" ? "Uploading..." : "Separating Stems"}</h3>
            <p>{status === "processing" ? "Running AI model to isolate vocals, drums, bass & other instruments..." : "Sending file to server..."}</p>
          </div>
          <div className="processing-bar">
            <div className="processing-bar-fill" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-view">
      <div
        className={`dropzone ${dragOver ? "drag-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".mp3";
          input.onchange = () => {
            const file = input.files?.[0];
            if (file) handleFile(file);
          };
          input.click();
        }}
      >
        <div className="dropzone-content">
          <svg className="dropzone-icon-svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
          <h2>Drop an MP3 file here</h2>
          <p>or click to browse - AI will separate it into stems</p>
          <div className="dropzone-stems-preview">
            <span className="stem-tag" style={{ "--tag-color": "#ff4d6a" } as React.CSSProperties}>Vocals</span>
            <span className="stem-tag" style={{ "--tag-color": "#fbbf24" } as React.CSSProperties}>Drums</span>
            <span className="stem-tag" style={{ "--tag-color": "#34d399" } as React.CSSProperties}>Bass</span>
            <span className="stem-tag" style={{ "--tag-color": "#60a5fa" } as React.CSSProperties}>Other</span>
          </div>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
