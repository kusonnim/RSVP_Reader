export type ReaderTheme = "light" | "dark" | "sepia";

export type ReaderFileMetadata = {
  name: string;
  size: number;
  lastModified: number;
};

export type ReaderChapter = {
  id: string;
  title: string;
  text: string;
};

export type LoadedReaderDocument = {
  text: string;
  chapters: ReaderChapter[];
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
  chapterIndex: number;
  lastFile: ReaderFileMetadata | null;
};
