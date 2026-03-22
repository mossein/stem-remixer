import { useSessionStore } from "./store/sessionStore";
import { UploadView } from "./components/UploadView";
import { DAW } from "./components/DAW";
import { SessionBrowser } from "./components/SessionBrowser";
import "./styles/daw.css";

function App() {
  const status = useSessionStore((s) => s.status);

  if (status === "ready") {
    return (
      <div className="app">
        <DAW />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Stem Remixer</h1>
      </header>
      <main className="app-main">
        <div className="upload-section">
          <UploadView />
          <SessionBrowser />
        </div>
      </main>
    </div>
  );
}

export default App;
