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
  onScrubNext: () => void;
  onScrubPrevious: () => void;
  onHoldingChange: (isHolding: boolean) => void;
};

const SCRUB_DISTANCE_PX = 28;

function HoldToReadButton({
  canRead,
  hasWords,
  isHolding,
  onScrubNext,
  onScrubPrevious,
  onHoldingChange,
}: HoldToReadButtonProps) {
  const activePointerId = useRef<number | null>(null);
  const lastScrubX = useRef(0);

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
    lastScrubX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
    onHoldingChange(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (activePointerId.current !== event.pointerId || !isHolding) {
      return;
    }

    event.preventDefault();

    const movement = event.clientX - lastScrubX.current;

    if (Math.abs(movement) < SCRUB_DISTANCE_PX) {
      return;
    }

    const steps = Math.trunc(movement / SCRUB_DISTANCE_PX);
    const scrub = steps > 0 ? onScrubNext : onScrubPrevious;

    for (let step = 0; step < Math.abs(steps); step += 1) {
      scrub();
    }

    lastScrubX.current += steps * SCRUB_DISTANCE_PX;
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
      onPointerMove={handlePointerMove}
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
