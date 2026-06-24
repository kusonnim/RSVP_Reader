export function tokenizeText(text: string): string[] {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return [];
  }

  return normalizedText.split(/\s+/).filter(Boolean);
}

