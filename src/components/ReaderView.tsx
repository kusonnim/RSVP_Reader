type ReaderViewProps = {
  words: string[];
  currentIndex: number;
  isHolding: boolean;
};

const contextOffsets = [-2, -1, 0, 1, 2];

function ReaderView({ words, currentIndex, isHolding }: ReaderViewProps) {
  if (words.length === 0) {
    return (
      <section className="reader-view reader-view-empty" aria-live="polite">
        <p className="reader-empty-title">Ready when you are.</p>
        <p className="reader-empty-copy">
          Choose a TXT or EPUB file to place its first word here.
        </p>
      </section>
    );
  }

  const currentWordNumber = currentIndex + 1;
  const progress = (currentWordNumber / words.length) * 100;

  return (
    <section
      className={`reader-view${isHolding ? " is-reading" : ""}`}
      aria-label="Reader"
      aria-live="polite"
      aria-atomic="true"
    >
      <svg
        className="reader-progress-outline"
        aria-hidden="true"
      >
        <rect
          className="reader-progress-track"
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx="16"
          ry="16"
          pathLength="100"
        />
        <rect
          className="reader-progress-fill"
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx="16"
          ry="16"
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={100 - progress}
        />
      </svg>

      <div className="reader-context" aria-hidden="true">
        {contextOffsets.map((offset) => {
          const word = words[currentIndex + offset];
          const isCurrent = offset === 0;
          const side =
            offset < 0 ? "previous" : offset > 0 ? "next" : "current";
          const distance = Math.abs(offset);
          const wordLength = word ? Array.from(word).length : 0;
          const lengthClass =
            wordLength > 18
              ? "reader-word-extra-long"
              : wordLength > 12
                ? "reader-word-long"
                : wordLength > 8
                  ? "reader-word-medium"
                  : "reader-word-short";

          return (
            <span
              className={[
                "reader-word",
                `reader-word-${side}`,
                `reader-word-distance-${distance}`,
                lengthClass,
                isCurrent ? "reader-word-current" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={offset}
            >
              {word ?? ""}
            </span>
          );
        })}
      </div>
      <span className="visually-hidden">
        Current word: {words[currentIndex]}
      </span>
      <span className="reader-progress-label" aria-hidden="true">
        {currentWordNumber.toLocaleString()} / {words.length.toLocaleString()}
      </span>
      <span
        className="visually-hidden"
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={words.length}
        aria-valuenow={currentWordNumber}
        aria-valuetext={`Word ${currentWordNumber} of ${words.length}`}
      />
    </section>
  );
}

export default ReaderView;
