import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

type HoldToReadButtonProps = {
  canRead: boolean;
  hasWords: boolean;
  isHolding: boolean;
  onHoldingChange: (isHolding: boolean) => void;
};

function HoldToReadButton({
  canRead,
  hasWords,
  isHolding,
  onHoldingChange,
}: HoldToReadButtonProps) {
  const activePointerId = useRef<number | null>(null);

  useEffect(() => {
    if (!isHolding) {
      activePointerId.current = null;
    }
  }, [isHolding]);

  const startPointerHold = (event: PointerEvent<HTMLButtonElement>) => {
    if (!canRead || activePointerId.current !== null) {
      return;
    }

    event.preventDefault();
    activePointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    onHoldingChange(true);
  };

  const stopPointerHold = (event: PointerEvent<HTMLButtonElement>) => {
    if (activePointerId.current !== event.pointerId) {
      return;
    }

    activePointerId.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    onHoldingChange(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (
      canRead &&
      !event.repeat &&
      (event.key === " " || event.key === "Enter")
    ) {
      event.preventDefault();
      onHoldingChange(true);
    }
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      onHoldingChange(false);
    }
  };

  const label = !hasWords
    ? "Load text to begin"
    : !canRead
      ? "End of chapter"
      : isHolding
        ? "Reading... release to pause"
        : "Press and hold to read";

  return (
    <button
      className={`mobile-hold-button${isHolding ? " is-active" : ""}`}
      type="button"
      disabled={!canRead}
      aria-pressed={isHolding}
      onPointerDown={startPointerHold}
      onPointerUp={stopPointerHold}
      onPointerCancel={stopPointerHold}
      onLostPointerCapture={stopPointerHold}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onBlur={() => onHoldingChange(false)}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span className="hold-button-icon" aria-hidden="true">
        {isHolding ? "●" : "▶"}
      </span>
      <span>{label}</span>
    </button>
  );
}

export default HoldToReadButton;
