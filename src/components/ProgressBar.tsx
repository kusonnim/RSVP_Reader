type ProgressBarProps = {
  currentIndex: number;
  totalWords: number;
};

function ProgressBar({ currentIndex, totalWords }: ProgressBarProps) {
  const currentWord = totalWords > 0 ? currentIndex + 1 : 0;
  const progress = totalWords > 0 ? (currentWord / totalWords) * 100 : 0;

  return (
    <div className="progress">
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={totalWords}
        aria-valuenow={currentWord}
        aria-valuetext={
          totalWords > 0
            ? `Word ${currentWord} of ${totalWords}`
            : "No text loaded"
        }
      >
        <span
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="progress-label">
        {currentWord.toLocaleString()} / {totalWords.toLocaleString()}
      </span>
    </div>
  );
}

export default ProgressBar;

