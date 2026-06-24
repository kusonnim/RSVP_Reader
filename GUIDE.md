# Hold-to-Read Architecture

## Goal

This document defines the initial architecture for Hold-to-Read.

The project should be implemented step by step.
Do not build every future feature at once.

---

# Tech Stack

* Vite
* React
* TypeScript
* CSS
* No backend
* Client-side file processing only

---

# Folder Structure

```text
src/
  app/
    App.tsx
    App.css

  components/
    FileLoader.tsx
    ReaderView.tsx
    ReaderControls.tsx
    ThemeSelector.tsx
    ProgressBar.tsx

  hooks/
    useHoldPlayback.ts
    useKeyboardControls.ts
    useReaderState.ts

  lib/
    parseTxtFile.ts
    tokenizeText.ts
    timing.ts

  types/
    reader.ts

  styles/
    themes.css
    global.css

  main.tsx
```

---

# Core Data Model

```ts
export type ReaderState = {
  words: string[];
  currentIndex: number;
  wpm: number;
  isHolding: boolean;
  theme: ReaderTheme;
};

export type ReaderTheme = "light" | "dark" | "sepia";
```

---

# Main Components

## App

Responsibilities:

* Own top-level reader state
* Connect file loading, reader view, controls, and theme
* Apply current theme class

---

## FileLoader

Responsibilities:

* Accept `.txt` files
* Read file content in the browser
* Pass extracted text to the app

Does not:

* Tokenize text
* Control playback

---

## ReaderView

Responsibilities:

* Display current word
* Display surrounding context words
* Handle empty state

Suggested layout:

```text
[word -2] [word -1] [current] [word +1] [word +2]
```

---

## ReaderControls

Responsibilities:

* WPM control
* Previous / next word buttons
* Reset button
* Show hold-to-read instruction

---

## ThemeSelector

Responsibilities:

* Switch between light, dark, sepia themes
* Keep UI simple

---

## ProgressBar

Responsibilities:

* Show current progress
* Show current index / total words

---

# Hooks

## useHoldPlayback

Controls word advancement while Space is held.

Responsibilities:

* Start interval on hold
* Stop interval on release
* Prevent duplicate intervals
* Use WPM to calculate interval speed

Important formula:

```ts
const intervalMs = 60000 / wpm;
```

---

## useKeyboardControls

Responsibilities:

* Listen to keyboard events
* Space keydown → set holding true
* Space keyup → set holding false
* ArrowLeft → previous word
* ArrowRight → next word

Important:

* Ignore repeated Space keydown events.
* Prevent page scrolling when Space is used.

---

## useReaderState

Responsibilities:

* Store words
* Store current index
* Store WPM
* Store theme
* Provide actions:

  * loadText
  * nextWord
  * previousWord
  * reset
  * setWpm
  * setTheme

---

# Library Functions

## parseTxtFile

Input:

```ts
File
```

Output:

```ts
Promise<string>
```

Reads text from a TXT file.

---

## tokenizeText

Input:

```ts
string
```

Output:

```ts
string[]
```

Rules:

* Normalize whitespace
* Trim leading/trailing whitespace
* Split by spaces
* Remove empty tokens

---

## timing

Utility functions:

```ts
export function wpmToIntervalMs(wpm: number): number {
  return 60000 / wpm;
}
```

Future:

* punctuation-aware delay
* long-word delay

---

# Implementation Order

## Step 1: Project Setup

Create Vite + React + TypeScript project.

Set up:

* global CSS
* basic App layout
* theme CSS variables

---

## Step 2: TXT File Loading

Implement:

* FileLoader
* parseTxtFile
* tokenizeText

Goal:

After uploading a TXT file, the app has a valid `words` array.

---

## Step 3: Reader Display

Implement:

* ReaderView
* current word display
* previous 2 / next 2 context words
* empty state

---

## Step 4: Manual Navigation

Implement:

* previous word
* next word
* reset
* progress display

No automatic playback yet.

---

## Step 5: Hold-to-Read Playback

Implement:

* Space keydown starts playback
* Space keyup stops playback
* WPM controls speed
* duplicate timers are prevented

---

## Step 6: Themes

Implement:

* light
* dark
* sepia

Use CSS variables.

---

## Step 7: Polish

Add:

* responsive layout
* better typography
* disabled states
* simple keyboard help text

---

## Step 8: Persistence

Implement:

* remember theme
* remember WPM
* remember current index
* remember last file metadata
* restore progress when the same file is loaded again

Use browser local storage.

---

## Step 9: EPUB Support

Implement:

* accept `.epub` files
* extract plain text in the browser
* reuse the existing `tokenizeText` function

---

## Step 10: Smart Timing

Implement punctuation-aware playback timing:

* pause longer after sentence-ending punctuation
* pause slightly after commas and similar punctuation
* optionally give long words extra display time

---

## Step 11: EPUB Chapter Selection

Implement:

* expose EPUB spine sections as chapters
* let the reader switch chapters at any time
* preserve the selected chapter and word position

---

## Step 12: Mobile Hold-to-Read

Implement:

* touch-and-hold playback
* a large mobile-friendly hold target
* preserve keyboard controls on desktop

---

# Non-Goals for MVP

Do not implement yet:

* EPUB support
* PDF support
* user accounts
* cloud sync
* backend upload
* AI summarization
* annotations
* library management

---

# Future Extension Points

## EPUB Parser

```text
lib/parseEpubFile.ts
```

It outputs plain text in spine order and reuses the existing `tokenizeText`
function.

---

## Persistence

Add later:

```text
hooks/useReaderPersistence.ts
```

Store:

* theme
* WPM
* current index
* last file metadata

---

## Smart Timing

```text
lib/smartTiming.ts
```

Behavior:

* Pause longer after periods
* Pause slightly after commas
* Give longer words extra display time

```
```
