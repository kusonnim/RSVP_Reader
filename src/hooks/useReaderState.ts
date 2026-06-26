import { useCallback, useState } from "react";
import { tokenizeText } from "../lib/tokenizeText";
import type { ReaderState, ReaderTheme } from "../types/reader";

const DEFAULT_WPM = 300;
const MIN_WPM = 100;
const MAX_WPM = 1000;

type InitialReaderPreferences = {
  theme?: ReaderTheme;
  wpm?: number;
};

type LoadTextOptions = {
  keepHolding?: boolean;
};

export function useReaderState(initialPreferences: InitialReaderPreferences = {}) {
  const [state, setState] = useState<ReaderState>({
    words: [],
    currentIndex: 0,
    wpm: initialPreferences.wpm ?? DEFAULT_WPM,
    isHolding: false,
    theme: initialPreferences.theme ?? "light",
  });

  const loadText = useCallback(
    (text: string, restoredIndex = 0, options: LoadTextOptions = {}) => {
      const words = tokenizeText(text);

      setState((current) => ({
        ...current,
        words,
        currentIndex:
          words.length > 0
            ? Math.min(Math.max(0, restoredIndex), words.length - 1)
            : 0,
        isHolding: options.keepHolding ? current.isHolding : false,
      }));
    },
    [],
  );

  const nextWord = useCallback(() => {
    setState((current) => ({
      ...current,
      currentIndex: Math.min(
        Math.max(0, current.words.length - 1),
        current.currentIndex + 1,
      ),
    }));
  }, []);

  const previousWord = useCallback(() => {
    setState((current) => ({
      ...current,
      currentIndex: Math.max(0, current.currentIndex - 1),
    }));
  }, []);

  const moveWords = useCallback((delta: number) => {
    setState((current) => ({
      ...current,
      currentIndex:
        current.words.length > 0
          ? Math.min(
              Math.max(0, current.words.length - 1),
              Math.max(0, current.currentIndex + delta),
            )
          : 0,
    }));
  }, []);

  const reset = useCallback(() => {
    setState((current) => ({
      ...current,
      currentIndex: 0,
      isHolding: false,
    }));
  }, []);

  const setWpm = useCallback((wpm: number) => {
    setState((current) => ({
      ...current,
      wpm: Math.min(MAX_WPM, Math.max(MIN_WPM, wpm)),
    }));
  }, []);

  const setHolding = useCallback((isHolding: boolean) => {
    setState((current) => ({
      ...current,
      isHolding,
    }));
  }, []);

  const setTheme = useCallback((theme: ReaderTheme) => {
    setState((current) => ({
      ...current,
      theme,
    }));
  }, []);

  return {
    ...state,
    loadText,
    nextWord,
    previousWord,
    moveWords,
    reset,
    setWpm,
    setHolding,
    setTheme,
  };
}
