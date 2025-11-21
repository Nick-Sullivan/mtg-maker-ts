import {
  Card,
  CardWithMetadata,
  ScryfallCard,
  ScryfallSearchResponse,
} from "../../types";
import { sleep } from "../sleep";
import { DELAY_BETWEEN_REQUESTS, SCRYFALL_API_BASE } from "./constants";

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

      const imageData = getCardImageUrls({ allPrintings, selectedIndex });

      cardWithMetadata = {
        ...card,
        allPrintings,
        selectedIndex,
        imageUrls: imageData.imageUrls,
        isDoubleFaced: imageData.isDoubleFaced,
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
        imageUrls: [],
        isDoubleFaced: false,
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
    const filteredData = data.data.filter((card) =>
      card.name.toLowerCase().startsWith(cardName.toLowerCase())
    );
    return filteredData || [];
  } catch (error) {
    console.error(`Error fetching printings for ${cardName}:`, error);
    return [];
  }
};

const getCardImageUrls = (
  card: Partial<CardWithMetadata>
): { imageUrls: string[]; isDoubleFaced: boolean } => {
  if (card.customImageUrls && card.customImageUrls.length > 0) {
    return {
      imageUrls: card.customImageUrls,
      isDoubleFaced: card.customImageUrls.length > 1,
    };
  }

  if (card.customImageUrl) {
    return { imageUrls: [card.customImageUrl], isDoubleFaced: false };
  }

  if (!card.allPrintings || card.allPrintings.length === 0) {
    return { imageUrls: [], isDoubleFaced: false };
  }

  const selectedPrinting = card.allPrintings[card.selectedIndex || 0];
  if (!selectedPrinting) {
    return { imageUrls: [], isDoubleFaced: false };
  }

  return getPrintingImageUrls(selectedPrinting);
};

export const getPrintingImageUrls = (
  printing: ScryfallCard
): { imageUrls: string[]; isDoubleFaced: boolean } => {
  if (printing.card_faces && printing.card_faces.length > 0) {
    const faces: string[] = [];
    printing.card_faces.forEach((face) => {
      if (face.image_uris?.normal) {
        faces.push(face.image_uris.normal);
      }
    });
    if (faces.length > 0) {
      return { imageUrls: faces, isDoubleFaced: faces.length > 1 };
    }
  }

  if (printing.image_uris?.normal) {
    return {
      imageUrls: [printing.image_uris.normal],
      isDoubleFaced: false,
    };
  }

  return { imageUrls: [], isDoubleFaced: false };
};
