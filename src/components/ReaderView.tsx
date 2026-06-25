import { getReaderWordPresentation } from "../lib/readerDelimiters";
import { splitWordAtOrp } from "../lib/orp";

type ReaderViewProps = {
  words: string[];
  currentIndex: number;
  isHolding: boolean;
  showContext: boolean;
};

const contextOffsets = [-2, -1, 0, 1, 2];

function getWordLengthClass(word: string): string {
  const wordLength = Array.from(word).length;

  if (wordLength > 18) {
    return "reader-word-extra-long";
  }

  if (wordLength > 12) {
    return "reader-word-long";
  }

  if (wordLength > 8) {
    return "reader-word-medium";
  }

  return "reader-word-short";
}

function ReaderView({
  words,
  currentIndex,
  isHolding,
  showContext,
}: ReaderViewProps) {
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
  const currentPresentation = getReaderWordPresentation(words, currentIndex);
  const currentDisplayWord = currentPresentation.text || words[currentIndex];
  const currentLengthClass = getWordLengthClass(currentDisplayWord);
  const orpParts = splitWordAtOrp(currentDisplayWord);
  const contextWords = contextOffsets.map((offset) => ({
    offset,
    word: words[currentIndex + offset] ?? "",
  }));

  return (
    <div className="reader-stage">
      <div
        className={`reader-context${showContext ? " is-visible" : ""}`}
        aria-hidden="true"
      >
        {contextWords.map(({ offset, word }) => {
          const side =
            offset < 0 ? "previous" : offset > 0 ? "next" : "current-preview";
          const distance = Math.abs(offset);
          const lengthClass = getWordLengthClass(word);

          return (
            <span
              className={[
                "reader-word",
                `reader-word-${side}`,
                `reader-word-distance-${distance}`,
                lengthClass,
              ].join(" ")}
              key={offset}
            >
              {word}
            </span>
          );
        })}
      </div>

      <section
        className={`reader-view${isHolding ? " is-reading" : ""}`}
        aria-label="Reader"
        aria-live="polite"
        aria-atomic="true"
      >
        <svg className="reader-progress-outline" aria-hidden="true">
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

        <div className="reader-focus-word">
          <span className="reader-fixed-mark reader-fixed-mark-open">
            {currentPresentation.openMarks}
          </span>
          <span
            className={`reader-word reader-word-current ${currentLengthClass}`}
          >
            <span className="orp-before">{orpParts.before}</span>
            <span className="orp-focus">{orpParts.focus}</span>
            <span className="orp-after">{orpParts.after}</span>
          </span>
          <span className="reader-fixed-mark reader-fixed-mark-close">
            {currentPresentation.closeMarks}
          </span>
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
    </div>
  );
}

export default ReaderView;
