import { useEffect } from "react";
import { wpmToIntervalMs } from "../lib/timing";

type UseHoldPlaybackOptions = {
  isHolding: boolean;
  wpm: number;
  canAdvance: boolean;
  onAdvance: () => void;
  onStop: () => void;
};

export function useHoldPlayback({
  isHolding,
  wpm,
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

    const intervalId = window.setInterval(onAdvance, wpmToIntervalMs(wpm));

    return () => {
      window.clearInterval(intervalId);
    };
  }, [canAdvance, isHolding, onAdvance, onStop, wpm]);
}

