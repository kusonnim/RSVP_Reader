import { useState } from "react";
import FileLoader from "../components/FileLoader";
import ProgressBar from "../components/ProgressBar";
import ReaderControls from "../components/ReaderControls";
import ReaderView from "../components/ReaderView";
import ThemeSelector from "../components/ThemeSelector";
import { useHoldPlayback } from "../hooks/useHoldPlayback";
import { useKeyboardControls } from "../hooks/useKeyboardControls";
import { useReaderState } from "../hooks/useReaderState";
import "./App.css";

function App() {
  const [fileName, setFileName] = useState("");
  const [hasLoadedFile, setHasLoadedFile] = useState(false);
  const {
    words,
    currentIndex,
    wpm,
    isHolding,
    theme,
    loadText,
    nextWord,
    previousWord,
    reset,
    setWpm,
    setHolding,
    setTheme,
  } = useReaderState();

  const handleTextLoaded = (text: string, loadedFileName: string) => {
    loadText(text);
    setFileName(loadedFileName);
    setHasLoadedFile(true);
  };

  const canGoPrevious = words.length > 0 && currentIndex > 0;
  const canGoNext = words.length > 0 && currentIndex < words.length - 1;

  useKeyboardControls({
    hasWords: words.length > 0,
    onHoldingChange: setHolding,
    onNext: nextWord,
    onPrevious: previousWord,
  });

  useHoldPlayback({
    isHolding,
    wpm,
    canAdvance: canGoNext,
    onAdvance: nextWord,
    onStop: () => setHolding(false),
  });

  return (
    <div className={`app theme-${theme}`}>
      <main className="app-shell">
        <header className="app-header">
          <a className="wordmark" href="/" aria-label="Hold-to-Read home">
            Hold-to-Read
          </a>
          <div className="header-actions">
            <ThemeSelector theme={theme} onThemeChange={setTheme} />
            <span className="status-badge">
              {hasLoadedFile ? `${words.length} words` : "Reader setup"}
            </span>
          </div>
        </header>

        <section className="welcome-panel" aria-labelledby="welcome-title">
          <p className="eyebrow">Read at the speed of focus</p>
          <h1 id="welcome-title">Your words, one clear moment at a time.</h1>
          <p className="welcome-copy">
            A focused RSVP reader that keeps your text moving while you hold
            the space bar.
          </p>

          <ReaderView
            words={words}
            currentIndex={currentIndex}
            isHolding={isHolding}
          />

          <ProgressBar
            currentIndex={currentIndex}
            totalWords={words.length}
          />

          <ReaderControls
            hasWords={words.length > 0}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            isHolding={isHolding}
            wpm={wpm}
            onPrevious={previousWord}
            onNext={nextWord}
            onReset={reset}
            onWpmChange={setWpm}
          />

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
    </div>
  );
}

export default App;
