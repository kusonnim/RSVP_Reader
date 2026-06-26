import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent,
} from "react";
import { vibrate } from "../lib/haptics";

const JUMP_HOLD_DELAY_MS = 350;
const JUMP_EDGE_HIT_AREA_PX = 52;
const JUMP_PATH_SAMPLE_COUNT = 180;
const JUMP_PATH_REFINE_STEPS = 8;

export type JumpPreview = {
  index: number;
  percent: number;
};

type ProgressThumbPosition = {
  x: number;
  y: number;
};

type UseProgressJumpOptions = {
  currentIndex: number;
  wordCount: number;
  onJumpStart: () => void;
  onJumpToIndex: (index: number) => void;
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

export function useProgressJump({
  currentIndex,
  wordCount,
  onJumpStart,
  onJumpToIndex,
}: UseProgressJumpOptions) {
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
      wordCount - 1,
      Math.max(0, Math.round(percent * (wordCount - 1))),
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

  const resetJumpGesture = (event: PointerEvent<HTMLElement>) => {
    if (jumpPointerId.current !== event.pointerId) {
      return false;
    }

    clearJumpHoldTimer();
    jumpPointerId.current = null;
    pendingJumpPreview.current = null;
    setJumpPreview(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    return true;
  };

  const commitJumpGesture = (event: PointerEvent<HTMLElement>) => {
    const committedPreview = jumpPreview;

    if (!resetJumpGesture(event)) {
      return;
    }

    if (committedPreview) {
      onJumpToIndex(committedPreview.index);
    }
  };

  const cancelJumpGesture = (event: PointerEvent<HTMLElement>) => {
    resetJumpGesture(event);
  };

  useEffect(
    () => () => {
      clearJumpHoldTimer();
    },
    [],
  );

  useEffect(() => {
    const progressFill = progressFillRef.current;

    if (!progressFill || wordCount === 0) {
      return;
    }

    const displayProgress = jumpPreview
      ? jumpPreview.percent * 100
      : ((currentIndex + 1) / wordCount) * 100;

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
  }, [currentIndex, jumpPreview, wordCount]);

  return {
    jumpPreview,
    progressFillRef,
    readerViewRef,
    thumbPosition,
    jumpZoneProps: {
      onPointerDown: startJumpGesture,
      onPointerMove: updateJumpGesture,
      onPointerUp: commitJumpGesture,
      onPointerCancel: cancelJumpGesture,
      onLostPointerCapture: cancelJumpGesture,
      onDragStart: (event: DragEvent<HTMLElement>) => {
        event.preventDefault();
      },
    },
  };
}
