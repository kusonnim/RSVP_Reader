import JSZip from "jszip";
import type { LoadedReaderDocument, ReaderChapter } from "../types/reader";

const CONTAINER_PATH = "META-INF/container.xml";

function parseXml(xml: string, label: string): Document {
  const document = new DOMParser().parseFromString(xml, "application/xml");

  if (document.querySelector("parsererror")) {
    throw new Error(`The EPUB ${label} is not valid XML.`);
  }

  return document;
}

function getElementsByLocalName(document: Document, name: string): Element[] {
  return Array.from(document.getElementsByTagName("*")).filter(
    (element) => element.localName === name,
  );
}

function normalizeArchivePath(path: string): string {
  const segments: string[] = [];

  for (const segment of path.replaceAll("\\", "/").split("/")) {
    if (!segment || segment === ".") {
      continue;
    }

    if (segment === "..") {
      segments.pop();
      continue;
    }

    segments.push(segment);
  }

  return segments.join("/");
}

function resolveArchivePath(baseFilePath: string, relativePath: string): string {
  const baseDirectory = baseFilePath.includes("/")
    ? baseFilePath.slice(0, baseFilePath.lastIndexOf("/") + 1)
    : "";
  const decodedPath = decodeURIComponent(relativePath.split("#")[0]);

  return normalizeArchivePath(`${baseDirectory}${decodedPath}`);
}

function extractChapter(markup: string, id: string): ReaderChapter {
  const document = new DOMParser().parseFromString(markup, "text/html");

  document
    .querySelectorAll("script, style, svg, noscript")
    .forEach((element) => element.remove());

  const text = document.body?.textContent?.replace(/\s+/g, " ").trim() ?? "";
  const heading = document.querySelector("h1, h2, h3, title");
  const title =
    heading?.textContent?.replace(/\s+/g, " ").trim() || "No heading";

  return { id, title, text };
}

export async function parseEpubFile(file: File): Promise<LoadedReaderDocument> {
  const archive = await JSZip.loadAsync(file);
  const containerEntry = archive.file(CONTAINER_PATH);

  if (!containerEntry) {
    throw new Error("The EPUB container file is missing.");
  }

  const containerDocument = parseXml(
    await containerEntry.async("text"),
    "container",
  );
  const rootFile = getElementsByLocalName(containerDocument, "rootfile")[0];
  const packagePath = rootFile?.getAttribute("full-path");

  if (!packagePath) {
    throw new Error("The EPUB package document could not be found.");
  }

  const normalizedPackagePath = normalizeArchivePath(packagePath);
  const packageEntry = archive.file(normalizedPackagePath);

  if (!packageEntry) {
    throw new Error("The EPUB package document is missing.");
  }

  const packageDocument = parseXml(
    await packageEntry.async("text"),
    "package document",
  );
  const manifest = new Map(
    getElementsByLocalName(packageDocument, "item").flatMap((item) => {
      const id = item.getAttribute("id");
      const href = item.getAttribute("href");

      return id && href ? [[id, href] as const] : [];
    }),
  );
  const spineItems = getElementsByLocalName(packageDocument, "itemref");
  const chapters: ReaderChapter[] = [];

  for (const spineItem of spineItems) {
    const id = spineItem.getAttribute("idref");
    const href = id ? manifest.get(id) : undefined;

    if (!href) {
      continue;
    }

    const chapterPath = resolveArchivePath(normalizedPackagePath, href);
    const chapterEntry = archive.file(chapterPath);

    if (!chapterEntry) {
      continue;
    }

    const chapter = extractChapter(
      await chapterEntry.async("text"),
      chapterPath,
    );

    if (chapter.text) {
      chapters.push(chapter);
    }
  }

  if (chapters.length === 0) {
    throw new Error("No readable spine content was found in the EPUB.");
  }

  return {
    text: chapters.map((chapter) => chapter.text).join("\n\n"),
    chapters,
  };
}
