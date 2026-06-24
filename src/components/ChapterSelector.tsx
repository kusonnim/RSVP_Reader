import type { ReaderChapter } from "../types/reader";

type ChapterSelectorProps = {
  chapters: ReaderChapter[];
  selectedIndex: number;
  onChapterChange: (index: number) => void;
};

function ChapterSelector({
  chapters,
  selectedIndex,
  onChapterChange,
}: ChapterSelectorProps) {
  if (chapters.length === 0) {
    return null;
  }

  return (
    <div className="chapter-selector">
      <label htmlFor="chapter">Chapter</label>
      <select
        id="chapter"
        value={selectedIndex}
        onChange={(event) => onChapterChange(Number(event.target.value))}
      >
        {chapters.map((chapter, index) => (
          <option value={index} key={chapter.id}>
            {index + 1}. {chapter.title}
          </option>
        ))}
      </select>
      <span>
        {selectedIndex + 1} of {chapters.length}
      </span>
    </div>
  );
}

export default ChapterSelector;

