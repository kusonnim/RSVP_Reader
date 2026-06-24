import { type ChangeEvent, useRef, useState } from "react";
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

    if (!file.name.toLowerCase().endsWith(".txt")) {
      setError("Please choose a .txt file.");
      event.target.value = "";
      return;
    }

    setIsLoading(true);

    try {
      const text = await parseTxtFile(file);
      onTextLoaded(text, file);
    } catch {
      setError("That file could not be read. Please try another TXT file.");
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
        accept=".txt,text/plain"
        onChange={handleFileChange}
        aria-describedby={error ? "file-loader-error" : "file-loader-help"}
      />
      <button
        className="file-loader-button"
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
      >
        {isLoading ? "Reading file…" : "Choose a TXT file"}
      </button>
      <p id="file-loader-help" className="file-loader-help">
        Your file stays in this browser.
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
