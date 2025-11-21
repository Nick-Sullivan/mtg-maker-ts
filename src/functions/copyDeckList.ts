import { DeckWithMetadata } from "../types";

export const formatDeckList = (deck: DeckWithMetadata): string => {
  const lines: string[] = [];

  deck.cards.forEach((card) => {
    if (
      card.customImageUrl ||
      (card.customImageUrls && card.customImageUrls.length > 0)
    ) {
      lines.push(`${card.quantity}x ${card.name} [CUSTOM]`);
    } else {
      const selectedPrinting = card.allPrintings[card.selectedIndex];
      const setInfo = selectedPrinting
        ? ` [${selectedPrinting.set.toUpperCase()}:${
            selectedPrinting.collector_number
          }]`
        : "";
      lines.push(`${card.quantity}x ${card.name}${setInfo}`);
    }
  });

  return lines.join("\n");
};
