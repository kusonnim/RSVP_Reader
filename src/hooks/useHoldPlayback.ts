import { useEffect } from "react";
import { getWordDisplayDurationMs } from "../lib/smartTiming";

type UseHoldPlaybackOptions = {
  isHolding: boolean;
  wpm: number;
  currentWord: string;
  canAdvance: boolean;
  onAdvance: () => void;
  onStop: () => void;
};

export function useHoldPlayback({
  isHolding,
  wpm,
  currentWord,
  canAdvance,
  onAdvance,
  onStop,
}: UseHoldPlaybackOptions) {
  useEffect(() => {
    if (!isHolding || !canAdvance) {
      if (isHolding && !canAdvance) {
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
  }, [canAdvance, currentWord, isHolding, onAdvance, onStop, wpm]);
}
