import { useEffect, useState } from "react";
import { formatDeckList } from "../functions/copyDeckList";
import { fetchAllCardMetadata } from "../functions/fetchCardArt";
import { parseDeck } from "../functions/parseDeck";
import { CardWithMetadata, DeckWithMetadata, StatusType } from "../types";

export function useDeckManagement() {
  const [deckText, setDeckText] = useState("");
  const [currentDeck, setCurrentDeck] = useState<DeckWithMetadata | null>(null);
  const [status, setStatus] = useState({ message: "", type: "" as StatusType });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [artLoadingComplete, setArtLoadingComplete] = useState(false);

  const deck = parseDeck(deckText);

  // Auto-update deck list when currentDeck changes
  useEffect(() => {
    if (currentDeck && artLoadingComplete) {
      const formattedDeckList = formatDeckList(currentDeck);
      setDeckText(formattedDeckList);
    }
  }, [currentDeck, artLoadingComplete]);

  const buildPreservedCardsMap = (): Map<string, CardWithMetadata> => {
    const preservedCards = new Map<string, CardWithMetadata>();
    if (currentDeck) {
      currentDeck.cards.forEach((card) => {
        if (card.customImageUrl) {
          preservedCards.set(card.name.toLowerCase(), card);
        }
      });
    }
    return preservedCards;
  };

  const buildInitialCards = (
    preservedCards: Map<string, CardWithMetadata>
  ): CardWithMetadata[] => {
    return deck.cards.map((card) => {
      const preserved = preservedCards.get(card.name.toLowerCase());
      if (preserved) {
        // Preserve custom image and metadata, but update quantity from deck.cards
        return {
          ...preserved,
          quantity: card.quantity,
          requestedSet: card.requestedSet,
          requestedCollectorNumber: card.requestedCollectorNumber,
        };
      }
      return {
        ...card,
        allPrintings: [],
        selectedIndex: 0,
      };
    });
  };

  const createFetchCallbacks = () => {
    const onStartFetch = (index: number) => {
      setLoadingIndex(index);
    };

    const onFetched = (index: number, card: CardWithMetadata) => {
      setCurrentDeck((prevDeck) => {
        if (!prevDeck) {
          return prevDeck;
        }
        const updatedCards = [...prevDeck.cards];
        // Only update if it's not a custom image
        if (!updatedCards[index].customImageUrl) {
          updatedCards[index] = card;
        } else {
          // Update printings and quantity but preserve custom image
          updatedCards[index] = {
            ...updatedCards[index],
            allPrintings: card.allPrintings,
            quantity: card.quantity,
          };
        }
        return {
          ...prevDeck,
          cards: updatedCards,
        };
      });
    };

    return { onStartFetch, onFetched };
  };

  const handleLoadArt = async () => {
    if (deck.numCards === 0) {
      setStatus({ message: "Please paste a card list first!", type: "error" });
      return;
    }

    setIsLoading(true);
    setArtLoadingComplete(false);

    const preservedCards = buildPreservedCardsMap();
    const initialCards = buildInitialCards(preservedCards);

    setCurrentDeck({
      cards: initialCards,
      numCards: deck.numCards,
      numUniqueCards: deck.numUniqueCards,
    });

    try {
      const { onStartFetch, onFetched } = createFetchCallbacks();

      await fetchAllCardMetadata({
        cards: deck.cards,
        onStartFetch,
        onFetched,
      });

      setArtLoadingComplete(true);
    } catch (error) {
      console.error("Error fetching card art:", error);
      setStatus({
        message: "Error fetching card art. Please try again.",
        type: "error",
      });
    } finally {
      setLoadingIndex(null);
      setIsLoading(false);
    }
  };

  return {
    deckText,
    setDeckText,
    currentDeck,
    setCurrentDeck,
    status,
    setStatus,
    isLoading,
    loadingIndex,
    artLoadingComplete,
    handleLoadArt,
  };
}
