export type ReaderTheme = "light" | "dark" | "sepia";

export type ReaderState = {
  words: string[];
  currentIndex: number;
  wpm: number;
  isHolding: boolean;
  theme: ReaderTheme;
};

