import HoldToReadButton from "./HoldToReadButton";

type ReaderControlsProps = {
  hasWords: boolean;
  wordCount: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  canContinueReading: boolean;
  isHolding: boolean;
  wpm: number;
  onPrevious: () => void;
  onNext: () => void;
  onScrubPrevious: (wordCount: number) => void;
  onScrubNext: (wordCount: number) => void;
  onReset: () => void;
  onWpmChange: (wpm: number) => void;
  onHoldingChange: (isHolding: boolean) => void;
};

function ReaderControls({
  hasWords,
  wordCount,
  canGoPrevious,
  canGoNext,
  canContinueReading,
  isHolding,
  wpm,
  onPrevious,
  onNext,
  onScrubPrevious,
  onScrubNext,
  onReset,
  onWpmChange,
  onHoldingChange,
}: ReaderControlsProps) {
  const scrubWordsPerStep = Math.min(
    80,
    Math.max(1, Math.round(wordCount / 250)),
  );

  return (
    <div className="controls-panel">
      <div className="speed-control">
        <label className="visually-hidden" htmlFor="wpm">
          Reading speed
        </label>
        <div className="speed-input-row">
          <input
            id="wpm"
            type="range"
            min="100"
            max="1000"
            step="25"
            value={wpm}
            onChange={(event) => onWpmChange(Number(event.target.value))}
            aria-valuetext={`${wpm} words per minute`}
          />
          <output htmlFor="wpm">{wpm} WPM</output>
        </div>
      </div>

      <HoldToReadButton
        canRead={canContinueReading}
        hasWords={hasWords}
        isHolding={isHolding}
        scrubWordsPerStep={scrubWordsPerStep}
        onScrubNext={onScrubNext}
        onScrubPrevious={onScrubPrevious}
        onHoldingChange={onHoldingChange}
      />

      <div className="reader-controls" aria-label="Reader controls">
        <button
          className="control-button"
          type="button"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          aria-label="Previous word"
          title="Previous word"
        >
          <span aria-hidden="true">&larr;</span>
        </button>
        <button
          className="control-button control-button-reset"
          type="button"
          onClick={onReset}
          disabled={!canGoPrevious}
          aria-label="Reset to first word"
          title="Reset"
        >
          <span aria-hidden="true">&#8634;</span>
        </button>
        <button
          className="control-button"
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          aria-label="Next word"
          title="Next word"
        >
          <span aria-hidden="true">&rarr;</span>
        </button>
      </div>

      <p className={`hold-instruction${isHolding ? " is-active" : ""}`}>
        <kbd>Space</kbd>
        {isHolding
          ? " Reading..."
          : hasWords
            ? " Hold"
            : " Open a file"}
      </p>
    </div>
  );
}

export default ReaderControls;
