import { useEffect } from "react";

type UseKeyboardControlsOptions = {
  hasWords: boolean;
  onHoldingChange: (isHolding: boolean) => void;
  onNext: () => void;
  onPrevious: () => void;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLButtonElement
  );
}

export function useKeyboardControls({
  hasWords,
  onHoldingChange,
  onNext,
  onPrevious,
}: UseKeyboardControlsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();

        if (!event.repeat && hasWords) {
          onHoldingChange(true);
        }

        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onPrevious();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        onNext();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        onHoldingChange(false);
      }
    };

    const stopHolding = () => {
      onHoldingChange(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", stopHolding);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", stopHolding);
    };
  }, [hasWords, onHoldingChange, onNext, onPrevious]);
}

