import "./App.css";

function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="wordmark" href="/" aria-label="Hold-to-Read home">
          Hold-to-Read
        </a>
        <span className="status-badge">Reader setup</span>
      </header>

      <section className="welcome-panel" aria-labelledby="welcome-title">
        <p className="eyebrow">Read at the speed of focus</p>
        <h1 id="welcome-title">Your words, one clear moment at a time.</h1>
        <p className="welcome-copy">
          A focused RSVP reader that keeps your text moving while you hold the
          space bar.
        </p>

        <div className="reader-placeholder" aria-label="Reader preview">
          <span>Ready</span>
        </div>

        <p className="setup-note">TXT file loading comes next.</p>
      </section>
    </main>
  );
}

export default App;

