import { useState } from "react";
import FileLoader from "../components/FileLoader";
import ReaderView from "../components/ReaderView";
import { tokenizeText } from "../lib/tokenizeText";
import "./App.css";

function App() {
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fileName, setFileName] = useState("");
  const [hasLoadedFile, setHasLoadedFile] = useState(false);

  const handleTextLoaded = (text: string, loadedFileName: string) => {
    setWords(tokenizeText(text));
    setCurrentIndex(0);
    setFileName(loadedFileName);
    setHasLoadedFile(true);
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="wordmark" href="/" aria-label="Hold-to-Read home">
          Hold-to-Read
        </a>
        <span className="status-badge">
          {hasLoadedFile ? `${words.length} words` : "Reader setup"}
        </span>
      </header>

      <section className="welcome-panel" aria-labelledby="welcome-title">
        <p className="eyebrow">Read at the speed of focus</p>
        <h1 id="welcome-title">Your words, one clear moment at a time.</h1>
        <p className="welcome-copy">
          A focused RSVP reader that keeps your text moving while you hold the
          space bar.
        </p>

        <ReaderView words={words} currentIndex={currentIndex} />

        <FileLoader onTextLoaded={handleTextLoaded} />

        {hasLoadedFile && (
          <p className="load-result" role="status">
            {words.length > 0
              ? `${fileName} is ready with ${words.length.toLocaleString()} words.`
              : `${fileName} did not contain any readable words.`}
          </p>
        )}
      </section>
    </main>
  );
}

export default App;
