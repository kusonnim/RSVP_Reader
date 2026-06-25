export type OrpParts = {
  before: string;
  focus: string;
  after: string;
};

function getOrpIndex(length: number): number {
  if (length <= 1) {
    return 0;
  }

  if (length <= 5) {
    return 1;
  }

  if (length <= 9) {
    return 2;
  }

  if (length <= 13) {
    return 3;
  }

  return Math.min(4, length - 1);
}

export function splitWordAtOrp(word: string): OrpParts {
  const characters = Array.from(word);

  if (characters.length === 0) {
    return { before: "", focus: "", after: "" };
  }

  const orpIndex = getOrpIndex(characters.length);

  return {
    before: characters.slice(0, orpIndex).join(""),
    focus: characters[orpIndex],
    after: characters.slice(orpIndex + 1).join(""),
  };
}

