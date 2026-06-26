import { useEffect, useRef, useState, type PointerEvent } from "react";
import { vibrate } from "../lib/haptics";
import { splitWordAtOrp } from "../lib/orp";
import { getReaderWordPresentation } from "../lib/readerDelimiters";

type ReaderViewProps = {
  words: string[];
  currentIndex: number;
  isHolding: boolean;
  showContext: boolean;
  onJumpStart: () => void;
  onJumpToIndex: (index: number) => void;
};

const contextOffsets = [-2, -1, 0, 1, 2];
const JUMP_HOLD_DELAY_MS = 350;
const JUMP_EDGE_HIT_AREA_PX = 32;

type JumpPreview = {
  index: number;
  percent: number;
};

function getPerimeterPosition(percent: number, width: number, height: number) {
  const perimeter = 2 * (width + height);
  const distance = percent * perimeter;

  if (distance <= width) {
    return { x: distance, y: 0 };
  }

  if (distance <= width + height) {
    return { x: width, y: distance - width };
  }

  if (distance <= width + height + width) {
    return { x: width - (distance - width - height), y: height };
  }

  return { x: 0, y: height - (distance - width - height - width) };
}

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
  onJumpStart,
  onJumpToIndex,
}: ReaderViewProps) {
  const jumpPointerId = useRef<number | null>(null);
  const jumpHoldTimerId = useRef<number | null>(null);
  const pendingJumpPreview = useRef<JumpPreview | null>(null);
  const [jumpPreview, setJumpPreview] = useState<JumpPreview | null>(null);

  const clearJumpHoldTimer = () => {
    if (jumpHoldTimerId.current !== null) {
      window.clearTimeout(jumpHoldTimerId.current);
      jumpHoldTimerId.current = null;
    }
  };

  const getJumpPreview = (
    event: PointerEvent<HTMLElement>,
    element: HTMLElement,
  ): JumpPreview | null => {
    const rect = element.getBoundingClientRect();
    const x = Math.min(Math.max(0, event.clientX - rect.left), rect.width);
    const y = Math.min(Math.max(0, event.clientY - rect.top), rect.height);
    const distances = {
      top: y,
      right: rect.width - x,
      bottom: rect.height - y,
      left: x,
    };
    const nearestEdge = Object.entries(distances).sort(
      ([, distanceA], [, distanceB]) => distanceA - distanceB,
    )[0]?.[0];

    if (
      !nearestEdge ||
      distances[nearestEdge as keyof typeof distances] > JUMP_EDGE_HIT_AREA_PX
    ) {
      return null;
    }

    const perimeter = 2 * (rect.width + rect.height);
    let perimeterPosition = x;

    if (nearestEdge === "right") {
      perimeterPosition = rect.width + y;
    } else if (nearestEdge === "bottom") {
      perimeterPosition = rect.width + rect.height + (rect.width - x);
    } else if (nearestEdge === "left") {
      perimeterPosition =
        rect.width + rect.height + rect.width + (rect.height - y);
    }

    const percent = Math.min(1, Math.max(0, perimeterPosition / perimeter));
    const index = Math.min(
      words.length - 1,
      Math.max(0, Math.round(percent * (words.length - 1))),
    );

    return { index, percent };
  };

  const startJumpGesture = (event: PointerEvent<HTMLElement>) => {
    const preview = getJumpPreview(event, event.currentTarget);

    if (!preview) {
      return;
    }

    event.preventDefault();
    jumpPointerId.current = event.pointerId;
    pendingJumpPreview.current = preview;
    event.currentTarget.setPointerCapture(event.pointerId);

    jumpHoldTimerId.current = window.setTimeout(() => {
      jumpHoldTimerId.current = null;
      onJumpStart();
      vibrate([10, 20, 10]);
      setJumpPreview(pendingJumpPreview.current);
    }, JUMP_HOLD_DELAY_MS);
  };

  const updateJumpGesture = (event: PointerEvent<HTMLElement>) => {
    if (jumpPointerId.current !== event.pointerId) {
      return;
    }

    event.preventDefault();

    const preview = getJumpPreview(event, event.currentTarget);

    if (!preview) {
      return;
    }

    pendingJumpPreview.current = preview;

    if (jumpPreview) {
      setJumpPreview(preview);
    }
  };

  const finishJumpGesture = (event: PointerEvent<HTMLElement>) => {
    if (jumpPointerId.current !== event.pointerId) {
      return;
    }

    const committedPreview = jumpPreview;

    clearJumpHoldTimer();
    jumpPointerId.current = null;
    pendingJumpPreview.current = null;
    setJumpPreview(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (committedPreview) {
      onJumpToIndex(committedPreview.index);
    }
  };

  useEffect(
    () => () => {
      clearJumpHoldTimer();
    },
    [],
  );

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
  const displayProgress = jumpPreview ? jumpPreview.percent * 100 : progress;
  const thumbPosition = getPerimeterPosition(displayProgress / 100, 100, 100);
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
        className={`reader-view${isHolding ? " is-reading" : ""}${
          jumpPreview ? " is-jumping" : ""
        }`}
        aria-label="Reader"
        aria-live="polite"
        aria-atomic="true"
        onPointerDown={startJumpGesture}
        onPointerMove={updateJumpGesture}
        onPointerUp={finishJumpGesture}
        onPointerCancel={finishJumpGesture}
        onLostPointerCapture={finishJumpGesture}
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
            strokeDashoffset={100 - displayProgress}
          />
          <circle
            className="reader-progress-thumb"
            cx={`${thumbPosition.x}%`}
            cy={`${thumbPosition.y}%`}
            r="0.22rem"
            pathLength="100"
            vectorEffect="non-scaling-stroke"
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
          {((jumpPreview?.index ?? currentIndex) + 1).toLocaleString()} /{" "}
          {words.length.toLocaleString()}
        </span>
        {jumpPreview ? (
          <span className="reader-jump-preview" aria-hidden="true">
            Jump to {Math.round(jumpPreview.percent * 100)}% - word{" "}
            {(jumpPreview.index + 1).toLocaleString()}
          </span>
        ) : null}
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
