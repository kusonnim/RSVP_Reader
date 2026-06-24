type ReaderControlsProps = {
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onReset: () => void;
};

function ReaderControls({
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  onReset,
}: ReaderControlsProps) {
  const hasText = canGoPrevious || canGoNext;

  return (
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
        disabled={!canGoPrevious || !hasText}
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
  );
}

export default ReaderControls;

