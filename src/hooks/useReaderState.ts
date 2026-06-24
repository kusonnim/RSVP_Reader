import { useCallback, useState } from "react";
import { tokenizeText } from "../lib/tokenizeText";
import type { ReaderState, ReaderTheme } from "../types/reader";

const DEFAULT_WPM = 300;
const MIN_WPM = 100;
const MAX_WPM = 1000;

export function useReaderState() {
  const [state, setState] = useState<ReaderState>({
    words: [],
    currentIndex: 0,
    wpm: DEFAULT_WPM,
    isHolding: false,
    theme: "light",
  });

  const loadText = useCallback((text: string) => {
    setState((current) => ({
      ...current,
      words: tokenizeText(text),
      currentIndex: 0,
      isHolding: false,
    }));
  }, []);

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
    reset,
    setWpm,
    setHolding,
    setTheme,
  };
}
