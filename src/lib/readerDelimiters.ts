export type ActiveDelimiter = {
  open: string;
  close: string;
};

type DelimiterState = ActiveDelimiter[];

const pairedDelimiters = new Map<string, string>([
  ["(", ")"],
  ["[", "]"],
  ["{", "}"],
  ["“", "”"],
  ["‘", "’"],
  ["«", "»"],
  ["‹", "›"],
]);

const closingDelimiters = new Map(
  Array.from(pairedDelimiters, ([open, close]) => [close, open]),
);

const symmetricDelimiters = new Set(['"', "'"]);
const allDelimiterCharacters = new Set([
  ...pairedDelimiters.keys(),
  ...closingDelimiters.keys(),
  ...symmetricDelimiters,
]);
const boundaryPunctuationPattern = /[\p{P}\p{S}]/u;
const latinLetterPattern = /\p{Script=Latin}/u;

type DelimiterEvent = {
  mark: string;
  position: "leading" | "trailing";
};

function findLastMatchingIndex(
  state: DelimiterState,
  predicate: (delimiter: ActiveDelimiter) => boolean,
): number {
  for (let index = state.length - 1; index >= 0; index -= 1) {
    if (predicate(state[index])) {
      return index;
    }
  }

  return -1;
}

function toggleSymmetricDelimiter(state: DelimiterState, mark: string) {
  const matchingIndex = findLastMatchingIndex(
    state,
    (delimiter) => delimiter.open === mark && delimiter.close === mark,
  );

  if (matchingIndex >= 0) {
    state.splice(matchingIndex, 1);
  } else {
    state.push({ open: mark, close: mark });
  }
}

function hasMatchingSymmetricDelimiter(state: DelimiterState, mark: string) {
  return state.some(
    (delimiter) => delimiter.open === mark && delimiter.close === mark,
  );
}

function hasMatchingPairedDelimiter(
  state: DelimiterState,
  open: string,
  close: string,
) {
  return state.some(
    (delimiter) => delimiter.open === open && delimiter.close === close,
  );
}

function applyDelimiter(
  state: DelimiterState,
  mark: string,
  position: "leading" | "trailing",
) {
  const close = pairedDelimiters.get(mark);

  if (close) {
    if (
      position === "leading" &&
      hasMatchingPairedDelimiter(state, mark, close)
    ) {
      return;
    }

    state.push({ open: mark, close });
    return;
  }

  const expectedOpen = closingDelimiters.get(mark);

  if (expectedOpen) {
    const matchingIndex = findLastMatchingIndex(
      state,
      (delimiter) =>
        delimiter.open === expectedOpen && delimiter.close === mark,
    );

    if (matchingIndex >= 0) {
      state.splice(matchingIndex, 1);
    }

    return;
  }

  if (symmetricDelimiters.has(mark)) {
    if (position === "leading") {
      const isAlreadyOpen = state.some(
        (delimiter) => delimiter.open === mark && delimiter.close === mark,
      );

      if (isAlreadyOpen) {
        return;
      }

      state.push({ open: mark, close: mark });
      return;
    }

    toggleSymmetricDelimiter(state, mark);
  }
}

function isInsideLatinWord(characters: string[], index: number) {
  return (
    index > 0 &&
    index < characters.length - 1 &&
    latinLetterPattern.test(characters[index - 1]) &&
    latinLetterPattern.test(characters[index + 1])
  );
}

function isLeadingDelimiterPosition(characters: string[], index: number) {
  return (
    index === 0 ||
    boundaryPunctuationPattern.test(characters[index - 1])
  );
}

function shouldApplyDelimiter(
  state: DelimiterState,
  characters: string[],
  index: number,
) {
  const mark = characters[index];

  if (!allDelimiterCharacters.has(mark)) {
    return false;
  }

  if (pairedDelimiters.has(mark)) {
    return isLeadingDelimiterPosition(characters, index);
  }

  const expectedOpen = closingDelimiters.get(mark);

  if (expectedOpen) {
    return state.some(
      (delimiter) =>
        delimiter.open === expectedOpen && delimiter.close === mark,
    );
  }

  if (symmetricDelimiters.has(mark)) {
    if (mark === "'" && isInsideLatinWord(characters, index)) {
      return false;
    }

    if (hasMatchingSymmetricDelimiter(state, mark)) {
      return index > 0 || isLeadingDelimiterPosition(characters, index);
    }

    return isLeadingDelimiterPosition(characters, index);
  }

  return false;
}

function getWordDelimiters(state: DelimiterState, word: string) {
  const characters = Array.from(word);
  const events: DelimiterEvent[] = [];
  const text: string[] = [];

  for (let index = 0; index < characters.length; index += 1) {
    const mark = characters[index];

    if (shouldApplyDelimiter(state, characters, index)) {
      const position = isLeadingDelimiterPosition(characters, index)
        ? "leading"
        : "trailing";
      events.push({ mark, position });
      applyDelimiter(state, mark, position);
    } else {
      text.push(mark);
    }
  }

  return { events, text: text.join("") };
}

function processWord(
  state: DelimiterState,
  word: string,
  observedStates?: DelimiterState[],
) {
  const stateForScanning = [...state];
  const boundaries = getWordDelimiters(stateForScanning, word);

  boundaries.events.forEach(({ mark, position }) => {
    applyDelimiter(state, mark, position);
    observedStates?.push([...state]);
  });

  return boundaries;
}

function mergeDelimiterStates(
  before: DelimiterState,
  after: DelimiterState,
): DelimiterState {
  const merged = [...before];

  for (const delimiter of after) {
    if (
      !merged.some(
        (current) =>
          current.open === delimiter.open && current.close === delimiter.close,
      )
    ) {
      merged.push(delimiter);
    }
  }

  return merged;
}

export function getReaderWordPresentation(
  words: string[],
  currentIndex: number,
) {
  const state: DelimiterState = [];

  for (let index = 0; index < currentIndex; index += 1) {
    processWord(state, words[index]);
  }

  const beforeCurrent = [...state];
  const observedStates: DelimiterState[] = [];
  const currentBoundaries = processWord(
    state,
    words[currentIndex] ?? "",
    observedStates,
  );
  const visibleDelimiters = observedStates.reduce(
    (visible, observed) => mergeDelimiterStates(visible, observed),
    mergeDelimiterStates(beforeCurrent, state),
  );

  return {
    text: currentBoundaries.text,
    openMarks: visibleDelimiters.map((delimiter) => delimiter.open).join(""),
    closeMarks: [...visibleDelimiters]
      .reverse()
      .map((delimiter) => delimiter.close)
      .join(""),
  };
}
