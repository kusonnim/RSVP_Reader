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

function applyDelimiter(
  state: DelimiterState,
  mark: string,
  position: "leading" | "trailing",
) {
  const close = pairedDelimiters.get(mark);

  if (close) {
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

      if (!isAlreadyOpen) {
        state.push({ open: mark, close: mark });
        return;
      }
    }

    toggleSymmetricDelimiter(state, mark);
  }
}

function getBoundaryDelimiters(word: string) {
  const characters = Array.from(word);
  const leading: string[] = [];
  const trailing: string[] = [];
  let start = 0;
  let end = characters.length;

  while (start < end && allDelimiterCharacters.has(characters[start])) {
    leading.push(characters[start]);
    start += 1;
  }

  while (end > start && allDelimiterCharacters.has(characters[end - 1])) {
    trailing.unshift(characters[end - 1]);
    end -= 1;
  }

  return {
    leading,
    trailing,
    text: characters.slice(start, end).join(""),
  };
}

function processWord(
  state: DelimiterState,
  word: string,
  observedStates?: DelimiterState[],
) {
  const boundaries = getBoundaryDelimiters(word);

  boundaries.leading.forEach((mark) => {
    applyDelimiter(state, mark, "leading");
    observedStates?.push([...state]);
  });
  boundaries.trailing.forEach((mark) => {
    applyDelimiter(state, mark, "trailing");
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
