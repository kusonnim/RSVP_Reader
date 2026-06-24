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

  return (
    <section
      className={`reader-view${isHolding ? " is-reading" : ""}`}
      aria-label="Reader"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="reader-context" aria-hidden="true">
        {contextOffsets.map((offset) => {
          const word = words[currentIndex + offset];
          const isCurrent = offset === 0;

          return (
            <span
              className={`reader-word${isCurrent ? " reader-word-current" : ""}`}
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
    </section>
  );
}

export default ReaderView;
