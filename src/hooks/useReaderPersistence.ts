import { useCallback, useRef, useState } from "react";
import type {
  PersistedReaderState,
  ReaderFileMetadata,
  ReaderTheme,
} from "../types/reader";

const STORAGE_KEY = "hold-to-read:reader-state";
const DEFAULT_WPM = 300;
const MIN_WPM = 100;
const MAX_WPM = 1000;
const DEFAULT_THEME: ReaderTheme = "light";

function isReaderTheme(value: unknown): value is ReaderTheme {
  return value === "light" || value === "dark" || value === "sepia";
}

function readPersistedState(): PersistedReaderState {
  const fallback: PersistedReaderState = {
    theme: DEFAULT_THEME,
    wpm: DEFAULT_WPM,
    currentIndex: 0,
    chapterIndex: 0,
    lastFile: null,
  };

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return fallback;
    }

    const parsed = JSON.parse(storedValue) as Partial<PersistedReaderState>;

    return {
      theme: isReaderTheme(parsed.theme) ? parsed.theme : fallback.theme,
      wpm:
        typeof parsed.wpm === "number" && Number.isFinite(parsed.wpm)
          ? Math.min(MAX_WPM, Math.max(MIN_WPM, parsed.wpm))
          : fallback.wpm,
      currentIndex:
        typeof parsed.currentIndex === "number" &&
        Number.isInteger(parsed.currentIndex) &&
        parsed.currentIndex >= 0
          ? parsed.currentIndex
          : fallback.currentIndex,
      chapterIndex:
        typeof parsed.chapterIndex === "number" &&
        Number.isInteger(parsed.chapterIndex) &&
        parsed.chapterIndex >= 0
          ? parsed.chapterIndex
          : fallback.chapterIndex,
      lastFile:
        parsed.lastFile &&
        typeof parsed.lastFile.name === "string" &&
        typeof parsed.lastFile.size === "number" &&
        typeof parsed.lastFile.lastModified === "number"
          ? parsed.lastFile
          : null,
    };
  } catch {
    return fallback;
  }
}

function writePersistedState(state: PersistedReaderState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persistence is optional when storage is unavailable or full.
  }
}

function filesMatch(
  first: ReaderFileMetadata | null,
  second: ReaderFileMetadata,
): boolean {
  return (
    first?.name === second.name &&
    first.size === second.size &&
    first.lastModified === second.lastModified
  );
}

export function useReaderPersistence() {
  const [initialState] = useState(readPersistedState);
  const persistedState = useRef(initialState);

  const savePreferences = useCallback((theme: ReaderTheme, wpm: number) => {
    persistedState.current = { ...persistedState.current, theme, wpm };
    writePersistedState(persistedState.current);
  }, []);

  const saveProgress = useCallback(
    (
      currentIndex: number,
      chapterIndex: number,
      lastFile: ReaderFileMetadata,
    ) => {
      persistedState.current = {
        ...persistedState.current,
        currentIndex,
        chapterIndex,
        lastFile,
      };
      writePersistedState(persistedState.current);
    },
    [],
  );

  const getRestoredProgress = useCallback(
    (file: ReaderFileMetadata) =>
      filesMatch(persistedState.current.lastFile, file)
        ? {
            currentIndex: persistedState.current.currentIndex,
            chapterIndex: persistedState.current.chapterIndex,
          }
        : { currentIndex: 0, chapterIndex: 0 },
    [],
  );

  return {
    initialTheme: initialState.theme,
    initialWpm: initialState.wpm,
    getRestoredProgress,
    savePreferences,
    saveProgress,
  };
}
