import { Card, Deck } from "../types";

export const parseDeck = (text: string): Deck => {
  const trimmedText = text.trim();
  const lines = trimmedText ? trimmedText.split("\n") : [];
  const cards: Card[] = [];
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // Remove (Custom Image) marker
    const lineWithoutCustomMarker = trimmedLine
      .replace(/\s*\(Custom Image\)\s*$/i, "")
      .trim();

    // Extract set information in brackets [SET:NUM]
    const setMatch = lineWithoutCustomMarker.match(/\[([^:]+):([^\]]+)\]/);
    const requestedSet = setMatch ? setMatch[1].trim() : undefined;
    const requestedCollectorNumber = setMatch ? setMatch[2].trim() : undefined;

    // Remove set information from the line for name/quantity parsing
    const lineWithoutSet = lineWithoutCustomMarker
      .replace(/\s*\[[^\]]+\]\s*/g, " ")
      .trim();

    const match =
      lineWithoutSet.match(/^(\d+)x?\s+(.+)$/) ||
      lineWithoutSet.match(/^(.+)$/);

    if (match) {
      const quantity = match[2] ? parseInt(match[1]) : 1;
      const name = match[2] || match[1];
      cards.push({
        quantity,
        name: name.trim(),
        requestedSet,
        requestedCollectorNumber,
      });
    }
  });
  return {
    cards,
    numCards: countNumCards(cards),
    numUniqueCards: countUniqueCards(cards),
  };
};

const countNumCards = (cards: Card[]): number => {
  return cards.reduce((sum, card) => sum + card.quantity, 0);
};

const countUniqueCards = (cards: Card[]): number => {
  return cards.length;
};
