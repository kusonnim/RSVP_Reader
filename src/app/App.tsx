import { useCallback, useEffect, useRef, useState } from "react";
import ChapterSelector from "../components/ChapterSelector";
import FileLoader from "../components/FileLoader";
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
  const iconUrl = `${import.meta.env.BASE_URL}icon.svg`;
  const [showContext, setShowContext] = useState(false);
  const contextTimerRef = useRef<number | null>(null);
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
    setFileMetadata(metadata);
    setChapters(document.chapters);
    setSelectedChapterIndex(chapterIndex);
  };

  const handleChapterChange = (chapterIndex: number) => {
    const chapter = chapters[chapterIndex];

    if (!chapter) {
      return;
    }

    setSelectedChapterIndex(chapterIndex);
    loadText(chapter.text);
  };

  const handleAdvanceChapter = useCallback(() => {
    const nextChapterIndex = selectedChapterIndex + 1;
    const chapter = chapters[nextChapterIndex];

    if (!chapter) {
      setHolding(false);
      return;
    }

    setSelectedChapterIndex(nextChapterIndex);
    loadText(chapter.text, 0, { keepHolding: true });
  }, [chapters, loadText, selectedChapterIndex, setHolding]);

  const canGoPrevious = words.length > 0 && currentIndex > 0;
  const canGoNext = words.length > 0 && currentIndex < words.length - 1;
  const canGoNextChapter =
    chapters.length > 0 && selectedChapterIndex < chapters.length - 1;

  const revealContext = useCallback(() => {
    setShowContext(true);

    if (contextTimerRef.current !== null) {
      window.clearTimeout(contextTimerRef.current);
    }

    contextTimerRef.current = window.setTimeout(() => {
      setShowContext(false);
      contextTimerRef.current = null;
    }, 900);
  }, []);

  useKeyboardControls({
    hasWords: words.length > 0,
    onHoldingChange: setHolding,
    onArrowNavigate: revealContext,
    onNext: nextWord,
    onPrevious: previousWord,
  });

  useHoldPlayback({
    isHolding,
    wpm,
    currentWord: words[currentIndex] ?? "",
    canAdvance: canGoNext,
    canAdvanceChapter: canGoNextChapter,
    onAdvance: nextWord,
    onAdvanceChapter: handleAdvanceChapter,
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

  useEffect(
    () => () => {
      if (contextTimerRef.current !== null) {
        window.clearTimeout(contextTimerRef.current);
      }
    },
    [],
  );

  return (
    <div className={`app theme-${theme}`}>
      <main className="app-shell">
        <header className="app-header">
          <span className="wordmark">
            <img src={iconUrl} alt="" aria-hidden="true" />
            <span>Hold-to-Read</span>
          </span>
          <div className="header-actions">
            <FileLoader onDocumentLoaded={handleDocumentLoaded} />
            <ThemeSelector theme={theme} onThemeChange={setTheme} />
          </div>
        </header>

        <section className="reader-panel" aria-label="Hold-to-Read reader">
          <ReaderView
            words={words}
            currentIndex={currentIndex}
            isHolding={isHolding}
            showContext={showContext}
          />

          <ChapterSelector
            chapters={chapters}
            selectedIndex={selectedChapterIndex}
            onChapterChange={handleChapterChange}
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
        </section>
      </main>
    </div>
  );
}

export default App;
