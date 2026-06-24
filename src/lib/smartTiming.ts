import { wpmToIntervalMs } from "./timing";

const SENTENCE_ENDING_PATTERN = /[.!?。！？]["'”’»）)\]}]*$/u;
const CLAUSE_ENDING_PATTERN = /[,;:，；：、]["'”’»）)\]}]*$/u;
const TRAILING_PUNCTUATION_PATTERN = /[\p{P}\p{S}]+$/gu;

const SENTENCE_MULTIPLIER = 1.8;
const CLAUSE_MULTIPLIER = 1.35;
const LONG_WORD_THRESHOLD = 8;
const LONG_WORD_INCREMENT = 0.05;
const MAX_LONG_WORD_MULTIPLIER = 1.4;

function getPunctuationMultiplier(word: string): number {
  if (SENTENCE_ENDING_PATTERN.test(word)) {
    return SENTENCE_MULTIPLIER;
  }

  if (CLAUSE_ENDING_PATTERN.test(word)) {
    return CLAUSE_MULTIPLIER;
  }

  return 1;
}

function getLongWordMultiplier(word: string): number {
  const readableWord = word.replace(TRAILING_PUNCTUATION_PATTERN, "");
  const characterCount = Array.from(readableWord).length;

  if (characterCount <= LONG_WORD_THRESHOLD) {
    return 1;
  }

  return Math.min(
    MAX_LONG_WORD_MULTIPLIER,
    1 + (characterCount - LONG_WORD_THRESHOLD) * LONG_WORD_INCREMENT,
  );
}

export function getWordDisplayDurationMs(word: string, wpm: number): number {
  const baseDuration = wpmToIntervalMs(wpm);
  const punctuationMultiplier = getPunctuationMultiplier(word);
  const longWordMultiplier = getLongWordMultiplier(word);

  return Math.round(
    baseDuration * Math.max(punctuationMultiplier, longWordMultiplier),
  );
}

