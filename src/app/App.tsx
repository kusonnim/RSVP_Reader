import { useEffect, useState } from "react";
import ChapterSelector from "../components/ChapterSelector";
import FileLoader from "../components/FileLoader";
import ProgressBar from "../components/ProgressBar";
import ReaderControls from "../components/ReaderControls";
import ReaderView from "../components/ReaderView";
import ThemeSelector from "../components/ThemeSelector";
import { useHoldPlayback } from "../hooks/useHoldPlayback";
import { useKeyboardControls } from "../hooks/useKeyboardControls";
import { useReaderPersistence } from "../hooks/useReaderPersistence";
import { useReaderState } from "../hooks/useReaderState";
import type {
  LoadedReaderDocument,
  ReaderChapter,
  ReaderFileMetadata,
} from "../types/reader";
import "./App.css";

function App() {
  const [fileName, setFileName] = useState("");
  const [hasLoadedFile, setHasLoadedFile] = useState(false);
  const [restoredWordNumber, setRestoredWordNumber] = useState<number | null>(
    null,
  );
  const [fileMetadata, setFileMetadata] =
    useState<ReaderFileMetadata | null>(null);
  const [chapters, setChapters] = useState<ReaderChapter[]>([]);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const {
    initialTheme,
    initialWpm,
    getRestoredProgress,
    savePreferences,
    saveProgress,
  } = useReaderPersistence();
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
  } = useReaderState({ theme: initialTheme, wpm: initialWpm });

  const handleDocumentLoaded = (
    document: LoadedReaderDocument,
    file: File,
  ) => {
    const metadata: ReaderFileMetadata = {
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
    };

    const restoredProgress = getRestoredProgress(metadata);
    const chapterIndex =
      document.chapters.length > 0
        ? Math.min(
            restoredProgress.chapterIndex,
            document.chapters.length - 1,
          )
        : 0;
    const text =
      document.chapters.length > 0
        ? document.chapters[chapterIndex].text
        : document.text;

    loadText(text, restoredProgress.currentIndex);
    setFileName(file.name);
    setFileMetadata(metadata);
    setChapters(document.chapters);
    setSelectedChapterIndex(chapterIndex);
    setHasLoadedFile(true);
    setRestoredWordNumber(
      restoredProgress.currentIndex > 0
        ? restoredProgress.currentIndex + 1
        : null,
    );
  };

  const handleChapterChange = (chapterIndex: number) => {
    const chapter = chapters[chapterIndex];

    if (!chapter) {
      return;
    }

    setSelectedChapterIndex(chapterIndex);
    setRestoredWordNumber(null);
    loadText(chapter.text);
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
    currentWord: words[currentIndex] ?? "",
    canAdvance: canGoNext,
    onAdvance: nextWord,
    onStop: () => setHolding(false),
  });

  useEffect(() => {
    savePreferences(theme, wpm);
  }, [savePreferences, theme, wpm]);

  useEffect(() => {
    if (fileMetadata && words.length > 0) {
      saveProgress(currentIndex, selectedChapterIndex, fileMetadata);
    }
  }, [
    currentIndex,
    fileMetadata,
    saveProgress,
    selectedChapterIndex,
    words.length,
  ]);

  return (
    <div
      className={`app theme-${theme}${hasLoadedFile ? " has-document" : ""}`}
    >
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
          <div className="intro">
            <p className="eyebrow">Read at the speed of focus</p>
            <h1 id="welcome-title">Your words, one clear moment at a time.</h1>
            <p className="welcome-copy">
              A focused RSVP reader that keeps your text moving while you hold
              the space bar.
            </p>
          </div>

          <ReaderView
            words={words}
            currentIndex={currentIndex}
            isHolding={isHolding}
          />

          <ChapterSelector
            chapters={chapters}
            selectedIndex={selectedChapterIndex}
            onChapterChange={handleChapterChange}
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
            onHoldingChange={setHolding}
          />

          <FileLoader onDocumentLoaded={handleDocumentLoaded} />

          {hasLoadedFile && (
            <p className="load-result" role="status">
              {words.length > 0
                ? restoredWordNumber
                  ? `${fileName} resumed at word ${restoredWordNumber.toLocaleString()}.`
                  : `${fileName} is ready with ${words.length.toLocaleString()} words.`
                : `${fileName} did not contain any readable words.`}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
