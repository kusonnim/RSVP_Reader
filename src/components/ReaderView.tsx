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
const JUMP_EDGE_HIT_AREA_PX = 52;
const JUMP_PATH_SAMPLE_COUNT = 180;
const JUMP_PATH_REFINE_STEPS = 8;

type JumpPreview = {
  index: number;
  percent: number;
};

type ProgressThumbPosition = {
  x: number;
  y: number;
};

const initialThumbPosition: ProgressThumbPosition = { x: 0, y: 0 };

function getDistanceSquared(
  point: DOMPoint,
  targetX: number,
  targetY: number,
) {
  return (point.x - targetX) ** 2 + (point.y - targetY) ** 2;
}

function getNearestPathPercent(
  path: SVGGeometryElement,
  targetX: number,
  targetY: number,
) {
  const totalLength = path.getTotalLength();
  let closestLength = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index <= JUMP_PATH_SAMPLE_COUNT; index += 1) {
    const length = (index / JUMP_PATH_SAMPLE_COUNT) * totalLength;
    const point = path.getPointAtLength(length);
    const distance = getDistanceSquared(point, targetX, targetY);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestLength = length;
    }
  }

  let searchRadius = totalLength / JUMP_PATH_SAMPLE_COUNT;

  for (let step = 0; step < JUMP_PATH_REFINE_STEPS; step += 1) {
    const beforeLength = Math.max(0, closestLength - searchRadius);
    const afterLength = Math.min(totalLength, closestLength + searchRadius);
    const beforeDistance = getDistanceSquared(
      path.getPointAtLength(beforeLength),
      targetX,
      targetY,
    );
    const afterDistance = getDistanceSquared(
      path.getPointAtLength(afterLength),
      targetX,
      targetY,
    );

    if (beforeDistance < closestDistance) {
      closestDistance = beforeDistance;
      closestLength = beforeLength;
    }

    if (afterDistance < closestDistance) {
      closestDistance = afterDistance;
      closestLength = afterLength;
    }

    searchRadius /= 2;
  }

  return {
    distance: Math.sqrt(closestDistance),
    percent: totalLength > 0 ? closestLength / totalLength : 0,
  };
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
  const readerViewRef = useRef<HTMLElement | null>(null);
  const progressFillRef = useRef<SVGRectElement | null>(null);
  const [jumpPreview, setJumpPreview] = useState<JumpPreview | null>(null);
  const [thumbPosition, setThumbPosition] =
    useState<ProgressThumbPosition>(initialThumbPosition);

  const clearJumpHoldTimer = () => {
    if (jumpHoldTimerId.current !== null) {
      window.clearTimeout(jumpHoldTimerId.current);
      jumpHoldTimerId.current = null;
    }
  };

  const getJumpPreview = (
    event: PointerEvent<HTMLElement>,
    readerElement: HTMLElement,
  ): JumpPreview | null => {
    const progressFill = progressFillRef.current;

    if (!progressFill) {
      return null;
    }

    const rect = readerElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const nearestPoint = getNearestPathPercent(progressFill, x, y);

    if (nearestPoint.distance > JUMP_EDGE_HIT_AREA_PX) {
      return null;
    }

    const percent = Math.min(1, Math.max(0, nearestPoint.percent));
    const index = Math.min(
      words.length - 1,
      Math.max(0, Math.round(percent * (words.length - 1))),
    );

    return { index, percent };
  };

  const startJumpGesture = (event: PointerEvent<HTMLElement>) => {
    const readerElement = readerViewRef.current;

    if (!readerElement) {
      return;
    }

    const preview = getJumpPreview(event, readerElement);

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

    const readerElement = readerViewRef.current;

    if (!readerElement) {
      return;
    }

    const preview = getJumpPreview(event, readerElement);

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

  useEffect(() => {
    const progressFill = progressFillRef.current;

    if (!progressFill || words.length === 0) {
      return;
    }

    const displayProgress = jumpPreview
      ? jumpPreview.percent * 100
      : ((currentIndex + 1) / words.length) * 100;

    const updateThumbPosition = () => {
      const totalLength = progressFill.getTotalLength();
      const point = progressFill.getPointAtLength(
        totalLength * (displayProgress / 100),
      );

      setThumbPosition({ x: point.x, y: point.y });
    };

    updateThumbPosition();

    const resizeObserver = new ResizeObserver(updateThumbPosition);
    resizeObserver.observe(progressFill);

    return () => {
      resizeObserver.disconnect();
    };
  }, [currentIndex, jumpPreview, words.length]);

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

      <div
        className="reader-jump-zone"
        onPointerDown={startJumpGesture}
        onPointerMove={updateJumpGesture}
        onPointerUp={finishJumpGesture}
        onPointerCancel={finishJumpGesture}
        onLostPointerCapture={finishJumpGesture}
        onDragStart={(event) => event.preventDefault()}
      >
        <section
          ref={readerViewRef}
          className={`reader-view${isHolding ? " is-reading" : ""}${
            jumpPreview ? " is-jumping" : ""
          }`}
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
              ref={progressFillRef}
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
              cx={thumbPosition.x}
              cy={thumbPosition.y}
              r="4"
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
    </div>
  );
}

export default ReaderView;
