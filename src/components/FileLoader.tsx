import { type ChangeEvent, useRef, useState } from "react";
import { parseEpubFile } from "../lib/parseEpubFile";
import { parseTxtFile } from "../lib/parseTxtFile";

type FileLoaderProps = {
  onTextLoaded: (text: string, file: File) => void;
};

function FileLoader({ onTextLoaded }: FileLoaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");

    const extension = file.name.toLowerCase().split(".").pop();

    if (extension !== "txt" && extension !== "epub") {
      setError("Please choose a TXT or EPUB file.");
      event.target.value = "";
      return;
    }

    setIsLoading(true);

    try {
      const text =
        extension === "epub"
          ? await parseEpubFile(file)
          : await parseTxtFile(file);
      onTextLoaded(text, file);
    } catch {
      setError(
        `That ${extension?.toUpperCase()} file could not be read. Please try another file.`,
      );
    } finally {
      setIsLoading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="file-loader">
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept=".txt,.epub,text/plain,application/epub+zip"
        onChange={handleFileChange}
        aria-describedby={error ? "file-loader-error" : "file-loader-help"}
      />
      <button
        className="file-loader-button"
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
      >
        {isLoading ? "Reading file..." : "Choose a TXT or EPUB file"}
      </button>
      <p id="file-loader-help" className="file-loader-help">
        Your TXT or EPUB stays in this browser.
      </p>
      {error && (
        <p id="file-loader-error" className="file-loader-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default FileLoader;
