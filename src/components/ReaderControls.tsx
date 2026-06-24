type ReaderControlsProps = {
  hasWords: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isHolding: boolean;
  wpm: number;
  onPrevious: () => void;
  onNext: () => void;
  onReset: () => void;
  onWpmChange: (wpm: number) => void;
};

function ReaderControls({
  hasWords,
  canGoPrevious,
  canGoNext,
  isHolding,
  wpm,
  onPrevious,
  onNext,
  onReset,
  onWpmChange,
}: ReaderControlsProps) {
  return (
    <div className="controls-panel">
      <div className="speed-control">
        <label htmlFor="wpm">Reading speed</label>
        <div className="speed-input-row">
          <input
            id="wpm"
            type="range"
            min="100"
            max="1000"
            step="25"
            value={wpm}
            onChange={(event) => onWpmChange(Number(event.target.value))}
          />
          <output htmlFor="wpm">{wpm} WPM</output>
        </div>
      </div>

      <div className="reader-controls" aria-label="Reader controls">
        <button
          className="control-button"
          type="button"
          onClick={onPrevious}
          disabled={!canGoPrevious}
        >
          <span aria-hidden="true">←</span>
          Previous
        </button>
        <button
          className="control-button control-button-reset"
          type="button"
          onClick={onReset}
          disabled={!canGoPrevious}
        >
          Reset
        </button>
        <button
          className="control-button"
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
        >
          Next
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <p className={`hold-instruction${isHolding ? " is-active" : ""}`}>
        <kbd>Space</kbd>
        {isHolding ? " Reading…" : hasWords ? " Hold to read" : " Load text to begin"}
      </p>
    </div>
  );
}

export default ReaderControls;
