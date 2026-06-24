export type ReaderTheme = "light" | "dark" | "sepia";

export type ReaderFileMetadata = {
  name: string;
  size: number;
  lastModified: number;
};

export type ReaderState = {
  words: string[];
  currentIndex: number;
  wpm: number;
  isHolding: boolean;
  theme: ReaderTheme;
};

export type PersistedReaderState = {
  theme: ReaderTheme;
  wpm: number;
  currentIndex: number;
  lastFile: ReaderFileMetadata | null;
};
