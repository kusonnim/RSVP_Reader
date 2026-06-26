import { useEffect } from "react";
import { getWordDisplayDurationMs } from "../lib/smartTiming";

type UseHoldPlaybackOptions = {
  isHolding: boolean;
  wpm: number;
  currentWord: string;
  canAdvance: boolean;
  canAdvanceChapter?: boolean;
  onAdvance: () => void;
  onAdvanceChapter?: () => void;
  onStop: () => void;
};

export function useHoldPlayback({
  isHolding,
  wpm,
  currentWord,
  canAdvance,
  canAdvanceChapter = false,
  onAdvance,
  onAdvanceChapter,
  onStop,
}: UseHoldPlaybackOptions) {
  useEffect(() => {
    if (!isHolding) {
      return;
    }

    if (!canAdvance) {
      if (canAdvanceChapter && onAdvanceChapter) {
        const chapterTimeoutId = window.setTimeout(onAdvanceChapter, 1000);

        return () => {
          window.clearTimeout(chapterTimeoutId);
        };
      } else {
        onStop();
      }

      return;
    }

    const timeoutId = window.setTimeout(
      onAdvance,
      getWordDisplayDurationMs(currentWord, wpm),
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    canAdvance,
    canAdvanceChapter,
    currentWord,
    isHolding,
    onAdvance,
    onAdvanceChapter,
    onStop,
    wpm,
  ]);
}
