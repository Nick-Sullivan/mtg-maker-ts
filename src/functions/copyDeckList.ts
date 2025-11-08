import { DeckWithMetadata } from "../types";

export const formatDeckList = (deck: DeckWithMetadata): string => {
  const lines: string[] = [];

  deck.cards.forEach((card) => {
    const selectedPrinting = card.allPrintings[card.selectedIndex];
    const setInfo = selectedPrinting
      ? ` [${selectedPrinting.set.toUpperCase()}:${
          selectedPrinting.collector_number
        }]`
      : "";
    const customInfo = card.customImageUrl ? " (Custom Image)" : "";

    lines.push(`${card.quantity}x ${card.name}${setInfo}${customInfo}`);
  });

  return lines.join("\n");
};
