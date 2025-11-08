import {
  Card,
  CardWithMetadata,
  ScryfallCard,
  ScryfallSearchResponse,
} from "../types";
import { sleep } from "./sleep";

const SCRYFALL_API_BASE = "https://api.scryfall.com";
const DELAY_BETWEEN_REQUESTS = 100; // Scryfall requests 50-100ms between requests

interface Params {
  cards: Card[];
  onStartFetch: (index: number) => void;
  onFetched: (index: number, card: CardWithMetadata) => void;
}

export const fetchAllCardMetadata = async ({
  cards,
  onStartFetch,
  onFetched,
}: Params): Promise<CardWithMetadata[]> => {
  const cardsWithMetadata: CardWithMetadata[] = [];
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    onStartFetch(i);
    const allPrintings = await fetchAllPrintings(card.name);
    let cardWithMetadata: CardWithMetadata;
    if (allPrintings.length > 0) {
      // Try to find the requested printing
      let selectedIndex = 0;
      if (card.requestedSet) {
        const requestedIndex = allPrintings.findIndex(
          (printing) =>
            printing.set.toLowerCase() === card.requestedSet!.toLowerCase() &&
            (!card.requestedCollectorNumber ||
              printing.collector_number === card.requestedCollectorNumber)
        );
        if (requestedIndex !== -1) {
          selectedIndex = requestedIndex;
        }
      }

      cardWithMetadata = {
        ...card,
        allPrintings,
        selectedIndex,
      };
    } else {
      // Create a placeholder if no printings found
      cardWithMetadata = {
        ...card,
        allPrintings: [
          {
            id: "",
            name: card.name,
            set: "",
            set_name: "",
            collector_number: "",
          },
        ],
        selectedIndex: 0,
      };
    }

    cardsWithMetadata.push(cardWithMetadata);
    onFetched(i, cardWithMetadata);

    // Respect Scryfall's rate limiting
    if (i < cards.length - 1) {
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
  }

  return cardsWithMetadata;
};

export const fetchAllPrintings = async (
  cardName: string
): Promise<ScryfallCard[]> => {
  try {
    const response = await fetch(
      `${SCRYFALL_API_BASE}/cards/search?q=${encodeURIComponent(
        `!"${cardName}" include:extras`
      )}&unique=prints&order=released`
    );
    if (!response.ok) {
      console.error(
        `Failed to fetch printings for ${cardName}: ${response.status}`
      );
      return [];
    }
    const data: ScryfallSearchResponse = await response.json();
    const filteredData = data.data.filter(
      (card) => card.name.toLowerCase() === cardName.toLowerCase()
    );
    return filteredData || [];
  } catch (error) {
    console.error(`Error fetching printings for ${cardName}:`, error);
    return [];
  }
};

export const getCardImageUrl = (card: CardWithMetadata): string | null => {
  // Prioritize custom image if uploaded
  if (card.customImageUrl) {
    return card.customImageUrl;
  }

  if (card.allPrintings.length === 0) return null;

  const selectedPrinting = card.allPrintings[card.selectedIndex];
  if (!selectedPrinting) return null;

  // Handle double-faced cards
  if (
    selectedPrinting.card_faces &&
    selectedPrinting.card_faces[0]?.image_uris
  ) {
    return selectedPrinting.card_faces[0].image_uris.normal;
  }

  // Handle normal cards
  if (selectedPrinting.image_uris) {
    return selectedPrinting.image_uris.normal;
  }

  return null;
};
